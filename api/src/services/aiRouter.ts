import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';

export type Provider = 'openrouter' | 'openai' | 'gemini' | 'groq';

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// Clients instantiated inside callAI so missing env vars fail at call time, not import time

async function callOpenRouter(model: string, messages: Message[]): Promise<string> {
  const client = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY!,
    baseURL: 'https://openrouter.ai/api/v1',
  });
  const res = await client.chat.completions.create({ model, messages });
  return res.choices[0]?.message?.content ?? '';
}

async function callOpenAI(model: string, messages: Message[]): Promise<string> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
  const res = await client.chat.completions.create({ model, messages });
  return res.choices[0]?.message?.content ?? '';
}

async function callGemini(model: string, messages: Message[]): Promise<string> {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
  const gemModel = genAI.getGenerativeModel({ model });

  // Convert OpenAI-style messages to Gemini history format
  const history = messages
    .slice(0, -1)
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role === 'assistant' ? ('model' as const) : ('user' as const),
      parts: [{ text: m.content }],
    }));

  const lastMessage = messages[messages.length - 1];
  const chat = gemModel.startChat({ history });
  const result = await chat.sendMessage(lastMessage.content);
  return result.response.text();
}

async function callGroq(model: string, messages: Message[]): Promise<string> {
  const client = new Groq({ apiKey: process.env.GROQ_API_KEY! });
  const res = await client.chat.completions.create({
    model,
    messages,
    temperature: 0.7,
    max_tokens: 4096,
  });
  return res.choices[0]?.message?.content ?? '';
}

export async function callAI(
  provider: Provider,
  model: string,
  messages: Message[]
): Promise<string> {
  switch (provider) {
    case 'openrouter': return callOpenRouter(model, messages);
    case 'openai':     return callOpenAI(model, messages);
    case 'gemini':     return callGemini(model, messages);
    case 'groq':       return callGroq(model, messages);
    default:
      throw new Error('Unsupported provider: ' + provider);
  }
}
