'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useVibe } from '@/app/providers';
import { fetchWithAuth } from '@/lib/auth-utils';
import SectionHeader from '@/components/section-header';
import { universeToast } from '@/components/universe-toast';

export default function ImportWechatPage() {
  const { mode } = useVibe();
  const router = useRouter();
  const panelClass = mode === 'waibi' ? 'bg-black/90 border border-green-500/30 text-white' : 'bg-white border border-gray-200 text-gray-900';
  const inputClass = mode === 'waibi' ? 'border border-green-500/30 bg-gray-900/50 text-white' : 'border border-gray-300 bg-white text-gray-900';
  const accentBtn = mode === 'waibi' ? 'bg-green-500 hover:bg-green-600' : 'bg-[var(--accent-cyan)] hover:brightness-110';
  const secondaryBtn = mode === 'waibi' ? 'border border-green-500/30 bg-gray-800/50 hover:bg-gray-800' : 'border border-gray-300 bg-gray-50 hover:bg-gray-100';

  const [file, setFile] = useState<File | null>(null);
  const [selectedPersona, setSelectedPersona] = useState<string>('intj');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState('');
  const [result, setResult] = useState<{ success: number; failed: number } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === 'application/json' || selectedFile.name.endsWith('.json')) {
        setFile(selectedFile);
      } else {
        universeToast.warning('请选择JSON格式的文件');
      }
    }
  };

  const handleImport = async () => {
    if (!file) {
      universeToast.warning('请先选择文件');
      return;
    }

    setProcessing(true);
    setProgress('正在读取文件...');
    setResult(null);

    try {
      // 读取文件内容
      const text = await file.text();
      let chatData: any;
      
      try {
        chatData = JSON.parse(text);
      } catch (err) {
        throw new Error('文件格式错误，无法解析JSON');
      }

      setProgress('正在处理聊天记录...');

      // 发送到后端处理
      const res = await fetchWithAuth('/api/me/import-wechat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatData,
          personaCode: selectedPersona,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setResult(data);
        setProgress('处理完成！');
        universeToast.success(`导入成功：${data.success} 条样本，${data.failed} 条失败`);
      } else {
        const errorData = await res.json();
        throw new Error(errorData?.message || '导入失败');
      }
    } catch (err: any) {
      universeToast.error(err?.message || '导入失败，请检查文件格式');
      setProgress('');
    } finally {
      setProcessing(false);
    }
  };

  const MBTI_TYPES = [
    { name: 'INTJ', code: 'intj' },
    { name: 'INTP', code: 'intp' },
    { name: 'INFJ', code: 'infj' },
    { name: 'INFP', code: 'infp' },
    { name: 'ISTJ', code: 'istj' },
    { name: 'ISFJ', code: 'isfj' },
    { name: 'ISTP', code: 'istp' },
    { name: 'ISFP', code: 'isfp' },
    { name: 'ENTJ', code: 'entj' },
    { name: 'ENTP', code: 'entp' },
    { name: 'ENFJ', code: 'enfj' },
    { name: 'ENFP', code: 'enfp' },
    { name: 'ESTJ', code: 'estj' },
    { name: 'ESFJ', code: 'esfj' },
    { name: 'ESTP', code: 'estp' },
    { name: 'ESFP', code: 'esfp' },
  ];

  return (
    <div className="container mx-auto px-4 py-2 max-w-4xl">
      <SectionHeader 
        icon="📥"
        title="导入微信聊天记录" 
        subtitle="将微信聊天记录转换为训练样本，用于训练人格模型"
      />

      <div className={`rounded-xl shadow-md p-4 sm:p-6 mt-6 ${panelClass}`}>
        <div className="space-y-6">
          {/* 文件选择 */}
          <div>
            <label className="block text-sm font-medium mb-2">选择微信聊天记录文件</label>
            <input
              type="file"
              accept=".json,application/json"
              onChange={handleFileChange}
              className={`w-full p-3 rounded-lg ${inputClass} file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold ${
                mode === 'waibi' 
                  ? 'file:bg-green-500 file:text-white file:hover:bg-green-600' 
                  : 'file:bg-[var(--accent-cyan)] file:text-white file:hover:brightness-110'
              }`}
              disabled={processing}
            />
            {file && (
              <div className="mt-2 text-sm opacity-70">
                已选择: {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </div>
            )}
            <div className="mt-2 text-xs opacity-60">
              支持JSON格式的微信聊天记录文件
            </div>
          </div>

          {/* 人格选择 */}
          <div>
            <label className="block text-sm font-medium mb-2">选择目标人格</label>
            <select
              value={selectedPersona}
              onChange={(e) => setSelectedPersona(e.target.value)}
              className={`w-full p-3 rounded-lg ${inputClass}`}
              disabled={processing}
            >
              {MBTI_TYPES.map((type) => (
                <option key={type.code} value={type.code}>
                  {type.name}
                </option>
              ))}
            </select>
            <div className="mt-2 text-xs opacity-60">
              聊天记录将被转换为该人格的训练样本
            </div>
          </div>

          {/* 处理进度 */}
          {processing && (
            <div className={`p-4 rounded-lg ${mode === 'waibi' ? 'bg-gray-900/50' : 'bg-gray-50'}`}>
              <div className="text-sm mb-2">{progress}</div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full animate-pulse" style={{ width: '50%' }}></div>
              </div>
            </div>
          )}

          {/* 处理结果 */}
          {result && (
            <div className={`p-4 rounded-lg ${mode === 'waibi' ? 'bg-green-500/20 border border-green-500/30' : 'bg-green-50 border border-green-200'}`}>
              <div className="text-sm font-medium mb-2">导入结果</div>
              <div className="text-sm">
                <div>成功: {result.success} 条样本</div>
                <div>失败: {result.failed} 条记录</div>
              </div>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleImport}
              disabled={!file || processing}
              className={`flex-1 px-6 py-3 rounded-lg text-white ${accentBtn} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {processing ? '处理中...' : '开始导入'}
            </button>
            <button
              onClick={() => router.back()}
              className={`px-6 py-3 rounded-lg ${secondaryBtn}`}
              disabled={processing}
            >
              返回
            </button>
          </div>

          {/* 说明信息 */}
          <div className={`p-4 rounded-lg ${mode === 'waibi' ? 'bg-gray-900/50' : 'bg-gray-50'}`}>
            <div className="text-sm font-medium mb-2">使用说明</div>
            <ul className="text-xs space-y-1 opacity-80 list-disc list-inside">
              <li>请上传JSON格式的微信聊天记录文件</li>
              <li>系统会自动识别对话角色，将聊天记录转换为训练样本</li>
              <li>转换后的样本会保存到选定的人格训练集中</li>
              <li>您可以在个人中心的"训练集管理"中查看和管理这些样本</li>
              <li>导入的样本可用于训练对应的人格模型</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

