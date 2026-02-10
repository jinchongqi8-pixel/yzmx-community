#!/bin/bash

echo "======================================"
echo "   学习社群 - 网页版启动"
echo "======================================"
echo ""
echo "📦 检查环境..."
echo ""

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 未安装 Node.js"
    echo "请访问 https://nodejs.org/ 下载安装"
    exit 1
fi

echo "✅ Node.js 版本: $(node -v)"
echo "✅ npm 版本: $(npm -v)"
echo ""

# 检查依赖
if [ ! -d "node_modules" ]; then
    echo "📦 正在安装依赖..."
    npm install
    echo ""
fi

echo "🚀 启动开发服务器..."
echo ""
echo "访问地址: http://localhost:3000"
echo ""
echo "按 Ctrl+C 停止服务"
echo "======================================"
echo ""

npm run dev
