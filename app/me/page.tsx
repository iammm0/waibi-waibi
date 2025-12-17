"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useVibe } from '@/app/providers';
import AvatarEditor from '@/components/avatar-editor';
import { fetchWithAuth } from '@/lib/auth-utils';
import SectionHeader from '@/components/section-header';
import { MBTI_TYPES } from '@/lib/mbti';
import { universeToast } from '@/components/universe-toast';
import { universeConfirm } from '@/components/universe-confirm';

type Me = { 
  user: { 
    userId: string; 
    username?: string; 
    name?: string; 
    email?: string; 
    phone?: string; 
    avatarUrl?: string;
    bio?: string;
    birthday?: string | Date;
    gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
    location?: string;
    occupation?: string;
    company?: string;
    interests?: string[];
    website?: string;
    socialLinks?: {
      github?: string;
      twitter?: string;
      linkedin?: string;
      instagram?: string;
      weibo?: string;
      douban?: string;
      bilibili?: string;
      custom?: { name: string; url: string }[];
    };
    education?: {
      school?: string;
      major?: string;
      degree?: string;
      graduationYear?: number;
    }[];
    skills?: string[];
    tags?: string[];
    signature?: string;
    mbtiType?: string;
    languages?: string[];
    about?: string;
    profileVisibility?: {
      email?: 'public' | 'private';
      phone?: 'public' | 'private';
      username?: 'public' | 'private';
      avatarUrl?: 'public' | 'private';
      name?: 'public' | 'private';
      bio?: 'public' | 'private';
      birthday?: 'public' | 'private';
      gender?: 'public' | 'private';
      location?: 'public' | 'private';
      occupation?: 'public' | 'private';
      company?: 'public' | 'private';
      interests?: 'public' | 'private';
      website?: 'public' | 'private';
      socialLinks?: 'public' | 'private';
      education?: 'public' | 'private';
      skills?: 'public' | 'private';
      tags?: 'public' | 'private';
      signature?: 'public' | 'private';
      mbtiType?: 'public' | 'private';
      languages?: 'public' | 'private';
      about?: 'public' | 'private';
    };
  } 
};

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
  const panelClass = mode === 'waibi' ? 'bg-black/90 border border-gray-700 text-white' : 'bg-white border border-gray-200 text-gray-900';
  const secondaryBtn = mode === 'waibi' ? 'border border-gray-700 bg-gray-800/50 hover:bg-gray-800' : 'border border-gray-300 bg-gray-50 hover:bg-gray-100';
  const accentBtn = mode === 'waibi' ? 'bg-gray-600 hover:bg-gray-700' : 'bg-gray-500 hover:bg-gray-600';
  const inputClass = mode === 'waibi' ? 'border border-gray-700 bg-gray-900/50 text-white' : 'border border-gray-300 bg-white text-gray-900';

  const [me, setMe] = useState<Me["user"] | null>(null);
  const [error, setError] = useState('');
  const [showAvatarEditor, setShowAvatarEditor] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(false);
  const [editForm, setEditForm] = useState({
    username: '',
    name: '',
    email: '',
    phone: '',
    bio: '',
    birthday: '',
    gender: '' as 'male' | 'female' | 'other' | 'prefer_not_to_say' | '',
    location: '',
    occupation: '',
    company: '',
    interests: [] as string[],
    website: '',
    socialLinks: {
      github: '' as string | undefined,
      twitter: '' as string | undefined,
      linkedin: '' as string | undefined,
      instagram: '' as string | undefined,
      weibo: '' as string | undefined,
      douban: '' as string | undefined,
      bilibili: '' as string | undefined,
      custom: [] as { name: string; url: string }[] | undefined,
    } as {
      github?: string;
      twitter?: string;
      linkedin?: string;
      instagram?: string;
      weibo?: string;
      douban?: string;
      bilibili?: string;
      custom?: { name: string; url: string }[];
    },
    education: [] as { school?: string; major?: string; degree?: string; graduationYear?: number }[],
    skills: [] as string[],
    tags: [] as string[],
    signature: '',
    mbtiType: '',
    languages: [] as string[],
    about: '',
    profileVisibility: {
      email: 'private' as 'public' | 'private',
      phone: 'private' as 'public' | 'private',
      username: 'public' as 'public' | 'private',
      avatarUrl: 'public' as 'public' | 'private',
      name: 'public' as 'public' | 'private',
      bio: 'private' as 'public' | 'private',
      birthday: 'private' as 'public' | 'private',
      gender: 'private' as 'public' | 'private',
      location: 'private' as 'public' | 'private',
      occupation: 'private' as 'public' | 'private',
      company: 'private' as 'public' | 'private',
      interests: 'private' as 'public' | 'private',
      website: 'private' as 'public' | 'private',
      socialLinks: 'private' as 'public' | 'private',
      education: 'private' as 'public' | 'private',
      skills: 'private' as 'public' | 'private',
      tags: 'private' as 'public' | 'private',
      signature: 'private' as 'public' | 'private',
      mbtiType: 'private' as 'public' | 'private',
      languages: 'private' as 'public' | 'private',
      about: 'private' as 'public' | 'private',
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
      const birthdayStr = me.birthday 
        ? (typeof me.birthday === 'string' 
          ? me.birthday.split('T')[0] 
          : new Date(me.birthday).toISOString().split('T')[0])
        : '';
      
      setEditForm({
        username: me.username || '',
        name: me.name || '',
        email: me.email || '',
        phone: me.phone || '',
        bio: me.bio || '',
        birthday: birthdayStr,
        gender: me.gender || '',
        location: me.location || '',
        occupation: me.occupation || '',
        company: me.company || '',
        interests: me.interests || [],
        website: me.website || '',
        socialLinks: me.socialLinks || {
          github: undefined,
          twitter: undefined,
          linkedin: undefined,
          instagram: undefined,
          weibo: undefined,
          douban: undefined,
          bilibili: undefined,
          custom: undefined,
        },
        education: me.education || [],
        skills: me.skills || [],
        tags: me.tags || [],
        signature: me.signature || '',
        mbtiType: me.mbtiType || '',
        languages: me.languages || [],
        about: me.about || '',
        profileVisibility: {
          email: me.profileVisibility?.email || 'private',
          phone: me.profileVisibility?.phone || 'private',
          username: me.profileVisibility?.username || 'public',
          avatarUrl: me.profileVisibility?.avatarUrl || 'public',
          name: me.profileVisibility?.name || 'public',
          bio: me.profileVisibility?.bio || 'private',
          birthday: me.profileVisibility?.birthday || 'private',
          gender: me.profileVisibility?.gender || 'private',
          location: me.profileVisibility?.location || 'private',
          occupation: me.profileVisibility?.occupation || 'private',
          company: me.profileVisibility?.company || 'private',
          interests: me.profileVisibility?.interests || 'private',
          website: me.profileVisibility?.website || 'private',
          socialLinks: me.profileVisibility?.socialLinks || 'private',
          education: me.profileVisibility?.education || 'private',
          skills: me.profileVisibility?.skills || 'private',
          tags: me.profileVisibility?.tags || 'private',
          signature: me.profileVisibility?.signature || 'private',
          mbtiType: me.profileVisibility?.mbtiType || 'private',
          languages: me.profileVisibility?.languages || 'private',
          about: me.profileVisibility?.about || 'private',
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
        universeToast.success('订阅成功！');
        await fetchSubscription();
      } else {
        universeToast.error('订阅失败，请重试');
      }
    } catch (err) {
      universeToast.error('订阅失败，请重试');
    }
  };

  const handleCancelSubscription = async () => {
    const confirmed = await universeConfirm.confirm(
      '确定要取消订阅吗？',
      { type: 'warning', title: '取消订阅' }
    );
    if (!confirmed) return;
    try {
      const res = await fetchWithAuth('/api/subscription', {
        method: 'DELETE',
      });
      if (res.ok) {
        setSubscription({ active: false, price: 20 });
        universeToast.success('订阅已取消');
        await fetchSubscription();
      } else {
        universeToast.error('取消订阅失败，请重试');
      }
    } catch (err) {
      universeToast.error('取消订阅失败，请重试');
    }
  };

  // 重置表单数据到原始值
  const resetEditForm = () => {
    if (!me) return;
    const birthdayStr = me.birthday 
      ? (typeof me.birthday === 'string' 
        ? me.birthday.split('T')[0] 
        : new Date(me.birthday).toISOString().split('T')[0])
      : '';
    
    setEditForm({
      username: me.username || '',
      name: me.name || '',
      email: me.email || '',
      phone: me.phone || '',
      bio: me.bio || '',
      birthday: birthdayStr,
      gender: me.gender || '',
      location: me.location || '',
      occupation: me.occupation || '',
      company: me.company || '',
      interests: me.interests || [],
      website: me.website || '',
      socialLinks: me.socialLinks || {
        github: undefined,
        twitter: undefined,
        linkedin: undefined,
        instagram: undefined,
        weibo: undefined,
        douban: undefined,
        bilibili: undefined,
        custom: undefined,
      },
      education: me.education || [],
      skills: me.skills || [],
      tags: me.tags || [],
      signature: me.signature || '',
      mbtiType: me.mbtiType || '',
      languages: me.languages || [],
      about: me.about || '',
      profileVisibility: {
        email: me.profileVisibility?.email || 'private',
        phone: me.profileVisibility?.phone || 'private',
        username: me.profileVisibility?.username || 'public',
        avatarUrl: me.profileVisibility?.avatarUrl || 'public',
        name: me.profileVisibility?.name || 'public',
        bio: me.profileVisibility?.bio || 'private',
        birthday: me.profileVisibility?.birthday || 'private',
        gender: me.profileVisibility?.gender || 'private',
        location: me.profileVisibility?.location || 'private',
        occupation: me.profileVisibility?.occupation || 'private',
        company: me.profileVisibility?.company || 'private',
        interests: me.profileVisibility?.interests || 'private',
        website: me.profileVisibility?.website || 'private',
        socialLinks: me.profileVisibility?.socialLinks || 'private',
        education: me.profileVisibility?.education || 'private',
        skills: me.profileVisibility?.skills || 'private',
        tags: me.profileVisibility?.tags || 'private',
        signature: me.profileVisibility?.signature || 'private',
        mbtiType: me.profileVisibility?.mbtiType || 'private',
        languages: me.profileVisibility?.languages || 'private',
        about: me.profileVisibility?.about || 'private',
      },
    });
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
        universeToast.success('聊天记录导出成功！');
      } else {
        universeToast.error('导出失败，请重试');
      }
    } catch (err) {
      universeToast.error('导出失败，请重试');
    }
  };


  const handleSaveAvatar = async (imageData: string) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!token) {
      universeToast.warning('请先登录');
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
        universeToast.warning('登录已过期，请重新登录');
        logout();
      } else {
        const errorData = await res.json();
        universeToast.error(errorData?.message || '保存头像失败');
      }
    } catch (err: any) {
      universeToast.error(err?.message || '保存头像失败');
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
              onClick={() => {
                if (isEditing) {
                  // 取消编辑，重置表单数据
                  resetEditForm();
                  setIsEditing(false);
                } else {
                  setIsEditing(true);
                }
              }}
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
          <div className={`border-t pt-6 mt-6 ${mode === 'waibi' ? 'border-gray-700' : 'border-gray-200'}`}>
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
              
              {/* 个人简介 */}
              <div className="md:col-span-2">
                <label className="block text-sm mb-2">个人简介</label>
                <textarea
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  className={`w-full p-2 rounded-lg ${inputClass}`}
                  rows={3}
                  placeholder="简短介绍自己..."
                />
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    checked={editForm.profileVisibility.bio === 'public'}
                    onChange={(e) => setEditForm({
                      ...editForm,
                      profileVisibility: {
                        ...editForm.profileVisibility,
                        bio: e.target.checked ? 'public' : 'private',
                      },
                    })}
                  />
                  <label className="text-xs">公开</label>
                </div>
              </div>

              {/* 生日 */}
              <div>
                <label className="block text-sm mb-2">生日</label>
                <input
                  type="date"
                  value={editForm.birthday}
                  onChange={(e) => setEditForm({ ...editForm, birthday: e.target.value })}
                  className={`w-full p-2 rounded-lg ${inputClass}`}
                />
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    checked={editForm.profileVisibility.birthday === 'public'}
                    onChange={(e) => setEditForm({
                      ...editForm,
                      profileVisibility: {
                        ...editForm.profileVisibility,
                        birthday: e.target.checked ? 'public' : 'private',
                      },
                    })}
                  />
                  <label className="text-xs">公开</label>
                </div>
              </div>

              {/* 性别 */}
              <div>
                <label className="block text-sm mb-2">性别</label>
                <select
                  value={editForm.gender}
                  onChange={(e) => setEditForm({ ...editForm, gender: e.target.value as any })}
                  className={`w-full p-2 rounded-lg ${inputClass}`}
                >
                  <option value="">不公开</option>
                  <option value="male">男</option>
                  <option value="female">女</option>
                  <option value="other">其他</option>
                  <option value="prefer_not_to_say">不愿透露</option>
                </select>
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    checked={editForm.profileVisibility.gender === 'public'}
                    onChange={(e) => setEditForm({
                      ...editForm,
                      profileVisibility: {
                        ...editForm.profileVisibility,
                        gender: e.target.checked ? 'public' : 'private',
                      },
                    })}
                  />
                  <label className="text-xs">公开</label>
                </div>
              </div>

              {/* 所在地 */}
              <div>
                <label className="block text-sm mb-2">所在地</label>
                <input
                  type="text"
                  value={editForm.location}
                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                  className={`w-full p-2 rounded-lg ${inputClass}`}
                  placeholder="例如: 北京"
                />
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    checked={editForm.profileVisibility.location === 'public'}
                    onChange={(e) => setEditForm({
                      ...editForm,
                      profileVisibility: {
                        ...editForm.profileVisibility,
                        location: e.target.checked ? 'public' : 'private',
                      },
                    })}
                  />
                  <label className="text-xs">公开</label>
                </div>
              </div>

              {/* 职业 */}
              <div>
                <label className="block text-sm mb-2">职业</label>
                <input
                  type="text"
                  value={editForm.occupation}
                  onChange={(e) => setEditForm({ ...editForm, occupation: e.target.value })}
                  className={`w-full p-2 rounded-lg ${inputClass}`}
                  placeholder="例如: 软件工程师"
                />
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    checked={editForm.profileVisibility.occupation === 'public'}
                    onChange={(e) => setEditForm({
                      ...editForm,
                      profileVisibility: {
                        ...editForm.profileVisibility,
                        occupation: e.target.checked ? 'public' : 'private',
                      },
                    })}
                  />
                  <label className="text-xs">公开</label>
                </div>
              </div>

              {/* 公司 */}
              <div>
                <label className="block text-sm mb-2">公司</label>
                <input
                  type="text"
                  value={editForm.company}
                  onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                  className={`w-full p-2 rounded-lg ${inputClass}`}
                  placeholder="公司名称"
                />
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    checked={editForm.profileVisibility.company === 'public'}
                    onChange={(e) => setEditForm({
                      ...editForm,
                      profileVisibility: {
                        ...editForm.profileVisibility,
                        company: e.target.checked ? 'public' : 'private',
                      },
                    })}
                  />
                  <label className="text-xs">公开</label>
                </div>
              </div>

              {/* 个人网站 */}
              <div>
                <label className="block text-sm mb-2">个人网站</label>
                <input
                  type="url"
                  value={editForm.website}
                  onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                  className={`w-full p-2 rounded-lg ${inputClass}`}
                  placeholder="https://..."
                />
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    checked={editForm.profileVisibility.website === 'public'}
                    onChange={(e) => setEditForm({
                      ...editForm,
                      profileVisibility: {
                        ...editForm.profileVisibility,
                        website: e.target.checked ? 'public' : 'private',
                      },
                    })}
                  />
                  <label className="text-xs">公开</label>
                </div>
              </div>

              {/* MBTI类型 */}
              <div>
                <label className="block text-sm mb-2">MBTI类型</label>
                <select
                  value={editForm.mbtiType}
                  onChange={(e) => setEditForm({ ...editForm, mbtiType: e.target.value })}
                  className={`w-full p-2 rounded-lg ${inputClass}`}
                >
                  <option value="">未选择</option>
                  {MBTI_TYPES.map((type) => (
                    <option key={type.name} value={type.name}>
                      {type.name} - {type.description.length > 50 ? type.description.slice(0, 50) + '...' : type.description}
                    </option>
                  ))}
                </select>
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    checked={editForm.profileVisibility.mbtiType === 'public'}
                    onChange={(e) => setEditForm({
                      ...editForm,
                      profileVisibility: {
                        ...editForm.profileVisibility,
                        mbtiType: e.target.checked ? 'public' : 'private',
                      },
                    })}
                  />
                  <label className="text-xs">公开</label>
                </div>
              </div>

              {/* 兴趣爱好 */}
              <div className="md:col-span-2">
                <label className="block text-sm mb-2">兴趣爱好 (用逗号分隔)</label>
                <input
                  type="text"
                  value={editForm.interests.join(', ')}
                  onChange={(e) => setEditForm({
                    ...editForm,
                    interests: e.target.value.split(',').map(s => s.trim()).filter(s => s),
                  })}
                  className={`w-full p-2 rounded-lg ${inputClass}`}
                  placeholder="例如: 阅读, 旅行, 摄影"
                />
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    checked={editForm.profileVisibility.interests === 'public'}
                    onChange={(e) => setEditForm({
                      ...editForm,
                      profileVisibility: {
                        ...editForm.profileVisibility,
                        interests: e.target.checked ? 'public' : 'private',
                      },
                    })}
                  />
                  <label className="text-xs">公开</label>
                </div>
              </div>

              {/* 技能 */}
              <div className="md:col-span-2">
                <label className="block text-sm mb-2">技能 (用逗号分隔)</label>
                <input
                  type="text"
                  value={editForm.skills.join(', ')}
                  onChange={(e) => setEditForm({
                    ...editForm,
                    skills: e.target.value.split(',').map(s => s.trim()).filter(s => s),
                  })}
                  className={`w-full p-2 rounded-lg ${inputClass}`}
                  placeholder="例如: JavaScript, Python, 设计"
                />
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    checked={editForm.profileVisibility.skills === 'public'}
                    onChange={(e) => setEditForm({
                      ...editForm,
                      profileVisibility: {
                        ...editForm.profileVisibility,
                        skills: e.target.checked ? 'public' : 'private',
                      },
                    })}
                  />
                  <label className="text-xs">公开</label>
                </div>
              </div>

              {/* 语言 */}
              <div className="md:col-span-2">
                <label className="block text-sm mb-2">语言 (用逗号分隔)</label>
                <input
                  type="text"
                  value={editForm.languages.join(', ')}
                  onChange={(e) => setEditForm({
                    ...editForm,
                    languages: e.target.value.split(',').map(s => s.trim()).filter(s => s),
                  })}
                  className={`w-full p-2 rounded-lg ${inputClass}`}
                  placeholder="例如: 中文, 英语, 日语"
                />
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    checked={editForm.profileVisibility.languages === 'public'}
                    onChange={(e) => setEditForm({
                      ...editForm,
                      profileVisibility: {
                        ...editForm.profileVisibility,
                        languages: e.target.checked ? 'public' : 'private',
                      },
                    })}
                  />
                  <label className="text-xs">公开</label>
                </div>
              </div>

              {/* 个人标签 */}
              <div className="md:col-span-2">
                <label className="block text-sm mb-2">个人标签 (用逗号分隔)</label>
                <input
                  type="text"
                  value={editForm.tags.join(', ')}
                  onChange={(e) => setEditForm({
                    ...editForm,
                    tags: e.target.value.split(',').map(s => s.trim()).filter(s => s),
                  })}
                  className={`w-full p-2 rounded-lg ${inputClass}`}
                  placeholder="例如: 技术爱好者, 旅行者, 美食家"
                />
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    checked={editForm.profileVisibility.tags === 'public'}
                    onChange={(e) => setEditForm({
                      ...editForm,
                      profileVisibility: {
                        ...editForm.profileVisibility,
                        tags: e.target.checked ? 'public' : 'private',
                      },
                    })}
                  />
                  <label className="text-xs">公开</label>
                </div>
              </div>

              {/* 个性签名 */}
              <div className="md:col-span-2">
                <label className="block text-sm mb-2">个性签名</label>
                <input
                  type="text"
                  value={editForm.signature}
                  onChange={(e) => setEditForm({ ...editForm, signature: e.target.value })}
                  className={`w-full p-2 rounded-lg ${inputClass}`}
                  placeholder="一句话介绍自己"
                />
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    checked={editForm.profileVisibility.signature === 'public'}
                    onChange={(e) => setEditForm({
                      ...editForm,
                      profileVisibility: {
                        ...editForm.profileVisibility,
                        signature: e.target.checked ? 'public' : 'private',
                      },
                    })}
                  />
                  <label className="text-xs">公开</label>
                </div>
              </div>

              {/* 关于我 */}
              <div className="md:col-span-2">
                <label className="block text-sm mb-2">关于我</label>
                <textarea
                  value={editForm.about}
                  onChange={(e) => setEditForm({ ...editForm, about: e.target.value })}
                  className={`w-full p-2 rounded-lg ${inputClass}`}
                  rows={5}
                  placeholder="详细介绍自己..."
                />
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    checked={editForm.profileVisibility.about === 'public'}
                    onChange={(e) => setEditForm({
                      ...editForm,
                      profileVisibility: {
                        ...editForm.profileVisibility,
                        about: e.target.checked ? 'public' : 'private',
                      },
                    })}
                  />
                  <label className="text-xs">公开</label>
                </div>
              </div>

              {/* 社交媒体链接 */}
              <div className="md:col-span-2">
                <label className="block text-sm mb-2">社交媒体链接</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs mb-1">GitHub</label>
                    <input
                      type="url"
                      value={editForm.socialLinks?.github || ''}
                      onChange={(e) => setEditForm({
                        ...editForm,
                        socialLinks: { ...(editForm.socialLinks || {}), github: e.target.value || undefined },
                      })}
                      className={`w-full p-2 rounded-lg ${inputClass}`}
                      placeholder="https://github.com/..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs mb-1">Twitter</label>
                    <input
                      type="url"
                      value={editForm.socialLinks?.twitter || ''}
                      onChange={(e) => setEditForm({
                        ...editForm,
                        socialLinks: { ...(editForm.socialLinks || {}), twitter: e.target.value || undefined },
                      })}
                      className={`w-full p-2 rounded-lg ${inputClass}`}
                      placeholder="https://twitter.com/..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs mb-1">LinkedIn</label>
                    <input
                      type="url"
                      value={editForm.socialLinks?.linkedin || ''}
                      onChange={(e) => setEditForm({
                        ...editForm,
                        socialLinks: { ...(editForm.socialLinks || {}), linkedin: e.target.value || undefined },
                      })}
                      className={`w-full p-2 rounded-lg ${inputClass}`}
                      placeholder="https://linkedin.com/in/..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs mb-1">Instagram</label>
                    <input
                      type="url"
                      value={editForm.socialLinks?.instagram || ''}
                      onChange={(e) => setEditForm({
                        ...editForm,
                        socialLinks: { ...(editForm.socialLinks || {}), instagram: e.target.value || undefined },
                      })}
                      className={`w-full p-2 rounded-lg ${inputClass}`}
                      placeholder="https://instagram.com/..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs mb-1">微博</label>
                    <input
                      type="url"
                      value={editForm.socialLinks?.weibo || ''}
                      onChange={(e) => setEditForm({
                        ...editForm,
                        socialLinks: { ...(editForm.socialLinks || {}), weibo: e.target.value || undefined },
                      })}
                      className={`w-full p-2 rounded-lg ${inputClass}`}
                      placeholder="https://weibo.com/..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs mb-1">豆瓣</label>
                    <input
                      type="url"
                      value={editForm.socialLinks?.douban || ''}
                      onChange={(e) => setEditForm({
                        ...editForm,
                        socialLinks: { ...(editForm.socialLinks || {}), douban: e.target.value || undefined },
                      })}
                      className={`w-full p-2 rounded-lg ${inputClass}`}
                      placeholder="https://douban.com/people/..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs mb-1">Bilibili</label>
                    <input
                      type="url"
                      value={editForm.socialLinks?.bilibili || ''}
                      onChange={(e) => setEditForm({
                        ...editForm,
                        socialLinks: { ...(editForm.socialLinks || {}), bilibili: e.target.value || undefined },
                      })}
                      className={`w-full p-2 rounded-lg ${inputClass}`}
                      placeholder="https://bilibili.com/..."
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    checked={editForm.profileVisibility.socialLinks === 'public'}
                    onChange={(e) => setEditForm({
                      ...editForm,
                      profileVisibility: {
                        ...editForm.profileVisibility,
                        socialLinks: e.target.checked ? 'public' : 'private',
                      },
                    })}
                  />
                  <label className="text-xs">公开</label>
                </div>
              </div>

              {/* 教育背景 */}
              <div className="md:col-span-2">
                <label className="block text-sm mb-2">教育背景</label>
                {editForm.education.map((edu, index) => (
                  <div key={index} className={`p-3 rounded-lg mb-2 ${mode === 'waibi' ? 'bg-gray-900/50' : 'bg-gray-50'}`}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={edu.school || ''}
                        onChange={(e) => {
                          const newEdu = [...editForm.education];
                          newEdu[index] = { ...newEdu[index], school: e.target.value };
                          setEditForm({ ...editForm, education: newEdu });
                        }}
                        className={`p-2 rounded-lg ${inputClass}`}
                        placeholder="学校"
                      />
                      <input
                        type="text"
                        value={edu.major || ''}
                        onChange={(e) => {
                          const newEdu = [...editForm.education];
                          newEdu[index] = { ...newEdu[index], major: e.target.value };
                          setEditForm({ ...editForm, education: newEdu });
                        }}
                        className={`p-2 rounded-lg ${inputClass}`}
                        placeholder="专业"
                      />
                      <input
                        type="text"
                        value={edu.degree || ''}
                        onChange={(e) => {
                          const newEdu = [...editForm.education];
                          newEdu[index] = { ...newEdu[index], degree: e.target.value };
                          setEditForm({ ...editForm, education: newEdu });
                        }}
                        className={`p-2 rounded-lg ${inputClass}`}
                        placeholder="学位"
                      />
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={edu.graduationYear || ''}
                          onChange={(e) => {
                            const newEdu = [...editForm.education];
                            newEdu[index] = { ...newEdu[index], graduationYear: parseInt(e.target.value) || undefined };
                            setEditForm({ ...editForm, education: newEdu });
                          }}
                          className={`flex-1 p-2 rounded-lg ${inputClass}`}
                          placeholder="毕业年份"
                        />
                        <button
                          onClick={() => {
                            const newEdu = editForm.education.filter((_, i) => i !== index);
                            setEditForm({ ...editForm, education: newEdu });
                          }}
                          className={`px-3 py-2 rounded-lg ${mode === 'waibi' ? 'text-red-400 hover:bg-red-500/20' : 'text-red-600 hover:bg-red-50'}`}
                        >
                          删除
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => setEditForm({
                    ...editForm,
                    education: [...editForm.education, { school: '', major: '', degree: '', graduationYear: undefined }],
                  })}
                  className={`mt-2 px-3 py-2 rounded-lg text-sm ${secondaryBtn}`}
                >
                  + 添加教育经历
                </button>
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    checked={editForm.profileVisibility.education === 'public'}
                    onChange={(e) => setEditForm({
                      ...editForm,
                      profileVisibility: {
                        ...editForm.profileVisibility,
                        education: e.target.checked ? 'public' : 'private',
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
                      const data = await res.json();
                      await fetchMe();
                      setIsEditing(false);
                      universeToast.success('保存成功');
                    } else {
                      const errorData = await res.json().catch(() => ({ message: '保存失败' }));
                      console.error('保存失败:', errorData);
                      universeToast.error(`保存失败: ${errorData.message || '未知错误'}`);
                    }
                  } catch (err: any) {
                    console.error('保存失败:', err);
                    universeToast.error(`保存失败: ${err.message || '网络错误'}`);
                  }
                }}
                className={`flex-1 px-4 py-2 rounded-lg text-white ${accentBtn}`}
              >
                保存
              </button>
              <button
                onClick={() => {
                  resetEditForm();
                  setIsEditing(false);
                }}
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
                      ? mode === 'waibi' ? 'bg-gray-600/20 text-gray-300' : 'bg-gray-100 text-gray-700'
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
