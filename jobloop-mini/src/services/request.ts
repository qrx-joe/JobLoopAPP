/**
 * 网络请求封装
 * 统一处理：baseURL、错误处理、loading 状态
 */

const BASE_URL = 'https://your-domain.com' // TODO: 替换为实际部署的 API 地址

interface RequestOptions<T> {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: Record<string, unknown>
  header?: Record<string, string>
  showLoading?: boolean
  loadingText?: string
  timeout?: number
}

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  _fallback?: boolean
}

export async function request<T>(options: RequestOptions<T>): Promise<ApiResponse<T>> {
  const {
    url,
    method = 'POST',
    data,
    showLoading = false,
    loadingText = '加载中...',
    timeout = 60000,
  } = options

  if (showLoading) {
    wx.showLoading({ title: loadingText, mask: true })
  }

  try {
    const res = await new Promise<ApiResponse<T>>((resolve, reject) => {
      wx.request({
        url: `${BASE_URL}${url}`,
        method,
        data,
        timeout,
        header: {
          'Content-Type': 'application/json',
          ...options.header,
        },
        success(res) {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(res.data as ApiResponse<T>)
          } else if (res.statusCode === 401) {
            resolve({ success: false, error: '请先登录' })
          } else if (res.data && typeof res.data === 'object') {
            resolve(res.data as ApiResponse<T>)
          } else {
            reject(new Error(`服务器错误 (${res.statusCode})`))
          }
        },
        fail(err) {
          console.error('[request] failed:', err)
          reject(new Error('网络连接失败，请检查网络'))
        },
      })
    })

    return res
  } catch (error) {
    const msg = error instanceof Error ? error.message : '未知错误'
    return { success: false, error: msg }
  } finally {
    if (showLoading) {
      wx.hideLoading()
    }
  }
}

// ===== Convenience Methods =====

/** 简历生成 */
export function generateResume(params: { userInput: string; inputMode: string; guidedAnswers?: Record<string, string> }) {
  return request<{ content: Record<string, unknown> }>({
    url: '/api/resume/generate',
    data: params,
    showLoading: true,
    loadingText: 'AI正在生成简历...',
    timeout: 90000,
  })
}

/** JD 匹配分析 */
export function analyzeJDMatch(params: { jdContent: string; resumeContent: string }) {
  return request<{
    overallScore: number
    dimensionScores: { skills: number; experience: number; expression: number }
    gaps: Array<{ area: string; severity: string; suggestion: string; isShortTerm: boolean }>
    optimizedBullets: Array<{ original: string; optimized: string; reason: string }>
    keywordTrends: string[]
  }>({
    url: '/api/jd/match',
    data: params,
    showLoading: true,
    loadingText: '正在分析匹配度...',
    timeout: 90000,
  })
}

/** 面试题生成 */
export function generateInterviewQuestions(params: { jdContent: string; resumeContent?: string }) {
  return request<{
    questions: Array<{
      id: string
      type: string
      category: string
      text: string
      followUpStrategy: Record<string, string>
      idealAnswerElements: string[]
    }>
    scoringCriteria: Record<string, unknown>
  }>({
    url: '/api/interview/generate',
    data: params,
    showLoading: true,
    loadingText: 'AI正在生成面试题...',
    timeout: 90000,
  })
}

/** 面试复盘分析 */
export function analyzeInterviewReview(params: {
  company: string
  position: string
  resumeContent?: string
  questions: string[]
  userAnswers?: string[]
}) {
  return request<Record<string, unknown>>({
    url: '/api/interview/review',
    data: params,
    showLoading: true,
    loadingText: '正在进行复盘分析...',
    timeout: 90000,
  })
}
