@echo off
chcp 65001 >nul
echo ======================================
echo    学习社群 - 网页版启动
echo ======================================
echo.
echo [检查环境]
echo.

where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 未安装 Node.js
    echo 请访问 https://nodejs.org/ 下载安装
    pause
    exit /b 1
)

echo ✅ Node.js 已安装
node -v
echo ✅ npm 已安装
npm -v
echo.

if not exist "node_modules" (
    echo [安装依赖]
    echo 正在安装项目依赖...
    call npm install
    echo.
)

echo [启动服务]
echo.
echo 访问地址: http://localhost:3000
echo.
echo 按 Ctrl+C 停止服务
echo ======================================
echo.

call npm run dev
pause
