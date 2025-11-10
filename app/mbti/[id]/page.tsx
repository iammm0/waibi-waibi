'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import SectionHeader from '@/components/section-header';
import { useVibe } from '@/app/providers';
import ModelParameters from '@/components/model-parameters';
import TrainingStatus from '@/components/training-status';
import TrainingPreview from '@/components/training-preview';
import { getPersonalityById } from '@/lib/mbti';
import { fetchWithAuth } from '@/lib/auth-utils';
import { universeToast } from '@/components/universe-toast';

export interface ModelParams {
  temperature: number;
  topP: number;
  topK: number;
  maxTokens: number;
  epochs: number;
  learningRate: number;
}

interface TrainingSample {
  input: string;
  response: string;
  scenario?: string;
  _id?: string; // 用于服务器删除
}

export default function MbtiTrainingDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const persona = getPersonalityById(id);
  const { mode } = useVibe();

  const [trainingSamples, setTrainingSamples] = useState<TrainingSample[]>([]);
  const [modelParams, setModelParams] = useState<ModelParams>({
    temperature: 0.7,
    topP: 0.9,
    topK: 50,
    maxTokens: 200,
    epochs: 3,
    learningRate: 0.001
  });
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);
  const [trainingStatus, setTrainingStatus] = useState<'idle' | 'training' | 'completed' | 'error'>('idle');
  const [currentSample, setCurrentSample] = useState<TrainingSample>({ input: '', response: '' });
  const [trainingProgress, setTrainingProgress] = useState(0);

  const [basePromptCount, setBasePromptCount] = useState(0);
  const [contribPromptCount, setContribPromptCount] = useState(0);
  const [showPreview, setShowPreview] = useState(false);

  // 从服务器加载训练样本
  useEffect(() => {
    const code = persona?.name?.toLowerCase() || '';
    if (!code) return;

    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (token) {
      // 已登录，从服务器加载
      fetchWithAuth(`/api/persona/${code}/training`)
        .then(async (r) => {
          if (r.ok) {
            const data = await r.json();
            const items = data.items || [];
            // 转换为前端需要的格式
            const samples: TrainingSample[] = items.map((item: any) => ({
              input: item.input || '',
              response: item.response || '',
              scenario: item.scenario || '',
              _id: item._id, // 保存ID用于删除
            }));
            setTrainingSamples(samples);
          }
        })
        .catch((err) => {
          console.error('加载训练样本失败:', err);
        });
    } else {
      // 未登录，从 localStorage 加载（兼容旧逻辑）
      const savedSamples = localStorage.getItem('trainingSamples');
      if (savedSamples) {
        try {
          setTrainingSamples(JSON.parse(savedSamples));
        } catch (e) {
          console.error('解析 localStorage 训练样本失败:', e);
        }
      }
    }

    // 加载其他本地设置
    const savedParams = localStorage.getItem('modelParams');
    const savedMode = localStorage.getItem('advancedMode');
    if (savedParams) {
      try {
        setModelParams(JSON.parse(savedParams));
      } catch (e) {
        console.error('解析 modelParams 失败:', e);
      }
    }
    if (savedMode) {
      try {
        setIsAdvancedMode(JSON.parse(savedMode));
      } catch (e) {
        console.error('解析 advancedMode 失败:', e);
      }
    }
  }, [persona?.name]);

  // 保存到 localStorage（仅用于未登录用户的本地存储）
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    // 如果未登录，才保存到 localStorage
    if (!token) {
      localStorage.setItem('trainingSamples', JSON.stringify(trainingSamples));
    }
    localStorage.setItem('modelParams', JSON.stringify(modelParams));
    localStorage.setItem('advancedMode', JSON.stringify(isAdvancedMode));
  }, [trainingSamples, modelParams, isAdvancedMode]);

  useEffect(() => {
    const code = persona?.name?.toLowerCase() || '';
    if (!code) return;
    fetch(`/api/persona/${code}/prompt`).then(async (r) => {
      if (!r.ok) return;
      const data = await r.json();
      setBasePromptCount(Array.isArray(data?.base?.system) ? data.base.system.length : 0);
      setContribPromptCount(Array.isArray(data?.contributed) ? data.contributed.length : 0);
    }).catch(() => {});
  }, [persona?.name]);

  const handleAddSample = async () => {
    if (currentSample.input.trim() && currentSample.response.trim()) {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const code = persona?.name?.toLowerCase();

      // 如果已登录，先保存到服务器，获取ID后再更新本地状态
      if (token && code) {
        try {
          const res = await fetchWithAuth(`/api/persona/${code}/training`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              input: currentSample.input, 
              response: currentSample.response, 
              scenario: currentSample.scenario 
            }),
          });
          if (res.ok) {
            const data = await res.json();
            // 添加新样本，包含服务器返回的ID
            setTrainingSamples([...trainingSamples, {
              ...currentSample,
              _id: data.id,
            }]);
          } else {
            // 服务器保存失败，仍然添加到本地（兼容未登录或错误情况）
            setTrainingSamples([...trainingSamples, currentSample]);
          }
        } catch (err) {
          console.error('保存训练样本失败:', err);
          // 出错时仍然添加到本地
          setTrainingSamples([...trainingSamples, currentSample]);
        }
      } else {
        // 未登录，只保存到本地
        setTrainingSamples([...trainingSamples, currentSample]);
      }
      setCurrentSample({ input: '', response: '', scenario: '' });
    }
  };

  const handleDeleteSample = async (index: number) => {
    const sample = trainingSamples[index];
    const originalSamples = [...trainingSamples]; // 保存原始状态用于恢复
    const newSamples = [...trainingSamples];
    newSamples.splice(index, 1);
    setTrainingSamples(newSamples);

    // 如果样本有_id（从服务器加载的），需要同步删除服务器数据
    if (sample._id) {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      if (token) {
        try {
          const res = await fetchWithAuth('/api/me/training', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: sample._id }),
          });
          if (!res.ok) {
            console.error('删除服务器训练样本失败');
            // 如果删除失败，恢复本地状态
            setTrainingSamples(originalSamples);
            universeToast.error('删除失败，请重试');
          }
        } catch (err) {
          console.error('删除训练样本失败:', err);
          // 如果删除失败，恢复本地状态
          setTrainingSamples(originalSamples);
          universeToast.error('删除失败，请重试');
        }
      }
    }
  };

  const handleParamChange = (param: keyof ModelParams, value: number) => {
    setModelParams(prev => ({ ...prev, [param]: value }));
  };


  const startTraining = async () => {
    setTrainingStatus('training');
    setTrainingProgress(0);
    try {
      console.log('开始训练模型', { id, persona, trainingSamples, modelParams });
      const totalSteps = 10;
      const stepDelay = 500;
      for (let i = 1; i <= totalSteps; i++) {
        await new Promise(resolve => setTimeout(resolve, stepDelay));
        const progress = Math.floor((i / totalSteps) * 100);
        setTrainingProgress(progress);
      }
      setTrainingStatus('completed');
    } catch (error) {
      console.error('训练失败', error);
      setTrainingStatus('error');
    }
  };

  const panelClass = mode === 'waibi' ? 'bg-black/90 border border-green-500/30 text-white' : 'bg-white border border-gray-200 text-gray-900';
  const inputClass = mode === 'waibi' ? 'border border-green-500/30 bg-gray-900/50 text-white' : 'border border-gray-300 bg-white text-gray-900';
  const accentBtn = mode === 'waibi' ? 'bg-green-500 hover:bg-green-600' : 'bg-[var(--accent-cyan)] hover:brightness-110';
  const secondaryBtn = mode === 'waibi' ? 'border border-green-500/30 bg-gray-800/50 hover:bg-gray-800' : 'border border-gray-300 bg-gray-50 hover:bg-gray-100';

  return (
    <div className="container mx-auto px-4 py-2 max-w-6xl">
      <SectionHeader 
        icon="🎯"
        title={`${persona?.name || '人格'} 训练中心`} 
        subtitle={persona?.description ? (persona.description.length > 50 ? persona.description.slice(0, 50) + '...' : persona.description) : ''} 
      />

      {/* 操作提示 */}
      <div className={`rounded-xl shadow-md p-4 mt-6 mb-6 ${panelClass}`}>
        <div className="flex items-start gap-3">
          <div className={`text-2xl ${mode === 'waibi' ? 'text-green-400' : 'text-[var(--accent-cyan)]'}`}>💡</div>
          <div className="flex-1">
            <div className="font-semibold mb-1">训练数据集说明</div>
            <div className={`text-sm ${mode === 'waibi' ? 'text-gray-300' : 'text-gray-600'}`}>
              在这里添加的训练数据将用于该人格类型。当你基于此人格创建模型实例时，这些训练数据会自动同步到新创建的模型实例中。
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2 space-y-6">
          {/* 添加训练样本表单 */}
          <div className={`rounded-xl shadow-md p-6 ${panelClass}`}>
            <h3 className="text-xl font-semibold mb-4">添加训练对话样本</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">用户输入</label>
                <textarea
                  className={`w-full p-3 rounded-lg ${inputClass} focus:outline-none focus:ring-2 ${mode === 'waibi' ? 'focus:ring-green-500/50' : 'focus:ring-[var(--accent-cyan)]'}`}
                  rows={3}
                  placeholder="输入用户可能会说的话..."
                  value={currentSample.input}
                  onChange={(e) => setCurrentSample({...currentSample, input: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">AI回应</label>
                <textarea
                  className={`w-full p-3 rounded-lg ${inputClass} focus:outline-none focus:ring-2 ${mode === 'waibi' ? 'focus:ring-green-500/50' : 'focus:ring-[var(--accent-cyan)]'}`}
                  rows={3}
                  placeholder="输入AI应该回应的内容..."
                  value={currentSample.response}
                  onChange={(e) => setCurrentSample({...currentSample, response: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">场景描述 (可选)</label>
                <input
                  type="text"
                  className={`w-full p-3 rounded-lg ${inputClass} focus:outline-none focus:ring-2 ${mode === 'waibi' ? 'focus:ring-green-500/50' : 'focus:ring-[var(--accent-cyan)]'}`}
                  placeholder="描述这个对话发生的场景..."
                  value={currentSample.scenario || ''}
                  onChange={(e) => setCurrentSample({...currentSample, scenario: e.target.value})}
                />
              </div>

              <button
                onClick={handleAddSample}
                disabled={!currentSample.input.trim() || !currentSample.response.trim()}
                className={`w-full text-white py-2 px-4 rounded-lg transition ${accentBtn} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                添加到训练集
              </button>
            </div>
          </div>

          {/* 训练样本列表 */}
          <div className={`rounded-xl shadow-md p-6 ${panelClass}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">训练样本列表</h3>
              <span className={`text-sm px-3 py-1 rounded-full ${
                mode === 'waibi' ? 'bg-green-500/20 text-green-400' : 'bg-blue-100 text-blue-700'
              }`}>
                {trainingSamples.length} 条
              </span>
            </div>
            {trainingSamples.length === 0 ? (
              <div className={`text-center py-12 ${mode === 'waibi' ? 'text-gray-400' : 'text-gray-500'}`}>
                <div className="text-4xl mb-3">📝</div>
                <p className="italic">尚未添加训练样本，请在上方添加至少一个对话样本</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                {trainingSamples.map((sample, index) => (
                  <div key={index} className={`rounded-lg p-4 relative group border ${
                    mode === 'waibi' ? 'bg-gray-900/50 border-green-500/30' : 'bg-gray-50 border-gray-200'
                  }`}>
                    <button
                      onClick={() => handleDeleteSample(index)}
                      className={`absolute top-2 right-2 px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition ${
                        mode === 'waibi' ? 'text-red-400 hover:bg-red-500/20' : 'text-red-600 hover:bg-red-50'
                      }`}
                    >
                      删除
                    </button>
                    <div className="pr-12">
                      <div className="font-medium mb-2">
                        <span className={`text-xs px-2 py-0.5 rounded mr-2 ${
                          mode === 'waibi' ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700'
                        }`}>用户</span>
                        {sample.input}
                      </div>
                      <div className="mb-2">
                        <span className={`text-xs px-2 py-0.5 rounded mr-2 ${
                          mode === 'waibi' ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-700'
                        }`}>AI</span>
                        {sample.response}
                      </div>
                      {sample.scenario && (
                        <div className={`text-xs px-2 py-1 rounded inline-block mt-1 ${
                          mode === 'waibi' ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700'
                        }`}>
                          📍 {sample.scenario}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* 快速操作卡片 */}
          <div className={`rounded-xl shadow-md p-6 ${panelClass}`}>
            <h3 className="text-xl font-semibold mb-4">快速操作</h3>
            <div className="space-y-3">
              <button
                onClick={() => {
                  const code = persona?.name?.toLowerCase();
                  if (code) {
                    router.push(`/persona-instance/create?persona=${code}`);
                  }
                }}
                className={`w-full py-3 rounded-lg text-white ${accentBtn}`}
              >
                基于此人格创建模型实例
              </button>
              <div className={`text-xs p-3 rounded-lg ${
                mode === 'waibi' ? 'bg-gray-900/50 text-gray-300' : 'bg-gray-50 text-gray-600'
              }`}>
                💡 创建模型实例时，当前训练集会自动同步到新实例中
              </div>
            </div>
          </div>

          {/* 模型参数设置 */}
          <div className={`rounded-xl shadow-md p-6 ${panelClass}`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">模型参数设置</h3>
              <button 
                onClick={() => setIsAdvancedMode(!isAdvancedMode)} 
                className={`text-sm px-3 py-1 rounded ${secondaryBtn}`}
              >
                {isAdvancedMode ? '简化视图' : '高级模式'}
              </button>
            </div>
            <ModelParameters params={modelParams} onParamChange={handleParamChange} isAdvancedMode={isAdvancedMode} />
          </div>

          {/* 训练信息 */}
          <div className={`rounded-xl shadow-md p-6 ${panelClass}`}>
            <h3 className="text-xl font-semibold mb-4">训练信息</h3>
            <div className="space-y-3">
              <div className={`p-3 rounded-lg ${
                mode === 'waibi' ? 'bg-gray-900/50' : 'bg-gray-50'
              }`}>
                <div className="text-sm opacity-80 mb-1">提示词汇聚</div>
                <div className="text-lg font-semibold">
                  基础 {basePromptCount} 条，用户贡献 {contribPromptCount} 条
                </div>
              </div>
              <div className={`p-3 rounded-lg ${
                mode === 'waibi' ? 'bg-gray-900/50' : 'bg-gray-50'
              }`}>
                <div className="text-sm opacity-80 mb-1">训练样本</div>
                <div className="text-lg font-semibold">
                  {trainingSamples.length} 条
                </div>
              </div>
            </div>
          </div>

          {/* 训练控制 */}
          <div className={`rounded-xl shadow-md p-6 ${panelClass}`}>
            <h3 className="text-xl font-semibold mb-4">训练控制</h3>
            <TrainingStatus status={trainingStatus} progress={trainingProgress} />
            <button
              onClick={startTraining}
              disabled={trainingSamples.length === 0 || trainingStatus === 'training'}
              className={`w-full py-3 mt-4 rounded-lg text-white transition ${
                trainingSamples.length === 0
                  ? 'bg-gray-400 cursor-not-allowed'
                  : trainingStatus === 'training'
                    ? 'bg-blue-400 cursor-not-allowed'
                    : accentBtn
              }`}
            >
              {trainingStatus === 'training' ? '训练中...' : '开始训练模型'}
            </button>
            <button
              onClick={() => setShowPreview(!showPreview)}
              className={`w-full py-3 mt-3 rounded-lg transition ${secondaryBtn}`}
            >
              {showPreview ? '隐藏预览' : '预览训练效果'}
            </button>
          </div>
        </div>
      </div>

      {/* 预览训练区域 */}
      {showPreview && (
        <div className="mt-8">
          <TrainingPreview
            personaCode={persona?.name?.toLowerCase() || ''}
            personaName={persona?.name || '人格'}
          />
        </div>
      )}
    </div>
  );
}
