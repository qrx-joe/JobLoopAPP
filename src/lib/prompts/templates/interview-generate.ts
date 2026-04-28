import { z } from 'zod';

export const InterviewQuestionSchema = z.object({
  id: z.string(),
  type: z.enum(['behavioral', 'technical', 'pressure', 'scenario', 'open']),
  category: z.string(),
  text: z.string(),
  followUpStrategy: z.object({
    depth: z.string(), // 深度追问
    challenge: z.string(), // 质疑挑战
    scenario: z.string(), // 场景变更
  }),
  idealAnswerElements: z.array(z.string()),
});

export const ScoringCriteriaSchema = z.object({
  dimensions: z.array(z.string()),
  scoreRange: z.tuple([z.number(), z.number()]),
  feedbackTemplate: z.string(),
});

export const InterviewGenerationResponseSchema = z.object({
  questions: z.array(InterviewQuestionSchema),
  scoringCriteria: ScoringCriteriaSchema,
});

export const INTERVIEW_GENERATE_PROMPT = {
  system: `你是一位资深的企业面试官，拥有20年面试经验。你需要为特定岗位生成高质量的面试问题。

问题设计原则：
1. 覆盖不同类型：行为面试题（STAR）、技术/业务理解题、压力面试题、情景模拟题、开放性问题
2. 问题要有针对性（基于JD的核心要求和常见面试场景）
3. 追问机制是关键差异化点 - 要设计好三个维度的追问（深度/质疑/场景变更）
4. 每个问题都要标注理想回答要素，便于后续AI评分`,

  template: `请为以下岗位生成一套完整的面试问题。

## 岗位信息
{jd_context}

## 候选人简历（可选，用于定制化问题）
{resume_context}

## 要求

生成8-12个面试问题，包含以下类型分布：
- 行为面试题（STAR类）：3-4个（重点考察过往经历的深度）
- 技术/业务理解题：2-3个（考察专业能力和行业认知）
- 压力面试题：1-2个（考察抗压能力和应变能力）
- 情景模拟题：1-2个（考察解决问题的思路）
- 开放性结尾题：1个（"你有什么想问我们的吗？"）

每个问题需包含：
- 三维追问策略
- 理想回答要素清单

## 输出格式（JSON）
{
  "questions": [
    {
      "id": "q1",
      "type": "behavioral",
      "category": "STAR",
      "text": "请介绍一个你克服困难的经历",
      "followUpStrategy": {
        "depth": "能详细说说当时的具体情况吗？",
        "challenge": "如果当时时间更紧，你会怎么做？",
        "scenario": "换一个团队环境，你的做法会有什么变化？"
      },
      "idealAnswerElements": ["具体情境", "个人行动", "可量化结果"]
    }
  ],
  "scoringCriteria": {
    "dimensions": ["完整性", "具体性", "逻辑性", "表达力"],
    "scoreRange": [1, 10],
    "feedbackTemplate": "优点：{positives}；改进建议：{suggestions}"
  }
}`,

  variables: ['jd_context', 'resume_context'],
  examples: [],
};

export interface InterviewGenerationData {
  questions: z.infer<typeof InterviewQuestionSchema>[];
  scoringCriteria: z.infer<typeof ScoringCriteriaSchema>;
}
