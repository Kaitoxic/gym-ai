import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../navigation/HomeNavigator';
import { useProfileStore } from '../store/profileStore';
import { useProgramStore, type Program } from '../store/programStore';
import { useSubscriptionStore } from '../store/subscriptionStore';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'Home'>;

function ProgramCard({ program, onPress, onDelete }: {
  program: Program;
  onPress: () => void;
  onDelete: () => void;
}) {
  const date = new Date(program.created_at).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.cardTop}>
        <Text style={styles.cardName} numberOfLines={1}>{program.name}</Text>
        <TouchableOpacity onPress={onDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.deleteBtn}>✕</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.cardMeta}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{program.weeks}w</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{program.days_per_week}x/week</Text>
        </View>
        <Text style={styles.cardDate}>{date}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { profile } = useProfileStore();
  const { programs, generating, loading, error, fetchPrograms, generateProgram, deleteProgram } =
    useProgramStore();
  const { status: subStatus, fetchStatus } = useSubscriptionStore();

  useEffect(() => {
    fetchPrograms();
    fetchStatus();
  }, []);

  const handleGenerate = async () => {
    if (subStatus === 'loading') return;

    // Pro gate
    if (subStatus !== 'pro') {
      navigation.navigate('Paywall');
      return;
    }

    if (!profile?.onboarding_done) {
      Alert.alert('Profile incomplete', 'Please complete onboarding first.');
      return;
    }
    const program = await generateProgram();
    if (program) {
      navigation.navigate('ProgramDetail', { programId: program.id, programName: program.name });
    } else {
      Alert.alert('Error', error ?? 'Failed to generate program');
    }
  };

  const handleDelete = (program: Program) => {
    Alert.alert('Delete Program', `Delete "${program.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteProgram(program.id) },
    ]);
  };

  const isPro = subStatus === 'pro';

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={programs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <>
            {/* Welcome */}
            <View style={styles.header}>
              <Text style={styles.greeting}>
                {profile?.goal
                  ? `Goal: ${profile.goal.replace(/_/g, ' ')}`
                  : 'Welcome to GymCoach AI'}
              </Text>
              {profile?.fitness_level && (
                <Text style={styles.level}>{profile.fitness_level} level</Text>
              )}
            </View>

            {/* Generate AI button (Pro) */}
            <TouchableOpacity
              style={[styles.generateBtn, (generating || subStatus === 'loading') && styles.generateBtnDisabled]}
              onPress={handleGenerate}
              disabled={generating || subStatus === 'loading'}
              activeOpacity={0.8}
            >
              {generating ? (
                <>
                  <ActivityIndicator color="#fff" size="small" style={{ marginRight: 8 }} />
                  <Text style={styles.generateBtnText}>Génération en cours...</Text>
                </>
              ) : (
                <View style={styles.generateBtnInner}>
                  <Text style={styles.generateBtnText}>
                    {isPro ? 'Générer un programme IA' : 'Générer un programme IA'}
                  </Text>
                  {!isPro && (
                    <View style={styles.proBadge}>
                      <Text style={styles.proBadgeText}>PRO</Text>
                    </View>
                  )}
                </View>
              )}
            </TouchableOpacity>

            {/* Manual creation button (free) */}
            <TouchableOpacity
              style={styles.manualBtn}
              onPress={() => navigation.navigate('CreateProgram')}
              activeOpacity={0.8}
            >
              <Text style={styles.manualBtnText}>+ Créer manuellement</Text>
            </TouchableOpacity>

            {programs.length > 0 && (
              <Text style={styles.sectionTitle}>Mes programmes</Text>
            )}
          </>
        }
        renderItem={({ item }) => (
          <ProgramCard
            program={item}
            onPress={() => navigation.navigate('ProgramDetail', { programId: item.id, programName: item.name })}
            onDelete={() => handleDelete(item)}
          />
        )}
        ListEmptyComponent={
          !loading && !generating ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Aucun programme</Text>
              <Text style={styles.emptyText}>
                Génère un programme IA (Pro) ou crée-en un manuellement.
              </Text>
            </View>
          ) : null
        }
        refreshing={loading}
        onRefresh={fetchPrograms}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f' },
  list: { padding: 20, paddingBottom: 40 },
  header: { marginBottom: 20 },
  greeting: { color: '#ffffff', fontSize: 20, fontWeight: '700', textTransform: 'capitalize' },
  level: { color: '#888', fontSize: 14, marginTop: 4, textTransform: 'capitalize' },
  generateBtn: {
    backgroundColor: '#6366f1',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
  },
  generateBtnDisabled: { backgroundColor: '#4338ca', opacity: 0.7 },
  generateBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  generateBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  proBadge: {
    backgroundColor: '#a78bfa',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  proBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  manualBtn: {
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    marginBottom: 28,
  },
  manualBtnText: { color: '#888', fontSize: 14, fontWeight: '600' },
  sectionTitle: {
    color: '#888',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardName: { color: '#ffffff', fontSize: 15, fontWeight: '600', flex: 1, marginRight: 8 },
  deleteBtn: { color: '#555', fontSize: 14 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: {
    backgroundColor: '#6366f122',
    borderColor: '#6366f1',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: { color: '#a78bfa', fontSize: 12, fontWeight: '600' },
  cardDate: { color: '#555', fontSize: 12, marginLeft: 'auto' },
  empty: { alignItems: 'center', paddingTop: 20 },
  emptyTitle: { color: '#555', fontSize: 16, fontWeight: '600', marginBottom: 8 },
  emptyText: { color: '#444', fontSize: 13, textAlign: 'center', lineHeight: 20 },
});
