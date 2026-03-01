import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../navigation/HomeNavigator';
import { useWorkoutStore, type ActiveSet } from '../store/workoutStore';

type Props = NativeStackScreenProps<HomeStackParamList, 'Workout'>;

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// Groups activeSets by exercise
function groupByExercise(sets: ActiveSet[]): { slug: string; name: string; sets: ActiveSet[] }[] {
  const map = new Map<string, { slug: string; name: string; sets: ActiveSet[] }>();
  for (const s of sets) {
    if (!map.has(s.exercise_slug)) {
      map.set(s.exercise_slug, { slug: s.exercise_slug, name: s.exercise_name, sets: [] });
    }
    map.get(s.exercise_slug)!.sets.push(s);
  }
  return Array.from(map.values());
}

function SetRow({
  s,
  onToggle,
  onRepsChange,
  onWeightChange,
}: {
  s: ActiveSet;
  onToggle: () => void;
  onRepsChange: (v: number) => void;
  onWeightChange: (v: number | null) => void;
}) {
  return (
    <View style={[styles.setRow, s.completed && styles.setRowDone]}>
      <Text style={styles.setLabel}>Set {s.set_index + 1}</Text>
      <Text style={styles.setTarget}>{s.target_reps} reps</Text>

      <TextInput
        style={styles.setInput}
        placeholder="kg"
        placeholderTextColor="#444"
        keyboardType="decimal-pad"
        defaultValue={s.weight_kg != null ? String(s.weight_kg) : ''}
        onEndEditing={(e) => {
          const v = parseFloat(e.nativeEvent.text);
          onWeightChange(isNaN(v) ? null : v);
        }}
      />

      <TextInput
        style={styles.setInput}
        placeholder="reps"
        placeholderTextColor="#444"
        keyboardType="number-pad"
        defaultValue={s.reps_done > 0 ? String(s.reps_done) : ''}
        onEndEditing={(e) => {
          const v = parseInt(e.nativeEvent.text, 10);
          if (!isNaN(v)) onRepsChange(v);
        }}
      />

      <TouchableOpacity
        style={[styles.checkBtn, s.completed && styles.checkBtnDone]}
        onPress={onToggle}
        activeOpacity={0.7}
      >
        <Text style={styles.checkBtnText}>{s.completed ? '✓' : '○'}</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function WorkoutScreen({ navigation }: Props) {
  const { activeDay, activeSets, saving, finishWorkout, cancelWorkout, toggleSet, updateSetReps, updateSetWeight } =
    useWorkoutStore();

  // Elapsed timer
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  if (!activeDay) {
    navigation.goBack();
    return null;
  }

  const groups = groupByExercise(activeSets);
  const completedCount = activeSets.filter((s) => s.completed).length;
  const totalCount = activeSets.length;

  const handleFinish = () => {
    Alert.alert(
      'Finish Workout?',
      `${completedCount}/${totalCount} sets completed.`,
      [
        { text: 'Keep Going', style: 'cancel' },
        {
          text: 'Finish',
          onPress: async () => {
            const log = await finishWorkout();
            if (log) {
              navigation.goBack();
            } else {
              Alert.alert('Error', 'Failed to save workout. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleCancel = () => {
    Alert.alert('Cancel Workout?', 'Progress will be lost.', [
      { text: 'Keep Going', style: 'cancel' },
      { text: 'Cancel Workout', style: 'destructive', onPress: () => { cancelWorkout(); navigation.goBack(); } },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header bar */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{activeDay.name}</Text>
          <Text style={styles.headerTimer}>{formatDuration(elapsed)}</Text>
        </View>
        <View style={styles.progressBadge}>
          <Text style={styles.progressText}>{completedCount}/{totalCount}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {groups.map((group) => (
          <View key={group.slug} style={styles.exerciseBlock}>
            <Text style={styles.exerciseName}>{group.name}</Text>
            <View style={styles.setHeader}>
              <Text style={[styles.setHeaderCell, { flex: 1 }]}>Set</Text>
              <Text style={[styles.setHeaderCell, { width: 64 }]}>Target</Text>
              <Text style={[styles.setHeaderCell, { width: 54 }]}>kg</Text>
              <Text style={[styles.setHeaderCell, { width: 54 }]}>Reps</Text>
              <Text style={[styles.setHeaderCell, { width: 36 }]}></Text>
            </View>
            {group.sets.map((s) => (
              <SetRow
                key={`${s.exercise_slug}-${s.set_index}`}
                s={s}
                onToggle={() => toggleSet(s.exercise_slug, s.set_index)}
                onRepsChange={(v) => updateSetReps(s.exercise_slug, s.set_index, v)}
                onWeightChange={(v) => updateSetWeight(s.exercise_slug, s.set_index, v)}
              />
            ))}
          </View>
        ))}
      </ScrollView>

      {/* Finish button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.finishBtn, saving && styles.finishBtnDisabled]}
          onPress={handleFinish}
          disabled={saving}
          activeOpacity={0.8}
        >
          <Text style={styles.finishBtnText}>
            {saving ? 'Saving...' : 'Finish Workout'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e1e1e',
  },
  cancelText: { color: '#888', fontSize: 15 },
  headerCenter: { alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 15, fontWeight: '700' },
  headerTimer: { color: '#6366f1', fontSize: 13, fontWeight: '600', marginTop: 1 },
  progressBadge: {
    backgroundColor: '#6366f122',
    borderColor: '#6366f1',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  progressText: { color: '#a78bfa', fontSize: 13, fontWeight: '700' },
  content: { padding: 16, paddingBottom: 100 },
  exerciseBlock: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  exerciseName: { color: '#fff', fontSize: 15, fontWeight: '700', marginBottom: 10 },
  setHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  setHeaderCell: { color: '#555', fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
  },
  setRowDone: { opacity: 0.6 },
  setLabel: { flex: 1, color: '#888', fontSize: 13 },
  setTarget: { width: 64, color: '#666', fontSize: 12 },
  setInput: {
    width: 54,
    height: 32,
    backgroundColor: '#262626',
    borderRadius: 6,
    color: '#fff',
    fontSize: 13,
    textAlign: 'center',
    marginRight: 6,
  },
  checkBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkBtnDone: { backgroundColor: '#6366f1', borderColor: '#6366f1' },
  checkBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 28,
    backgroundColor: '#0f0f0f',
    borderTopWidth: 1,
    borderTopColor: '#1e1e1e',
  },
  finishBtn: {
    backgroundColor: '#22c55e',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  finishBtnDisabled: { backgroundColor: '#15803d', opacity: 0.7 },
  finishBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
