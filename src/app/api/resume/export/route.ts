import { NextRequest, NextResponse } from 'next/server';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType,
  ShadingType,
} from 'docx';

interface ExportRequest {
  content: {
    personalInfo?: {
      name?: string;
      phone?: string;
      email?: string;
      location?: string;
    };
    summary?: string;
    experienceItems: Array<{
      id: string;
      title: string;
      role: string;
      duration?: string;
      achievements: string[];
      starStructure?: {
        situation: string;
        task: string;
        action: string;
        result: string;
      };
    }>;
    skillTags: Array<{
      name: string;
      confidence: 'high' | 'medium' | 'low';
    }>;
    rawSuggestions?: string;
  };
  format?: 'docx' | 'pdf';
}

/**
 * Generate a formatted Word document from resume data
 */
async function generateDocx(data: ExportRequest['content']): Promise<Buffer> {
  const { personalInfo, summary, experienceItems, skillTags } = data;

  const children = [];

  // === Header / Name ===
  if (personalInfo?.name) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: personalInfo.name,
            bold: true,
            size: 48,
            font: 'Arial',
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 },
      })
    );
  }

  // === Contact Info Line ===
  const contactParts: string[] = [];
  if (personalInfo?.phone) contactParts.push(`📱 ${personalInfo.phone}`);
  if (personalInfo?.email) contactParts.push(`✉️ ${personalInfo.email}`);
  if (personalInfo?.location) contactParts.push(`📍 ${personalInfo.location}`);

  if (contactParts.length > 0) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: contactParts.join('   |   '),
            size: 20,
            color: '666666',
            font: 'Arial',
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'CCCCCC' } },
      })
    );
  }

  // === Professional Summary ===
  if (summary) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: '个人简介',
            bold: true,
            size: 26,
            color: '2B579A',
            font: 'Arial',
          }),
        ],
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 100 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: '2B579A' } },
      })
    );
    children.push(
      new Paragraph({
        children: [new TextRun({ text: summary, size: 22, font: 'Arial' })],
        spacing: { after: 200 },
      })
    );
  }

  // === Work Experience ===
  if (experienceItems && experienceItems.length > 0) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: '工作/项目经历',
            bold: true,
            size: 26,
            color: '2B579A',
            font: 'Arial',
          }),
        ],
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 150 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: '2B579A' } },
      })
    );

    for (const exp of experienceItems) {
      // Experience header (title + role + duration)
      const headerParts = [
        new TextRun({ text: exp.title || '', bold: true, size: 24, font: 'Arial' }),
      ];
      if (exp.role) {
        headerParts.push(
          new TextRun({ text: `  |  ${exp.role}`, size: 22, color: '555555', font: 'Arial' })
        );
      }
      if (exp.duration) {
        headerParts.push(
          new TextRun({ text: `  (${exp.duration})`, size: 20, color: '888888', font: 'Arial' })
        );
      }

      children.push(
        new Paragraph({
          children: headerParts,
          spacing: { before: 200, after: 80 },
        })
      );

      // Achievements as bullet points
      if (exp.achievements && exp.achievements.length > 0) {
        for (const achievement of exp.achievements) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({ text: '•  ', size: 22, font: 'Arial' }),
                new TextRun({ text: achievement, size: 22, font: 'Arial' }),
              ],
              spacing: { after: 40 },
              indent: { left: 360 },
            })
          );
        }
      }

      // STAR structure if available
      if (exp.starStructure) {
        const starLabels = ['情境(S):', '任务(T):', '行动(A):', '结果(R):'];
        const starValues = [
          exp.starStructure.situation,
          exp.starStructure.task,
          exp.starStructure.action,
          exp.starStructure.result,
        ];

        for (let i = 0; i < 4; i++) {
          if (starValues[i]) {
            children.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: starLabels[i],
                    bold: true,
                    size: 20,
                    color: '2B579A',
                    font: 'Arial',
                  }),
                  new TextRun({
                    text: ` ${starValues[i]}`,
                    size: 20,
                    color: '444444',
                    font: 'Arial',
                  }),
                ],
                indent: { left: 480 },
                spacing: { after: 20 },
              })
            );
          }
        }
      }
    }
  }

  // === Skills ===
  if (skillTags && skillTags.length > 0) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: '专业技能',
            bold: true,
            size: 26,
            color: '2B579A',
            font: 'Arial',
          }),
        ],
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 150 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: '2B579A' } },
      })
    );

    // Group skills by confidence level
    const highSkills = skillTags.filter((s) => s.confidence === 'high').map((s) => s.name);
    const mediumSkills = skillTags.filter((s) => s.confidence === 'medium').map((s) => s.name);
    const lowSkills = skillTags.filter((s) => s.confidence === 'low').map((s) => s.name);

    if (highSkills.length > 0) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: '精通：', bold: true, size: 22, font: 'Arial' }),
            new TextRun({ text: highSkills.join('、'), size: 22, font: 'Arial' }),
          ],
          spacing: { after: 60 },
        })
      );
    }

    if (mediumSkills.length > 0) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: '熟练：', bold: true, size: 22, font: 'Arial' }),
            new TextRun({ text: mediumSkills.join('、'), size: 22, font: 'Arial' }),
          ],
          spacing: { after: 60 },
        })
      );
    }

    if (lowSkills.length > 0) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: '了解：', bold: true, size: 22, font: 'Arial' }),
            new TextRun({ text: lowSkills.join('、'), size: 22, font: 'Arial' }),
          ],
          spacing: { after: 60 },
        })
      );
    }

    // If no confidence grouping, just list them all
    if (highSkills.length === 0 && mediumSkills.length === 0 && lowSkills.length === 0) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: skillTags.map((s) => s.name).join('、'), size: 22, font: 'Arial' }),
          ],
          spacing: { after: 60 },
        })
      );
    }
  }

  // === Suggestions (if present) ===
  const rawSuggs = data.rawSuggestions;
  if (rawSuggs) {
    const suggestionsText = Array.isArray(rawSuggs) ? rawSuggs.join('\n') : String(rawSuggs);

    if (suggestionsText.trim()) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'AI 优化建议',
              bold: true,
              size: 26,
              color: '2B579A',
              font: 'Arial',
            }),
          ],
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 100 },
          border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: '2B579A' } },
        })
      );
      children.push(
        new Paragraph({
          children: [new TextRun({ text: suggestionsText, size: 21, font: 'Arial' })],
          spacing: { after: 200 },
        })
      );
    }
  }

  // === Fallback: Dump any remaining content as plain text ===
  // This handles cases where AI returns non-standard field structures
  const knownKeys = new Set([
    'personalInfo',
    'summary',
    'experienceItems',
    'skillTags',
    'rawSuggestions',
  ]);
  const extraKeys = Object.keys(data).filter(
    (k) => !knownKeys.has(k) && (data as Record<string, unknown>)[k]
  );

  for (const key of extraKeys) {
    const value = (data as Record<string, unknown>)[key];
    let textContent = '';

    if (typeof value === 'string') {
      textContent = value.trim();
    } else if (Array.isArray(value)) {
      // Try to extract meaningful text from arrays
      const items = value
        .map((item) => {
          if (typeof item === 'string') return item;
          if (typeof item === 'object' && item !== null) {
            // Extract from objects like {title, role, achievements, ...}
            const parts = [];
            if (item.title) parts.push(item.title);
            if (item.role) parts.push(item.role);
            if (item.duration) parts.push(`(${item.duration})`);
            if (Array.isArray(item.achievements)) {
              parts.push(...item.achievements.map((a: string) => `• ${a}`));
            }
            if (item.starStructure) {
              const s = item.starStructure;
              if (s.situation) parts.push(`情境: ${s.situation}`);
              if (s.task) parts.push(`任务: ${s.task}`);
              if (s.action) parts.push(`行动: ${s.action}`);
              if (s.result) parts.push(`结果: ${s.result}`);
            }
            return parts.length > 0 ? parts.join(' ') : JSON.stringify(item);
          }
          return '';
        })
        .filter(Boolean);
      textContent = items.join('\n\n');
    } else if (typeof value === 'object' && value !== null) {
      textContent = JSON.stringify(value, null, 2);
    }

    if (textContent && textContent.length > 5) {
      const labelMap: Record<string, string> = {
        experienceItems: '详细经历',
        educationItems: '教育背景',
        projectItems: '项目经历',
        content: '简历内容',
      };
      const label = labelMap[key] || key;

      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: label,
              bold: true,
              size: 26,
              color: '2B579A',
              font: 'Arial',
            }),
          ],
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 100 },
          border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: '2B579A' } },
        })
      );

      // Split long text into paragraphs
      const paragraphs = textContent.split('\n').filter((p) => p.trim());
      for (const para of paragraphs) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: para, size: 21, font: 'Arial' })],
            spacing: { after: 60 },
          })
        );
      }
    }
  }

  // Build document
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 720, // ~1 inch in twips (1/20 of a point)
              right: 720,
              bottom: 720,
              left: 720,
            },
          },
        },
        children,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return buffer;
}

export async function POST(request: NextRequest) {
  try {
    const body: ExportRequest = await request.json();

    // Validate: accept any non-empty content (experienceItems, summary, or rawSuggestions)
    const hasContent =
      (body.content.experienceItems && body.content.experienceItems.length > 0) ||
      (body.content.summary && body.content.summary.trim().length > 0) ||
      (body.content.rawSuggestions && body.content.rawSuggestions.trim().length > 0) ||
      (body.content.skillTags && body.content.skillTags.length > 0) ||
      Object.keys(body.content).some((key) => {
        const v = (body.content as Record<string, unknown>)[key];
        return typeof v === 'string' && v.trim().length > 10;
      });

    if (!hasContent) {
      return NextResponse.json({ success: false, error: '没有可导出的简历内容' }, { status: 400 });
    }

    console.log('[Export API] Generating document...');

    const format = body.format || 'docx';

    if (format === 'pdf') {
      // PDF export not yet supported, fallback to docx
      console.log('[Export API] PDF requested, generating DOCX instead');
    }

    const buffer = await generateDocx(body.content);

    const filename = body.content.personalInfo?.name
      ? `${body.content.personalInfo.name}_简历.docx`
      : `JobLoop_简历_${new Date().toISOString().slice(0, 10)}.docx`;

    console.log(`[Export API] Generated ${buffer.length} bytes`);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
        'Content-Length': String(buffer.length),
      },
    });
  } catch (error) {
    console.error('[Export API] Error:', error);

    const errorMessage = error instanceof Error ? error.message : '导出失败';
    return NextResponse.json(
      { success: false, error: `文档导出失败: ${errorMessage}` },
      { status: 500 }
    );
  }
}
