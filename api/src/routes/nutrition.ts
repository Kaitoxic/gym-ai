import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { supabase } from '../lib/supabase';
import Groq from 'groq-sdk';
import { NUTRITION_KNOWLEDGE } from '../lib/knowledge';

const router = Router();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const TOPIC = 'nutrition';
const HISTORY_LIMIT = 50;
const CONTEXT_LIMIT = 10;

// ─── GET /nutrition/history ──────────────────────────────────────────────────
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

// ─── DELETE /nutrition/history ───────────────────────────────────────────────
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

// ─── POST /nutrition/ask ─────────────────────────────────────────────────────
router.post('/ask', requireAuth, async (req: Request, res: Response) => {
  try {
    const { question, coaching_style, detail_level } = req.body;
    if (!question?.trim()) {
      return res.status(400).json({ error: 'question is required' });
    }

    // Build coaching style modifier
    const styleMap: Record<string, string> = {
      strict: "Adopte le ton d'un coach strict et exigeant, sans fioritures. Va droit au but, comme un coach militaire.",
      motivating: "Adopte le ton d'un coach bienveillant et motivant. Encourage l'utilisateur tout en restant factuel.",
      scientific: "Adopte un ton scientifique et analytique. Base tes conseils sur des mécanismes physiologiques et des données.",
    };
    const detailMap: Record<string, string> = {
      short: "Tes réponses sont courtes et concises (3-5 phrases maximum).",
      detailed: "Tes réponses sont détaillées et complètes (2-3 paragraphes), avec des exemples pratiques.",
    };
    const styleStr = styleMap[coaching_style ?? 'motivating'] ?? styleMap.motivating;
    const detailStr = detailMap[detail_level ?? 'short'] ?? detailMap.short;
    const styleModifier = `${styleStr} ${detailStr}`;

    // Fetch user profile
    const { data: profile } = await supabase
      .from('users')
      .select('goal, fitness_level, body_weight, body_height, body_age, available_days, equipment')
      .eq('id', req.user!.id)
      .single();

    const profileCtx = profile
      ? `Profil de l'utilisateur : objectif=${profile.goal ?? 'non défini'}, niveau=${profile.fitness_level ?? 'non défini'}, poids=${profile.body_weight ?? '?'}kg, taille=${profile.body_height ?? '?'}cm, âge=${profile.body_age ?? '?'} ans, jours d'entraînement par semaine=${(profile.available_days ?? []).length}.`
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

    const systemPrompt = `Tu es un nutritionniste sportif expert. Tu donnes des conseils nutritionnels précis, basés sur des preuves scientifiques, adaptés à la pratique de la musculation et du powerbuilding. Tes réponses sont en français.

${styleModifier}

${NUTRITION_KNOWLEDGE}

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

    // Persist both messages (user then AI) — isolated per user_id
    await supabase.from('chat_messages').insert([
      { user_id: req.user!.id, topic: TOPIC, role: 'user', content: question },
      { user_id: req.user!.id, topic: TOPIC, role: 'ai', content: answer },
    ]);

    return res.json({ answer });
  } catch (err: any) {
    return res.status(500).json({ error: 'AI nutrition failed', detail: err.message });
  }
});

export default router;
