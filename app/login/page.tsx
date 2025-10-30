"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useVibe } from '@/app/providers';

export default function AuthPage() {
  const router = useRouter();
  const { mode } = useVibe();
  const panelClass = mode === 'waibi' ? 'bg-black border border-green-500/30 text-white' : 'bg-white border border-gray-200 text-gray-900';
  const inputClass = mode === 'waibi' ? 'w-full border border-green-500/30 bg-black text-white rounded px-3 py-2 mb-3 focus:ring-2 focus:ring-green-500' : 'w-full border border-gray-300 bg-white text-gray-900 rounded px-3 py-2 mb-3 focus:ring-2 focus:ring-[var(--accent-cyan)]';
  const accentBtn = mode === 'waibi' ? 'bg-green-500 hover:bg-green-600' : 'bg-[var(--accent-cyan)] hover:brightness-110';

  const [modeForm, setModeForm] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    identifier: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    avatarUrl: ''
  });
  const [error, setError] = useState('');

  const onChange = (k: string, v: string) => setForm((s) => ({ ...s, [k]: v }));

  const submit = async () => {
    setLoading(true);
    setError('');
    try {
      if (modeForm === 'login') {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier: form.identifier.trim(), password: form.password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || '登录失败');
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        router.push('/mbti');
      } else {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: form.username.trim(),
            email: form.email.trim() || undefined,
            phone: form.phone.trim() || undefined,
            password: form.password,
            confirmPassword: form.confirmPassword,
            avatarUrl: form.avatarUrl.trim() || undefined,
          })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || '注册失败');
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        router.push('/mbti');
      }
    } catch (e: any) {
      setError(e?.message || '请求失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`mx-auto max-w-md p-6 mt-10 rounded-xl ${panelClass}`}>
      <h1 className="text-2xl font-bold mb-4">{modeForm === 'login' ? '登录' : '注册'}</h1>

      {modeForm === 'login' ? (
        <>
          <label className="block text-sm mb-1">用户名/邮箱/手机</label>
          <input className={inputClass} value={form.identifier} onChange={e=>onChange('identifier', e.target.value)} />
          <label className="block text-sm mb-1">密码</label>
          <input type="password" className={inputClass} value={form.password} onChange={e=>onChange('password', e.target.value)} />
        </>
      ) : (
        <>
          <label className="block text-sm mb-1">用户名</label>
          <input className={inputClass} value={form.username} onChange={e=>onChange('username', e.target.value)} />
          <label className="block text-sm mb-1">邮箱（可选）</label>
          <input className={inputClass} value={form.email} onChange={e=>onChange('email', e.target.value)} />
          <label className="block text-sm mb-1">手机（可选）</label>
          <input className={inputClass} value={form.phone} onChange={e=>onChange('phone', e.target.value)} />
          <label className="block text-sm mb-1">头像 URL（可选）</label>
          <input className={inputClass} value={form.avatarUrl} onChange={e=>onChange('avatarUrl', e.target.value)} />
          <label className="block text-sm mb-1">密码</label>
          <input type="password" className={inputClass} value={form.password} onChange={e=>onChange('password', e.target.value)} />
          <label className="block text-sm mb-1">确认密码</label>
          <input type="password" className={inputClass} value={form.confirmPassword} onChange={e=>onChange('confirmPassword', e.target.value)} />
        </>
      )}

      {error && <div className="mb-3 text-sm text-red-500">{error}</div>}

      <button onClick={submit} disabled={loading} className={`w-full text-white py-2 rounded ${loading ? 'opacity-60 cursor-not-allowed' : ''} ${accentBtn}`}>
        {loading ? '请稍候...' : (modeForm === 'login' ? '登录' : '注册')}
      </button>

      <div className="mt-3 text-sm">
        {modeForm === 'login' ? (
          <span>没有账号？<button className="text-[var(--accent-cyan)]" onClick={()=>setModeForm('register')}>去注册</button></span>
        ) : (
          <span>已有账号？<button className="text-[var(--accent-cyan)]" onClick={()=>setModeForm('login')}>去登录</button></span>
        )}
      </div>
    </div>
  );
}
