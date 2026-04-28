# API Reference

## 基础信息

| 项目        | 说明                          |
| ----------- | ----------------------------- |
| Base URL    | `/api`                        |
| Content-Type| `application/json`            |
| 认证方式    | 无 (当前版本)                 |

---

## 简历 API

### POST `/api/resume/generate`

AI 生成简历

**Request Body:**

```json
{
  "user_input": "string",      // 用户输入的原始信息
  "input_mode": "text|file|guided|template",  // 输入模式
  "resume_context": {}          // 可选的简历上下文
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "resume": {
      "title": "string",
      "content": {},
      "version": 1
    }
  }
}
```

---

### POST `/api/resume/parse`

解析上传的简历文件

**Request Body:**

```json
{
  "file": "base64 encoded file content",
  "file_type": "pdf|docx|txt"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "parsed_content": "string",
    "file_type": "pdf|docx|txt",
    "word_count": 1234
  }
}
```

---

### POST `/api/resume/export`

导出简历为指定格式

**Request Body:**

```json
{
  "resume_content": {},
  "format": "pdf|docx",
  "template": "string"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "download_url": "string",
    "format": "pdf|docx"
  }
}
```

---

## JD API

### POST `/api/jd/match`

JD 与简历匹配分析

**Request Body:**

```json
{
  "jd_content": "string",      // 岗位描述内容
  "resume_content": {},        // 简历内容
  "company_name": "string",   // 公司名称 (可选)
  "job_title": "string"       // 岗位名称
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "overall_score": 85,
    "match_details": {
      "keyword_match_rate": 0.75,
      "experience_match": 0.80,
      "skills_gap": []
    },
    "suggestions": [
      {
        "type": "keyword|experience|skills",
        "content": "string",
        "priority": "high|medium|low"
      }
    ]
  }
}
```

---

## 面试 API

### POST `/api/interview/generate`

生成面试问题

**Request Body:**

```json
{
  "resume_content": {},        // 简历内容
  "jd_content": "string",      // 岗位描述 (可选)
  "job_title": "string",       // 岗位名称
  "question_count": 5,        // 问题数量 (默认 5)
  "question_types": ["behavioral", "technical"]  // 问题类型
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "session_id": "uuid",
    "questions": [
      {
        "id": "uuid",
        "type": "behavioral|technical|pressure|scenario",
        "question": "string",
        "expected_points": ["string"]
      }
    ]
  }
}
```

---

### POST `/api/interview/review`

面试复盘分析

**Request Body:**

```json
{
  "session_id": "uuid",
  "user_answers": [
    {
      "question_id": "uuid",
      "answer": "string"
    }
  ],
  "interview_notes": "string"  // 面试回忆记录 (可选)
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "overall_score": 78,
    "radar_data": {
      "communication": 80,
      "technical": 75,
      "problem_solving": 82
    },
    "feedback": [
      {
        "question_id": "uuid",
        "score": 75,
        "strengths": ["string"],
        "improvements": ["string"]
      }
    ],
    "summary": "string",
    "next_steps": ["string"]
  }
}
```

---

## 错误响应

所有 API 遵循统一的错误格式：

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述",
    "details": {}
  }
}
```

### 错误码

| Code                    | HTTP Status | 说明                    |
| ----------------------- | ----------- | ----------------------- |
| `INVALID_INPUT`         | 400         | 输入参数无效            |
| `FILE_TOO_LARGE`        | 400         | 文件大小超出限制        |
| `UNSUPPORTED_FORMAT`    | 400         | 不支持的文件格式        |
| `UNAUTHORIZED`         | 401         | 认证失败                |
| `RATE_LIMITED`          | 429         | 请求频率超限            |
| `AI_PROVIDER_ERROR`     | 500         | AI 服务商错误           |
| `INTERNAL_ERROR`        | 500         | 服务器内部错误          |
