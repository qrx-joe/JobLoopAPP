# Database Schema

JobLoop 使用 Supabase (PostgreSQL) 作为数据库后端。

## 实体关系图

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   users     │──────<│  resumes    │       │     jd      │
└─────────────┘       └─────────────┘       └─────────────┘
       │                      │                      │
       │                      │                      │
       v                      v                      v
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│ user_       │       │ jd_matches  │       │ interview   │
│ feedback    │       └─────────────┘       │ _sessions   │
└─────────────┘                              └─────────────┘
                                                    │
                                                    v
                                            ┌─────────────┐
                                            │ interview   │
                                            │ _messages   │
                                            └─────────────┘
```

## 表结构

### 1. users

用户表，存储用户信息和配额。

| 字段                  | 类型        | 说明                      |
| --------------------- | ----------- | ------------------------- |
| `id`                  | UUID        | 主键                      |
| `email`               | TEXT        | 邮箱 (唯一)              |
| `nickname`            | TEXT        | 昵称                     |
| `avatar_url`          | TEXT        | 头像 URL                 |
| `jd_analysis_count`   | INTEGER     | JD 分析次数 (免费配额)   |
| `interview_sessions_count` | INTEGER | 面试次数 (免费配额)     |
| `file_parse_count`    | INTEGER     | 文件解析次数 (免费配额)  |
| `pdf_export_count`    | INTEGER     | PDF 导出次数 (免费配额)   |
| `quota_reset_at`      | DATE        | 配额重置日期              |
| `created_at`          | TIMESTAMPTZ | 创建时间                  |
| `updated_at`          | TIMESTAMPTZ | 更新时间                  |
| `last_login_at`       | TIMESTAMPTZ | 最后登录时间              |

### 2. resumes

简历表，支持版本控制。

| 字段              | 类型        | 说明                        |
| ----------------- | ----------- | --------------------------- |
| `id`              | UUID        | 主键                        |
| `user_id`         | UUID        | 外键 → users.id            |
| `title`           | TEXT        | 简历标题                    |
| `type`            | TEXT        | 类型: general/campus/professional |
| `content`         | JSONB       | 简历内容 (灵活结构)         |
| `original_input`  | TEXT        | 原始输入 (用于重新生成)     |
| `input_mode`      | TEXT        | 输入模式: text/guided/file/template |
| `version`         | INTEGER     | 版本号                      |
| `is_latest`       | BOOLEAN     | 是否最新版本               |
| `created_at`      | TIMESTAMPTZ | 创建时间                    |
| `updated_at`      | TIMESTAMPTZ | 更新时间                    |

### 3. job_descriptions

岗位描述表。

| 字段              | 类型        | 说明                        |
| ----------------- | ----------- | --------------------------- |
| `id`              | UUID        | 主键                        |
| `user_id`         | UUID        | 外键 → users.id            |
| `company_name`    | TEXT        | 公司名称                    |
| `job_title`       | TEXT        | 岗位名称                    |
| `source_url`      | TEXT        | 来源 URL                   |
| `content`         | TEXT        | JD 正文内容                |
| `parsed_content`  | JSONB       | 解析后的结构化内容         |
| `created_at`      | TIMESTAMPTZ | 创建时间                    |
| `updated_at`      | TIMESTAMPTZ | 更新时间                    |

### 4. jd_matches

JD 匹配记录表。

| 字段              | 类型        | 说明                        |
| ----------------- | ----------- | --------------------------- |
| `id`              | UUID        | 主键                        |
| `user_id`         | UUID        | 外键 → users.id            |
| `resume_id`       | UUID        | 外键 → resumes.id (可空)   |
| `jd_id`           | UUID        | 外键 → job_descriptions.id |
| `result`          | JSONB       | 匹配结果                    |
| `overall_score`   | INTEGER     | 总分 (0-100)               |
| `created_at`      | TIMESTAMPTZ | 创建时间                    |

### 5. interview_sessions

面试会话表。

| 字段                  | 类型        | 说明                      |
| --------------------- | ----------- | ------------------------- |
| `id`                  | UUID        | 主键                      |
| `user_id`             | UUID        | 外键 → users.id          |
| `resume_id`           | UUID        | 外键 → resumes.id         |
| `jd_id`               | UUID        | 外键 → job_descriptions.id |
| `job_title`           | TEXT        | 岗位名称                  |
| `status`              | TEXT        | 状态: active/completed/abandoned |
| `current_question_index` | INTEGER  | 当前问题索引              |
| `scores`              | JSONB       | 评分数据                  |
| `radar_data`           | JSONB       | 雷达图数据                |
| `created_at`          | TIMESTAMPTZ | 创建时间                  |
| `updated_at`          | TIMESTAMPTZ | 更新时间                  |
| `ended_at`            | TIMESTAMPTZ | 结束时间                  |

### 6. interview_messages

面试消息表。

| 字段          | 类型        | 说明                          |
| ------------- | ----------- | ----------------------------- |
| `id`          | UUID        | 主键                          |
| `session_id`  | UUID        | 外键 → interview_sessions.id |
| `role`        | TEXT        | 角色: user/assistant/system   |
| `content`     | TEXT        | 消息内容                      |
| `metadata`    | JSONB       | 元数据                        |
| `created_at`  | TIMESTAMPTZ | 创建时间                      |

### 7. prompt_versions

Prompt 版本管理表。

| 字段                  | 类型        | 说明                      |
| --------------------- | ----------- | ------------------------- |
| `id`                  | UUID        | 主键                      |
| `name`                | TEXT        | Prompt 名称              |
| `version`             | TEXT        | 版本号                   |
| `prompt_template`     | TEXT        | Prompt 模板内容           |
| `variables`           | JSONB       | 变量列表                  |
| `is_active`           | BOOLEAN     | 是否激活                  |
| `rollout_percentage`  | INTEGER     | 灰度发布百分比 (0-100)    |
| `metrics`             | JSONB       | 指标数据                  |
| `created_by`          | TEXT        | 创建者                    |
| `created_at`          | TIMESTAMPTZ | 创建时间                  |

### 8. user_feedback

用户反馈表。

| 字段              | 类型        | 说明                        |
| ----------------- | ----------- | --------------------------- |
| `id`              | UUID        | 主键                        |
| `user_id`         | UUID        | 外键 → users.id            |
| `session_id`      | UUID        | 会话 ID                    |
| `prompt_version_id` | UUID      | 外键 → prompt_versions.id |
| `type`            | TEXT        | 类型: thumbs_up/thumbs_down/report |
| `content`         | TEXT        | 反馈内容                    |
| `metadata`        | JSONB       | 元数据                      |
| `created_at`      | TIMESTAMPTZ | 创建时间                    |

---

## 索引

| 表名                  | 索引名称                      | 字段                  |
| --------------------- | ----------------------------- | --------------------- |
| resumes               | idx_resumes_user_id           | user_id               |
| resumes               | idx_resumes_is_latest         | is_latest             |
| job_descriptions      | idx_jds_user_id               | user_id               |
| jd_matches            | idx_jd_matches_user_id        | user_id               |
| jd_matches            | idx_jd_matches_resume_id      | resume_id             |
| interview_sessions    | idx_interview_sessions_user_id | user_id              |
| interview_sessions    | idx_interview_sessions_status | status                |
| interview_messages    | idx_interview_messages_session_id | session_id         |
| interview_messages    | idx_interview_messages_role   | session_id, role      |
| prompt_versions       | idx_prompt_versions_name      | name, version         |
| user_feedback         | idx_user_feedback_user_id     | user_id               |
| user_feedback         | idx_user_feedback_type        | type                  |

---

## 行级安全策略 (RLS)

所有数据表启用了行级安全策略，确保用户只能访问自己的数据：

- `resumes` - 用户可查看自己的简历，或查看最新公开简历
- `job_descriptions` - 用户可管理自己的 JD
- `jd_matches` - 用户可查看自己的匹配记录
- `interview_sessions` - 用户可管理自己的面试会话
- `interview_messages` - 用户只能查看自己会话的消息
