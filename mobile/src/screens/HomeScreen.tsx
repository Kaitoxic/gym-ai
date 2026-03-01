import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useProfileStore } from '../store/profileStore';

export default function HomeScreen() {
  const { profile } = useProfileStore();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.greeting}>
          {profile ? `Welcome back!` : 'Welcome to GymCoach AI'}
        </Text>
        <Text style={styles.subtitle}>
          Your AI-powered training assistant
        </Text>
        {profile?.goal && (
          <View style={styles.goalBadge}>
            <Text style={styles.goalText}>Goal: {profile.goal.replace(/_/g, ' ')}</Text>
          </View>
        )}
        <Text style={styles.comingSoon}>AI program generation coming in Phase 5</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  greeting: { color: '#ffffff', fontSize: 26, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  subtitle: { color: '#888', fontSize: 15, textAlign: 'center', marginBottom: 24 },
  goalBadge: {
    backgroundColor: '#6366f122',
    borderColor: '#6366f1',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 24,
  },
  goalText: { color: '#a78bfa', fontWeight: '600', fontSize: 14, textTransform: 'capitalize' },
  comingSoon: { color: '#444', fontSize: 13, textAlign: 'center' },
});
