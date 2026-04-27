/**
 * 微信小程序存储封装
 * 兼容 localStorage API，与 Web 版接口一致
 */

const PREFIX = 'jobloop_'

// ===== Generic Helpers =====

function safeGet<T>(key: string, fallback: T): T {
  try {
    const raw = wx.getStorageSync(key)
    if (!raw) return fallback
    if (typeof raw === 'string') {
      try { return JSON.parse(raw) as T } catch { return fallback }
    }
    return raw as T
  } catch {
    return fallback
  }
}

function safeSet(key: string, value: unknown): void {
  try {
    const toStore = typeof value === 'string' ? value : JSON.stringify(value)
    wx.setStorageSync(key, toStore)
  } catch (e) {
    console.warn('[storage] Write failed:', e)
  }
}

function safeRemove(key: string): void {
  try {
    wx.removeStorageSync(key)
  } catch { /* ignore */ }
}

// ===== Keys =====
const KEYS = {
  RESUME_DRAFT: `${PREFIX}resume_draft`,
  GENERATED_RESUME: `${PREFIX}generated_resume`,
  JD_INPUT: `${PREFIX}jd_input`,
  INTERVIEW_DATA: `${PREFIX}interview_data`,
  TARGET_ROLE: `${PREFIX}target_role`,
} as const

// ===== Resume Draft =====

export interface ResumeDraft {
  rawInput: string
  inputMode: 'text' | 'guided' | 'file'
  guidedAnswers: Record<string, string>
  updatedAt?: number
}

export function saveResumeDraft(draft: ResumeDraft): void {
  safeSet(KEYS.RESUME_DRAFT, { ...draft, updatedAt: Date.now() })
}

export function getResumeDraft(): ResumeDraft | null {
  return safeGet<ResumeDraft | null>(KEYS.RESUME_DRAFT, null)
}

export function clearResumeDraft(): void {
  safeRemove(KEYS.RESUME_DRAFT)
}

// ===== Generated Resume =====

export interface GeneratedResume {
  content: string
  generatedAt: number
}

export function saveGeneratedResume(data: GeneratedResume): void {
  safeSet(KEYS.GENERATED_RESUME, { ...data, generatedAt: Date.now() })
}

export function getGeneratedResume(): GeneratedResume | null {
  return safeGet<GeneratedResume | null>(KEYS.GENERATED_RESUME, null)
}

// ===== JD Input =====

export function saveJDInput(text: string): void {
  safeSet(KEYS.JD_INPUT, { text, updatedAt: Date.now() })
}

export function getJDInput(): string {
  const data = safeGet<{ text: string } | null>(KEYS.JD_INPUT, null)
  return data?.text || ''
}

// ===== Interview Data =====

export function saveInterviewData(data: Record<string, unknown>): void {
  safeSet(KEYS.INTERVIEW_DATA, { ...data, savedAt: Date.now() })
}

export function getInterviewData(): Record<string, unknown> | null {
  return safeGet<Record<string, unknown> | null>(KEYS.INTERVIEW_DATA, null)
}

// ===== Target Role (from homepage) =====

export function saveTargetRole(role: string): void {
  safeSet(KEYS.TARGET_ROLE, role)
}

export function getTargetRole(): string {
  return safeGet<string>(KEYS.TARGET_ROLE, '')
}

// ===== Clear All =====

export function clearAllData(): void {
  Object.values(KEYS).forEach(safeRemove)
}
