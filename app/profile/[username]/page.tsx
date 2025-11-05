'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useVibe } from '@/app/providers';
import SectionHeader from '@/components/section-header';

interface PublicProfile {
  userId: string;
  name?: string;
  username?: string;
  avatarUrl?: string;
  email?: string;
  phone?: string;
}

export default function PublicProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params);
  const router = useRouter();
  const { mode } = useVibe();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [isOwn, setIsOwn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const panelClass = mode === 'waibi' ? 'bg-black/90 border border-green-500/30 text-white' : 'bg-white border border-gray-200 text-gray-900';
  const cardClass = mode === 'waibi' ? 'bg-black/50 border border-green-500/30 text-white' : 'bg-white border border-gray-200 text-gray-900';

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError('');
      try {
        // 公开主页可以使用fetchWithAuth，如果有token会自动带上，没有也可以访问
        const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
        const headers: HeadersInit = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        const res = await fetch(`/api/profile/${encodeURIComponent(username)}`, { headers });
        if (res.ok) {
          const data = await res.json();
          setProfile(data.user);
          setIsOwn(data.isOwn || false);
        } else if (res.status === 404) {
          setError('用户不存在');
        } else {
          setError('获取用户信息失败');
        }
      } catch (err) {
        setError('获取用户信息失败');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [username]);

  if (loading) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <div className={`text-center py-12 ${cardClass} rounded-xl`}>
          <div className="text-sm opacity-70">加载中...</div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <div className={`text-center py-12 ${cardClass} rounded-xl`}>
          <div className="text-sm opacity-70">{error || '用户不存在'}</div>
          <button
            onClick={() => router.back()}
            className={`mt-4 px-4 py-2 rounded-lg ${mode === 'waibi' ? 'bg-green-500 hover:bg-green-600' : 'bg-[var(--accent-cyan)] hover:brightness-110'} text-white`}
          >
            返回
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <SectionHeader 
        title={isOwn ? '我的公开主页' : `${profile.username || profile.name || '用户'}的主页`}
        subtitle={isOwn ? '这是其他人看到的你的公开信息' : '公开信息'}
      />

      <div className={`rounded-xl shadow-md p-6 mt-8 ${panelClass}`}>
        <div className="flex items-center gap-6 mb-6">
          {profile.avatarUrl && (
            <img
              src={profile.avatarUrl}
              alt={profile.username || profile.name || '用户'}
              className="w-24 h-24 rounded-full object-cover border-2 border-current/20"
            />
          )}
          <div>
            <h2 className="text-2xl font-bold">{profile.username || profile.name || '用户'}</h2>
            {profile.name && profile.name !== profile.username && (
              <div className="text-sm opacity-70 mt-1">{profile.name}</div>
            )}
            <div className="text-xs opacity-60 mt-2">ID: {profile.userId}</div>
          </div>
        </div>

        <div className="space-y-4">
          {profile.email && (
            <div>
              <div className="text-sm opacity-70 mb-1">邮箱</div>
              <div>{profile.email}</div>
            </div>
          )}
          {profile.phone && (
            <div>
              <div className="text-sm opacity-70 mb-1">手机</div>
              <div>{profile.phone}</div>
            </div>
          )}
        </div>

        {isOwn && (
          <div className="mt-6 pt-6 border-t border-current/20">
            <button
              onClick={() => router.push('/me')}
              className={`px-4 py-2 rounded-lg ${mode === 'waibi' ? 'bg-green-500 hover:bg-green-600' : 'bg-[var(--accent-cyan)] hover:brightness-110'} text-white`}
            >
              编辑个人资料
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

