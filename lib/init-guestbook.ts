import { connectToDatabase } from './db';
import Message from '@/model/Message';
import { MBTI_TYPES } from './mbti';

// 常见的网名列表（用于初始化留言）
const COMMON_USERNAMES = [
  '风中的叶子', '追光者', '夜行者', '星空下的旅人', '时光旅人',
  '梦想家', '自由鸟', '安静的思考者', '勇敢的心', '智慧之光',
  '温暖的阳光', '雨后的彩虹', '远山的呼唤', '海边的风', '森林的声音',
  '晨曦微露', '暮色苍茫', '云卷云舒', '花开花落', '月圆月缺',
];

// 16种人格的初始留言内容（参考虎扑风格，体现各人格特色）
const PERSONA_MESSAGES: Record<string, string[]> = {
  intj: [
    '效率就是生命，计划就是一切。',
    '如果一件事没有意义，那为什么要做？',
    '我的世界里，逻辑大于情感。',
    '战略家不需要解释，结果会说话。',
    '思考未来比享受当下更重要。',
  ],
  intp: [
    '为什么？为什么？为什么？',
    '理论先于实践，逻辑高于一切。',
    '世界太复杂，让我慢慢分析一下。',
    '完美主义？不，我只是追求真理。',
    '知识就是力量，好奇就是动力。',
  ],
  entj: [
    '目标明确，行动果断，这就是我。',
    '领导不是位置，是责任。',
    '效率第一，成果说话。',
    '挑战就是机会，困难就是动力。',
    '团队的力量，就是我的力量。',
  ],
  entp: [
    '辩论是我的爱好，挑战是我的乐趣。',
    '为什么不试试？说不定会有惊喜。',
    '规则？那是用来打破的。',
    '创意无限，灵感不断。',
    '无聊是最大的敌人。',
  ],
  infj: [
    '理解他人，理解世界，这就是我的使命。',
    '理想很遥远，但我一直在路上。',
    '直觉告诉我，这样是对的。',
    '帮助他人，就是帮助自己。',
    '深度思考，深度理解，深度生活。',
  ],
  infp: [
    '理想主义不是幼稚，是坚持。',
    '情感很脆弱，但也很强大。',
    '做真实的自己，比什么都重要。',
    '理解痛苦，所以更能感受美好。',
    '世界需要温柔，也需要坚持。',
  ],
  enfj: [
    '帮助他人成长，就是我的快乐。',
    '团队需要我，我也需要团队。',
    '沟通是桥梁，理解是基础。',
    '领导力来自真诚和关怀。',
    '让每个人都能发光，是我的目标。',
  ],
  enfp: [
    '热情是我的标签，自由是我的追求。',
    '生活太美好，每一刻都值得珍惜。',
    '创意无限，灵感不断。',
    '社交不是负担，是乐趣。',
    '保持好奇心，永远年轻。',
  ],
  istj: [
    '责任就是一切，细节决定成败。',
    '传统不是束缚，是智慧。',
    '踏实做事，诚实做人。',
    '计划周密，执行到位。',
    '可靠就是我的标签。',
  ],
  isfj: [
    '守护他人，是我的使命。',
    '细节决定一切，用心做好每件事。',
    '传统值得尊重，责任值得承担。',
    '关怀他人，就是关怀自己。',
    '默默付出，不求回报。',
  ],
  estj: [
    '效率第一，结果导向。',
    '组织就是力量，计划就是成功。',
    '执行力就是竞争力。',
    '细节决定成败，态度决定一切。',
    '领导不是位置，是责任和担当。',
  ],
  esfj: [
    '社交让我快乐，帮助他人让我满足。',
    '团队合作，共同成长。',
    '细节决定一切，用心做好每件事。',
    '和谐的环境，就是最好的环境。',
    '关怀他人，就是关怀自己。',
  ],
  istp: [
    '动手能力就是我的优势。',
    '理论需要实践验证。',
    '解决问题，才是王道。',
    '理性分析，果断行动。',
    '工具就是我的伙伴。',
  ],
  isfp: [
    '艺术就是生活，生活就是艺术。',
    '追求美，享受美，创造美。',
    '自由表达，真实自我。',
    '感受当下，珍惜现在。',
    '温柔的力量，也很强大。',
  ],
  estp: [
    '行动就是一切，享受就是现在。',
    '挑战就是乐趣，刺激就是动力。',
    '活在当下，享受生活。',
    '实践出真知，体验出真理。',
    '冒险是我的生活方式。',
  ],
  esfp: [
    '生活就是舞台，每个人都是主角。',
    '社交让我快乐，分享让我满足。',
    '享受当下，感受美好。',
    '热情是我的标签，活力是我的动力。',
    '快乐可以传染，分享就是快乐。',
  ],
};

/**
 * 获取随机用户名（或匿名）
 */
function getRandomUserInfo(): { username?: string; isAnonymous: boolean } {
  const shouldBeAnonymous = Math.random() < 0.5; // 50%概率匿名
  if (shouldBeAnonymous) {
    return { isAnonymous: true };
  }
  const randomIndex = Math.floor(Math.random() * COMMON_USERNAMES.length);
  return { username: COMMON_USERNAMES[randomIndex], isAnonymous: false };
}

/**
 * 初始化留言板数据
 * 为16种MBTI人格各创建初始留言（不标记为系统，随机匿名或实名）
 */
export async function initGuestbook() {
  try {
    await connectToDatabase();
    
    // 检查是否已经初始化过（检查是否有足够的初始留言）
    const expectedMessagesCount = Object.values(PERSONA_MESSAGES).reduce((sum, msgs) => sum + msgs.length, 0);
    const totalMessages = await Message.countDocuments();
    
    if (totalMessages >= expectedMessagesCount) {
      console.log('[guestbook] 留言板已初始化，跳过初始化流程');
      return;
    }

    console.log('[guestbook] 开始初始化留言板...');

    // 为每种人格创建初始留言
    const allMessages: any[] = [];
    const baseTime = Date.now() - expectedMessagesCount * 60000; // 基础时间戳

    for (const persona of MBTI_TYPES) {
      const personaCode = persona.name.toLowerCase();
      const messages = PERSONA_MESSAGES[personaCode] || [];
      
      for (let i = 0; i < messages.length; i++) {
        const userInfo = getRandomUserInfo();
        // 随机时间戳，让留言更自然
        const randomOffset = Math.floor(Math.random() * expectedMessagesCount * 60000);
        const createdAt = new Date(baseTime + randomOffset);
        
        allMessages.push({
          userId: undefined, // 不关联用户
          username: userInfo.username,
          personaCode: personaCode,
          content: messages[i],
          isAnonymous: userInfo.isAnonymous,
          isSystem: false, // 不标记为系统留言
          createdAt,
        });
      }
    }

    if (allMessages.length > 0) {
      await Message.insertMany(allMessages);
      console.log(`[guestbook] 成功创建 ${allMessages.length} 条初始留言（覆盖${MBTI_TYPES.length}种人格）`);
    }

    console.log('[guestbook] 留言板初始化完成');
  } catch (error) {
    console.error('[guestbook] 初始化失败:', error);
    throw error;
  }
}

