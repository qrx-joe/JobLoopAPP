import { NextRequest, NextResponse } from 'next/server';
import { renderPrompt } from '@/lib/prompts/registry';
import { llmRouter } from '@/lib/ai/router';
import {
  retryWithBackoff,
  withTimeout,
  AIOperationError,
  FALLBACK_RESPONSES,
} from '@/lib/ai/error-handler';

// Extract JSON from LLM response (handles markdown code blocks, etc.)
function extractJSON(text: string): string {
  // Try direct parse first
  try {
    JSON.parse(text);
    return text;
  } catch {}

  // Try extracting from markdown code block
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    return jsonMatch[1].trim();
  }

  // Try finding JSON object in text
  const braceStart = text.indexOf('{');
  const braceEnd = text.lastIndexOf('}');
  if (braceStart !== -1 && braceEnd !== -1 && braceEnd > braceStart) {
    return text.substring(braceStart, braceEnd + 1);
  }

  return text;
}

export async function POST(request: NextRequest) {
  console.log('[Resume API] Request received');

  try {
    const body = await request.json();

    if (!body.userInput && !body.guidedAnswers) {
      return NextResponse.json({ success: false, error: '请提供经历内容' }, { status: 400 });
    }

    const userInput = body.userInput || Object.values(body.guidedAnswers || {}).join('\n');

    if (!userInput.trim()) {
      return NextResponse.json({ success: false, error: '输入内容为空' }, { status: 400 });
    }

    console.log(`[Resume API] Input length: ${userInput.length} chars`);

    const { system, user } = renderPrompt('resume-generate', {
      user_input: userInput,
      resume_context: '',
    });

    console.log('[Resume API] Calling LLM...');
    const result = await retryWithBackoff(() =>
      withTimeout(
        llmRouter.call({
          taskType: 'resume-generate',
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

    console.log(
      `[Resume API] LLM response received. Content length: ${result.content?.length || 0}`
    );

    // Parse JSON with extraction
    let parsed;
    try {
      const cleanedJSON = extractJSON(result.content);
      parsed = JSON.parse(cleanedJSON);
      console.log('[Resume API] JSON parsed successfully');
    } catch (parseError) {
      console.error('[Resume API] Failed to parse response:', parseError);
      console.error('[Resume API] Raw response:', result.content?.substring(0, 1000));

      // Return raw content as fallback instead of throwing
      return NextResponse.json({
        success: true,
        data: {
          content: {
            experienceItems: [],
            skillTags: [],
            rawSuggestions: `AI返回内容格式异常。原始回复：${result.content?.substring(0, 500)}...`,
          },
          suggestions: ['AI返回格式有误，建议重试'],
        },
        partialResult: true,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        content: parsed,
        suggestions: parsed.rawSuggestions ? [parsed.rawSuggestions] : [],
      },
    });
  } catch (error) {
    console.error('[Resume API] Error:', error);

    if (error instanceof AIOperationError) {
      return NextResponse.json({
        success: true,
        data: {
          content: JSON.parse(FALLBACK_RESPONSES['resume-generate']),
          suggestions: ['AI服务暂时不可用，建议稍后重试'],
        },
        fallback: true,
      });
    }

    const errorMessage = error instanceof Error ? error.message : String(error);

    return NextResponse.json(
      {
        success: false,
        error: `简历生成失败: ${errorMessage}`,
      },
      { status: 500 }
    );
  }
}
