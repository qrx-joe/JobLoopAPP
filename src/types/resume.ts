import { z } from 'zod';

// Experience Item Schema
export const ExperienceItemSchema = z.object({
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
});

// Skill Tag Schema
export const SkillTagSchema = z.object({
  name: z.string(),
  confidence: z.enum(['high', 'medium', 'low']),
});

// Resume Content Schema
export const ResumeContentSchema = z.object({
  personalInfo: z
    .object({
      name: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().email().optional(),
      location: z.string().optional(),
    })
    .optional(),
  summary: z.string().optional(),
  experienceItems: z.array(ExperienceItemSchema),
  skillTags: z.array(SkillTagSchema),
  rawSuggestions: z.string().optional(),
});

// Resume Types
export interface Resume {
  id: string;
  userId?: string;
  title: string;
  type: 'general' | 'campus' | 'professional';
  content: ResumeContent;
  originalInput?: string;
  inputMode: 'text' | 'guided' | 'file' | 'template';
  version: number;
  isLatest: boolean;
  createdAt: string;
  updatedAt: string;
}

// Resume Generation Request
export interface ResumeGenerateRequest {
  userInput: string;
  inputMode: 'text' | 'guided' | 'file' | 'template';
  guidedAnswers?: Record<string, string>;
  fileContent?: string;
  templateData?: Partial<ResumeContent>;
}

// Resume Generation Response
export interface ResumeGenerateResponse {
  content: ResumeContent;
  suggestions: string[];
}

// Type exports
export type ExperienceItem = z.infer<typeof ExperienceItemSchema>;
export type SkillTag = z.infer<typeof SkillTagSchema>;
export type ResumeContent = z.infer<typeof ResumeContentSchema>;
