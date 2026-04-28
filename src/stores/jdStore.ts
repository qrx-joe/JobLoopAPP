import { create } from 'zustand';
import type { JDMatchResult, JobDescription } from '@/types/jd';

interface JDState {
  // Current JD
  currentJD: JobDescription | null;
  jdText: string;
  companyName: string;
  jobTitle: string;

  // Match result
  matchResult: JDMatchResult | null;
  isMatching: boolean;
  error: string | null;

  // Actions
  setJdText: (text: string) => void;
  setCompanyName: (name: string) => void;
  setJobTitle: (title: string) => void;
  setCurrentJD: (jd: JobDescription | null) => void;
  setMatchResult: (result: JDMatchResult | null) => void;
  setMatching: (matching: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useJDStore = create<JDState>((set) => ({
  currentJD: null,
  jdText: '',
  companyName: '',
  jobTitle: '',
  matchResult: null,
  isMatching: false,
  error: null,

  setJdText: (text) => set({ jdText: text }),
  setCompanyName: (name) => set({ companyName: name }),
  setJobTitle: (title) => set({ jobTitle: title }),
  setCurrentJD: (jd) => set({ currentJD: jd }),
  setMatchResult: (result) => set({ matchResult: result }),
  setMatching: (matching) => set({ isMatching: matching }),
  setError: (error) => set({ error }),
  reset: () =>
    set({
      currentJD: null,
      jdText: '',
      companyName: '',
      jobTitle: '',
      matchResult: null,
      isMatching: false,
      error: null,
    }),
}));
