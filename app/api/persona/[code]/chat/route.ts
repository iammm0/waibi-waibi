import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/jwt';
import { connectToDatabase } from '@/lib/db';
import Interaction from '@/model/Interaction';
import { loadPersonaPrompt } from '@/lib/persona-prompts';
import UserPrompt from '@/model/UserPrompt';
import TrainingSample from '@/model/TrainingSample';

const DEFAULT_UPSTREAM_URL = process.env.LLM_BASE_URL ?? 'https://jeniya.cn/v1/chat/completions';
const DEFAULT_API_KEY = process.env.LLM_API_KEY ?? '';
const DEFAULT_MODEL = process.env.LLM_MODEL ?? 'gpt-4o';
const MAX_HISTORY_MESSAGES = 200;
const CONTEXT_WINDOW = 12;

export async function POST(req: NextRequest, context: { params: Promise<{ code: string }> }) {
  const auth = req.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  const payload = token ? verifyAccessToken(token) : null;
  if (!payload) return NextResponse.json({ message: '未授权' }, { status: 401 });

  const body = await req.json();
  const message = body?.message as string;
  const modelFromClient = body?.model as string | undefined;
  if (!message || typeof message !== 'string') {
    return NextResponse.json({ message: '缺少消息内容' }, { status: 400 });
  }

  const { code: rawCode } = await context.params;
  const code = rawCode.toLowerCase();
  const base = loadPersonaPrompt(code) || { system: [] };

  try {
    await connectToDatabase();
  } catch {
    return NextResponse.json({ message: '数据库连接失败' }, { status: 500 });
  }

  const contributed = await UserPrompt.find({ personaCode: code }).sort({ createdAt: 1 }).lean();
  const contributedTexts = contributed.map((c: any) => c.text).filter(Boolean);

  const userTrainingSamples = await TrainingSample.find({
    userId: payload.userId,
    personaCode: code,
  }).sort({ createdAt: 1 }).lean();

  let trainingDataPrompt = '';
  if (userTrainingSamples.length > 0) {
    const trainingExamples = userTrainingSamples.map((sample: any, index: number) => {
      let example = `示例 ${index + 1}:`;
      if (sample.scenario) {
        example += `\n场景: ${sample.scenario}`;
      }
      example += `\n用户输入: ${sample.input}`;
      example += `\n期望回复: ${sample.response}`;
      return example;
    }).join('\n\n');

    trainingDataPrompt = `\n\n以下是用户本人添加的训练数据，请根据这些示例来调整你的回复风格：\n${trainingExamples}`;
  }

  const systemContent = [
    ...(Array.isArray(base.system) ? base.system : []),
    ...contributedTexts,
    trainingDataPrompt,
  ].join('\n').trim();

  if (!DEFAULT_API_KEY) {
    return NextResponse.json({ message: '缺少 LLM_API_KEY' }, { status: 500 });
  }

  const historyDoc = await Interaction.findOne({
    userId: payload.userId,
    personaCode: code,
  }).lean() as any;

  const historyMessages = Array.isArray(historyDoc?.messages)
    ? historyDoc.messages
      .filter((m: any) => m?.role === 'user' || m?.role === 'assistant')
      .slice(-CONTEXT_WINDOW)
      .map((m: any) => ({ role: m.role, content: m.content }))
    : [];

  const model = modelFromClient || DEFAULT_MODEL;

  const upstreamRes = await fetch(DEFAULT_UPSTREAM_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${DEFAULT_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemContent },
        ...historyMessages,
        { role: 'user', content: message },
      ],
      user: `${payload.userId}:${code}`,
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

  const now = new Date();
  const nextMessages = [
    ...(Array.isArray(historyDoc?.messages) ? historyDoc.messages : []),
    { role: 'user', content: message, createdAt: now },
    { role: 'assistant', content: reply, createdAt: new Date() },
  ].slice(-MAX_HISTORY_MESSAGES);

  const doc = await Interaction.findOneAndUpdate(
    { userId: payload.userId, personaCode: code },
    { $set: { messages: nextMessages } },
    { upsert: true, new: true },
  ).lean() as any;

  return NextResponse.json({ reply, interactionId: doc?._id });
}
