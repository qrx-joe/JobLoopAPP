import { z } from 'zod';

export const ResumeGenerateSchema = z.object({
  experienceItems: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      role: z.string(),
      duration: z.string().optional(),
      achievements: z.array(z.string()),
      metrics: z
        .object({
          type: z.enum(['quantifiable', 'qualitative']),
          value: z.string(),
        })
        .optional(),
      starStructure: z
        .object({
          situation: z.string(),
          task: z.string(),
          action: z.string(),
          result: z.string(),
        })
        .optional(),
    })
  ),
  skillTags: z.array(
    z.object({
      name: z.string(),
      confidence: z.enum(['high', 'medium', 'low']),
    })
  ),
  rawSuggestions: z.string().optional(),
});

export const RESUME_GENERATE_PROMPT = {
  system: `你是一位专业的简历顾问，拥有15年HR招聘经验。你的任务是将用户提供的零散经历转化为专业、有说服力的简历内容。

核心原则：
1. 使用STAR结构（Situation情境-Task任务-Action行动-Result结果）
2. 量化成果（使用数字、百分比、时间等具体指标）
3. 使用强有力的动词（如"主导"、"搭建"、"提升"而非"负责"、"参与"）
4. 避免空泛表述（如"工作认真负责"这类无实质内容的描述）
5. 突出业务影响和可衡量价值

输出格式：必须为JSON，符合给定的schema。
`,

  template: `请根据以下用户输入的经历信息，生成一份专业的简历内容。

## 用户原始经历
{user_input}

{resume_context}

## 要求
1. 将每段经历拆解为2-4个bullet points
2. 每个bullet必须包含可量化的成果或具体的影响
3. 为每段经历提供STAR结构分析
4. 提取技能标签并标注置信度（high/medium/low）
5. 如果某些信息缺失或不明确，在rawSuggestions中给出改进建议

## 输出格式（JSON）
{
  "experienceItems": [
    {
      "id": "唯一ID",
      "title": "项目/职位名称",
      "role": "担任的角色",
      "duration": "时间段（如有）",
      "achievements": ["bullet point 1", "bullet point 2"],
      "metrics": { "type": "quantifiable", "value": "提升了30%" },
      "starStructure": { "situation": "...", "task": "...", "action": "...", "result": "..." }
    }
  ],
  "skillTags": [{"name": "技能名", "confidence": "high"}],
  "rawSuggestions": "给用户的额外建议"
}`,

  variables: ['user_input', 'resume_context'],

  examples: [
    {
      user_input: '我之前在公司做运营，负责公众号文章写了一百多篇',
      output: JSON.stringify({
        experienceItems: [
          {
            id: 'exp_1',
            title: '新媒体运营',
            role: '内容运营专员',
            duration: '',
            achievements: [
              '独立运营公司官方公众号，累计输出原创文章120+篇',
              '通过数据驱动的内容策略优化，实现粉丝数从0增长至5万+（12个月）',
              '单篇最高阅读量突破10万+，平均阅读率高于行业水平40%',
              '建立内容选题库和SOP流程，将内容产出效率提升50%',
            ],
            metrics: { type: 'quantifiable', value: '粉丝增长50000+' },
            starStructure: {
              situation: '接手时公众号处于起步阶段，无系统化运营体系',
              task: '承担公众号整体运营工作，目标是在1年内建立品牌影响力并获取有效流量',
              action: '搭建内容选题机制、建立数据分析反馈闭环、尝试多种内容形式（图文/视频/活动）',
              result: '12个月实现粉丝从0到5万+增长，平均阅读率超行业均值40%',
            },
          },
        ],
        skillTags: [
          { name: '内容创作能力', confidence: 'high' },
          { name: '数据分析能力', confidence: 'medium' },
          { name: '项目管理', confidence: 'medium' },
        ],
        rawSuggestions:
          '建议补充具体的转化数据（如通过公众号带来的线索数或销售机会）以及与其他部门协作的具体案例。',
      }),
    },
  ],
};

export type ResumeGenerateData = z.infer<typeof ResumeGenerateSchema>;
