import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { supabase } from '../lib/supabase';

const router = Router();

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

export default router;
