// components/personality-card.tsx
'use client';

import Link from 'next/link';
import type { Personality } from '@/lib/mbti';
import ProgressiveImage from './progressive-image';

type Focus = 'top' | 'center' | 'bottom';
type Props = Personality & {
    /** 移动端是否避免裁剪（用 contain），默认 false */
    containOnMobile?: boolean;
    /** 裁剪对齐：默认 center；常用 top 可以避免把脸裁掉 */
    focus?: Focus;
    /** 自定义焦点（百分比），如 [50, 20] = 水平50% 垂直20% */
    focal?: [number, number];
};

export default function PersonalityCard({
                                            id, name, description, image,
                                            containOnMobile = false,
                                            focus = 'center',
                                            focal,
                                        }: Props) {
    // Image 的 object-position
    const objectPosition = focal
        ? `${focal[0]}% ${focal[1]}%`
        : focus === 'top'
            ? 'top'
            : focus === 'bottom'
                ? 'bottom'
                : 'center';

    // 移动端用 contain 避免裁剪；到 md 再切回 cover
    const objectFit = containOnMobile ? 'contain' : 'cover';

    return (
        <Link
            href={`/mbti/${id}`}
            className="group block w-full sm:w-1/2 md:w-1/4 p-2"
            prefetch
        >
            <div className="border rounded-xl overflow-hidden shadow-sm hover:shadow-lg bg-white dark:bg-gray-800 transition">
                {/* 👇 用"纵横比"而不是固定高度，移动端能多露出上半身 */}
                <div className="relative aspect-[4/3] md:aspect-[16/10] bg-gray-100 dark:bg-gray-700">
                    <ProgressiveImage
                        src={image}
                        alt={name}
                        fill
                        sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 25vw"
                        className="transition-transform duration-200 group-hover:scale-[1.03]"
                        objectFit={objectFit}
                        objectPosition={objectPosition}
                        priority={false}
                    />
                </div>

                <div className="p-4">
                    <div className="text-xl font-semibold text-gray-900 dark:text-gray-100">{name}</div>
                    <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">{description}</p>
                    <div className="mt-3 text-blue-600 dark:text-blue-400 text-sm">进入训练 →</div>
                </div>
            </div>
        </Link>
    );
}
