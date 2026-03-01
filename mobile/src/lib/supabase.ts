import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

/**
 * SecureStore has a 2048-byte limit per key.
 * Supabase sessions can exceed this, so we chunk large values across
 * multiple SecureStore keys (chunk_0, chunk_1, …) and reassemble on read.
 */
const CHUNK_SIZE = 1800; // safe margin under 2048

async function setChunked(key: string, value: string): Promise<void> {
  const chunks = Math.ceil(value.length / CHUNK_SIZE);
  await SecureStore.setItemAsync(`${key}__count`, String(chunks));
  for (let i = 0; i < chunks; i++) {
    await SecureStore.setItemAsync(
      `${key}__chunk_${i}`,
      value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE)
    );
  }
}

async function getChunked(key: string): Promise<string | null> {
  const countStr = await SecureStore.getItemAsync(`${key}__count`);
  if (!countStr) return SecureStore.getItemAsync(key); // legacy single-key fallback
  const count = parseInt(countStr, 10);
  const parts: string[] = [];
  for (let i = 0; i < count; i++) {
    const chunk = await SecureStore.getItemAsync(`${key}__chunk_${i}`);
    if (chunk === null) return null;
    parts.push(chunk);
  }
  return parts.join('');
}

async function deleteChunked(key: string): Promise<void> {
  const countStr = await SecureStore.getItemAsync(`${key}__count`);
  if (countStr) {
    const count = parseInt(countStr, 10);
    for (let i = 0; i < count; i++) {
      await SecureStore.deleteItemAsync(`${key}__chunk_${i}`);
    }
    await SecureStore.deleteItemAsync(`${key}__count`);
  } else {
    await SecureStore.deleteItemAsync(key);
  }
}

const ExpoSecureStoreAdapter = {
  getItem: (key: string): string | null | Promise<string | null> => {
    if (Platform.OS === 'web') {
      if (typeof localStorage === 'undefined') return null;
      return localStorage.getItem(key);
    }
    return getChunked(key);
  },
  setItem: (key: string, value: string): void | Promise<void> => {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
      return;
    }
    return setChunked(key, value);
  },
  removeItem: (key: string): void | Promise<void> => {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
      return;
    }
    return deleteChunked(key);
  },
};

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[supabase] Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Handle deep link auth callbacks (email confirmation, magic links)
// Supabase redirects back to the app with access_token in the URL hash
function parseTokensFromUrl(url: string): { access_token?: string; refresh_token?: string } {
  try {
    // Tokens land in the hash fragment: #access_token=...&refresh_token=...
    const hash = url.split('#')[1] ?? '';
    const params: Record<string, string> = {};
    hash.split('&').forEach((part) => {
      const [k, v] = part.split('=');
      if (k) params[decodeURIComponent(k)] = decodeURIComponent(v ?? '');
    });
    return { access_token: params.access_token, refresh_token: params.refresh_token };
  } catch {
    return {};
  }
}

async function handleAuthDeepLink(url: string) {
  if (!url) return;
  const { access_token, refresh_token } = parseTokensFromUrl(url);
  if (access_token && refresh_token) {
    await supabase.auth.setSession({ access_token, refresh_token });
  }
}

if (Platform.OS !== 'web') {
  // App already open — URL arrives via event
  Linking.addEventListener('url', ({ url }) => {
    handleAuthDeepLink(url);
  });

  // App cold-started from deep link
  Linking.getInitialURL().then((url) => {
    if (url) handleAuthDeepLink(url);
  });
}
