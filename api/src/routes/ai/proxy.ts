import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../middleware/auth';
import { checkQuota } from '../../middleware/quota';
import { validateBody } from '../../middleware/validateBody';
import { callAI } from '../../services/aiRouter';

const router = Router();

const ProxySchema = z.object({
  provider: z.enum(['openrouter', 'openai', 'gemini', 'groq']),
  model: z.string().min(1),
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant', 'system']),
        content: z.string(),
      })
    )
    .min(1),
});

router.post('/', requireAuth, checkQuota, validateBody(ProxySchema), async (req, res) => {
  try {
    const { provider, model, messages } = req.body;
    const result = await callAI(provider, model, messages);
    res.json({ result });
  } catch (err: any) {
    res.status(502).json({ error: 'AI provider error', detail: err.message });
  }
});

export default router;
