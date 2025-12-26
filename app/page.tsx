'use client';

import TranslateClient from './components/TranslateClient';
import { useState, useEffect } from 'react';

// 页面标题和描述的多语言文本
const PAGE_TRANSLATIONS: Record<string, Record<string, string>> = {
  'title': {
    'zh-CN': '财经 AI 翻译工作台',
    'en': 'Financial AI Translation Workspace',
    'ja': '金融AI翻訳ワークスペース',
    'ko': '금융 AI 번역 작업대',
    'de': 'Finanz-KI-Übersetzungsarbeitsbereich',
    'fr': 'Espace de travail de traduction IA financière',
    'es': 'Espacio de trabajo de traducción de IA financiera',
    'ru': 'Рабочее пространство финансового перевода ИИ',
    'pt': 'Espaço de trabalho de tradução de IA financeira',
    'it': 'Spazio di lavoro di traduzione IA finanziaria',
    'ar': 'مساحة عمل الترجمة المالية بالذكاء الاصطناعي',
    'hi': 'वित्तीय एआई अनुवाद कार्यक्षेत्र',
  },
  'subtitle': {
    'zh-CN': '自动检测语种 · 深度财经语料 · 实时多语言切换 · WebSocket 实时连接',
    'en': 'Auto Detect · Financial Corpus · Real-time Switching · WebSocket Connection',
    'ja': '自動検出 · 金融コーパス · リアルタイム切替 · WebSocket接続',
    'ko': '자동 감지 · 금융 말뭉치 · 실시간 전환 · WebSocket 연결',
    'de': 'Auto-Erkennung · Finanzkorpus · Echtzeit-Umschaltung · WebSocket-Verbindung',
    'fr': 'Détection auto · Corpus financier · Commutation temps réel · Connexion WebSocket',
    'es': 'Detección automática · Corpus financiero · Cambio en tiempo real · Conexión WebSocket',
    'ru': 'Автоопределение · Финансовый корпус · Переключение в реальном времени · WebSocket соединение',
    'pt': 'Detecção automática · Corpus financeiro · Troca em tempo real · Conexão WebSocket',
    'it': 'Rilevamento automatico · Corpus finanziario · Commutazione in tempo reale · Connessione WebSocket',
    'ar': 'الكشف التلقائي · المجموعة المالية · التبديل في الوقت الحقيقي · اتصال WebSocket',
    'hi': 'स्वचालित पहचान · वित्तीय कोष · रीयल-टाइम स्विचिंग · WebSocket कनेक्शन',
  }
};

export default function Home() {
  const [currentLang, setCurrentLang] = useState('zh-CN');
  
  const getPageText = (key: string): string => {
    return PAGE_TRANSLATIONS[key]?.[currentLang] || PAGE_TRANSLATIONS[key]?.['zh-CN'] || '';
  };
  
  // 动态更新页面标题
  useEffect(() => {
    const title = PAGE_TRANSLATIONS['title']?.[currentLang] || PAGE_TRANSLATIONS['title']?.['zh-CN'] || '';
    document.title = `📈 ${title} | Financial Translator`;
  }, [currentLang]);

  return (
    // 使用 h-screen 和 overflow-hidden 固定视口，移除多余的 padding
    <div className="h-screen w-full bg-linear-to-br from-slate-900 via-blue-900 to-indigo-900 flex flex-col items-center overflow-hidden p-2 md:p-3">
      <div className="w-full h-full flex flex-col max-w-[1800px]">
        {/* Header - 更紧凑 */}
        <div className="text-center mb-2 md:mb-3 shrink-0">
          <h1 className="text-xl md:text-2xl font-bold text-white mb-1 drop-shadow-lg flex items-center justify-center gap-2">
            <span>📈</span> {getPageText('title')}
          </h1>
          <p className="text-white/70 text-xs md:text-sm">
            {getPageText('subtitle')}
          </p>
        </div>

        {/* 客户端交互组件 - 占据几乎全部空间 */}
        <div className="flex-1 overflow-hidden min-h-0">
          <TranslateClient onLanguageChange={setCurrentLang} />
        </div>
      </div>
    </div>
  );
}
