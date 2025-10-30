'use client';

import { useEffect, useState } from 'react';
import SectionHeader from '@/components/section-header';
import { useVibe } from '@/app/providers';
import ModelParameters from '@/components/model-parameters';
import TrainingStatus from '@/components/training-status';
import { getPersonalityById } from '@/lib/mbti';

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
}

export default function MbtiTrainingDetail({ params }: { params: { id: string } }) {
  const { id } = params;
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

  useEffect(() => {
    const savedSamples = localStorage.getItem('trainingSamples');
    const savedParams = localStorage.getItem('modelParams');
    const savedMode = localStorage.getItem('advancedMode');
    if (savedSamples) setTrainingSamples(JSON.parse(savedSamples));
    if (savedParams) setModelParams(JSON.parse(savedParams));
    if (savedMode) setIsAdvancedMode(JSON.parse(savedMode));
  }, []);

  useEffect(() => {
    localStorage.setItem('trainingSamples', JSON.stringify(trainingSamples));
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

  const handleAddSample = () => {
    if (currentSample.input.trim() && currentSample.response.trim()) {
      setTrainingSamples([...trainingSamples, currentSample]);
      setCurrentSample({ input: '', response: '', scenario: '' });
    }
  };

  const handleDeleteSample = (index: number) => {
    const newSamples = [...trainingSamples];
    newSamples.splice(index, 1);
    setTrainingSamples(newSamples);
  };

  const handleParamChange = (param: keyof ModelParams, value: number) => {
    setModelParams(prev => ({ ...prev, [param]: value }));
  };

  const paramsPanelClass = mode === 'waibi' ? 'bg-black border border-green-500/30' : 'bg-white border border-gray-200';
  const headerTextClass = mode === 'waibi' ? 'text-gray-300' : 'text-gray-900';
  const toggleBtnTextClass = mode === 'waibi' ? 'text-green-400 dark:text-green-300' : 'text-green-500 dark:text-green-400';
  const controlPanelClass = mode === 'waibi' ? 'bg-black border border-green-500/30' : 'bg-white border border-gray-200';

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

  return (
    <div className="container mx-auto p-4 max-w-5xl">
      <SectionHeader title={`${persona?.name || '人格'} 训练中心`} subtitle={persona?.description || ''} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        <div className="lg:col-span-2 space-y-6">
          <div className={ `bg-${mode === 'waibi' ? 'black' : 'white'} dark:bg-gray-900 rounded-xl shadow-md p-6 border border-${mode === 'waibi' ? 'green-500/30' : 'gray-200'}` }>
            <h3 className="text-xl font-semibold mb-4">添加训练对话样本</h3>
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium text-${mode === 'waibi' ? 'white' : 'gray-900'} dark:text-gray-100 mb-1`}>用户输入</label>
                <textarea
                  className={`w-full p-3 border border-${mode === 'waibi' ? 'green-500/30' : 'gray-300'} rounded-lg focus:ring-2 focus:ring-${mode === 'waibi' ? 'green-500' : 'blue-500'}`}
                  rows={3}
                  placeholder="输入用户可能会说的话..."
                  value={currentSample.input}
                  onChange={(e) => setCurrentSample({...currentSample, input: e.target.value})}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium text-${mode === 'waibi' ? 'gray-300' : 'gray-700'} mb-1`}>AI回应</label>
                <textarea
                  className={`w-full p-3 border border-${mode === 'waibi' ? 'green-500/30' : 'gray-300'} rounded-lg focus:ring-2 focus:ring-${mode === 'waibi' ? 'green-500' : 'blue-500'}`}
                  rows={3}
                  placeholder="输入AI应该回应的内容..."
                  value={currentSample.response}
                  onChange={(e) => setCurrentSample({...currentSample, response: e.target.value})}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium text-${mode === 'waibi' ? 'gray-300' : 'gray-700'} mb-1`}>场景描述 (可选)</label>
                <input
                  type="text"
                  className={`w-full p-3 border border-${mode === 'waibi' ? 'green-500/30' : 'gray-300'} rounded-lg focus:ring-2 focus:ring-${mode === 'waibi' ? 'green-500' : 'blue-500'}`}
                  placeholder="描述这个对话发生的场景..."
                  value={currentSample.scenario || ''}
                  onChange={(e) => setCurrentSample({...currentSample, scenario: e.target.value})}
                />
              </div>

              <button
                onClick={handleAddSample}
                className={`w-full text-white py-2 px-4 rounded-lg transition duration-300 ${mode === 'waibi' ? 'bg-green-500 hover:bg-green-600' : 'bg-[var(--accent-cyan)] hover:brightness-110'}`}
              >
                添加到训练集
              </button>
            </div>
          </div>

          <div className={`bg-${mode === 'waibi' ? 'black' : 'white'} rounded-xl shadow-md p-6 border border-${mode === 'waibi' ? 'green-500/30' : 'gray-200'}`}>
            <h3 className="text-xl font-semibold mb-4">训练样本列表 ({trainingSamples.length})</h3>
            {trainingSamples.length === 0 ? (
              <p className={`text-${mode === 'waibi' ? 'gray-400' : 'gray-500'} italic text-center py-8`}>
                尚未添加训练样本，请在上方添加至少一个对话样本
              </p>
            ) : (
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {trainingSamples.map((sample, index) => (
                  <div key={index} className={`border border-${mode === 'waibi' ? 'green-500/50' : 'gray-200'} rounded-lg p-4 relative group bg-${mode === 'waibi' ? 'gray-900/50' : 'white'}`}>
                    <button
                      onClick={() => handleDeleteSample(index)}
                      className={`absolute top-2 right-2 text-${mode === 'waibi' ? 'gray-500' : 'gray-400'} hover:text-${mode === 'waibi' ? 'red-400' : 'red-500'} opacity-0 group-hover:opacity-100 transition`}
                    >
                      删除
                    </button>
                    <div className="font-medium text-gray-900 mb-1">用户：{sample.input}</div>
                    <div className="text-gray-700 mb-2">AI：{sample.response}</div>
                    {sample.scenario && (
                      <div className={`text-xs text-${mode === 'waibi' ? 'green-400' : 'gray-500'} bg-${mode === 'waibi' ? 'gray-800' : 'gray-100'} inline-block px-2 py-1 rounded`}>
                        {sample.scenario}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className={`rounded-xl shadow-md p-6 ${paramsPanelClass}`}>
            <div className={`flex justify-between items-center mb-4 ${headerTextClass}`}>
              <h3 className="text-xl font-semibold">模型参数设置</h3>
              <button onClick={() => setIsAdvancedMode(!isAdvancedMode)} className={`text-sm ${toggleBtnTextClass}`}>
                {isAdvancedMode ? '简化视图' : '高级模式'}
              </button>
            </div>
            <ModelParameters params={modelParams} onParamChange={handleParamChange} isAdvancedMode={isAdvancedMode} />
          </div>

          <div className={`rounded-xl shadow-md p-6 ${controlPanelClass}`}>
            <h3 className="text-xl font-semibold mb-2">训练控制</h3>
            <div className="text-sm opacity-80 mb-4">
              提示词汇聚：基础 {basePromptCount} 条，用户贡献 {contribPromptCount} 条
            </div>
            <TrainingStatus status={trainingStatus} progress={trainingProgress} />
            <button
              onClick={startTraining}
              disabled={trainingSamples.length === 0 || trainingStatus === 'training'}
              className={`w-full py-3 mt-4 rounded-lg transition ${
                trainingSamples.length === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : trainingStatus === 'training'
                    ? 'bg-blue-400 text-white cursor-not-allowed'
                    : mode === 'waibi'
                      ? 'bg-green-500 hover:bg-green-600 text-white'
                      : 'bg-[var(--accent-cyan)] hover:brightness-110 text-white'
              }`}
            >
              {trainingStatus === 'training' ? '训练中...' : '开始训练模型'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
