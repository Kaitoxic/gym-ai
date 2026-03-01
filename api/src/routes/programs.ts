import { Router, Request, Response } from 'express';
import Groq from 'groq-sdk';
import { requireAuth } from '../middleware/auth';
import { checkQuota } from '../middleware/quota';
import { supabase } from '../lib/supabase';

const router = Router();

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

/** Maps a goal to set/rep/rest prescription */
function getSetRepScheme(goal: string) {
  switch (goal) {
    case 'muscle_gain':   return { sets: 4, reps: '8-12',  rest: 90,  note: 'Focus on progressive overload — increase weight when you hit the top of the rep range.' };
    case 'fat_loss':      return { sets: 4, reps: '12-15', rest: 60,  note: 'Keep rest short to maintain elevated heart rate.' };
    case 'endurance':     return { sets: 3, reps: '15-20', rest: 45,  note: 'Light weight, high volume, controlled tempo.' };
    default:              return { sets: 3, reps: '10-15', rest: 75,  note: 'Balanced approach — adjust weight to challenge yourself.' };
  }
}

/** Returns the recommended day split name(s) based on days per week */
function getDaySplitGuide(days: number): string {
  if (days <= 2) return '2 Full-Body sessions (Full Body A, Full Body B). Each session hits all major muscle groups.';
  if (days === 3) return '3-day Push / Pull / Legs split.';
  if (days === 4) return '4-day Upper / Lower split (Upper A, Lower A, Upper B, Lower B).';
  if (days === 5) return '5-day Push / Pull / Legs / Upper / Lower split.';
  return '6-day Push / Pull / Legs repeated twice (PPL x2).';
}

/** Push muscles: chest + shoulders + triceps */
const PUSH_MUSCLES = ['chest', 'shoulders', 'triceps'];
/** Pull muscles: back + biceps */
const PULL_MUSCLES = ['back', 'biceps'];
/** Leg muscles */
const LEG_MUSCLES  = ['quads', 'hamstrings', 'glutes', 'calves'];
/** Core */
const CORE_MUSCLES = ['core'];

/** Groups exercises by category */
function groupExercises(exercises: any[]) {
  const push: any[] = [];
  const pull: any[] = [];
  const legs: any[] = [];
  const core: any[] = [];
  const other: any[] = [];

  for (const ex of exercises) {
    const muscles: string[] = ex.muscle_groups ?? [];
    if (muscles.some((m: string) => PUSH_MUSCLES.includes(m)))       push.push(ex);
    else if (muscles.some((m: string) => PULL_MUSCLES.includes(m)))  pull.push(ex);
    else if (muscles.some((m: string) => LEG_MUSCLES.includes(m)))   legs.push(ex);
    else if (muscles.some((m: string) => CORE_MUSCLES.includes(m)))  core.push(ex);
    else other.push(ex);
  }

  return { push, pull, legs, core, other };
}

/** Renders a section of exercises for the catalog block */
function renderCatalogSection(label: string, exs: any[], limit: number): string {
  if (exs.length === 0) return '';
  const items = exs.slice(0, limit)
    .map((e: any) => `  - ${e.slug} | ${e.name} | ${e.difficulty}`)
    .join('\n');
  return `${label}:\n${items}`;
}

// ─── GET /programs ──────────────────────────────────────────────
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
      .select('slug, name, muscle_groups, equipment, difficulty')
      .limit(200);

    if (equipment.length > 0) {
      exercisesQuery = exercisesQuery.overlaps('equipment', equipment);
    }

    const { data: exercises } = await exercisesQuery;
    const allExercises = exercises ?? [];

    const daysPerWeek = profile.available_days?.length ?? 3;
    const weeks       = 4;
    const goal        = profile.goal ?? 'general_fitness';
    const level       = profile.fitness_level ?? 'beginner';
    const scheme      = getSetRepScheme(goal);
    const splitGuide  = getDaySplitGuide(daysPerWeek);
    const { push, pull, legs, core } = groupExercises(allExercises);

    // 3. Build catalog — grouped by category, capped to avoid token overflow
    const catalog = [
      renderCatalogSection('PUSH (chest / shoulders / triceps)', push, 30),
      renderCatalogSection('PULL (back / biceps)',               pull, 25),
      renderCatalogSection('LEGS (quads / hamstrings / glutes / calves)', legs, 25),
      renderCatalogSection('CORE',                               core, 10),
    ].filter(Boolean).join('\n\n');

    // 4. Few-shot example of a single day
    const exampleDay = `{
  "day": 1,
  "name": "Push Day",
  "focus": "chest, shoulders, triceps",
  "exercises": [
    { "slug": "barbell-bench-press", "name": "Barbell Bench Press", "sets": ${scheme.sets}, "reps": "${scheme.reps}", "rest_seconds": ${scheme.rest}, "notes": "Arch back slightly, drive feet into floor" },
    { "slug": "incline-dumbbell-press", "name": "Incline Dumbbell Press", "sets": ${scheme.sets}, "reps": "${scheme.reps}", "rest_seconds": ${scheme.rest}, "notes": "30-45° incline" },
    { "slug": "cable-fly", "name": "Cable Fly", "sets": 3, "reps": "12-15", "rest_seconds": 60, "notes": "Squeeze at peak contraction" },
    { "slug": "overhead-press", "name": "Overhead Press", "sets": ${scheme.sets}, "reps": "${scheme.reps}", "rest_seconds": ${scheme.rest}, "notes": "Full lockout at top" },
    { "slug": "lateral-raise", "name": "Lateral Raise", "sets": 3, "reps": "12-15", "rest_seconds": 60, "notes": "Slight forward lean" },
    { "slug": "tricep-pushdown", "name": "Tricep Pushdown", "sets": 3, "reps": "12-15", "rest_seconds": 60, "notes": "Keep elbows fixed at sides" }
  ]
}`;

    // 5. System prompt
    const systemPrompt = `You are an elite strength and conditioning coach with 20 years of experience. Your task is to generate a complete, high-quality ${weeks}-week workout program as valid JSON.

=== CLIENT PROFILE ===
- Goal: ${goal.replace(/_/g, ' ')}
- Fitness level: ${level}
- Training days per week: ${daysPerWeek}
- Equipment available: ${equipment.length > 0 ? equipment.join(', ') : 'bodyweight only'}
- Body weight: ${profile.body_weight ? profile.body_weight + ' kg' : 'not specified'}
- Injuries/notes: ${profile.injury_notes || 'none'}

=== PRESCRIPTION FOR THIS GOAL (${goal.replace(/_/g, ' ').toUpperCase()}) ===
- Default: ${scheme.sets} sets × ${scheme.reps} reps, ${scheme.rest}s rest
- ${scheme.note}

=== SPLIT RECOMMENDATION ===
Use: ${splitGuide}

=== EXERCISE CATALOG ===
Only use slugs and names EXACTLY as listed below. Do NOT invent exercises.

${catalog}

=== EXAMPLE OF A WELL-STRUCTURED DAY ===
${exampleDay}

=== STRICT RULES — FOLLOW EXACTLY ===
1. EACH DAY MUST HAVE BETWEEN 6 AND 8 EXERCISES. NOT 4. NOT 5. MINIMUM 6.
2. schedule array must contain EXACTLY ${daysPerWeek} day objects.
3. For Push days: include 2-3 chest, 2 shoulder, 1-2 tricep exercises.
4. For Pull days: include 2-3 back, 2 bicep exercises.
5. For Leg days: include 2 quad, 2 hamstring/glute, 1 calf, 1 core exercise.
6. For Full Body days: include at least 1 push, 1 pull, 1 leg, 1 core exercise = minimum 6 total.
7. Use only VALID slugs from the catalog above.
8. Vary exercises between days — do NOT repeat the same exercise on two consecutive days.
9. Adapt difficulty to fitness level: ${level === 'beginner' ? 'prefer beginner/intermediate exercises' : level === 'advanced' ? 'include advanced exercises' : 'mix intermediate exercises'}.

Return ONLY the JSON object. No markdown, no explanation.`;

    // 6. Call Groq with JSON mode
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

    let parsed: any;
    let attempt = 0;

    while (attempt < 2) {
      attempt++;
      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        temperature: 0.3,
        max_tokens: 6000,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Generate a complete ${weeks}-week ${goal.replace(/_/g, ' ')} program for a ${level} with ${daysPerWeek} training days per week. Remember: EACH DAY NEEDS 6-8 EXERCISES.` },
        ],
      });

      const raw = completion.choices[0]?.message?.content ?? '{}';
      try {
        parsed = JSON.parse(raw);
      } catch {
        return res.status(502).json({ error: 'AI returned invalid JSON', raw });
      }

      // Validate: each day must have at least 5 exercises
      const schedule: any[] = parsed.schedule ?? [];
      const tooFew = schedule.some((d: any) => (d.exercises ?? []).length < 5);

      if (!tooFew) break; // Good result — stop

      // If first attempt failed, retry with stronger instruction
      if (attempt === 1) {
        console.warn('[programs] AI returned too few exercises — retrying...');
        continue;
      }
    }

    // 7. Save to Supabase
    const { data: saved, error: saveError } = await supabase
      .from('programs')
      .insert({
        user_id:      req.user!.id,
        name:         parsed.name ?? 'My Program',
        weeks:        parsed.weeks ?? weeks,
        days_per_week: parsed.days_per_week ?? daysPerWeek,
        schedule:     parsed.schedule ?? [],
        notes:        parsed.notes ?? null,
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
