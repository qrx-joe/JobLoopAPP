# JobLoop 微信小程序 (Taro + React)

基于 [Taro 4](https://taro.zone/) 跨端框架，复用 JobLoop Web 版的核心业务逻辑（Prompt模板、AI路由、错误处理）。

## 📁 项目结构

```
jobloop-mini/
├── config/                  # Taro 配置
│   ├── index.ts            # 主配置（页面路由、tabBar）
│   └── weapp.ts           # 微信小程序特有配置
├── src/
│   ├── app.tsx             # 小程序入口组件
│   ├── app.config.ts       # 全局配置
│   ├── app.scss           # 全局样式（WXSS 变量+工具类）
│   ├── pages/
│   │   ├── index/index    # 首页（快速入口+功能卡片）
│   │   ├── resume/index   # 简历创建页（自由输入/引导式/上传文件）
│   │   ├── jd/index       # JD 匹配优化页
│   │   └── interview/#    # 面试模拟 & 复盘页（双模式切换）
│   ├── utils/
│   │   └── storage.ts     # wx.storage 封装（接口与 Web 版一致）
│   ├── services/
│   │   └── request.ts     # 网络请求封装（wx.request → 后端 API）
│   └── config/
│       └── constants.ts   # 常量定义（枚举值与后端对齐）
├── package.json
├── tsconfig.json
└── .gitignore
```

## 🚀 快速开始

### 前置条件
- Node.js >= 18
- 微信开发者工具（最新 Nightly 版）

### 安装 & 启动

```bash
cd jobloop-mini
npm install
npm run dev:weapp
```

然后用微信开发者工具打开 `dist` 目录。

### ⚠️ 注意事项

1. **API 地址**：需修改 `src/services/request.ts` 中 `BASE_URL` 为实际部署的后端地址
2. **TabBar 图标**：需在 `src/assets/` 下准备 8 个图标文件（4 normal + 4 active），或移除 tabBar 改用普通导航
3. **域名白名单**：微信小程序要求 API 域名已备案并在后台配置 `request 合法域名`

## 🔗 与 Web 版的关系

| 层 | Web 版 | 小程序版 | 复用？ |
|---|---|---|---|
| UI 组件 | React DOM + Tailwind | Taro + WXSS | ❌ 重写 |
| Prompt 模板 | src/lib/prompts/templates/* | 同一文件（可 npm 共享或复制） | ✅ 直接复用 |
| AI 路由器 | src/lib/ai/router.ts | 服务端已有，小程序只调用 | ✅ 复用逻辑 |
| 存储层 | localStorage | wx.storageSync | ❌ 接口一致，实现不同 |
| 网络请求 | fetch() → /api/* | Taro.request → 同一后端 | ✅ 同一套 API |

## 🎨 设计规范

- 主色调：`#2563eb` (Blue 600)
- 字号基准：`28rpx`（rpx 单位适配各屏幕宽度）
- 圆角：8rpx(sm) / 16rpx(md) / 24rpx(lg)
- 卡片阴影：`0 2rpx 8rpx rgba(0,0,0,0.04)`
