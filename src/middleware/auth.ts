import { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';

export const requireAuth: RequestHandler = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing token' });
    return;
  }
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, process.env.SUPABASE_JWT_SECRET!) as {
      sub: string;
      email: string;
    };
    req.user = { id: payload.sub, email: payload.email ?? '' };
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};
