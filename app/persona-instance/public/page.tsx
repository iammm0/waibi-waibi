'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SectionHeader from '@/components/section-header';
import { useVibe } from '@/app/providers';
import PersonaChat from '@/components/persona-chat';
import { fetchWithAuth } from '@/lib/auth-utils';
import UniverseStatus from '@/components/universe-status';

interface PersonaInstance {
  _id: string;
  userId: string;
  name: string;
  description?: string;
  personaCode?: string;
  avatarUrl?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export default function PublicPersonaInstancePage() {
  const router = useRouter();
  const { mode } = useVibe();
  const [instances, setInstances] = useState<PersonaInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedInstanceId, setSelectedInstanceId] = useState<string>('');
  const [model, setModel] = useState<string>('gpt-4o-mini');
  const [search, setSearch] = useState('');

  const panelClass = mode === 'waibi' ? 'bg-black/90 border border-green-500/30 text-white' : 'bg-white border border-gray-200 text-gray-900';
  const cardClass = mode === 'waibi' ? 'bg-gray-900/50 border border-green-500/30 hover:border-green-500/50' : 'bg-gray-50 border border-gray-200 hover:border-gray-300';
  const inputClass = mode === 'waibi' ? 'border border-green-500/30 bg-gray-900/50 text-white placeholder-gray-500' : 'border border-gray-300 bg-white text-gray-900 placeholder-gray-400';
  const accentBtn = mode === 'waibi' ? 'bg-green-500 hover:bg-green-600' : 'bg-[var(--accent-cyan)] hover:brightness-110';

  useEffect(() => {
    fetchInstances();
  }, [search]);

  const fetchInstances = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      params.append('limit', '50');
      
      const res = await fetch(`/api/persona-instance/public?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setInstances(data.instances || []);
        if (data.instances && data.instances.length > 0 && !selectedInstanceId) {
          setSelectedInstanceId(data.instances[0]._id);
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

  return (
    <div className="container mx-auto px-4 py-2 max-w-6xl">
      <SectionHeader 
        title="公开人格模型实例"
        subtitle="探索其他用户创建的公开模型实例" 
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* 左侧：实例列表 */}
        <div className="lg:col-span-1 space-y-4">
          {/* 搜索框 */}
          <div className={`rounded-xl shadow-md p-4 ${panelClass}`}>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`w-full px-3 py-2 rounded-lg ${inputClass}`}
              placeholder="搜索实例..."
            />
          </div>

          {/* 实例列表 */}
          <div className={`rounded-xl shadow-md p-4 ${panelClass}`}>
            <h3 className="text-lg font-semibold mb-4">公开实例 ({instances.length})</h3>
            {loading ? (
              <div className="py-8">
                <UniverseStatus type="loading" context="instance" />
              </div>
            ) : error ? (
              <div className="py-8">
                <UniverseStatus
                  type="error"
                  context="instance"
                  message={error}
                  actionHref="/"
                  actionLabel="返回首页"
                />
              </div>
            ) : instances.length === 0 ? (
              <div className={`text-center py-8 ${mode === 'waibi' ? 'text-gray-400' : 'text-gray-500'}`}>
                暂无公开实例
              </div>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {instances.map((instance) => (
                  <div
                    key={instance._id}
                    onClick={() => setSelectedInstanceId(instance._id)}
                    className={`rounded-lg p-3 cursor-pointer transition ${
                      selectedInstanceId === instance._id
                        ? cardClass + ' ring-2 ring-green-500/50'
                        : cardClass
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {instance.avatarUrl && (
                        <img
                          src={instance.avatarUrl}
                          alt={instance.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate">{instance.name}</div>
                        {instance.description && (
                          <div className={`text-xs mt-1 line-clamp-2 ${mode === 'waibi' ? 'text-gray-400' : 'text-gray-600'}`}>
                            {instance.description}
                          </div>
                        )}
                        {instance.tags && instance.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {instance.tags.slice(0, 3).map((tag, index) => (
                              <span
                                key={index}
                                className={`text-xs px-2 py-0.5 rounded ${
                                  mode === 'waibi' ? 'bg-green-500/20 text-green-400' : 'bg-blue-100 text-blue-700'
                                }`}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 右侧：预览交流 */}
        <div className="lg:col-span-2">
          {selectedInstanceId ? (
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
              <PersonaChat instanceId={selectedInstanceId} model={model} />
            </div>
          ) : (
            <div className={`rounded-xl shadow-md p-12 text-center ${panelClass}`}>
              <div className={`text-4xl mb-4 ${mode === 'waibi' ? 'text-gray-500' : 'text-gray-400'}`}>
                💬
              </div>
              <div className={`text-lg ${mode === 'waibi' ? 'text-gray-400' : 'text-gray-500'}`}>
                请选择一个模型实例开始交流
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

