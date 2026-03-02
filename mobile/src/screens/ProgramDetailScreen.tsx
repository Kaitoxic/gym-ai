import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  TextInput,
  FlatList,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackScreenProps, NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../navigation/HomeNavigator';
import { useProgramStore, type Program, type ProgramDay, type ProgramExercise } from '../store/programStore';
import { useWorkoutStore } from '../store/workoutStore';
import { useExerciseStore, type Exercise } from '../store/exerciseStore';

type Props = NativeStackScreenProps<HomeStackParamList, 'ProgramDetail'>;
type Nav = NativeStackNavigationProp<HomeStackParamList, 'ProgramDetail'>;

// ─── Exercise Picker Modal ────────────────────────────────────────────────────

interface PickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (ex: ProgramExercise) => void;
  currentExercise: ProgramExercise;
}

function ExercisePickerModal({ visible, onClose, onSelect, currentExercise }: PickerProps) {
  const { exercises, loading: exLoading, fetchExercises, setSearchQuery, searchQuery, getFiltered } = useExerciseStore();
  const [customMode, setCustomMode] = useState(false);
  const [customName, setCustomName] = useState('');
  const searchRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      fetchExercises();
      setSearchQuery('');
      setCustomMode(false);
      setCustomName('');
    }
  }, [visible]);

  const filtered = getFiltered();

  const handleSelectExercise = useCallback((ex: Exercise) => {
    onSelect({
      slug: ex.slug,
      name: ex.name,
      sets: currentExercise.sets,
      reps: currentExercise.reps,
      rest_seconds: currentExercise.rest_seconds,
      notes: currentExercise.notes,
    });
  }, [currentExercise, onSelect]);

  const handleCustomConfirm = useCallback(() => {
    const trimmed = customName.trim();
    if (!trimmed) {
      Alert.alert('Nom requis', 'Entrez un nom pour votre exercice personnalise.');
      return;
    }
    const slug = trimmed.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    onSelect({
      slug,
      name: trimmed,
      sets: currentExercise.sets,
      reps: currentExercise.reps,
      rest_seconds: currentExercise.rest_seconds,
      notes: currentExercise.notes,
    });
  }, [customName, currentExercise, onSelect]);

  const renderExercise = ({ item }: { item: Exercise }) => (
    <TouchableOpacity style={pickerStyles.exerciseItem} onPress={() => handleSelectExercise(item)} activeOpacity={0.7}>
      <Text style={pickerStyles.exerciseName}>{item.name}</Text>
      <Text style={pickerStyles.exerciseMeta}>
        {item.muscle_groups.join(', ')} {item.equipment.length > 0 ? '· ' + item.equipment[0] : ''}
      </Text>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={pickerStyles.container}>
        {/* Header */}
        <View style={pickerStyles.header}>
          <Text style={pickerStyles.headerTitle}>Choisir un exercice</Text>
          <TouchableOpacity onPress={onClose} style={pickerStyles.closeBtn}>
            <Text style={pickerStyles.closeBtnText}>Annuler</Text>
          </TouchableOpacity>
        </View>

        {!customMode ? (
          <>
            {/* Search */}
            <View style={pickerStyles.searchRow}>
              <TextInput
                ref={searchRef}
                style={pickerStyles.searchInput}
                placeholder="Rechercher..."
                placeholderTextColor="#555"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCorrect={false}
              />
            </View>

            {exLoading && exercises.length === 0 ? (
              <View style={pickerStyles.centered}>
                <ActivityIndicator size="large" color="#6366f1" />
              </View>
            ) : (
              <FlatList
                data={filtered}
                keyExtractor={(item) => item.slug}
                renderItem={renderExercise}
                keyboardShouldPersistTaps="handled"
                ListEmptyComponent={
                  <View style={pickerStyles.centered}>
                    <Text style={pickerStyles.emptyText}>Aucun exercice trouve.</Text>
                  </View>
                }
                ListFooterComponent={
                  <TouchableOpacity style={pickerStyles.customBtn} onPress={() => setCustomMode(true)}>
                    <Text style={pickerStyles.customBtnText}>+ Exercice personnalise</Text>
                  </TouchableOpacity>
                }
              />
            )}
          </>
        ) : (
          /* Custom exercise input */
          <View style={pickerStyles.customForm}>
            <Text style={pickerStyles.customLabel}>Nom de l&apos;exercice</Text>
            <TextInput
              style={pickerStyles.customInput}
              placeholder="ex: Curl marteau incline..."
              placeholderTextColor="#555"
              value={customName}
              onChangeText={setCustomName}
              autoFocus
              autoCorrect={false}
            />
            <TouchableOpacity style={pickerStyles.confirmBtn} onPress={handleCustomConfirm}>
              <Text style={pickerStyles.confirmBtnText}>Confirmer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={pickerStyles.backBtn} onPress={() => setCustomMode(false)}>
              <Text style={pickerStyles.backBtnText}>Retour</Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

// ─── Exercise Row ─────────────────────────────────────────────────────────────

interface ExerciseRowProps {
  ex: ProgramExercise;
  editMode: boolean;
  onSwap: () => void;
}

function ExerciseRow({ ex, editMode, onSwap }: ExerciseRowProps) {
  return (
    <View style={styles.exRow}>
      <View style={styles.exInfo}>
        <Text style={styles.exName}>{ex.name}</Text>
        {ex.notes ? <Text style={styles.exNotes}>{ex.notes}</Text> : null}
      </View>
      <View style={styles.exRight}>
        <View style={styles.exStats}>
          <Text style={styles.exSets}>{ex.sets} x {ex.reps}</Text>
          <Text style={styles.exRest}>{ex.rest_seconds}s rest</Text>
        </View>
        {editMode && (
          <TouchableOpacity style={styles.swapBtn} onPress={onSwap} activeOpacity={0.7}>
            <Text style={styles.swapBtnText}>Changer</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ─── Day Card ─────────────────────────────────────────────────────────────────

interface DayCardProps {
  day: ProgramDay;
  dayIndex: number;
  programId: string;
  editMode: boolean;
  onRequestSwap: (dayIndex: number, exerciseIndex: number, currentExercise: ProgramExercise) => void;
}

function DayCard({ day, dayIndex, programId, editMode, onRequestSwap }: DayCardProps) {
  const navigation = useNavigation<Nav>();
  const { startWorkout } = useWorkoutStore();

  const handleStart = () => {
    startWorkout(day, programId);
    navigation.navigate('Workout');
  };

  return (
    <View style={styles.dayCard}>
      <View style={styles.dayHeader}>
        <View style={styles.dayBadge}>
          <Text style={styles.dayBadgeText}>Day {day.day}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.dayName}>{day.name}</Text>
          {day.focus ? <Text style={styles.dayFocus}>{day.focus}</Text> : null}
        </View>
        {!editMode && (
          <TouchableOpacity style={styles.startBtn} onPress={handleStart} activeOpacity={0.8}>
            <Text style={styles.startBtnText}>Start</Text>
          </TouchableOpacity>
        )}
      </View>
      {(day.exercises ?? []).map((ex, i) => (
        <ExerciseRow
          key={i}
          ex={ex}
          editMode={editMode}
          onSwap={() => onRequestSwap(dayIndex, i, ex)}
        />
      ))}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ProgramDetailScreen({ route }: Props) {
  const { programId } = route.params;
  const { fetchProgramById, updateProgramExercise } = useProgramStore();
  const [program, setProgram] = useState<Program | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit mode state
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);

  // Picker state
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<{
    dayIndex: number;
    exerciseIndex: number;
    currentExercise: ProgramExercise;
  } | null>(null);

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

  const handleRequestSwap = useCallback((dayIndex: number, exerciseIndex: number, currentExercise: ProgramExercise) => {
    setPickerTarget({ dayIndex, exerciseIndex, currentExercise });
    setPickerVisible(true);
  }, []);

  const handlePickerSelect = useCallback(async (newExercise: ProgramExercise) => {
    if (!pickerTarget || !program) return;
    setPickerVisible(false);
    setSaving(true);

    const updated = await updateProgramExercise(
      program.id,
      pickerTarget.dayIndex,
      pickerTarget.exerciseIndex,
      newExercise
    );

    if (updated) {
      setProgram(updated);
    } else {
      Alert.alert('Erreur', 'La modification n\'a pas pu etre sauvegardee.');
    }
    setSaving(false);
    setPickerTarget(null);
  }, [pickerTarget, program, updateProgramExercise]);

  const handlePickerClose = useCallback(() => {
    setPickerVisible(false);
    setPickerTarget(null);
  }, []);

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
      {pickerTarget && (
        <ExercisePickerModal
          visible={pickerVisible}
          onClose={handlePickerClose}
          onSelect={handlePickerSelect}
          currentExercise={pickerTarget.currentExercise}
        />
      )}

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.titleRow}>
          <Text style={styles.title}>{program.name}</Text>
          <TouchableOpacity
            style={[styles.editBtn, editMode && styles.editBtnActive]}
            onPress={() => setEditMode((v) => !v)}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={[styles.editBtnText, editMode && styles.editBtnTextActive]}>
                  {editMode ? 'Terminer' : 'Modifier'}
                </Text>
            }
          </TouchableOpacity>
        </View>

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

        {/* Edit mode banner */}
        {editMode && (
          <View style={styles.editBanner}>
            <Text style={styles.editBannerText}>Mode edition — appuyez sur "Changer" pour remplacer un exercice</Text>
          </View>
        )}

        {/* Days */}
        <Text style={styles.sectionTitle}>Weekly Schedule</Text>
        {(program.schedule ?? []).map((day, dayIndex) => (
          <DayCard
            key={day.day}
            day={day}
            dayIndex={dayIndex}
            programId={program.id}
            editMode={editMode}
            onRequestSwap={handleRequestSwap}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f' },
  content: { padding: 20, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { color: '#888', marginTop: 12, fontSize: 14 },
  errorText: { color: '#ef4444', fontSize: 15, textAlign: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  title: { color: '#ffffff', fontSize: 22, fontWeight: '700', flex: 1, marginRight: 12 },
  editBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#6366f1',
    minWidth: 80,
    alignItems: 'center',
  },
  editBtnActive: { backgroundColor: '#6366f1' },
  editBtnText: { color: '#6366f1', fontSize: 13, fontWeight: '700' },
  editBtnTextActive: { color: '#fff' },
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
  editBanner: {
    backgroundColor: '#6366f122',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#6366f1',
    padding: 10,
    marginBottom: 16,
  },
  editBannerText: { color: '#a78bfa', fontSize: 13, textAlign: 'center' },
  sectionTitle: { color: '#888', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  dayCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  dayHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 10 },
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
  startBtn: {
    backgroundColor: '#22c55e',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  startBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  exRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
  },
  exInfo: { flex: 1, marginRight: 10 },
  exName: { color: '#e5e7eb', fontSize: 14, fontWeight: '500' },
  exNotes: { color: '#6b7280', fontSize: 12, marginTop: 2 },
  exRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  exStats: { alignItems: 'flex-end' },
  exSets: { color: '#a78bfa', fontSize: 13, fontWeight: '600' },
  exRest: { color: '#555', fontSize: 11, marginTop: 2 },
  swapBtn: {
    backgroundColor: '#6366f122',
    borderWidth: 1,
    borderColor: '#6366f1',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  swapBtnText: { color: '#6366f1', fontSize: 11, fontWeight: '700' },
});

const pickerStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '700' },
  closeBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  closeBtnText: { color: '#6366f1', fontSize: 15 },
  searchRow: { paddingHorizontal: 16, paddingVertical: 10 },
  searchInput: {
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 15,
  },
  exerciseItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  exerciseName: { color: '#e5e7eb', fontSize: 15, fontWeight: '500' },
  exerciseMeta: { color: '#6b7280', fontSize: 12, marginTop: 2 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyText: { color: '#555', fontSize: 14 },
  customBtn: {
    margin: 16,
    paddingVertical: 14,
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#6366f1',
    alignItems: 'center',
  },
  customBtnText: { color: '#6366f1', fontSize: 15, fontWeight: '700' },
  customForm: { padding: 20, gap: 16 },
  customLabel: { color: '#888', fontSize: 13, fontWeight: '600', textTransform: 'uppercase' },
  customInput: {
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 16,
  },
  confirmBtn: {
    backgroundColor: '#6366f1',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  confirmBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  backBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  backBtnText: { color: '#888', fontSize: 14 },
});
