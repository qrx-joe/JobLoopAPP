import { create } from 'zustand';
import type { ResumeContent, ExperienceItem, SkillTag } from '@/types/resume';
import { saveResumeDraft, loadResumeDraft, removeResumeDraft } from '@/lib/storage/local';

interface ResumeState {
  // Current resume content
  content: ResumeContent | null;
  isGenerating: boolean;
  error: string | null;

  // Input state
  inputMode: 'text' | 'guided' | 'file' | 'template';
  rawInput: string;
  guidedAnswers: Record<string, string>;

  // Actions
  setContent: (content: ResumeContent) => void;
  setInputMode: (mode: ResumeState['inputMode']) => void;
  setRawInput: (input: string) => void;
  setGuidedAnswers: (answers: Record<string, string>) => void;
  setGenerating: (generating: boolean) => void;
  setError: (error: string | null) => void;

  // Draft management
  saveDraft: () => void;
  loadDraft: () => ResumeContent | null;
  clearDraft: () => void;

  // Reset
  reset: () => void;
}

const initialState = {
  content: null,
  isGenerating: false,
  error: null,
  inputMode: 'text' as const,
  rawInput: '',
  guidedAnswers: {},
};

export const useResumeStore = create<ResumeState>((set, get) => ({
  ...initialState,

  setContent: (content) => set({ content }),

  setInputMode: (mode) => set({ inputMode: mode }),

  setRawInput: (input) => set({ rawInput: input }),

  setGuidedAnswers: (answers) => set({ guidedAnswers: answers }),

  setGenerating: (isGenerating) => set({ isGenerating }),

  setError: (error) => set({ error }),

  saveDraft: () => {
    const { content, inputMode, rawInput, guidedAnswers } = get();
    saveResumeDraft({ content, inputMode, rawInput, guidedAnswers });
  },

  loadDraft: () => {
    const draft = loadResumeDraft();
    if (draft && typeof draft === 'object' && 'content' in draft) {
      return (draft as { content: ResumeContent }).content;
    }
    return null;
  },

  clearDraft: () => {
    removeResumeDraft();
    set(initialState);
  },

  reset: () => {
    removeResumeDraft();
    set(initialState);
  },
}));
