import { RequestHandler } from 'express';
import { supabase } from '../lib/supabase';

/**
 * Verifies the Supabase JWT by calling supabase.auth.getUser(token).
 * This works with both legacy HS256 secrets AND the new RS256 signing keys,
 * because Supabase handles the verification on their side.
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
    req.user = { id: user.id, email: user.email ?? '' };
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};
