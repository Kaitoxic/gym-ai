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
  fetchProgramById: (id: string) => Promise<Program | null>;
  generateProgram: () => Promise<Program | null>;
  deleteProgram: (id: string) => Promise<void>;
  updateProgramExercise: (
    programId: string,
    dayIndex: number,
    exerciseIndex: number,
    newExercise: ProgramExercise
  ) => Promise<Program | null>;
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

  fetchProgramById: async (id: string) => {
    try {
      const res = await apiClient.get<{ data: Program }>(`/programs/${id}`);
      return res.data.data;
    } catch (err: any) {
      return null;
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

  updateProgramExercise: async (programId, dayIndex, exerciseIndex, newExercise) => {
    try {
      // Fetch current program to get full schedule
      const res = await apiClient.get<{ data: Program }>(`/programs/${programId}`);
      const program = res.data.data;

      // Deep-clone schedule and replace the target exercise
      const newSchedule: ProgramDay[] = program.schedule.map((day, di) => {
        if (di !== dayIndex) return day;
        return {
          ...day,
          exercises: day.exercises.map((ex, ei) =>
            ei === exerciseIndex ? { ...ex, ...newExercise } : ex
          ),
        };
      });

      // Persist via PATCH
      const patchRes = await apiClient.patch<{ data: Program }>(`/programs/${programId}`, { schedule: newSchedule });
      const updated = patchRes.data.data;

      // Update local cache if program is in the list
      set((state) => ({
        programs: state.programs.map((p) => p.id === programId ? updated : p),
      }));

      return updated;
    } catch (err: any) {
      set({ error: err.message ?? 'Update failed' });
      return null;
    }
  },
}));
