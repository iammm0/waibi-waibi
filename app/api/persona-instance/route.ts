import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/jwt';
import { connectToDatabase } from '@/lib/db';
import PersonaInstance from '@/model/PersonaInstance';
import TrainingSample from '@/model/TrainingSample';

// 获取用户的所有模型实例
export async function GET(req: NextRequest) {
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
    const instances = await PersonaInstance.find({ userId: payload.userId })
      .sort({ updatedAt: -1 })
      .lean() as any[];
    
    return NextResponse.json({ instances });
  } catch (error: any) {
    console.error('[persona-instance] 获取实例列表失败:', error);
    return NextResponse.json({ message: '获取实例列表失败', error: error.message }, { status: 500 });
  }
}

// 创建新的模型实例
export async function POST(req: NextRequest) {
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
    const body = await req.json();
    const {
      name,
      description,
      personaCode,
      systemPrompt,
      trainingSamples,
      modelParams,
      avatarUrl,
      tags,
      isPublic,
      isTrainingSetPublic
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ message: '实例名称不能为空' }, { status: 400 });
    }

    // 如果选择了预制人格，自动加载该人格的训练数据
    let finalTrainingSamples = trainingSamples || [];
    if (personaCode) {
      try {
        const personaTrainingSamples = await TrainingSample.find({
          userId: payload.userId,
          personaCode: personaCode.toLowerCase()
        }).sort({ createdAt: -1 }).limit(200).lean() as any[];

        // 将训练数据转换为实例格式
        const loadedSamples = personaTrainingSamples.map((sample: any) => ({
          input: sample.input || '',
          response: sample.response || '',
          scenario: sample.scenario || undefined,
        }));

        // 合并用户提供的训练样本和从预制人格加载的训练样本
        // 如果用户提供了训练样本，则使用用户的；否则使用预制人格的
        if (finalTrainingSamples.length === 0) {
          finalTrainingSamples = loadedSamples;
        } else {
          // 合并，避免重复
          const existingInputs = new Set(finalTrainingSamples.map((s: any) => s.input));
          const newSamples = loadedSamples.filter((s: any) => !existingInputs.has(s.input));
          finalTrainingSamples = [...finalTrainingSamples, ...newSamples];
        }
      } catch (err) {
        console.error('[persona-instance] 加载预制人格训练数据失败:', err);
        // 如果加载失败，继续使用用户提供的训练样本
      }
    }

    const instance = new PersonaInstance({
      userId: payload.userId,
      name: name.trim(),
      description: description?.trim() || '',
      personaCode: personaCode || null,
      systemPrompt: systemPrompt?.trim() || '',
      trainingSamples: finalTrainingSamples,
      modelParams: modelParams || {
        temperature: 0.7,
        topP: 0.9,
        topK: 50,
        maxTokens: 200,
        epochs: 3,
        learningRate: 0.001
      },
      avatarUrl: avatarUrl || '',
      tags: tags || [],
      isPublic: isPublic || false,
      isTrainingSetPublic: isTrainingSetPublic !== undefined ? isTrainingSetPublic : true, // 默认公开训练集
      isTrained: false,
      trainingStatus: 'idle'
    });

    await instance.save();

    return NextResponse.json({ instance: instance.toObject() });
  } catch (error: any) {
    console.error('[persona-instance] 创建实例失败:', error);
    return NextResponse.json({ message: '创建实例失败', error: error.message }, { status: 500 });
  }
}

