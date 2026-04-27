/**
 * JobLoop Mini Program - API Service
 * 对接 Next.js 后端 API（与网页版同一套）
 */

import Taro from '@tarojs/taro'

const BASE_URL = 'http://localhost:3000' // 开发环境，生产环境替换为实际部署地址

interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

/**
 * 通用请求封装
 */
function request<T>(options: {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: any
  header?: Record<string, string>
}): Promise<ApiResponse<T>> {
  const { url, method = 'GET', data, header } = options
  return new Promise((resolve, reject) => {
    Taro.request({
      url: `${BASE_URL}${url}`,
      method,
      header: { 'Content-Type': 'application/json', ...(header || {}) },
      data: method !== 'GET' ? JSON.stringify(data) : undefined,
      success: function(res: any) { resolve(res.data as ApiResponse<T>) },
      fail: function(err: any) {
        console.error('[API] Request failed:', err)
        reject(new Error('网络请求失败，请检查网络连接'))
      },
    })
  })
}

/**
 * 上传文件（multipart/form-data）
 */
interface ParsedFileInfo {
  parsedText: string
  files: Array<{ name: string; size: number; chars: number }>
}

function uploadFile(filePath: string): Promise<any> {
  return new Promise((resolve, reject) => {
    Taro.uploadFile({
      url: `${BASE_URL}/api/resume/parse`,
      filePath,
      name: 'files',
      formData: {},
      success: function(res: any) {
        if (res.statusCode === 200 || res.statusCode === 201) {
          resolve(res.data as any)
        } else {
          reject(new Error('文件解析失败'))
        }
      },
      fail: function(err: any) {
        console.error('[API] Upload failed:', err)
        reject(new Error('文件上传失败，请重试'))
      },
    })
  })
}

// ==================== Resume API ====================

export interface GenerateResumeParams {
  userInput: string
  inputMode?: 'text' | 'guided' | 'file'
  guidedAnswers?: Record<string, string>
}

export interface ResumeContent {
  personalInfo?: { name?: string; phone?: string; email?: string; location?: string }
  summary?: string
  experienceItems: Array<{
    id: string; title: string; role: string; duration?: string
    achievements: string[]; starStructure?: { situation: string; task: string; action: string; result: string }
  }>
  skillTags: Array<{ name: string; confidence: 'high' | 'medium' | 'low' }>
  rawSuggestions?: string
  [key: string]: any // 兼容额外字段
}

export const resumeApi = {
  /** 解析上传的文件 */
  parseFiles: (filePath: string) => uploadFile(filePath),

  /** AI 生成简历 */
  generate: (params: GenerateResumeParams) =>
    request<any>({ url: '/api/resume/generate', method: 'POST', data: params }),

  /** 导出 Word */
  exportDocx: (content: ResumeContent) =>
    request<{ buffer: ArrayBuffer; filename: string }>({
      url: '/api/resume/export',
      method: 'POST',
      data: { content, format: 'docx' },
    }),
}

// ==================== JD Match API ====================

export interface JDMatchParams {
  jdContent: string
  resumeContent: string
}

export interface JDMatchResult {
  overallScore: number
  dimensionScores: { skills: number; experience: number; expression: number }
  gaps: Array<{ area: string; severity: 'high' | 'medium' | 'low'; suggestion: string }>
  optimizedBullets: Array<{ original: string; optimized: string; reason: string }>
  keywordTrends: string[]
}

export const jdApi = {
  match: (params: JDMatchParams) =>
    request<JDMatchResult>({ url: '/api/jd/match', method: 'POST', data: params }),
}

// ==================== Interview API ====================

export interface InterviewQuestion {
  id: string
  type: 'behavioral' | 'technical' | 'pressure' | 'scenario' | 'open'
  category: string
  text: string
  followUpStrategy: { depth: string; challenge: string; scenario: string }
  idealAnswerElements: string[]
}

export interface InterviewGenerateResult {
  questions: InterviewQuestion[]
  scoringCriteria: { dimensions: string[]; scoreRange: [number, number]; feedbackTemplate: string }
}

export interface InterviewScoreResult {
  score: number
  feedback: string
}

export const interviewApi = {
  /** 生成面试题 */
  generateQuestions: (params: { jdContent: string; resumeContent?: string }) =>
    request<InterviewGenerateResult>({ url: '/api/interview/generate', method: 'POST', data: params }),

  /** 提交回答获取评分 */
  submitAnswer: (params: { jdContent: string; questionId: string; userAnswer: string }) =>
    request<InterviewScoreResult>({ url: '/api/interview/generate', method: 'POST', data: params }),

  /** 面试复盘 */
  review: (params: {
    company: string; position: string; jdContent?: string; resumeContent?: string
    questions: string[]; userAnswers: string[]
  }) =>
    request<any>({ url: '/api/interview/review', method: 'POST', data: params }),
}

// ==================== Storage (跨页面数据共享) ====================

const PREFIX = 'jobloop_'

const safeGet = <T>(key: string, fallback: T): T => {
  try {
    const raw = Taro.getStorageSync(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

const safeSet = (key: string, value: unknown): void => {
  try {
    Taro.setStorageSync(key, JSON.stringify(value))
  } catch (e) {
    console.warn('[Storage] Write failed:', e)
  }
}

export const storage = {
  saveResumeDraft: (draft: { rawInput: string; inputMode: string; guidedAnswers?: Record<string, string> }) =>
    safeSet(`${PREFIX}resume_draft`, { ...draft, updatedAt: Date.now() }),
  getResumeDraft: () => safeGet<{ rawInput: string; inputMode: string; guidedAnswers?: Record<string, string> } | null>(`${PREFIX}resume_draft`, null),

  saveGeneratedResume: (data: { content: string; generatedAt: number }) =>
    safeSet(`${PREFIX}generated_resume`, data),
  getGeneratedResume: () => safeGet<{ content: string; generatedAt: number } | null>(`${PREFIX}generated_resume`, null),

  saveJDInput: (text: string) =>
    safeSet(`${PREFIX}jd_input`, { text, updatedAt: Date.now() }),
  getJDInput: () => {
    const d = safeGet<{ text: string } | null>(`${PREFIX}jd_input`, null)
    return d?.text || ''
  },

  clearAll: () => {
    try {
      Taro.clearStorageSync()
    } catch { /* ignore */ }
  },
}
