import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/jwt';
import { connectToDatabase } from '@/lib/db';
import PersonaInstance from '@/model/PersonaInstance';
import Interaction from '@/model/Interaction';
import { loadPersonaPrompt } from '@/lib/persona-prompts';

const DEFAULT_UPSTREAM_URL = process.env.LLM_BASE_URL ?? 'https://jeniya.cn/v1/chat/completions';
const DEFAULT_API_KEY = process.env.LLM_API_KEY ?? '';
const DEFAULT_MODEL = process.env.LLM_MODEL ?? 'gpt-4o';
const MAX_HISTORY_MESSAGES = 200;
const CONTEXT_WINDOW = 12;

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const auth = req.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  const payload = token ? verifyAccessToken(token) : null;

  if (!payload) {
    return NextResponse.json({ message: '未授权' }, { status: 401 });
  }

  try {
    await connectToDatabase();
  } catch {
    return NextResponse.json({ message: '数据库连接失败' }, { status: 500 });
  }

  try {
    const { id } = await context.params;
    const body = await req.json();
    const message = (body?.message || '').trim();
    const modelFromClient = body?.model as string | undefined;

    if (!message) {
      return NextResponse.json({ message: '消息不能为空' }, { status: 400 });
    }

    const instance = await PersonaInstance.findOne({
      _id: id,
      $or: [
        { userId: payload.userId },
        { isPublic: true },
      ],
    }).lean() as any;

    if (!instance) {
      return NextResponse.json({ message: '实例不存在或无权访问' }, { status: 404 });
    }

    let systemPrompt = '';
    if (instance.personaCode) {
      const personaPrompt = loadPersonaPrompt(instance.personaCode);
      if (personaPrompt?.system) {
        systemPrompt = Array.isArray(personaPrompt.system)
          ? personaPrompt.system.join('\n')
          : personaPrompt.system;
      }
    }

    if (instance.systemPrompt) {
      systemPrompt = instance.systemPrompt;
    }

    let trainingDataPrompt = '';
    if (instance.trainingSamples && instance.trainingSamples.length > 0) {
      const trainingExamples = instance.trainingSamples.map((sample: any, index: number) => {
        let example = `示例 ${index + 1}:`;
        if (sample.scenario) {
          example += `\n场景: ${sample.scenario}`;
        }
        example += `\n用户输入: ${sample.input}`;
        example += `\n期望回复: ${sample.response}`;
        return example;
      }).join('\n\n');

      trainingDataPrompt = `\n\n以下是训练数据，请根据这些示例来调整你的回复风格：\n${trainingExamples}`;
    }

    const systemContent = [systemPrompt, trainingDataPrompt]
      .filter(Boolean)
      .join('\n')
      .trim() || '你是一个友好的AI助手。';

    if (!DEFAULT_API_KEY) {
      return NextResponse.json({ message: '缺少 LLM_API_KEY' }, { status: 500 });
    }

    const personaCode = `instance_${id}`;
    const interactionDoc = await Interaction.findOne({
      userId: payload.userId,
      personaCode,
    }).lean() as any;

    const historyMessages = Array.isArray(interactionDoc?.messages)
      ? interactionDoc.messages
        .filter((m: any) => m?.role === 'user' || m?.role === 'assistant')
        .slice(-CONTEXT_WINDOW)
        .map((m: any) => ({ role: m.role, content: m.content }))
      : [];

    const model = modelFromClient || DEFAULT_MODEL;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    let upstreamRes: Response;
    try {
      upstreamRes = await fetch(DEFAULT_UPSTREAM_URL, {
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
          user: `${payload.userId}:${personaCode}`,
          temperature: instance.modelParams?.temperature || 0.8,
          max_tokens: instance.modelParams?.maxTokens || 200,
          stream: false,
        }),
        signal: controller.signal,
      });
    } catch (fetchError: any) {
      const errorMessage = fetchError?.message || '未知网络错误';
      const errorName = fetchError?.name || 'FetchError';
      const errorCode = fetchError?.code || '';

      let userMessage = 'LLM API 连接失败';
      if (errorName === 'AbortError' || errorMessage.includes('timeout') || errorCode === 'ETIMEDOUT') {
        userMessage = 'LLM API 请求超时，请稍后重试';
      } else if (errorCode === 'ENOTFOUND' || errorMessage.includes('ENOTFOUND') || errorMessage.includes('getaddrinfo')) {
        userMessage = `无法解析 LLM API 地址 (${DEFAULT_UPSTREAM_URL})，请检查网络连接或 DNS 设置`;
      } else if (errorCode === 'ECONNREFUSED' || errorMessage.includes('ECONNREFUSED')) {
        userMessage = '无法连接到 LLM API 服务器，服务器可能未启动或端口被阻止';
      } else if (errorCode === 'ECONNRESET' || errorMessage.includes('ECONNRESET')) {
        userMessage = 'LLM API 连接被重置，请稍后重试';
      } else if (errorMessage.includes('certificate') || errorMessage.includes('SSL') || errorMessage.includes('TLS')) {
        userMessage = 'SSL 证书验证失败，请检查网络配置或联系管理员';
      } else if (errorCode === 'EAI_AGAIN') {
        userMessage = 'DNS 查询失败，请检查网络连接';
      }

      return NextResponse.json({
        message: userMessage,
        error: errorMessage,
        code: 'LLM_FETCH_ERROR',
        errorCode,
      }, { status: 503 });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!upstreamRes.ok) {
      let errorText = '';
      let errorMessage = 'LLM API调用失败';
      try {
        errorText = await upstreamRes.text();
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson?.error?.message_zh) {
            errorMessage = `LLM API错误：${errorJson.error.message_zh}`;
          } else if (errorJson?.error?.message) {
            errorMessage = `LLM API错误：${errorJson.error.message}`;
          } else if (errorJson?.message) {
            errorMessage = `LLM API错误：${errorJson.message}`;
          }
        } catch {
          if (errorText.includes('expired') || errorText.includes('过期')) {
            errorMessage = 'LLM API密钥已过期，请联系管理员';
          }
        }
      } catch {
        errorMessage = `LLM API调用失败 (${upstreamRes.status})`;
      }

      if (upstreamRes.status === 401) {
        return NextResponse.json({
          message: errorMessage,
          error: 'LLM API密钥已过期或无效',
          code: 'LLM_API_KEY_EXPIRED',
        }, { status: 503 });
      }

      return NextResponse.json({
        message: errorMessage,
        error: errorText || '未知错误',
      }, { status: 500 });
    }

    const json = await upstreamRes.json();
    const response =
      json?.choices?.[0]?.message?.content ??
      json?.output_text ??
      json?.reply ??
      '';

    const nextMessages = [
      ...(Array.isArray(interactionDoc?.messages) ? interactionDoc.messages : []),
      { role: 'user', content: message, createdAt: new Date() },
      { role: 'assistant', content: response, createdAt: new Date() },
    ].slice(-MAX_HISTORY_MESSAGES);

    await Interaction.findOneAndUpdate(
      { userId: payload.userId, personaCode },
      { $set: { messages: nextMessages } },
      { upsert: true, new: true },
    );

    return NextResponse.json({ response });
  } catch (error: any) {
    console.error('[persona-instance] 聊天失败:', error);
    return NextResponse.json({
      message: '聊天失败',
      error: error.message || '未知错误',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    }, { status: 500 });
  }
}
