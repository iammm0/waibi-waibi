"use client";

import { useEffect, useState } from 'react';
import { useVibe } from '@/app/providers';
import AvatarEditor from '@/components/avatar-editor';

type Me = { user: { userId: string; username?: string; name?: string; email?: string; phone?: string; avatarUrl?: string } };

export default function MePage() {
  const { mode } = useVibe();
  const panelClass = mode === 'waibi' ? 'bg-black/90 border border-green-500/30 text-white shadow-[0_0_30px_rgba(21,243,255,0.12)]' : 'bg-white border border-gray-200 text-gray-900 shadow-sm';
  const secondaryBtn = mode === 'waibi' ? 'border border-green-500/30' : 'border';
  const accentBtn = mode === 'waibi' ? 'bg-green-500 hover:bg-green-600' : 'bg-[var(--accent-cyan)] hover:brightness-110';

  const [me, setMe] = useState<Me["user"] | null>(null);
  const [error, setError] = useState('');
  const [showAvatarEditor, setShowAvatarEditor] = useState(false);

  const fetchMe = async () => {
    setError('');
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!token) { setMe(null); return; }
    const res = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      const data: Me = await res.json();
      setMe(data.user);
    } else if (res.status === 401) {
      setMe(null);
      setError('未登录');
    } else {
      setError('获取用户信息失败');
    }
  };

  useEffect(() => { fetchMe(); }, []);

  const refreshAccess = async () => {
    const rt = localStorage.getItem('refreshToken');
    if (!rt) return;
    const r = await fetch('/api/auth/refresh', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken: rt })
    });
    if (r.ok) {
      const data = await r.json();
      localStorage.setItem('accessToken', data.accessToken);
      fetchMe();
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setMe(null);
  };

  const handleSaveAvatar = async (imageData: string) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!token) {
      alert('请先登录');
      return;
    }

    try {
      const res = await fetch('/api/auth/avatar', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ avatarUrl: imageData }),
      });

      if (res.ok) {
        const data: Me = await res.json();
        setMe(data.user);
        setShowAvatarEditor(false);
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

  return (
    <>
      <div className={`mx-auto max-w-md p-6 sm:p-7 mt-10 rounded-2xl ${panelClass}`}>
        <h1 className="text-2xl font-extrabold mb-4">个人中心</h1>
        {me ? (
          <div className="flex items-center gap-4">
            <div className="relative">
              <img src={me.avatarUrl || '/favicon.ico'} alt="avatar" className="h-16 w-16 rounded-full object-cover border" />
              <button
                onClick={() => setShowAvatarEditor(true)}
                className={`absolute bottom-0 right-0 w-6 h-6 rounded-full ${accentBtn} text-white text-xs flex items-center justify-center border-2 ${mode === 'waibi' ? 'border-black' : 'border-white'}`}
                title="编辑头像"
              >
                ✎
              </button>
            </div>
            <div>
              <div className="font-semibold text-lg">{me.username || me.name}</div>
              <div className="text-xs opacity-70">ID: {me.userId}</div>
              {me.email ? <div className="text-sm opacity-80 mt-1">{me.email}</div> : null}
              {me.phone ? <div className="text-sm opacity-80">{me.phone}</div> : null}
            </div>
          </div>
        ) : (
          <div className="text-sm opacity-70">{error || '未登录'}</div>
        )}

        <div className="mt-6 grid grid-cols-2 gap-2">
          <button onClick={refreshAccess} className={`px-3 py-2 rounded-lg text-white ${accentBtn}`}>刷新令牌</button>
          <button onClick={logout} className={`px-3 py-2 rounded-lg ${secondaryBtn}`}>退出登录</button>
        </div>
      </div>

      {showAvatarEditor && (
        <AvatarEditor
          currentAvatarUrl={me?.avatarUrl}
          onSave={handleSaveAvatar}
          onCancel={() => setShowAvatarEditor(false)}
        />
      )}
    </>
  );
}
