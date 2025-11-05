import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/jwt';
import { connectToDatabase } from '@/lib/db';
import { loadPersonaPrompt } from '@/lib/persona-prompts';
import UserPrompt from '@/model/UserPrompt';
import TrainingSample from '@/model/TrainingSample';

const DEFAULT_UPSTREAM_URL = process.env.LLM_BASE_URL ?? 'https://jeniya.cn/v1/chat/completions';
const DEFAULT_API_KEY = process.env.LLM_API_KEY ?? '';
const DEFAULT_MODEL = process.env.LLM_MODEL ?? 'gpt-4o';

// 预设的模型列表（与前端保持一致）
const ALLOWED_MODELS = [
  'gpt-4o-mini',
  'gpt-4.1-nano',
  'gpt-4.1-mini',
  'deepseek-v3.1',
  'deepseek-chat',
  'qwen-turbo',
  'mistral-small-latest',
  'llama-3-8b',
  'glm-4.5-flash',
];

function getPersonaApiKey(code: string) {
  const upper = code.toUpperCase();
  return process.env[`LLM_API_KEY_${upper}`] || DEFAULT_API_KEY;
}

/**
 * 预览训练效果（不持久化）
 */
export async function POST(req: NextRequest, context: { params: Promise<{ code: string }> }) {
  const auth = req.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  const payload = token ? verifyAccessToken(token) : null;
  if (!payload) return NextResponse.json({ message: '未授权' }, { status: 401 });

  const body = await req.json();
  const message = body?.message as string;
  const modelFromClient = body?.model as string | undefined;
  
  if (!message) {
    return NextResponse.json({ message: '缺少消息内容' }, { status: 400 });
  }

  // 验证模型是否在允许列表中
  const model = modelFromClient || DEFAULT_MODEL;
  if (!ALLOWED_MODELS.includes(model)) {
    return NextResponse.json({ message: '不允许的模型' }, { status: 400 });
  }

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

  // 加载用户本人的训练数据
  const userTrainingSamples = await TrainingSample.find({ 
    userId: payload.userId, 
    personaCode: code 
  }).sort({ createdAt: 1 }).lean();

  // 将训练数据转换为提示词格式
  let trainingDataPrompt = '';
  if (userTrainingSamples.length > 0) {
    const trainingExamples = userTrainingSamples.map((sample, index) => {
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

  // 组合 system 指令
  const systemContent = [
    ...(Array.isArray(base.system) ? base.system : []),
    ...contributedTexts,
    trainingDataPrompt,
  ].join('\n').trim();

  const url = DEFAULT_UPSTREAM_URL;
  const key = getPersonaApiKey(code);
  if (!key) return NextResponse.json({ message: '缺少 LLM_API_KEY' }, { status: 500 });

  // 调用上游 LLM（不持久化）
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

  // 注意：这里不持久化，只返回回复
  return NextResponse.json({ reply });
}

