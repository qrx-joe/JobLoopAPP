import { create } from 'zustand';
import type {
  InterviewSession,
  InterviewMessage,
  Question,
  Score,
  RadarData,
} from '@/types/interview';

interface InterviewState {
  // Current session
  session: InterviewSession | null;
  questions: Question[];
  messages: InterviewMessage[];
  scores: Score[];
  radarData: RadarData | null;

  // UI State
  currentQuestionIndex: number;
  isLoadingResponse: boolean;
  error: string | null;

  // Actions
  setSession: (session: InterviewSession | null) => void;
  setQuestions: (questions: Question[]) => void;
  addMessage: (message: InterviewMessage) => void;
  addScore: (score: Score) => void;
  updateRadarData: (data: RadarData) => void;
  setCurrentQuestionIndex: (index: number) => void;
  setLoadingResponse: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useInterviewStore = create<InterviewState>((set) => ({
  session: null,
  questions: [],
  messages: [],
  scores: [],
  radarData: null,
  currentQuestionIndex: 0,
  isLoadingResponse: false,
  error: null,

  setSession: (session) => set({ session }),
  setQuestions: (questions) => set({ questions }),
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  addScore: (score) => set((state) => ({ scores: [...state.scores, score] })),
  updateRadarData: (data) => set({ radarData: data }),
  setCurrentQuestionIndex: (index) => set({ currentQuestionIndex: index }),
  setLoadingResponse: (loading) => set({ isLoadingResponse: loading }),
  setError: (error) => set({ error }),
  reset: () =>
    set({
      session: null,
      questions: [],
      messages: [],
      scores: [],
      radarData: null,
      currentQuestionIndex: 0,
      isLoadingResponse: false,
      error: null,
    }),
}));
