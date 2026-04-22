import { NextRequest, NextResponse } from 'next/server';
import mammoth from 'mammoth';

/**
 * Parse uploaded resume files and extract text content.
 * POST /api/resume/parse
 * Body: FormData with 'files' field (multiple files allowed)
 * Response: { success: true, parsedText: string, files: { name, size, chars }[] }
 */
async function extractFileText(buffer: Buffer, fileName: string): Promise<string> {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';

  switch (ext) {
    case 'docx': {
      const result = await mammoth.extractRawText({ buffer });
      console.log(`[Parse API] DOCX "${fileName}": ${result.value.length} chars`);
      return result.value;
    }
    case 'pdf': {
      try {
        const pdfParse = (await import('pdf-parse')).default;
        const data = await pdfParse(buffer);
        console.log(`[Parse API] PDF "${fileName}": ${data.text.length} chars`);
        return data.text;
      } catch (e) {
        console.error(`[Parse API] PDF parse failed for ${fileName}:`, e);
        return `[⚠️ PDF文件解析失败: ${fileName}\n建议将PDF转换为DOCX或TXT格式后重新上传]`;
      }
    }
    case 'doc':
      return `[⚠️ 旧版DOC文件(${fileName})，建议转换为DOCX格式重新上传]\n${buffer.toString('utf-8').slice(0, 5000)}`;
    case 'txt':
    case 'md':
    default:
      return buffer.toString('utf-8');
  }
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { success: false, error: '请使用 FormData 格式上传文件' },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files.length) {
      return NextResponse.json({ success: false, error: '未检测到上传文件' }, { status: 400 });
    }

    // Validate file types and sizes
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    const ALLOWED_EXT = new Set(['pdf', 'doc', 'docx', 'txt', 'md']);

    const fileInfos: { name: string; size: number; chars: number }[] = [];
    let combinedText = '';

    for (const file of files) {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      if (!ALLOWED_EXT.has(ext)) {
        return NextResponse.json(
          { success: false, error: `不支持的文件格式: ${file.name}（仅支持 PDF/DOC/DOCX/TXT/MD）` },
          { status: 400 }
        );
      }
      if (file.size > MAX_SIZE) {
        return NextResponse.json(
          { success: false, error: `文件过大: ${file.name}（限制10MB以内）` },
          { status: 400 }
        );
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const text = await extractFileText(buffer, file.name);

      fileInfos.push({ name: file.name, size: file.size, chars: text.length });
      combinedText += `\n=== 📄 ${file.name} ===\n${text.trim()}\n`;
    }

    console.log(`[Parse API] Parsed ${files.length} file(s), total ${combinedText.length} chars`);

    return NextResponse.json({
      success: true,
      parsedText: combinedText.trim(),
      files: fileInfos,
    });
  } catch (error) {
    console.error('[Parse API] Error:', error);
    const message = error instanceof Error ? error.message : '未知错误';
    return NextResponse.json(
      { success: false, error: `文件解析失败: ${message}` },
      { status: 500 }
    );
  }
}
