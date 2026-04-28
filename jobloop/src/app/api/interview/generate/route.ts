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

export async function POST(request: NextRequest) {
  console.log('[Interview API] Request received');

  try {
    const body = await request.json();
    const { jdContent, resumeContent, questionId, userAnswer } = body;

    // If we have a user answer (follow-up scoring mode)
    if (questionId && userAnswer) {
      // For now, return a simple scoring response
      // In a full implementation this would use a follow-up prompt
      const score = Math.floor(Math.random() * 3) + 6; // 6-8 placeholder
      return NextResponse.json({
        success: true,
        data: {
          score,
          feedback: `你的回答结构清晰，建议增加更多量化数据来增强说服力。评分：${score}/10`,
        },
      });
    }

    // Main question generation
    if (!jdContent?.trim()) {
      return NextResponse.json({ success: false, error: '请提供岗位JD内容' }, { status: 400 });
    }

    console.log(
      `[Interview API] JD length: ${jdContent.length}, Resume: ${resumeContent ? resumeContent.length : 0}`
    );

    const { system, user } = renderPrompt('interview-generate', {
      jd_context: jdContent,
      resume_context: resumeContent || '（未提供简历）',
    });

    console.log('[Interview API] Calling LLM for questions...');
    const result = await retryWithBackoff(() =>
      withTimeout(
        llmRouter.call({
          taskType: 'interview-generate',
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ],
          temperature: 0.7,
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
      console.log(`[Interview API] Generated ${parsed.questions?.length || 0} questions`);
    } catch (parseErr) {
      console.error('[Interview API] Parse failed:', parseErr);
      return NextResponse.json({
        success: true,
        data: JSON.parse(FALLBACK_RESPONSES['interview-generate'] || '{}'),
        partialResult: true,
        error: 'AI返回格式异常，建议重试',
      });
    }

    return NextResponse.json({ success: true, data: parsed });
  } catch (error) {
    console.error('[Interview API] Error:', error);

    if (error instanceof AIOperationError) {
      return NextResponse.json({
        success: true,
        data: JSON.parse(FALLBACK_RESPONSES['interview-generate'] || '{}'),
        fallback: true,
      });
    }

    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: `面试生成失败: ${msg}` }, { status: 500 });
  }
}
