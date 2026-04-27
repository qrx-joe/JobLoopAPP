@echo off
chcp 65001 >nul
echo ================================================
echo   JobLoop Mini - Node 版本检测 & 安装脚本
echo ================================================
echo.
echo 当前 Node 版本：
node --version 2>&1
echo.
echo Taro 4.x 推荐使用 Node.js 16~20 LTS
echo 当前版本 v24 可能导致 webpack 编译异常
echo.
echo 正在检查 nvm-windows...
where nvm >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo ✓ 已安装 nvm
    nvm list
    echo.
    echo 请手动执行以下命令安装 Node 18：
    echo   nvm install 18.20.6
    echo   nvm use 18.20.6
    echo 然后重新运行 rebuild.bat
) else (
    echo ✗ 未安装 nvm-windows
    echo.
    echo ============================================
    echo   请按以下步骤操作（二选一）：
    echo ============================================
    echo.
    echo [方案 A] 安装 nvm-windows（推荐）：
    echo   1. 下载：https://github.com/coreybutler/nvm-windows/releases
    echo   2. 安装后重启终端
    echo   3. 运行：nvm install 18.20.6
    echo   4. 运行：nvm use 18.20.6
    echo   5. 进入项目目录，执行 npm install
    echo   6. 执行 npm run build:weapp
    echo.
    echo [方案 B] 直接安装 Node 18：
    echo   1. 下载：https://nodejs.org/dist/v18.20.6/node-v18.20.6-x64.msi
    echo   2. 安装时选择覆盖当前 Node（或改路径安装）
    echo   3. 重启终端，确认 node --version 显示 v18.x
    echo   4. 进入项目目录，删除 node_modules
    echo   5. 执行 npm install
    echo   6. 执行 npm run build:weapp
)

pause
