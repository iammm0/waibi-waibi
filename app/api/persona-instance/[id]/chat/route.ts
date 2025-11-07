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
  const payload = token ? verifyAccessToken(token) : null;
  if (!payload) return NextResponse.json({ message: '未授权' }, { status: 401 });

  try {
    await connectToDatabase();
  } catch {
    return NextResponse.json({ message: '数据库连接失败' }, { status: 500 });
  }

  try {
    const { id } = await context.params;
    const body = await req.json();
    const { message, model } = body;

    if (!message || !message.trim()) {
      return NextResponse.json({ message: '消息不能为空' }, { status: 400 });
    }

    // 获取模型实例
    const instance = await PersonaInstance.findOne({ 
      _id: id,
      $or: [
        { userId: payload.userId }, // 自己的实例
        { isPublic: true } // 公开的实例
      ]
    }).lean() as any;

    if (!instance) {
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
    const upstreamRes = await fetch(url, {
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
    });

    if (!upstreamRes.ok) {
      const text = await upstreamRes.text();
      return NextResponse.json({ message: 'LLM API调用失败', error: text }, { status: upstreamRes.status });
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
    return NextResponse.json({ message: '聊天失败', error: error.message }, { status: 500 });
  }
}

