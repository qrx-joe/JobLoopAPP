@echo off
chcp 65001 >nul 2>&1
title JobLoop AI - 一键启动

echo.
echo ============================================
echo        JobLoop AI  一键启动工具
echo ============================================
echo.

cd /d "%~dp0"

:: 检查 Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Node.js，请先安装 ^>=18.0
    echo   下载地址: https://nodejs.org
    echo.
    pause & exit /b 1
)

for /f "tokens=1 delims=v" %%v in ('node --version') do set NODE_VER_MAJOR=%%v
if %NODE_VER_MAJOR% lss 18 (
    echo [错误] Node.js 版本过低: %NODE_VER_MAJOR% (要求 >= 18)
    echo   请更新: https://nodejs.org
    echo.
    pause & exit /b 1
)

echo [OK] Node.js 已就绪

:: 检查 .env.local
if not exist ".env.local" (
    if exist ".env.example" (
        copy ".env.example" ".env.local" >nul
        echo [OK] 已创建 .env.local
        echo [提示] 请编辑填入 API 密钥！
        start notepad ".env.local"
        echo.
        set /p CONFIRM="配置完成后按回车继续..."
    ) else (
        echo # JobLoop Environment Variables > ".env.local"
        echo. >> ".env.local"
        echo NEXT_PUBLIC_SUPABASE_URL=your-url >> ".env.local"
        echo OPENAI_API_KEY=your-key >> ".env.local"
        echo [OK] 已创建空 .env.local
    )
) else (
    echo [跳过] .env.local 已存在
)

:: 安装依赖
if not exist "node_modules" (
    echo.
    echo 首次运行，正在安装依赖...
    call npm install --legacy-peer-deps
    if %errorlevel% neq 0 (
        echo [错误] 依赖安装失败
        pause & exit /b 1
    )
    echo [OK] 依赖安装完成
) else (
    echo [跳过] node_modules 已存在
)

:: 启动
echo.
echo ============================================
echo   准备启动开发服务器...
echo ============================================
echo.
echo   本地访问: http://localhost:3000
echo   按 Ctrl+C 停止服务
echo.

call npm run dev
