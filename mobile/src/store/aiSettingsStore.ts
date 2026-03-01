import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type CoachingStyle = 'strict' | 'motivating' | 'scientific';
export type DetailLevel = 'short' | 'detailed';

const STORAGE_KEY = '@gym_ai_settings';

interface AISettingsState {
  coaching_style: CoachingStyle;
  detail_level: DetailLevel;
  loaded: boolean;
  load: () => Promise<void>;
  setCoachingStyle: (style: CoachingStyle) => Promise<void>;
  setDetailLevel: (level: DetailLevel) => Promise<void>;
}

export const useAISettingsStore = create<AISettingsState>((set, get) => ({
  coaching_style: 'motivating',
  detail_level: 'short',
  loaded: false,

  load: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        set({
          coaching_style: parsed.coaching_style ?? 'motivating',
          detail_level: parsed.detail_level ?? 'short',
          loaded: true,
        });
      } else {
        set({ loaded: true });
      }
    } catch {
      set({ loaded: true });
    }
  },

  setCoachingStyle: async (style) => {
    set({ coaching_style: style });
    const { detail_level } = get();
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ coaching_style: style, detail_level }));
  },

  setDetailLevel: async (level) => {
    set({ detail_level: level });
    const { coaching_style } = get();
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ coaching_style, detail_level: level }));
  },
}));
