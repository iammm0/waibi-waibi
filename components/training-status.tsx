'use client';

interface TrainingStatusProps {
  status: 'idle' | 'training' | 'completed' | 'error';
  progress?: number; // 0-100
}

export default function TrainingStatus({ status, progress = 0 }: TrainingStatusProps) {
  // 状态样式映射
  const statusStyles = {
    idle: 'text-gray-400',
    training: 'text-green-400',
    completed: 'text-green-400',
    error: 'text-red-400'
  };

  // 状态文本映射
  const statusTexts = {
    idle: '准备训练',
    training: '训练中...',
    completed: '训练完成',
    error: '训练失败'
  };

  return (
    <div className="space-y-2 bg-black p-4 border border-green-500/30 rounded-lg shadow-[0_0_10px_rgba(139,255,78,0.3)]">
      <div className="flex items-center">
        <span className={`font-medium ${statusStyles[status]}`}>
          {statusTexts[status]}
        </span>
        {status === 'training' && (
          <div className="ml-3 text-sm text-gray-600">{progress}%</div>
        )}
      </div>
      
      {status !== 'idle' && (
        <div className="w-full bg-gray-900 rounded-full h-2">
          <div
            className={`h-2 rounded-full ${status === 'training' ? 'bg-green-500' : status === 'completed' ? 'bg-green-400' : 'bg-red-500'}`}
            style={{ width: `${status === 'training' ? progress : 100}%` }}
          ></div>
        </div>
      )}
      
      {status === 'error' && (
        <p className="text-sm text-red-400">
          训练过程中遇到问题，请检查训练数据和参数设置后重试。
        </p>
      )}
      
      {status === 'completed' && (
        <p className="text-sm text-green-500">
          模型训练成功，可以开始使用了！
        </p>
      )}
    </div>
  );
}