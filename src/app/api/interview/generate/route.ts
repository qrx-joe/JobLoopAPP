import { NextRequest, NextResponse } from 'next/server';
import { renderPrompt } from '@/lib/prompts/registry';
import { llmRouter } from '@/lib/ai/router';
import {
  retryWithBackoff,
  withTimeout,
  AIOperationError,
  FALLBACK_RESPONSES,
} from '@/lib/ai/error-handler';
import type { CallLLMOptions } from '@/lib/ai/router';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobTitle, resumeContent, jdContent } = body;

    if (!jobTitle?.trim()) {
      return NextResponse.json({ success: false, error: '请提供岗位名称' }, { status: 400 });
    }

    // Render prompt
    const { system, user } = renderPrompt('interview-generate', {
      jd_context: jdContent || `岗位：${jobTitle}`,
      resume_context: resumeContent || '',
    });

    const options: CallLLMOptions = {
      taskType: 'interview-generate',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: 0.7,
      maxTokens: 4096,
      jsonMode: true,
    };

    const result = await retryWithBackoff(() => withTimeout(llmRouter.call(options), 30000));

    try {
      const parsed = JSON.parse(result.content);

      // Create session object
      const session = {
        id: crypto.randomUUID(),
        jobTitle,
        status: 'active',
        currentQuestionIndex: 0,
        scores: [],
        radarData: { dimensions: [], scores: [], overallScore: 0 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return NextResponse.json({
        success: true,
        data: {
          questions: parsed.questions,
          scoringCriteria: parsed.scoringCriteria,
          session,
        },
      });
    } catch {
      console.error('Failed to parse interview response');
      throw AIOperationError.INVALID_RESPONSE;
    }
  } catch (error) {
    console.error('Interview generation error:', error);

    if (error instanceof AIOperationError) {
      return NextResponse.json({
        success: true,
        data: JSON.parse(FALLBACK_RESPONSES['interview-generate']),
        fallback: true,
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: '面试问题生成失败，请稍后重试',
        code: 'GENERATION_FAILED',
      },
      { status: 500 }
    );
  }
}
