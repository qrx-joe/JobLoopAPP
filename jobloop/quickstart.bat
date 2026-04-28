@echo off
chcp 65001 >nul 2>&1
title JobLoop - Quick Start

cd /d "%~dp0"

:: 最简启动：直接跑 npm run dev（前提是已装好依赖）
call npm run dev
