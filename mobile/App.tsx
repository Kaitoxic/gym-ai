import React, { useEffect, useRef, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { useAuthStore } from './src/store/authStore';
import { useProfileStore } from './src/store/profileStore';
import AuthNavigator from './src/navigation/AuthNavigator';
import OnboardingNavigator from './src/navigation/OnboardingNavigator';
import MainTabs from './src/navigation/MainTabs';

export default function App() {
  const { user, loading: authLoading, initialize } = useAuthStore();
  const { profile, initialized: profileInitialized, fetchProfile, error: profileError } = useProfileStore();

  // Track if user explicitly chose to bypass profile error
  const [bypassError, setBypassError] = useState(false);
  // Auto-retry counter
  const retryCount = useRef(0);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize auth on launch
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Fetch profile when user is authenticated; auto-retry up to 2 times on error
  useEffect(() => {
    if (user) {
      retryCount.current = 0;
      setBypassError(false);
      fetchProfile();
    } else {
      useProfileStore.getState().reset();
    }
  }, [user]);

  // Auto-retry once after 2s if first fetch fails
  useEffect(() => {
    if (profileInitialized && profileError && !profile && retryCount.current < 2) {
      retryCount.current += 1;
      retryTimer.current = setTimeout(() => {
        fetchProfile();
      }, 2000);
    }
    return () => {
      if (retryTimer.current) clearTimeout(retryTimer.current);
    };
  }, [profileInitialized, profileError, profile]);

  // Block rendering until auth AND initial profile fetch are done
  const isLoading = authLoading || (!!user && !profileInitialized);

  if (isLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#6C47FF" />
        <StatusBar style="light" />
      </View>
    );
  }

  // Profile fetch failed after retries: show error + bypass option
  // Don't redirect to onboarding just because the server was temporarily unavailable
  if (user && profileInitialized && profileError && !profile && !bypassError) {
    return (
      <View style={styles.loader}>
        <StatusBar style="light" />
        <Text style={styles.errorTitle}>Profil indisponible</Text>
        <Text style={styles.errorMsg}>
          Impossible de charger ton profil.{'\n'}Le serveur est peut-etre temporairement indisponible.
        </Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => { retryCount.current = 0; fetchProfile(); }}>
          <Text style={styles.retryText}>Reessayer</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.bypassBtn} onPress={() => setBypassError(true)}>
          <Text style={styles.bypassText}>Continuer quand meme</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      {!user ? (
        // Not logged in → Auth screens
        <AuthNavigator />
      ) : !profile?.onboarding_done && !bypassError ? (
        // Logged in but not onboarded → Onboarding flow
        <OnboardingNavigator />
      ) : (
        // Fully set up → Main app
        <MainTabs />
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    backgroundColor: '#0f0f0f',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorTitle: {
    color: '#ef4444',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
    textAlign: 'center',
  },
  errorMsg: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  retryBtn: {
    backgroundColor: '#6366f1',
    borderRadius: 10,
    paddingHorizontal: 28,
    paddingVertical: 12,
    marginBottom: 14,
  },
  retryText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  bypassBtn: {
    paddingVertical: 8,
  },
  bypassText: {
    color: '#555',
    fontSize: 13,
  },
});
