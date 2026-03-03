import { create } from 'zustand';
import { apiClient } from '../lib/apiClient';
import * as WebBrowser from 'expo-web-browser';
import { useAuthStore } from './authStore';

export type SubscriptionStatus = 'free' | 'pro' | 'loading';

interface SubscriptionState {
  status: SubscriptionStatus;
  periodEnd: string | null;
  // Actions
  fetchStatus: () => Promise<void>;
  openCheckout: (plan: 'monthly' | 'yearly') => Promise<{ error?: string }>;
  devSetPro: () => Promise<{ error?: string }>;
  devSetFree: () => Promise<{ error?: string }>;
}

export const useSubscriptionStore = create<SubscriptionState>((set) => ({
  status: 'loading',
  periodEnd: null,

  fetchStatus: async () => {
    // Read from auth session user_metadata first (no extra API call needed)
    const { user } = useAuthStore.getState();
    if (!user) {
      set({ status: 'free', periodEnd: null });
      return;
    }
    const metaStatus = (user.user_metadata?.subscription_status as string) ?? 'free';
    set({
      status: metaStatus === 'pro' ? 'pro' : 'free',
      periodEnd: user.user_metadata?.subscription_period_end ?? null,
    });
  },

  openCheckout: async (plan) => {
    try {
      const res = await apiClient.post<{ url: string; error?: string; detail?: string }>(
        '/subscriptions/create-checkout',
        { plan }
      );
      const url = res.data.url;
      if (!url) return { error: res.data.detail ?? res.data.error ?? 'No checkout URL returned' };

      await WebBrowser.openBrowserAsync(url);

      // Re-fetch status after returning from browser (user may have subscribed)
      const statusRes = await apiClient.get<{ status: string; period_end: string | null }>(
        '/subscriptions/status'
      );
      set({
        status: statusRes.data.status === 'pro' ? 'pro' : 'free',
        periodEnd: statusRes.data.period_end,
      });

      return {};
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      const errMsg = err?.response?.data?.error ?? err.message ?? 'Checkout failed';
      return { error: detail ? `${errMsg}: ${detail}` : errMsg };
    }
  },

  devSetPro: async () => {
    try {
      await apiClient.post('/subscriptions/dev-set-pro', {});
      // Re-fetch from API to confirm
      const res = await apiClient.get<{ status: string; period_end: string | null }>(
        '/subscriptions/status'
      );
      set({ status: 'pro', periodEnd: res.data.period_end });
      return {};
    } catch (err: any) {
      return { error: err?.response?.data?.error ?? err.message ?? 'Dev set pro failed' };
    }
  },

  devSetFree: async () => {
    try {
      await apiClient.post('/subscriptions/dev-set-free', {});
      set({ status: 'free', periodEnd: null });
      return {};
    } catch (err: any) {
      return { error: err?.response?.data?.error ?? err.message ?? 'Dev reset failed' };
    }
  },
}));
