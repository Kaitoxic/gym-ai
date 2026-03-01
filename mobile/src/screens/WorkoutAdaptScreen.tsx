import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../navigation/HomeNavigator';
import { useWorkoutStore } from '../store/workoutStore';
import { apiClient } from '../lib/apiClient';

type Props = NativeStackScreenProps<HomeStackParamList, 'WorkoutAdapt'>;

interface Suggestion {
  exercise_name: string;
  exercise_slug: string;
  current_weight_kg: number | null;
  current_reps_done: number;
  sets_completed: number;
  sets_total: number;
  action: 'increase_weight' | 'increase_reps' | 'maintain' | 'deload';
  new_weight_kg: number | null;
  new_reps: string;
  rationale: string;
}

const ACTION_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  increase_weight: { label: 'Augmente le poids', color: '#22c55e', icon: '↑' },
  increase_reps: { label: 'Augmente les reps', color: '#22c55e', icon: '↑' },
  maintain: { label: 'Maintiens', color: '#f59e0b', icon: '=' },
  deload: { label: 'Décharge', color: '#ef4444', icon: '↓' },
};

export default function WorkoutAdaptScreen({ navigation, route }: Props) {
  const { logId } = route.params;
  const { history } = useWorkoutStore();
  const log = history.find((h) => h.id === logId) ?? history[0];

  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!log) {
      setLoading(false);
      return;
    }
    apiClient
      .post<{ suggestions: Suggestion[] }>('/workouts/adapt', {
        day_name: log.day_name,
        sets_done: log.sets_done,
      })
      .then((res) => {
        setSuggestions(res.data.suggestions ?? []);
        setLoading(false);
      })
      .catch(() => {
        setError("Impossible de charger les suggestions IA. Réessaie plus tard.");
        setLoading(false);
      });
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Prochaine séance</Text>
        {log && <Text style={styles.subtitle}>{log.day_name}</Text>}

        {loading && (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color="#a78bfa" size="large" />
            <Text style={styles.loadingText}>L'IA analyse ta performance...</Text>
          </View>
        )}

        {error && <Text style={styles.errorText}>{error}</Text>}

        {!loading && !error && suggestions.length === 0 && (
          <Text style={styles.emptyText}>Aucune suggestion disponible.</Text>
        )}

        {!loading && suggestions.map((s, i) => {
          const cfg = ACTION_CONFIG[s.action] ?? ACTION_CONFIG.maintain;
          return (
            <View key={i} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.exName}>{s.exercise_name}</Text>
                <View style={[styles.badge, { borderColor: cfg.color }]}>
                  <Text style={[styles.badgeText, { color: cfg.color }]}>
                    {cfg.icon} {cfg.label}
                  </Text>
                </View>
              </View>

              <View style={styles.statsRow}>
                <Text style={styles.statItem}>
                  {s.sets_completed}/{s.sets_total} séries
                </Text>
                {s.current_weight_kg != null && (
                  <Text style={styles.statItem}>Actuel : {s.current_weight_kg} kg</Text>
                )}
              </View>

              <View style={styles.nextRow}>
                <Text style={styles.nextLabel}>Objectif : </Text>
                <Text style={styles.nextValue}>
                  {s.new_weight_kg != null ? `${s.new_weight_kg} kg — ` : ''}
                  {s.new_reps} reps
                </Text>
              </View>

              <Text style={styles.rationale}>{s.rationale}</Text>
            </View>
          );
        })}

        <TouchableOpacity
          style={styles.doneBtn}
          onPress={() => navigation.popToTop()}
          activeOpacity={0.8}
        >
          <Text style={styles.doneBtnText}>Terminer</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f' },
  scroll: { padding: 16, paddingBottom: 40 },

  title: { color: '#fff', fontSize: 24, fontWeight: '700', marginBottom: 4 },
  subtitle: { color: '#a78bfa', fontSize: 15, fontWeight: '600', marginBottom: 24 },

  loadingWrap: { alignItems: 'center', marginTop: 60, gap: 16 },
  loadingText: { color: '#888', fontSize: 14 },

  errorText: { color: '#ef4444', fontSize: 14, textAlign: 'center', marginTop: 40 },
  emptyText: { color: '#555', fontSize: 14, textAlign: 'center', marginTop: 40 },

  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  exName: { color: '#fff', fontSize: 15, fontWeight: '700', flex: 1 },
  badge: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: { fontSize: 11, fontWeight: '700' },

  statsRow: { flexDirection: 'row', gap: 16, marginBottom: 8 },
  statItem: { color: '#666', fontSize: 12 },

  nextRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  nextLabel: { color: '#888', fontSize: 13 },
  nextValue: { color: '#fff', fontSize: 13, fontWeight: '700' },

  rationale: {
    color: '#666',
    fontSize: 12,
    lineHeight: 18,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
    paddingTop: 8,
    marginTop: 4,
  },

  doneBtn: {
    backgroundColor: '#a78bfa',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  doneBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
