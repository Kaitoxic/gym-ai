import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { supabase } from '../lib/supabase';
import Groq from 'groq-sdk';
import { NUTRITION_KNOWLEDGE, CARDIO_KNOWLEDGE, WORKOUT_KNOWLEDGE } from '../lib/knowledge';

const router = Router();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const CONTEXT_LIMIT = 10;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildStyleModifier(coaching_style?: string, detail_level?: string): string {
  const styleMap: Record<string, string> = {
    strict: "Adopte le ton d'un coach strict et exigeant, sans fioritures. Va droit au but, comme un coach militaire.",
    motivating: "Adopte le ton d'un coach bienveillant et motivant. Encourage l'utilisateur tout en restant factuel.",
    scientific: "Adopte un ton scientifique et analytique. Base tes conseils sur des mécanismes physiologiques et des données.",
  };
  const detailMap: Record<string, string> = {
    short: "Tes réponses sont courtes et concises (3-5 phrases maximum).",
    detailed: "Tes réponses sont détaillées et complètes (2-3 paragraphes), avec des exemples pratiques.",
  };
  return `${styleMap[coaching_style ?? 'motivating'] ?? styleMap.motivating} ${detailMap[detail_level ?? 'short'] ?? detailMap.short}`;
}

// ─── GET /chat/conversations ──────────────────────────────────────────────────
router.get('/conversations', requireAuth, async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select('id, title, created_at, updated_at')
      .eq('user_id', req.user!.id)
      .order('updated_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });

    // Add last message preview
    const convIds = (data ?? []).map((c) => c.id);
    let previews: Record<string, string> = {};
    if (convIds.length > 0) {
      const { data: lastMsgs } = await supabase
        .from('chat_messages')
        .select('conversation_id, content, role')
        .in('conversation_id', convIds)
        .eq('role', 'ai')
        .order('created_at', { ascending: false });

      if (lastMsgs) {
        for (const msg of lastMsgs) {
          if (msg.conversation_id && !previews[msg.conversation_id]) {
            previews[msg.conversation_id] = msg.content.slice(0, 80);
          }
        }
      }
    }

    const result = (data ?? []).map((c) => ({
      ...c,
      preview: previews[c.id] ?? null,
    }));

    return res.json({ conversations: result });
  } catch (err: any) {
    return res.status(500).json({ error: 'fetch conversations failed', detail: err.message });
  }
});

// ─── POST /chat/conversations ─────────────────────────────────────────────────
router.post('/conversations', requireAuth, async (req: Request, res: Response) => {
  try {
    const { title } = req.body;
    const { data, error } = await supabase
      .from('conversations')
      .insert({ user_id: req.user!.id, title: title ?? 'Nouvelle conversation' })
      .select('id, title, created_at, updated_at')
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  } catch (err: any) {
    return res.status(500).json({ error: 'create conversation failed', detail: err.message });
  }
});

// ─── DELETE /chat/conversations/:id ──────────────────────────────────────────
router.delete('/conversations/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user!.id);

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ ok: true });
  } catch (err: any) {
    return res.status(500).json({ error: 'delete conversation failed', detail: err.message });
  }
});

// ─── PATCH /chat/conversations/:id/title ─────────────────────────────────────
router.patch('/conversations/:id/title', requireAuth, async (req: Request, res: Response) => {
  try {
    const { title } = req.body;
    if (!title?.trim()) return res.status(400).json({ error: 'title required' });
    const { error } = await supabase
      .from('conversations')
      .update({ title: title.trim(), updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .eq('user_id', req.user!.id);

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ ok: true });
  } catch (err: any) {
    return res.status(500).json({ error: 'rename conversation failed', detail: err.message });
  }
});

// ─── GET /chat/conversations/:id/messages ────────────────────────────────────
router.get('/conversations/:id/messages', requireAuth, async (req: Request, res: Response) => {
  try {
    // Verify ownership
    const { data: conv } = await supabase
      .from('conversations')
      .select('id')
      .eq('id', req.params.id)
      .eq('user_id', req.user!.id)
      .single();
    if (!conv) return res.status(404).json({ error: 'conversation not found' });

    const { data, error } = await supabase
      .from('chat_messages')
      .select('id, role, content, created_at')
      .eq('conversation_id', req.params.id)
      .order('created_at', { ascending: true });

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ messages: data ?? [] });
  } catch (err: any) {
    return res.status(500).json({ error: 'fetch messages failed', detail: err.message });
  }
});

// ─── POST /chat/ask ───────────────────────────────────────────────────────────
router.post('/ask', requireAuth, async (req: Request, res: Response) => {
  try {
    const { question, conversation_id, coaching_style, detail_level } = req.body;
    if (!question?.trim()) return res.status(400).json({ error: 'question is required' });
    if (!conversation_id) return res.status(400).json({ error: 'conversation_id is required' });

    // Verify ownership
    const { data: conv } = await supabase
      .from('conversations')
      .select('id, title')
      .eq('id', conversation_id)
      .eq('user_id', req.user!.id)
      .single();
    if (!conv) return res.status(404).json({ error: 'conversation not found' });

    const styleModifier = buildStyleModifier(coaching_style, detail_level);

    // Fetch user profile
    const { data: profile } = await supabase
      .from('users')
      .select('goal, fitness_level, body_weight, body_height, body_age, available_days, equipment')
      .eq('id', req.user!.id)
      .single();

    const profileCtx = profile
      ? `Profil : objectif=${profile.goal ?? '?'}, niveau=${profile.fitness_level ?? '?'}, poids=${profile.body_weight ?? '?'}kg, taille=${profile.body_height ?? '?'}cm, âge=${profile.body_age ?? '?'} ans, ${(profile.available_days ?? []).length}j/semaine, équipement=[${(profile.equipment ?? []).join(', ')}].`
      : '';

    // Fetch last N messages for Groq context
    const { data: historyRows } = await supabase
      .from('chat_messages')
      .select('role, content')
      .eq('conversation_id', conversation_id)
      .order('created_at', { ascending: false })
      .limit(CONTEXT_LIMIT);

    const contextMessages: { role: 'user' | 'assistant'; content: string }[] =
      (historyRows ?? []).reverse().map((m) => ({
        role: m.role === 'user' ? 'user' : ('assistant' as const),
        content: m.content,
      }));

    const systemPrompt = `Tu es un coach sportif expert, polyvalent, maîtrisant la musculation, le cardio et la nutrition sportive. Tes réponses sont en français.

${styleModifier}

${WORKOUT_KNOWLEDGE}

${CARDIO_KNOWLEDGE}

${NUTRITION_KNOWLEDGE}

${profileCtx}`;

    const completion = await groq.chat.completions.create({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      messages: [
        { role: 'system', content: systemPrompt },
        ...contextMessages,
        { role: 'user', content: question },
      ],
      max_tokens: 700,
      temperature: 0.5,
    });

    const answer = completion.choices[0].message.content ?? '';

    // Persist messages
    await supabase.from('chat_messages').insert([
      { user_id: req.user!.id, topic: 'general', conversation_id, role: 'user', content: question },
      { user_id: req.user!.id, topic: 'general', conversation_id, role: 'ai', content: answer },
    ]);

    // Auto-generate title from first question (if still default)
    if (conv.title === 'Nouvelle conversation') {
      const autoTitle = question.trim().slice(0, 50) + (question.trim().length > 50 ? '…' : '');
      await supabase
        .from('conversations')
        .update({ title: autoTitle, updated_at: new Date().toISOString() })
        .eq('id', conversation_id);
    } else {
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversation_id);
    }

    return res.json({ answer });
  } catch (err: any) {
    return res.status(500).json({ error: 'AI chat failed', detail: err.message });
  }
});

// ─── Legacy endpoints (nutrition/cardio compatibility) ───────────────────────
// Keep existing /chat/history and /chat/clear for backward compat if needed
router.get('/history', requireAuth, async (req: Request, res: Response) => {
  return res.json({ messages: [] });
});
router.delete('/history', requireAuth, async (_req: Request, res: Response) => {
  return res.json({ ok: true });
});

export default router;
