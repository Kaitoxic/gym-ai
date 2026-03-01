import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { useAuthStore } from './src/store/authStore';
import { useProfileStore } from './src/store/profileStore';
import AuthNavigator from './src/navigation/AuthNavigator';
import OnboardingNavigator from './src/navigation/OnboardingNavigator';
import MainTabs from './src/navigation/MainTabs';

export default function App() {
  const { user, loading: authLoading, initialize } = useAuthStore();
  const { profile, loading: profileLoading, fetchProfile } = useProfileStore();

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

  const isLoading = authLoading || (!!user && profileLoading && profile === null);

  if (isLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#6C47FF" />
        <StatusBar style="light" />
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
  },
});
