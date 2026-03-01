import { create } from 'zustand';
import { apiClient } from '../lib/apiClient';
import type { ProgramDay, ProgramExercise } from './programStore';

// A set log entry — what the user actually did
export interface SetLog {
  exercise_slug: string;
  exercise_name: string;
  set_index: number;
  reps_done: number;
  weight_kg: number | null;
  completed: boolean;
}

export interface WorkoutLog {
  id: string;
  program_id: string | null;
  day_number: number;
  day_name: string;
  sets_done: SetLog[];
  duration_seconds: number | null;
  completed_at: string;
}

// Active workout state — one entry per exercise × set
export interface ActiveSet {
  exercise_slug: string;
  exercise_name: string;
  set_index: number;       // 0-based
  target_reps: string;
  rest_seconds: number;
  reps_done: number;
  weight_kg: number | null;
  completed: boolean;
}

interface WorkoutState {
  // Active session
  activeDay: ProgramDay | null;
  activeProgramId: string | null;
  activeSets: ActiveSet[];
  startedAt: Date | null;
  saving: boolean;

  // History
  history: WorkoutLog[];
  streak: number;
  loadingHistory: boolean;

  // Actions
  startWorkout: (day: ProgramDay, programId: string) => void;
  toggleSet: (exerciseSlug: string, setIndex: number) => void;
  updateSetReps: (exerciseSlug: string, setIndex: number, reps: number) => void;
  updateSetWeight: (exerciseSlug: string, setIndex: number, weight: number | null) => void;
  finishWorkout: () => Promise<WorkoutLog | null>;
  cancelWorkout: () => void;
  fetchHistory: () => Promise<void>;
  fetchStreak: () => Promise<void>;
}

function buildActiveSets(day: ProgramDay): ActiveSet[] {
  const sets: ActiveSet[] = [];
  for (const ex of day.exercises) {
    for (let i = 0; i < ex.sets; i++) {
      sets.push({
        exercise_slug: ex.slug,
        exercise_name: ex.name,
        set_index: i,
        target_reps: ex.reps,
        rest_seconds: ex.rest_seconds,
        reps_done: 0,
        weight_kg: null,
        completed: false,
      });
    }
  }
  return sets;
}

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  activeDay: null,
  activeProgramId: null,
  activeSets: [],
  startedAt: null,
  saving: false,

  history: [],
  streak: 0,
  loadingHistory: false,

  startWorkout: (day, programId) => {
    set({
      activeDay: day,
      activeProgramId: programId,
      activeSets: buildActiveSets(day),
      startedAt: new Date(),
    });
  },

  toggleSet: (exerciseSlug, setIndex) => {
    set((state) => ({
      activeSets: state.activeSets.map((s) =>
        s.exercise_slug === exerciseSlug && s.set_index === setIndex
          ? { ...s, completed: !s.completed }
          : s
      ),
    }));
  },

  updateSetReps: (exerciseSlug, setIndex, reps) => {
    set((state) => ({
      activeSets: state.activeSets.map((s) =>
        s.exercise_slug === exerciseSlug && s.set_index === setIndex
          ? { ...s, reps_done: reps }
          : s
      ),
    }));
  },

  updateSetWeight: (exerciseSlug, setIndex, weight) => {
    set((state) => ({
      activeSets: state.activeSets.map((s) =>
        s.exercise_slug === exerciseSlug && s.set_index === setIndex
          ? { ...s, weight_kg: weight }
          : s
      ),
    }));
  },

  finishWorkout: async () => {
    const { activeDay, activeProgramId, activeSets, startedAt } = get();
    if (!activeDay) return null;

    const durationSeconds = startedAt
      ? Math.round((Date.now() - startedAt.getTime()) / 1000)
      : null;

    const setsDone: SetLog[] = activeSets
      .filter((s) => s.completed)
      .map((s) => ({
        exercise_slug: s.exercise_slug,
        exercise_name: s.exercise_name,
        set_index: s.set_index,
        reps_done: s.reps_done,
        weight_kg: s.weight_kg,
        completed: true,
      }));

    set({ saving: true });
    try {
      const res = await apiClient.post<{ data: WorkoutLog }>('/workouts/log', {
        program_id: activeProgramId,
        day_number: activeDay.day,
        day_name: activeDay.name,
        sets_done: setsDone,
        duration_seconds: durationSeconds,
      });
      const log = res.data.data;
      set((state) => ({
        history: [log, ...state.history],
        saving: false,
        activeDay: null,
        activeProgramId: null,
        activeSets: [],
        startedAt: null,
      }));
      return log;
    } catch (err: any) {
      set({ saving: false });
      return null;
    }
  },

  cancelWorkout: () => {
    set({ activeDay: null, activeProgramId: null, activeSets: [], startedAt: null });
  },

  fetchHistory: async () => {
    set({ loadingHistory: true });
    try {
      const res = await apiClient.get<{ data: WorkoutLog[] }>('/workouts/history');
      set({ history: res.data.data, loadingHistory: false });
    } catch {
      set({ loadingHistory: false });
    }
  },

  fetchStreak: async () => {
    try {
      const res = await apiClient.get<{ streak: number }>('/workouts/streak');
      set({ streak: res.data.streak });
    } catch {
      // silent
    }
  },
}));
