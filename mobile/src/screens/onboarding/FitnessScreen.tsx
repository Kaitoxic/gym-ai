import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  TextInput,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '../../navigation/OnboardingNavigator';
import { useProfileStore, type FitnessLevel } from '../../store/profileStore';

const LEVELS: { value: FitnessLevel; label: string; description: string }[] = [
  {
    value: 'beginner',
    label: 'Beginner',
    description: 'New to structured training, < 6 months experience',
  },
  {
    value: 'intermediate',
    label: 'Intermediate',
    description: '6 months – 2 years of consistent training',
  },
  {
    value: 'advanced',
    label: 'Advanced',
    description: '2+ years, familiar with progressive overload',
  },
];

const COMMON_EXERCISES = [
  'Bench Press', 'Squat', 'Deadlift', 'Pull-ups', 'Overhead Press',
  'Barbell Row', 'Dips', 'Lunges', 'Romanian Deadlift', 'Incline Press',
];

export default function FitnessScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<OnboardingStackParamList>>();
  const { updateProfile, loading } = useProfileStore();

  const [level, setLevel] = React.useState<FitnessLevel | null>(null);
  const [injuryNotes, setInjuryNotes] = React.useState('');
  const [preferred, setPreferred] = React.useState<string[]>([]);

  const toggleExercise = (name: string) => {
    setPreferred((prev) =>
      prev.includes(name) ? prev.filter((e) => e !== name) : [...prev, name]
    );
  };

  const handleNext = async () => {
    if (!level) return;
    await updateProfile({
      fitness_level: level,
      injury_notes: injuryNotes.trim() || undefined,
      preferred_exercises: preferred.length > 0 ? preferred : undefined,
    });
    const { error } = useProfileStore.getState();
    if (error) {
      Alert.alert('Error', error);
      return;
    }
    navigation.navigate('Metrics');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <Text style={styles.heading}>Tell us about your training</Text>
        <Text style={styles.subheading}>We'll tailor the difficulty to your level.</Text>

        {/* Fitness Level */}
        <Text style={styles.sectionLabel}>Fitness Level</Text>
        <View style={styles.options}>
          {LEVELS.map((l) => (
            <TouchableOpacity
              key={l.value}
              style={[styles.option, level === l.value && styles.optionSelected]}
              onPress={() => setLevel(l.value)}
              activeOpacity={0.75}
            >
              <Text style={[styles.optionLabel, level === l.value && styles.optionLabelSelected]}>
                {l.label}
              </Text>
              <Text style={styles.optionDesc}>{l.description}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Injuries */}
        <Text style={styles.sectionLabel}>Injuries or Limitations</Text>
        <Text style={styles.hint}>Optional — the AI will avoid problematic movements.</Text>
        <TextInput
          style={styles.textArea}
          placeholder="e.g. left knee pain, shoulder impingement..."
          placeholderTextColor="#555"
          multiline
          numberOfLines={3}
          value={injuryNotes}
          onChangeText={setInjuryNotes}
          textAlignVertical="top"
        />

        {/* Preferred Exercises */}
        <Text style={styles.sectionLabel}>Favourite Exercises</Text>
        <Text style={styles.hint}>Optional — select any you enjoy doing.</Text>
        <View style={styles.chips}>
          {COMMON_EXERCISES.map((ex) => (
            <TouchableOpacity
              key={ex}
              style={[styles.chip, preferred.includes(ex) && styles.chipSelected]}
              onPress={() => toggleExercise(ex)}
            >
              <Text style={[styles.chipText, preferred.includes(ex) && styles.chipTextSelected]}>
                {ex}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.button, (!level || loading) && styles.buttonDisabled]}
          onPress={handleNext}
          disabled={!level || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Continue</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.stepIndicator}>Step 2 of 4</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f' },
  inner: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40 },
  heading: { fontSize: 26, fontWeight: '800', color: '#ffffff', marginBottom: 8 },
  subheading: { fontSize: 15, color: '#888', marginBottom: 28 },
  sectionLabel: { fontSize: 14, fontWeight: '700', color: '#aaa', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.8 },
  hint: { fontSize: 13, color: '#555', marginBottom: 10, marginTop: -6 },
  options: { gap: 10, marginBottom: 28 },
  option: {
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2c2c2e',
    padding: 16,
  },
  optionSelected: { borderColor: '#6C47FF', backgroundColor: '#1a1535' },
  optionLabel: { fontSize: 15, fontWeight: '700', color: '#ffffff', marginBottom: 2 },
  optionLabelSelected: { color: '#a78bfa' },
  optionDesc: { fontSize: 13, color: '#888' },
  textArea: {
    backgroundColor: '#1c1c1e',
    borderWidth: 1,
    borderColor: '#2c2c2e',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#fff',
    minHeight: 80,
    marginBottom: 28,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 32 },
  chip: {
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#2c2c2e',
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: '#1c1c1e',
  },
  chipSelected: { borderColor: '#6C47FF', backgroundColor: '#1a1535' },
  chipText: { fontSize: 13, color: '#aaa', fontWeight: '600' },
  chipTextSelected: { color: '#a78bfa' },
  button: {
    backgroundColor: '#6C47FF',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  stepIndicator: { textAlign: 'center', color: '#555', fontSize: 13, marginTop: 20 },
});
