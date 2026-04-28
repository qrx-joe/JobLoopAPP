# JobLoop

> 让普通人变得可被录用 —— AI 驱动的一站式求职辅助平台

[English](./README_EN.md) | 简体中文

---

## 🎯 项目概述

JobLoop 是一款面向普通求职者的 AI 求职辅助工具，覆盖从简历优化到面试准备的全链路流程。

## 📦 项目结构

```
JobLoop/
├── jobloop/              # 🌐 Web 端 (Next.js 14 + React + Tailwind)
├── jobloop-mini/         # 📱 微信小程序端 (Taro + React) [开发中]
├── docs/                 # 📚 文档
├── supabase/             # 🗄️ 数据库 Schema
└── package.json          # 根配置
```

## 🚀 快速开始

### Web 端

```bash
cd jobloop
npm install
cp .env.example .env.local
# 编辑 .env.local，填入 DEEPSEEK_API_KEY
npm run dev
```

访问 http://localhost:3000

### 环境变量

| 变量名                  | 说明                         | 必需 |
| ----------------------- | ---------------------------- | ---- |
| `DEEPSEEK_API_KEY`      | DeepSeek API 密钥            | ✅   |
| `DEEPSEEK_API_BASE_URL` | DeepSeek 接口地址            | ✅   |
| `OPENAI_API_KEY`        | OpenAI API 密钥 (备用)       | ❌   |
| `LLM_MODEL`             | 自定义模型名称               | ❌   |

## 🛠️ 技术栈

| 层级         | 技术                                      |
| ------------ | ----------------------------------------- |
| 前端框架      | Next.js 14+ (App Router)                  |
| 语言         | TypeScript                                 |
| 样式         | Tailwind CSS                               |
| AI 层        | OpenAI 兼容接口 (DeepSeek 主力 / GPT-4o 备用) |
| 文件解析     | pdf-parse, mammoth (DOCX)                  |
| 数据库       | Supabase (PostgreSQL)                     |
| 状态管理     | React useState + localStorage             |

## 📂 目录结构

### jobloop/ - Web 应用

```
jobloop/
├── src/
│   ├── app/                    # App Router 页面
│   │   ├── (main)/            # 主布局页面组
│   │   │   ├── page.tsx       # 首页
│   │   │   ├── resume/new/    # 简历创建
│   │   │   ├── jd/            # JD 匹配
│   │   │   └── interview/    # 面试模拟
│   │   └── api/               # API 路由
│   │       ├── resume/        # 简历 API
│   │       ├── jd/           # JD API
│   │       └── interview/    # 面试 API
│   ├── components/            # React 组件
│   │   ├── ui/               # 通用 UI
│   │   └── ...
│   ├── lib/                   # 业务逻辑
│   │   ├── ai/               # LLM 路由
│   │   ├── prompts/         # Prompt 模板
│   │   └── file-parser/     # 文件解析
│   ├── hooks/                 # 自定义 Hooks
│   └── types/                # 类型定义
├── supabase/migrations/      # 数据库迁移
└── package.json
```

### docs/ - 文档

```
docs/
├── api.md          # API 接口文档
└── database.md     # 数据库设计文档
```

## 📜 核心功能

| 模块            | 功能                                     | 入口            |
| --------------- | ---------------------------------------- | --------------- |
| **简历生成**    | 引导式输入 / 文件上传 → AI 生成结构化简历  | `/resume/new`   |
| **JD 匹配分析** | JD + 简历 → AI 分析匹配度 + 优化建议      | `/jd`           |
| **面试模拟**    | AI 出题 + 用户作答 → 实时评分反馈          | `/interview`    |
| **面试复盘**    | 面试回忆 → AI 总结分析 + 改进方案          | `/interview`    |

## 🧪 开发脚本

```bash
npm run dev          # 开发服务器
npm run build        # 生产构建
npm run lint         # ESLint 检查
npm run format       # Prettier 格式化
npm run typecheck    # TypeScript 类型检查
npm run check:all    # 运行全部检查
```

## 📄 文档

- [Web API 文档](./docs/api.md)
- [数据库设计](./docs/database.md)
- [JobLoop Web README](./jobloop/README.md)

## 📄 License

Private - All rights reserved
