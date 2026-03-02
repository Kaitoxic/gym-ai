import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../navigation/HomeNavigator';
import { apiClient } from '../lib/apiClient';
import { useProgramStore } from '../store/programStore';
import type { ProgramDay, ProgramExercise } from '../store/programStore';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'CreateProgram'>;

const DAYS_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const FOCUS_OPTIONS = ['Chest & Triceps', 'Back & Biceps', 'Legs', 'Shoulders', 'Full Body', 'Push', 'Pull', 'Arms', 'Cardio'];

function ExerciseRow({
  exercise,
  onChange,
  onRemove,
}: {
  exercise: ProgramExercise;
  onChange: (updated: ProgramExercise) => void;
  onRemove: () => void;
}) {
  return (
    <View style={styles.exRow}>
      <View style={styles.exHeader}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          placeholder="Nom de l'exercice"
          placeholderTextColor="#444"
          value={exercise.name}
          onChangeText={(v) => onChange({ ...exercise, name: v, slug: v.toLowerCase().replace(/\s+/g, '-') })}
        />
        <TouchableOpacity onPress={onRemove} style={styles.removeBtn}>
          <Text style={styles.removeBtnText}>✕</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.exMeta}>
        <View style={styles.exField}>
          <Text style={styles.exLabel}>Séries</Text>
          <TextInput
            style={styles.inputSmall}
            keyboardType="number-pad"
            value={String(exercise.sets)}
            onChangeText={(v) => onChange({ ...exercise, sets: parseInt(v) || 3 })}
          />
        </View>
        <View style={styles.exField}>
          <Text style={styles.exLabel}>Reps</Text>
          <TextInput
            style={styles.inputSmall}
            placeholder="8-12"
            placeholderTextColor="#444"
            value={exercise.reps}
            onChangeText={(v) => onChange({ ...exercise, reps: v })}
          />
        </View>
        <View style={styles.exField}>
          <Text style={styles.exLabel}>Repos (s)</Text>
          <TextInput
            style={styles.inputSmall}
            keyboardType="number-pad"
            value={String(exercise.rest_seconds)}
            onChangeText={(v) => onChange({ ...exercise, rest_seconds: parseInt(v) || 90 })}
          />
        </View>
      </View>
    </View>
  );
}

export default function CreateProgramScreen() {
  const navigation = useNavigation<Nav>();
  const { fetchPrograms } = useProgramStore();

  const [name, setName] = useState('Mon Programme');
  const [weeks, setWeeks] = useState('4');
  const [saving, setSaving] = useState(false);

  const [days, setDays] = useState<ProgramDay[]>([
    { day: 1, name: 'Jour 1', focus: 'Full Body', exercises: [] },
  ]);

  const addDay = () => {
    if (days.length >= 7) return;
    setDays((prev) => [
      ...prev,
      { day: prev.length + 1, name: `Jour ${prev.length + 1}`, focus: 'Full Body', exercises: [] },
    ]);
  };

  const removeDay = (index: number) => {
    if (days.length <= 1) return;
    setDays((prev) => prev.filter((_, i) => i !== index).map((d, i) => ({ ...d, day: i + 1 })));
  };

  const updateDay = (index: number, field: keyof ProgramDay, value: any) => {
    setDays((prev) => prev.map((d, i) => i === index ? { ...d, [field]: value } : d));
  };

  const addExercise = (dayIndex: number) => {
    setDays((prev) =>
      prev.map((d, i) =>
        i !== dayIndex
          ? d
          : {
              ...d,
              exercises: [
                ...d.exercises,
                { slug: '', name: '', sets: 3, reps: '8-12', rest_seconds: 90 },
              ],
            }
      )
    );
  };

  const updateExercise = (dayIndex: number, exIndex: number, updated: ProgramExercise) => {
    setDays((prev) =>
      prev.map((d, i) =>
        i !== dayIndex
          ? d
          : { ...d, exercises: d.exercises.map((e, j) => (j === exIndex ? updated : e)) }
      )
    );
  };

  const removeExercise = (dayIndex: number, exIndex: number) => {
    setDays((prev) =>
      prev.map((d, i) =>
        i !== dayIndex ? d : { ...d, exercises: d.exercises.filter((_, j) => j !== exIndex) }
      )
    );
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Erreur', 'Donne un nom à ton programme.');
      return;
    }
    const w = parseInt(weeks) || 4;
    if (days.some((d) => d.exercises.length === 0)) {
      Alert.alert('Attention', 'Chaque jour doit avoir au moins un exercice.');
      return;
    }
    setSaving(true);
    try {
      const res = await apiClient.post<{ data: { id: string; name: string } }>('/programs', {
        name: name.trim(),
        weeks: w,
        days_per_week: days.length,
        schedule: days,
        notes: 'Programme créé manuellement',
      });
      await fetchPrograms();
      navigation.replace('ProgramDetail', {
        programId: res.data.data.id,
        programName: res.data.data.name,
      });
    } catch (err: any) {
      Alert.alert('Erreur', err?.response?.data?.error ?? 'Impossible de sauvegarder.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Créer un programme</Text>

          {/* Program meta */}
          <View style={styles.section}>
            <Text style={styles.label}>Nom du programme</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholderTextColor="#444"
            />
            <Text style={styles.label}>Durée (semaines)</Text>
            <TextInput
              style={styles.inputSmall}
              keyboardType="number-pad"
              value={weeks}
              onChangeText={setWeeks}
            />
          </View>

          {/* Days */}
          {days.map((day, di) => (
            <View key={di} style={styles.dayCard}>
              <View style={styles.dayHeader}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={day.name}
                  onChangeText={(v) => updateDay(di, 'name', v)}
                  placeholderTextColor="#444"
                />
                {days.length > 1 && (
                  <TouchableOpacity onPress={() => removeDay(di)} style={styles.removeBtn}>
                    <Text style={styles.removeBtnText}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Focus selector */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {FOCUS_OPTIONS.map((f) => (
                    <TouchableOpacity
                      key={f}
                      style={[styles.focusChip, day.focus === f && styles.focusChipSelected]}
                      onPress={() => updateDay(di, 'focus', f)}
                    >
                      <Text style={[styles.focusChipText, day.focus === f && styles.focusChipTextSelected]}>
                        {f}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              {/* Exercises */}
              {day.exercises.map((ex, ei) => (
                <ExerciseRow
                  key={ei}
                  exercise={ex}
                  onChange={(updated) => updateExercise(di, ei, updated)}
                  onRemove={() => removeExercise(di, ei)}
                />
              ))}

              <TouchableOpacity style={styles.addExBtn} onPress={() => addExercise(di)}>
                <Text style={styles.addExText}>+ Ajouter un exercice</Text>
              </TouchableOpacity>
            </View>
          ))}

          {days.length < 7 && (
            <TouchableOpacity style={styles.addDayBtn} onPress={addDay}>
              <Text style={styles.addDayText}>+ Ajouter un jour</Text>
            </TouchableOpacity>
          )}

          {/* Save */}
          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveBtnText}>Sauvegarder le programme</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f' },
  scroll: { padding: 20, paddingBottom: 40 },
  title: { color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 20 },

  section: { marginBottom: 20 },
  label: { color: '#888', fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, marginTop: 12 },

  input: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 14,
  },
  inputSmall: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#fff',
    fontSize: 14,
    minWidth: 60,
    textAlign: 'center',
  },

  dayCard: {
    backgroundColor: '#141414',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    padding: 14,
    marginBottom: 14,
  },
  dayHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },

  focusChip: {
    backgroundColor: '#1e1e1e',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  focusChipSelected: { borderColor: '#a78bfa', backgroundColor: '#a78bfa22' },
  focusChipText: { color: '#666', fontSize: 12 },
  focusChipTextSelected: { color: '#a78bfa', fontWeight: '600' },

  exRow: {
    backgroundColor: '#1e1e1e',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  exHeader: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  exMeta: { flexDirection: 'row', gap: 8 },
  exField: { alignItems: 'center', flex: 1 },
  exLabel: { color: '#555', fontSize: 10, marginBottom: 4 },

  removeBtn: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeBtnText: { color: '#888', fontSize: 14 },

  addExBtn: {
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderStyle: 'dashed',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  addExText: { color: '#555', fontSize: 13 },

  addDayBtn: {
    borderWidth: 1,
    borderColor: '#a78bfa44',
    borderStyle: 'dashed',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 20,
  },
  addDayText: { color: '#a78bfa', fontSize: 14, fontWeight: '600' },

  saveBtn: {
    backgroundColor: '#6366f1',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
