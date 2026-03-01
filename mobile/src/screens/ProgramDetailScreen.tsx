import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../navigation/HomeNavigator';
import { useProgramStore, type Program, type ProgramDay, type ProgramExercise } from '../store/programStore';

type Props = NativeStackScreenProps<HomeStackParamList, 'ProgramDetail'>;

function ExerciseRow({ ex }: { ex: ProgramExercise }) {
  return (
    <View style={styles.exRow}>
      <View style={styles.exInfo}>
        <Text style={styles.exName}>{ex.name}</Text>
        {ex.notes ? <Text style={styles.exNotes}>{ex.notes}</Text> : null}
      </View>
      <View style={styles.exStats}>
        <Text style={styles.exSets}>{ex.sets} × {ex.reps}</Text>
        <Text style={styles.exRest}>{ex.rest_seconds}s rest</Text>
      </View>
    </View>
  );
}

function DayCard({ day }: { day: ProgramDay }) {
  return (
    <View style={styles.dayCard}>
      <View style={styles.dayHeader}>
        <View style={styles.dayBadge}>
          <Text style={styles.dayBadgeText}>Day {day.day}</Text>
        </View>
        <View>
          <Text style={styles.dayName}>{day.name}</Text>
          {day.focus ? <Text style={styles.dayFocus}>{day.focus}</Text> : null}
        </View>
      </View>
      {(day.exercises ?? []).map((ex, i) => (
        <ExerciseRow key={i} ex={ex} />
      ))}
    </View>
  );
}

export default function ProgramDetailScreen({ route }: Props) {
  const { programId } = route.params;
  const { fetchProgramById } = useProgramStore();
  const [program, setProgram] = useState<Program | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const data = await fetchProgramById(programId);
      if (data) {
        setProgram(data);
      } else {
        setError('Failed to load program.');
      }
      setLoading(false);
    })();
  }, [programId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading program...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !program) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error ?? 'Program not found.'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Text style={styles.title}>{program.name}</Text>
        <View style={styles.metaRow}>
          <View style={styles.metaBadge}>
            <Text style={styles.metaText}>{program.weeks} weeks</Text>
          </View>
          <View style={styles.metaBadge}>
            <Text style={styles.metaText}>{program.days_per_week}x / week</Text>
          </View>
        </View>

        {/* Coach notes */}
        {program.notes ? (
          <View style={styles.notesBox}>
            <Text style={styles.notesLabel}>Coach Notes</Text>
            <Text style={styles.notesText}>{program.notes}</Text>
          </View>
        ) : null}

        {/* Days */}
        <Text style={styles.sectionTitle}>Weekly Schedule</Text>
        {(program.schedule ?? []).map((day) => (
          <DayCard key={day.day} day={day} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f' },
  content: { padding: 20, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { color: '#888', marginTop: 12, fontSize: 14 },
  errorText: { color: '#ef4444', fontSize: 15, textAlign: 'center' },
  title: { color: '#ffffff', fontSize: 22, fontWeight: '700', marginBottom: 10 },
  metaRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  metaBadge: {
    backgroundColor: '#6366f122',
    borderColor: '#6366f1',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  metaText: { color: '#a78bfa', fontSize: 13, fontWeight: '600' },
  notesBox: {
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  notesLabel: { color: '#888', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 6 },
  notesText: { color: '#d1d5db', fontSize: 14, lineHeight: 20 },
  sectionTitle: { color: '#888', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  dayCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  dayHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12, gap: 12 },
  dayBadge: {
    backgroundColor: '#6366f1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  dayBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  dayName: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
  dayFocus: { color: '#888', fontSize: 12, marginTop: 2 },
  exRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
  },
  exInfo: { flex: 1, marginRight: 12 },
  exName: { color: '#e5e7eb', fontSize: 14, fontWeight: '500' },
  exNotes: { color: '#6b7280', fontSize: 12, marginTop: 2 },
  exStats: { alignItems: 'flex-end' },
  exSets: { color: '#a78bfa', fontSize: 13, fontWeight: '600' },
  exRest: { color: '#555', fontSize: 11, marginTop: 2 },
});
