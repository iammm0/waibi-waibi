"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useVibe } from '@/app/providers';

export default function AuthPage() {
  const router = useRouter();
  const { mode } = useVibe();
  const panelClass = mode === 'waibi' ? 'bg-black/90 border border-green-500/30 text-white shadow-[0_0_30px_rgba(21,243,255,0.12)]' : 'bg-white border border-gray-200 text-gray-900 shadow-sm';
  const inputClass = mode === 'waibi' ? 'w-full border border-green-500/30 bg-black text-white rounded-lg px-3 py-2 mb-3 focus:ring-2 focus:ring-green-500 placeholder-gray-500' : 'w-full border border-gray-300 bg-white text-gray-900 rounded-lg px-3 py-2 mb-3 focus:ring-2 focus:ring-[var(--accent-cyan)] placeholder-gray-400';
  const accentBtn = mode === 'waibi' ? 'bg-green-500 hover:bg-green-600' : 'bg-[var(--accent-cyan)] hover:brightness-110';

  const [modeForm, setModeForm] = useState<'login' | 'register' | 'forgot-password' | 'reset-password'>('login');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    identifier: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  const [error, setError] = useState('');
  const [resetToken, setResetToken] = useState('');

  const onChange = (k: string, v: string) => setForm((s) => ({ ...s, [k]: v }));

  const handleForgotPassword = async () => {
    if (!form.email.trim()) {
      setError('请输入邮箱地址');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || '请求失败');
      setResetToken(data.resetToken);
      setModeForm('reset-password');
      setError('');
    } catch (e: any) {
      setError(e?.message || '请求失败');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetToken || !form.newPassword || !form.confirmNewPassword) {
      setError('请填写完整信息');
      return;
    }
    if (form.newPassword !== form.confirmNewPassword) {
      setError('两次输入的密码不一致');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resetToken,
          newPassword: form.newPassword,
          confirmPassword: form.confirmNewPassword
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || '重置失败');
      alert('密码重置成功，请使用新密码登录');
      setModeForm('login');
      setResetToken('');
      setForm({ identifier: '', email: '', phone: '', password: '', confirmPassword: '', newPassword: '', confirmNewPassword: '' });
    } catch (e: any) {
      setError(e?.message || '重置失败');
    } finally {
      setLoading(false);
    }
  };

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
            email: form.email.trim(),
            phone: form.phone.trim() || undefined,
            password: form.password,
            confirmPassword: form.confirmPassword,
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
    <div className={`mx-auto max-w-md p-6 sm:p-7 mt-10 rounded-2xl ${panelClass}`}>
      <div className="mb-4">
        <h1 className="text-2xl font-extrabold">
          {modeForm === 'login' ? '登录' : 
           modeForm === 'register' ? '注册' : 
           modeForm === 'forgot-password' ? '忘记密码' : 
           '重置密码'}
        </h1>
        <p className="text-sm opacity-70 mt-1">
          {modeForm === 'login' ? '欢迎回来，继续你的训练与对话。' : 
           modeForm === 'register' ? '创建账号以保存训练样本与个性化设置。' : 
           modeForm === 'forgot-password' ? '请输入您的邮箱地址，我们将发送重置密码链接。' : 
           '请设置您的新密码。'}
        </p>
      </div>

      {modeForm === 'forgot-password' ? (
        <>
          <label className="block text-sm mb-1">邮箱地址</label>
          <input 
            type="email"
            className={inputClass} 
            placeholder="you@example.com" 
            value={form.email} 
            onChange={e=>onChange('email', e.target.value)} 
          />
          <p className="text-xs opacity-70 mb-3">请输入您的邮箱地址，我们将发送重置密码链接</p>
          <button onClick={handleForgotPassword} disabled={loading} className={`w-full text-white py-2 rounded-lg ${loading ? 'opacity-60 cursor-not-allowed' : ''} ${accentBtn}`}>
            {loading ? '请稍候...' : '发送重置链接'}
          </button>
          <button onClick={() => setModeForm('login')} className="mt-2 w-full text-sm text-[var(--accent-cyan)] underline underline-offset-4">
            返回登录
          </button>
        </>
      ) : modeForm === 'reset-password' ? (
        <>
          <label className="block text-sm mb-1">新密码</label>
          <input 
            type="password"
            className={inputClass} 
            placeholder="至少 6 位" 
            value={form.newPassword} 
            onChange={e=>onChange('newPassword', e.target.value)} 
          />
          <label className="block text-sm mb-1">确认新密码</label>
          <input 
            type="password"
            className={inputClass} 
            placeholder="再次输入新密码" 
            value={form.confirmNewPassword} 
            onChange={e=>onChange('confirmNewPassword', e.target.value)} 
          />
          <button onClick={handleResetPassword} disabled={loading} className={`w-full text-white py-2 rounded-lg ${loading ? 'opacity-60 cursor-not-allowed' : ''} ${accentBtn}`}>
            {loading ? '请稍候...' : '重置密码'}
          </button>
          <button onClick={() => setModeForm('login')} className="mt-2 w-full text-sm text-[var(--accent-cyan)] underline underline-offset-4">
            返回登录
          </button>
        </>
      ) : modeForm === 'login' ? (
        <>
          <label className="block text-sm mb-1">用户名/邮箱/手机</label>
          <input className={inputClass} placeholder="yourname / you@example.com / 138****" value={form.identifier} onChange={e=>onChange('identifier', e.target.value)} />
          <label className="block text-sm mb-1">密码</label>
          <input type="password" className={inputClass} placeholder="至少 6 位，建议包含数字与字母" value={form.password} onChange={e=>onChange('password', e.target.value)} />
        </>
      ) : (
        <>
          <label className="block text-sm mb-1">邮箱 <span className="text-red-500">*</span></label>
          <input 
            type="email"
            className={inputClass} 
            placeholder="you@example.com" 
            value={form.email} 
            onChange={e=>onChange('email', e.target.value)} 
            required
          />
          <label className="block text-sm mb-1">手机（可选）</label>
          <input 
            type="tel"
            className={inputClass} 
            placeholder="138****" 
            value={form.phone} 
            onChange={e=>onChange('phone', e.target.value)} 
          />
          <label className="block text-sm mb-1">密码</label>
          <input type="password" className={inputClass} placeholder="至少 6 位，建议包含数字与字母" value={form.password} onChange={e=>onChange('password', e.target.value)} />
          <label className="block text-sm mb-1">确认密码</label>
          <input type="password" className={inputClass} placeholder="再次输入密码" value={form.confirmPassword} onChange={e=>onChange('confirmPassword', e.target.value)} />
        </>
      )}

      {error && <div className="mb-3 text-sm text-red-500">{error}</div>}

      {(modeForm === 'login' || modeForm === 'register') && (
        <button onClick={submit} disabled={loading} className={`w-full text-white py-2 rounded-lg ${loading ? 'opacity-60 cursor-not-allowed' : ''} ${accentBtn}`}>
          {loading ? '请稍候...' : (modeForm === 'login' ? '登录' : '注册')}
        </button>
      )}

      {(modeForm === 'login' || modeForm === 'register') && (
        <div className="mt-3 text-sm flex items-center justify-between">
          {modeForm === 'login' ? (
            <span>没有账号？<button className="text-[var(--accent-cyan)] underline underline-offset-4" onClick={()=>setModeForm('register')}>去注册</button></span>
          ) : (
            <span>已有账号？<button className="text-[var(--accent-cyan)] underline underline-offset-4" onClick={()=>setModeForm('login')}>去登录</button></span>
          )}
          {modeForm === 'login' && (
            <button className="opacity-70 hover:opacity-100 underline underline-offset-4" onClick={() => setModeForm('forgot-password')}>
              忘记密码?
            </button>
          )}
        </div>
      )}
    </div>
  );
}
