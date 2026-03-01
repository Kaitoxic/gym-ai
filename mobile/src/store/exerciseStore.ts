import { create } from 'zustand';
import { apiClient } from '../lib/apiClient';
import {
  getCachedExercises,
  setCachedExercises,
  type Exercise,
} from '../lib/exerciseCache';

export type { Exercise };

interface ExerciseState {
  exercises: Exercise[];
  loading: boolean;
  error: string | null;
  lastFetched: number | null;

  // Filters
  searchQuery: string;
  filterMuscle: string | null;
  filterEquipment: string | null;
  filterDifficulty: string | null;

  fetchExercises: (forceRefresh?: boolean) => Promise<void>;
  setSearchQuery: (q: string) => void;
  setFilterMuscle: (m: string | null) => void;
  setFilterEquipment: (e: string | null) => void;
  setFilterDifficulty: (d: string | null) => void;
  getFiltered: () => Exercise[];
}

export const useExerciseStore = create<ExerciseState>((set, get) => ({
  exercises: [],
  loading: false,
  error: null,
  lastFetched: null,

  searchQuery: '',
  filterMuscle: null,
  filterEquipment: null,
  filterDifficulty: null,

  fetchExercises: async (forceRefresh = false) => {
    const { exercises, loading } = get();
    if (loading) return;

    // If we already have exercises and no force-refresh, skip
    if (exercises.length > 0 && !forceRefresh) return;

    set({ loading: true, error: null });

    // Try cache first (skip cache on force-refresh)
    if (!forceRefresh) {
      const cached = await getCachedExercises();
      if (cached && cached.length > 0) {
        set({ exercises: cached, loading: false, lastFetched: Date.now() });
        return;
      }
    }

    // Fetch all pages from API
    try {
      const allExercises: Exercise[] = [];
      let page = 1;
      let total = Infinity;

      while (allExercises.length < total) {
        const res = await apiClient.get<{
          data: Exercise[];
          total: number;
          page: number;
          limit: number;
        }>('/exercises', { params: { page, limit: 100 } });

        allExercises.push(...res.data.data);
        total = res.data.total;
        if (res.data.data.length < 100) break;
        page++;
      }

      await setCachedExercises(allExercises);
      set({ exercises: allExercises, loading: false, lastFetched: Date.now() });
    } catch (err: any) {
      set({ error: err.message ?? 'Failed to load exercises', loading: false });
    }
  },

  setSearchQuery: (q) => set({ searchQuery: q }),
  setFilterMuscle: (m) => set({ filterMuscle: m }),
  setFilterEquipment: (e) => set({ filterEquipment: e }),
  setFilterDifficulty: (d) => set({ filterDifficulty: d }),

  getFiltered: () => {
    const { exercises, searchQuery, filterMuscle, filterEquipment, filterDifficulty } = get();
    return exercises.filter((ex) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!ex.name.toLowerCase().includes(q)) return false;
      }
      if (filterMuscle && !ex.muscle_groups.includes(filterMuscle)) return false;
      if (filterEquipment && !ex.equipment.includes(filterEquipment)) return false;
      if (filterDifficulty && ex.difficulty !== filterDifficulty) return false;
      return true;
    });
  },
}));
