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
      const res = await apiClient.post<{ url: string }>('/subscriptions/create-checkout', { plan });
      const url = res.data.url;
      if (!url) return { error: 'No checkout URL returned' };

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
      return { error: err?.response?.data?.error ?? err.message ?? 'Checkout failed' };
    }
  },
}));
