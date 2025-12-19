import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  
  // 禁用图片优化（加快构建）
  images: {
    unoptimized: true,
  },
  
  // 启用严格模式
  reactStrictMode: true,
  
  // 优化构建输出
  compress: true,
  
  // 生产环境移除 console.log
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // 优化打包
  swcMinify: true,
};

export default nextConfig;
