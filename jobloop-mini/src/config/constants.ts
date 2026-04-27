/**
 * 常量定义（从 jobloop/src/lib/constants.ts 迁移）
 * 与后端保持一致的枚举值
 */

export const APP_NAME = 'JobLoop'
export const APP_DESCRIPTION = '让普通人变得可录用'

// AI Model Configuration
export const AI_MODELS = {
  GPT4O: 'gpt-4o',
  GPT4O_MINI: 'gpt-4o-mini',
  CLAUDE_35_SONNET: 'claude-3.5-sonnet-20240620',
  DEEPSEEK: 'deepseek-ai/DeepSeek-V3',
} as const

// Task Types for Model Routing
export const TASK_TYPES = {
  RESUME_GENERATE: 'resume-generate',
  JD_MATCH: 'jd-match',
  INTERVIEW_GENERATE: 'interview-generate',
  INTERVIEW_FOLLOWUP: 'interview-followup',
  FILE_PARSE: 'file-parse',
} as const

// Question Types
export const QUESTION_TYPES = {
  BEHAVIORAL: 'behavioral',
  TECHNICAL: 'technical',
  PRESSURE: 'pressure',
  SCENARIO: 'scenario',
  OPEN: 'open',
} as const

// Type Labels (for interview question type display)
export const TYPE_LABELS: Record<string, string> = {
  behavioral: '🎯 行为题（STAR）',
  technical: '💻 技术/业务',
  pressure: '🔥 压力测试',
  scenario: '🧪 情景模拟',
  open: '❓ 开放性',
}

// Severity Colors
export const SEVERITY_COLORS: Record<string, string> = {
  high: 'bg-red-50 text-red-700 border-red-200',
  medium: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  low: 'bg-green-50 text-green-700 border-green-200',
}

export const SEVERITY_LABELS: Record<string, string> = {
  high: '🔴 高优先级',
  medium: '🟡 中等',
  low: '🟢 低（加分项）',
}

// Guided Steps for Resume Creation
export const GUIDED_STEPS = [
  { key: 'name', question: '你的名字是什么？（用于简历抬头）', placeholder: '张三' },
  { key: 'target_role', question: '你的目标岗位是什么？', placeholder: '前端开发工程师 / 产品经理 / 数据分析师...' },
  { key: 'experience', question: '描述你最近的一段工作/实习经历', placeholder: '2023.06-至今 在XX公司担任XX职位，负责XX工作...' },
  { key: 'education', question: '你的教育背景？', placeholder: '2020-2024 XX大学 XX专业 本科...' },
  { key: 'skills', question: '你的核心技能和工具？', placeholder: 'React, TypeScript, Node.js, Python, Figma, 数据分析...' },
  { key: 'projects', question: '有代表性的项目经历？（可选）', placeholder: '独立完成了XX项目，负责XX模块...' },
] as const
