import { z } from 'zod';

// User Schema
export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  nickname: z.string().optional(),
  avatarUrl: z.string().url().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  lastLoginAt: z.string().optional(),
});

// User Quotas Schema
export const UserQuotasSchema = z.object({
  jdAnalysisCount: z.number(),
  interviewSessionsCount: z.number(),
  fileParseCount: z.number(),
  pdfExportCount: z.number(),
  quotaResetAt: z.string(),
});

// User with Quotas
export const UserWithQuotasSchema = UserSchema.extend({
  quotas: UserQuotasSchema,
});

// Auth State
export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// Type exports
export type User = z.infer<typeof UserSchema>;
export type UserQuotas = z.infer<typeof UserQuotasSchema>;
export type UserWithQuotas = z.infer<typeof UserWithQuotasSchema>;
