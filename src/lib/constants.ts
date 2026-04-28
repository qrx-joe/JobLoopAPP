export const APP_NAME = 'JobLoop'
export const APP_DESCRIPTION = '让普通人变得可被录用'

// AI Model Configuration
export const AI_MODELS = {
  GPT4O: 'gpt-4o',
  GPT4O_MINI: 'gpt-4o-mini',
  CLAUDE_35_SONNET: 'claude-3-5-sonnet-20240620',
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

export type TaskType = (typeof TASK_TYPES)[keyof typeof TASK_TYPES]

// User Quotas (Free Tier)
export const FREE_QUOTAS = {
  JD_ANALYSIS: 1,
  INTERVIEW_SESSIONS: 1,
  FILE_PARSES: 3,
  PDF_EXPORTS: 2,
} as const

// Input Modes
export const INPUT_MODES = {
  TEXT: 'text',
  GUIDED: 'guided',
  FILE: 'file',
  TEMPLATE: 'template',
} as const

// Resume Types
export const RESUME_TYPES = {
  GENERAL: 'general',
  CAMPUS: 'campus',
  PROFESSIONAL: 'professional',
} as const

// Interview Question Types
export const QUESTION_TYPES = {
  BEHAVIORAL: 'behavioral',
  TECHNICAL: 'technical',
  PRESSURE: 'pressure',
  SCENARIO: 'scenario',
  OPEN: 'open',
} as const
