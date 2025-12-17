'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useVibe } from '@/app/providers';
import SectionHeader from '@/components/section-header';
import { fetchWithAuth } from '@/lib/auth-utils';
import UniverseStatus from '@/components/universe-status';
import { universeToast } from '@/components/universe-toast';

interface PersonaInstance {
  _id: string;
  userId: string;
  name: string;
  description?: string;
  personaCode?: string;
  avatarUrl?: string;
  tags?: string[];
  trainingSamples?: Array<{
    input: string;
    response: string;
    scenario?: string;
  }>;
  trainingSetVisible?: boolean;
  trainingSamplesCount?: number;
  // 作者信息
  authorName?: string;
  // 收藏状态
  isFavorited?: boolean;
  // 开发层级相关字段
  developmentLevel?: number;
  originalUserId?: string;
  originalUserName?: string;
  developerUserName?: string;
  isForked?: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function InstancesPage() {
  const { mode } = useVibe();
  const router = useRouter();
  const panelClass = mode === 'waibi' ? 'bg-black/90 border border-gray-700 text-white' : 'bg-white border border-gray-200 text-gray-900';
  const cardClass = mode === 'waibi' ? 'bg-gray-900/50 border border-gray-700 hover:border-gray-600' : 'bg-gray-50 border border-gray-200 hover:border-gray-300';
  const accentBtn = mode === 'waibi' 
    ? 'bg-gray-600 hover:bg-gray-700 text-white shadow-lg transition-all duration-200' 
    : 'bg-gray-500 hover:bg-gray-600 text-white shadow-lg transition-all duration-200';
  const inputClass = mode === 'waibi' ? 'border border-gray-700 bg-gray-900/50 text-white placeholder-gray-500' : 'border border-gray-300 bg-white text-gray-900 placeholder-gray-400';

  const [instances, setInstances] = useState<PersonaInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchInstances();
  }, [search]);

  const fetchInstances = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      params.append('limit', '30');
      
      // 如果用户已登录，传递token以获取收藏状态
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const res = await fetch(`/api/persona-instance/public?${params.toString()}`, {
        headers
      });
      if (res.ok) {
        const data = await res.json();
        setInstances(data.instances || []);
      } else {
        setError('加载失败');
      }
    } catch (err) {
      setError('加载失败');
    } finally {
      setLoading(false);
    }
  };

  const handleFavorite = async (instanceId: string) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!token) {
      universeToast.warning('请先登录后再进行此操作');
      return;
    }

    try {
      const res = await fetchWithAuth(`/api/persona-instance/${instanceId}/favorite`, {
        method: 'POST'
      });
      if (res.ok) {
        const data = await res.json();
        universeToast.success('收藏成功！已保存到你的模型实例中');
        // 更新收藏状态
        setInstances(instances.map(inst => 
          inst._id === instanceId 
            ? { ...inst, isFavorited: true }
            : inst
        ));
        // 可以选择刷新列表或只更新状态
        // router.push('/me');
      } else {
        const data = await res.json();
        universeToast.error(data.message || '收藏失败');
      }
    } catch (err) {
      universeToast.error('收藏失败');
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="container mx-auto px-4 py-2 max-w-6xl">
      <SectionHeader 
        title="开放实例"
        subtitle="探索其他用户创建的公开模型实例，可以查看训练集并收藏进行二次训练"
        actions={
          <Link
            href="/persona-instance/create"
            className={`px-4 py-2 rounded-lg text-white text-sm transition-all ${accentBtn}`}
          >
            立即创建
          </Link>
        }
      />


      {/* 搜索框 */}
      <div className={`rounded-xl shadow-md p-4 mt-6 mb-6 ${panelClass}`}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`w-full px-4 py-2 rounded-lg ${inputClass}`}
          placeholder="搜索模型实例..."
        />
      </div>

      {loading ? (
        <UniverseStatus type="loading" context="instance" />
      ) : error ? (
        <UniverseStatus
          type="error"
          context="instance"
          message={error}
          actionHref="/"
          actionLabel="返回首页"
        />
      ) : instances.length === 0 ? (
        <div className={`text-center py-12 ${mode === 'waibi' ? 'text-gray-400' : 'text-gray-500'}`}>
          <div>暂无公开模型实例</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {instances.map((instance) => (
            <Link
              key={instance._id}
              href={`/persona-instance/${instance._id}`}
              className={`group block rounded-xl shadow-md p-5 transition-all duration-300 ${cardClass} hover:shadow-xl hover:-translate-y-2 cursor-pointer`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {instance.avatarUrl && (
                    <img
                      src={instance.avatarUrl}
                      alt={instance.name}
                      className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 
                        className={`text-lg font-semibold truncate ${mode === 'waibi' ? 'text-white' : 'text-gray-900'}`}
                      >
                        {instance.name}
                      </h3>
                      {instance.isForked && instance.developmentLevel && instance.developmentLevel > 1 && (
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          mode === 'waibi' 
                            ? instance.developmentLevel === 2 
                              ? 'bg-blue-500/30 text-blue-300' 
                              : 'bg-purple-500/30 text-purple-300'
                            : instance.developmentLevel === 2
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-purple-100 text-purple-700'
                        }`}>
                          {instance.developmentLevel === 2 ? '二次开发' : 
                           instance.developmentLevel === 3 ? '三次开发' : 
                           `${instance.developmentLevel}次开发`}
                        </span>
                      )}
                    </div>
                    {instance.description && (
                      <div className={`text-xs mt-1 line-clamp-2 ${mode === 'waibi' ? 'text-gray-400' : 'text-gray-600'}`}>
                        {instance.description.length > 50 ? instance.description.slice(0, 50) + '...' : instance.description}
                      </div>
                    )}
                    {instance.isForked && instance.originalUserName && (
                      <div className={`text-xs mt-1 ${mode === 'waibi' ? 'text-yellow-400' : 'text-yellow-600'}`}>
                        原创作者: {instance.originalUserName}
                      </div>
                    )}
                    {instance.isForked && instance.developerUserName && (
                      <div className={`text-xs mt-1 ${mode === 'waibi' ? 'text-blue-400' : 'text-blue-600'}`}>
                        二创作者: {instance.developerUserName}
                      </div>
                    )}
                    {instance.authorName && (
                      <div className={`text-xs mt-1 flex items-center gap-1 ${mode === 'waibi' ? 'text-gray-400' : 'text-gray-500'}`}>
                        <span>作者: {instance.authorName}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {instance.tags && instance.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {instance.tags.slice(0, 3).map((tag, index) => (
                    <span
                      key={index}
                      className={`px-2 py-1 rounded text-xs ${
                        mode === 'waibi'
                          ? 'bg-emerald-400/20 text-emerald-300'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* 训练集信息 */}
              {instance.trainingSetVisible === false ? (
                <div className={`text-xs mb-3 ${mode === 'waibi' ? 'text-yellow-400' : 'text-yellow-600'}`}>
                  🔒 训练集已隐藏
                  {instance.trainingSamplesCount && ` (${instance.trainingSamplesCount} 条)`}
                </div>
              ) : instance.trainingSamples && instance.trainingSamples.length > 0 ? (
                <div className={`text-xs mb-3 ${mode === 'waibi' ? 'text-gray-400' : 'text-gray-600'}`}>
                  训练样本: {instance.trainingSamples.length} 条
                </div>
              ) : null}

              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-2 text-xs opacity-60">
                  <span>{formatDate(instance.updatedAt)}</span>
                </div>
                {instance.isFavorited ? (
                  <button
                    disabled
                    onClick={(e) => e.stopPropagation()}
                    className={`px-3 py-1 rounded text-sm transition ${
                      mode === 'waibi' 
                        ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    已收藏
                  </button>
                ) : (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleFavorite(instance._id);
                    }}
                    className={`px-3 py-1 rounded text-sm transition ${accentBtn} text-white`}
                  >
                    收藏
                  </button>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

