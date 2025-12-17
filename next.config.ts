import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 为精简运行时镜像，开启 standalone 输出
  output: 'standalone',
  images: {
    // 配置 Next.js 16 要求的图片质量选项
    qualities: [20, 85],
  },
};

export default nextConfig;