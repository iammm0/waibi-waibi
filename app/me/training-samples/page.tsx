'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useVibe } from '@/app/providers';
import SectionHeader from '@/components/section-header';
import { fetchWithAuth } from '@/lib/auth-utils';
import { MBTI_TYPES } from '@/lib/mbti';
import { universeToast } from '@/components/universe-toast';
import { universeConfirm } from '@/components/universe-confirm';

interface TrainingSample {
  _id: string;
  personaCode: string;
  input: string;
  response: string;
  scenario?: string;
  createdAt: string;
}

export default function TrainingSamplesPage() {
  const { mode } = useVibe();
  const router = useRouter();
  const panelClass = mode === 'waibi' ? 'bg-black/90 border border-gray-700 text-white' : 'bg-white border border-gray-200 text-gray-900';
  const inputClass = mode === 'waibi' ? 'border border-gray-700 bg-gray-900/50 text-white' : 'border border-gray-300 bg-white text-gray-900';

  const [trainingSamples, setTrainingSamples] = useState<TrainingSample[]>([]);
  const [selectedPersonaFilter, setSelectedPersonaFilter] = useState<string>('all');
  const [selectedInstanceFilter, setSelectedInstanceFilter] = useState<string>('all');
  const [personaInstances, setPersonaInstances] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTrainingSamples = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth('/api/me/training');
      if (res.ok) {
        const data = await res.json();
        setTrainingSamples(data.items || []);
      }
    } catch (err) {
      console.error('获取训练样本失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPersonaInstances = async () => {
    try {
      const res = await fetchWithAuth('/api/persona-instance');
      if (res.ok) {
        const data = await res.json();
        setPersonaInstances(data.instances || []);
      }
    } catch (err) {
      console.error('获取模型实例失败:', err);
    }
  };

  useEffect(() => {
    fetchTrainingSamples();
    fetchPersonaInstances();
  }, []);

  const handleDeleteTrainingSample = async (sampleId: string) => {
    const confirmed = await universeConfirm.confirm(
      '确定要删除这个训练样本吗？',
      { type: 'warning', title: '删除训练样本', confirmText: '删除', cancelText: '取消' }
    );
    if (!confirmed) return;

    try {
      const res = await fetchWithAuth(`/api/me/training`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sampleId }),
      });
      if (res.ok) {
        await fetchTrainingSamples();
        universeToast.success('删除成功');
      } else {
        universeToast.error('删除失败');
      }
    } catch (err) {
      universeToast.error('删除失败');
    }
  };

  // 筛选逻辑
  let filteredSamples = trainingSamples.filter(s => 
    selectedPersonaFilter === 'all' || s.personaCode === selectedPersonaFilter
  );
  
  if (selectedInstanceFilter === 'used') {
    const usedSampleIds = new Set<string>();
    personaInstances
      .filter(inst => inst.isPublic && inst.trainingSamples && Array.isArray(inst.trainingSamples))
      .forEach(inst => {
        inst.trainingSamples.forEach((sample: any) => {
          const sampleKey = `${sample.input}|${sample.response}`;
          usedSampleIds.add(sampleKey);
        });
      });
    filteredSamples = filteredSamples.filter(s => {
      const sampleKey = `${s.input}|${s.response}`;
      return usedSampleIds.has(sampleKey);
    });
  } else if (selectedInstanceFilter === 'unused') {
    const usedSampleIds = new Set<string>();
    personaInstances
      .filter(inst => inst.isPublic && inst.trainingSamples && Array.isArray(inst.trainingSamples))
      .forEach(inst => {
        inst.trainingSamples.forEach((sample: any) => {
          const sampleKey = `${sample.input}|${sample.response}`;
          usedSampleIds.add(sampleKey);
        });
      });
    filteredSamples = filteredSamples.filter(s => {
      const sampleKey = `${s.input}|${s.response}`;
      return !usedSampleIds.has(sampleKey);
    });
  }

  return (
    <div className="container mx-auto px-4 py-2 max-w-6xl">
      <SectionHeader 
        title="训练集管理" 
        subtitle="管理你的所有训练样本"
      />

      {/* 筛选器 */}
      <div className={`${panelClass} rounded-xl p-4 mt-6`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h3 className="text-lg font-semibold">筛选条件</h3>
          <div className="flex items-center gap-3 flex-wrap">
            <select
              value={selectedInstanceFilter}
              onChange={(e) => setSelectedInstanceFilter(e.target.value)}
              className={`px-3 py-1.5 rounded-lg text-sm ${inputClass} focus:outline-none focus:ring-2 ${
                mode === 'waibi' ? 'focus:ring-gray-500/50' : 'focus:ring-gray-500'
              }`}
            >
              <option value="all">全部样本</option>
              <option value="used">已发布模型使用的</option>
              <option value="unused">未使用的</option>
            </select>
            <select
              value={selectedPersonaFilter}
              onChange={(e) => setSelectedPersonaFilter(e.target.value)}
              className={`px-3 py-1.5 rounded-lg text-sm ${inputClass} focus:outline-none focus:ring-2 ${
                mode === 'waibi' ? 'focus:ring-gray-500/50' : 'focus:ring-gray-500'
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
              共 {filteredSamples.length} 条样本
            </span>
          </div>
        </div>
      </div>

      {/* 训练样本列表 */}
      {loading ? (
        <div className={`text-center py-8 ${mode === 'waibi' ? 'text-gray-400' : 'text-gray-500'}`}>
          加载中...
        </div>
      ) : filteredSamples.length === 0 ? (
        <div className={`${panelClass} rounded-xl p-8 text-center mt-6`}>
          <div className={`text-sm ${mode === 'waibi' ? 'text-gray-400' : 'text-gray-500'}`}>
            {selectedPersonaFilter === 'all' && selectedInstanceFilter === 'all' 
              ? '暂无训练样本' 
              : '暂无符合条件的训练样本'}
          </div>
        </div>
      ) : (
        <div className="space-y-3 mt-6 max-h-[600px] overflow-y-auto">
          {filteredSamples.map((sample) => {
            const isUsed = personaInstances.some(inst => 
              inst.isPublic && 
              inst.trainingSamples && 
              Array.isArray(inst.trainingSamples) &&
              inst.trainingSamples.some((s: any) => s.input === sample.input && s.response === sample.response)
            );
            return (
              <div key={sample._id} className={`p-4 rounded-lg border ${mode === 'waibi' ? 'bg-gray-900/50 border-emerald-400/30' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded text-xs ${mode === 'waibi' ? 'bg-emerald-400/20 text-emerald-300' : 'bg-blue-100 text-blue-700'}`}>
                        {sample.personaCode.toUpperCase()}
                      </span>
                      {isUsed && (
                        <span className={`px-2 py-1 rounded text-xs ${mode === 'waibi' ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-700'}`}>
                          已使用
                        </span>
                      )}
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
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDeleteTrainingSample(sample._id)}
                      className={`px-3 py-1 rounded text-sm transition ${mode === 'waibi' ? 'text-red-400 hover:bg-red-500/20' : 'text-red-600 hover:bg-red-50'}`}
                    >
                      删除
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

