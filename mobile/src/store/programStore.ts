import { create } from 'zustand';
import { apiClient } from '../lib/apiClient';

export interface ProgramExercise {
  slug: string;
  name: string;
  sets: number;
  reps: string;
  rest_seconds: number;
  notes?: string;
}

export interface ProgramDay {
  day: number;
  name: string;
  focus: string;
  exercises: ProgramExercise[];
}

export interface Program {
  id: string;
  name: string;
  weeks: number;
  days_per_week: number;
  schedule: ProgramDay[];
  notes?: string | null;
  created_at: string;
}

interface ProgramState {
  programs: Program[];
  generating: boolean;
  loading: boolean;
  error: string | null;

  fetchPrograms: () => Promise<void>;
  generateProgram: () => Promise<Program | null>;
  deleteProgram: (id: string) => Promise<void>;
}

export const useProgramStore = create<ProgramState>((set, get) => ({
  programs: [],
  generating: false,
  loading: false,
  error: null,

  fetchPrograms: async () => {
    set({ loading: true, error: null });
    try {
      const res = await apiClient.get<{ data: Program[] }>('/programs');
      set({ programs: res.data.data, loading: false });
    } catch (err: any) {
      set({ error: err.message ?? 'Failed to load programs', loading: false });
    }
  },

  generateProgram: async () => {
    set({ generating: true, error: null });
    try {
      const res = await apiClient.post<{ data: Program }>('/programs/generate', {});
      const newProgram = res.data.data;
      set((state) => ({
        programs: [newProgram, ...state.programs],
        generating: false,
      }));
      return newProgram;
    } catch (err: any) {
      set({ error: err.message ?? 'Generation failed', generating: false });
      return null;
    }
  },

  deleteProgram: async (id) => {
    try {
      await apiClient.delete(`/programs/${id}`);
      set((state) => ({ programs: state.programs.filter((p) => p.id !== id) }));
    } catch (err: any) {
      set({ error: err.message ?? 'Delete failed' });
    }
  },
}));
