import { NextRequest, NextResponse } from 'next/server';
import { renderPrompt } from '@/lib/prompts/registry';
import { llmRouter } from '@/lib/ai/router';
import {
  retryWithBackoff,
  withTimeout,
  AIOperationError,
  FALLBACK_RESPONSES,
} from '@/lib/ai/error-handler';
import mammoth from 'mammoth';

// Extract text content from uploaded files
async function extractFileText(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const name = file.name;

  switch (ext) {
    case 'docx': {
      const result = await mammoth.extractRawText({ buffer });
      console.log(`[FileParser] DOCX "${name}": ${result.value.length} chars extracted`);
      return result.value;
    }
    case 'pdf':
      // PDF requires async import (native module)
      try {
        const pdfParse = (await import('pdf-parse')).default;
        const data = await pdfParse(buffer);
        console.log(`[FileParser] PDF "${name}": ${data.text.length} chars extracted`);
        return data.text;
      } catch (e) {
        console.error(`[FileParser] PDF parse failed for ${name}:`, e);
        return `[PDF文件解析失败: ${name}]`;
      }
    case 'doc':
      // Old .doc format - try UTF-8 fallback (limited support)
      console.log(`[FileParser] .DOC format limited, trying text extraction: ${name}`);
      return `[旧版DOC文件(${name})，建议转换为DOCX格式重新上传]\n${buffer.toString('utf-8').slice(0, 5000)}`;
    case 'txt':
    case 'md':
    default:
      console.log(`[FileParser] Text file "${name}": ${buffer.length} bytes`);
      return buffer.toString('utf-8');
  }
}

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
    // Support both JSON and FormData (file upload)
    let userInput = '';
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      // File upload mode (may also include supplemental text)
      const formData = await request.formData();
      const files = formData.getAll('files') as File[];
      const extraText = (formData.get('userInput') as string) || '';
      console.log(
        `[Resume API] Received ${files.length} file(s), extra text: ${extraText.length} chars`
      );

      // Extract file contents
      for (const file of files) {
        const text = await extractFileText(file);
        userInput += `\n=== ${file.name} ===\n${text}\n`;
      }

      // Append user's supplemental text input
      if (extraText.trim()) {
        userInput += `\n=== 用户补充信息 ===\n${extraText.trim()}\n`;
      }

      if (!userInput.trim()) {
        return NextResponse.json(
          { success: false, error: '请上传文件或输入内容' },
          { status: 400 }
        );
      }
    } else {
      // JSON mode (text input / guided)
      const body = await request.json();

      if (!body.userInput && !body.guidedAnswers) {
        return NextResponse.json({ success: false, error: '请提供经历内容' }, { status: 400 });
      }

      userInput = body.userInput || Object.values(body.guidedAnswers || {}).join('\n');
    }

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
