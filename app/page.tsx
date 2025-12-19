import TranslateClient from './components/TranslateClient';
import type { Metadata } from 'next';

// 生成页面元数据（服务端）
export const metadata: Metadata = {
  title: '🌍 实时翻译工具 | 支持100+语言',
  description: '快速、准确的多语言翻译工具，支持长文本分段翻译、自动语言检测、并发翻译加速。基于 Go Translation Engine 构建。',
  keywords: ['翻译', '多语言', '实时翻译', 'translation', 'multilingual', 'Go', 'Next.js'],
  openGraph: {
    title: '🌍 实时翻译工具',
    description: '快速、准确的多语言翻译 · 支持长文本分段翻译',
    type: 'website',
  },
};

// 强制静态生成（SSG）
export const dynamic = 'force-static';
export const revalidate = false;

// 服务端静态生成页面
export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header - 服务端渲染 */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-4 drop-shadow-lg">
            🌍 实时翻译工具
          </h1>
          <p className="text-white/90 text-lg drop-shadow">
            快速、准确的多语言翻译 · 支持长文本分段翻译
          </p>
          <div className="flex justify-center gap-3 mt-4 flex-wrap">
            <span className="bg-white/20 backdrop-blur-sm text-white px-4 py-1 rounded-full text-sm font-semibold shadow-lg">
              ✨ 实时翻译
            </span>
            <span className="bg-white/20 backdrop-blur-sm text-white px-4 py-1 rounded-full text-sm font-semibold shadow-lg">
              📄 长文本支持
            </span>
            <span className="bg-white/20 backdrop-blur-sm text-white px-4 py-1 rounded-full text-sm font-semibold shadow-lg">
              🚀 并发加速
            </span>
            <span className="bg-white/20 backdrop-blur-sm text-white px-4 py-1 rounded-full text-sm font-semibold shadow-lg">
              ⚡ Server Actions
            </span>
          </div>
        </div>

        {/* 客户端交互组件 */}
        <TranslateClient />
      </div>
    </div>
  );
}
