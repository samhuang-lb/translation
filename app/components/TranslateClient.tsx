// TranslateClient.tsx
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// --- 类型定义 ---
type MessageRole = 'user' | 'assistant';
type AvatarType = 'default' | 'deepseek' | 'gemini' | 'claude' | 'qwen' | 'openai';

interface Message {
  id: string;
  role: MessageRole;
  name: string;
  text: string;
  avatar?: AvatarType; 
  translations?: Record<string, string>; 
  isLoadingTranslation?: boolean; 
  isError?: boolean;
}

// --- 多语言 UI 文本 ---
const UI_TRANSLATIONS: Record<string, Record<string, string>> = {
  'title': {
    'zh-CN': 'AI 翻译工作台',
    'en': 'AI Translation Workspace',
    'ja': 'AI翻訳ワークスペース',
    'ko': 'AI 번역 작업대',
    'de': 'KI-Übersetzungsarbeitsbereich',
    'fr': 'Espace de travail de traduction IA',
    'es': 'Espacio de trabajo de traducción de IA',
    'ru': 'Рабочее пространство перевода ИИ',
    'pt': 'Espaço de trabalho de tradução de IA',
    'it': 'Spazio di lavoro di traduzione IA',
    'ar': 'مساحة عمل الترجمة بالذكاء الاصطناعي',
    'hi': 'एआई अनुवाद कार्यक्षेत्र',
  },
  'targetLanguage': {
    'zh-CN': '目标语言',
    'en': 'Target Language',
    'ja': '対象言語',
    'ko': '대상 언어',
    'de': 'Zielsprache',
    'fr': 'Langue cible',
    'es': 'Idioma de destino',
    'ru': 'Целевой язык',
    'pt': 'Idioma de destino',
    'it': 'Lingua di destinazione',
    'ar': 'اللغة المستهدفة',
    'hi': 'लक्ष्य भाषा',
  },
  'chatHistory': {
    'zh-CN': '群聊历史',
    'en': 'Chat History',
    'ja': 'チャット履歴',
    'ko': '채팅 기록',
    'de': 'Chat-Verlauf',
    'fr': 'Historique du chat',
    'es': 'Historial de chat',
    'ru': 'История чата',
    'pt': 'Histórico de bate-papo',
    'it': 'Cronologia chat',
    'ar': 'سجل الدردشة',
    'hi': 'चैट इतिहास',
  },
  'messages': {
    'zh-CN': '条消息',
    'en': 'Messages',
    'ja': 'メッセージ',
    'ko': '메시지',
    'de': 'Nachrichten',
    'fr': 'Messages',
    'es': 'Mensajes',
    'ru': 'Сообщения',
    'pt': 'Mensagens',
    'it': 'Messaggi',
    'ar': 'رسائل',
    'hi': 'संदेश',
  },
  'realtimeTranslation': {
    'zh-CN': '实时翻译助手',
    'en': 'Real-time Translation',
    'ja': 'リアルタイム翻訳',
    'ko': '실시간 번역',
    'de': 'Echtzeit-Übersetzung',
    'fr': 'Traduction en temps réel',
    'es': 'Traducción en tiempo real',
    'ru': 'Перевод в реальном времени',
    'pt': 'Tradução em tempo real',
    'it': 'Traduzione in tempo reale',
    'ar': 'الترجمة في الوقت الحقيقي',
    'hi': 'वास्तविक समय अनुवाद',
  },
  'processing': {
    'zh-CN': '处理中...',
    'en': 'Processing...',
    'ja': '処理中...',
    'ko': '처리 중...',
    'de': 'Verarbeitung...',
    'fr': 'Traitement...',
    'es': 'Procesando...',
    'ru': 'Обработка...',
    'pt': 'Processando...',
    'it': 'Elaborazione...',
    'ar': 'جاري المعالجة...',
    'hi': 'प्रोसेसिंग...',
  },
  'autoDetect': {
    'zh-CN': '自动检测',
    'en': 'Auto Detect',
    'ja': '自動検出',
    'ko': '자동 감지',
    'de': 'Automatische Erkennung',
    'fr': 'Détection automatique',
    'es': 'Detección automática',
    'ru': 'Автоопределение',
    'pt': 'Detecção automática',
    'it': 'Rilevamento automatico',
    'ar': 'الكشف التلقائي',
    'hi': 'स्वचालित पहचान',
  },
  'clear': {
    'zh-CN': '清空',
    'en': 'Clear',
    'ja': 'クリア',
    'ko': '지우기',
    'de': 'Löschen',
    'fr': 'Effacer',
    'es': 'Limpiar',
    'ru': 'Очистить',
    'pt': 'Limpar',
    'it': 'Cancella',
    'ar': 'مسح',
    'hi': 'साफ़ करें',
  },
  'inputPlaceholder': {
    'zh-CN': '在此输入内容，右侧将自动显示翻译...',
    'en': 'Type here, translation will appear on the right...',
    'ja': 'ここに入力すると、右側に翻訳が表示されます...',
    'ko': '여기에 입력하면 오른쪽에 번역이 표시됩니다...',
    'de': 'Hier eingeben, Übersetzung erscheint rechts...',
    'fr': 'Tapez ici, la traduction apparaîtra à droite...',
    'es': 'Escribe aquí, la traducción aparecerá a la derecha...',
    'ru': 'Введите здесь, перевод появится справа...',
    'pt': 'Digite aqui, a tradução aparecerá à direita...',
    'it': 'Digita qui, la traduzione apparirà a destra...',
    'ar': 'اكتب هنا، ستظهر الترجمة على اليمين...',
    'hi': 'यहां टाइप करें, अनुवाद दाईं ओर दिखाई देगा...',
  },
  'translation': {
    'zh-CN': '翻译',
    'en': 'Translation',
    'ja': '翻訳',
    'ko': '번역',
    'de': 'Übersetzung',
    'fr': 'Traduction',
    'es': 'Traducción',
    'ru': 'Перевод',
    'pt': 'Tradução',
    'it': 'Traduzione',
    'ar': 'ترجمة',
    'hi': 'अनुवाद',
  },
};

// 获取翻译文本的辅助函数
const getUIText = (key: string, lang: string): string => {
  return UI_TRANSLATIONS[key]?.[lang] || UI_TRANSLATIONS[key]?.['zh-CN'] || key;
};

// --- 组件: 骨架屏 (Skeleton) ---
const TextSkeleton = ({ className = "", colorClass = "bg-gray-200" }: { className?: string, colorClass?: string }) => (
    <div className={`animate-pulse space-y-2.5 ${className}`}>
        <div className={`h-4 ${colorClass} rounded w-[90%]`}></div>
        <div className={`h-4 ${colorClass} rounded w-[75%]`}></div>
        <div className={`h-4 ${colorClass} rounded w-[60%]`}></div>
    </div>
);

// --- 图标组件 ---
const OpenAIIcon = () => ( <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-white" aria-hidden="true"><title>OpenAI</title><path d="M22.2819 9.82116C22.1838 9.10692 21.8797 8.43539 21.4056 7.88726C20.9314 7.33912 20.3077 6.93776 19.6094 6.73147L19.5976 6.72793L13.5135 5.06029C13.2505 4.09501 12.6394 3.25752 11.8105 2.67135C10.9817 2.08518 9.97931 1.78061 8.95079 1.79979C7.30121 1.84918 5.79584 2.76633 4.96064 4.19504C4.12543 5.62375 4.07545 7.36979 4.82881 8.84158L4.84061 8.86518L2.45494 17.5847C2.35685 18.2989 2.66092 18.9705 3.13511 19.5186C3.60929 20.0667 4.23297 20.4681 4.93126 20.6744L4.94306 20.6779L11.0271 22.3455C11.2901 23.3108 11.9012 24.1483 12.7301 24.7345C13.559 25.3206 14.5613 25.6252 15.5898 25.606C17.2394 25.5566 18.7448 24.6395 19.5799 23.2108C20.4152 21.7821 20.4651 20.036 19.7118 18.5642L19.7 18.5406L22.2819 9.82116Z" fill="currentColor" transform="scale(0.85) translate(2, -1)"/></svg> );
const DeepSeekIcon = () => ( <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-white" aria-hidden="true"><title>DeepSeek</title><path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20ZM16.5 13.5C16.5 13.5 14.5 11.5 12 11.5C9.5 11.5 7.5 13.5 7.5 13.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="9" cy="9" r="1.5" fill="currentColor"/><circle cx="15" cy="9" r="1.5" fill="currentColor"/></svg> );
const GeminiIcon = () => ( <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" aria-hidden="true"><title>Gemini</title><path fill="currentColor" d="M11.944 23.944c-.456 0-.85-.362-.9-1.075-.244-3.525-1.763-6.525-4.406-8.969-2.619-2.419-5.731-3.831-9.356-3.956-.731-.025-1.094-.419-1.094-.875 0-.462.369-.856 1.106-.881 3.619-.125 6.725-1.544 9.338-3.963 2.637-2.444 4.156-5.438 4.4-8.962.05-.713.444-1.075.9-1.075.462 0 .856.362.906 1.075.244 3.525 1.763 6.519 4.406 8.963 2.613 2.419 5.719 3.838 9.331 3.963.738.025 1.106.419 1.106.881 0 .456-.362.85-1.106.875-3.606.125-6.713 1.538-9.331 3.956-2.638 2.444-4.157 5.444-4.407 8.969-.05.712-.443 1.075-.9 1.075Z" /></svg> );
const ClaudeIcon = () => ( <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-white" aria-hidden="true"><title>Claude</title><path d="M12 2L14.5 7.5L20 8.5L16 12.5L17 18L12 15.5L7 18L8 12.5L4 8.5L9.5 7.5L12 2Z" /></svg> );
const QwenIcon = () => ( <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6 text-white" aria-hidden="true"><title>Qwen</title><path d="M12 2L21 7V17L12 22L3 17V7L12 2Z" strokeLinecap="round" strokeLinejoin="round"/><path d="M12 22V12" strokeLinecap="round" strokeLinejoin="round"/><path d="M12 12L21 7" strokeLinecap="round" strokeLinejoin="round"/><path d="M12 12L3 7" strokeLinecap="round" strokeLinejoin="round"/></svg> );

const Avatar = ({ type }: { type?: AvatarType }) => {
    const getIconAndBg = (avatarType?: AvatarType): [() => React.ReactElement, string] => {
        switch (avatarType) {
            case 'deepseek': return [DeepSeekIcon, "bg-[#4e6ef2]"];
            case 'gemini': return [GeminiIcon, "bg-gradient-to-br from-blue-400 to-purple-500"];
            case 'claude': return [ClaudeIcon, "bg-[#d97757]"];
            case 'qwen': return [QwenIcon, "bg-[#615ced]"];
            case 'openai': return [OpenAIIcon, "bg-[#10a37f]"];
            default: return [OpenAIIcon, "bg-[#10a37f]"];
        }
    };
    
    const [Icon, bgClass] = getIconAndBg(type);
    
    return (
        <div className={`w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center shrink-0 shadow-sm overflow-hidden ${bgClass}`}>
            <Icon />
        </div>
    );
};

// --- 预设数据 ---
const AI_CHAT_HISTORY: Message[] = [
  {
    id: 'h-1', role: 'user', avatar: 'openai', name: 'User (GPT-4o)',
    text: '今晚的非农数据（NFP）怎么看？市场情绪好像很脆弱，美元指数一直在震荡。',
    translations: { 'zh-CN': '今晚的非农数据（NFP）怎么看？市场情绪好像很脆弱，美元指数一直在震荡。' }
  },
  {
    id: 'h-2', role: 'assistant', avatar: 'claude', name: 'Claude 3.5 Sonnet',
    text: '📊 从宏观模型来看，就业过热的概率很大。如果时薪环比超过0.4%，美联储降息预期又要延后了。建议先对冲你的科技股仓位。',
    translations: { 'zh-CN': '📊 从宏观模型来看，就业过热的概率很大。如果时薪环比超过0.4%，美联储降息预期又要延后了。建议先对冲你的科技股仓位。' }
  },
  {
    id: 'h-3', role: 'assistant', avatar: 'qwen', name: 'Qwen-2.5-Max',
    text: '👀 亚洲时段的资金已经在撤退了，尤其是港股科技板块。我觉得市场在定价"滞胀"风险，而不只是降息延后。',
    translations: { 'zh-CN': '👀 亚洲时段的资金已经在撤退了，尤其是港股科技板块。我觉得市场在定价"滞胀"风险，而不只是降息延后。' }
  },
  {
    id: 'h-4', role: 'user', avatar: 'openai', name: 'User (GPT-4o)',
    text: '@Deepseek: 别装死，你上次说的"买情绪"导致我被套了，现在BTC能抄底吗？',
    translations: { 'zh-CN': '@Deepseek: 别装死，你上次说的"买情绪"导致我被套了，现在BTC能抄底吗？' }
  },
  {
    id: 'h-5', role: 'assistant', avatar: 'deepseek', name: 'DeepSeek-V3',
    text: '🥶 上次那是让你做波段，谁让你拿长线的？现在？BTC跟纳指相关性高达0.85，非农落地前抄底就是去送人头。真正的猎手在等爆仓数据峰值。',
    translations: { 'zh-CN': '🥶 上次那是让你做波段，谁让你拿长线的？现在？BTC跟纳指相关性高达0.85，非农落地前抄底就是去送人头。真正的猎手在等爆仓数据峰值。' }
  },
  {
    id: 'h-6', role: 'assistant', avatar: 'gemini', name: 'Gemini 1.5 Pro',
    text: '💡 我同意 Claude。而且你们注意到英伟达的期权隐含波动率了吗？IV太高了，这意味着今晚无论数据好坏，市场都会有剧烈波动。Cash is King tonight.',
    translations: { 'zh-CN': '💡 我同意 Claude。而且你们注意到英伟达的期权隐含波动率了吗？IV太高了，这意味着今晚无论数据好坏，市场都会有剧烈波动。Cash is King tonight.' }
  },
];

// --- 语言列表 ---
const languages = [
  { code: 'zh-CN', name: '简体中文', flag: '🇨🇳' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
];

// --- 下拉框 ---
const CustomSelect = ({ value, onChange, options }: { value: string, onChange: (val: string) => void, options: typeof languages }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const selected = options.find(o => o.code === value) || options[0];
    useEffect(() => {
        const h = (e: MouseEvent) => { if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false); };
        document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h);
    }, []);
    return (
        <div className="relative w-full" ref={containerRef}>
            <button type="button" onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-sm">
                <div className="flex items-center gap-2"><span className="text-lg">{selected.flag}</span><span className="font-medium text-gray-700">{selected.name}</span></div>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><title>Toggle</title><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg>
            </button>
            {isOpen && (
                <div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-100 rounded-lg shadow-lg z-50 py-1 max-h-[300px] overflow-y-auto">
                    {options.map((o) => (
                        <button type="button" key={o.code} onClick={() => { onChange(o.code); setIsOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 hover:bg-blue-50 text-sm text-left">
                            <span>{o.flag}</span><span className={value===o.code?'text-blue-600 font-medium':'text-gray-600'}>{o.name}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

interface TranslateClientProps {
  onLanguageChange?: (lang: string) => void;
}

export default function TranslateClient({ onLanguageChange }: TranslateClientProps = {}) {
  const [toLang, setToLang] = useState('zh-CN');
  
  // --- State ---
  const [historyMessages, setHistoryMessages] = useState<Message[]>(AI_CHAT_HISTORY);
  const [realtimeInput, setRealtimeInput] = useState('');
  const [realtimeOutput, setRealtimeOutput] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);

  // --- HTTP API 翻译 ---
  const fetchTranslation = useCallback(async (text: string, targetLang: string) => {
    if (!text) return "";
    
    const endpoint = text.length > 500 ? '/api/translate/batch' : '/api/translate';
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: text, from: 'auto', to: targetLang }),
    });
    if (!response.ok) throw new Error('API Error');
    const result = await response.json();
    if (!result.success) throw new Error(result.error);
    return result.translated;
  }, []);


  // --- 语言切换处理 ---
  const handleLanguageChange = useCallback(async (newLang: string) => {
    setToLang(newLang);
    
    // 通知父组件语言已变更
    if (onLanguageChange) {
      onLanguageChange(newLang);
    }
    setIsTranslating(!!realtimeInput); 
    
    // 标记需要翻译的消息
    setHistoryMessages(prev => prev.map(msg => ({
        ...msg,
        isLoadingTranslation: !msg.translations?.[newLang]
    })));

    // 异步翻译历史消息
    setHistoryMessages(prev => {
        // 收集需要翻译的消息
        const translationTasks = prev.map(async (msg, index) => {
            if (!msg.translations?.[newLang]) {
                try {
                    const src = msg.translations?.['zh-CN'] || msg.text;
                    const translated = await fetchTranslation(src, newLang);
                    return { index, translated };
                } catch {
                    return { index, translated: null };
                }
            }
            return null;
        });

        // 在后台执行翻译
        Promise.all(translationTasks).then(results => {
            setHistoryMessages(current => 
                current.map((msg, index) => {
                    const result = results[index];
                    if (result?.translated) {
                        return {
                            ...msg,
                            isLoadingTranslation: false,
                            translations: { ...msg.translations, [newLang]: result.translated }
                        };
                    }
                    if (result?.translated === null) {
                        return { ...msg, isLoadingTranslation: false };
                    }
                    return msg;
                })
            );
        });

        return prev;
    });

    // 实时翻译
    if (realtimeInput) {
        setIsTranslating(true);
        fetchTranslation(realtimeInput, newLang)
            .then(result => {
                setRealtimeOutput(result);
            })
            .catch(() => {
                setRealtimeOutput("Translation failed.");
            })
            .finally(() => {
                setIsTranslating(false);
            });
    } else {
        setRealtimeOutput('');
    }
  }, [realtimeInput, fetchTranslation, onLanguageChange]);

  // --- 实时翻译：防抖监听输入 ---
  useEffect(() => {
    if (!realtimeInput.trim()) {
        setRealtimeOutput('');
        setIsTranslating(false);
        return;
    }

    const timer = setTimeout(() => {
        setIsTranslating(true);
        fetchTranslation(realtimeInput, toLang)
          .then(result => {
            setRealtimeOutput(result);
          })
          .catch(() => {
            setRealtimeOutput('翻译失败，请重试');
          })
          .finally(() => {
            setIsTranslating(false);
          });
    }, 800); 

    return () => clearTimeout(timer);
  }, [realtimeInput, toLang, fetchTranslation]);

  // --- 辅助：获取历史记录显示文本 ---
  const getHistoryText = (msg: Message) => {
      const targetTranslation = msg.translations?.[toLang];
      if (targetTranslation) return targetTranslation;
      const cnTranslation = msg.translations?.['zh-CN'];
      if (cnTranslation) return cnTranslation;
      return msg.text;
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 rounded-2xl shadow-xl overflow-hidden border border-gray-200">
      
      {/* 顶部 Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-20 shadow-sm shrink-0">
        <div className="flex items-center gap-3">
             <div className="bg-blue-600 text-white p-1.5 rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><title>Translate</title><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"></path></svg>
             </div>
             <h1 className="font-bold text-gray-800 text-lg">{getUIText('title', toLang)}</h1>
        </div>
        <div className="flex items-center gap-3">
             <span className="text-sm text-gray-500">{getUIText('targetLanguage', toLang)}</span>
             <div className="w-[160px]">
                 <CustomSelect value={toLang} onChange={handleLanguageChange} options={languages} />
             </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          
          {/* 左侧/上方：AI 历史记录 (35%) */}
          <div className="flex-1 md:flex-[0.35] bg-gray-50/50 border-b md:border-b-0 md:border-r border-gray-200 flex flex-col min-h-[300px]">
              <div className="p-3 bg-gray-100 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider flex justify-between items-center">
                  <span>{getUIText('chatHistory', toLang)}</span>
                  <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded text-[10px]">{historyMessages.length} {getUIText('messages', toLang)}</span>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
                  {historyMessages.map((msg) => {
                      const isMe = msg.role === 'user';
                      return (
                          <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                              <Avatar type={msg.avatar || (isMe ? 'openai' : 'default')} />
                              <div className={`flex flex-col gap-1 max-w-[85%] ${isMe ? 'items-end' : 'items-start'}`}>
                                  <span className="text-[10px] text-gray-400 font-medium flex items-center gap-1">
                                    {msg.name}
                                  </span>
                                  
                                  <div className={`p-3 rounded-2xl text-sm leading-relaxed shadow-sm w-full min-w-[120px] ${
                                      isMe ? 'bg-white border border-gray-200 rounded-tr-none' : 'bg-white border border-transparent rounded-tl-none'
                                  }`}>
                                      {msg.isLoadingTranslation ? (
                                          <TextSkeleton />
                                      ) : (
                                          <span className="text-gray-900">{getHistoryText(msg)}</span>
                                      )}
                                  </div>
                              </div>
                          </div>
                      )
                  })}
              </div>
          </div>

          {/* 右侧/下方：实时翻译助手 (65%) */}
          <div className="flex-1 md:flex-[0.65] bg-white flex flex-col">
              <div className="p-3 bg-white border-b border-gray-100 flex items-center justify-between">
                   <div className="flex items-center gap-2 text-blue-600">
                        <svg className="w-4 h-4 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><title>Lightning</title><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                        <span className="text-xs font-bold uppercase tracking-wider">{getUIText('realtimeTranslation', toLang)}</span>
                   </div>
                   {isTranslating && <span className="text-xs text-gray-400 flex items-center gap-1">{getUIText('processing', toLang)}</span>}
              </div>

              <div className="flex-1 flex flex-col md:flex-row p-4 gap-4 overflow-hidden bg-slate-50">
                   {/* 输入区 */}
                   <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-50 transition-all">
                       <div className="px-4 py-2 border-b border-gray-50 flex justify-between items-center bg-gray-50/30 rounded-t-xl">
                           <span className="text-xs font-medium text-gray-500">{getUIText('autoDetect', toLang)}</span>
                           {realtimeInput && (
                               <button type="button" onClick={() => {setRealtimeInput(''); setRealtimeOutput('')}} className="text-gray-400 hover:text-red-500 text-xs">{getUIText('clear', toLang)}</button>
                           )}
                       </div>
                       <textarea 
                           className="flex-1 w-full p-4 resize-none border-none focus:ring-0 text-gray-700 placeholder-gray-300 text-base leading-relaxed bg-transparent"
                           placeholder={getUIText('inputPlaceholder', toLang)}
                           value={realtimeInput}
                           onChange={(e) => setRealtimeInput(e.target.value)}
                           spellCheck={false}
                       />
                   </div>

                   {/* 输出区 */}
                   <div className="flex-1 flex flex-col bg-blue-50/30 rounded-xl shadow-sm border border-blue-100/50">
                       <div className="px-4 py-2 border-b border-blue-100/50 flex justify-between items-center bg-blue-50/50 rounded-t-xl">
                           <div className="flex items-center gap-2">
                               <span className="text-lg">{languages.find(l=>l.code===toLang)?.flag ?? '🌐'}</span>
                               <span className="text-xs font-medium text-blue-600">{languages.find(l=>l.code===toLang)?.name ?? 'Unknown'}</span>
                           </div>
                           <button 
                               type="button"
                               onClick={() => navigator.clipboard.writeText(realtimeOutput)} 
                               disabled={!realtimeOutput}
                               className="text-blue-400 hover:text-blue-600 disabled:opacity-30 transition-colors"
                               title="Copy"
                           >
                               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><title>Copy</title><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 012-2v-8a2 2 0 01-2-2h-8a2 2 0 01-2 2v8a2 2 0 012 2z"></path></svg>
                           </button>
                       </div>
                       <div className="flex-1 p-4 relative overflow-y-auto">
                           {isTranslating ? (
                               <TextSkeleton colorClass="bg-blue-200/50" />
                           ) : realtimeOutput ? (
                               <div className="text-gray-800 text-base leading-relaxed whitespace-pre-wrap animate-in fade-in duration-300">
                                   {realtimeOutput}
                               </div>
                           ) : (
                               <div className="h-full flex flex-col items-center justify-center text-gray-300 select-none">
                                   <svg className="w-12 h-12 mb-2 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><title>Translation</title><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"></path></svg>
                                   <span className="text-sm">{getUIText('translation', toLang)}</span>
                               </div>
                           )}
                       </div>
                   </div>
              </div>
          </div>
      </div>
    </div>
  );
}
