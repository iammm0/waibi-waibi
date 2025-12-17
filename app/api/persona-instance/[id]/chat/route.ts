import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/jwt';
import { connectToDatabase } from '@/lib/db';
import PersonaInstance from '@/model/PersonaInstance';
import Interaction from '@/model/Interaction';
import { loadPersonaPrompt } from '@/lib/persona-prompts';

// 与模型实例聊天
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = req.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';

  console.log('[chat API] 收到请求，Authorization header:', auth ? `${auth.substring(0, 20)}...` : 'null');
  console.log('[chat API] 提取的 token:', token ? `${token.substring(0, 20)}...` : 'null');

  const payload = token ? verifyAccessToken(token) : null;

  console.log('[chat API] 令牌验证结果:', payload ? `有效，userId: ${payload.userId}` : '无效');

  if (!payload) {
    console.error('[chat API] 令牌验证失败，返回 401');
    return NextResponse.json({ message: '未授权' }, { status: 401 });
  }

  try {
    await connectToDatabase();
    console.log('[chat API] 数据库连接成功');
  } catch (error: any) {
    console.error('[chat API] 数据库连接失败:', error);
    return NextResponse.json({ message: '数据库连接失败', error: error?.message }, { status: 500 });
  }

  try {
    console.log('[chat API] 开始解析参数和请求体');
    let id: string;
    try {
      const params = await context.params;
      id = params.id;
      console.log('[chat API] 实例 ID:', id);
    } catch (error: any) {
      console.error('[chat API] 解析 params 失败:', error);
      return NextResponse.json({ message: '参数解析失败', error: error?.message }, { status: 500 });
    }

    let body: any;
    try {
      body = await req.json();
      console.log('[chat API] 请求体解析成功:', { message: body.message?.substring(0, 50), model: body.model });
    } catch (error: any) {
      console.error('[chat API] 解析请求体失败:', error);
      return NextResponse.json({ message: '请求体解析失败', error: error?.message }, { status: 400 });
    }

    const { message, model } = body;

    if (!message || !message.trim()) {
      return NextResponse.json({ message: '消息不能为空' }, { status: 400 });
    }

    // 获取模型实例
    console.log('[chat API] 查询实例，userId:', payload.userId, 'instanceId:', id);
    const instance = await PersonaInstance.findOne({
      _id: id,
      $or: [
        { userId: payload.userId }, // 自己的实例
        { isPublic: true } // 公开的实例
      ]
    }).lean() as any;

    console.log('[chat API] 实例查询结果:', instance ? `找到实例: ${instance.name}` : '未找到实例');

    if (!instance) {
      console.error('[chat API] 实例不存在或无权访问');
      return NextResponse.json({ message: '实例不存在或无权访问' }, { status: 404 });
    }

    // 构建系统提示词
    let systemPrompt = '';
    if (instance.personaCode) {
      // 如果有预制人格，加载预制提示词
      const personaPrompt = loadPersonaPrompt(instance.personaCode);
      if (personaPrompt && personaPrompt.system) {
        systemPrompt = Array.isArray(personaPrompt.system)
          ? personaPrompt.system.join('\n')
          : personaPrompt.system;
      }
    }
    // 如果有自定义系统提示词，使用自定义的（优先级更高）
    if (instance.systemPrompt) {
      systemPrompt = instance.systemPrompt;
    }

    // 将训练数据转换为提示词格式
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

    // 组合系统提示词
    const systemContent = [
      systemPrompt,
      trainingDataPrompt,
    ].filter(Boolean).join('\n').trim();

    // 调用LLM API
    const DEFAULT_UPSTREAM_URL = process.env.LLM_BASE_URL ?? 'https://jeniya.cn/v1/chat/completions';
    const DEFAULT_API_KEY = process.env.LLM_API_KEY ?? '';
    const DEFAULT_MODEL = process.env.LLM_MODEL ?? 'gpt-4o';

    const modelFromClient = model || DEFAULT_MODEL;
    const apiKey = instance.personaCode
      ? process.env[`LLM_API_KEY_${instance.personaCode.toUpperCase()}`] || DEFAULT_API_KEY
      : DEFAULT_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ message: '缺少 LLM_API_KEY' }, { status: 500 });
    }

    const url = DEFAULT_UPSTREAM_URL;
    console.log('[chat API] 调用 LLM API:', url, 'model:', modelFromClient);

    let upstreamRes: Response;
    try {
      // 创建超时控制器（60秒超时）
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      upstreamRes = await fetch(url, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: modelFromClient,
          messages: [
            { role: 'system', content: systemContent || '你是一个友好的AI助手。' },
            { role: 'user', content: message },
          ],
          temperature: instance.modelParams?.temperature || 0.8,
          max_tokens: instance.modelParams?.maxTokens || 200,
          stream: false,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log('[chat API] LLM API 响应状态:', upstreamRes.status);
    } catch (fetchError: any) {
      // 输出详细的错误信息用于调试
      console.error('[chat API] fetch 调用失败 - 完整错误信息:', {
        name: fetchError?.name,
        message: fetchError?.message,
        code: fetchError?.code,
        cause: fetchError?.cause,
        errno: fetchError?.errno,
        syscall: fetchError?.syscall,
        hostname: fetchError?.hostname,
        stack: fetchError?.stack,
        url: url,
      });
      
      const errorMessage = fetchError?.message || '未知网络错误';
      const errorName = fetchError?.name || 'FetchError';
      const errorCode = fetchError?.code || '';
      
      // 根据错误类型提供更友好的错误信息
      let userMessage = 'LLM API 连接失败';
      if (errorName === 'AbortError' || errorMessage.includes('timeout') || errorCode === 'ETIMEDOUT') {
        userMessage = 'LLM API 请求超时，请稍后重试';
      } else if (errorCode === 'ENOTFOUND' || errorMessage.includes('ENOTFOUND') || errorMessage.includes('getaddrinfo')) {
        userMessage = `无法解析 LLM API 地址 (${url})，请检查网络连接或 DNS 设置`;
      } else if (errorCode === 'ECONNREFUSED' || errorMessage.includes('ECONNREFUSED')) {
        userMessage = '无法连接到 LLM API 服务器，服务器可能未启动或端口被阻止';
      } else if (errorCode === 'ECONNRESET' || errorMessage.includes('ECONNRESET')) {
        userMessage = 'LLM API 连接被重置，请稍后重试';
      } else if (errorCode === 'ETIMEDOUT' || errorMessage.includes('ETIMEDOUT')) {
        userMessage = 'LLM API 连接超时，请检查网络或稍后重试';
      } else if (errorMessage.includes('certificate') || errorMessage.includes('SSL') || errorMessage.includes('TLS')) {
        userMessage = 'SSL 证书验证失败，请检查网络配置或联系管理员';
      } else if (errorCode === 'EAI_AGAIN') {
        userMessage = 'DNS 查询失败，请检查网络连接';
      }
      
      return NextResponse.json({
        message: userMessage,
        error: errorMessage,
        code: 'LLM_FETCH_ERROR',
        errorCode: errorCode,
        url: process.env.NODE_ENV === 'development' ? url : undefined,
        details: process.env.NODE_ENV === 'development' ? {
          name: errorName,
          code: errorCode,
          message: errorMessage,
          stack: fetchError.stack,
        } : undefined
      }, { status: 503 });
    }

    if (!upstreamRes.ok) {
      let errorText = '';
      let errorMessage = 'LLM API调用失败';
      try {
        errorText = await upstreamRes.text();
        console.error('[chat API] LLM API调用失败:', errorText);

        // 尝试解析错误信息
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
          // 如果不是 JSON，使用原始文本
          if (errorText.includes('expired') || errorText.includes('过期')) {
            errorMessage = 'LLM API密钥已过期，请联系管理员';
          }
        }
      } catch {
        errorMessage = `LLM API调用失败 (${upstreamRes.status})`;
      }

      // 如果是 401 错误（API Key 过期），返回 503 服务不可用，而不是上游的状态码
      if (upstreamRes.status === 401) {
        return NextResponse.json({
          message: errorMessage,
          error: 'LLM API密钥已过期或无效',
          code: 'LLM_API_KEY_EXPIRED'
        }, { status: 503 });
      }

      return NextResponse.json({
        message: errorMessage,
        error: errorText || '未知错误'
      }, { status: 500 });
    }

    const json = await upstreamRes.json();
    const response =
      json?.choices?.[0]?.message?.content ??
      json?.output_text ??
      json?.reply ??
      '';

    // 保存交互记录
    const now = new Date();
    const personaCode = `instance_${id}`;
    const doc = await Interaction.findOneAndUpdate(
      { userId: payload.userId, personaCode },
      {
        $push: {
          messages: {
            role: 'user',
            content: message,
            createdAt: now
          }
        },
        $set: { updatedAt: now }
      },
      { upsert: true, new: true }
    );

    await Interaction.findOneAndUpdate(
      { userId: payload.userId, personaCode },
      {
        $push: {
          messages: {
            role: 'assistant',
            content: response,
            createdAt: new Date()
          }
        },
        $set: { updatedAt: new Date() }
      }
    );

    return NextResponse.json({ response });
  } catch (error: any) {
    console.error('[persona-instance] 聊天失败:', error);
    console.error('[persona-instance] 错误堆栈:', error.stack);
    console.error('[persona-instance] 错误详情:', {
      message: error.message,
      name: error.name,
      cause: error.cause,
    });
    return NextResponse.json({
      message: '聊天失败',
      error: error.message || '未知错误',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

