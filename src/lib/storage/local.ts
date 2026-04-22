export const STORAGE_KEYS = {
  RESUME_DRAFT: 'jobloop_resume_draft',
  JD_DRAFT: 'jobloop_jd_draft',
  USER_PREFERENCES: 'jobloop_user_preferences',
  INTERVIEW_SESSION: 'jobloop_interview_session',
} as const

export function getItem<T>(key: string): T | null {
  if (typeof window === 'undefined') return null
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : null
  } catch {
    return null
  }
}

export function setItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error('Failed to save to localStorage:', error)
  }
}

export function removeItem(key: string): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(key)
  } catch (error) {
    console.error('Failed to remove from localStorage:', error)
  }
}

export function clearAllStorage(): void {
  if (typeof window === 'undefined') return
  Object.values(STORAGE_KEYS).forEach(key => {
    try { localStorage.removeItem(key) } catch {}
  })
}

// Resume draft helpers
export function saveResumeDraft(draft: unknown): void {
  setItem(STORAGE_KEYS.RESUME_DRAFT, draft)
}

export function loadResumeDraft(): unknown | null {
  return getItem<unknown>(STORAGE_KEYS.RESUME_DRAFT)
}

export function removeResumeDraft(): void {
  removeItem(STORAGE_KEYS.RESUME_DRAFT)
}
