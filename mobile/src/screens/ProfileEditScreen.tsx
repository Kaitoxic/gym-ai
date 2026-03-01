import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from '../navigation/ProfileNavigator';
import { useProfileStore } from '../store/profileStore';

type Props = NativeStackScreenProps<ProfileStackParamList, 'ProfileEdit'>;

// ─── Constants ────────────────────────────────────────────────────

const GOALS = [
  { value: 'muscle_gain', label: 'Prise de masse' },
  { value: 'fat_loss', label: 'Sèche' },
  { value: 'endurance', label: 'Endurance' },
  { value: 'general_fitness', label: 'Forme générale' },
] as const;

const LEVELS = [
  { value: 'beginner', label: 'Débutant' },
  { value: 'intermediate', label: 'Intermédiaire' },
  { value: 'advanced', label: 'Avancé' },
] as const;

const DAYS = [
  { value: 1, label: 'Lun' },
  { value: 2, label: 'Mar' },
  { value: 3, label: 'Mer' },
  { value: 4, label: 'Jeu' },
  { value: 5, label: 'Ven' },
  { value: 6, label: 'Sam' },
  { value: 0, label: 'Dim' },
];

const EQUIPMENT_OPTIONS = [
  { value: 'barbell', label: 'Barre' },
  { value: 'dumbbells', label: 'Haltères' },
  { value: 'cables', label: 'Cables' },
  { value: 'machines', label: 'Machines' },
  { value: 'kettlebell', label: 'Kettlebell' },
  { value: 'resistance_bands', label: 'Élastiques' },
  { value: 'pull_up_bar', label: 'Barre de traction' },
  { value: 'bodyweight', label: 'Poids de corps' },
];

// ─── Section title ─────────────────────────────────────────────────

function SectionLabel({ text }: { text: string }) {
  return <Text style={styles.sectionLabel}>{text}</Text>;
}

// ─── Select row buttons ────────────────────────────────────────────

function SelectGroup<T extends string | number>({
  options,
  value,
  onChange,
  color = '#a78bfa',
}: {
  options: readonly { value: T; label: string }[];
  value: T | undefined;
  onChange: (v: T) => void;
  color?: string;
}) {
  return (
    <View style={styles.selectRow}>
      {options.map((o) => {
        const sel = o.value === value;
        return (
          <TouchableOpacity
            key={String(o.value)}
            style={[styles.selectBtn, sel && { borderColor: color, backgroundColor: color + '18' }]}
            onPress={() => onChange(o.value)}
            activeOpacity={0.7}
          >
            <Text style={[styles.selectBtnText, sel && { color }]}>{o.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── Multi-select ──────────────────────────────────────────────────

function MultiSelect<T extends string | number>({
  options,
  values,
  onChange,
  color = '#a78bfa',
}: {
  options: readonly { value: T; label: string }[];
  values: T[];
  onChange: (v: T[]) => void;
  color?: string;
}) {
  const toggle = (v: T) => {
    if (values.includes(v)) {
      onChange(values.filter((x) => x !== v));
    } else {
      onChange([...values, v]);
    }
  };

  return (
    <View style={styles.multiWrap}>
      {options.map((o) => {
        const sel = values.includes(o.value);
        return (
          <TouchableOpacity
            key={String(o.value)}
            style={[styles.multiBtn, sel && { borderColor: color, backgroundColor: color + '18' }]}
            onPress={() => toggle(o.value)}
            activeOpacity={0.7}
          >
            <Text style={[styles.multiBtnText, sel && { color }]}>{o.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── Number input ──────────────────────────────────────────────────

function NumericField({
  label,
  value,
  unit,
  onChange,
  min,
  max,
}: {
  label: string;
  value: string;
  unit: string;
  onChange: (v: string) => void;
  min?: number;
  max?: number;
}) {
  return (
    <View style={styles.numRow}>
      <Text style={styles.numLabel}>{label}</Text>
      <View style={styles.numInputWrap}>
        <TextInput
          style={styles.numInput}
          value={value}
          onChangeText={onChange}
          keyboardType="decimal-pad"
          placeholderTextColor="#444"
          placeholder="—"
        />
        <Text style={styles.numUnit}>{unit}</Text>
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────

export default function ProfileEditScreen({ navigation }: Props) {
  const { profile, updateProfile, loading } = useProfileStore();

  const [goal, setGoal] = useState<string | undefined>(profile?.goal);
  const [level, setLevel] = useState<string | undefined>(profile?.fitness_level);
  const [weight, setWeight] = useState(profile?.body_weight?.toString() ?? '');
  const [height, setHeight] = useState(profile?.body_height?.toString() ?? '');
  const [age, setAge] = useState(profile?.body_age?.toString() ?? '');
  const [days, setDays] = useState<number[]>(profile?.available_days ?? []);
  const [equipment, setEquipment] = useState<string[]>(profile?.equipment ?? []);
  const [injuryNotes, setInjuryNotes] = useState(profile?.injury_notes ?? '');

  const handleSave = async () => {
    const w = parseFloat(weight);
    const h = parseFloat(height);
    const a = parseInt(age, 10);

    if (weight && (isNaN(w) || w <= 0)) {
      Alert.alert('Erreur', 'Poids invalide');
      return;
    }
    if (height && (isNaN(h) || h <= 0)) {
      Alert.alert('Erreur', 'Taille invalide');
      return;
    }
    if (age && (isNaN(a) || a < 10 || a > 120)) {
      Alert.alert('Erreur', 'Âge invalide (10-120)');
      return;
    }

    await updateProfile({
      ...(goal ? { goal: goal as any } : {}),
      ...(level ? { fitness_level: level as any } : {}),
      ...(weight ? { body_weight: w } : {}),
      ...(height ? { body_height: h } : {}),
      ...(age ? { body_age: a } : {}),
      available_days: days,
      equipment,
      injury_notes: injuryNotes.trim() || undefined,
    });

    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <SectionLabel text="Objectif" />
        <SelectGroup options={GOALS} value={goal} onChange={setGoal} />

        <SectionLabel text="Niveau" />
        <SelectGroup options={LEVELS} value={level} onChange={setLevel} color="#22d3ee" />

        <SectionLabel text="Mensurations" />
        <NumericField label="Poids" value={weight} unit="kg" onChange={setWeight} />
        <NumericField label="Taille" value={height} unit="cm" onChange={setHeight} />
        <NumericField label="Âge" value={age} unit="ans" onChange={setAge} />

        <SectionLabel text="Jours d'entraînement" />
        <MultiSelect options={DAYS} values={days} onChange={setDays} />
        <Text style={styles.hint}>{days.length} jour{days.length !== 1 ? 's' : ''} / semaine sélectionné{days.length !== 1 ? 's' : ''}</Text>

        <SectionLabel text="Équipement disponible" />
        <MultiSelect options={EQUIPMENT_OPTIONS} values={equipment} onChange={setEquipment} color="#f59e0b" />

        <SectionLabel text="Blessures / notes" />
        <TextInput
          style={styles.textArea}
          value={injuryNotes}
          onChangeText={setInjuryNotes}
          placeholder="Douleurs, blessures, restrictions…"
          placeholderTextColor="#444"
          multiline
          numberOfLines={3}
        />

        <TouchableOpacity
          style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>Enregistrer</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f' },
  scroll: { padding: 20, paddingBottom: 40 },

  sectionLabel: {
    color: '#aaa',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 24,
    marginBottom: 10,
  },

  // Single-select
  selectRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  selectBtn: {
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#1a1a1a',
  },
  selectBtnText: { color: '#666', fontSize: 13, fontWeight: '600' },

  // Multi-select
  multiWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  multiBtn: {
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: '#1a1a1a',
  },
  multiBtnText: { color: '#666', fontSize: 13, fontWeight: '600' },

  hint: { color: '#333', fontSize: 11, marginTop: 8 },

  // Numeric input
  numRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
  },
  numLabel: { color: '#888', fontSize: 14 },
  numInputWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  numInput: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'right',
    minWidth: 60,
  },
  numUnit: { color: '#555', fontSize: 13 },

  // Text area
  textArea: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 10,
    padding: 14,
    color: '#fff',
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
  },

  // Save button
  saveBtn: {
    backgroundColor: '#a78bfa',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 28,
  },
  saveBtnDisabled: { backgroundColor: '#3a3a3a' },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
