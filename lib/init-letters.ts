import { connectToDatabase } from './db';
import Letter from '@/model/Letter';

/**
 * 初始化歪比宇宙信件
 * 根据最新功能更新信件内容
 */
export async function initLetters() {
  try {
    await connectToDatabase();
    
    // 检查是否已有信件
    const existingCount = await Letter.countDocuments();
    if (existingCount > 0) {
      console.log('[letters] 信件已存在，跳过初始化');
      return;
    }

    console.log('[letters] 开始初始化歪比宇宙信件...');

    const letters = [
      {
        letterId: 'letter-001',
        title: '欢迎来到歪比宇宙',
        content: `亲爱的旅行者，

欢迎来到歪比宇宙！这里是一个充满无限可能的世界，我们正在构建一个独特的AI人格训练与交流平台。

在这里，你可以：
• 探索16种MBTI人格类型
• 训练和定制属于你自己的人格模型
• 与AI进行深度对话和交流
• 分享你的训练数据与经验
• 查看来自歪比宇宙的信件和更新

我们相信，每个人都是独特的，每个AI人格也应该有自己独特的个性。让我们一起创造更多可能性。

期待与你在歪比宇宙中相遇！

—— 歪比宇宙团队`,
        author: '歪比宇宙',
        category: '欢迎',
        tags: ['欢迎', '介绍'],
        isPublished: true,
        priority: 100,
        publishedAt: new Date(),
      },
      {
        letterId: 'letter-002',
        title: '订阅功能上线通知',
        content: `亲爱的用户，

我们很高兴地宣布，订阅功能已经上线！现在你可以：

• 订阅月付计划（¥20/月）
• 享受无限人格模型训练
• 获得无限聊天记录存储
• 优先技术支持
• 专属功能优先体验

目前订阅功能正在测试阶段，你可以使用体验版本免费激活订阅。正式版本将支持微信支付和支付宝支付，我们正在配置相关商户信息。

感谢你的理解与支持！

—— 歪比宇宙团队`,
        author: '歪比宇宙',
        category: '更新',
        tags: ['订阅', '新功能'],
        isPublished: true,
        priority: 90,
        publishedAt: new Date(),
      },
      {
        letterId: 'letter-003',
        title: '微信聊天记录导入功能',
        content: `亲爱的用户，

我们新增了微信聊天记录导入功能！现在你可以：

• 导入你的微信聊天记录
• 自动转换为训练样本
• 用于训练你的人格模型
• 让AI更好地理解你的对话风格

操作步骤：
1. 进入个人中心
2. 点击"导入微信聊天记录"
3. 选择你的聊天记录JSON文件
4. 选择目标人格
5. 系统会自动处理并转换为训练样本

导入的训练样本会在个人中心的"训练集管理"中显示，你可以随时查看和管理。

—— 歪比宇宙团队`,
        author: '歪比宇宙',
        category: '新功能',
        tags: ['导入', '训练', '微信'],
        isPublished: true,
        priority: 85,
        publishedAt: new Date(),
      },
      {
        letterId: 'letter-004',
        title: '训练样本管理优化',
        content: `亲爱的用户，

我们优化了训练样本的管理功能：

• 训练样本现在会自动从服务器加载
• 刷新页面后数据不会丢失
• 支持跨设备同步
• 可以删除不需要的训练样本

现在训练详情页面会：
• 自动加载当前人格的训练样本
• 添加样本时同步到服务器
• 删除样本时同步更新
• 确保数据持久化

如果你之前有训练样本，它们会自动加载并显示。如果遇到任何问题，请随时联系我们。

—— 歪比宇宙团队`,
        author: '歪比宇宙',
        category: '优化',
        tags: ['训练', '优化'],
        isPublished: true,
        priority: 80,
        publishedAt: new Date(),
      },
    ];

    await Letter.insertMany(letters);
    console.log(`[letters] 成功创建 ${letters.length} 封信件`);

    console.log('[letters] 信件初始化完成');
  } catch (error) {
    console.error('[letters] 初始化失败:', error);
    throw error;
  }
}

