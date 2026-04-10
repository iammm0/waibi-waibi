'use client';

import { useMemo, useState } from 'react';
import { useVibe } from '@/app/providers';
import SectionHeader from '@/components/section-header';

const SBTI_URL = 'https://sbti.unun.dev';

export default function SbtiPage() {
  const { mode } = useVibe();
  const [iframeLoaded, setIframeLoaded] = useState(false);

  const panelClass = useMemo(
    () => mode === 'waibi'
      ? 'bg-black/90 border border-gray-700 text-white'
      : 'bg-white border border-gray-200 text-gray-900',
    [mode],
  );

  const hintClass = mode === 'waibi' ? 'text-gray-400' : 'text-gray-600';

  return (
    <div className="container mx-auto px-4 py-2 max-w-6xl">
      <SectionHeader
        title="SBTI 新世界"
        subtitle="已接入新世界板块，你可以直接在这里进入 SBTI。"
        actions={(
          <a
            href={SBTI_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={mode === 'waibi'
              ? 'px-4 py-2 rounded-lg border border-gray-600 bg-gray-800 text-white hover:bg-gray-700 transition'
              : 'px-4 py-2 rounded-lg border border-gray-300 bg-gray-100 text-gray-900 hover:bg-gray-200 transition'}
          >
            新窗口打开
          </a>
        )}
      />

      <div className={`mt-6 rounded-2xl shadow-md overflow-hidden ${panelClass}`}>
        {!iframeLoaded && (
          <div className={`px-5 py-4 text-sm ${hintClass}`}>
            正在加载 SBTI 新世界板块...
          </div>
        )}

        <iframe
          title="SBTI 新世界"
          src={SBTI_URL}
          className="w-full min-h-[75vh]"
          onLoad={() => setIframeLoaded(true)}
        />
      </div>

      <p className={`mt-3 text-xs ${hintClass}`}>
        如果当前网络环境无法内嵌访问，可使用右上角“新窗口打开”。
      </p>
    </div>
  );
}
