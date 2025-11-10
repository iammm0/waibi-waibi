'use client';

import { useState } from 'react';
import Image from 'next/image';

interface ProgressiveImageProps {
  src: string;
  alt: string;
  className?: string;
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
  objectFit?: 'contain' | 'cover';
  objectPosition?: string;
  /**
   * 是否禁用Next.js图片优化
   * 在生产环境的standalone模式下，建议设为true以避免图片加载问题
   * @default true
   */
  unoptimized?: boolean;
}

/**
 * 渐进式图片加载组件
 * 先加载低质量预览图（带模糊效果），然后渐进式加载高清原图
 */
export default function ProgressiveImage({
  src,
  alt,
  className = '',
  fill = false,
  sizes,
  priority = false,
  objectFit = 'cover',
  objectPosition = 'center',
  unoptimized = true, // 默认禁用优化，避免生产环境standalone模式下的图片加载问题
}: ProgressiveImageProps) {
  const [isHighResLoaded, setIsHighResLoaded] = useState(false);

  const containerClass = fill ? 'absolute inset-0' : 'relative w-full h-full';

  return (
    <div className={containerClass}>
      {/* 预览图（低质量，带模糊）- 先加载 */}
      <div className={`absolute inset-0 transition-opacity duration-500 ${
        isHighResLoaded ? 'opacity-0' : 'opacity-100'
      }`}>
        <Image
          src={src}
          alt={alt}
          fill={fill}
          sizes={sizes}
          className={`${className} blur-sm`}
          style={{ objectFit, objectPosition }}
          priority={priority}
          quality={20}
          unoptimized={unoptimized}
        />
      </div>
      
      {/* 高清原图 - 渐进式加载 */}
      <div className={`absolute inset-0 transition-opacity duration-700 ${
        isHighResLoaded ? 'opacity-100' : 'opacity-0'
      }`}>
        <Image
          src={src}
          alt={alt}
          fill={fill}
          sizes={sizes}
          className={className}
          style={{ objectFit, objectPosition }}
          priority={priority}
          quality={85}
          onLoad={() => setIsHighResLoaded(true)}
          unoptimized={unoptimized}
        />
      </div>
    </div>
  );
}