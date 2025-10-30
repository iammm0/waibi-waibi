
'use client';

import { ModelParams } from '@/types/model';
import { useVibe } from '@/app/providers';

interface ModelParametersProps {
  params: ModelParams;
  onParamChange: (param: keyof ModelParams, value: number) => void;
  isAdvancedMode: boolean;
}

export default function ModelParameters({ params, onParamChange, isAdvancedMode }: ModelParametersProps) {
  const { mode } = useVibe();
  const panelClass = mode === 'waibi'
    ? 'bg-black border border-green-500/30 shadow-[0_0_10px_rgba(139,255,78,0.3)]'
    : 'bg-white border border-gray-200 shadow-sm';
  const sectionTitleClass = mode === 'waibi' ? 'text-white' : 'text-gray-900';
  const labelTextClass = mode === 'waibi' ? 'text-gray-300' : 'text-gray-700';
  const trackClass = mode === 'waibi' ? 'bg-gray-900' : 'bg-gray-200';
  const accentClass = mode === 'waibi' ? 'accent-green-500' : 'accent-[var(--accent-cyan)]';
  const hintTextClass = mode === 'waibi' ? 'text-green-400' : 'text-gray-500';

  // 格式化参数值显示
  const formatValue = (param: keyof ModelParams, value: number): string => {
    switch(param) {
      case 'temperature':
      case 'topP':
        return value.toFixed(2);
      case 'learningRate':
        return value.toFixed(4);
      default:
        return value.toString();
    }
  };

  // 参数描述信息
  const paramDescriptions = {
    temperature: '控制输出的随机性，值越高回答越多样化',
    topP: '控制输出的多样性，与temperature类似但机制不同',
    topK: '控制每次预测时考虑的词汇数量',
    maxTokens: '控制AI回应的最大长度',
    epochs: '训练模型时的迭代次数',
    learningRate: '控制模型参数更新的步长'
  };

  return (
    <div className="space-y-6">
      {/* 基础参数 - 始终显示 */}
      <div className={`p-4 rounded-lg ${panelClass}`}>
        <h4 className={`font-medium mb-3 ${sectionTitleClass}`}>基础参数</h4>
        
        <div className="space-y-5">
          <div>
            <div className="flex justify-between mb-1">
              <label className={`text-sm font-medium ${labelTextClass}`}>
                温度 (Temperature): {formatValue('temperature', params.temperature)}
              </label>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={params.temperature}
              onChange={(e) => onParamChange('temperature', parseFloat(e.target.value))}
              className={`w-full h-2 ${trackClass} rounded-lg appearance-none cursor-pointer ${accentClass}`}
            />
            <p className={`text-xs mt-1 ${hintTextClass}`}>{paramDescriptions.temperature}</p>
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <label className={`text-sm font-medium ${labelTextClass}`}>
                最大 tokens: {formatValue('maxTokens', params.maxTokens)}
              </label>
            </div>
            <input
              type="range"
              min="50"
              max="500"
              step="10"
              value={params.maxTokens}
              onChange={(e) => onParamChange('maxTokens', parseInt(e.target.value))}
              className={`w-full h-2 ${trackClass} rounded-lg appearance-none cursor-pointer ${accentClass}`}
            />
            <p className={`text-xs mt-1 ${hintTextClass}`}>{paramDescriptions.maxTokens}</p>
          </div>
        </div>
      </div>

      {/* 高级参数 - 仅在高级模式下显示 */}
      {isAdvancedMode && (
        <div className={`p-4 rounded-lg mt-4 ${panelClass}`}>
          <h4 className={`font-medium mb-3 ${sectionTitleClass}`}>高级参数</h4>
          
          <div className="space-y-5">
            <div>
              <div className="flex justify-between mb-1">
                <label className={`text-sm font-medium ${labelTextClass}`}>
                  Top P: {formatValue('topP', params.topP)}
                </label>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={params.topP}
                onChange={(e) => onParamChange('topP', parseFloat(e.target.value))}
                className={`w-full h-2 ${trackClass} rounded-lg appearance-none cursor-pointer ${accentClass}`}
              />
              <p className={`text-xs mt-1 ${hintTextClass}`}>{paramDescriptions.topP}</p>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <label className={`text-sm font-medium ${labelTextClass}`}>
                  Top K: {formatValue('topK', params.topK)}
                </label>
              </div>
              <input
                type="range"
                min="1"
                max="100"
                step="1"
                value={params.topK}
                onChange={(e) => onParamChange('topK', parseInt(e.target.value))}
                className={`w-full h-2 ${trackClass} rounded-lg appearance-none cursor-pointer ${accentClass}`}
              />
              <p className={`text-xs mt-1 ${hintTextClass}`}>{paramDescriptions.topK}</p>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <label className={`text-sm font-medium ${labelTextClass}`}>
                  训练轮次: {formatValue('epochs', params.epochs)}
                </label>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={params.epochs}
                onChange={(e) => onParamChange('epochs', parseInt(e.target.value))}
                className={`w-full h-2 ${trackClass} rounded-lg appearance-none cursor-pointer ${accentClass}`}
              />
              <p className={`text-xs mt-1 ${hintTextClass}`}>{paramDescriptions.epochs}</p>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <label className={`text-sm font-medium ${labelTextClass}`}>
                  学习率: {formatValue('learningRate', params.learningRate)}
                </label>
              </div>
              <input
                type="range"
                min="0.0001"
                max="0.01"
                step="0.0001"
                value={params.learningRate}
                onChange={(e) => onParamChange('learningRate', parseFloat(e.target.value))}
                className={`w-full h-2 ${trackClass} rounded-lg appearance-none cursor-pointer ${accentClass}`}
              />
              <p className={`text-xs mt-1 ${hintTextClass}`}>{paramDescriptions.learningRate}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}