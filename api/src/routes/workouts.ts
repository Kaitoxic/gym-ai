import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { checkQuota } from '../middleware/quota';
import { supabase } from '../lib/supabase';
import Groq from 'groq-sdk';

const router = Router();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ─── POST /workouts/log ──────────────────────────────────────────
// Log a completed workout session
router.post('/log', requireAuth, async (req: Request, res: Response) => {
  try {
    const {
      program_id,
      day_number,
      day_name,
      sets_done,
      duration_seconds,
    } = req.body;

    if (day_number === undefined || !day_name) {
      return res.status(400).json({ error: 'day_number and day_name are required' });
    }

    const { data, error } = await supabase
      .from('workout_logs')
      .insert({
        user_id: req.user!.id,
        program_id: program_id ?? null,
        day_number,
        day_name,
        sets_done: sets_done ?? [],
        duration_seconds: duration_seconds ?? null,
      })
      .select()
      .single();

    if (error) return res.status(500).json({ error: 'Failed to log workout', detail: error.message });
    return res.status(201).json({ data });
  } catch (err: any) {
    return res.status(500).json({ error: 'Unexpected error', detail: err.message });
  }
});

// ─── GET /workouts/history ───────────────────────────────────────
// Get recent workout history (last 30)
router.get('/history', requireAuth, async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('workout_logs')
      .select('id, program_id, day_number, day_name, sets_done, duration_seconds, completed_at')
      .eq('user_id', req.user!.id)
      .order('completed_at', { ascending: false })
      .limit(30);

    if (error) return res.status(500).json({ error: 'Database error', detail: error.message });
    return res.json({ data });
  } catch (err: any) {
    return res.status(500).json({ error: 'Unexpected error', detail: err.message });
  }
});

// ─── GET /workouts/streak ────────────────────────────────────────
// Returns current streak (consecutive days with at least 1 workout)
router.get('/streak', requireAuth, async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('workout_logs')
      .select('completed_at')
      .eq('user_id', req.user!.id)
      .order('completed_at', { ascending: false })
      .limit(60);

    if (error) return res.status(500).json({ error: 'Database error', detail: error.message });

    // Compute streak: count consecutive calendar days (today included)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Collect unique dates (YYYY-MM-DD)
    const uniqueDays = new Set<string>(
      (data ?? []).map((row: any) => {
        const d = new Date(row.completed_at);
        return d.toISOString().slice(0, 10);
      })
    );

    let streak = 0;
    const cursor = new Date(today);
    while (true) {
      const key = cursor.toISOString().slice(0, 10);
      if (uniqueDays.has(key)) {
        streak++;
        cursor.setDate(cursor.getDate() - 1);
      } else {
        // Allow today to be missing (not yet worked out today)
        if (streak === 0) {
          cursor.setDate(cursor.getDate() - 1);
          const key2 = cursor.toISOString().slice(0, 10);
          if (uniqueDays.has(key2)) {
            streak++;
            cursor.setDate(cursor.getDate() - 1);
            continue;
          }
        }
        break;
      }
    }

    return res.json({ streak });
  } catch (err: any) {
    return res.status(500).json({ error: 'Unexpected error', detail: err.message });
  }
});

// ─── POST /workouts/adapt ────────────────────────────────────────
// AI suggestions for next session based on completed workout
router.post('/adapt', requireAuth, checkQuota, async (req: Request, res: Response) => {
  try {
    const { day_name, sets_done, coaching_style, detail_level } = req.body;
    if (!day_name || !Array.isArray(sets_done)) {
      return res.status(400).json({ error: 'day_name and sets_done are required' });
    }
    if (sets_done.length > 50) {
      return res.status(400).json({ error: 'sets_done too large (max 50 sets)' });
    }

    // Build coaching style modifier
    const styleMap: Record<string, string> = {
      strict: "Adopte le ton d'un coach strict et exigeant, sans fioritures. Va droit au but, comme un coach militaire.",
      motivating: "Adopte le ton d'un coach bienveillant et motivant. Encourage l'utilisateur tout en restant factuel.",
      scientific: "Adopte un ton scientifique et analytique. Base tes conseils sur des mécanismes physiologiques et des données.",
    };
    const detailMap: Record<string, string> = {
      short: "Tes rationales sont courtes et concises (1-2 phrases maximum).",
      detailed: "Tes rationales sont détaillées (2-3 phrases), avec une explication physiologique.",
    };
    const styleStr = styleMap[coaching_style ?? 'motivating'] ?? styleMap.motivating;
    const detailStr = detailMap[detail_level ?? 'short'] ?? detailMap.short;
    const styleModifier = `${styleStr} ${detailStr}`;

    // Summarize by exercise
    const exMap = new Map<string, { name: string; slug: string; done: any[]; total: number }>();
    for (const s of sets_done) {
      if (!exMap.has(s.exercise_slug)) {
        exMap.set(s.exercise_slug, { name: s.exercise_name, slug: s.exercise_slug, done: [], total: 0 });
      }
      const entry = exMap.get(s.exercise_slug)!;
      entry.total++;
      if (s.completed) entry.done.push(s);
    }

    const summary = Array.from(exMap.values()).map((ex) => {
      const withWeight = ex.done.filter((s) => s.weight_kg != null && s.weight_kg > 0);
      const avgWeight = withWeight.length > 0
        ? Math.round(withWeight.reduce((sum: number, s: any) => sum + s.weight_kg, 0) / withWeight.length * 10) / 10
        : null;
      const avgReps = ex.done.length > 0
        ? Math.round(ex.done.reduce((sum: number, s: any) => sum + s.reps_done, 0) / ex.done.length)
        : 0;
      return { exercise_name: ex.name, exercise_slug: ex.slug, sets_completed: ex.done.length, sets_total: ex.total, avg_weight_kg: avgWeight, avg_reps: avgReps };
    });

    const prompt = `Tu es un coach sportif expert en powerbuilding (méthode Hersovyac/LouisPowerBuild). ${styleModifier}
L'utilisateur vient de terminer une séance "${day_name}".

Exercices réalisés :
${summary.map((e) => `- ${e.exercise_name}: ${e.sets_completed}/${e.sets_total} séries${e.avg_weight_kg != null ? `, poids moyen ${e.avg_weight_kg}kg` : ' (poids de corps)'}, reps moyennes ${e.avg_reps}`).join('\n')}

Pour chaque exercice, propose un ajustement pour la PROCHAINE séance :
- Toutes séries complétées avec poids → augmenter le poids (composé +2.5-5kg, isolation +1-2.5kg)
- Moins de 80% des séries complétées → maintenir
- 1 seule série ou moins → décharge (-10% du poids)
- Poids de corps → augmenter les reps

Réponds uniquement en JSON :
{
  "suggestions": [
    {
      "exercise_name": "...",
      "exercise_slug": "...",
      "current_weight_kg": number|null,
      "current_reps_done": number,
      "sets_completed": number,
      "sets_total": number,
      "action": "increase_weight"|"increase_reps"|"maintain"|"deload",
      "new_weight_kg": number|null,
      "new_reps": "8-10",
      "rationale": "explication courte en français"
    }
  ]
}`;

    const completion = await groq.chat.completions.create({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 2000,
      temperature: 0.4,
    });

    const parsed = JSON.parse(completion.choices[0].message.content ?? '{}');
    return res.json({ suggestions: parsed.suggestions ?? [] });
  } catch (err: any) {
    return res.status(500).json({ error: 'AI adaptation failed', detail: err.message });
  }
});

export default router;
