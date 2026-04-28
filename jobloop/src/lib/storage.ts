/**
 * Cross-page data sharing utilities via localStorage.
 * Keys are prefixed to avoid collisions.
 */

const PREFIX = 'jobloop_';

const KEYS = {
  RESUME_DRAFT: `${PREFIX}resume_draft`,
  GENERATED_RESUME: `${PREFIX}generated_resume`,
  JD_INPUT: `${PREFIX}jd_input`,
  INTERVIEW_DATA: `${PREFIX}interview_data`,
} as const;

// --- Generic helpers ---

function safeGet<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeSet(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('[localStorage] Write failed:', e);
  }
}

function safeRemove(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

// --- Resume Draft (user input before generating) ---

export interface ResumeDraft {
  rawInput: string;
  inputMode: 'text' | 'guided' | 'file';
  guidedAnswers: Record<string, string>;
  updatedAt?: number;
}

export function saveResumeDraft(draft: ResumeDraft): void {
  safeSet(KEYS.RESUME_DRAFT, { ...draft, updatedAt: Date.now() });
}

export function getResumeDraft(): ResumeDraft | null {
  return safeGet<ResumeDraft | null>(KEYS.RESUME_DRAFT, null);
}

export function clearResumeDraft(): void {
  safeRemove(KEYS.RESUME_DRAFT);
}

// --- Generated Resume Content ---

export interface GeneratedResume {
  content: string; // JSON stringified
  generatedAt: number;
}

export function saveGeneratedResume(data: GeneratedResume): void {
  safeSet(KEYS.GENERATED_RESUME, { ...data, generatedAt: Date.now() });
}

export function getGeneratedResume(): GeneratedResume | null {
  return safeGet<GeneratedResume | null>(KEYS.GENERATED_RESUME, null);
}

export function clearGeneratedResume(): void {
  safeRemove(KEYS.GENERATED_RESUME);
}

// --- JD Input ---

export function saveJDInput(text: string): void {
  safeSet(KEYS.JD_INPUT, { text, updatedAt: Date.now() });
}

export function getJDInput(): string {
  const data = safeGet<{ text: string } | null>(KEYS.JD_INPUT, null);
  return data?.text || '';
}

// --- Interview Data ---

export function saveInterviewData(data: Record<string, unknown>): void {
  safeSet(KEYS.INTERVIEW_DATA, { ...data, savedAt: Date.now() });
}

export function getInterviewData(): Record<string, unknown> | null {
  return safeGet<Record<string, unknown> | null>(KEYS.INTERVIEW_DATA, null);
}

// --- Clear all ---

export function clearAllData(): void {
  Object.values(KEYS).forEach(safeRemove);
}
