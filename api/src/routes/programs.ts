import { Router, Request, Response } from 'express';
import Groq from 'groq-sdk';
import { requireAuth } from '../middleware/auth';
import { checkQuota } from '../middleware/quota';
import { supabase } from '../lib/supabase';

const router = Router();

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

/** Maps a goal to set/rep/rest prescription using Hersovyac methodology */
function getSetRepScheme(goal: string) {
  switch (goal) {
    case 'muscle_gain':
      return {
        setsCompound: 4, setsIsolation: 3,
        repsCompound: '6-10', repsIsolation: '10-15',
        restCompound: 180, restIsolation: 90,
        rirCompound: 'RIR 1-2 (stop 1-2 reps before failure)',
        rirIsolation: 'RIR 0-1 (go to or 1 rep from failure)',
        note: 'Progressive overload: add +0.5 to 1 kg when you complete the top of the rep range with good form.',
      };
    case 'fat_loss':
      return {
        setsCompound: 3, setsIsolation: 3,
        repsCompound: '10-15', repsIsolation: '12-20',
        restCompound: 120, restIsolation: 60,
        rirCompound: 'RIR 1-2',
        rirIsolation: 'RIR 0-1',
        note: 'Higher rep ranges, shorter rest periods to maximize calorie burn while preserving muscle.',
      };
    case 'endurance':
      return {
        setsCompound: 3, setsIsolation: 2,
        repsCompound: '15-20', repsIsolation: '15-20',
        restCompound: 60, restIsolation: 45,
        rirCompound: 'RIR 2-3',
        rirIsolation: 'RIR 1-2',
        note: 'Light to moderate weight, controlled tempo, focus on time under tension.',
      };
    default:
      return {
        setsCompound: 3, setsIsolation: 3,
        repsCompound: '8-12', repsIsolation: '10-15',
        restCompound: 150, restIsolation: 75,
        rirCompound: 'RIR 1-2',
        rirIsolation: 'RIR 0-1',
        note: 'Balanced approach — increase weight when you consistently hit the top of the rep range.',
      };
  }
}

/** Returns the recommended day split name(s) based on days per week — Hersovyac methodology */
function getDaySplitGuide(days: number): string {
  if (days <= 2) return 'Full Body x2 (Full Body A, Full Body B). Each session targets all major muscle groups with 1 compound per pattern.';
  if (days === 3) return 'Push / Pull / Legs (PPL). Day 1: Push, Day 2: Pull, Day 3: Legs.';
  if (days === 4) return 'Upper / Lower split x2 (Upper A, Lower A, Upper B, Lower B). Alternate upper and lower days.';
  if (days === 5) return 'PPL + Upper/Lower hybrid (Push, Pull, Legs, Upper, Lower).';
  return 'Push / Pull / Legs repeated twice per week (PPL x2: Push A, Pull A, Legs A, Push B, Pull B, Legs B).';
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

    // 4. Day structure templates (Hersovyac methodology)
    const dayTemplates = `
PUSH DAY template (6-8 exercises):
  1. Horizontal Push compound (e.g. Bench Press) — ${scheme.setsCompound} sets × ${scheme.repsCompound} reps, ${scheme.restCompound}s rest, ${scheme.rirCompound}
  2. Vertical Push compound (e.g. Overhead Press) — ${scheme.setsCompound} sets × ${scheme.repsCompound} reps, ${scheme.restCompound}s rest, ${scheme.rirCompound}
  3. Horizontal Push variation (e.g. Incline DB Press) — ${scheme.setsCompound} sets × ${scheme.repsCompound} reps, ${scheme.restCompound}s rest, ${scheme.rirCompound}
  4. Shoulder isolation (e.g. Lateral Raise) — ${scheme.setsIsolation} sets × ${scheme.repsIsolation} reps, ${scheme.restIsolation}s rest, ${scheme.rirIsolation}
  5. Shoulder isolation 2 (e.g. Front Raise or Face Pull) — ${scheme.setsIsolation} sets × ${scheme.repsIsolation} reps, ${scheme.restIsolation}s rest, ${scheme.rirIsolation}
  6. Tricep isolation (e.g. Tricep Pushdown) — ${scheme.setsIsolation} sets × ${scheme.repsIsolation} reps, ${scheme.restIsolation}s rest, ${scheme.rirIsolation}
  7. (Optional) Chest isolation (e.g. Cable Fly or Pec Deck) — ${scheme.setsIsolation} sets × ${scheme.repsIsolation} reps, ${scheme.restIsolation}s rest, ${scheme.rirIsolation}

PULL DAY template (5-7 exercises):
  1. Vertical Pull compound (e.g. Pull-Up or Lat Pulldown) — ${scheme.setsCompound} sets × ${scheme.repsCompound} reps, ${scheme.restCompound}s rest, ${scheme.rirCompound}
  2. Horizontal Pull compound (e.g. Barbell Row or Cable Row) — ${scheme.setsCompound} sets × ${scheme.repsCompound} reps, ${scheme.restCompound}s rest, ${scheme.rirCompound}
  3. Vertical Pull variation (e.g. Close-Grip Pulldown) — ${scheme.setsCompound} sets × ${scheme.repsCompound} reps, ${scheme.restCompound}s rest, ${scheme.rirCompound}
  4. Rear Delt isolation (e.g. Reverse Fly or Face Pull) — ${scheme.setsIsolation} sets × ${scheme.repsIsolation} reps, ${scheme.restIsolation}s rest, ${scheme.rirIsolation}
  5. Bicep isolation (e.g. Barbell Curl) — ${scheme.setsIsolation} sets × ${scheme.repsIsolation} reps, ${scheme.restIsolation}s rest, ${scheme.rirIsolation}
  6. (Optional) Bicep isolation 2 (e.g. Hammer Curl or Incline DB Curl) — ${scheme.setsIsolation} sets × ${scheme.repsIsolation} reps, ${scheme.restIsolation}s rest, ${scheme.rirIsolation}

LEGS DAY template (5-7 exercises):
  1. Quad dominant compound (e.g. Squat or Leg Press) — ${scheme.setsCompound} sets × ${scheme.repsCompound} reps, ${scheme.restCompound}s rest, ${scheme.rirCompound}
  2. Hamstring/Glute compound (e.g. Romanian Deadlift or Hip Thrust) — ${scheme.setsCompound} sets × ${scheme.repsCompound} reps, ${scheme.restCompound}s rest, ${scheme.rirCompound}
  3. Quad isolation (e.g. Leg Extension) — ${scheme.setsIsolation} sets × ${scheme.repsIsolation} reps, ${scheme.restIsolation}s rest, ${scheme.rirIsolation}
  4. Hamstring isolation (e.g. Leg Curl) — ${scheme.setsIsolation} sets × ${scheme.repsIsolation} reps, ${scheme.restIsolation}s rest, ${scheme.rirIsolation}
  5. Glute isolation (e.g. Cable Kickback or Glute Bridge) — ${scheme.setsIsolation} sets × ${scheme.repsIsolation} reps, ${scheme.restIsolation}s rest, ${scheme.rirIsolation}
  6. Calf raise — ${scheme.setsIsolation} sets × 12-20 reps, ${scheme.restIsolation}s rest

UPPER DAY template (6 exercises):
  1. Horizontal Push compound — ${scheme.setsCompound} sets × ${scheme.repsCompound} reps, ${scheme.restCompound}s rest, ${scheme.rirCompound}
  2. Horizontal Pull compound — ${scheme.setsCompound} sets × ${scheme.repsCompound} reps, ${scheme.restCompound}s rest, ${scheme.rirCompound}
  3. Vertical Push compound — ${scheme.setsCompound} sets × ${scheme.repsCompound} reps, ${scheme.restCompound}s rest, ${scheme.rirCompound}
  4. Vertical Pull compound — ${scheme.setsCompound} sets × ${scheme.repsCompound} reps, ${scheme.restCompound}s rest, ${scheme.rirCompound}
  5. Tricep isolation — ${scheme.setsIsolation} sets × ${scheme.repsIsolation} reps, ${scheme.restIsolation}s rest, ${scheme.rirIsolation}
  6. Bicep isolation — ${scheme.setsIsolation} sets × ${scheme.repsIsolation} reps, ${scheme.restIsolation}s rest, ${scheme.rirIsolation}

LOWER DAY template (5-6 exercises):
  1. Quad dominant compound — ${scheme.setsCompound} sets × ${scheme.repsCompound} reps, ${scheme.restCompound}s rest, ${scheme.rirCompound}
  2. Hamstring/Glute compound — ${scheme.setsCompound} sets × ${scheme.repsCompound} reps, ${scheme.restCompound}s rest, ${scheme.rirCompound}
  3. Quad isolation — ${scheme.setsIsolation} sets × ${scheme.repsIsolation} reps, ${scheme.restIsolation}s rest, ${scheme.rirIsolation}
  4. Hamstring isolation — ${scheme.setsIsolation} sets × ${scheme.repsIsolation} reps, ${scheme.restIsolation}s rest, ${scheme.rirIsolation}
  5. Calf raise — ${scheme.setsIsolation} sets × 12-20 reps, ${scheme.restIsolation}s rest
  6. (Optional) Core exercise

FULL BODY DAY template (6 exercises):
  1. Leg compound (e.g. Squat or Leg Press) — ${scheme.setsCompound} sets × ${scheme.repsCompound} reps, ${scheme.restCompound}s rest, ${scheme.rirCompound}
  2. Horizontal Pull compound (e.g. Row) — ${scheme.setsCompound} sets × ${scheme.repsCompound} reps, ${scheme.restCompound}s rest, ${scheme.rirCompound}
  3. Horizontal Push compound (e.g. Bench Press or Push-Up) — ${scheme.setsCompound} sets × ${scheme.repsCompound} reps, ${scheme.restCompound}s rest, ${scheme.rirCompound}
  4. Vertical Pull compound (e.g. Lat Pulldown) — ${scheme.setsCompound} sets × ${scheme.repsCompound} reps, ${scheme.restCompound}s rest, ${scheme.rirCompound}
  5. Vertical Push or Hamstring exercise — ${scheme.setsCompound} sets × ${scheme.repsCompound} reps, ${scheme.restCompound}s rest, ${scheme.rirCompound}
  6. Core exercise — ${scheme.setsIsolation} sets × ${scheme.repsIsolation} reps, ${scheme.restIsolation}s rest`;

    // 5. Few-shot example of a single well-structured Push day
    const exampleDay = `{
  "day": 1,
  "name": "Push Day A",
  "focus": "chest, shoulders, triceps",
  "exercises": [
    { "slug": "barbell-bench-press", "name": "Barbell Bench Press", "sets": ${scheme.setsCompound}, "reps": "${scheme.repsCompound}", "rest_seconds": ${scheme.restCompound}, "notes": "Compound. ${scheme.rirCompound}. Arch back slightly, drive feet into floor. Add weight next session when you hit ${scheme.repsCompound.split('-')[1]} reps." },
    { "slug": "overhead-press", "name": "Overhead Press", "sets": ${scheme.setsCompound}, "reps": "${scheme.repsCompound}", "rest_seconds": ${scheme.restCompound}, "notes": "Compound. ${scheme.rirCompound}. Full lockout at top, brace core." },
    { "slug": "incline-dumbbell-press", "name": "Incline Dumbbell Press", "sets": ${scheme.setsCompound}, "reps": "${scheme.repsCompound}", "rest_seconds": ${scheme.restCompound}, "notes": "Compound. ${scheme.rirCompound}. 30-45 degree incline." },
    { "slug": "lateral-raise", "name": "Lateral Raise", "sets": ${scheme.setsIsolation}, "reps": "${scheme.repsIsolation}", "rest_seconds": ${scheme.restIsolation}, "notes": "Isolation. ${scheme.rirIsolation}. Slight forward lean, lead with elbows." },
    { "slug": "face-pull", "name": "Face Pull", "sets": ${scheme.setsIsolation}, "reps": "${scheme.repsIsolation}", "rest_seconds": ${scheme.restIsolation}, "notes": "Isolation. ${scheme.rirIsolation}. External rotation at end, great for shoulder health." },
    { "slug": "tricep-pushdown", "name": "Tricep Pushdown", "sets": ${scheme.setsIsolation}, "reps": "${scheme.repsIsolation}", "rest_seconds": ${scheme.restIsolation}, "notes": "Isolation. ${scheme.rirIsolation}. Keep elbows fixed at sides." },
    { "slug": "cable-fly", "name": "Cable Fly", "sets": ${scheme.setsIsolation}, "reps": "${scheme.repsIsolation}", "rest_seconds": ${scheme.restIsolation}, "notes": "Isolation. ${scheme.rirIsolation}. Squeeze at peak contraction, slight elbow bend." }
  ]
}`;

    // 6. System prompt — Hersovyac methodology
    const systemPrompt = `You are an elite strength and conditioning coach. Generate a complete ${weeks}-week workout program as valid JSON.

=== CLIENT PROFILE ===
- Goal: ${goal.replace(/_/g, ' ')}
- Fitness level: ${level}
- Training days per week: ${daysPerWeek}
- Equipment available: ${equipment.length > 0 ? equipment.join(', ') : 'bodyweight only'}
- Body weight: ${profile.body_weight ? profile.body_weight + ' kg' : 'not specified'}
- Injuries/notes: ${profile.injury_notes || 'none'}

=== SPLIT TO USE ===
${splitGuide}

=== REST TIME RULES ===
- Compound (polyarticular) exercises: ${scheme.restCompound} seconds rest
- Isolation (monoarticular) exercises: ${scheme.restIsolation} seconds rest

=== INTENSITY (RIR — Reps In Reserve) ===
- Compound exercises: ${scheme.rirCompound}
- Isolation exercises: ${scheme.rirIsolation}
- ${scheme.note}

=== SETS PER MUSCLE GROUP PER WEEK ===
Target 10-20 working sets per muscle group per week for optimal hypertrophy.

=== DAY STRUCTURE TEMPLATES ===
${dayTemplates}

=== EXERCISE CATALOG ===
ONLY use slugs and names EXACTLY as listed. Do NOT invent exercises not in this list.

${catalog}

=== EXAMPLE OF A PERFECTLY STRUCTURED DAY ===
${exampleDay}

=== STRICT RULES — VIOLATING ANY RULE IS AN ERROR ===
1. EACH DAY MUST HAVE AT LEAST 6 EXERCISES. NEVER fewer than 6.
2. The schedule array must contain EXACTLY ${daysPerWeek} day objects.
3. Follow the exact day templates above for each day type.
4. Use rest_seconds: ${scheme.restCompound} for compound exercises and ${scheme.restIsolation} for isolation exercises.
5. Every exercise notes field must mention: compound/isolation, RIR target, and a form cue.
6. Use ONLY slugs from the catalog above — never invent new slugs.
7. Vary exercises between days — do NOT repeat the same exercise on consecutive days.
8. Adapt difficulty to level: ${level === 'beginner' ? 'prefer beginner exercises, avoid very technical movements' : level === 'advanced' ? 'include advanced exercises, higher intensity' : 'use intermediate exercises, mix of compound and isolation'}.
9. For ${daysPerWeek >= 6 ? 'PPL x2: differentiate A and B variants (different exercise choices for same day type)' : 'this split: follow the template order strictly'}.

Return ONLY the JSON object with this structure:
{
  "name": "Program name",
  "weeks": ${weeks},
  "days_per_week": ${daysPerWeek},
  "notes": "Brief program overview",
  "schedule": [ ...${daysPerWeek} day objects... ]
}`;

    // 7. Call Groq with JSON mode
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

    let parsed: any;
    let attempt = 0;

    while (attempt < 2) {
      attempt++;
      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        temperature: 0.3,
        max_tokens: 7000,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `Generate a complete ${weeks}-week ${goal.replace(/_/g, ' ')} program for a ${level} with ${daysPerWeek} training days per week. Follow the ${splitGuide.split('(')[0].trim()} structure. REMEMBER: every day needs AT LEAST 6 exercises following the day templates. Use compound exercises with ${scheme.restCompound}s rest and isolation exercises with ${scheme.restIsolation}s rest.`,
          },
        ],
      });

      const raw = completion.choices[0]?.message?.content ?? '{}';
      try {
        parsed = JSON.parse(raw);
      } catch {
        return res.status(502).json({ error: 'AI returned invalid JSON', raw });
      }

      // Validate: each day must have at least 6 exercises
      const schedule: any[] = parsed.schedule ?? [];
      const tooFew = schedule.some((d: any) => (d.exercises ?? []).length < 6);

      if (!tooFew) break; // Good result — stop

      // If first attempt failed, retry with stronger instruction
      if (attempt === 1) {
        console.warn('[programs] AI returned too few exercises — retrying...');
        continue;
      }
    }

    // 8. Save to Supabase
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
