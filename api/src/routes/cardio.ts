import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { supabase } from '../lib/supabase';
import Groq from 'groq-sdk';
import { CARDIO_KNOWLEDGE } from '../lib/knowledge';

const router = Router();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const TOPIC = 'cardio';
const HISTORY_LIMIT = 50;
const CONTEXT_LIMIT = 10;

// ─── GET /cardio/history ─────────────────────────────────────────────────────
router.get('/history', requireAuth, async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('id, role, content, created_at')
      .eq('user_id', req.user!.id)
      .eq('topic', TOPIC)
      .order('created_at', { ascending: true })
      .limit(HISTORY_LIMIT);

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ messages: data ?? [] });
  } catch (err: any) {
    return res.status(500).json({ error: 'fetch history failed', detail: err.message });
  }
});

// ─── DELETE /cardio/history ──────────────────────────────────────────────────
router.delete('/history', requireAuth, async (req: Request, res: Response) => {
  try {
    const { error } = await supabase
      .from('chat_messages')
      .delete()
      .eq('user_id', req.user!.id)
      .eq('topic', TOPIC);

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ ok: true });
  } catch (err: any) {
    return res.status(500).json({ error: 'clear history failed', detail: err.message });
  }
});

// ─── POST /cardio/ask ────────────────────────────────────────────────────────
router.post('/ask', requireAuth, async (req: Request, res: Response) => {
  try {
    const { question } = req.body;
    if (!question?.trim()) {
      return res.status(400).json({ error: 'question is required' });
    }

    // Fetch user profile
    const { data: profile } = await supabase
      .from('users')
      .select('goal, fitness_level, body_weight, available_days')
      .eq('id', req.user!.id)
      .single();

    const profileCtx = profile
      ? `Profil de l'utilisateur : objectif=${profile.goal ?? 'non défini'}, niveau=${profile.fitness_level ?? 'non défini'}, poids=${profile.body_weight ?? '?'}kg, jours d'entraînement par semaine=${(profile.available_days ?? []).length}.`
      : '';

    // Fetch last N messages for Groq context (user-specific)
    const { data: historyRows } = await supabase
      .from('chat_messages')
      .select('role, content')
      .eq('user_id', req.user!.id)
      .eq('topic', TOPIC)
      .order('created_at', { ascending: false })
      .limit(CONTEXT_LIMIT);

    const contextMessages: { role: 'user' | 'assistant'; content: string }[] =
      (historyRows ?? []).reverse().map((m) => ({
        role: m.role === 'user' ? 'user' : ('assistant' as const),
        content: m.content,
      }));

    const systemPrompt = `Tu es un coach sportif expert en cardio et conditionnement physique. Tu conseilles sur les méthodes LISS, HIIT et MIIT selon le profil et les objectifs. Tes réponses sont concises (3-5 phrases max), pratiques et en français.

${CARDIO_KNOWLEDGE}

${profileCtx}`;

    const completion = await groq.chat.completions.create({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      messages: [
        { role: 'system', content: systemPrompt },
        ...contextMessages,
        { role: 'user', content: question },
      ],
      max_tokens: 600,
      temperature: 0.5,
    });

    const answer = completion.choices[0].message.content ?? '';

    // Persist both messages — isolated per user_id
    await supabase.from('chat_messages').insert([
      { user_id: req.user!.id, topic: TOPIC, role: 'user', content: question },
      { user_id: req.user!.id, topic: TOPIC, role: 'ai', content: answer },
    ]);

    return res.json({ answer });
  } catch (err: any) {
    return res.status(500).json({ error: 'AI cardio failed', detail: err.message });
  }
});

export default router;
