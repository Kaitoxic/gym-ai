import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import { useProfileStore } from '../store/profileStore';
import { useAuthStore } from '../store/authStore';

function Row({ label, value }: { label: string; value?: string | number | null }) {
  if (!value && value !== 0) return null;
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{String(value)}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const { profile } = useProfileStore();
  const { signOut } = useAuthStore();

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  function capitalize(s: string) {
    return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ');
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>My Profile</Text>

        {profile ? (
          <View style={styles.card}>
            <Row label="Goal" value={profile.goal ? capitalize(profile.goal) : null} />
            <Row label="Fitness Level" value={profile.fitness_level ? capitalize(profile.fitness_level) : null} />
            <Row label="Weight" value={profile.body_weight ? `${profile.body_weight} kg` : null} />
            <Row label="Height" value={profile.body_height ? `${profile.body_height} cm` : null} />
            <Row label="Age" value={profile.body_age} />
            {profile.equipment && profile.equipment.length > 0 && (
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Equipment</Text>
                <Text style={styles.rowValue}>{profile.equipment.map(capitalize).join(', ')}</Text>
              </View>
            )}
            {profile.available_days && profile.available_days.length > 0 && (
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Training Days</Text>
                <Text style={styles.rowValue}>
                  {profile.available_days
                    .map((d) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d])
                    .join(', ')}
                </Text>
              </View>
            )}
            {profile.injury_notes ? (
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Injuries</Text>
                <Text style={styles.rowValue}>{profile.injury_notes}</Text>
              </View>
            ) : null}
          </View>
        ) : (
          <Text style={styles.noProfile}>No profile data found.</Text>
        )}

        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f' },
  content: { flex: 1, padding: 20 },
  title: { color: '#ffffff', fontSize: 24, fontWeight: '700', marginBottom: 20 },
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    marginBottom: 24,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  rowLabel: { color: '#888', fontSize: 14, fontWeight: '500' },
  rowValue: { color: '#ffffff', fontSize: 14, fontWeight: '600', textAlign: 'right', flex: 1, marginLeft: 16 },
  noProfile: { color: '#555', fontSize: 14, textAlign: 'center', marginTop: 40 },
  signOutBtn: {
    backgroundColor: '#ef444422',
    borderColor: '#ef4444',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 'auto',
  },
  signOutText: { color: '#ef4444', fontWeight: '700', fontSize: 15 },
});
