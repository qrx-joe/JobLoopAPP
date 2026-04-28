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

    const { jdContent, resumeContent, companyName, jobTitle } = body;

    if (!jdContent?.trim()) {
      return NextResponse.json({ success: false, error: '请提供岗位JD内容' }, { status: 400 });
    }

    // Render prompt
    const { system, user } = renderPrompt('jd-match', {
      jd_context: jdContent,
      resume_context: resumeContent || '',
    });

    const options: CallLLMOptions = {
      taskType: 'jd-match',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: 0.5,
      maxTokens: 4096,
      jsonMode: true,
    };

    const result = await retryWithBackoff(() => withTimeout(llmRouter.call(options), 30000));

    try {
      const parsed = JSON.parse(result.content);

      return NextResponse.json({
        success: true,
        data: parsed,
      });
    } catch {
      console.error('Failed to parse JD match response');
      throw AIOperationError.INVALID_RESPONSE;
    }
  } catch (error) {
    console.error('JD match error:', error);

    const fallbackData = FALLBACK_RESPONSES['jd-match'];

    if (error instanceof AIOperationError) {
      return NextResponse.json({
        success: true,
        data: JSON.parse(fallbackData),
        fallback: true,
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: 'JD匹配分析失败，请稍后重试',
        code: 'MATCH_FAILED',
      },
      { status: 500 }
    );
  }
}
