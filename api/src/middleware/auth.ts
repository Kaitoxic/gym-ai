import { RequestHandler } from 'express';
import { supabase } from '../lib/supabase';

/**
 * Verifies the Supabase JWT by calling supabase.auth.getUser(token).
 * Also reads subscription_status from user_metadata (set by Stripe webhook).
 */
export const requireAuth: RequestHandler = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing token' });
    return;
  }
  const token = header.slice(7);
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }
    const status = (user.user_metadata?.subscription_status as 'free' | 'pro') ?? 'free';
    req.user = { id: user.id, email: user.email ?? '', subscription_status: status };
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};
