# JobLoop AI - Windows 一键启动脚本
# 用法：右键 "以管理员身份运行" 或在 PowerShell 中执行 .\start.ps1

$ErrorActionPreference = "Stop"
$Host.UI.RawUI.WindowTitle = "JobLoop AI - Starting..."

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "       JobLoop AI  一键启动工具" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# ==================== 颜色函数 ====================
function Write-Step($msg) { Write-Host "[步骤]" -NoNewline -ForegroundColor Yellow; Write-Host " $msg" }
function Write-OK($msg)   { Write-Host "  [OK] $msg" -ForegroundColor Green }
function Write-Skip($msg) { Write-Host "  [跳过] $msg" -ForegroundColor DarkGray }
function Write-Warn($msg) { Write-Host "  [警告] $msg" -ForegroundColor Yellow }
function Write-Fail($msg) { Write-Host "  [失败] $msg" -ForegroundColor Red }

# ==================== Step 0: 检查 Node.js ====================
Write-Step "检查运行环境..."
try {
    $nodeVersion = node --version 2>&1
    $npmVersion = npm --version 2>&1
    if ($LASTEXITCODE -ne 0) { throw "命令执行失败" }
    # 提取版本号数字部分
    $vNum = ($nodeVersion -replace 'v','') -split '\.' | Select-Object -First 1
    if ([int]$vNum -lt 18) {
        Write-Fail "Node.js 版本过低: $nodeVersion (要求 >= 18)"
        Write-Host "" 
        Write-Host "请安装 Node.js 18+:" -ForegroundColor Red
        Write-Host "https://nodejs.org" -ForegroundColor Blue
        Read-Host "`n按回车键退出"; exit 1
    }
    Write-OK "Node.js: $nodeVersion | npm: $npmVersion"
} catch {
    Write-Fail "未检测到 Node.js，请先安装 (>=18.0)"
    Write-Host "" 
    Write-Host "下载地址: https://nodejs.org" -ForegroundColor Blue
    Read-Host "`n按回车键退出"; exit 1
}

# ==================== Step 1: 检查/创建 .env.local ====================
Write-Step "检查环境变量配置..."
$envExample = Join-Path $PSScriptRoot ".env.example"
$envLocal = Join-Path $PSScriptRoot ".env.local"

if (-not (Test-Path $envLocal)) {
    if (Test-Path $envExample) {
        Copy-Item $envExample $envLocal
        Write-OK "已从 .env.example 创建 .env.local"
        Write-Warn "请编辑 .env.local 填入 API 密钥后重新启动！"
        Start-Sleep -Seconds 2
        # 尝试用默认编辑器打开
        Start-Process $envLocal
        Read-Host "`n配置完成后按回车继续..."
    } else {
        # 如果连 example 都没有就创建一个空的
        @("# Supabase", "NEXT_PUBLIC_SUPABASE_URL=your-url", "", "# OpenAI", "OPENAI_API_KEY=your-key") | Set-Content $envLocal -Encoding UTF8
        Write-OK "已创建空 .env.local（需手动填写密钥）"
        Start-Process $envLocal
        Read-Host "`n配置完成后按回车继续..."
    }
} else {
    Write-Skip ".env.local 已存在"
}

# ==================== Step 2: 检查 node_modules ====================
Write-Step "检查依赖包..."
if (-not (Test-Path (Join-Path $PSScriptRoot "node_modules"))) {
    Write-Host "  首次运行，正在安装依赖..." -ForegroundColor Gray
    Push-Location $PSScriptRoot
    try {
        npm install --legacy-peer-deps 2>&1 | ForEach-Object { Write-Host "  $_" }
        Write-OK "依赖安装完成"
    } catch {
        Write-Fail "依赖安装失败: $_"
        Read-Host "`n按回车键退出"; exit 1
    } finally {
        Pop-Location
    }
} else {
    Write-Skip "node_modules 已存在"
}

# ==================== Step 3: 清理旧进程 ====================
Write-Step "清理残留的 Next.js 进程..."
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
    try { $_.CommandLine -match "next|jobloop" } catch { $false }
} | Stop-Process -Force -ErrorAction SilentlyContinue
Write-Skip "(如有)"

# ==================== Step 4: 端口占用检查 ====================
Write-Step "检查端口 3000 占用情况..."
$port = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($port) {
    $pid = $port.OwningProcess -join ","
    $proc = (Get-Process -Id $pid -ErrorAction SilentlyContinue).ProcessName -join ", "
    Write-Warn "端口 3000 被进程占用 (PID: $pid, Name: $proc)"
    
    do {
        $choice = Read-Host "是否强制释放端口? (Y/N)"
        $choice = $choice.Trim().ToUpper()
    } until ($choice -eq 'Y' -or $choice -eq 'N')

    if ($choice -eq 'Y') {
        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
        Start-Sleep -Milliseconds 500
        Write-OK "已释放端口"
    } else {
        Write-Host "  请手动关闭占用端口的程序后重试" -ForegroundColor Yellow
        Read-Host "按回车键退出"; exit 1
    }
} else {
    Write-Skip "端口 3000 空闲"
}

# ==================== Step 5: 启动开发服务器 ====================
Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  准备启动 JobLoop 开发服务器..." -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "  本地访问: http://localhost:3000" -ForegroundColor Blue
Write-Host "  按 Ctrl+C 停止服务" -ForegroundColor DarkGray
Write-Host ""
Start-Sleep -Seconds 1

Push-Location $PSScriptRoot
npm run dev
Pop-Location
