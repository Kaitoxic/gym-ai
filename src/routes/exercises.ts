import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase';

const router = Router();

// GET /exercises â€” paginated, filterable, public
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const { muscle_group, equipment, difficulty, search } = req.query as Record<string, string>;

    let query = supabase
      .from('exercises')
      .select('*', { count: 'exact' });

    if (muscle_group) query = query.contains('muscle_groups', [muscle_group]);
    if (equipment)    query = query.contains('equipment', [equipment]);
    if (difficulty)   query = query.eq('difficulty', difficulty);
    if (search)       query = query.ilike('name', `%${search}%`);

    const from = (page - 1) * limit;
    const to = page * limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      return res.status(500).json({ error: 'Database error', detail: error.message });
    }

    return res.json({ data, total: count ?? 0, page, limit });
  } catch (err: any) {
    return res.status(500).json({ error: 'Unexpected error', detail: err.message });
  }
});

// GET /exercises/:slug â€” single exercise, public
router.get('/:slug', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .eq('slug', req.params.slug)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Exercise not found' });
    }

    return res.json({ data });
  } catch (err: any) {
    return res.status(500).json({ error: 'Unexpected error', detail: err.message });
  }
});

export default router;