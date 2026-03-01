import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from './src/store/authStore';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';

type AuthScreen = 'login' | 'register';

export default function App() {
  const { user, loading, initialize } = useAuthStore();
  const [authScreen, setAuthScreen] = React.useState<AuthScreen>('login');

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#6C47FF" />
        <StatusBar style="light" />
      </View>
    );
  }

  // Authenticated — placeholder for main app (Phase 3+)
  if (user) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="small" color="#6C47FF" />
        {/* TODO Phase 3: replace with main tab navigator */}
        <StatusBar style="light" />
      </View>
    );
  }

  // Unauthenticated — show auth screens
  return (
    <>
      <StatusBar style="light" />
      {authScreen === 'login' ? (
        <LoginScreen onNavigateToRegister={() => setAuthScreen('register')} />
      ) : (
        <RegisterScreen onNavigateToLogin={() => setAuthScreen('login')} />
      )}
    </>
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
