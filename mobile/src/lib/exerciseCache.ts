import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEY = 'exercises_cache';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h

export interface CachedExercises {
  data: Exercise[];
  timestamp: number;
}

export interface Exercise {
  id: string;
  slug: string;
  name: string;
  muscle_groups: string[];
  equipment: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  instructions: string[];
  image_url?: string | null;
  video_url?: string | null;
  created_at: string;
}

export async function getCachedExercises(): Promise<Exercise[] | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached: CachedExercises = JSON.parse(raw);
    const age = Date.now() - cached.timestamp;
    if (age > CACHE_TTL_MS) {
      await AsyncStorage.removeItem(CACHE_KEY);
      return null;
    }
    return cached.data;
  } catch {
    return null;
  }
}

export async function setCachedExercises(exercises: Exercise[]): Promise<void> {
  try {
    const payload: CachedExercises = { data: exercises, timestamp: Date.now() };
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch {
    // ignore write failures — cache is best-effort
  }
}

export async function clearExerciseCache(): Promise<void> {
  try {
    await AsyncStorage.removeItem(CACHE_KEY);
  } catch {}
}
