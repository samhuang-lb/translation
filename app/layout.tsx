import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '🌍 实时翻译工具 - 长文本支持',
  description: '快速、准确的多语言翻译服务，支持长文本自动分段翻译，基于 Go Translation Engine',
  keywords: ['翻译', '在线翻译', '实时翻译', '多语言', '长文本翻译', 'Next.js'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
