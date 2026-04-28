'use client'

import { useCallback } from 'react'
import { useResumeStore } from '@/stores/resumeStore'
import type { ResumeContent, ResumeGenerateRequest, ResumeGenerateResponse } from '@/types/resume'

export function useResume() {
  const store = useResumeStore()

  const generateResume = useCallback(async (request: ResumeGenerateRequest): Promise<ResumeGenerateResponse> => {
    store.setGenerating(true)
    store.setError(null)

    try {
      const response = await fetch('/api/resume/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `生成失败 (${response.status})`)
      }

      const data: ResumeGenerateResponse = await response.json()
      store.setContent(data.content)
      return data
    } catch (error) {
      const message = error instanceof Error ? error.message : '简历生成失败'
      store.setError(message)
      throw error
    } finally {
      store.setGenerating(false)
    }
  }, [store])

  return {
    ...store,
    generateResume,
  }
}
