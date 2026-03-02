import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../navigation/HomeNavigator';
import { useWorkoutStore, type ActiveSet } from '../store/workoutStore';
import { getExerciseGifUrl, hasExerciseImages } from '../lib/exerciseImages';

type Props = NativeStackScreenProps<HomeStackParamList, 'Workout'>;

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m + ':' + String(s).padStart(2, '0');
}

function groupSets(sets: ActiveSet[]): { slug: string; name: string; sets: ActiveSet[] }[] {
  const map = new Map<string, { slug: string; name: string; sets: ActiveSet[] }>();
  for (const s of sets) {
    if (!map.has(s.exercise_slug)) {
      map.set(s.exercise_slug, { slug: s.exercise_slug, name: s.exercise_name, sets: [] });
    }
    map.get(s.exercise_slug)!.sets.push(s);
  }
  return Array.from(map.values());
}

// ── Exercise Demo Modal ──────────────────────────────────────────────────────
function ExerciseDemoModal({
  slug, name, visible, onClose,
}: {
  slug: string; name: string; visible: boolean; onClose: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const gifUrl = getExerciseGifUrl(slug);

  useEffect(() => {
    if (visible) { setLoading(true); setError(false); }
  }, [visible, slug]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={modalStyles.overlay}>
        <View style={modalStyles.card}>
          <Text style={modalStyles.title}>{name}</Text>
          <View style={modalStyles.imageContainer}>
            {loading && !error && (
              <View style={modalStyles.placeholder}><ActivityIndicator size="large" color="#6366f1" /></View>
            )}
            {error && (
              <View style={modalStyles.placeholder}><Text style={modalStyles.errorText}>Image non disponible</Text></View>
            )}
            {gifUrl && !error && (
              <Image
                source={{ uri: gifUrl }}
                style={[modalStyles.image, loading && { opacity: 0 }]}
                resizeMode="contain"
                onLoad={() => setLoading(false)}
                onError={() => { setLoading(false); setError(true); }}
              />
            )}
            {!gifUrl && (
              <View style={modalStyles.placeholder}><Text style={modalStyles.errorText}>Image non disponible</Text></View>
            )}
          </View>
          <TouchableOpacity style={modalStyles.closeBtn} onPress={onClose}>
            <Text style={modalStyles.closeBtnText}>Fermer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ── Main Screen ──────────────────────────────────────────────────────────────
export default function WorkoutScreen({ navigation }: Props) {
  const {
    activeDay,
    activeSets,
    saving,
    finishWorkout,
    cancelWorkout,
    toggleSet,
    updateSetReps,
    updateSetWeight,
  } = useWorkoutStore();

  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [demoSlug, setDemoSlug] = useState<string | null>(null);
  const [demoName, setDemoName] = useState('');

  useEffect(() => {
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const openDemo = useCallback((slug: string, name: string) => { setDemoName(name); setDemoSlug(slug); }, []);
  const closeDemo = useCallback(() => setDemoSlug(null), []);

  const handleFinish = () => {
    Alert.alert('Terminer la seance ?', 'Votre progression sera sauvegardee.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Terminer', style: 'default', onPress: async () => {
          const log = await finishWorkout();
          if (log) {
            navigation.replace('WorkoutAdapt', { logId: log.id });
          } else {
            navigation.goBack();
          }
        },
      },
    ]);
  };

  const handleCancel = () => {
    Alert.alert('Abandonner ?', 'La seance sera perdue.', [
      { text: 'Non', style: 'cancel' },
      { text: 'Oui', style: 'destructive', onPress: () => { cancelWorkout(); navigation.goBack(); } },
    ]);
  };

  if (!activeDay || activeSets.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Preparation de la seance...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const groups = groupSets(activeSets);
  const completedCount = activeSets.filter((s) => s.completed).length;
  const totalCount = activeSets.length;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ExerciseDemoModal slug={demoSlug ?? ''} name={demoName} visible={demoSlug !== null} onClose={closeDemo} />

      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{activeDay.name}</Text>
          <Text style={styles.timer}>{formatDuration(elapsed)}</Text>
        </View>
        <Text style={styles.progress}>{completedCount}/{totalCount}</Text>
        <View style={styles.headerBtns}>
          <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel} disabled={saving}>
            <Text style={styles.cancelBtnText}>Abandon</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.finishBtn} onPress={handleFinish} disabled={saving}>
            {saving
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={styles.finishBtnText}>Terminer</Text>
            }
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {groups.map((group) => (
          <View key={group.slug} style={styles.exerciseCard}>
            {/* Exercise name row */}
            <View style={styles.exerciseHeader}>
              <Text style={styles.exerciseName}>{group.name}</Text>
              {hasExerciseImages(group.slug) && (
                <TouchableOpacity style={styles.voirBtn} onPress={() => openDemo(group.slug, group.name)}>
                  <Text style={styles.voirBtnText}>Voir</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Column headers */}
            <View style={styles.setHeader}>
              <Text style={[styles.colSet, styles.colLabel]}>Serie</Text>
              <Text style={[styles.colKg, styles.colLabel]}>Kg</Text>
              <Text style={[styles.colReps, styles.colLabel]}>Reps</Text>
              <Text style={[styles.colDone, styles.colLabel]}></Text>
            </View>

            {group.sets.map((set) => (
              <View key={set.exercise_slug + '_' + set.set_index} style={styles.setRow}>
                <Text style={[styles.colSet, styles.setIndex]}>{set.set_index + 1}</Text>
                <TextInput
                  style={[styles.colKg, styles.setInput]}
                  keyboardType="decimal-pad"
                  value={set.weight_kg !== null ? String(set.weight_kg) : ''}
                  onChangeText={(v) => updateSetWeight(set.exercise_slug, set.set_index, v === '' ? null : parseFloat(v))}
                  placeholder="-"
                  placeholderTextColor="#555"
                />
                <TextInput
                  style={[styles.colReps, styles.setInput]}
                  keyboardType="number-pad"
                  value={set.reps_done > 0 ? String(set.reps_done) : ''}
                  onChangeText={(v) => updateSetReps(set.exercise_slug, set.set_index, v === '' ? 0 : parseInt(v, 10))}
                  placeholder={set.target_reps}
                  placeholderTextColor="#555"
                />
                <TouchableOpacity
                  style={[styles.colDone, styles.doneBtn, set.completed && styles.doneBtnActive]}
                  onPress={() => toggleSet(set.exercise_slug, set.set_index)}
                >
                  <Text style={[styles.doneBtnText, set.completed && styles.doneBtnTextActive]}>
                    {set.completed ? 'OK' : 'o'}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { color: '#888', fontSize: 15 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#1e1e1e', gap: 8 },
  headerTitle: { color: '#fff', fontSize: 15, fontWeight: '700' },
  timer: { color: '#6366f1', fontSize: 20, fontWeight: '700', marginTop: 1 },
  progress: { color: '#888', fontSize: 13, fontWeight: '600', marginRight: 4 },
  headerBtns: { flexDirection: 'row', gap: 8 },
  cancelBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, borderWidth: 1, borderColor: '#333' },
  cancelBtnText: { color: '#888', fontSize: 12, fontWeight: '600' },
  finishBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, backgroundColor: '#6366f1', minWidth: 72, alignItems: 'center' },
  finishBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  scroll: { padding: 16, paddingBottom: 40 },
  exerciseCard: { backgroundColor: '#1a1a1a', borderRadius: 14, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: '#2a2a2a' },
  exerciseHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  exerciseName: { color: '#fff', fontSize: 15, fontWeight: '700', flex: 1 },
  voirBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, backgroundColor: '#6366f122', borderWidth: 1, borderColor: '#6366f1', marginLeft: 8 },
  voirBtnText: { color: '#6366f1', fontSize: 12, fontWeight: '700' },
  setHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  colSet: { width: 36, textAlign: 'center' },
  colKg: { flex: 1, textAlign: 'center', marginHorizontal: 4 },
  colReps: { flex: 1, textAlign: 'center', marginHorizontal: 4 },
  colDone: { width: 44, alignItems: 'center' },
  colLabel: { color: '#555', fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },
  setRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  setIndex: { color: '#666', fontSize: 14, fontWeight: '600' },
  setInput: { color: '#fff', fontSize: 15, backgroundColor: '#111', borderRadius: 6, borderWidth: 1, borderColor: '#333', paddingVertical: 5, textAlign: 'center' },
  doneBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: '#333', justifyContent: 'center', alignItems: 'center' },
  doneBtnActive: { borderColor: '#22c55e', backgroundColor: '#22c55e22' },
  doneBtnText: { color: '#555', fontSize: 12, fontWeight: '700' },
  doneBtnTextActive: { color: '#22c55e' },
});

const modalStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  card: { backgroundColor: '#1a1a1a', borderRadius: 18, padding: 20, width: '100%', maxWidth: 380, borderWidth: 1, borderColor: '#2a2a2a', alignItems: 'center' },
  title: { color: '#fff', fontSize: 17, fontWeight: '700', marginBottom: 14, textAlign: 'center' },
  imageContainer: { width: '100%', borderRadius: 12, overflow: 'hidden', backgroundColor: '#111', alignItems: 'center', justifyContent: 'center', minHeight: 220, marginBottom: 12 },
  image: { width: '100%', height: 220 },
  placeholder: { height: 220, width: '100%', alignItems: 'center', justifyContent: 'center' },
  errorText: { color: '#555', fontSize: 13 },
  closeBtn: { backgroundColor: '#6366f1', borderRadius: 10, paddingHorizontal: 32, paddingVertical: 10, marginTop: 4 },
  closeBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});