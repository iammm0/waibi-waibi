import type { NextRequest } from 'next/server';
import { getPersonaPrompt } from '@/lib/persona';

const UPSTREAM_URL = process.env.LLM_BASE_URL ?? 'https://jeniya.cn/v1/chat/completions';
const API_KEY = process.env.LLM_API_KEY ?? '';
const MODEL = process.env.LLM_MODEL ?? 'gpt-4o';

export async function POST(req: NextRequest) {
  if (!API_KEY) {
    return new Response('Missing LLM_API_KEY', { status: 500 });
  }

  try {
    const body = await req.json();
    const userMessages = (body?.messages ?? []) as Array<{ role: 'user' | 'assistant'; content: string }>;
    const contextId = (body?.contextId as string | undefined)?.trim();

    const messages = [
      { role: 'system', content: getPersonaPrompt() },
      ...userMessages,
    ];

    const upstreamRes = await fetch(UPSTREAM_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        user: contextId || 'public-anonymous',
        temperature: 0.8,
        stream: false,
      }),
    });

    if (!upstreamRes.ok) {
      const text = await upstreamRes.text();
      return new Response(text || 'Upstream error', { status: upstreamRes.status });
    }

    const json = await upstreamRes.json();
    const reply =
      json?.choices?.[0]?.message?.content ??
      json?.output_text ??
      json?.reply ??
      '';

    return Response.json({ reply });
  } catch (e: any) {
    return new Response(e?.message || 'Bad Request', { status: 400 });
  }
}
