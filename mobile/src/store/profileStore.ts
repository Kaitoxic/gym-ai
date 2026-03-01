import { create } from 'zustand';
import { apiClient } from '../lib/apiClient';

export type Goal = 'muscle_gain' | 'fat_loss' | 'endurance' | 'general_fitness';
export type FitnessLevel = 'beginner' | 'intermediate' | 'advanced';

export interface UserProfile {
  id: string;
  goal?: Goal;
  fitness_level?: FitnessLevel;
  injury_notes?: string;
  available_days?: number[]; // 0=Sun … 6=Sat
  equipment?: string[];
  body_weight?: number; // kg
  body_height?: number; // cm
  body_age?: number;
  preferred_exercises?: string[];
  onboarding_done?: boolean;
  created_at?: string;
  updated_at?: string;
}

interface ProfileState {
  profile: UserProfile | null;
  initialized: boolean; // true after first fetchProfile completes (success or fail)
  loading: boolean;
  error: string | null;
  fetchProfile: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  reset: () => void;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  initialized: false,
  loading: false,
  error: null,

  fetchProfile: async () => {
    set({ loading: true, error: null });
    try {
      const res = await apiClient.get<{ profile: UserProfile | null }>('/users/profile');
      set({ profile: res.data.profile, loading: false, initialized: true });
    } catch (err: any) {
      set({ error: err.message ?? 'Failed to load profile', loading: false, initialized: true });
    }
  },

  updateProfile: async (updates) => {
    // Note: does NOT touch `initialized` — avoids remounting NavigationContainer in App.tsx
    set({ loading: true, error: null });
    try {
      const res = await apiClient.post<{ profile: UserProfile }>('/users/profile', updates);
      set({ profile: res.data.profile, loading: false });
    } catch (err: any) {
      set({ error: err.message ?? 'Failed to save profile', loading: false });
    }
  },

  reset: () => set({ profile: null, initialized: false, loading: false, error: null }),
}));
