'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useVibe } from '@/app/providers';
import SectionHeader from '@/components/section-header';
import { fetchWithAuth } from '@/lib/auth-utils';
import { universeToast } from '@/components/universe-toast';
import { universeConfirm } from '@/components/universe-confirm';

export default function InstancesPage() {
  const { mode } = useVibe();
  const router = useRouter();
  const panelClass = mode === 'waibi' ? 'bg-black/90 border border-green-500/30 text-white' : 'bg-white border border-gray-200 text-gray-900';
  const accentBtn = mode === 'waibi' ? 'bg-green-500 hover:bg-green-600' : 'bg-[var(--accent-cyan)] hover:brightness-110';
  const secondaryBtn = mode === 'waibi' ? 'border border-green-500/30 bg-gray-800/50 hover:bg-gray-800' : 'border border-gray-300 bg-gray-50 hover:bg-gray-100';

  const [personaInstances, setPersonaInstances] = useState<any[]>([]);
  const [loadingInstances, setLoadingInstances] = useState(false);

  const fetchPersonaInstances = async () => {
    setLoadingInstances(true);
    try {
      const res = await fetchWithAuth('/api/persona-instance');
      if (res.ok) {
        const data = await res.json();
        setPersonaInstances(data.instances || []);
      }
    } catch (err) {
      console.error('获取模型实例失败:', err);
    } finally {
      setLoadingInstances(false);
    }
  };

  useEffect(() => {
    fetchPersonaInstances();
  }, []);

  return (
    <div className="container mx-auto px-4 py-2 max-w-6xl">
      <SectionHeader 
        title="模型实例管理" 
        subtitle="管理你创建的所有模型实例"
        icon="🤖"
        actions={
          <button
            onClick={() => router.push('/persona-instance/create')}
            className={`px-4 py-2 rounded-lg text-white text-sm ${accentBtn}`}
          >
            + 创建新实例
          </button>
        }
      />

      {loadingInstances ? (
        <div className={`text-center py-8 ${mode === 'waibi' ? 'text-gray-400' : 'text-gray-500'}`}>
          加载中...
        </div>
      ) : personaInstances.length === 0 ? (
        <div className={`${panelClass} rounded-xl p-8 text-center`}>
          <div className="text-sm mb-4 opacity-80">还没有创建任何模型实例</div>
          <button
            onClick={() => router.push('/persona-instance/create')}
            className={`px-4 py-2 rounded-lg text-white ${accentBtn}`}
          >
            立即创建
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {personaInstances.map((instance) => (
            <div
              key={instance._id}
              className={`p-4 rounded-lg border ${
                mode === 'waibi' ? 'bg-gray-900/50 border-green-500/30' : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">{instance.name}</h3>
                  {instance.description && (
                    <p className={`text-sm mb-2 ${mode === 'waibi' ? 'text-gray-300' : 'text-gray-600'}`}>
                      {instance.description.length > 50 ? instance.description.slice(0, 50) + '...' : instance.description}
                    </p>
                  )}
                </div>
                {instance.avatarUrl && (
                  <img
                    src={instance.avatarUrl}
                    alt={instance.name}
                    className="w-12 h-12 rounded-full object-cover ml-2"
                  />
                )}
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                {instance.personaCode && (
                  <span className={`px-2 py-1 rounded text-xs ${
                    mode === 'waibi' ? 'bg-green-500/20 text-green-400' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {instance.personaCode.toUpperCase()}
                  </span>
                )}
                {instance.isPublic && (
                  <span className={`px-2 py-1 rounded text-xs ${
                    mode === 'waibi' ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-700'
                  }`}>
                    公开
                  </span>
                )}
                {instance.isTrained && (
                  <span className={`px-2 py-1 rounded text-xs ${
                    mode === 'waibi' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    已训练
                  </span>
                )}
                {instance.isForked && (
                  <span className={`px-2 py-1 rounded text-xs ${
                    mode === 'waibi' ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700'
                  }`}>
                    二次开发
                  </span>
                )}
              </div>
              {instance.tags && instance.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {instance.tags.map((tag: string, index: number) => (
                    <span
                      key={index}
                      className={`px-2 py-0.5 rounded text-xs ${
                        mode === 'waibi' ? 'bg-gray-800 text-gray-300' : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => router.push(`/persona-instance/${instance._id}`)}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm text-white ${accentBtn}`}
                >
                  查看详情
                </button>
                <button
                  onClick={async () => {
                    const confirmed = await universeConfirm.confirm(
                      '确定要删除这个模型实例吗？',
                      { type: 'danger', title: '删除模型实例', confirmText: '删除', cancelText: '取消' }
                    );
                    if (!confirmed) return;
                    try {
                      const res = await fetchWithAuth(`/api/persona-instance/${instance._id}`, {
                        method: 'DELETE',
                      });
                      if (res.ok) {
                        await fetchPersonaInstances();
                        universeToast.success('删除成功');
                      } else {
                        universeToast.error('删除失败');
                      }
                    } catch (err) {
                      universeToast.error('删除失败');
                    }
                  }}
                  className={`px-3 py-2 rounded-lg text-sm ${
                    mode === 'waibi' ? 'text-red-400 hover:bg-red-500/20' : 'text-red-600 hover:bg-red-50'
                  }`}
                >
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

