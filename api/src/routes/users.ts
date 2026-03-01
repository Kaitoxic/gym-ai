import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validateBody';
import { supabase } from '../lib/supabase';

const router = Router();

const upsertProfileSchema = z.object({
  goal: z.enum(['muscle_gain', 'fat_loss', 'endurance', 'general_fitness']).optional(),
  fitness_level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  injury_notes: z.string().max(1000).optional(),
  available_days: z.array(z.number().int().min(0).max(6)).optional(),
  equipment: z.array(z.string()).optional(),
  body_weight: z.number().positive().optional(),
  body_height: z.number().positive().optional(),
  body_age: z.number().int().min(10).max(120).optional(),
  preferred_exercises: z.array(z.string()).optional(),
  onboarding_done: z.boolean().optional(),
});

// GET /users/profile — fetch current user's profile
router.get('/profile', requireAuth, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user!.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = row not found, which is valid for new users
      return next(error);
    }

    res.json({ profile: data ?? null });
  } catch (err) {
    next(err);
  }
});

// POST /users/profile — create or update profile (upsert)
router.post('/profile', requireAuth, validateBody(upsertProfileSchema), async (req, res, next) => {
  try {
    const updates = {
      id: req.user!.id,
      ...req.body,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('users')
      .upsert(updates, { onConflict: 'id' })
      .select()
      .single();

    if (error) return next(error);

    res.json({ profile: data });
  } catch (err) {
    next(err);
  }
});

export default router;
