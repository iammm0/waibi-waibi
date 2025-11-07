'use client';

import { useVibe } from '@/app/providers';
import Link from 'next/link';

interface UniverseStatusProps {
  type: 'loading' | 'error' | 'not-found';
  title?: string;
  message?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  context?: string; // 页面上下文，用于生成不同的标识语
}

const STATUS_MESSAGES = {
  loading: {
    default: {
      title: '正在校准宇宙频率',
      message: '骨架屏加载中，请原谅短暂的理智。',
    },
    chat: {
      title: '正在连接歪比频道',
      message: '信号传输中，请稍候...',
    },
    persona: {
      title: '正在加载人格数据',
      message: '人格矩阵初始化中...',
    },
    letter: {
      title: '正在解码宇宙信件',
      message: '信件内容解析中...',
    },
    profile: {
      title: '正在扫描用户档案',
      message: '档案数据加载中...',
    },
    instance: {
      title: '正在初始化模型实例',
      message: '模型参数配置中...',
    },
  },
  error: {
    default: {
      title: '宇宙信号中断',
      message: '发生了未知错误，宇宙频率暂时紊乱。请稍后重试或返回主时间线。',
    },
    chat: {
      title: '歪比频道连接失败',
      message: '无法连接到歪比频道，请检查网络连接或稍后重试。',
    },
    persona: {
      title: '人格数据加载失败',
      message: '人格矩阵初始化失败，请刷新页面重试。',
    },
    letter: {
      title: '信件解码失败',
      message: '无法读取信件内容，信件可能已损坏或不存在。',
    },
    profile: {
      title: '用户档案扫描失败',
      message: '无法加载用户档案，用户可能不存在或已离开歪比宇宙。',
    },
    instance: {
      title: '模型实例初始化失败',
      message: '无法加载模型实例，实例可能不存在或已被删除。',
    },
  },
  'not-found': {
    default: {
      title: '页面漂流到宇宙边缘',
      message: '你访问的内容暂时不存在。或许它正躲在另外一个宇宙版本里。点击下方按钮即可回到主时间线。',
    },
    chat: {
      title: '对话已消失在歪比维度',
      message: '你寻找的对话记录已不存在，可能已被时间流冲散。',
    },
    persona: {
      title: '人格矩阵未找到',
      message: '你访问的人格类型不存在，可能尚未被创造或已被删除。',
    },
    letter: {
      title: '信件在宇宙中迷失',
      message: '你寻找的信件不存在，可能已被回收或从未发送。',
    },
    profile: {
      title: '用户档案已消失',
      message: '你访问的用户不存在，可能已离开歪比宇宙或从未注册。',
    },
    instance: {
      title: '模型实例已湮灭',
      message: '你访问的模型实例不存在，可能已被删除或从未创建。',
    },
  },
};

export default function UniverseStatus({
  type,
  title,
  message,
  actionLabel,
  actionHref,
  onAction,
  context = 'default',
}: UniverseStatusProps) {
  const { mode } = useVibe();
  
  const statusConfig = STATUS_MESSAGES[type][context as keyof typeof STATUS_MESSAGES[typeof type]] || STATUS_MESSAGES[type].default;
  const finalTitle = title || statusConfig.title;
  const finalMessage = message || statusConfig.message;
  
  const containerClass = mode === 'waibi'
    ? 'bg-black/90 border border-green-500/30 text-white'
    : 'bg-white border border-gray-200 text-gray-900';
  
  const accentClass = mode === 'waibi'
    ? 'bg-green-500 hover:bg-green-600 text-white'
    : 'bg-[var(--accent-cyan)] hover:brightness-110 text-white';
  
  const secondaryClass = mode === 'waibi'
    ? 'border border-green-500/30 bg-gray-800/50 hover:bg-gray-800 text-white'
    : 'border border-gray-300 bg-gray-50 hover:bg-gray-100 text-gray-900';

  if (type === 'loading') {
    return (
      <div className={`flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center p-8 rounded-xl ${containerClass}`}>
        <div className="mb-4">
          <div className={`text-6xl mb-4 ${mode === 'waibi' ? 'text-green-400' : 'text-[var(--accent-cyan)]'}`}>
            {context === 'chat' && '📡'}
            {context === 'persona' && '🧠'}
            {context === 'letter' && '✉️'}
            {context === 'profile' && '👤'}
            {context === 'instance' && '🤖'}
            {!['chat', 'persona', 'letter', 'profile', 'instance'].includes(context) && '🌌'}
          </div>
          <p className={`pixel-text text-lg uppercase tracking-[0.4em] ${mode === 'waibi' ? 'text-green-400' : 'text-[var(--accent-cyan)]'}`}>
            {finalTitle}
          </p>
        </div>
        <p className={`text-sm opacity-80 ${mode === 'waibi' ? 'text-gray-300' : 'text-gray-600'}`}>
          {finalMessage}
        </p>
        <div className="grid w-full max-w-xl gap-3 mt-6">
          {["prelude", "stack", "glitch", "epilogue"].map((token) => (
            <div
              key={token}
              className={`h-12 animate-pulse rounded-xl ${
                mode === 'waibi' ? 'bg-green-500/20' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>
    );
  }

  if (type === 'error') {
    return (
      <div className={`flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center p-8 rounded-xl ${containerClass}`}>
        <div className="mb-4">
          <div className={`text-6xl mb-4 ${mode === 'waibi' ? 'text-red-400' : 'text-red-600'}`}>
            {context === 'chat' && '📡❌'}
            {context === 'persona' && '🧠❌'}
            {context === 'letter' && '✉️❌'}
            {context === 'profile' && '👤❌'}
            {context === 'instance' && '🤖❌'}
            {!['chat', 'persona', 'letter', 'profile', 'instance'].includes(context) && '⚠️'}
          </div>
          <h1 className={`pixel-text text-3xl mb-2 ${mode === 'waibi' ? 'text-red-400' : 'text-red-600'}`}>
            {finalTitle}
          </h1>
        </div>
        <p className={`max-w-lg text-sm opacity-80 ${mode === 'waibi' ? 'text-gray-300' : 'text-gray-600'}`}>
          {finalMessage}
        </p>
        <div className="flex gap-3 mt-4">
          {actionHref ? (
            <Link href={actionHref} className={`px-6 py-2 rounded-lg transition ${accentClass}`}>
              {actionLabel || '返回首页'}
            </Link>
          ) : onAction ? (
            <button onClick={onAction} className={`px-6 py-2 rounded-lg transition ${accentClass}`}>
              {actionLabel || '重试'}
            </button>
          ) : (
            <Link href="/" className={`px-6 py-2 rounded-lg transition ${accentClass}`}>
              返回首页
            </Link>
          )}
          <button
            onClick={() => window.location.reload()}
            className={`px-6 py-2 rounded-lg transition ${secondaryClass}`}
          >
            刷新页面
          </button>
        </div>
      </div>
    );
  }

  if (type === 'not-found') {
    return (
      <div className={`flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center p-8 rounded-xl ${containerClass}`}>
        <div className="mb-4">
          <div className={`text-6xl mb-4 ${mode === 'waibi' ? 'text-yellow-400' : 'text-yellow-600'}`}>
            {context === 'chat' && '💬❓'}
            {context === 'persona' && '🧠❓'}
            {context === 'letter' && '✉️❓'}
            {context === 'profile' && '👤❓'}
            {context === 'instance' && '🤖❓'}
            {!['chat', 'persona', 'letter', 'profile', 'instance'].includes(context) && '🌌❓'}
          </div>
          <h1 className={`pixel-text text-4xl mb-2 ${mode === 'waibi' ? 'text-yellow-400' : 'text-yellow-600'}`}>
            {finalTitle}
          </h1>
        </div>
        <p className={`max-w-lg text-sm opacity-80 ${mode === 'waibi' ? 'text-gray-300' : 'text-gray-600'}`}>
          {finalMessage}
        </p>
        {actionHref ? (
          <Link href={actionHref} className={`px-6 py-2 rounded-lg transition badge glitch-hover text-base ${accentClass}`}>
            {actionLabel || '回到首页'}
          </Link>
        ) : (
          <Link href="/" className={`px-6 py-2 rounded-lg transition badge glitch-hover text-base ${accentClass}`}>
            回到首页
          </Link>
        )}
      </div>
    );
  }

  return null;
}

