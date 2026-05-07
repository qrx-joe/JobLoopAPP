# JobLoop 系统架构文档

> 本文档基于代码审计生成，覆盖技术栈、模块依赖、数据流、已知问题与改进建议。

---

## 一、技术栈总览

| 层级       | 技术选型                     | 版本            |
| ---------- | ---------------------------- | --------------- |
| 框架       | Next.js (App Router)         | 14.1.0          |
| 运行时     | React                        | 18.2.0          |
| 语言       | TypeScript                   | 5.3.3           |
| 样式       | Tailwind CSS                 | 3.4.1           |
| 状态管理   | Zustand                      | 4.5.0           |
| UI 组件    | Radix UI (Dialog/Tabs/Toast) | ^1.0.x          |
| 图标       | Lucide React                 | ^0.321.0        |
| 富文本     | Tiptap                       | ^2.2.4          |
| 数据库     | Supabase (PostgreSQL)        | ^2.46.2         |
| ORM/客户端 | @supabase/ssr                | ^0.5.1          |
| AI SDK     | OpenAI SDK (统一协议层)      | ^4.26.1         |
| 文件解析   | pdf-parse + mammoth          | ^1.1.1 / ^1.6.0 |
| 文档导出   | docx + @react-pdf/renderer   | ^9.6.1 / ^3.4.4 |
| 校验       | Zod                          | ^3.25.76        |
| 工具       | lodash, date-fns, uuid       | —               |

---

## 二、系统架构图

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              用户浏览器                                   │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │ HTTP / Fetch
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        Next.js 14 App Router                            │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                         前端层 (Client)                          │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │   │
│  │  │  页面路由    │  │  Zustand    │  │      localStorage        │ │   │
│  │  │  (Pages)    │◄─┤   Stores    │◄─┤   (跨页数据缓存)          │ │   │
│  │  └──────┬──────┘  └─────────────┘  └─────────────────────────┘ │   │
│  │         │                                                       │   │
│  │  ┌──────▼──────┐  ┌─────────────┐  ┌─────────────────────────┐ │   │
│  │  │  Components │  │   Hooks     │  │   ErrorBoundary/Guard   │ │   │
│  │  │  (Shared)   │  │ (useResume) │  │   (ErrorGuard)          │ │   │
│  │  └─────────────┘  └─────────────┘  └─────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                │                                        │
│  ┌─────────────────────────────▼──────────────────────────────────┐   │
│  │                      API Routes (Server)                        │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐  │   │
│  │  │ /api/resume │ │ /api/jd     │ │ /api/career/navigate    │  │   │
│  │  │ /generate   │ │ /match      │ │ /api/interview/*        │  │   │
│  │  │ /parse      │ │             │ │                         │  │   │
│  │  │ /export     │ │             │ │                         │  │   │
│  │  └──────┬──────┘ └──────┬──────┘ └───────────┬─────────────┘  │   │
│  │         │               │                    │                │   │
│  │  ┌──────▼───────────────▼────────────────────▼──────────┐   │   │
│  │  │              AI 服务层 (LLMRouter)                      │   │   │
│  │  │  ┌─────────────────────────────────────────────────┐   │   │   │
│  │  │  │  Prompt Registry  →  renderPrompt()              │   │   │   │
│  │  │  │       ↓                                          │   │   │   │
│  │  │  │  LLMRouter.call()  →  Provider 选择 + Fallback   │   │   │   │
│  │  │  │       ↓                                          │   │   │   │
│  │  │  │  DeepSeek (主)  →  OpenAI (备)  →  Anthropic     │   │   │   │
│  │  │  └─────────────────────────────────────────────────┘   │   │   │
│  │  └─────────────────────────────────────────────────────────┘   │   │
│  │         │                                                      │   │
│  │  ┌──────▼────────────────────────────────────────────────┐   │   │
│  │  │              错误处理与降级 (Error Handler)              │   │   │
│  │  │  retryWithBackoff()  +  withTimeout()  +  Fallback     │   │   │
│  │  └────────────────────────────────────────────────────────┘   │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                                │                                       │
│  ┌─────────────────────────────▼──────────────────────────────────┐   │
│  │                      基础设施层                                  │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │   │
│  │  │  FileParser │  │  Supabase   │  │    Environment Vars     │ │   │
│  │  │ (PDF/DOCX)  │  │  (Client/   │  │  (API Keys / URLs)      │ │   │
│  │  │             │  │   Server)   │  │                         │ │   │
│  │  └─────────────┘  └─────────────┘  └─────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 三、模块详解

### 3.1 前端层

**页面路由 (App Router)**

| 路由                | 文件                                   | 功能         | 状态     |
| ------------------- | -------------------------------------- | ------------ | -------- |
| `/`                 | `app/(main)/page.tsx`                  | 首页         | 已有     |
| `/resume/new`       | `app/(main)/resume/new/page.tsx`       | 简历生成     | 已有     |
| `/jd`               | `app/(main)/jd/page.tsx`               | JD 匹配分析  | 已有     |
| `/interview`        | `app/(main)/interview/page.tsx`        | 面试模拟     | 已有     |
| `/career-navigator` | `app/(main)/career-navigator/page.tsx` | 职业方向诊断 | **新增** |

**状态管理 (Zustand)**

```
stores/
├── resumeStore.ts   — 简历内容、输入模式、生成状态、草稿管理
├── userStore.ts     — 用户信息、认证状态（当前为 mock）
├── interviewStore.ts — 面试会话状态
└── jdStore.ts       — JD 输入与匹配结果
```

**数据缓存 (localStorage)**

```
storage.ts (KEYS 前缀 jobloop_)
├── resume_draft        — 简历草稿
├── generated_resume    — 生成后的简历内容
├── jd_input           — JD 输入文本
├── interview_data     — 面试数据
├── career_nav_input   — 职业诊断输入
└── career_nav_result  — 职业诊断结果
```

> ⚠️ **当前 MVP 阶段所有用户数据仅存于 localStorage**，Supabase 客户端已配置但生产代码中未实际读写数据库。

---

### 3.2 API 路由层

**统一请求处理模式**

所有 API Route 遵循相同的处理流水线：

```
Request → 输入校验 → renderPrompt() → llmRouter.call()
                                    ↓
                         retryWithBackoff + withTimeout
                                    ↓
                         JSON 提取 → Zod 校验 → Response
                                    ↓
                         异常捕获 → Fallback 响应
```

| 路由                      | 方法 | 输入                                   | 输出                 | 超时 |
| ------------------------- | ---- | -------------------------------------- | -------------------- | ---- |
| `/api/resume/generate`    | POST | userInput / files / guidedAnswers      | ResumeContent (JSON) | 90s  |
| `/api/resume/parse`       | POST | file (PDF/DOCX/TXT)                    | parsed text          | —    |
| `/api/resume/export`      | POST | ResumeContent + format                 | DOCX buffer          | —    |
| `/api/jd/match`           | POST | jdContent + resumeContent              | match scores (JSON)  | 90s  |
| `/api/interview/generate` | POST | jdContent + resumeContent              | questions (JSON)     | 90s  |
| `/api/interview/review`   | POST | sessionId + answers                    | review report (JSON) | 90s  |
| `/api/career/navigate`    | POST | user_input + target_cities + interests | diagnosis (JSON)     | 120s |

---

### 3.3 AI 服务层

**LLMRouter** (`lib/ai/router.ts`)

多 Provider 统一调用 + 自动降级：

```
任务类型 → 选择 Provider → 调用失败 → 自动切换 Fallback Provider
              │
    ┌─────────┼─────────┐
    ▼         ▼         ▼
 DeepSeek   OpenAI   Anthropic
 (主)        (备)     (备)
```

| Provider  | 环境变量                                     | 默认模型                  | 用途                 |
| --------- | -------------------------------------------- | ------------------------- | -------------------- |
| DeepSeek  | `DEEPSEEK_API_KEY` + `DEEPSEEK_API_BASE_URL` | `deepseek-ai/DeepSeek-V3` | 主模型（性价比优先） |
| OpenAI    | `OPENAI_API_KEY` + `OPENAI_API_BASE_URL`     | `gpt-4o`                  | Fallback             |
| Anthropic | `ANTHROPIC_API_KEY`                          | `claude-3-5-sonnet`       | 备用                 |

**模型路由策略** (`taskModelMap`)

所有任务类型默认路由：`deepseek → openai`

| 任务类型             | 主模型   | Fallback |
| -------------------- | -------- | -------- |
| `resume-generate`    | deepseek | openai   |
| `jd-match`           | deepseek | openai   |
| `interview-generate` | deepseek | openai   |
| `interview-followup` | deepseek | openai   |
| `file-parse`         | deepseek | openai   |
| `career-navigate`    | deepseek | openai   |

**Prompt 系统** (`lib/prompts/`)

```
prompts/
├── registry.ts                    — Prompt 注册表 + renderPrompt()
└── templates/
    ├── resume-generate.ts         — 简历生成
    ├── jd-match.ts               — JD 匹配
    ├── interview-generate.ts     — 面试题生成
    ├── interview-review.ts       — 面试复盘
    └── career-navigate.ts        — 职业方向诊断 (含 Zod Schema)
```

Prompt 渲染机制：

- `system`: 固定角色定义 + 输出格式约束
- `template`: 含 `{变量}` 占位符的模板字符串
- `renderPrompt(name, variables)`: 变量注入 → 返回 `{system, user}`

**JSON 输出约束**

- 对 OpenAI 官方端点启用 `response_format: {type: 'json_object'}`
- 对非 OpenAI 端点（如 SiliconFlow）仅通过 system prompt 约束 JSON 格式
- 所有 API Route 内置 `extractJSON()` 做后置清洗（处理 markdown code block、截断等）

---

### 3.4 错误处理与降级

```
lib/ai/error-handler.ts
├── retryWithBackoff()     — 指数退避重试 (默认 maxRetries=2)
├── withTimeout()          — 请求超时控制 (默认 30s-120s)
├── AIOperationError       — 统一错误类 (TIMEOUT/RATE_LIMITED/PROVIDER_ERROR/INVALID_RESPONSE)
├── FALLBACK_RESPONSES     — 各任务的兜底响应 JSON
└── USER_FRIENDLY_ERRORS   — 用户-facing 错误消息映射
```

降级策略：

1. 主 Provider 失败 → 自动切换到 Fallback Provider
2. 全部 Provider 失败 → 返回 `FALLBACK_RESPONSES` 中的兜底数据（带 `fallback: true` 标记）
3. JSON 解析失败 → 返回 `partialResult: true` + 原始内容片段
4. 超时 → 返回简化版响应，建议用户重试

---

### 3.5 文件解析层

```
lib/file-parser/
├── pdf.ts   — pdf-parse (动态导入，server-side only)
└── docx.ts  — mammoth.extractRawText()
```

支持格式：PDF、DOCX、TXT、MD。DOC 旧格式仅做 UTF-8 文本回退。

---

### 3.6 数据库层 (Supabase)

**客户端双模式**

```
supabase/
├── client.ts  — createBrowserClient (浏览器端，CSR)
└── server.ts  — createServerClient + Cookie 管理 (服务端，SSR)
```

**Schema 设计**（见 `docs/database.md`）

| 表                   | 用途                        | 状态                      |
| -------------------- | --------------------------- | ------------------------- |
| `users`              | 用户信息 + 免费配额计数     | Schema 已设计，代码未使用 |
| `resumes`            | 简历内容（JSONB）+ 版本控制 | Schema 已设计，代码未使用 |
| `job_descriptions`   | JD 内容存储                 | Schema 已设计，代码未使用 |
| `jd_matches`         | 匹配分析记录                | Schema 已设计，代码未使用 |
| `interview_sessions` | 面试会话                    | Schema 已设计，代码未使用 |
| `interview_messages` | 面试消息历史                | Schema 已设计，代码未使用 |
| `prompt_versions`    | Prompt A/B 测试管理         | Schema 已设计，代码未使用 |
| `user_feedback`      | 用户反馈（ thumbs_up/down） | Schema 已设计，代码未使用 |

---

## 四、数据流图

### 4.1 简历生成流程

```
┌──────────┐     ┌──────────────┐     ┌─────────────┐     ┌─────────────┐
│ 用户输入  │────►│ localStorage │────►│ /api/resume │────►│ FileParser  │
│ (文字/文件)│     │ (resume_draft)│     │ /generate   │     │ (如上传文件) │
└──────────┘     └──────────────┘     └──────┬──────┘     └─────────────┘
                                              │
                                              ▼
                                       ┌─────────────┐
                                       │ renderPrompt│
                                       │('resume-generate')│
                                       └──────┬──────┘
                                              │
                                              ▼
                                       ┌─────────────┐
                                       │  LLMRouter  │
                                       │  .call()    │
                                       └──────┬──────┘
                                              │
                    ┌─────────────────────────┼─────────────────────────┐
                    ▼                         ▼                         ▼
              ┌──────────┐            ┌──────────┐            ┌──────────┐
              │ 成功返回  │            │ JSON异常  │            │ AI 失败   │
              │ 解析结果  │            │ 部分返回  │            │ Fallback  │
              └────┬─────┘            └────┬─────┘            └────┬─────┘
                   │                       │                       │
                   └───────────────────────┼───────────────────────┘
                                           ▼
                                    ┌─────────────┐
                                    │ localStorage │
                                    │(generated_resume)
                                    └──────┬──────┘
                                           ▼
                                    ┌─────────────┐
                                    │  前端渲染    │
                                    │ 简历预览页   │
                                    └─────────────┘
```

### 4.2 职业方向诊断流程 (V2.0 新增)

```
┌──────────┐     ┌──────────────┐     ┌─────────────────┐
│ 经历输入  │────►│ localStorage │────►│ /api/career/    │
│(自由文本) │     │(career_nav_input)│   │ /navigate       │
└──────────┘     └──────────────┘     └────────┬────────┘
                                               │
                                               ▼
                                        ┌─────────────┐
                                        │renderPrompt │
                                        │('career-navigate')│
                                        └──────┬──────┘
                                               │
                                               ▼
                                        ┌─────────────┐
                                        │ LLMRouter   │
                                        │ .call()     │
                                        │ timeout=120s│
                                        └──────┬──────┘
                                               │
                                               ▼
                                        ┌─────────────┐
                                        │ Zod Schema  │
                                        │ 校验输出     │
                                        └──────┬──────┘
                                               │
                                               ▼
                                        ┌─────────────┐
                                        │ localStorage │
                                        │(career_nav_result)│
                                        └──────┬──────┘
                                               ▼
                                        ┌─────────────┐
                                        │ 诊断报告页   │
                                        │ (3步引导)   │
                                        └─────────────┘
```

---

## 五、关键设计决策

### 5.1 为什么选择 localStorage 作为当前数据层

| 考量     | 说明                                   |
| -------- | -------------------------------------- |
| 零门槛   | 用户无需注册即可使用完整功能           |
| 零成本   | 无需运行 Supabase 实例（开发阶段）     |
| 快速迭代 | 修改数据结构无需 migration             |
| 风险     | 数据随浏览器清除而丢失，无法跨设备同步 |

**演进路线**：localStorage (MVP) → 轻量账号/Resume ID → Supabase 持久化 (P1)

### 5.2 为什么用 OpenAI SDK 统一调用多 Provider

| 考量       | 说明                                                     |
| ---------- | -------------------------------------------------------- |
| 协议兼容   | DeepSeek、SiliconFlow 等均提供 OpenAI-compatible API     |
| 代码简洁   | 无需引入多个 Provider SDK                                |
| 切换成本低 | 改环境变量即可切换模型，无需改代码                       |
| 限制       | Anthropic 原生 API 非 OpenAI 协议，当前通过 baseURL 绕接 |

### 5.3 为什么 Prompt 用 TS 文件而非数据库

| 考量     | 说明                                                  |
| -------- | ----------------------------------------------------- |
| 版本控制 | Prompt 变更随代码一起 git 追踪                        |
| 类型安全 | TS 模板字符串 + Zod Schema 编译期校验                 |
| 快速迭代 | 改 prompt → 保存 → 刷新即可生效                       |
| 演进路线 | 当前硬编码 → 后期接入 `prompt_versions` 表做 A/B 测试 |

---

## 六、已知问题与代码坏味道

### 🔴 高优先级

| 问题                             | 位置                                                    | 影响                                       | 建议                                        |
| -------------------------------- | ------------------------------------------------------- | ------------------------------------------ | ------------------------------------------- |
| **extractJSON 重复实现**         | 每个 API Route 都有相同函数                             | 维护困难，修复需改 N 处                    | 提取到 `lib/ai/json-extractor.ts`           |
| **resumeStore 引用不存在的模块** | `stores/resumeStore.ts:3` 引用 `@/lib/storage/local`    | 该文件仅 1 行空内容，实际使用 `storage.ts` | 统一 import 路径，删除空文件                |
| **面试评分 placeholder**         | `api/interview/generate:37` 用 `Math.random()` 生成评分 | 功能不可用，用户体验差                     | 接入 `interview-review` prompt 完成评分逻辑 |

### 🟡 中优先级

| 问题                          | 位置                                 | 影响                              | 建议                                       |
| ----------------------------- | ------------------------------------ | --------------------------------- | ------------------------------------------ |
| **Supabase 配置但未使用**     | `lib/supabase/` 存在但业务代码无查询 | 数据库 Schema 文档与代码脱节      | 要么接入持久化，要么移除避免误导           |
| **jsonMode 对非 OpenAI 无效** | `router.ts:111-118`                  | 依赖 prompt 约束 JSON，可靠性降低 | 所有 prompt 的 system 消息中强化 JSON 约束 |
| **无全局请求拦截器**          | 各 API Route 独立处理错误            | 错误处理逻辑分散                  | 封装 `createAPIHandler()` 统一包装         |

### 🟢 低优先级

| 问题                                        | 位置                                        | 影响                    | 建议                                       |
| ------------------------------------------- | ------------------------------------------- | ----------------------- | ------------------------------------------ |
| **DOC 格式支持弱**                          | `file-parser` 中 DOC 仅 UTF-8 回退          | 旧格式解析失败率高      | 明确不支持 DOC，引导用户转 DOCX            |
| **PDF 导出未实现**                          | `api/resume/export` 中 PDF fallback 到 DOCX | 功能不完整              | 接入 `@react-pdf/renderer` 或移除 PDF 选项 |
| ** Career Navigator Step 3 为 placeholder** | `career-navigator/page.tsx:340`             | 用户到第 3 步无实际功能 | 快速接入简历生成 API                       |

---

## 七、环境变量清单

| 变量                            | 用途                    | 必填           |
| ------------------------------- | ----------------------- | -------------- |
| `OPENAI_API_KEY`                | OpenAI API 密钥         | 是（Fallback） |
| `OPENAI_API_BASE_URL`           | OpenAI 代理地址（可选） | 否             |
| `ANTHROPIC_API_KEY`             | Anthropic API 密钥      | 否             |
| `DEEPSEEK_API_KEY`              | DeepSeek API 密钥       | 是（主模型）   |
| `DEEPSEEK_API_BASE_URL`         | DeepSeek 代理地址       | 是             |
| `LLM_MODEL`                     | 覆盖默认模型 ID         | 否             |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase 项目 URL       | 是（客户端）   |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 匿名密钥       | 是（客户端）   |

---

## 八、部署架构

```
┌─────────────────────────────────────────┐
│           Vercel (Production)            │
│  ┌─────────────────────────────────┐   │
│  │  Next.js App (Serverless)       │   │
│  │  ├─ Static Pages (CDN)          │   │
│  │  ├─ API Routes (Edge/Node)      │   │
│  │  └─ Server Components (SSR)     │   │
│  └─────────────────────────────────┘   │
│                   │                     │
│                   ▼                     │
│  ┌─────────────────────────────────┐   │
│  │  Supabase (PostgreSQL)          │   │
│  │  ├─ 数据持久化 (未来启用)        │   │
│  │  └─ Auth (未来启用)             │   │
│  └─────────────────────────────────┘   │
│                   │                     │
│                   ▼                     │
│  ┌─────────────────────────────────┐   │
│  │  外部 AI 服务                    │   │
│  │  ├─ DeepSeek API                │   │
│  │  ├─ OpenAI API                  │   │
│  │  └─ Anthropic API               │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

---

_文档生成时间: 2026-05-07_
_对应代码版本: main 分支 (commit 32f8f2e)_
