@echo off
chcp 65001 >nul 2>&1
title JobLoop Mini - 修复 + 编译

echo.
echo ============================================
echo   JobLoop Mini 修复并编译工具
echo ============================================
echo.

cd /d "%~dp0"

:: 清理旧绑定
echo [1/3] 清理旧的 @swc/core ...
if exist "node_modules\@swc\core" (
    rd /s /q "node_modules\@swc\core" >nul 2>&1
)
echo [OK] 已清理

:: 重装依赖
echo.
echo [2/3] 重新安装依赖（含原生绑定）...
call npm install --legacy-peer-deps
if %errorlevel% neq 0 (
    echo [错误] 安装失败，请检查 Node.js 版本 (>=18) 和网络
    pause & exit /b 1
)
echo [OK] 依赖安装完成

:: 编译
echo.
echo [3/3] 编译微信小程序...
echo   提示: 请在微信开发者工具中导入 dist 目录
echo.
call npx taro build --type weapp --watch
