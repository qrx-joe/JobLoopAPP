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
  console.log('[JD Match API] Request received');

  try {
    const body = await request.json();
    const { jdContent, resumeContent } = body;

    if (!jdContent?.trim()) {
      return NextResponse.json({ success: false, error: '请提供岗位JD内容' }, { status: 400 });
    }
    if (!resumeContent?.trim()) {
      return NextResponse.json({ success: false, error: '请提供简历内容' }, { status: 400 });
    }

    console.log(
      `[JD Match API] JD length: ${jdContent.length}, Resume length: ${resumeContent.length}`
    );

    const { system, user } = renderPrompt('jd-match', {
      jd_context: jdContent,
      resume_context: resumeContent,
    });

    console.log('[JD Match API] Calling LLM...');
    const result = await retryWithBackoff(() =>
      withTimeout(
        llmRouter.call({
          taskType: 'jd-match',
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
      console.log(`[JD Match API] Parsed result, overallScore: ${parsed.overallScore}`);
    } catch (parseErr) {
      console.error('[JD Match API] Parse failed:', parseErr);
      return NextResponse.json({
        success: true,
        data: {
          overallScore: 0,
          dimensionScores: { skills: 0, experience: 0, expression: 0 },
          gaps: [],
          optimizedBullets: [],
          keywordTrends: [],
        },
        partialResult: true,
        error: 'AI返回格式异常，建议重试',
      });
    }

    return NextResponse.json({
      success: true,
      data: parsed,
    });
  } catch (error) {
    console.error('[JD Match API] Error:', error);

    if (error instanceof AIOperationError) {
      return NextResponse.json({
        success: true,
        data: JSON.parse(FALLBACK_RESPONSES['jd-match'] || '{}'),
        fallback: true,
        error: 'AI服务暂时不可用，建议稍后重试',
      });
    }

    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: `JD分析失败: ${msg}` }, { status: 500 });
  }
}
