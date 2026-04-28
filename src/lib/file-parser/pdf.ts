/**
 * PDF File Parser
 * Extracts text from PDF files using pdf-parse
 */

interface ParseResult {
  text: string;
  pages: number;
  success: boolean;
  error?: string;
}

export async function parsePDF(file: Buffer | ArrayBuffer): Promise<ParseResult> {
  try {
    // Dynamic import for server-side only
    const pdfParse = (await import('pdf-parse')).default;

    const buffer = file instanceof ArrayBuffer ? Buffer.from(file) : file;
    const data = await pdfParse(buffer);

    return {
      text: data.text || '',
      pages: data.numpages || 0,
      success: true,
    };
  } catch (error) {
    console.error('PDF parsing error:', error);
    return {
      text: '',
      pages: 0,
      success: false,
      error: error instanceof Error ? error.message : 'PDF解析失败',
    };
  }
}
