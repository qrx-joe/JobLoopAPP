'use client'

import { useCallback } from 'react'
import { useInterviewStore } from '@/stores/interviewStore'
import type { InterviewSession, InterviewMessage, Question } from '@/types/interview'

export function useInterview() {
  const store = useInterviewStore()

  const startSession = useCallback(async (
    jobTitle: string,
    resumeId?: string,
    jdId?: string
  ): Promise<InterviewSession> => {
    store.setLoadingResponse(true)

    try {
      const response = await fetch('/api/interview/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobTitle, resumeId, jdId }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `面试问题生成失败 (${response.status})`)
      }

      const data = await response.json()
      store.setQuestions(data.questions)
      store.setSession(data.session)
      return data.session
    } catch (error) {
      const message = error instanceof Error ? error.message : '面试初始化失败'
      store.setError(message)
      throw error
    } finally {
      store.setLoadingResponse(false)
    }
  }, [store])

  const sendMessage = useCallback(async (
    sessionId: string,
    content: string,
    questionId?: string
  ): Promise<InterviewMessage> => {
    store.setLoadingResponse(true)
    
    // Add user message immediately
    const userMessage: InterviewMessage = {
      id: crypto.randomUUID(),
      sessionId,
      role: 'user',
      content,
      metadata: { questionId },
      createdAt: new Date().toISOString(),
    }
    store.addMessage(userMessage)

    try {
      const response = await fetch(`/api/interview/${sessionId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, questionId }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'AI回复失败')
      }

      const aiMessage: InterviewMessage = await response.json()
      store.addMessage(aiMessage)
      return aiMessage
    } catch (error) {
      const errorMessage: InterviewMessage = {
        id: crypto.randomUUID(),
        sessionId,
        role: 'assistant',
        content: '抱歉，我暂时无法回复。请稍后重试。',
        metadata: {},
        createdAt: new Date().toISOString(),
      }
      store.addMessage(errorMessage)
      store.setError(error instanceof Error ? error.message : '发送消息失败')
      return errorMessage
    } finally {
      store.setLoadingResponse(false)
    }
  }, [store])

  return {
    ...store,
    startSession,
    sendMessage,
  }
}
