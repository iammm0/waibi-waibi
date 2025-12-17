'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import SectionHeader from '@/components/section-header';
import { useVibe } from '@/app/providers';
import { getPersonalityById } from '@/lib/mbti';
import ProgressiveImage from '@/components/progressive-image';
import Link from 'next/link';
import { getPersonaColors, getPersonaCardClasses, getPersonaButtonClasses } from '@/lib/persona-colors';

export default function MbtiAboutPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { mode } = useVibe();
  const persona = getPersonalityById(id);

  const personaColors = persona ? getPersonaColors(persona.name, mode) : null;
  const cardClass = persona ? getPersonaCardClasses(persona.name, mode) : (mode === 'waibi' ? 'bg-gray-900/50 border border-gray-700' : 'bg-gray-50 border border-gray-200');
  const accentBtn = persona ? getPersonaButtonClasses(persona.name, mode) : (mode === 'waibi' ? 'bg-gray-600 hover:bg-gray-700 text-white' : 'bg-gray-500 hover:bg-gray-600 text-white');
  
  const panelClass = personaColors 
    ? (mode === 'waibi' ? `bg-black/90 ${personaColors.border} text-white` : `bg-white ${personaColors.border} text-gray-900`)
    : (mode === 'waibi' ? 'bg-black/90 border border-gray-700 text-white' : 'bg-white border border-gray-200 text-gray-900');
  
  const accentClass = personaColors ? personaColors.accent : (mode === 'waibi' ? 'text-gray-300' : 'text-gray-700');

  if (!persona) {
    router.push('/');
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-2 max-w-6xl">
      <SectionHeader
        title={`${persona.name} 人格介绍`}
        subtitle={`深入了解 ${persona.name} 人格类型的特点和特征`}
        actions={
          <Link
            href={`/mbti/${id}`}
            className={`px-4 py-2 rounded-lg text-white transition ${accentBtn} hover:scale-105`}
          >
            开始训练 →
          </Link>
        }
      />

      {/* 人格基本信息卡片 */}
      <div className={`${panelClass} rounded-xl p-6 mt-8 shadow-lg`}>
        <div className="flex flex-col md:flex-row gap-6">
          {/* 人格图片 */}
          <div className="flex-shrink-0">
            <div className="w-48 h-48 md:w-64 md:h-64 rounded-xl overflow-hidden relative">
              <ProgressiveImage
                src={persona.image}
                alt={persona.name}
                fill
                sizes="(max-width: 768px) 192px, 256px"
                objectFit="cover"
                priority={true}
              />
            </div>
          </div>

          {/* 人格信息 */}
          <div className="flex-1">
            <h2 className={`text-3xl font-bold mb-4 ${mode === 'waibi' ? 'text-white' : 'text-gray-900'}`}>
              {persona.name}
            </h2>
            <p className={`text-lg mb-6 ${mode === 'waibi' ? 'text-gray-300' : 'text-gray-600'}`}>
              {persona.description}
            </p>
            
            {/* 占位内容区域 - 用户可以后续更新 */}
            <div className={`${cardClass} p-6 rounded-lg`}>
              <h3 className={`text-xl font-semibold mb-4 ${accentClass}`}>
                人格特征
              </h3>
              <div className={`space-y-3 ${mode === 'waibi' ? 'text-gray-300' : 'text-gray-600'}`}>
                <p className="opacity-80">
                  {/* 这里可以添加详细的人格特征描述 */}
                  更多内容即将更新...
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 详细内容区域 - 用户可以后续添加更多内容 */}
      <div className={`${panelClass} rounded-xl p-6 mt-6 shadow-lg`}>
        <h3 className={`text-2xl font-bold mb-6 ${accentClass}`}>
          详细介绍
        </h3>
        <div className={`space-y-4 ${mode === 'waibi' ? 'text-gray-300' : 'text-gray-600'}`}>
          <div className={`${cardClass} p-4 rounded-lg`}>
            <h4 className={`font-semibold mb-2 ${accentClass}`}>核心特质</h4>
            <p className="opacity-80">
              {/* 用户可以在这里添加核心特质内容 */}
              内容待更新...
            </p>
          </div>
          
          <div className={`${cardClass} p-4 rounded-lg`}>
            <h4 className={`font-semibold mb-2 ${accentClass}`}>行为模式</h4>
            <p className="opacity-80">
              {/* 用户可以在这里添加行为模式内容 */}
              内容待更新...
            </p>
          </div>

          <div className={`${cardClass} p-4 rounded-lg`}>
            <h4 className={`font-semibold mb-2 ${accentClass}`}>优势与挑战</h4>
            <p className="opacity-80">
              {/* 用户可以在这里添加优势与挑战内容 */}
              内容待更新...
            </p>
          </div>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-4 mt-6">
        <Link
          href={`/mbti/${id}`}
          className={`flex-1 px-6 py-3 rounded-lg text-center font-semibold transition ${accentBtn} hover:scale-105`}
        >
          开始训练此人格
        </Link>
        <Link
          href="/"
          className={`px-6 py-3 rounded-lg text-center font-semibold transition ${
            personaColors
              ? (mode === 'waibi' ? `bg-gray-800 hover:bg-gray-700 text-white ${personaColors.border}` : `bg-gray-100 hover:bg-gray-200 text-gray-900 ${personaColors.border}`)
              : (mode === 'waibi' ? 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-700' : 'bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-300')
          }`}
        >
          返回人格列表
        </Link>
      </div>
    </div>
  );
}

