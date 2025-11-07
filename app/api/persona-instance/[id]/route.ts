import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/jwt';
import { connectToDatabase } from '@/lib/db';
import PersonaInstance from '@/model/PersonaInstance';

// 获取单个模型实例
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = req.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  const payload = token ? verifyAccessToken(token) : null;
  // 允许未登录用户访问公开实例

  try {
    await connectToDatabase();
  } catch {
    return NextResponse.json({ message: '数据库连接失败' }, { status: 500 });
  }

  try {
    const { id } = await context.params;
    const query: any = { _id: id };
    
    // 如果未登录，只能访问公开实例
    if (!payload) {
      query.isPublic = true;
    } else {
      // 已登录用户可以访问自己的实例或公开实例
      query.$or = [
        { userId: payload.userId }, // 自己的实例
        { isPublic: true } // 公开的实例
      ];
    }
    
    const instance = await PersonaInstance.findOne(query).lean() as any;

    if (!instance) {
      return NextResponse.json({ message: '实例不存在或无权访问' }, { status: 404 });
    }

    // 如果不是自己的实例，根据 isTrainingSetPublic 决定是否返回训练集
    if (instance.userId !== payload?.userId) {
      delete instance.systemPrompt;
      // 如果训练集不公开，不返回训练样本，但保留训练样本数量信息
      if (!instance.isTrainingSetPublic) {
        const trainingCount = instance.trainingSamples?.length || 0;
        delete instance.trainingSamples;
        instance.trainingSamplesCount = trainingCount;
        instance.trainingSetVisible = false;
      } else {
        instance.trainingSetVisible = true;
      }
    } else {
      // 自己的实例，始终可见
      instance.trainingSetVisible = true;
    }

    return NextResponse.json({ instance });
  } catch (error: any) {
    console.error('[persona-instance] 获取实例失败:', error);
    return NextResponse.json({ message: '获取实例失败', error: error.message }, { status: 500 });
  }
}

// 更新模型实例
export async function PUT(
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
      isTrained,
      trainingStatus
    } = body;

    // 先获取当前实例，检查公开状态是否改变
    const currentInstance = await PersonaInstance.findOne({ _id: id, userId: payload.userId }).lean() as any;
    if (!currentInstance) {
      return NextResponse.json({ message: '实例不存在' }, { status: 404 });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name?.trim() || '';
    if (description !== undefined) updateData.description = description?.trim() || '';
    if (personaCode !== undefined) updateData.personaCode = personaCode || null;
    if (systemPrompt !== undefined) updateData.systemPrompt = systemPrompt?.trim() || '';
    if (trainingSamples !== undefined) updateData.trainingSamples = trainingSamples;
    if (modelParams !== undefined) updateData.modelParams = modelParams;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl || '';
    if (tags !== undefined) updateData.tags = tags || [];
    if (isPublic !== undefined) updateData.isPublic = isPublic;
    if (isTrainingSetPublic !== undefined) updateData.isTrainingSetPublic = isTrainingSetPublic;
    if (isTrained !== undefined) updateData.isTrained = isTrained;
    if (trainingStatus !== undefined) updateData.trainingStatus = trainingStatus;

    const instance = await PersonaInstance.findOneAndUpdate(
      { _id: id, userId: payload.userId },
      { $set: updateData },
      { new: true }
    ).lean() as any;

    // 如果实例的公开状态从true变为false，标记所有基于此实例的收藏为无效
    if (isPublic !== undefined && currentInstance.isPublic === true && isPublic === false) {
      try {
        await PersonaInstance.updateMany(
          { 
            sourceInstanceId: id,
            isForked: true,
            modifiedAt: null // 只标记未修改过的收藏实例
          },
          { 
            $set: { isInvalid: true } 
          }
        );
      } catch (err) {
        console.error('[persona-instance] 标记无效收藏失败:', err);
        // 不影响主流程，继续执行
      }
    }

    return NextResponse.json({ instance });
  } catch (error: any) {
    console.error('[persona-instance] 更新实例失败:', error);
    return NextResponse.json({ message: '更新实例失败', error: error.message }, { status: 500 });
  }
}

// 删除模型实例
export async function DELETE(
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
    const instance = await PersonaInstance.findOneAndDelete({ 
      _id: id,
      userId: payload.userId 
    });

    if (!instance) {
      return NextResponse.json({ message: '实例不存在' }, { status: 404 });
    }

    return NextResponse.json({ message: '删除成功' });
  } catch (error: any) {
    console.error('[persona-instance] 删除实例失败:', error);
    return NextResponse.json({ message: '删除实例失败', error: error.message }, { status: 500 });
  }
}

