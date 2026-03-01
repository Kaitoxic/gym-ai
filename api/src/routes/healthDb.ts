import { Router } from 'express';
import { supabase } from '../lib/supabase';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    // Lightweight ping: select 1 row from user_quotas (empty table is fine)
    const { error } = await supabase.from('user_quotas').select('id').limit(1);
    if (error) {
      res.status(503).json({ db: 'error', message: error.message });
      return;
    }
    res.json({ db: 'ok' });
  } catch (err: any) {
    res.status(503).json({ db: 'error', message: err.message });
  }
});

export default router;
