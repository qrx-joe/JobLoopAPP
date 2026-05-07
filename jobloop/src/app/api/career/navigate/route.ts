import { NextRequest, NextResponse } from 'next/server';
import { renderPrompt } from '@/lib/prompts/registry';
import { llmRouter } from '@/lib/ai/router';
import { TASK_TYPES } from '@/lib/constants';
import { retryWithBackoff, withTimeout } from '@/lib/ai/error-handler';
import { CareerNavigateSchema } from '@/lib/prompts/templates/career-navigate';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_input, target_cities, interests } = body;

    if (!user_input || typeof user_input !== 'string' || user_input.trim().length < 50) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'INVALID_INPUT', message: '请输入至少50字的个人经历描述' },
        },
        { status: 400 }
      );
    }

    const { system, user } = renderPrompt('career-navigate', {
      user_input: user_input.trim(),
      target_cities: target_cities || '不限',
      interests: interests || '不限',
    });

    const result = await retryWithBackoff(() =>
      withTimeout(
        llmRouter.call({
          taskType: TASK_TYPES.CAREER_NAVIGATE,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ],
          temperature: 0.6,
          maxTokens: 6000,
          jsonMode: true,
        }),
        120000
      )
    );

    let parsed: Record<string, unknown>;
    try {
      const content = result.content;
      const jsonStr = extractJSON(content);
      parsed = JSON.parse(jsonStr);
      CareerNavigateSchema.parse(parsed);
    } catch (parseError) {
      console.warn('[CareerNavigate] JSON parse/validation failed:', parseError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'AI_OUTPUT_ERROR',
            message: 'AI 输出格式异常，请重试',
            details: parseError instanceof Error ? parseError.message : String(parseError),
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...parsed,
        provider: result.provider,
        model: result.model,
      },
    });
  } catch (error) {
    console.error('[CareerNavigate] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : '服务器错误',
        },
      },
      { status: 500 }
    );
  }
}

function extractJSON(text: string): string {
  const mdMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (mdMatch) return mdMatch[1].trim();

  const braceStart = text.indexOf('{');
  const braceEnd = text.lastIndexOf('}');
  if (braceStart !== -1 && braceEnd > braceStart) {
    return text.slice(braceStart, braceEnd + 1);
  }

  return text;
}
