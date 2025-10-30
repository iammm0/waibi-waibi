"use client";

import { useEffect, useState } from 'react';
import { useVibe } from '@/app/providers';

type Me = { user: { userId: string; username?: string; name?: string; email?: string; phone?: string; avatarUrl?: string } };

export default function MePage() {
  const { mode } = useVibe();
  const panelClass = mode === 'waibi' ? 'bg-black border border-green-500/30 text-white' : 'bg-white border border-gray-200 text-gray-900';
  const secondaryBtn = mode === 'waibi' ? 'border border-green-500/30' : 'border';
  const accentBtn = mode === 'waibi' ? 'bg-green-500 hover:bg-green-600' : 'bg-[var(--accent-cyan)] hover:brightness-110';

  const [me, setMe] = useState<Me["user"] | null>(null);
  const [error, setError] = useState('');

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

  return (
    <div className={`mx-auto max-w-md p-6 mt-10 rounded-xl ${panelClass}`}>
      <h1 className="text-2xl font-bold mb-4">个人中心</h1>
      {me ? (
        <div className="flex items-center gap-4">
          <img src={me.avatarUrl || '/favicon.ico'} alt="avatar" className="h-14 w-14 rounded-full object-cover border" />
          <div>
            <div className="font-semibold">{me.username || me.name}</div>
            {me.email ? <div className="text-sm opacity-70">{me.email}</div> : null}
            {me.phone ? <div className="text-sm opacity-70">{me.phone}</div> : null}
          </div>
        </div>
      ) : (
        <div className="text-sm opacity-70">{error || '未登录'}</div>
      )}

      <div className="mt-6 flex gap-2">
        <button onClick={refreshAccess} className={`px-3 py-2 rounded text-white ${accentBtn}`}>刷新令牌</button>
        <button onClick={logout} className={`px-3 py-2 rounded ${secondaryBtn}`}>退出登录</button>
      </div>
    </div>
  );
}
