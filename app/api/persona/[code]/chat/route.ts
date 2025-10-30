import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/jwt';
import { connectToDatabase } from '@/lib/db';
import Interaction from '@/model/Interaction';
import { loadPersonaPrompt } from '@/lib/persona-prompts';
import UserPrompt from '@/model/UserPrompt';

const DEFAULT_UPSTREAM_URL = process.env.LLM_BASE_URL ?? 'https://jeniya.cn/v1/chat/completions';
const DEFAULT_API_KEY = process.env.LLM_API_KEY ?? '';
const DEFAULT_MODEL = process.env.LLM_MODEL ?? 'gpt-4o';

function getPersonaApiKey(code: string) {
  const upper = code.toUpperCase();
  return process.env[`LLM_API_KEY_${upper}`] || DEFAULT_API_KEY;
}

export async function POST(req: NextRequest, context: { params: Promise<{ code: string }> }) {
  const auth = req.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  const payload = token ? verifyAccessToken(token) : null;
  if (!payload) return NextResponse.json({ message: '未授权' }, { status: 401 });

  const body = await req.json();
  const message = body?.message as string;
  const modelFromClient = body?.model as string | undefined; // 可选模型名，由客户端指定
  if (!message || typeof message !== 'string') return NextResponse.json({ message: '缺少消息内容' }, { status: 400 });

  const { code: rawCode } = await context.params;
  const code = rawCode.toLowerCase();
  const base = loadPersonaPrompt(code) || { system: [] };

  try {
    await connectToDatabase();
  } catch {
    return NextResponse.json({ message: '数据库连接失败' }, { status: 500 });
  }

  // 汇聚用户贡献的提示词
  const contributed = await UserPrompt.find({ personaCode: code }).sort({ createdAt: 1 }).lean();
  const contributedTexts = contributed.map((c) => c.text).filter(Boolean);

  // 组合 system 指令
  const systemContent = [
    ...(Array.isArray(base.system) ? base.system : []),
    ...contributedTexts,
  ].join('\n');

  const url = DEFAULT_UPSTREAM_URL;
  const key = getPersonaApiKey(code);
  const model = modelFromClient || DEFAULT_MODEL; // 模型可由请求体选择
  if (!key) return NextResponse.json({ message: '缺少 LLM_API_KEY' }, { status: 500 });

  // 调用上游 LLM（OpenAI 兼容）
  const upstreamRes = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemContent },
        { role: 'user', content: message },
      ],
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

  // 持久化交互
  const now = new Date();
  const doc = await Interaction.create({
    userId: payload.userId,
    personaCode: code,
    messages: [
      { role: 'system', content: systemContent, createdAt: now },
      { role: 'user', content: message, createdAt: now },
      { role: 'assistant', content: reply, createdAt: new Date() },
    ],
  });

  return NextResponse.json({ reply, interactionId: doc._id });
}
