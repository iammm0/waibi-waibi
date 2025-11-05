"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useVibe } from '@/app/providers';
import AvatarEditor from '@/components/avatar-editor';
import { fetchWithAuth } from '@/lib/auth-utils';
import SectionHeader from '@/components/section-header';
import { MBTI_TYPES } from '@/lib/mbti';

type Me = { 
  user: { 
    userId: string; 
    username?: string; 
    name?: string; 
    email?: string; 
    phone?: string; 
    avatarUrl?: string;
    profileVisibility?: {
      email?: 'public' | 'private';
      phone?: 'public' | 'private';
      username?: 'public' | 'private';
      avatarUrl?: 'public' | 'private';
      name?: 'public' | 'private';
    };
  } 
};

interface TrainingSample {
  _id: string;
  personaCode: string;
  input: string;
  response: string;
  scenario?: string;
  createdAt: string;
}

interface Subscription {
  active: boolean;
  plan?: string;
  startDate?: string;
  endDate?: string;
  price?: number;
}

export default function MePage() {
  const { mode } = useVibe();
  const router = useRouter();
  const panelClass = mode === 'waibi' ? 'bg-black/90 border border-green-500/30 text-white' : 'bg-white border border-gray-200 text-gray-900';
  const secondaryBtn = mode === 'waibi' ? 'border border-green-500/30 bg-gray-800/50 hover:bg-gray-800' : 'border border-gray-300 bg-gray-50 hover:bg-gray-100';
  const accentBtn = mode === 'waibi' ? 'bg-green-500 hover:bg-green-600' : 'bg-[var(--accent-cyan)] hover:brightness-110';
  const inputClass = mode === 'waibi' ? 'border border-green-500/30 bg-gray-900/50 text-white' : 'border border-gray-300 bg-white text-gray-900';

  const [me, setMe] = useState<Me["user"] | null>(null);
  const [error, setError] = useState('');
  const [showAvatarEditor, setShowAvatarEditor] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [trainingSamples, setTrainingSamples] = useState<TrainingSample[]>([]);
  const [selectedPersonaFilter, setSelectedPersonaFilter] = useState<string>('all'); // 人格筛选：'all' 或具体人格代码
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(false);
  const [editForm, setEditForm] = useState({
    username: '',
    name: '',
    email: '',
    phone: '',
    profileVisibility: {
      email: 'private' as 'public' | 'private',
      phone: 'private' as 'public' | 'private',
      username: 'public' as 'public' | 'private',
      avatarUrl: 'public' as 'public' | 'private',
      name: 'public' as 'public' | 'private',
    },
  });

  const fetchMe = async () => {
    setError('');
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!token) { setMe(null); return; }
    
    try {
      const res = await fetchWithAuth('/api/auth/me');
      if (res.ok) {
        const data: Me = await res.json();
        setMe(data.user);
      } else if (res.status === 401) {
        setMe(null);
        setError('未登录');
      } else {
        setError('获取用户信息失败');
      }
    } catch (err) {
      setError('获取用户信息失败');
    }
  };

  const fetchTrainingSamples = async () => {
    if (!me) return;
    try {
      const res = await fetchWithAuth('/api/me/training');
      if (res.ok) {
        const data = await res.json();
        setTrainingSamples(data.items || []);
      }
    } catch (err) {
      console.error('获取训练样本失败:', err);
    }
  };

  const fetchSubscription = async () => {
    setLoadingSubscription(true);
    try {
      const res = await fetchWithAuth('/api/subscription');
      if (res.ok) {
        const data = await res.json();
        setSubscription(data.subscription || { active: false, price: 20 });
      }
    } catch (err) {
      console.error('获取订阅状态失败:', err);
    } finally {
      setLoadingSubscription(false);
    }
  };

  useEffect(() => { 
    fetchMe();
    fetchSubscription();
  }, []);

  useEffect(() => {
    if (me) {
      fetchTrainingSamples();
    }
  }, [me]);

  useEffect(() => {
    if (me) {
      setEditForm({
        username: me.username || '',
        name: me.name || '',
        email: me.email || '',
        phone: me.phone || '',
        profileVisibility: {
          email: me.profileVisibility?.email || 'private',
          phone: me.profileVisibility?.phone || 'private',
          username: me.profileVisibility?.username || 'public',
          avatarUrl: me.profileVisibility?.avatarUrl || 'public',
          name: me.profileVisibility?.name || 'public',
        },
      });
    }
  }, [me]);

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setMe(null);
    router.push('/');
  };

  const handleSubscribe = async () => {
    try {
      const res = await fetchWithAuth('/api/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'monthly' }),
      });
      if (res.ok) {
        const data = await res.json();
        setSubscription(data.subscription);
        alert('订阅成功！');
        await fetchSubscription();
      } else {
        alert('订阅失败，请重试');
      }
    } catch (err) {
      alert('订阅失败，请重试');
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('确定要取消订阅吗？')) return;
    try {
      const res = await fetchWithAuth('/api/subscription', {
        method: 'DELETE',
      });
      if (res.ok) {
        setSubscription({ active: false, price: 20 });
        alert('订阅已取消');
        await fetchSubscription();
      } else {
        alert('取消订阅失败，请重试');
      }
    } catch (err) {
      alert('取消订阅失败，请重试');
    }
  };

  const handleExportChat = async () => {
    try {
      const res = await fetchWithAuth('/api/me/chat-export');
      if (res.ok) {
        const data = await res.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chat-export-${me?.userId}-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        alert('聊天记录导出成功！');
      } else {
        alert('导出失败，请重试');
      }
    } catch (err) {
      alert('导出失败，请重试');
    }
  };

  const handleDeleteTrainingSample = async (id: string) => {
    if (!confirm('确定要删除这个训练样本吗？')) return;
    try {
      const res = await fetchWithAuth('/api/me/training', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setTrainingSamples(trainingSamples.filter(s => s._id !== id));
        alert('删除成功');
      } else {
        alert('删除失败，请重试');
      }
    } catch (err) {
      alert('删除失败，请重试');
    }
  };

  const handleSaveAvatar = async (imageData: string) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!token) {
      alert('请先登录');
      return;
    }

    try {
      const { fetchWithAuth } = await import('@/lib/auth-utils');
      const res = await fetchWithAuth('/api/auth/avatar', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ avatarUrl: imageData }),
      });

      if (res.ok) {
        const data: Me = await res.json();
        setMe(data.user);
        setShowAvatarEditor(false);
        // 立即刷新用户信息
        await fetchMe();
      } else if (res.status === 401) {
        alert('登录已过期，请重新登录');
        logout();
      } else {
        const errorData = await res.json();
        alert(errorData?.message || '保存头像失败');
      }
    } catch (err: any) {
      alert(err?.message || '保存头像失败');
    }
  };

  if (!me) {
    return (
      <div className="container mx-auto px-4 py-2 max-w-6xl">
        <SectionHeader title="个人中心" subtitle="请先登录" />
        <div className={`text-center py-12 rounded-xl ${panelClass}`}>
          <div className="text-sm opacity-70">{error || '未登录'}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-2 max-w-6xl">
      <SectionHeader title="个人中心" subtitle="管理您的账户、订阅和数据" />

      {/* 用户信息卡片 */}
      <div className={`rounded-xl shadow-md p-4 sm:p-6 mb-6 ${panelClass}`}>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
          <div className="relative flex-shrink-0">
            <img src={me.avatarUrl || '/favicon.ico'} alt="avatar" className="h-20 w-20 rounded-full object-cover border-2" />
            <button
              onClick={() => setShowAvatarEditor(true)}
              className={`absolute bottom-0 right-0 w-7 h-7 rounded-full ${accentBtn} text-white text-xs flex items-center justify-center border-2 ${mode === 'waibi' ? 'border-black' : 'border-white'}`}
              title="编辑头像"
            >
              ✎
            </button>
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-xl mb-1 truncate">{me.username || me.name || '用户'}</div>
            <div className="text-xs opacity-70 mb-1">ID: {me.userId}</div>
            {me.email && <div className="text-sm opacity-80 truncate">{me.email}</div>}
            {me.phone && <div className="text-sm opacity-80">{me.phone}</div>}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setIsEditing(true)}
              className={`px-3 sm:px-4 py-2 rounded-lg text-white text-sm ${accentBtn}`}
            >
              {isEditing ? '取消编辑' : '编辑资料'}
            </button>
            <button
              onClick={() => router.push(`/profile/${encodeURIComponent(me.username || me.name || '')}`)}
              className={`px-3 sm:px-4 py-2 rounded-lg text-sm ${secondaryBtn}`}
            >
              公开主页
            </button>
            <button
              onClick={logout}
              className={`px-3 sm:px-4 py-2 rounded-lg text-sm ${secondaryBtn}`}
            >
              退出登录
            </button>
          </div>
        </div>

        {/* 编辑资料表单 */}
        {isEditing && (
          <div className={`border-t pt-6 mt-6 ${mode === 'waibi' ? 'border-green-500/30' : 'border-gray-200'}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-2">用户名</label>
                <input
                  type="text"
                  value={editForm.username}
                  onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                  className={`w-full p-2 rounded-lg ${inputClass}`}
                />
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    checked={editForm.profileVisibility.username === 'public'}
                    onChange={(e) => setEditForm({
                      ...editForm,
                      profileVisibility: {
                        ...editForm.profileVisibility,
                        username: e.target.checked ? 'public' : 'private',
                      },
                    })}
                  />
                  <label className="text-xs">公开</label>
                </div>
              </div>
              <div>
                <label className="block text-sm mb-2">姓名</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className={`w-full p-2 rounded-lg ${inputClass}`}
                />
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    checked={editForm.profileVisibility.name === 'public'}
                    onChange={(e) => setEditForm({
                      ...editForm,
                      profileVisibility: {
                        ...editForm.profileVisibility,
                        name: e.target.checked ? 'public' : 'private',
                      },
                    })}
                  />
                  <label className="text-xs">公开</label>
                </div>
              </div>
              <div>
                <label className="block text-sm mb-2">邮箱</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className={`w-full p-2 rounded-lg ${inputClass}`}
                />
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    checked={editForm.profileVisibility.email === 'public'}
                    onChange={(e) => setEditForm({
                      ...editForm,
                      profileVisibility: {
                        ...editForm.profileVisibility,
                        email: e.target.checked ? 'public' : 'private',
                      },
                    })}
                  />
                  <label className="text-xs">公开</label>
                </div>
              </div>
              <div>
                <label className="block text-sm mb-2">手机</label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className={`w-full p-2 rounded-lg ${inputClass}`}
                />
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    checked={editForm.profileVisibility.phone === 'public'}
                    onChange={(e) => setEditForm({
                      ...editForm,
                      profileVisibility: {
                        ...editForm.profileVisibility,
                        phone: e.target.checked ? 'public' : 'private',
                      },
                    })}
                  />
                  <label className="text-xs">公开</label>
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={async () => {
                  try {
                    const res = await fetchWithAuth('/api/auth/me', {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(editForm),
                    });
                    if (res.ok) {
                      await fetchMe();
                      setIsEditing(false);
                      alert('保存成功');
                    } else {
                      alert('保存失败');
                    }
                  } catch (err) {
                    alert('保存失败');
                  }
                }}
                className={`flex-1 px-4 py-2 rounded-lg text-white ${accentBtn}`}
              >
                保存
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className={`flex-1 px-4 py-2 rounded-lg ${secondaryBtn}`}
              >
                取消
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* 订阅计划 */}
        <div className={`rounded-xl shadow-md p-4 sm:p-6 ${panelClass}`}>
          <h2 className="text-xl font-semibold mb-4">订阅计划</h2>
          {subscription && (
            <div className="space-y-4">
              <div className={`p-4 rounded-lg ${mode === 'waibi' ? 'bg-gray-900/50' : 'bg-gray-50'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">月付计划</span>
                  <span className={`px-3 py-1 rounded-full text-xs ${
                    subscription.active 
                      ? mode === 'waibi' ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700'
                      : mode === 'waibi' ? 'bg-gray-800 text-gray-400' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {subscription.active ? '已激活' : '未激活'}
                  </span>
                </div>
                <div className="text-2xl font-bold mb-1">¥{subscription.price || 20}/月</div>
                {subscription.active && subscription.endDate && (
                  <div className="text-xs opacity-70">
                    到期时间: {new Date(subscription.endDate).toLocaleDateString('zh-CN')}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                {subscription.active ? (
                  <button
                    onClick={handleCancelSubscription}
                    className={`w-full px-4 py-2 rounded-lg ${secondaryBtn}`}
                  >
                    取消订阅
                  </button>
                ) : (
                  <button
                    onClick={() => router.push('/subscription')}
                    className={`w-full px-4 py-2 rounded-lg text-white ${accentBtn}`}
                  >
                    前往订阅
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 数据管理 */}
        <div className={`rounded-xl shadow-md p-4 sm:p-6 ${panelClass}`}>
          <h2 className="text-xl font-semibold mb-4">数据管理</h2>
          <div className="space-y-3">
            <button
              onClick={handleExportChat}
              className={`w-full px-4 py-3 rounded-lg text-left ${secondaryBtn} flex items-center justify-between relative`}
            >
              <span>导出模型交互记录</span>
              <div className="flex items-center gap-2">
                <span className={`px-1.5 py-0.5 rounded text-xs ${
                  mode === 'waibi' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  开发中
                </span>
                <span>→</span>
              </div>
            </button>
            <button
              onClick={() => router.push('/me/import-wechat')}
              className={`w-full px-4 py-3 rounded-lg text-left text-white ${accentBtn} flex items-center justify-between relative`}
            >
              <span>导入微信聊天记录</span>
              <div className="flex items-center gap-2">
                <span className={`px-1.5 py-0.5 rounded text-xs ${
                  mode === 'waibi' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  开发中
                </span>
                <span>→</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* 训练集管理 */}
      <div className={`rounded-xl shadow-md p-4 sm:p-6 mt-6 ${panelClass}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h2 className="text-xl font-semibold">训练集管理</h2>
          <div className="flex items-center gap-3">
            {/* 人格筛选 */}
            <select
              value={selectedPersonaFilter}
              onChange={(e) => setSelectedPersonaFilter(e.target.value)}
              className={`px-3 py-1.5 rounded-lg text-sm ${inputClass} focus:outline-none focus:ring-2 ${
                mode === 'waibi' ? 'focus:ring-green-500/50' : 'focus:ring-[var(--accent-cyan)]'
              }`}
            >
              <option value="all">全部人格</option>
              {MBTI_TYPES.map((persona) => (
                <option key={persona.name.toLowerCase()} value={persona.name.toLowerCase()}>
                  {persona.name}
                </option>
              ))}
            </select>
            <span className="text-sm opacity-70">
              共 {trainingSamples.filter(s => selectedPersonaFilter === 'all' || s.personaCode === selectedPersonaFilter).length} 条样本
            </span>
          </div>
        </div>
        {(() => {
          const filteredSamples = trainingSamples.filter(s => 
            selectedPersonaFilter === 'all' || s.personaCode === selectedPersonaFilter
          );
          return filteredSamples.length === 0 ? (
            <div className={`text-center py-8 ${mode === 'waibi' ? 'text-gray-400' : 'text-gray-500'}`}>
              {selectedPersonaFilter === 'all' ? '暂无训练样本' : `暂无 ${MBTI_TYPES.find(p => p.name.toLowerCase() === selectedPersonaFilter)?.name || selectedPersonaFilter.toUpperCase()} 的训练样本`}
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {filteredSamples.map((sample) => (
              <div key={sample._id} className={`p-4 rounded-lg border ${mode === 'waibi' ? 'bg-gray-900/50 border-green-500/30' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded text-xs ${mode === 'waibi' ? 'bg-green-500/20 text-green-400' : 'bg-blue-100 text-blue-700'}`}>
                        {sample.personaCode.toUpperCase()}
                      </span>
                      {sample.scenario && (
                        <span className="text-xs opacity-70">{sample.scenario}</span>
                      )}
                    </div>
                    <div className="text-sm mb-1">
                      <span className="opacity-70">输入:</span> {sample.input}
                    </div>
                    <div className="text-sm">
                      <span className="opacity-70">回复:</span> {sample.response}
                    </div>
                    <div className="text-xs opacity-60 mt-2">
                      {new Date(sample.createdAt).toLocaleString('zh-CN')}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteTrainingSample(sample._id)}
                    className={`px-3 py-1 rounded text-sm ${mode === 'waibi' ? 'text-red-400 hover:bg-red-500/20' : 'text-red-600 hover:bg-red-50'}`}
                  >
                    删除
                  </button>
                </div>
              </div>
              ))}
            </div>
          );
        })()}
      </div>

      {showAvatarEditor && (
        <AvatarEditor
          currentAvatarUrl={me?.avatarUrl}
          onSave={handleSaveAvatar}
          onCancel={() => setShowAvatarEditor(false)}
        />
      )}
    </div>
  );
}
