import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import PersonaInstance from '@/model/PersonaInstance';

// 获取所有公开的模型实例
export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
  } catch {
    return NextResponse.json({ message: '数据库连接失败' }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);
  const search = searchParams.get('search') || '';

  try {
    const query: any = { isPublic: true };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const instances = await PersonaInstance.find(query)
      .sort({ updatedAt: -1 })
      .limit(limit)
      .skip(offset)
      .select('-systemPrompt') // 不返回系统提示词
      .lean() as any[];

    // 根据 isTrainingSetPublic 字段决定是否返回训练集
    const instancesWithFilteredTraining = instances.map((instance: any) => {
      if (!instance.isTrainingSetPublic) {
        // 如果训练集不公开，不返回训练样本，但保留训练样本数量信息
        const trainingCount = instance.trainingSamples?.length || 0;
        delete instance.trainingSamples;
        instance.trainingSamplesCount = trainingCount;
        instance.trainingSetVisible = false;
      } else {
        instance.trainingSetVisible = true;
      }
      return instance;
    });

    const total = await PersonaInstance.countDocuments(query);

    return NextResponse.json({
      instances: instancesWithFilteredTraining,
      total,
      limit,
      offset
    });
  } catch (error: any) {
    console.error('[persona-instance/public] 获取公开实例列表失败:', error);
    return NextResponse.json({ message: '获取公开实例列表失败', error: error.message }, { status: 500 });
  }
}

