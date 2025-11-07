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
      isTrainingSetPublic,
      templateInstanceId // 模板实例ID（如果基于收藏模型创建）
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ message: '实例名称不能为空' }, { status: 400 });
    }

    // 如果基于收藏模型创建，获取模板实例信息
    let templateInstance: any = null;
    let developmentLevel = 1; // 默认是原创
    let originalUserId: string | undefined = undefined;
    let originalUserName = '';
    let developerUserId: string | undefined = undefined;
    let developerUserName = '';
    let sourceInstanceId: string | undefined = undefined;
    let sourceUserId: string | undefined = undefined;
    let forkChain: string[] = [];

    if (templateInstanceId) {
      // 获取模板实例（必须是用户收藏的实例）
      templateInstance = await PersonaInstance.findOne({
        _id: templateInstanceId,
        userId: payload.userId,
        isForked: true
      }).lean() as any;

      if (!templateInstance) {
        return NextResponse.json({ message: '模板实例不存在或无权访问' }, { status: 404 });
      }

      // 继承开发层级和原始作者信息
      developmentLevel = (templateInstance.developmentLevel || 1) + 1; // 增加开发层级
      originalUserId = templateInstance.originalUserId || templateInstance.userId;
      originalUserName = templateInstance.originalUserName || '';
      developerUserId = payload.userId; // 二创作者ID（当前用户）
      
      // 获取二创作者信息
      try {
        const developerUser = await User.findOne({ userId: payload.userId }).select('username name').lean() as any;
        if (developerUser) {
          developerUserName = developerUser.username || developerUser.name || '';
        }
      } catch (err) {
        console.error('[persona-instance] 获取二创作者信息失败:', err);
      }

      // 继承开发链
      if (templateInstance.forkChain && templateInstance.forkChain.length > 0) {
        forkChain = [...templateInstance.forkChain, templateInstanceId];
      } else {
        forkChain = [templateInstance.sourceInstanceId || templateInstanceId, templateInstanceId];
      }

      sourceInstanceId = templateInstanceId;
      sourceUserId = templateInstance.userId;
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

    // 如果基于模板创建，使用模板的训练样本（如果用户没有提供）
    if (templateInstance && finalTrainingSamples.length === 0) {
      finalTrainingSamples = templateInstance.trainingSamples || [];
    }

    const instanceData: any = {
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
    };

    // 如果基于模板创建，添加fork相关字段
    if (templateInstanceId) {
      instanceData.isForked = true;
      instanceData.sourceInstanceId = sourceInstanceId;
      instanceData.sourceUserId = sourceUserId;
      instanceData.developmentLevel = developmentLevel;
      instanceData.originalUserId = originalUserId;
      instanceData.originalUserName = originalUserName;
      instanceData.developerUserId = developerUserId;
      instanceData.developerUserName = developerUserName;
      instanceData.forkChain = forkChain;
      instanceData.modifiedAt = new Date(); // 标记为已修改（二次开发）
    }

    const instance = new PersonaInstance(instanceData);

    await instance.save();

    return NextResponse.json({ instance: instance.toObject() });
  } catch (error: any) {
    console.error('[persona-instance] 创建实例失败:', error);
    return NextResponse.json({ message: '创建实例失败', error: error.message }, { status: 500 });
  }
}

