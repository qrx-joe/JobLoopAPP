import { z } from 'zod';

// Gap Analysis Schema
export const GapAnalysisSchema = z.object({
  area: z.string(),
  severity: z.enum(['high', 'medium', 'low']),
  suggestion: z.string(),
  isShortTerm: z.boolean(), // 可短期弥补 vs 需长期积累
});

// Optimized Bullet Schema
export const OptimizedBulletSchema = z.object({
  original: z.string(),
  optimized: z.string(),
  reason: z.string(),
});

// JD Match Result Schema
export const JDMatchResultSchema = z.object({
  overallScore: z.number().min(0).max(100),
  dimensionScores: z.object({
    skills: z.number().min(0).max(100),
    experience: z.number().min(0).max(100),
    expression: z.number().min(0).max(100),
  }),
  gaps: z.array(GapAnalysisSchema),
  optimizedBullets: z.array(OptimizedBulletSchema),
  keywordTrends: z.array(z.string()),
});

// JD Types
export interface JobDescription {
  id: string;
  userId?: string;
  companyName?: string;
  jobTitle: string;
  sourceUrl?: string;
  content: string;
  parsedContent?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface JDMatch {
  id: string;
  userId?: string;
  resumeId: string;
  jdId: string;
  result: JDMatchResult;
  overallScore: number;
  createdAt: string;
}

// Type exports
export type GapAnalysis = z.infer<typeof GapAnalysisSchema>;
export type OptimizedBullet = z.infer<typeof OptimizedBulletSchema>;
export type JDMatchResult = z.infer<typeof JDMatchResultSchema>;
