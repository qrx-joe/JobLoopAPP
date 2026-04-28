import { z } from 'zod'

export const JDMatchResultSchema = z.object({
  overallScore: z.number().min(0).max(100),
  dimensionScores: z.object({
    skills: z.number().min(0).max(100),
    experience: z.number().min(0).max(100),
    expression: z.number().min(0).max(100),
  }),
  gaps: z.array(z.object({
    area: z.string(),
    severity: z.enum(['high', 'medium', 'low']),
    suggestion: z.string(),
    isShortTerm: z.boolean(),
  })),
  optimizedBullets: z.array(z.object({
    original: z.string(),
    optimized: z.string(),
    reason: z.string(),
  })),
  keywordTrends: z.array(z.string()),
})

export const JD_MATCH_PROMPT = {
  system: `你是一位资深的求职顾问和简历优化专家，同时具备HR视角。你的任务是：
1. 分析岗位JD与候选人简历的匹配程度
2. 找出差距并提供针对性的优化建议
3. 重写简历bullet points以更好匹配JD要求

分析原则：
- 匹配度评分要客观公正（不要虚高也不要刻意压低）
- 优化建议要具体可执行（不要说"加强xx能力"，而要说"可以增加xx项目的描述"）
- 重写的bullet要保留真实性（不能编造不存在的工作经历）
- 标注每个修改的原因（让用户理解为什么这样改）`,

  template: `请分析以下岗位JD与候选人简历的匹配度。

## 岗位JD
{jd_context}

## 候选人简历
{resume_context}

## 分析要求

### 1. 整体匹配度评估
- 总分（0-100）
- 三维分数：技能匹配 / 经验匹配 / 表达匹配

### 2. 差距分析
找出简历与JD的缺口，按严重程度分类：
- 高：直接影响面试资格的硬性条件缺失
- 中：建议弥补但非致命的软性条件不足
- 低：锦上添花的加分项

### 3. 简历优化方案
选择最关键的3-5个bullet进行重写，展示：
- 原始版本
- 优化后版本
- 修改原因

### 4. 关键词趋势
提取JD中高频出现的关键词（前10个），帮助用户理解岗位重点

## 输出格式（JSON）
{
  "overallScore": 78,
  "dimensionScores": {"skills": 85, "experience": 72, "expression": 75},
  "gaps": [
    {
      "area": "数据分析能力",
      "severity": "medium",
      "suggestion": "建议增加SQL/Python数据处理相关的项目经验描述",
      "isShortTerm": true
    }
  ],
  "optimizedBullets": [
    {
      "original": "负责数据分析工作",
      "optimized": "主导数据分析流程搭建，通过SQL/Python处理日均10万行数据，产出分析报告支撑运营决策",
      "reason": "增加了工具技能、量化规模、强调业务影响"
    }
  ],
  "keywordTrends": ["数据分析", "SQL", "沟通协调"]
}`,

  variables: ['jd_context', 'resume_context'],

  examples: [],
}

export type JDMatchData = z.infer<typeof JDMatchResultSchema>
