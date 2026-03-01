import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { supabase } from '../lib/supabase';
import Groq from 'groq-sdk';

const router = Router();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ─── POST /nutrition/ask ─────────────────────────────────────────
// AI nutrition Q&A, personalised with user profile context
router.post('/ask', requireAuth, async (req: Request, res: Response) => {
  try {
    const { question } = req.body;
    if (!question?.trim()) {
      return res.status(400).json({ error: 'question is required' });
    }

    // Fetch user profile for personalisation
    const { data: profile } = await supabase
      .from('users')
      .select('goal, fitness_level, body_weight, body_height, body_age, available_days, equipment')
      .eq('id', req.user!.id)
      .single();

    const profileCtx = profile
      ? `Profil de l'utilisateur : objectif=${profile.goal ?? 'non défini'}, niveau=${profile.fitness_level ?? 'non défini'}, poids=${profile.body_weight ?? '?'}kg, taille=${profile.body_height ?? '?'}cm, âge=${profile.body_age ?? '?'} ans, jours d'entraînement par semaine=${(profile.available_days ?? []).length}.`
      : '';

    const systemPrompt = `Tu es un nutritionniste sportif expert. Tu donnes des conseils nutritionnels précis, basés sur des preuves scientifiques, adaptés à la pratique de la musculation et du powerbuilding. Tes réponses sont concises (3-5 phrases max), pratiques et en français.
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
    return res.status(500).json({ error: 'AI nutrition failed', detail: err.message });
  }
});

export default router;
