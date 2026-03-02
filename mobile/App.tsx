import React, { useEffect } from 'react';
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

  // Initialize auth on launch
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Fetch profile when user is authenticated
  useEffect(() => {
    if (user) {
      fetchProfile();
    } else {
      useProfileStore.getState().reset();
    }
  }, [user]);

  // Only block rendering until auth AND initial profile fetch are done
  // updateProfile's loading state is intentionally excluded here —
  // we must never unmount NavigationContainer mid-flow (would reset stack to Step 1)
  const isLoading = authLoading || (!!user && !profileInitialized);

  if (isLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#6C47FF" />
        <StatusBar style="light" />
      </View>
    );
  }

  // Network error: profile fetch failed but user is authenticated.
  // Don't redirect to onboarding — show a retry screen instead.
  if (user && profileInitialized && profileError && !profile) {
    return (
      <View style={styles.loader}>
        <StatusBar style="light" />
        <Text style={styles.errorTitle}>Erreur de connexion</Text>
        <Text style={styles.errorMsg}>Impossible de charger votre profil.{'\n'}Verifie ta connexion internet.</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchProfile}>
          <Text style={styles.retryText}>Reessayer</Text>
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
      ) : !profile?.onboarding_done ? (
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
    marginBottom: 24,
  },
  retryBtn: {
    backgroundColor: '#6366f1',
    borderRadius: 10,
    paddingHorizontal: 28,
    paddingVertical: 12,
  },
  retryText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
