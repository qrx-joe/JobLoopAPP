# 项目目标

JobLoop 是面向 **GAP 期、非典型背景求职者** 的职业方向诊断与经历重组工具。

核心原则：**先帮用户想清楚"能投什么"，再帮用户"怎么投"**。

具体解决的问题排序：

1. 职业方向诊断（最重要）— 基于用户经历推荐适合的城市、行业、岗位类别
2. 经历重组包装 — 把杂乱的学生工作/GAP 期经历翻译成 HR 能看懂的职场能力
3. 定向简历生成 — 针对不同岗位生成不同侧重的简历版本
4. JD 体检 — 投递前评估岗位真实性和匹配度
5. 面试模拟与复盘 — 基于简历+JD 生成面试题并评分

目标用户的最大痛点不是"简历写得不好"，而是：

- 经历杂（转专业、多段学生工作、GAP 期），不知道能投什么岗位
- 职业方向迷茫，没有清晰的求职叙事
- GAP 期长（6 个月–3 年），不知道怎么解释这段空白

---

# 当前完成内容

## 已上线的页面与功能

| 模块         | 路由                | 状态                                       |
| ------------ | ------------------- | ------------------------------------------ |
| 首页         | `/`                 | 已有                                       |
| 简历生成     | `/resume/new`       | 已有（支持文字输入、文件上传、引导式问答） |
| JD 匹配分析  | `/jd`               | 已有                                       |
| 面试模拟     | `/interview`        | 已有（含生成面试题、评分框架）             |
| 职业方向诊断 | `/career-navigator` | **新增页面框架，Step 3 为 placeholder**    |

## 已实现的 API 路由

| 路由                           | 功能                           |
| ------------------------------ | ------------------------------ |
| `POST /api/resume/generate`    | 简历生成                       |
| `POST /api/resume/parse`       | PDF/DOCX/TXT 文件解析          |
| `POST /api/resume/export`      | 简历导出（DOCX，PDF fallback） |
| `POST /api/jd/match`           | JD 与简历匹配度分析            |
| `POST /api/interview/generate` | 面试题生成                     |
| `POST /api/interview/review`   | 面试复盘评分                   |
| `POST /api/career/navigate`    | 职业方向诊断                   |

## 已实现的基础设施

- **AI 路由层**：多 Provider 统一调用（DeepSeek 主 → OpenAI 备 → Anthropic 备）+ 自动降级
- **Prompt 系统**：5 个 Prompt 模板（简历生成、JD 匹配、面试生成、面试复盘、职业诊断）+ 注册表 + 渲染器
- **错误处理**：指数退避重试、超时控制、统一错误类、兜底响应
- **文件解析**：PDF（pdf-parse）、DOCX（mammoth）、TXT/MD
- **状态管理**：Zustand（resumeStore、jdStore、interviewStore、userStore）
- **数据缓存**：localStorage（跨页数据缓存，MVP 阶段无数据库持久化）
- **数据库 Schema**：Supabase 8 张表已设计（users/resumes/jd_matches/interview_sessions 等），但 **代码中未实际使用**

---

# 技术栈

## 前端

- **框架**：Next.js 14 App Router
- **运行时**：React 18.2
- **语言**：TypeScript 5.3
- **样式**：Tailwind CSS 3.4 + Radix UI（Dialog/Tabs/Toast）+ class-variance-authority
- **状态管理**：Zustand 4.5
- **图标**：Lucide React
- **富文本**：Tiptap 2.2
- **表单**：React Hook Form + Zod
- **日期/工具**：date-fns、lodash、uuid

## 后端

- **框架**：Next.js API Routes（Serverless Functions）
- **文件解析**：pdf-parse、mammoth
- **文档导出**：docx、@react-pdf/renderer

## 数据库

- **已配置但未启用**：Supabase（PostgreSQL）+ @supabase/ssr
- **当前数据层**：localStorage（MVP 阶段零门槛、零成本）

## AI

- **SDK**：OpenAI SDK 4.26（统一协议层，兼容 DeepSeek/SiliconFlow）
- **Provider**：
  - DeepSeek（主，via SiliconFlow）
  - OpenAI（Fallback）
  - Anthropic（备用）
- **Prompt 管理**：TS 文件模板 + renderPrompt() 变量注入
- **输出约束**：Zod Schema 校验 + extractJSON() 后置清洗

---

# 当前架构

## 核心数据流

```
用户输入（文字/文件）
    ↓
localStorage（跨页缓存，KEYS 前缀 jobloop_）
    ↓
API Route → 输入校验（Zod）→ renderPrompt() → llmRouter.call()
                                              ↓
                                    retryWithBackoff + withTimeout
                                              ↓
                                    JSON 提取 → Zod 校验 → Response
                                              ↓
                                    异常捕获 → Fallback 响应
    ↓
localStorage（结果缓存）
    ↓
前端渲染（报告页/简历预览/面试界面）
```

## 关键设计决策

1. **localStorage 作为当前数据层**：零门槛、零成本、快速迭代。演进路线：localStorage (MVP) → 轻量账号 → Supabase 持久化 (P1)
2. **OpenAI SDK 统一调用多 Provider**：DeepSeek/SiliconFlow 均提供 OpenAI-compatible API，改环境变量即可切换模型
3. **Prompt 用 TS 文件而非数据库**：版本控制 + 类型安全 + 快速迭代。演进路线：硬编码 → 后期接入 `prompt_versions` 表做 A/B 测试

---

# 当前问题

## 🔴 高优先级

| 问题                                       | 位置                                                    | 影响                                       |
| ------------------------------------------ | ------------------------------------------------------- | ------------------------------------------ |
| **extractJSON 重复实现**                   | 每个 API Route 都有相同函数                             | 维护困难，修复需改 N 处                    |
| **resumeStore 引用不存在的模块**           | `stores/resumeStore.ts:3` 引用 `@/lib/storage/local`    | 该文件仅 1 行空内容，实际使用 `storage.ts` |
| **面试评分 placeholder**                   | `api/interview/generate:37` 用 `Math.random()` 生成评分 | 功能不可用，用户体验差                     |
| **Career Navigator Step 3 为 placeholder** | `career-navigator/page.tsx:340`                         | 用户到第 3 步无实际功能                    |

## 🟡 中优先级

| 问题                          | 位置                                 | 影响                              |
| ----------------------------- | ------------------------------------ | --------------------------------- |
| **Supabase 配置但未使用**     | `lib/supabase/` 存在但业务代码无查询 | 数据库 Schema 文档与代码脱节      |
| **jsonMode 对非 OpenAI 无效** | `router.ts:111-118`                  | 依赖 prompt 约束 JSON，可靠性降低 |
| **无全局请求拦截器**          | 各 API Route 独立处理错误            | 错误处理逻辑分散                  |

## 🟢 低优先级

| 问题               | 位置                                        | 影响               |
| ------------------ | ------------------------------------------- | ------------------ |
| **DOC 格式支持弱** | `file-parser` 中 DOC 仅 UTF-8 回退          | 旧格式解析失败率高 |
| **PDF 导出未实现** | `api/resume/export` 中 PDF fallback 到 DOCX | 功能不完整         |

---

# 下一步任务

1. **完成 Career Navigator 核心流程**
   - 实现 Step 3（经历重组包装 → 定向简历生成入口）
   - 接入简历生成 API，支持传入"目标岗位"和"重组经历"参数
   - 修复 `career-navigator/page.tsx:340` 的 placeholder

2. **提取公共逻辑，消灭重复代码**
   - 将 `extractJSON()` 提取到 `lib/ai/json-extractor.ts`，统一各 API Route 调用
   - 修复 `resumeStore.ts` 的 import 路径，删除空的 `storage/local` 文件
   - 封装 `createAPIHandler()` 统一包装 API Route 的错误处理

3. **完成经历重组包装（Experience Reframer）**
   - 新增 `/experience-reframe` 页面
   - 编写 `experience-reframe` prompt（学生工作翻译、GAP 期包装、能力标签云）
   - 扩展 `storage.ts` 支持 `REFRAMED_EXPERIENCE`、`RESUME_VERSIONS` 等新 KEYS

---

# 重要约束

## 不要改的东西

1. **MVP 阶段继续使用 localStorage，不要接入 Supabase 持久化**
   - 原因：零门槛、无需用户注册、快速迭代
   - 何时可以改：P1 阶段需要用户登录/数据同步时

2. **不要动多 Provider AI 路由的底层协议**
   - 当前用 OpenAI SDK 统一调用 DeepSeek/OpenAI/Anthropic，通过 baseURL 切换
   - 不要引入 `@ai-sdk/anthropic` 等 Provider 专属包

3. **Prompt 模板继续用 TS 文件，不要迁到数据库**
   - 原因：版本控制 + 编译期类型安全
   - 何时可以改：需要做 A/B 测试时，再接入 `prompt_versions` 表

4. **不要删除现有的面试模拟和 JD 匹配功能**
   - 它们属于 P2 功能，但在 V2.0 产品流程中仍保留，只是优先级降低

5. **不要引入新的前端框架/状态管理**
   - 当前 Zustand + React Hook Form 已足够，不要引入 Redux/MobX 等
