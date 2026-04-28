/**
 * DOCX/Word File Parser
 * Extracts text from Word documents using mammoth
 */

interface ParseResult {
  text: string;
  success: boolean;
  error?: string;
}

export async function parseDocx(file: Buffer | ArrayBuffer): Promise<ParseResult> {
  try {
    const mammoth = await import('mammoth');

    const buffer = file instanceof ArrayBuffer ? Buffer.from(file) : file;
    const result = await mammoth.extractRawText({ buffer });

    return {
      text: result.value || '',
      success: true,
      // Include warnings if any
      ...(result.messages?.length > 0 && {
        error: `Warnings: ${result.messages.map((m) => m.message).join(', ')}`,
      }),
    };
  } catch (error) {
    console.error('DOCX parsing error:', error);
    return {
      text: '',
      success: false,
      error: error instanceof Error ? error.message : 'Word文档解析失败',
    };
  }
}

// Unified file parser that auto-detects type
export async function parseFile(
  file: Buffer | ArrayBuffer,
  filename: string
): Promise<ParseResult> {
  const ext = filename.toLowerCase().split('.').pop();

  switch (ext) {
    case 'pdf':
      return (await import('./pdf')).parsePDF(file);
    case 'docx':
    case 'doc':
      return parseDocx(file);
    case 'txt':
      // Plain text - just decode as string
      const decoder = new TextDecoder();
      return {
        text: file instanceof ArrayBuffer ? decoder.decode(file) : file.toString(),
        success: true,
      };
    default:
      return {
        text: '',
        success: false,
        error: `不支持的文件格式: .${ext}，请使用 PDF、DOCX 或 TXT 格式`,
      };
  }
}
