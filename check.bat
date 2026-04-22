@echo off
chcp 65001 >nul 2>&1
setlocal enabledelayedexpansion

echo ============================================
echo   JobLoop AI - Code Quality Checker
echo ============================================
echo.

cd /d "%~dp0"

set ERRORS=0
set WARNINGS=0

:: Step 1: ESLint
echo [1/4] Running ESLint...
call npx next lint --no-cache 2>&1
if %errorlevel% neq 0 (
    echo   [ERROR] ESLint failed!
    set /a ERRORS+=1
) else (echo   [PASS] ESLint OK)
echo.

:: Step 2: TypeScript Type Check
echo [2/4] TypeScript type checking...
npx tsc --noEmit 2>&1
if %errorlevel% neq 0 (
    echo   [ERROR] TypeScript errors found!
    set /a ERRORS+=1
) else (echo   [PASS] Types OK)
echo.

:: Step 3: Prettier Check
echo [3/4] Prettier formatting check...
npx prettier --check "src/**/*.{ts,tsx,js,jsx,json,css,md}" 2>&1
if %errorlevel% neq 0 (
    echo   [WARN] Files need formatting! Run: npm run format
    set /a WARNINGS+=1
) else (echo   [PASS] Formatting OK)
echo.

:: Step 4: Build Test
echo [4/4] Build verification...
call npx next build 2>&1
if %errorlevel% neq 0 (
    echo   [ERROR] Build failed!
    set /a ERRORS+=1
) else (echo   [PASS] Build OK)
echo.

echo ============================================
echo   Results Summary
echo ============================================
if %ERRORS% gtr 0 (
    echo   [X] %ERRORS% error(s) found - Fix before committing!
) else (
    echo   [OK] All checks passed!
)
if %WARNINGS% gtr 0 (
    echo   [!] %WARNINGS% warning(s) - Consider fixing
)
echo ============================================

endlocal
exit /b %ERRORS%
