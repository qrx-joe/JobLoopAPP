# JobLoop - 求职闭环 AI 工具

> 让普通人变得可被录用 —— AI 驱动的一站式求职辅助平台

## 📦 项目结构

```
JobLoop/                          # 项目根目录
├── jobloop/                       # 🌐 Web 端 (Next.js + React)
│   ├── src/app/(main)/          # 4个页面: 首页/简历/JD优化/面试模拟
│   ├── src/lib/                 # 业务逻辑层(Prompt/AI/存储)
│   └── src/app/api/             # 6个API路由(后端服务)
│
├── jobloop-mini/                  # 📱 微信小程序端 (Taro + React) [NEW]
│   ├── src/pages/               # 对应的4个小程序页面
│   ├── src/utils/storage.ts     # wx.storage 封装
│   └── src/services/request.ts  # wx.request → 同一套 API
│
├── Docs/                         # 📚 文档区
└── package.json                  # 根配置
```

面向普通求职者（非技术背景、无丰富面试经验），通过 AI 能力覆盖从简历优化到面试准备的全链路。

## 🚀 核心功能

| 模块            | 功能                                             | 入口                    |
| --------------- | ------------------------------------------------ | ----------------------- |
| **简历生成**    | 引导式6步输入 / 文件上传解析 → AI 生成结构化简历 | `/resume/new`           |
| **JD 匹配分析** | 岗位JD + 简历内容 → AI 分析匹配度 + 优化建议     | `/jd`                   |
| **面试模拟**    | AI 出题 + 用户作答 → 实时评分反馈                | `/interview`            |
| **面试复盘**    | 真实面试回忆记录 → AI 总结分析改进方案           | `/interview` (复盘模式) |

## 📁 项目结构

```
jobloop/
├── src/
│   ├── app/                    # Next.js App Router 页面
│   │   ├── (main)/            # 主布局页面组
│   │   │   ├── page.tsx       # 首页
│   │   │   ├── resume/new/    # 简历创建页
│   │   │   ├── jd/            # JD 优化匹配页
│   │   │   └── interview/     # 面试模拟 & 复盘页
│   │   ├── api/               # API 路由层
│   │   │   ├── resume/        # 简历(生成/解析/导出)
│   │   │   ├── jd/match/      # JD 匹配分析
│   │   │   └── interview/     # 面试(出题/复盘)
│   │   └── layout.tsx         # 根布局
│   │
│   ├── components/            # React 组件
│   │   ├── ui/                # 通用 UI 组件
│   │   ├── layout/            # 布局组件 (Navbar, ClientLayout)
│   │   ├── resume/            # 简历相关组件
│   │   ├── jd/                # JD 相关组件
│   │   └── interview/         # 面试相关组件
│   │
│   ├── lib/                   # 业务逻辑层
│   │   ├── ai/                # LLM 路由器、错误处理、重试策略
│   │   ├── prompts/           # Prompt 模板注册中心
│   │   │   └── templates/     # 各功能 Prompt 模板
│   │   ├── file-parser/       # 文件解析 (PDF/DOCX/TXT)
│   │   ├── constants.ts       # 全局常量
│   │   └── storage.ts         # 跨页面 localStorage 持久化
│   │
│   ├── hooks/                 # 自定义 Hooks
│   ├── types/                 # TypeScript 类型定义
│   └── styles/                # 全局样式
│
├── .env.local                 # ⚠️ 环境变量 (已 gitignore)
├── .env.example              # 环境变量模板
├── package.json              # 项目依赖
├── tsconfig.json             # TypeScript 配置
└── next.config.*             # Next.js 配置
```

## 🔧 技术栈

- **前端框架**: Next.js 14+ (App Router, RSC)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **AI 层**: OpenAI 兼容接口 (DeepSeek 主力 / GPT-4o 备用)
- **文件解析**: pdf-parse, mammoth (DOCX)
- **状态管理**: React useState + localStorage
- **Prompt 工程**: Registry 注册模式，支持 fallback 降级

## 🏗️ 架构设计

### 数据流

```
用户输入 → 页面组件 → localStorage (跨页持久化) → API Route → Prompt模板 → LLM路由器 → AI Provider
```

### LLM 路由策略

- 主力 Provider: DeepSeek (配置 via `DEEPSEEK_API_KEY`)
- 备用 Provider: OpenAI GPT-4o (自动 failover)
- 重试机制: 指数退避 (max 3次) + 90s 超时
- Fallback: 内置兜底 JSON 响应

### Prompt 管理

所有 Prompt 通过 `lib/prompts/registry.ts` 统一注册：

- `resume-generate` - 简历生成
- `jd-match` - JD 匹配分析
- `interview-generate` - 面试题生成
- `interview-review` - 面试复盘分析

## 🚦 快速启动

```bash
cd jobloop

# 安装依赖
npm install

# 复制环境变量并填入 API Key
cp .env.example .env.local
# 编辑 .env.local 填入 DEEPSEEK_API_KEY 等

# 启动开发服务器
npm run dev

# 访问 http://localhost:3000
```

## 📝 环境变量

| 变量名                  | 说明                         | 必需 |
| ----------------------- | ---------------------------- | ---- |
| `DEEPSEEK_API_KEY`      | DeepSeek API 密钥 (主力模型) | ✅   |
| `DEEPSEEK_API_BASE_URL` | DeepSeek 接口地址            | ✅   |
| `OPENAI_API_KEY`        | OpenAI API 密钥 (备用)       | ❌   |
| `LLM_MODEL`             | 自定义模型名称               | ❌   |

## 🔌 API 接口

### 简历相关

| 接口                      | 方法   | 说明                  |
| ------------------------- | ------ | --------------------- |
| `/api/resume/generate`    | POST   | AI 生成简历           |
| `/api/resume/parse`       | POST   | 解析上传的简历文件    |
| `/api/resume/export`      | POST   | 导出 PDF/DOCX 格式    |

### JD 相关

| 接口                | 方法   | 说明               |
| ------------------- | ------ | ------------------ |
| `/api/jd/match`     | POST   | JD 与简历匹配分析  |

### 面试相关

| 接口                      | 方法   | 说明               |
| ------------------------- | ------ | ------------------ |
| `/api/interview/generate` | POST   | AI 生成面试题      |
| `/api/interview/review`   | POST   | AI 复盘面试表现    |

## 🗄️ 数据库

数据库 Schema 使用 Supabase (PostgreSQL)，详见 `supabase/migrations/001_initial_schema.sql`

主要表：

- `users` - 用户表 (配额管理)
- `resumes` - 简历表 (版本控制)
- `job_descriptions` - JD 表
- `jd_matches` - 匹配记录表
- `interview_sessions` - 面试会话表
- `interview_messages` - 面试消息表
- `prompt_versions` - Prompt 版本管理表
- `user_feedback` - 用户反馈表

## 🧪 开发脚本

| 脚本              | 说明                                  |
| ----------------- | ------------------------------------- |
| `npm run dev`     | 启动开发服务器                        |
| `npm run build`   | 生产环境构建                          |
| `npm run start`    | 启动生产服务器                        |
| `npm run lint`    | ESLint 检查                           |
| `npm run format`  | Prettier 格式化代码                   |
| `npm run typecheck` | TypeScript 类型检查                  |
| `npm run check:all` | 运行全部检查 (lint + typecheck + format) |

## 🐛 常见问题

### Q: 启动报错 `Module not found`

```bash
cd jobloop
rm -rf node_modules package-lock.json
npm install
```

### Q: AI 调用返回 401 错误

检查 `.env.local` 中的 API Key 是否正确配置，确保 DeepSeek API Key 有效。

### Q: 文件解析失败

支持格式：PDF (.pdf)、Word (.docx)、文本 (.txt)，大小限制 10MB。

### Q: TypeScript 类型错误

```bash
npm run typecheck
```

## 📄 文档

详见 `../Docs/` 目录：

- **PRD**: `📄 PRD：求职闭环 AI Web 工具（V1.txt`
- **架构计划**: `📄 项目架构搭建计划.md`
