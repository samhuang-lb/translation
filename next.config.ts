import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    // 允许来自局域网其他设备的开发请求
    allowedDevOrigins: ['192.168.41.243'],
      // 启用严格模式
  reactStrictMode: true,
   // 优化构建输出
   compress: true,
  
   // 生产环境移除 console.log
   compiler: {
     removeConsole: process.env.NODE_ENV === 'production',
   },
};

export default nextConfig;
