import { connectToDatabase } from './db';
import Message from '@/model/Message';
import User from '@/model/User';

// 系统内置留言内容
const SYSTEM_MESSAGES = [
  '欢迎来到waibi宇宙！这里是一个充满人格魅力的交流空间。',
  '每一位MBTI人格都有自己的独特之处，在这里我们可以更好地理解彼此。',
  '用你的人格视角，分享你的想法和感悟吧。',
  '无论是理性分析还是感性表达，都值得被看见。',
  'waibi宇宙的开发者希望这里能成为大家交流与成长的平台。',
  '记住：真实地表达自己，比完美更重要。',
  '这里没有对错，只有不同的视角和声音。',
  '让我们用16种不同的方式，探索这个世界的无限可能。',
  '每一次留言，都是在waibi宇宙中留下的独特足迹。',
  '人格不是标签，而是我们理解世界的方式。',
  '在这里，每个声音都有价值，每个想法都值得被倾听。',
  'waibi宇宙等待你的声音，等待你的故事。',
  '让我们用不同的人格视角，构建一个多元而包容的交流空间。',
  '无论是INTJ的理性分析，还是ENFP的热情表达，都同样珍贵。',
  '记住：你是谁，比你想成为谁更重要。',
];

/**
 * 初始化留言板数据
 * 创建系统级INTJ用户并添加内置留言
 */
export async function initGuestbook() {
  try {
    await connectToDatabase();
    
    // 检查是否已经初始化过
    const existingSystemMessages = await Message.countDocuments({ isSystem: true });
    if (existingSystemMessages > 0) {
      console.log('[guestbook] 留言板已初始化，跳过初始化流程');
      return;
    }

    console.log('[guestbook] 开始初始化留言板...');

    // 创建系统用户（INTJ，waibi宇宙开发者）
    const systemUserId = 'system_intj_waibi_dev';
    let systemUser = await User.findOne({ userId: systemUserId });
    
    if (!systemUser) {
      systemUser = await User.create({
        userId: systemUserId,
        name: 'waibi宇宙的开发者',
        username: 'waibi宇宙的开发者',
        email: 'dev@waibi.universe',
      });
      console.log('[guestbook] 创建系统用户:', systemUserId);
    }

    // 创建系统级留言
    const messages = SYSTEM_MESSAGES.map((content, index) => ({
      userId: systemUserId,
      username: 'waibi宇宙的开发者',
      personaCode: 'intj',
      content,
      isAnonymous: false,
      isSystem: true,
      createdAt: new Date(Date.now() - (SYSTEM_MESSAGES.length - index) * 60000), // 时间戳错开
    }));

    await Message.insertMany(messages);
    console.log(`[guestbook] 成功创建 ${messages.length} 条系统留言`);

    console.log('[guestbook] 留言板初始化完成');
  } catch (error) {
    console.error('[guestbook] 初始化失败:', error);
    throw error;
  }
}

