'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import SectionHeader from '@/components/section-header';
import { useVibe } from '@/app/providers';
import PersonaChat from '@/components/persona-chat';
import { fetchWithAuth } from '@/lib/auth-utils';
import ModelParameters from '@/components/model-parameters';
import UniverseStatus from '@/components/universe-status';
import { universeToast } from '@/components/universe-toast';
import { universeConfirm } from '@/components/universe-confirm';
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

interface PersonaInstance {
  _id: string;
  userId: string;
  name: string;
  description?: string;
  personaCode?: string;
  systemPrompt?: string;
  trainingSamples: TrainingSample[];
  modelParams: ModelParams;
  isTrained: boolean;
  trainingStatus?: 'idle' | 'training' | 'completed' | 'error';
  avatarUrl?: string;
  tags?: string[];
  isPublic?: boolean;
  isTrainingSetPublic?: boolean;
  trainingSetVisible?: boolean;
  trainingSamplesCount?: number;
  // 收藏相关字段
  sourceInstanceId?: string;
  sourceUserId?: string;
  isForked?: boolean;
  isInvalid?: boolean;
  modifiedAt?: string;
  // 收藏状态
  isFavorited?: boolean;
  // 开发层级相关字段
  developmentLevel?: number;
  originalUserId?: string;
  originalUserName?: string;
  developerUserId?: string;
  developerUserName?: string;
  forkChain?: string[];
  createdAt: string;
  updatedAt: string;
}

export default function PersonaInstanceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { mode } = useVibe();
  const [instance, setInstance] = useState<PersonaInstance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'edit' | 'info' | 'training'>('preview');
  const [model, setModel] = useState<string>('gpt-4o-mini');
  const [saving, setSaving] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [isForkedInstance, setIsForkedInstance] = useState(false); // 是否是收藏的实例
  const [isFavorited, setIsFavorited] = useState(false); // 是否已收藏
  const [favoriting, setFavoriting] = useState(false);

  // 编辑表单状态
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    systemPrompt: '',
    avatarUrl: '',
    tags: [] as string[],
    isPublic: false,
    isTrainingSetPublic: true,
    trainingSamples: [] as TrainingSample[],
    modelParams: {
      temperature: 0.7,
      topP: 0.9,
      topK: 50,
      maxTokens: 200,
      epochs: 3,
      learningRate: 0.001
    } as ModelParams
  });
  const [currentSample, setCurrentSample] = useState<TrainingSample>({ input: '', response: '' });

  // 获取实例的人格颜色
  const personaColors = instance?.personaCode ? getPersonaColors(instance.personaCode.toUpperCase(), mode) : null;
  const accentBtnClasses = instance?.personaCode ? getPersonaButtonClasses(instance.personaCode.toUpperCase(), mode) : (mode === 'waibi' ? 'bg-gray-600 hover:bg-gray-700' : 'bg-gray-500 hover:bg-gray-600');
  
  const panelClass = personaColors 
    ? (mode === 'waibi' ? `bg-black/90 ${personaColors.border} text-white` : `bg-white ${personaColors.border} text-gray-900`)
    : (mode === 'waibi' ? 'bg-black/90 border border-gray-700 text-white' : 'bg-white border border-gray-200 text-gray-900');
  const inputClass = personaColors
    ? (mode === 'waibi' ? `${personaColors.border} bg-gray-900/50 text-white placeholder-gray-500` : `${personaColors.border} bg-white text-gray-900 placeholder-gray-400`)
    : (mode === 'waibi' ? 'border border-gray-700 bg-gray-900/50 text-white placeholder-gray-500' : 'border border-gray-300 bg-white text-gray-900 placeholder-gray-400');
  const accentBtn = personaColors ? accentBtnClasses : (mode === 'waibi' ? 'bg-gray-600 hover:bg-gray-700' : 'bg-gray-500 hover:bg-gray-600');
  const secondaryBtn = personaColors
    ? (mode === 'waibi' ? `${personaColors.border} bg-gray-800/50 hover:bg-gray-800` : `${personaColors.border} bg-gray-50 hover:bg-gray-100`)
    : (mode === 'waibi' ? 'border border-gray-700 bg-gray-800/50 hover:bg-gray-800' : 'border border-gray-300 bg-gray-50 hover:bg-gray-100');

  useEffect(() => {
    fetchInstance();
  }, [id]);

  const fetchInstance = async () => {
    setLoading(true);
    setError('');
    try {
      // 尝试使用认证请求
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      let res;
      if (token) {
        res = await fetchWithAuth(`/api/persona-instance/${id}`);
      } else {
        // 未登录时，尝试获取公开实例
        res = await fetch(`/api/persona-instance/${id}`);
      }
      
      if (res.ok) {
        const data = await res.json();
        if (data.instance) {
          setInstance(data.instance);
          // 检查是否是所有者
          const currentUserId = token ? (await fetch('/api/auth/me', { 
            headers: { Authorization: `Bearer ${token}` } 
          }).then(r => r.json()).then(d => d?.user?.userId).catch(() => null)) : null;
          const owner = currentUserId === data.instance.userId;
          setIsOwner(owner);
          // 检查是否是收藏的实例（isForked && sourceInstanceId 存在）
          setIsForkedInstance(data.instance.isForked === true && !!data.instance.sourceInstanceId && owner);
          // 设置收藏状态
          setIsFavorited(data.instance.isFavorited === true);
          
          setEditForm({
            name: data.instance.name || '',
            description: data.instance.description || '',
            systemPrompt: data.instance.systemPrompt || '',
            avatarUrl: data.instance.avatarUrl || '',
            tags: data.instance.tags || [],
            isPublic: data.instance.isPublic || false,
            isTrainingSetPublic: data.instance.isTrainingSetPublic !== undefined ? data.instance.isTrainingSetPublic : true,
            trainingSamples: data.instance.trainingSamples || [],
            modelParams: data.instance.modelParams || {
              temperature: 0.7,
              topP: 0.9,
              topK: 50,
              maxTokens: 200,
              epochs: 3,
              learningRate: 0.001
            }
          });
        } else {
          setError('实例不存在');
        }
      } else {
        setError('加载失败');
      }
    } catch (err) {
      setError('加载失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!instance) return;
    setSaving(true);
    try {
      const res = await fetchWithAuth(`/api/persona-instance/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      if (res.ok) {
        const data = await res.json();
        setInstance(data.instance);
        setIsEditing(false);
        setActiveTab('preview');
        universeToast.success('保存成功');
      } else {
        const data = await res.json();
        universeToast.error(data.message || '保存失败');
      }
    } catch (err) {
      universeToast.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleAddSample = () => {
    if (!currentSample.input.trim() || !currentSample.response.trim()) {
      universeToast.warning('请输入完整的训练样本');
      return;
    }
    setEditForm({
      ...editForm,
      trainingSamples: [...editForm.trainingSamples, currentSample]
    });
    setCurrentSample({ input: '', response: '' });
  };

  const handleDeleteSample = (index: number) => {
    setEditForm({
      ...editForm,
      trainingSamples: editForm.trainingSamples.filter((_, i) => i !== index)
    });
  };

  const handleUpdateSample = (index: number, updatedSample: TrainingSample) => {
    const newSamples = [...editForm.trainingSamples];
    newSamples[index] = updatedSample;
    setEditForm({
      ...editForm,
      trainingSamples: newSamples
    });
  };

  const handleDelete = async () => {
    const confirmed = await universeConfirm.confirm(
      '确定要删除这个模型实例吗？此操作不可恢复。',
      { type: 'danger', title: '删除模型实例', confirmText: '删除', cancelText: '取消' }
    );
    if (!confirmed) return;
    try {
      const res = await fetchWithAuth(`/api/persona-instance/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        router.push('/me');
      } else {
        const data = await res.json();
        universeToast.error(data.message || '删除失败');
      }
    } catch (err) {
      universeToast.error('删除失败');
    }
  };

  const handleFavorite = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!token) {
      universeToast.warning('请先登录后再进行此操作');
      return;
    }

    setFavoriting(true);
    try {
      const res = await fetchWithAuth(`/api/persona-instance/${id}/favorite`, {
        method: 'POST'
      });
      if (res.ok) {
        const data = await res.json();
        universeToast.success('收藏成功！已保存到你的模型实例中');
        setIsFavorited(true); // 更新收藏状态
        // 可以选择刷新页面或只更新状态
        // router.push('/me');
      } else {
        const data = await res.json();
        universeToast.error(data.message || '收藏失败');
      }
    } catch (err) {
      universeToast.error('收藏失败');
    } finally {
      setFavoriting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-2 max-w-6xl">
        <UniverseStatus type="loading" context="instance" />
      </div>
    );
  }

  if (error || !instance) {
    return (
      <div className="container mx-auto px-4 py-2 max-w-6xl">
        <UniverseStatus
          type="error"
          context="instance"
          message={error || '实例不存在'}
          actionHref="/"
          actionLabel="返回首页"
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-2 max-w-6xl">
      <div className="mb-4">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className={`text-3xl font-bold ${mode === 'waibi' ? 'text-white' : 'text-gray-900'}`}>
            {instance.name}
          </h1>
          {instance.isForked && instance.developmentLevel && instance.developmentLevel > 1 && (
            <span className={`px-3 py-1 rounded-lg text-sm font-medium ${
              mode === 'waibi' 
                ? instance.developmentLevel === 2 
                  ? 'bg-blue-500/30 text-blue-300 border border-blue-500/50' 
                  : 'bg-purple-500/30 text-purple-300 border border-purple-500/50'
                : instance.developmentLevel === 2
                  ? 'bg-blue-100 text-blue-700 border border-blue-300'
                  : 'bg-purple-100 text-purple-700 border border-purple-300'
            }`}>
              {instance.developmentLevel === 2 ? ' 二次开发' :
               instance.developmentLevel === 3 ? ' 三次开发' :
               ` ${instance.developmentLevel}次开发`}
            </span>
          )}
        </div>
        {instance.description && (
          <p className={`mt-2 ${mode === 'waibi' ? 'text-gray-400' : 'text-gray-600'}`}>
            {instance.description.length > 50 ? instance.description.slice(0, 50) + '...' : instance.description}
          </p>
        )}
        {instance.isForked && instance.originalUserName && (
          <div className={`mt-3 px-4 py-2 rounded-lg ${
            mode === 'waibi' 
              ? 'bg-yellow-500/20 border border-yellow-500/30' 
              : 'bg-yellow-50 border border-yellow-200'
          }`}>
            <div className={`text-sm font-medium ${mode === 'waibi' ? 'text-yellow-300' : 'text-yellow-700'}`}>
              原创作者: <span className="font-bold">{instance.originalUserName}</span>
            </div>
            {instance.developerUserName && (
              <div className={`text-sm mt-1 ${mode === 'waibi' ? 'text-blue-300' : 'text-blue-700'}`}>
                🔧 二创作者: <span className="font-bold">{instance.developerUserName}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 操作按钮 */}
      <div className="flex items-center gap-3 mt-6 mb-6">
        <button
          onClick={() => setActiveTab('preview')}
          className={`px-4 py-2 rounded-lg transition ${activeTab === 'preview' ? accentBtn + ' text-white' : secondaryBtn}`}
        >
          预览交流
        </button>
        {instance.isPublic && (
          <button
            onClick={() => setActiveTab('training')}
            className={`px-4 py-2 rounded-lg transition ${activeTab === 'training' ? accentBtn + ' text-white' : secondaryBtn}`}
          >
            训练集
            {instance.trainingSetVisible === false && (
              <span className="ml-2 text-xs opacity-70">(已隐藏)</span>
            )}
          </button>
        )}
        {isOwner && !isForkedInstance && (
          <button
            onClick={() => setActiveTab('edit')}
            className={`px-4 py-2 rounded-lg transition ${activeTab === 'edit' ? accentBtn + ' text-white' : secondaryBtn}`}
          >
            编辑信息
          </button>
        )}
        {isForkedInstance && (
          <button
            onClick={() => router.push(`/persona-instance/create?template=${id}`)}
            className={`px-4 py-2 rounded-lg transition ${accentBtn} text-white`}
          >
            二次开发
          </button>
        )}
        <button
          onClick={() => setActiveTab('info')}
          className={`px-4 py-2 rounded-lg transition ${activeTab === 'info' ? accentBtn + ' text-white' : secondaryBtn}`}
        >
          详细信息
        </button>
        <div className="flex-1"></div>
        {!isOwner && instance.isPublic && (
          isFavorited ? (
            <button
              disabled
              className={`px-4 py-2 rounded-lg transition ${
                mode === 'waibi' 
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              已收藏
            </button>
          ) : (
            <button
              onClick={handleFavorite}
              disabled={favoriting}
              className={`px-4 py-2 rounded-lg transition text-white ${accentBtn} disabled:opacity-50`}
            >
              {favoriting ? '收藏中...' : '收藏'}
            </button>
          )
        )}
        {isOwner && (
          <button
            onClick={handleDelete}
            className={`px-4 py-2 rounded-lg transition ${mode === 'waibi' ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400' : 'bg-red-50 hover:bg-red-100 text-red-600'}`}
          >
            删除
          </button>
        )}
      </div>

      {/* 预览交流 */}
      {activeTab === 'preview' && (
        <div className={`rounded-xl shadow-md p-6 ${panelClass}`}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">选择模型</label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className={`px-3 py-2 rounded-lg ${inputClass}`}
            >
              <option value="gpt-4o-mini">GPT-4o Mini</option>
              <option value="gpt-4o">GPT-4o</option>
              <option value="gpt-4-turbo">GPT-4 Turbo</option>
            </select>
          </div>
          <PersonaChat instanceId={id} model={model} />
        </div>
      )}

      {/* 训练集 */}
      {activeTab === 'training' && instance.isPublic && (
        <div className={`rounded-xl shadow-md p-6 ${panelClass}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold">
              训练集 ({instance.trainingSamples?.length || instance.trainingSamplesCount || 0} 条)
            </h3>
            {instance.trainingSetVisible === false && (
              <span className={`text-sm px-3 py-1 rounded-full ${
                mode === 'waibi' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-100 text-yellow-700'
              }`}>
                ⚠️ 训练集已隐藏
              </span>
            )}
          </div>
          {instance.trainingSetVisible === false ? (
            <div className={`text-center py-12 ${mode === 'waibi' ? 'text-gray-400' : 'text-gray-500'}`}>
              <div className="text-4xl mb-4">🔒</div>
              <div className="text-lg mb-2">训练集不可见</div>
              <div className="text-sm opacity-70">
                模型拥有者已选择隐藏训练集，无法查看具体内容
              </div>
              {instance.trainingSamplesCount && (
                <div className={`text-sm mt-4 ${mode === 'waibi' ? 'text-gray-500' : 'text-gray-600'}`}>
                  训练样本数量: {instance.trainingSamplesCount} 条
                </div>
              )}
            </div>
          ) : instance.trainingSamples && instance.trainingSamples.length > 0 ? (
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {instance.trainingSamples.map((sample, index) => (
                <div key={index} className={`rounded-lg p-4 border ${
                  personaColors
                    ? (mode === 'waibi' ? `bg-gray-900/50 ${personaColors.border}` : `bg-gray-50 ${personaColors.border}`)
                    : (mode === 'waibi' ? 'bg-gray-900/50 border-gray-700' : 'bg-gray-50 border-gray-200')
                }`}>
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
                      personaColors
                        ? (mode === 'waibi' ? `${personaColors.bg}/20 ${personaColors.text}` : `${personaColors.bg}/10 ${personaColors.text}`)
                        : (mode === 'waibi' ? 'bg-gray-600/20 text-gray-300' : 'bg-gray-100 text-gray-700')
                    }`}>
                      📍 {sample.scenario}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className={`text-center py-12 ${mode === 'waibi' ? 'text-gray-400' : 'text-gray-500'}`}>
              暂无训练样本
            </div>
          )}
        </div>
      )}

      {/* 编辑信息 */}
      {activeTab === 'edit' && (
        <div className={`rounded-xl shadow-md p-6 ${panelClass}`}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">实例名称</label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg ${inputClass}`}
                placeholder="输入实例名称"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">描述</label>
              <textarea
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg ${inputClass}`}
                rows={3}
                placeholder="输入实例描述"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">系统提示词</label>
              <textarea
                value={editForm.systemPrompt}
                onChange={(e) => setEditForm({ ...editForm, systemPrompt: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg ${inputClass}`}
                rows={6}
                placeholder="输入系统提示词"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">头像URL</label>
              <input
                type="text"
                value={editForm.avatarUrl}
                onChange={(e) => setEditForm({ ...editForm, avatarUrl: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg ${inputClass}`}
                placeholder="输入头像URL"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">标签</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {editForm.tags.map((tag, index) => (
                  <span
                    key={index}
                    className={`px-2 py-1 rounded text-sm ${
                      personaColors
                        ? (mode === 'waibi' ? `${personaColors.bg}/20 ${personaColors.text}` : `${personaColors.bg}/10 ${personaColors.text}`)
                        : (mode === 'waibi' ? 'bg-gray-600/20 text-gray-300' : 'bg-gray-100 text-gray-700')
                    }`}
                  >
                    {tag}
                    <button
                      onClick={() => setEditForm({ ...editForm, tags: editForm.tags.filter((_, i) => i !== index) })}
                      className="ml-2"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                value={editForm.tags.join(',')}
                onChange={(e) => setEditForm({ ...editForm, tags: e.target.value.split(',').filter(t => t.trim()) })}
                className={`w-full px-3 py-2 rounded-lg ${inputClass}`}
                placeholder="输入标签，用逗号分隔"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={editForm.isPublic}
                onChange={(e) => setEditForm({ ...editForm, isPublic: e.target.checked })}
                className="w-4 h-4"
              />
              <label className="text-sm">公开此实例</label>
            </div>

            {editForm.isPublic && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editForm.isTrainingSetPublic}
                  onChange={(e) => setEditForm({ ...editForm, isTrainingSetPublic: e.target.checked })}
                  className="w-4 h-4"
                />
                <label className="text-sm">允许其他用户查看训练集</label>
              </div>
            )}

            <div className="pt-4 border-t">
              <h3 className="text-lg font-semibold mb-4">训练集管理</h3>
              <div className="space-y-4 mb-4">
                <div className={`p-4 rounded-lg border ${mode === 'waibi' ? 'bg-gray-900/50 border-emerald-400/30' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-2">用户输入</label>
                      <input
                        type="text"
                        value={currentSample.input}
                        onChange={(e) => setCurrentSample({ ...currentSample, input: e.target.value })}
                        className={`w-full px-3 py-2 rounded-lg ${inputClass}`}
                        placeholder="输入用户的问题或对话"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">AI回复</label>
                      <textarea
                        value={currentSample.response}
                        onChange={(e) => setCurrentSample({ ...currentSample, response: e.target.value })}
                        className={`w-full px-3 py-2 rounded-lg ${inputClass}`}
                        rows={3}
                        placeholder="输入AI的回复"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">场景（可选）</label>
                      <input
                        type="text"
                        value={currentSample.scenario || ''}
                        onChange={(e) => setCurrentSample({ ...currentSample, scenario: e.target.value })}
                        className={`w-full px-3 py-2 rounded-lg ${inputClass}`}
                        placeholder="例如: 工作场景、生活场景等"
                      />
                    </div>
                    <button
                      onClick={handleAddSample}
                      className={`w-full px-4 py-2 rounded-lg text-white transition ${accentBtn}`}
                    >
                      + 添加训练样本
                    </button>
                  </div>
                </div>

                {editForm.trainingSamples.length > 0 && (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    <div className="text-sm font-medium mb-2">
                      当前训练样本 ({editForm.trainingSamples.length} 条)
                    </div>
                    {editForm.trainingSamples.map((sample, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg border ${mode === 'waibi' ? 'bg-gray-900/50 border-emerald-400/30' : 'bg-gray-50 border-gray-200'}`}
                      >
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1 space-y-2">
                            <div>
                              <span className="text-xs opacity-70">输入:</span>
                              <div className="text-sm mt-1">{sample.input}</div>
                            </div>
                            <div>
                              <span className="text-xs opacity-70">回复:</span>
                              <div className="text-sm mt-1">{sample.response}</div>
                            </div>
                            {sample.scenario && (
                              <div className={`text-xs px-2 py-1 rounded inline-block mt-1 ${
                                personaColors
                        ? (mode === 'waibi' ? `${personaColors.bg}/20 ${personaColors.text}` : `${personaColors.bg}/10 ${personaColors.text}`)
                        : (mode === 'waibi' ? 'bg-gray-600/20 text-gray-300' : 'bg-gray-100 text-gray-700')
                              }`}>
                                📍 {sample.scenario}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => handleDeleteSample(index)}
                            className={`px-3 py-1 rounded text-sm ${mode === 'waibi' ? 'text-red-400 hover:bg-red-500/20' : 'text-red-600 hover:bg-red-50'}`}
                          >
                            删除
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t">
              <h3 className="text-lg font-semibold mb-4">模型参数</h3>
              <ModelParameters 
                params={editForm.modelParams} 
                onParamChange={(param, value) => setEditForm({ 
                  ...editForm, 
                  modelParams: { ...editForm.modelParams, [param]: value } 
                })} 
                isAdvancedMode={true}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className={`px-6 py-2 rounded-lg text-white transition ${accentBtn} disabled:opacity-50`}
              >
                {saving ? '保存中...' : '保存'}
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  fetchInstance();
                }}
                className={`px-6 py-2 rounded-lg transition ${secondaryBtn}`}
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 详细信息 */}
      {activeTab === 'info' && (
        <div className={`rounded-xl shadow-md p-6 ${panelClass}`}>
          <div className="space-y-4">
            {instance.isForked && instance.developmentLevel && instance.developmentLevel > 1 && (
              <div className={`p-4 rounded-lg mb-4 ${
                mode === 'waibi' 
                  ? 'bg-blue-500/10 border border-blue-500/30' 
                  : 'bg-blue-50 border border-blue-200'
              }`}>
                <div className={`text-sm font-medium mb-2 ${
                  mode === 'waibi' ? 'text-blue-300' : 'text-blue-700'
                }`}>
                  {instance.developmentLevel === 2 ? '🔄 二次开发' : 
                   instance.developmentLevel === 3 ? '🔄 三次开发' : 
                   `🔄 ${instance.developmentLevel}次开发`}
                </div>
                {instance.originalUserName && (
                  <div className={`text-sm ${mode === 'waibi' ? 'text-yellow-300' : 'text-yellow-700'}`}>
                    原创作者: <span className="font-bold">{instance.originalUserName}</span>
                  </div>
                )}
                {instance.developerUserName && (
                  <div className={`text-sm mt-1 ${mode === 'waibi' ? 'text-blue-300' : 'text-blue-700'}`}>
                    🔧 二创作者: <span className="font-bold">{instance.developerUserName}</span>
                  </div>
                )}
                {instance.sourceUserId && instance.sourceUserId !== instance.originalUserId && (
                  <div className={`text-xs mt-1 ${mode === 'waibi' ? 'text-gray-400' : 'text-gray-600'}`}>
                    来源用户ID: {instance.sourceUserId}
                  </div>
                )}
              </div>
            )}
            <div>
              <div className="text-sm opacity-70 mb-1">实例ID</div>
              <div className="font-mono text-sm">{instance._id}</div>
            </div>
            <div>
              <div className="text-sm opacity-70 mb-1">创建时间</div>
              <div>{new Date(instance.createdAt).toLocaleString('zh-CN')}</div>
            </div>
            <div>
              <div className="text-sm opacity-70 mb-1">更新时间</div>
              <div>{new Date(instance.updatedAt).toLocaleString('zh-CN')}</div>
            </div>
            <div>
              <div className="text-sm opacity-70 mb-1">训练状态</div>
              <div>{instance.isTrained ? '已训练' : '未训练'}</div>
            </div>
            <div>
              <div className="text-sm opacity-70 mb-1">训练样本数量</div>
              <div>{instance.trainingSamples?.length || 0} 条</div>
            </div>
            {instance.personaCode && (
              <div>
                <div className="text-sm opacity-70 mb-1">关联人格</div>
                <div>{instance.personaCode.toUpperCase()}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

