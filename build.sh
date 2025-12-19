#!/bin/bash

# 🚀 自动构建脚本
# 用于构建 Next.js + Go 翻译应用

set -e  # 遇到错误立即退出

echo "🔨 开始构建翻译应用..."
echo ""

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. 检查依赖
echo -e "${BLUE}📋 检查依赖...${NC}"
if ! command -v go &> /dev/null; then
    echo -e "${RED}❌ Go 未安装${NC}"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js 未安装${NC}"
    exit 1
fi

echo -e "${GREEN}✅ 依赖检查通过${NC}"
echo ""

# 2. 构建 Go 程序
echo -e "${BLUE}🔧 构建 Go 翻译引擎...${NC}"
go build -ldflags="-s -w" -o translate main.go
chmod +x translate

if [ -f "translate" ]; then
    SIZE=$(du -h translate | cut -f1)
    echo -e "${GREEN}✅ Go 程序构建成功 (大小: ${SIZE})${NC}"
else
    echo -e "${RED}❌ Go 程序构建失败${NC}"
    exit 1
fi
echo ""

# 3. 安装 npm 依赖
echo -e "${BLUE}📦 安装 npm 依赖...${NC}"
if command -v pnpm &> /dev/null; then
    pnpm install
else
    npm install
fi
echo -e "${GREEN}✅ 依赖安装完成${NC}"
echo ""

# 4. 构建 Next.js
echo -e "${BLUE}⚡ 构建 Next.js 应用...${NC}"
npm run build

if [ -d ".next" ]; then
    echo -e "${GREEN}✅ Next.js 构建成功${NC}"
else
    echo -e "${RED}❌ Next.js 构建失败${NC}"
    exit 1
fi
echo ""

# 5. 显示构建信息
echo -e "${GREEN}🎉 构建完成！${NC}"
echo ""
echo "📊 构建产物："
echo "  - Go 程序: ./translate"
echo "  - Next.js: ./.next/"
echo ""
echo "🚀 启动命令："
echo "  npm run start"
echo ""
echo "🌐 访问地址："
echo "  http://localhost:3000"
echo ""

# 6. 可选：运行测试
if [ "$1" == "--test" ]; then
    echo -e "${BLUE}🧪 运行测试...${NC}"
    ./translate --help
    echo -e "${GREEN}✅ 测试通过${NC}"
fi

