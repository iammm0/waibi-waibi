'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import SectionHeader from '@/components/section-header';
import { useVibe } from '@/app/providers';
import ModelParameters from '@/components/model-parameters';
import { MBTI_TYPES } from '@/lib/mbti';
import { fetchWithAuth } from '@/lib/auth-utils';
import AvatarEditor from '@/components/avatar-editor';
import { universeToast } from '@/components/universe-toast';
import { getPersonaColors, getPersonaButtonClasses } from '@/lib/persona-colors';

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
  const searchParams = useSearchParams();
  const { mode } = useVibe();
  const [step, setStep] = useState(1); // 1: 选择类型, 2: 基本信息, 3: 提示词, 4: 训练样本, 5: 模型参数
  const [instanceType, setInstanceType] = useState<'blank' | 'persona' | 'template'>('blank');
  const [selectedPersona, setSelectedPersona] = useState<string>('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [forkedInstances, setForkedInstances] = useState<any[]>([]); // 收藏的模型实例列表
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

  // 获取选中人格的颜色
  const selectedPersonaColors = selectedPersona ? getPersonaColors(selectedPersona.toUpperCase(), mode) : null;
  const defaultPanelClass = mode === 'waibi' ? 'bg-black/90 border border-gray-700 text-white' : 'bg-white border border-gray-200 text-gray-900';
  const defaultInputClass = mode === 'waibi' ? 'border border-gray-700 bg-gray-900/50 text-white' : 'border border-gray-300 bg-white text-gray-900';
  const defaultAccentBtn = mode === 'waibi' ? 'bg-gray-600 hover:bg-gray-700' : 'bg-gray-500 hover:bg-gray-600';
  const defaultSecondaryBtn = mode === 'waibi' ? 'border border-gray-700 bg-gray-800/50 hover:bg-gray-800' : 'border border-gray-300 bg-gray-50 hover:bg-gray-100';
  
  const panelClass = selectedPersonaColors 
    ? (mode === 'waibi' ? `bg-black/90 ${selectedPersonaColors.border} text-white` : `bg-white ${selectedPersonaColors.border} text-gray-900`)
    : defaultPanelClass;
  const inputClass = selectedPersonaColors
    ? (mode === 'waibi' ? `${selectedPersonaColors.border} bg-gray-900/50 text-white` : `${selectedPersonaColors.border} bg-white text-gray-900`)
    : defaultInputClass;
  const accentBtn = selectedPersonaColors 
    ? getPersonaButtonClasses(selectedPersona.toUpperCase(), mode)
    : defaultAccentBtn;
  const secondaryBtn = selectedPersonaColors
    ? (mode === 'waibi' ? `${selectedPersonaColors.border} bg-gray-800/50 hover:bg-gray-800` : `${selectedPersonaColors.border} bg-gray-50 hover:bg-gray-100`)
    : defaultSecondaryBtn;
  const stepIndicatorColor = selectedPersonaColors
    ? (mode === 'waibi' ? selectedPersonaColors.bg : selectedPersonaColors.bg)
    : (mode === 'waibi' ? 'bg-gray-600' : 'bg-gray-500');
  const stepIndicatorText = selectedPersonaColors
    ? (mode === 'waibi' ? selectedPersonaColors.text : 'text-white')
    : 'text-white';

  // 检查URL参数，如果有template参数，加载模板
  useEffect(() => {
    const templateId = searchParams?.get('template');
    if (templateId) {
      setInstanceType('template');
      setSelectedTemplateId(templateId);
      // 加载模板数据
      fetchWithAuth(`/api/persona-instance/${templateId}`)
        .then(async (r) => {
          if (r.ok) {
            const data = await r.json();
            if (data.instance) {
              setName(data.instance.name || '');
              setDescription(data.instance.description || '');
              setSystemPrompt(data.instance.systemPrompt || '');
              setTrainingSamples(data.instance.trainingSamples || []);
              setModelParams(data.instance.modelParams || {
                temperature: 0.7,
                topP: 0.9,
                topK: 50,
                maxTokens: 200,
                epochs: 3,
                learningRate: 0.001
              });
              setAvatarUrl(data.instance.avatarUrl || '');
              setTags(data.instance.tags || []);
              setStep(2); // 跳转到基本信息步骤
            }
          }
        })
        .catch((err) => {
          console.error('加载模板失败:', err);
        });
    }
  }, [searchParams]);

  // 检查URL参数，如果有persona参数，自动选择人格并加载训练集
  useEffect(() => {
    const personaCode = searchParams?.get('persona');
    if (personaCode) {
      setInstanceType('persona');
      setSelectedPersona(personaCode);
      // 加载该人格的训练集
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      if (token) {
        fetchWithAuth(`/api/persona/${personaCode.toLowerCase()}/training`)
          .then(async (r) => {
            if (r.ok) {
              const data = await r.json();
              if (data.items && data.items.length > 0) {
                // 转换为前端需要的格式
                const samples = data.items.map((item: any) => ({
                  input: item.input || '',
                  response: item.response || '',
                  scenario: item.scenario || undefined,
                }));
                setTrainingSamples(samples);
              }
            }
          })
          .catch((err) => {
            console.error('加载训练集失败:', err);
          });
      }
    }
  }, [searchParams]);

  // 加载收藏的模型实例列表
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (token) {
      fetchWithAuth('/api/persona-instance')
        .then(async (r) => {
          if (r.ok) {
            const data = await r.json();
            if (data.instances) {
              // 只显示收藏的实例（isForked === true）
              const forked = data.instances.filter((inst: any) => inst.isForked === true);
              setForkedInstances(forked);
            }
          }
        })
        .catch((err) => {
          console.error('加载收藏实例失败:', err);
        });
    }
  }, []);

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
      universeToast.warning('请输入实例名称');
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
          isTrainingSetPublic,
          // 如果基于收藏模型创建，传递模板ID
          templateInstanceId: instanceType === 'template' ? selectedTemplateId : null
        }),
      });

      if (res.ok) {
        const data = await res.json();
        universeToast.success('创建成功！');
        router.push(`/persona-instance/${data.instance._id}`);
      } else {
        const errorData = await res.json().catch(() => ({ message: '创建失败' }));
        universeToast.error(`创建失败: ${errorData.message || '未知错误'}`);
      }
    } catch (err: any) {
      console.error('创建失败:', err);
      universeToast.error(`创建失败: ${err.message || '网络错误'}`);
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
                  ? `${stepIndicatorColor} ${stepIndicatorText}`
                  : mode === 'waibi' ? 'bg-gray-800 text-gray-400' : 'bg-gray-200 text-gray-500'
              }`}>
                {s}
              </div>
              {s < 5 && (
                <div className={`flex-1 h-1 mx-2 ${
                  step > s 
                    ? stepIndicatorColor
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <button
                onClick={() => {
                  setInstanceType('blank');
                  setSelectedPersona('');
                  setSelectedTemplateId('');
                }}
                className={`p-6 rounded-lg border-2 transition ${
                  instanceType === 'blank'
                    ? mode === 'waibi' ? 'border-gray-600 bg-gray-600/20' : 'border-gray-500 bg-gray-50'
                    : mode === 'waibi' ? 'border-gray-700 hover:border-gray-600' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-lg font-semibold mb-2">空白模板</div>
                <div className="text-sm opacity-80">从零开始，完全自定义你的人格模型</div>
              </button>
              <button
                onClick={() => {
                  setInstanceType('persona');
                  setSelectedTemplateId('');
                }}
                className={`p-6 rounded-lg border-2 transition ${
                  instanceType === 'persona'
                    ? selectedPersonaColors
                      ? (mode === 'waibi' ? `${selectedPersonaColors.border} ${selectedPersonaColors.bg}/20` : `${selectedPersonaColors.border} ${selectedPersonaColors.bg}/10`)
                      : (mode === 'waibi' ? 'border-gray-600 bg-gray-600/20' : 'border-gray-500 bg-gray-50')
                    : mode === 'waibi' ? 'border-gray-700 hover:border-gray-600' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-lg font-semibold mb-2">基于预制人格</div>
                <div className="text-sm opacity-80">基于MBTI人格类型，使用预设提示词</div>
              </button>
              <button
                onClick={() => setInstanceType('template')}
                className={`p-6 rounded-lg border-2 transition ${
                  instanceType === 'template'
                    ? mode === 'waibi' ? 'border-gray-600 bg-gray-600/20' : 'border-gray-500 bg-gray-50'
                    : mode === 'waibi' ? 'border-gray-700 hover:border-gray-600' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-lg font-semibold mb-2">基于收藏模型</div>
                <div className="text-sm opacity-80">基于你收藏的模型进行二次创作</div>
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
                      {p.name} - {p.description.length > 50 ? p.description.slice(0, 50) + '...' : p.description}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {instanceType === 'template' && (
              <div className="mt-6">
                <label className="block text-sm font-medium mb-2">选择收藏的模型</label>
                {forkedInstances.length === 0 ? (
                  <div className={`p-4 rounded-lg ${mode === 'waibi' ? 'bg-gray-800/50 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
                    你还没有收藏任何模型实例
                  </div>
                ) : (
                  <select
                    value={selectedTemplateId}
                    onChange={(e) => {
                      const templateId = e.target.value;
                      setSelectedTemplateId(templateId);
                      if (templateId) {
                        // 加载模板数据
                        fetchWithAuth(`/api/persona-instance/${templateId}`)
                          .then(async (r) => {
                            if (r.ok) {
                              const data = await r.json();
                              if (data.instance) {
                                setName(data.instance.name || '');
                                setDescription(data.instance.description || '');
                                setSystemPrompt(data.instance.systemPrompt || '');
                                setTrainingSamples(data.instance.trainingSamples || []);
                                setModelParams(data.instance.modelParams || {
                                  temperature: 0.7,
                                  topP: 0.9,
                                  topK: 50,
                                  maxTokens: 200,
                                  epochs: 3,
                                  learningRate: 0.001
                                });
                                setAvatarUrl(data.instance.avatarUrl || '');
                                setTags(data.instance.tags || []);
                              }
                            }
                          })
                          .catch((err) => {
                            console.error('加载模板失败:', err);
                          });
                      }
                    }}
                    className={`w-full p-3 rounded-lg ${inputClass}`}
                  >
                    <option value="">请选择收藏的模型</option>
                    {forkedInstances.map((inst) => (
                      <option key={inst._id} value={inst._id}>
                        {inst.name} {inst.originalUserName ? `(原创: ${inst.originalUserName})` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setStep(2)}
                disabled={
                  (instanceType === 'persona' && !selectedPersona) ||
                  (instanceType === 'template' && !selectedTemplateId)
                }
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
                      selectedPersonaColors
                        ? (mode === 'waibi' ? `${selectedPersonaColors.bg}/20 ${selectedPersonaColors.text}` : `${selectedPersonaColors.bg}/10 ${selectedPersonaColors.text}`)
                        : (mode === 'waibi' ? 'bg-gray-600/20 text-gray-300' : 'bg-gray-100 text-gray-700')
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
                        selectedPersonaColors
                          ? (mode === 'waibi' ? `bg-gray-900/50 ${selectedPersonaColors.border}` : `bg-gray-50 ${selectedPersonaColors.border}`)
                          : (mode === 'waibi' ? 'bg-gray-900/50 border-gray-700' : 'bg-gray-50 border-gray-200')
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-medium mb-1">用户：{sample.input}</div>
                          <div className="mb-1">AI：{sample.response}</div>
                          {sample.scenario && (
                            <div className={`text-xs px-2 py-1 rounded inline-block mt-1 ${
                              selectedPersonaColors
                                ? (mode === 'waibi' ? `${selectedPersonaColors.bg}/20 ${selectedPersonaColors.text}` : `${selectedPersonaColors.bg}/10 ${selectedPersonaColors.text}`)
                                : (mode === 'waibi' ? 'bg-gray-600/20 text-gray-300' : 'bg-gray-100 text-gray-700')
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
                className={`text-sm ${
                  selectedPersonaColors
                    ? selectedPersonaColors.accent
                    : (mode === 'waibi' ? 'text-gray-300' : 'text-gray-700')
                }`}
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

