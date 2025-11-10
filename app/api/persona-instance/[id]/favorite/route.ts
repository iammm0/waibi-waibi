import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/jwt';
import { connectToDatabase } from '@/lib/db';
import PersonaInstance from '@/model/PersonaInstance';
import User from '@/model/User';

// 收藏模型实例
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
    
    // 获取源实例
    const sourceInstance = await PersonaInstance.findOne({ 
      _id: id,
      isPublic: true // 只能收藏公开的实例
    }).lean() as any;

    if (!sourceInstance) {
      return NextResponse.json({ message: '实例不存在或未公开' }, { status: 404 });
    }

    // 检查是否已经收藏过
    const existingFork = await PersonaInstance.findOne({
      userId: payload.userId,
      sourceInstanceId: id
    });

    if (existingFork) {
      return NextResponse.json({ message: '你已经收藏过这个实例了', instance: existingFork.toObject() });
    }

    // 计算开发层级和原始作者信息
    let developmentLevel = 2; // 默认是二次开发
    let originalUserId = sourceInstance.userId;
    let originalUserName = '';
    let forkChain: string[] = [id]; // 开发链，包含当前实例ID

    // 如果源实例也是fork的，继承其开发层级和原始作者信息
    if (sourceInstance.isForked && sourceInstance.developmentLevel) {
      developmentLevel = sourceInstance.developmentLevel + 1; // 增加开发层级
      originalUserId = sourceInstance.originalUserId || sourceInstance.userId;
      // 继承开发链
      if (sourceInstance.forkChain && sourceInstance.forkChain.length > 0) {
        forkChain = [...sourceInstance.forkChain, id];
      } else {
        forkChain = [sourceInstance.sourceInstanceId || id, id];
      }
    }

    // 获取原始作者信息
    if (originalUserId) {
      try {
        const originalUser = await User.findOne({ userId: originalUserId }).select('username name').lean() as any;
        if (originalUser) {
          originalUserName = originalUser.username || originalUser.name || '';
        }
      } catch (err) {
        console.error('[persona-instance/favorite] 获取原始作者信息失败:', err);
      }
    }

    // 获取二创作者信息（当前用户）
    let developerUserName = '';
    try {
      const developerUser = await User.findOne({ userId: payload.userId }).select('username name').lean() as any;
      if (developerUser) {
        developerUserName = developerUser.username || developerUser.name || '';
      }
    } catch (err) {
      console.error('[persona-instance/favorite] 获取二创作者信息失败:', err);
    }

    // 创建收藏实例（复制）
    const forkedInstance = new PersonaInstance({
      userId: payload.userId,
      name: `${sourceInstance.name} (收藏)`,
      description: sourceInstance.description || '',
      personaCode: sourceInstance.personaCode || null,
      systemPrompt: sourceInstance.systemPrompt || '',
      trainingSamples: sourceInstance.trainingSamples || [],
      modelParams: sourceInstance.modelParams || {
        temperature: 0.7,
        topP: 0.9,
        topK: 50,
        maxTokens: 200,
        epochs: 3,
        learningRate: 0.001
      },
      avatarUrl: sourceInstance.avatarUrl || '',
      tags: sourceInstance.tags || [],
      isPublic: false, // 收藏的实例默认不公开
      isTrained: false,
      trainingStatus: 'idle',
      // 收藏相关字段
      sourceInstanceId: id,
      sourceUserId: sourceInstance.userId,
      isForked: true,
      isInvalid: false,
      modifiedAt: null, // 初始时未修改
      // 开发层级相关字段
      developmentLevel,
      originalUserId,
      originalUserName,
      developerUserId: payload.userId, // 二创作者ID（当前用户）
      developerUserName, // 二创作者名称
      forkChain
    });

    await forkedInstance.save();

    return NextResponse.json({ 
      message: '收藏成功',
      instance: forkedInstance.toObject() 
    });
  } catch (error: any) {
    console.error('[persona-instance/favorite] 收藏失败:', error);
    return NextResponse.json({ message: '收藏失败', error: error.message }, { status: 500 });
  }
}

