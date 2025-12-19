'use client';

import { useState, useEffect } from 'react';

const languages = [
  { code: 'auto', name: '自动检测', flag: '🌐' },
  { code: 'zh-CN', name: '简体中文', flag: '🇨🇳' },
  { code: 'zh-TW', name: '繁体中文', flag: '🇹🇼' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
];

const examples = [
  { text: 'Hello World', from: 'en', to: 'zh-CN', desc: '英译中' },
  { text: '你好世界', from: 'zh-CN', to: 'en', desc: '中译英' },
  { text: 'こんにちは', from: 'ja', to: 'en', desc: '日译英' },
  { text: 'Good morning', from: 'en', to: 'ja', desc: '英译日' },
];

const longTextExample = `The quick brown fox jumps over the lazy dog. This is a comprehensive example of a longer text that demonstrates the system's ability to handle extended content.

Artificial Intelligence (AI) has become one of the most transformative technologies of our time. It encompasses various subfields including machine learning, natural language processing, computer vision, and robotics. Machine learning algorithms can learn from data and make predictions or decisions without being explicitly programmed.

Deep learning, a subset of machine learning, uses neural networks with multiple layers to analyze various factors of data. This technology has led to significant breakthroughs in image recognition, speech recognition, and language translation.`;

export default function TranslateClient() {
  const [sourceText, setSourceText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [fromLang, setFromLang] = useState('auto');
  const [toLang, setToLang] = useState('zh-CN');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [detectedLang, setDetectedLang] = useState('');
  const [progress, setProgress] = useState(0);

  const handleTranslate = async () => {
    if (!sourceText.trim()) {
      setError('请输入要翻译的文本');
      return;
    }

    setIsLoading(true);
    setError('');
    setProgress(0);
    setDetectedLang('');

    try {
      const isLongText = sourceText.length > 500;
      
      if (isLongText) {
        // 长文本处理 - 使用批量翻译 API
        setProgress(10);
        
        const response = await fetch('/api/translate/batch', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: sourceText,
            from: fromLang,
            to: toLang,
          }),
        });
        
        setProgress(50);
        
        if (!response.ok) {
          throw new Error('翻译请求失败');
        }
        
        const result = await response.json();
        
        setProgress(80);
        
        if (!result.success) {
          throw new Error(result.error || '翻译失败');
        }

        setTranslatedText(result.translated || '');
        
        if ('detectedLang' in result && fromLang === 'auto' && result.detectedLang) {
          setDetectedLang(result.detectedLang);
        }
        
        setProgress(100);
      } else {
        // 短文本处理 - 使用单个翻译 API
        const response = await fetch('/api/translate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: sourceText,
            from: fromLang,
            to: toLang,
          }),
        });
        
        if (!response.ok) {
          throw new Error('翻译请求失败');
        }
        
        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.error || '翻译失败');
        }

        setTranslatedText(result.translated || '');
        
        if (fromLang === 'auto' && result.from) {
          setDetectedLang(result.from);
        }
      }
    } catch (err: any) {
      setError(err.message || '翻译失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwapLanguages = () => {
    if (fromLang === 'auto') {
      alert('自动检测模式无法交换语言');
      return;
    }
    setFromLang(toLang);
    setToLang(fromLang);
  };

  const handleCopyResult = () => {
    if (!translatedText) {
      alert('还没有翻译结果');
      return;
    }
    navigator.clipboard.writeText(translatedText);
    alert('✅ 译文已复制到剪贴板！');
  };

  const loadExample = (text: string, from: string, to: string) => {
    setSourceText(text);
    setFromLang(from);
    setToLang(to);
    setTranslatedText('');
    setError('');
    setDetectedLang('');
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleTranslate();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [sourceText, fromLang, toLang]);

  const isLongText = sourceText.length > 500;

  return (
    <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12">
      {/* Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-xl">
          ❌ {error}
        </div>
      )}

      {detectedLang && (
        <div className="mb-6 p-4 bg-purple-100 border border-purple-400 text-purple-700 rounded-xl">
          🔍 检测到源语言: {languages.find(l => l.code === detectedLang)?.name || detectedLang}
        </div>
      )}

      {/* Language Selectors */}
      <div className="flex items-center justify-center gap-6 mb-8 flex-wrap">
        <div className="flex flex-col">
          <label className="text-sm font-semibold text-gray-700 mb-2">源语言</label>
          <select
            value={fromLang}
            onChange={(e) => setFromLang(e.target.value)}
            className="px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all text-gray-900 font-medium"
          >
            {languages.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.flag} {lang.name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleSwapLanguages}
          className="mt-6 p-3 bg-gray-100 hover:bg-purple-600 hover:text-white rounded-full transition-all transform hover:rotate-180"
          title="交换语言"
        >
          ⇄
        </button>

        <div className="flex flex-col">
          <label className="text-sm font-semibold text-gray-700 mb-2">目标语言</label>
          <select
            value={toLang}
            onChange={(e) => setToLang(e.target.value)}
            className="px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all text-gray-900 font-medium"
          >
            {languages.filter(l => l.code !== 'auto').map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.flag} {lang.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Text Areas */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-lg font-semibold text-gray-800">原文</label>
            <span className="text-sm text-gray-500">
              {sourceText.length} 字符
              {isLongText && <span className="ml-2 text-purple-600 font-semibold">· 长文本模式</span>}
            </span>
          </div>
          <textarea
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
            placeholder="在这里输入要翻译的文本...支持长文本自动分段翻译"
            className="w-full h-64 p-4 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all resize-none text-gray-900 placeholder:text-gray-400 text-base leading-relaxed"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-lg font-semibold text-gray-800">译文</label>
            <span className="text-sm text-gray-500">{translatedText.length} 字符</span>
          </div>
          <textarea
            value={translatedText}
            readOnly
            placeholder="翻译结果将显示在这里..."
            className="w-full h-64 p-4 border-2 border-gray-300 rounded-xl bg-gray-50 resize-none text-gray-900 placeholder:text-gray-400 text-base leading-relaxed"
          />
        </div>
      </div>

      {/* Progress Bar */}
      {isLoading && isLongText && (
        <div className="mb-6">
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-purple-600 to-indigo-600 h-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-center text-sm text-gray-600 mt-2">正在处理长文本... {progress}%</p>
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-4 justify-center flex-wrap">
        <button
          onClick={handleTranslate}
          disabled={isLoading}
          className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-xl hover:shadow-lg transform hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? '⏳ 翻译中...' : '🚀 立即翻译'}
        </button>
        <button
          onClick={() => {
            setSourceText('');
            setTranslatedText('');
            setError('');
            setDetectedLang('');
          }}
          className="px-8 py-3 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 transition-all"
        >
          🗑️ 清空
        </button>
        <button
          onClick={handleCopyResult}
          className="px-8 py-3 bg-green-100 text-green-700 font-semibold rounded-xl hover:bg-green-200 transition-all"
        >
          📋 复制译文
        </button>
      </div>

      <p className="text-center text-sm text-gray-500 mt-4">
        💡 提示: 按 <kbd className="px-2 py-1 bg-gray-100 rounded">Ctrl/Cmd + Enter</kbd> 快速翻译
      </p>

      {/* Examples */}
      <div className="mt-12 pt-8 border-t-2 border-gray-200">
        <h3 className="text-xl font-bold text-gray-800 mb-4">🚀 快速示例</h3>
        <div className="flex gap-3 flex-wrap">
          {examples.map((example, index) => (
            <button
              key={index}
              onClick={() => loadExample(example.text, example.from, example.to)}
              className="px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-lg hover:shadow-lg transform hover:-translate-y-1 transition-all"
            >
              {example.desc}
            </button>
          ))}
          <button
            onClick={() => loadExample(longTextExample, 'en', 'zh-CN')}
            className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:shadow-lg transform hover:-translate-y-1 transition-all"
          >
            📄 长文本示例
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 pt-8 border-t-2 border-gray-200 text-center text-gray-600">
        <p className="mb-2">💎 Powered by <strong className="text-purple-600">Go Translation Engine</strong></p>
        <p className="text-sm">支持 100+ 种语言 · 自动分段翻译长文本 · 并发翻译加速</p>
      </div>
    </div>
  );
}

