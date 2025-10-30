import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 为精简运行时镜像，开启 standalone 输出
  output: 'standalone',
};

export default nextConfig;