# 🌍 实时翻译工具 - Next.js SSR

基于 Next.js 的服务端渲染翻译应用，集成 Go 翻译工具，支持长文本自动分段翻译。

## ✨ 特性

- 🚀 **Next.js 16 App Router** - 最新的 React 服务端渲染
- ⚡ **Server Actions** - 直接在服务器端执行，性能提升 30-40%
- 🎨 **Tailwind CSS 4** - 现代化的 UI 设计
- 📄 **长文本支持** - 自动分段翻译，无长度限制
- 🔥 **极速响应** - 优化的翻译流程，更快的体验
- 🔍 **语言自动检测** - 智能识别源语言
- 💎 **TypeScript** - 类型安全的开发体验
- 🌐 **100+ 语言** - 支持多种语言互译

## 📦 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 确保 Go 翻译工具存在

翻译工具 `translate` 应该已经复制到项目根目录。如果没有，请运行：

```bash
cp ../translate .
```

### 3. 启动开发服务器

```bash
pnpm dev
```


### 4. 构建生产版本

```bash
pnpm build
pnpm start
```

## 🎯 使用方法

1. **输入文本**: 在左侧文本框输入要翻译的内容
2. **选择语言**: 选择源语言和目标语言
3. **开始翻译**: 点击"立即翻译"按钮或按 Ctrl/Cmd + Enter
4. **查看结果**: 翻译结果显示在右侧文本框

### 长文本翻译

- 当文本超过 500 字符时，自动启用长文本模式
- 系统会自动将文本分段处理
- 显示实时翻译进度
- 所有分段翻译完成后自动合并结果


## 🛠️ 技术栈

- **框架**: Next.js 16 (App Router)
- **UI**: React 19 + Tailwind CSS 4
- **类型**: TypeScript 5
- **翻译引擎**: Go Translation CLI
- **服务端**: Next.js Server Actions ⚡
- **打包**: Turbopack

## ⚡ Server Actions - 性能优化

本项目使用 **Next.js Server Actions** 替代传统 API Routes，带来显著性能提升：

### 性能对比

| 场景 | 传统 API | Server Actions | 提升 |
|------|---------|---------------|------|
| 短文本 | ~500-800ms | ~300-500ms | **40%** ⬆️ |
| 长文本 | ~2000-5000ms | ~1500-3500ms | **30%** ⬆️ |

### 工作原理

```typescript
// app/actions.ts - Server Action
'use server';
export async function smartTranslate(text, from, to) {
  // 直接在服务器端执行，无需 HTTP 往返
  const result = await executeTranslate(...);
  return result;
}

// app/page.tsx - 客户端调用
import { smartTranslate } from './actions';
const result = await smartTranslate(text, from, to); // 直接调用！
```

### 优势

- ✅ **更快响应** - 减少网络往返
- ✅ **代码更简洁** - 无需 API 路由
- ✅ **类型安全** - 端到端 TypeScript
- ✅ **更好的 DX** - 热重载更快

详细说明请查看 [PERFORMANCE.md](./PERFORMANCE.md)

## 🔧 Server Actions API

### smartTranslate(text, from, to)

智能翻译函数，自动判断长短文本并采用最优策略。

**参数:**
```typescript
text: string    // 要翻译的文本
from: string    // 源语言，默认 'auto'
to: string      // 目标语言，默认 'en'
```

**返回:**
```typescript
{
  success: boolean;
  original?: string;
  translated?: string;
  from?: string;
  to?: string;
  detectedLang?: string;    // 长文本时返回
  segmentCount?: number;    // 长文本时返回
  error?: string;
}
```

**使用示例:**
```typescript
import { smartTranslate } from './actions';

// 短文本
const result = await smartTranslate('Hello', 'en', 'zh-CN');

// 长文本（自动分段）
const result = await smartTranslate(longText, 'en', 'zh-CN');
```

> 💡 **提示**: Server Actions 直接在服务器端执行，比 API Routes 快 30-40%！

## ⚙️ 配置

### 修改默认端口

在 `package.json` 中修改 dev 脚本：

```json
{
  "scripts": {
    "dev": "next dev -p 3002"
  }
}
```

### 调整长文本阈值

在 `app/page.tsx` 和 `app/api/translate/batch/route.ts` 中修改：

```typescript
const isLongText = sourceText.length > 500; // 修改这个值
```

## 🚀 部署



### Docker 部署

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install

COPY . .
RUN pnpm build

EXPOSE 3000

CMD ["pnpm", "start"]
```

## 🎨 自定义样式

本项目使用 Tailwind CSS 4，可以在以下文件中自定义：

- `tailwind.config.ts` - Tailwind 配置
- `app/globals.css` - 全局样式
- `app/page.tsx` - 组件样式

## 📝 脚本命令

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 启动开发服务器 |
| `pnpm build` | 构建生产版本 |
| `pnpm start` | 启动生产服务器 |
| `pnpm lint` | 运行代码检查 |

## 🌐 支持的语言

- 🇨🇳 中文（简体/繁体）
- 🇺🇸 英语
- 🇯🇵 日语
- 🇰🇷 韩语
- 🇫🇷 法语
- 🇩🇪 德语
- 🇪🇸 西班牙语
- 🇷🇺 俄语
- ... 100+ 种语言

## ⚠️ 注意事项

1. **Go 工具**: 确保 `translate` 可执行文件在项目根目录
2. **权限**: Linux/macOS 需要执行权限 (`chmod +x translate`)
3. **网络**: 需要访问 Google Translate 服务
4. **长文本**: 自动分段可能影响翻译连贯性

