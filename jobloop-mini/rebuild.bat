@echo off
chcp 65001 >nul
echo ========================================
echo   JobLoop Mini - 完整清理重建脚本
echo ========================================
echo.

cd /d "%~dp0"

echo [1/6] 清理 dist 缓存...
if exist dist rmdir /s /q dist
echo       done.

echo [2/6] 清理 node_modules/.cache...
if exist "node_modules\.cache" rmdir /s /q "node_modules\.cache"
echo       done.

echo [3/6] 检查 Node 版本...
node --version
echo.

echo [4/6] 重新安装依赖（确保一致性）...
call npm install 2>&1
if %ERRORLEVEL% neq 0 (
    echo       npm install 失败！请检查网络。
    pause
    exit /b 1
)
echo       done.

echo [5/6] 清理并重新构建...
if exist dist rmdir /s /q dist
call npx taro build --type weapp 2>&1
if %ERRORLEVEL% neq 0 (
    echo.
    echo       !!! 构建失败 !!!
    echo       请查看上方错误信息
    pause
    exit /b 1
)
echo       done.

echo [6/6] 验证构建产物...
if exist dist\pages\index\index.js (
    echo       ✓ index.js 存在
) else (
    echo       ✗ index.js 缺失！
)
if exist dist\taro.js (
    echo       ✓ taro.js 存在
) else (
    echo       ✗ taro.js 缺失！
)
if exist dist\vendors.js (
    echo       ✓ vendors.js 存在
) else (
    echo       ✗ vendors.js 缺失！
)

echo.
echo ========================================
echo   构建完成！请刷新微信开发者工具
echo ========================================
pause
