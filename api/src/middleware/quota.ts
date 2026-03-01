import { RequestHandler } from 'express';
import { supabase } from '../lib/supabase';

const DAILY_LIMIT = 50;

export const checkQuota: RequestHandler = async (req, res, next) => {
  const userId = req.user!.id;
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  try {
    const { data: row, error } = await supabase
      .from('user_quotas')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .maybeSingle();

    if (error) throw error;

    if (!row) {
      // First call today -- insert new row
      await supabase.from('user_quotas').insert({ user_id: userId, date: today, ai_calls: 1 });
      next();
      return;
    }

    if (row.ai_calls >= DAILY_LIMIT) {
      res.status(429).json({ error: 'Daily quota exceeded', limit: DAILY_LIMIT });
      return;
    }

    // NOTE: not atomic -- acceptable for v1 (low concurrency expected)
    await supabase
      .from('user_quotas')
      .update({ ai_calls: row.ai_calls + 1 })
      .eq('user_id', userId)
      .eq('date', today);

    next();
  } catch (err: any) {
    res.status(500).json({ error: 'Quota check failed', detail: err.message });
  }
};
