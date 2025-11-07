import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import PersonaInstance from '@/model/PersonaInstance';
import User from '@/model/User';
import { verifyAccessToken } from '@/lib/jwt';

// 获取所有公开的模型实例
export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
  } catch {
    return NextResponse.json({ message: '数据库连接失败' }, { status: 500 });
  }

  // 检查用户是否已登录
  const auth = req.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  const payload = token ? verifyAccessToken(token) : null;

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

    // 获取所有唯一的 userId，查询用户信息
    const userIds = [...new Set(instances.map((inst: any) => inst.userId))];
    const users = await User.find({ userId: { $in: userIds } })
      .select('userId username name')
      .lean() as any[];
    
    // 创建 userId 到用户名的映射
    const userMap = new Map<string, string>();
    users.forEach((user: any) => {
      userMap.set(user.userId, user.username || user.name || '未知用户');
    });

    // 如果用户已登录，检查哪些实例已被收藏
    let favoritedInstanceIds = new Set<string>();
    if (payload) {
      try {
        const favoritedInstances = await PersonaInstance.find({
          userId: payload.userId,
          sourceInstanceId: { $in: instances.map((inst: any) => inst._id.toString()) },
          isForked: true
        }).select('sourceInstanceId').lean() as any[];
        
        favoritedInstances.forEach((fav: any) => {
          if (fav.sourceInstanceId) {
            favoritedInstanceIds.add(fav.sourceInstanceId.toString());
          }
        });
      } catch (err) {
        console.error('[persona-instance/public] 检查收藏状态失败:', err);
      }
    }

    // 根据 isTrainingSetPublic 字段决定是否返回训练集，并添加作者信息
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
      // 添加作者信息
      instance.authorName = userMap.get(instance.userId) || '未知用户';
      // 添加收藏状态
      instance.isFavorited = favoritedInstanceIds.has(instance._id.toString());
      // 如果是二次开发的作品，确保显示原创作者和二创作者信息
      if (instance.isForked && instance.isPublic) {
        // 公开的二次开发作品需要显示原创作者和二创作者信息
        // 这些信息已经在收藏时设置好了
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

