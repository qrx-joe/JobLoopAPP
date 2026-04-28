import { z } from 'zod'

// Follow-up Strategy Schema
export const FollowUpStrategySchema = z.object({
  depth: z.string(),
  challenge: z.string(),
  scenario: z.string(),
})

// Question Schema
export const QuestionSchema = z.object({
  id: z.string(),
  type: z.enum(['behavioral', 'technical', 'pressure', 'scenario', 'open']),
  category: z.string(),
  text: z.string(),
  followUpStrategy: FollowUpStrategySchema,
  idealAnswerElements: z.array(z.string()),
})

// Scoring Criteria Schema
export const ScoringCriteriaSchema = z.object({
  dimensions: z.array(z.string()),
  scoreRange: z.tuple([z.number(), z.number()]),
  feedbackTemplate: z.string(),
})

// Interview Generation Response Schema
export const InterviewGenerationResponseSchema = z.object({
  questions: z.array(QuestionSchema),
  scoringCriteria: ScoringCriteriaSchema,
})

// Score Schema
export const ScoreSchema = z.object({
  questionId: z.string(),
  totalScore: z.number().min(1).max(10),
  dimensionScores: z.record(z.string(), z.number()),
  positives: z.string(),
  suggestions: z.string(),
  timestamp: z.string(),
})

// Radar Data Schema
export const RadarDataSchema = z.object({
  dimensions: z.array(z.string()),
  scores: z.array(z.number()),
  overallScore: z.number(),
})

// Interview Session Types
export interface InterviewSession {
  id: string
  userId?: string
  resumeId?: string
  jdId?: string
  jobTitle: string
  status: 'active' | 'completed' | 'abandoned'
  currentQuestionIndex: number
  scores: Score[]
  radarData: RadarData
  createdAt: string
  updatedAt: string
  endedAt?: string
}

// Interview Message Types
export interface InterviewMessage {
  id: string
  sessionId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  metadata: {
    questionId?: string
    score?: Score
    followUpType?: 'depth' | 'challenge' | 'scenario'
  }
  createdAt: string
}

// Type exports
export type FollowUpStrategy = z.infer<typeof FollowUpStrategySchema>
export type Question = z.infer<typeof QuestionSchema>
export type ScoringCriteria = z.infer<typeof ScoringCriteriaSchema>
export type Score = z.infer<typeof ScoreSchema>
export type RadarData = z.infer<typeof RadarDataSchema>
