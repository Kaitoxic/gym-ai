import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { checkQuota } from '../middleware/quota';
import { supabase } from '../lib/supabase';
import { callAI } from '../services/aiRouter';

const router = Router();

// ─── GET /programs ──────────────────────────────────────────────
// Returns all programs for the authenticated user (most recent first)
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('programs')
      .select('id, name, weeks, days_per_week, notes, created_at')
      .eq('user_id', req.user!.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) return res.status(500).json({ error: 'Database error', detail: error.message });
    return res.json({ data });
  } catch (err: any) {
    return res.status(500).json({ error: 'Unexpected error', detail: err.message });
  }
});

// ─── GET /programs/:id ──────────────────────────────────────────
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('programs')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user!.id)
      .single();

    if (error || !data) return res.status(404).json({ error: 'Program not found' });
    return res.json({ data });
  } catch (err: any) {
    return res.status(500).json({ error: 'Unexpected error', detail: err.message });
  }
});

// ─── POST /programs/generate ─────────────────────────────────────
router.post('/generate', requireAuth, checkQuota, async (req: Request, res: Response) => {
  try {
    // 1. Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user!.id)
      .single();

    if (profileError || !profile) {
      return res.status(400).json({ error: 'Profile not found. Complete onboarding first.' });
    }

    // 2. Fetch exercises filtered by user's equipment
    const equipment: string[] = profile.equipment ?? [];
    let exercisesQuery = supabase
      .from('exercises')
      .select('slug, name, muscle_groups, equipment, difficulty, instructions')
      .limit(150);

    if (equipment.length > 0) {
      exercisesQuery = exercisesQuery.overlaps('equipment', equipment);
    }

    const { data: exercises } = await exercisesQuery;

    // 3. Build the prompt
    const daysPerWeek = profile.available_days?.length ?? 3;
    const weeks = 4;

    const profileSummary = `
- Goal: ${profile.goal ?? 'general_fitness'}
- Fitness level: ${profile.fitness_level ?? 'beginner'}
- Training days per week: ${daysPerWeek}
- Available equipment: ${equipment.length > 0 ? equipment.join(', ') : 'bodyweight only'}
- Body weight: ${profile.body_weight ? profile.body_weight + ' kg' : 'not specified'}
- Injuries / notes: ${profile.injury_notes || 'none'}
- Preferred exercises: ${profile.preferred_exercises?.join(', ') || 'none'}`.trim();

    const exerciseCatalog = (exercises ?? [])
      .map((e: any) =>
        `${e.slug} | ${e.name} | muscles: ${e.muscle_groups.join(',')} | equip: ${e.equipment.join(',')} | ${e.difficulty}`
      )
      .join('\n');

    const systemPrompt = `You are an expert strength and conditioning coach. Generate a structured ${weeks}-week workout program.

IMPORTANT: Respond ONLY with valid JSON — no markdown, no explanation, no extra text.

User profile:
${profileSummary}

Available exercises (slug | name | muscles | equipment | difficulty):
${exerciseCatalog}

JSON schema to follow exactly:
{
  "name": "string (creative program name)",
  "weeks": ${weeks},
  "days_per_week": ${daysPerWeek},
  "notes": "string (general tips for this program)",
  "schedule": [
    {
      "day": 1,
      "name": "string (e.g. Push Day, Full Body A)",
      "focus": "string (main muscle groups)",
      "exercises": [
        {
          "slug": "exercise-slug-from-catalog",
          "name": "Exercise Name",
          "sets": 3,
          "reps": "8-12",
          "rest_seconds": 90,
          "notes": "optional coaching cue"
        }
      ]
    }
  ]
}

Rules:
- schedule must have exactly ${daysPerWeek} day entries
- Each day should have 4-7 exercises
- Only use exercises from the catalog above
- Respect injuries and fitness level
- Balance muscle groups across the week`;

    // 4. Call Groq
    const raw = await callAI('groq', 'llama-3.3-70b-versatile', [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: 'Generate my workout program.' },
    ]);

    // 5. Parse JSON (strip markdown code blocks if present)
    let parsed: any;
    try {
      const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
      parsed = JSON.parse(cleaned);
    } catch {
      return res.status(502).json({ error: 'AI returned invalid JSON', raw });
    }

    // 6. Save to Supabase
    const { data: saved, error: saveError } = await supabase
      .from('programs')
      .insert({
        user_id: req.user!.id,
        name: parsed.name ?? 'My Program',
        weeks: parsed.weeks ?? weeks,
        days_per_week: parsed.days_per_week ?? daysPerWeek,
        schedule: parsed.schedule ?? [],
        notes: parsed.notes ?? null,
      })
      .select()
      .single();

    if (saveError) {
      return res.status(500).json({ error: 'Failed to save program', detail: saveError.message });
    }

    return res.json({ data: saved });
  } catch (err: any) {
    return res.status(500).json({ error: 'Unexpected error', detail: err.message });
  }
});

// ─── DELETE /programs/:id ────────────────────────────────────────
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { error } = await supabase
      .from('programs')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user!.id);

    if (error) return res.status(500).json({ error: 'Delete failed', detail: error.message });
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: 'Unexpected error', detail: err.message });
  }
});

export default router;
