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
import { getExerciseImageUrl, hasExerciseImages } from '../lib/exerciseImages';

type Props = NativeStackScreenProps<HomeStackParamList, 'Workout'>;

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

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

function ExerciseDemoModal({
  slug, name, visible, onClose,
}: {
  slug: string; name: string; visible: boolean; onClose: () => void;
}) {
  const [frame, setFrame] = useState<0 | 1>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const url0 = getExerciseImageUrl(slug, 0);
  const url1 = getExerciseImageUrl(slug, 1);
  const currentUrl = frame === 0 ? url0 : url1;

  useEffect(() => {
    if (!visible) { if (intervalRef.current) clearInterval(intervalRef.current); return; }
    setFrame(0); setLoading(true); setError(false);
    intervalRef.current = setInterval(() => { setFrame((f) => (f === 0 ? 1 : 0)); }, 1200);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
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
            {!error && currentUrl && (
              <Image
                source={{ uri: currentUrl }}
                style={[modalStyles.image, loading && { opacity: 0 }]}
                resizeMode="contain"
                onLoad={() => setLoading(false)}
                onError={() => { setLoading(false); setError(true); }}
              />
            )}
            {!loading && !error && (
              <View style={modalStyles.dots}>
                <View style={[modalStyles.dot, frame === 0 && modalStyles.dotActive]} />
                <View style={[modalStyles.dot, frame === 1 && modalStyles.dotActive]} />
              </View>
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

export default function WorkoutScreen({ route, navigation }: Props) {
  const { workoutId } = route.params;
  const { activeWorkout, isLoading, startWorkout, updateSet, addSet, removeSet, finishWorkout, cancelWorkout } = useWorkoutStore();
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [demoSlug, setDemoSlug] = useState<string | null>(null);
  const [demoName, setDemoName] = useState('');

  useEffect(() => { startWorkout(workoutId); }, [workoutId]);

  useEffect(() => {
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const openDemo = useCallback((slug: string, name: string) => { setDemoName(name); setDemoSlug(slug); }, []);
  const closeDemo = useCallback(() => setDemoSlug(null), []);

  const handleFinish = () => {
    Alert.alert('Terminer la seance ?', 'Votre progression sera sauvegardee.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Terminer', style: 'default', onPress: async () => { await finishWorkout(); navigation.goBack(); } },
    ]);
  };

  const handleCancel = () => {
    Alert.alert('Abandonner ?', 'La seance sera perdue.', [
      { text: 'Non', style: 'cancel' },
      { text: 'Oui', style: 'destructive', onPress: () => { cancelWorkout(); navigation.goBack(); } },
    ]);
  };

  if (isLoading || !activeWorkout) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Preparation...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const groups = groupByExercise(activeWorkout.sets);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ExerciseDemoModal slug={demoSlug ?? ''} name={demoName} visible={demoSlug !== null} onClose={closeDemo} />
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>{activeWorkout.name}</Text>
          <Text style={styles.timer}>{formatDuration(elapsed)}</Text>
        </View>
        <View style={styles.headerBtns}>
          <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
            <Text style={styles.cancelBtnText}>Abandon</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.finishBtn} onPress={handleFinish}>
            <Text style={styles.finishBtnText}>Terminer</Text>
          </TouchableOpacity>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {groups.map((group) => (
          <View key={group.slug} style={styles.exerciseCard}>
            <View style={styles.exerciseHeader}>
              <Text style={styles.exerciseName}>{group.name}</Text>
              {hasExerciseImages(group.slug) && (
                <TouchableOpacity style={styles.voirBtn} onPress={() => openDemo(group.slug, group.name)}>
                  <Text style={styles.voirBtnText}>Voir</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.setHeader}>
              <Text style={[styles.setCol, styles.setColLabel]}>Serie</Text>
              <Text style={[styles.setCol, styles.setColLabel]}>Kg</Text>
              <Text style={[styles.setCol, styles.setColLabel]}>Reps</Text>
              <Text style={[styles.setCol, styles.setColLabel]}></Text>
            </View>
            {group.sets.map((set, idx) => (
              <View key={set.id} style={styles.setRow}>
                <Text style={[styles.setCol, styles.setIndex]}>{idx + 1}</Text>
                <TextInput
                  style={[styles.setCol, styles.setInput]}
                  keyboardType="decimal-pad"
                  value={set.weight_kg !== null ? String(set.weight_kg) : ''}
                  onChangeText={(v) => updateSet(set.id, { weight_kg: v === '' ? null : parseFloat(v) })}
                  placeholder="—"
                  placeholderTextColor="#555"
                />
                <TextInput
                  style={[styles.setCol, styles.setInput]}
                  keyboardType="number-pad"
                  value={set.reps !== null ? String(set.reps) : ''}
                  onChangeText={(v) => updateSet(set.id, { reps: v === '' ? null : parseInt(v, 10) })}
                  placeholder="—"
                  placeholderTextColor="#555"
                />
                <TouchableOpacity style={styles.setCol} onPress={() => removeSet(set.id)}>
                  <Text style={styles.removeText}>x</Text>
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity style={styles.addSetBtn} onPress={() => addSet(group.slug, group.name)}>
              <Text style={styles.addSetText}>+ Ajouter une serie</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { color: '#888', fontSize: 15 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1e1e1e' },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '700' },
  timer: { color: '#6366f1', fontSize: 22, fontWeight: '700', marginTop: 2 },
  headerBtns: { flexDirection: 'row', gap: 8 },
  cancelBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#333' },
  cancelBtnText: { color: '#888', fontSize: 13, fontWeight: '600' },
  finishBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: '#6366f1' },
  finishBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  scroll: { padding: 16, paddingBottom: 40 },
  exerciseCard: { backgroundColor: '#1a1a1a', borderRadius: 14, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#2a2a2a' },
  exerciseHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  exerciseName: { color: '#fff', fontSize: 15, fontWeight: '700', flex: 1 },
  voirBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, backgroundColor: '#6366f122', borderWidth: 1, borderColor: '#6366f1', marginLeft: 8 },
  voirBtnText: { color: '#6366f1', fontSize: 12, fontWeight: '700' },
  setHeader: { flexDirection: 'row', marginBottom: 6 },
  setCol: { flex: 1, textAlign: 'center' },
  setColLabel: { color: '#555', fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },
  setRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  setIndex: { color: '#666', fontSize: 14 },
  setInput: { color: '#fff', fontSize: 15, backgroundColor: '#111', borderRadius: 6, borderWidth: 1, borderColor: '#333', paddingVertical: 6, marginHorizontal: 4, textAlign: 'center' },
  removeText: { color: '#ef4444', fontSize: 15, textAlign: 'center' },
  addSetBtn: { marginTop: 6, alignItems: 'center', paddingVertical: 8 },
  addSetText: { color: '#6366f1', fontSize: 13, fontWeight: '600' },
});

const modalStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  card: { backgroundColor: '#1a1a1a', borderRadius: 18, padding: 20, width: '100%', maxWidth: 380, borderWidth: 1, borderColor: '#2a2a2a', alignItems: 'center' },
  title: { color: '#fff', fontSize: 17, fontWeight: '700', marginBottom: 14, textAlign: 'center' },
  imageContainer: { width: '100%', borderRadius: 12, overflow: 'hidden', backgroundColor: '#111', alignItems: 'center', justifyContent: 'center', minHeight: 220, marginBottom: 12 },
  image: { width: '100%', height: 220 },
  placeholder: { height: 220, width: '100%', alignItems: 'center', justifyContent: 'center' },
  errorText: { color: '#555', fontSize: 13 },
  dots: { flexDirection: 'row', gap: 6, paddingVertical: 8 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#333' },
  dotActive: { backgroundColor: '#6366f1' },
  closeBtn: { backgroundColor: '#6366f1', borderRadius: 10, paddingHorizontal: 32, paddingVertical: 10, marginTop: 4 },
  closeBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});