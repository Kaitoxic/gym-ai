import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { supabase } from '../lib/supabase';
import Groq from 'groq-sdk';
import { CARDIO_KNOWLEDGE } from '../lib/knowledge';

const router = Router();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ─── POST /cardio/ask ────────────────────────────────────────────────────────
// AI cardio Q&A, personalised with user profile + methodology knowledge
router.post('/ask', requireAuth, async (req: Request, res: Response) => {
  try {
    const { question } = req.body;
    if (!question?.trim()) {
      return res.status(400).json({ error: 'question is required' });
    }

    // Fetch user profile for personalisation
    const { data: profile } = await supabase
      .from('users')
      .select('goal, fitness_level, body_weight, available_days')
      .eq('id', req.user!.id)
      .single();

    const profileCtx = profile
      ? `Profil de l'utilisateur : objectif=${profile.goal ?? 'non défini'}, niveau=${profile.fitness_level ?? 'non défini'}, poids=${profile.body_weight ?? '?'}kg, jours d'entraînement par semaine=${(profile.available_days ?? []).length}.`
      : '';

    const systemPrompt = `Tu es un coach sportif expert en cardio et conditionnement physique. Tu conseilles sur les méthodes LISS, HIIT et MIIT selon le profil et les objectifs. Tes réponses sont concises (3-5 phrases max), pratiques et en français.

${CARDIO_KNOWLEDGE}

${profileCtx}`;

    const completion = await groq.chat.completions.create({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: question },
      ],
      max_tokens: 600,
      temperature: 0.5,
    });

    const answer = completion.choices[0].message.content ?? '';
    return res.json({ answer });
  } catch (err: any) {
    return res.status(500).json({ error: 'AI cardio failed', detail: err.message });
  }
});

export default router;
