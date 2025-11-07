'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SectionHeader from '@/components/section-header';
import { useVibe } from '@/app/providers';
import ModelParameters from '@/components/model-parameters';
import { MBTI_TYPES } from '@/lib/mbti';
import { fetchWithAuth } from '@/lib/auth-utils';
import AvatarEditor from '@/components/avatar-editor';

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

export default function PersonaInstanceCreatePage() {
  const router = useRouter();
  const { mode } = useVibe();
  const [step, setStep] = useState(1); // 1: 选择类型, 2: 基本信息, 3: 提示词, 4: 训练样本, 5: 模型参数
  const [instanceType, setInstanceType] = useState<'blank' | 'persona'>('blank');
  const [selectedPersona, setSelectedPersona] = useState<string>('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [trainingSamples, setTrainingSamples] = useState<TrainingSample[]>([]);
  const [currentSample, setCurrentSample] = useState<TrainingSample>({ input: '', response: '' });
  const [modelParams, setModelParams] = useState<ModelParams>({
    temperature: 0.7,
    topP: 0.9,
    topK: 50,
    maxTokens: 200,
    epochs: 3,
    learningRate: 0.001
  });
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [isTrainingSetPublic, setIsTrainingSetPublic] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAvatarEditor, setShowAvatarEditor] = useState(false);

  const panelClass = mode === 'waibi' ? 'bg-black/90 border border-green-500/30 text-white' : 'bg-white border border-gray-200 text-gray-900';
  const inputClass = mode === 'waibi' ? 'border border-green-500/30 bg-gray-900/50 text-white' : 'border border-gray-300 bg-white text-gray-900';
  const accentBtn = mode === 'waibi' ? 'bg-green-500 hover:bg-green-600' : 'bg-[var(--accent-cyan)] hover:brightness-110';
  const secondaryBtn = mode === 'waibi' ? 'border border-green-500/30 bg-gray-800/50 hover:bg-gray-800' : 'border border-gray-300 bg-gray-50 hover:bg-gray-100';

  // 当选择预制人格时，通过API加载提示词
  useEffect(() => {
    if (instanceType === 'persona' && selectedPersona) {
      fetch(`/api/persona/${selectedPersona.toLowerCase()}/prompt`)
        .then(async (r) => {
          if (r.ok) {
            const data = await r.json();
            if (data.base && data.base.system) {
              const promptText = Array.isArray(data.base.system) 
                ? data.base.system.join('\n')
                : data.base.system;
              setSystemPrompt(promptText);
            }
          }
        })
        .catch(() => {
          // 如果加载失败，保持空提示词
        });
    } else if (instanceType === 'blank') {
      setSystemPrompt('');
    }
  }, [instanceType, selectedPersona]);

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleAddSample = () => {
    if (currentSample.input.trim() && currentSample.response.trim()) {
      setTrainingSamples([...trainingSamples, currentSample]);
      setCurrentSample({ input: '', response: '', scenario: '' });
    }
  };

  const handleDeleteSample = (index: number) => {
    setTrainingSamples(trainingSamples.filter((_, i) => i !== index));
  };

  const handleSaveAvatar = async (imageData: string) => {
    setAvatarUrl(imageData);
    setShowAvatarEditor(false);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      alert('请输入实例名称');
      return;
    }

    setSaving(true);
    try {
      const res = await fetchWithAuth('/api/persona-instance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          personaCode: instanceType === 'persona' ? selectedPersona.toLowerCase() : null,
          systemPrompt: systemPrompt.trim(),
          trainingSamples,
          modelParams,
          avatarUrl: avatarUrl.trim(),
          tags,
          isPublic,
          isTrainingSetPublic
        }),
      });

      if (res.ok) {
        const data = await res.json();
        alert('创建成功！');
        router.push(`/persona-instance/${data.instance._id}`);
      } else {
        const errorData = await res.json().catch(() => ({ message: '创建失败' }));
        alert(`创建失败: ${errorData.message || '未知错误'}`);
      }
    } catch (err: any) {
      console.error('创建失败:', err);
      alert(`创建失败: ${err.message || '网络错误'}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-2 max-w-6xl">
      <SectionHeader
        title="创建人格模型实例"
        subtitle="创建一个全新的人格模型实例，可以是空白模板或基于预制人格"
      />

      {/* 头像编辑器 */}
      {showAvatarEditor && (
        <AvatarEditor
          currentAvatarUrl={avatarUrl}
          onSave={handleSaveAvatar}
          onCancel={() => setShowAvatarEditor(false)}
        />
      )}

      {/* 步骤指示器 */}
      <div className="mt-8 mb-6">
        <div className="flex items-center justify-between">
          {[1, 2, 3, 4, 5].map((s) => (
            <div key={s} className="flex items-center flex-1">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                step >= s 
                  ? mode === 'waibi' ? 'bg-green-500 text-white' : 'bg-[var(--accent-cyan)] text-white'
                  : mode === 'waibi' ? 'bg-gray-800 text-gray-400' : 'bg-gray-200 text-gray-500'
              }`}>
                {s}
              </div>
              {s < 5 && (
                <div className={`flex-1 h-1 mx-2 ${
                  step > s 
                    ? mode === 'waibi' ? 'bg-green-500' : 'bg-[var(--accent-cyan)]'
                    : mode === 'waibi' ? 'bg-gray-800' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs opacity-70">
          <span>选择类型</span>
          <span>基本信息</span>
          <span>提示词</span>
          <span>训练样本</span>
          <span>模型参数</span>
        </div>
      </div>

      <div className={`rounded-xl shadow-md p-6 ${panelClass}`}>
        {/* 步骤1: 选择类型 */}
        {step === 1 && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold mb-4">选择创建类型</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button
                onClick={() => {
                  setInstanceType('blank');
                  setSelectedPersona('');
                }}
                className={`p-6 rounded-lg border-2 transition ${
                  instanceType === 'blank'
                    ? mode === 'waibi' ? 'border-green-500 bg-green-500/20' : 'border-[var(--accent-cyan)] bg-blue-50'
                    : mode === 'waibi' ? 'border-gray-700 hover:border-green-500/50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-4xl mb-3">📝</div>
                <div className="text-lg font-semibold mb-2">空白模板</div>
                <div className="text-sm opacity-80">从零开始，完全自定义你的人格模型</div>
              </button>
              <button
                onClick={() => setInstanceType('persona')}
                className={`p-6 rounded-lg border-2 transition ${
                  instanceType === 'persona'
                    ? mode === 'waibi' ? 'border-green-500 bg-green-500/20' : 'border-[var(--accent-cyan)] bg-blue-50'
                    : mode === 'waibi' ? 'border-gray-700 hover:border-green-500/50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-4xl mb-3">🎭</div>
                <div className="text-lg font-semibold mb-2">基于预制人格</div>
                <div className="text-sm opacity-80">基于MBTI人格类型，使用预设提示词</div>
              </button>
            </div>

            {instanceType === 'persona' && (
              <div className="mt-6">
                <label className="block text-sm font-medium mb-2">选择人格类型</label>
                <select
                  value={selectedPersona}
                  onChange={(e) => setSelectedPersona(e.target.value)}
                  className={`w-full p-3 rounded-lg ${inputClass}`}
                >
                  <option value="">请选择人格类型</option>
                  {MBTI_TYPES.map((p) => (
                    <option key={p.name} value={p.name}>
                      {p.name} - {p.description}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setStep(2)}
                disabled={instanceType === 'persona' && !selectedPersona}
                className={`px-6 py-2 rounded-lg text-white ${accentBtn} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                下一步
              </button>
            </div>
          </div>
        )}

        {/* 步骤2: 基本信息 */}
        {step === 2 && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold mb-4">基本信息</h3>
            <div>
              <label className="block text-sm font-medium mb-2">实例名称 *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full p-3 rounded-lg ${inputClass}`}
                placeholder="给你的模型实例起个名字"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">描述</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={`w-full p-3 rounded-lg ${inputClass}`}
                rows={3}
                placeholder="描述这个模型实例的特点..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">头像</label>
              <div className="flex items-center gap-4">
                {avatarUrl && (
                  <div className="relative">
                    <img
                      src={avatarUrl}
                      alt="头像预览"
                      className="w-20 h-20 rounded-full object-cover border-2"
                    />
                    <button
                      onClick={() => setAvatarUrl('')}
                      className={`absolute -top-1 -right-1 w-6 h-6 rounded-full ${mode === 'waibi' ? 'bg-red-500' : 'bg-red-500'} text-white text-xs flex items-center justify-center`}
                      title="删除头像"
                    >
                      ×
                    </button>
                  </div>
                )}
                <button
                  onClick={() => setShowAvatarEditor(true)}
                  className={`px-4 py-2 rounded-lg ${accentBtn} text-white`}
                >
                  {avatarUrl ? '更换头像' : '上传头像'}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">标签</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                  className={`flex-1 p-2 rounded-lg ${inputClass}`}
                  placeholder="输入标签后按回车"
                />
                <button
                  onClick={handleAddTag}
                  className={`px-4 py-2 rounded-lg ${secondaryBtn}`}
                >
                  添加
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className={`px-3 py-1 rounded-full text-sm ${
                      mode === 'waibi' ? 'bg-green-500/20 text-green-400' : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-2 hover:opacity-70"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="w-4 h-4"
              />
              <label className="text-sm">公开此模型实例</label>
            </div>
            {isPublic && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isTrainingSetPublic}
                  onChange={(e) => setIsTrainingSetPublic(e.target.checked)}
                  className="w-4 h-4"
                />
                <label className="text-sm">允许其他用户查看训练集</label>
              </div>
            )}
            <div className="flex justify-between mt-6">
              <button
                onClick={() => setStep(1)}
                className={`px-6 py-2 rounded-lg ${secondaryBtn}`}
              >
                上一步
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!name.trim()}
                className={`px-6 py-2 rounded-lg text-white ${accentBtn} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                下一步
              </button>
            </div>
          </div>
        )}

        {/* 步骤3: 提示词 */}
        {step === 3 && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold mb-4">系统提示词</h3>
            <div>
              <label className="block text-sm font-medium mb-2">
                {instanceType === 'persona' ? '系统提示词（已从预制人格加载，可修改）' : '系统提示词（可选）'}
              </label>
              <textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                className={`w-full p-3 rounded-lg ${inputClass}`}
                rows={10}
                placeholder="输入系统提示词，定义模型的行为和性格..."
              />
            </div>
            <div className="flex justify-between mt-6">
              <button
                onClick={() => setStep(2)}
                className={`px-6 py-2 rounded-lg ${secondaryBtn}`}
              >
                上一步
              </button>
              <button
                onClick={() => setStep(4)}
                className={`px-6 py-2 rounded-lg text-white ${accentBtn}`}
              >
                下一步
              </button>
            </div>
          </div>
        )}

        {/* 步骤4: 训练样本 */}
        {step === 4 && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold mb-4">训练样本</h3>
            <div className={`p-4 rounded-lg ${mode === 'waibi' ? 'bg-gray-900/50' : 'bg-gray-50'}`}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">用户输入</label>
                <textarea
                  value={currentSample.input}
                  onChange={(e) => setCurrentSample({...currentSample, input: e.target.value})}
                  className={`w-full p-3 rounded-lg ${inputClass}`}
                  rows={2}
                  placeholder="输入用户可能会说的话..."
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">AI回应</label>
                <textarea
                  value={currentSample.response}
                  onChange={(e) => setCurrentSample({...currentSample, response: e.target.value})}
                  className={`w-full p-3 rounded-lg ${inputClass}`}
                  rows={2}
                  placeholder="输入AI应该回应的内容..."
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">场景描述（可选）</label>
                <input
                  type="text"
                  value={currentSample.scenario || ''}
                  onChange={(e) => setCurrentSample({...currentSample, scenario: e.target.value})}
                  className={`w-full p-3 rounded-lg ${inputClass}`}
                  placeholder="描述这个对话发生的场景..."
                />
              </div>
              <button
                onClick={handleAddSample}
                disabled={!currentSample.input.trim() || !currentSample.response.trim()}
                className={`w-full py-2 rounded-lg text-white ${accentBtn} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                添加到训练集
              </button>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-3">训练样本列表 ({trainingSamples.length})</h4>
              {trainingSamples.length === 0 ? (
                <p className={`text-center py-8 ${mode === 'waibi' ? 'text-gray-400' : 'text-gray-500'}`}>
                  尚未添加训练样本，可以稍后添加
                </p>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {trainingSamples.map((sample, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border ${
                        mode === 'waibi' ? 'bg-gray-900/50 border-green-500/30' : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-medium mb-1">用户：{sample.input}</div>
                          <div className="mb-1">AI：{sample.response}</div>
                          {sample.scenario && (
                            <div className={`text-xs px-2 py-1 rounded inline-block mt-1 ${
                              mode === 'waibi' ? 'bg-green-500/20 text-green-400' : 'bg-blue-100 text-blue-700'
                            }`}>
                              {sample.scenario}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteSample(index)}
                          className={`ml-2 px-2 py-1 rounded text-sm ${
                            mode === 'waibi' ? 'text-red-400 hover:bg-red-500/20' : 'text-red-600 hover:bg-red-50'
                          }`}
                        >
                          删除
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-between mt-6">
              <button
                onClick={() => setStep(3)}
                className={`px-6 py-2 rounded-lg ${secondaryBtn}`}
              >
                上一步
              </button>
              <button
                onClick={() => setStep(5)}
                className={`px-6 py-2 rounded-lg text-white ${accentBtn}`}
              >
                下一步
              </button>
            </div>
          </div>
        )}

        {/* 步骤5: 模型参数 */}
        {step === 5 && (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">模型参数</h3>
              <button
                onClick={() => setIsAdvancedMode(!isAdvancedMode)}
                className={`text-sm ${mode === 'waibi' ? 'text-green-400' : 'text-[var(--accent-cyan)]'}`}
              >
                {isAdvancedMode ? '简化视图' : '高级模式'}
              </button>
            </div>
            <ModelParameters
              params={modelParams}
              onParamChange={(param, value) => setModelParams({...modelParams, [param]: value})}
              isAdvancedMode={isAdvancedMode}
            />
            <div className="flex justify-between mt-6">
              <button
                onClick={() => setStep(4)}
                className={`px-6 py-2 rounded-lg ${secondaryBtn}`}
              >
                上一步
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !name.trim()}
                className={`px-6 py-2 rounded-lg text-white ${accentBtn} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {saving ? '保存中...' : '创建实例'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

