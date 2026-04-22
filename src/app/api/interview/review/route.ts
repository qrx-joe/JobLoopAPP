import { NextRequest, NextResponse } from 'next/server';
import { renderPrompt } from '@/lib/prompts/registry';
import { llmRouter } from '@/lib/ai/router';
import {
  retryWithBackoff,
  withTimeout,
  AIOperationError,
  FALLBACK_RESPONSES,
} from '@/lib/ai/error-handler';

function extractJSON(text: string): string {
  try {
    JSON.parse(text);
    return text;
  } catch {}

  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) return jsonMatch[1].trim();

  const braceStart = text.indexOf('{');
  const braceEnd = text.lastIndexOf('}');
  if (braceStart !== -1 && braceEnd !== -1 && braceEnd > braceStart) {
    return text.substring(braceStart, braceEnd + 1);
  }
  return text;
}

/**
 * POST /api/interview/review
 * Body: { company, position, questions[], userAnswers? }
 */
export async function POST(request: NextRequest) {
  console.log('[Interview Review API] Request received');

  try {
    const body = await request.json();
    const { company, position, resumeContent = '', questions = [], userAnswers = [] } = body;

    if (!questions.length || !company || !position) {
      return NextResponse.json(
        { success: false, error: '请至少提供公司名、岗位和回忆的面试问题' },
        { status: 400 }
      );
    }

    // Build context for the prompt
    const questionText = questions
      .map((q: string | { question?: string; answer?: string; type?: string }, i: number) => {
        const qText = typeof q === 'string' ? q : q.question || '';
        const aText = userAnswers[i] || (typeof q === 'object' ? q.answer || '' : '');
        return `Q${i + 1}: ${qText}${aText ? `\nA${i + 1}: ${aText}` : ''}`;
      })
      .join('\n\n');

    const userInput = [
      `面试公司: ${company}`,
      `目标岗位: ${position}`,
      resumeContent ? `我的简历:\n${resumeContent}` : '',
      `\n=== 面试中遇到的问题 ===\n${questionText}`,
    ]
      .filter(Boolean)
      .join('\n\n');

    console.log(
      `[Interview Review API] Reviewing ${questions.length} questions for ${company} - ${position}`
    );

    // Render prompt and call LLM
    const { system, user } = renderPrompt('interview-review', { userInput });

    const result = await retryWithBackoff(() =>
      withTimeout(
        llmRouter.call({
          taskType: 'interview-generate',
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ],
          temperature: 0.5,
          maxTokens: 4096,
          jsonMode: true,
        }),
        90000
      )
    );

    let parsed;
    try {
      const cleaned = extractJSON(result.content);
      parsed = JSON.parse(cleaned);
      console.log(`[Interview Review API] Parsed result`);
    } catch (parseErr) {
      console.error('[Interview Review API] Parse failed:', parseErr);
      return NextResponse.json({
        success: true,
        data: { summary: 'AI返回格式异常，建议重试' },
        partialResult: true,
        error: 'AI返回格式异常，建议重试',
      });
    }

    return NextResponse.json({
      success: true,
      data: parsed,
      meta: { company, position, questionCount: questions.length },
    });
  } catch (error) {
    console.error('[Interview Review API] Error:', error);

    if (error instanceof AIOperationError) {
      return NextResponse.json({
        success: true,
        data: JSON.parse(FALLBACK_RESPONSES['interview-review'] || '{}'),
        fallback: true,
        error: 'AI服务暂时不可用，建议稍后重试',
      });
    }

    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: `复盘分析失败: ${msg}` }, { status: 500 });
  }
}
