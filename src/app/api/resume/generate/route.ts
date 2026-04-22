import { NextRequest, NextResponse } from 'next/server'
import { renderPrompt } from '@/lib/prompts/registry'
import { llmRouter } from '@/lib/ai/router'
import { retryWithBackoff, withTimeout, AIOperationError, FALLBACK_RESPONSES } from '@/lib/ai/error-handler'
import type { ResumeGenerateRequest } from '@/types/resume'
import type { CallLLMOptions } from '@/lib/ai/router'

export async function POST(request: NextRequest) {
  try {
    const body: ResumeGenerateRequest = await request.json()
    
    if (!body.userInput && !body.guidedAnswers) {
      return NextResponse.json(
        { success: false, error: '请提供经历内容' },
        { status: 400 }
      )
    }

    // Build input content
    const userInput = body.userInput || 
      Object.values(body.guidedAnswers || {}).join('\n')

    if (!userInput.trim()) {
      return NextResponse.json(
        { success: false, error: '输入内容为空' },
        { status: 400 }
      )
    }

    // Render prompt with variables
    const { system, user } = renderPrompt('resume-generate', {
      user_input: userInput,
      resume_context: '',
    })

    const options: CallLLMOptions = {
      taskType: 'resume-generate',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: 0.7,
      maxTokens: 4096,
      jsonMode: true,
    }

    const result = await retryWithBackoff(() =>
      withTimeout(llmRouter.call(options), 30000)
    )

    try {
      // Parse and validate JSON response
      const parsed = JSON.parse(result.content)
      
      return NextResponse.json({
        success: true,
        data: {
          content: parsed,
          suggestions: parsed.rawSuggestions ? [parsed.rawSuggestions] : [],
        },
      })
    } catch {
      console.error('Failed to parse resume generation response')
      throw AIOperationError.INVALID_RESPONSE
    }
  } catch (error) {
    console.error('Resume generation error:', error)
    
    // Return fallback response
    const fallbackData = FALLBACK_RESPONSES['resume-generate']
    
    if (error instanceof AIOperationError) {
      return NextResponse.json({
        success: true,
        data: {
          content: JSON.parse(fallbackData),
          suggestions: ['AI服务暂时不可用，建议稍后重试'],
        },
        fallback: true,
      })
    }

    return NextResponse.json({
      success: false,
      error: '简历生成失败，请稍后重试',
      code: 'GENERATION_FAILED',
    }, { status: 500 })
  }
}
