import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '../../navigation/OnboardingNavigator';
import { useProfileStore } from '../../store/profileStore';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const EQUIPMENT_OPTIONS = [
  { value: 'barbell', label: 'Barbell' },
  { value: 'dumbbells', label: 'Dumbbells' },
  { value: 'cables', label: 'Cable Machine' },
  { value: 'machines', label: 'Gym Machines' },
  { value: 'kettlebell', label: 'Kettlebell' },
  { value: 'resistance_bands', label: 'Resistance Bands' },
  { value: 'pull_up_bar', label: 'Pull-up Bar' },
  { value: 'bodyweight', label: 'Bodyweight Only' },
];

export default function ScheduleScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<OnboardingStackParamList>>();
  const { updateProfile, loading } = useProfileStore();

  const [selectedDays, setSelectedDays] = React.useState<number[]>([]);
  const [selectedEquipment, setSelectedEquipment] = React.useState<string[]>([]);

  const toggleDay = (index: number) => {
    setSelectedDays((prev) =>
      prev.includes(index) ? prev.filter((d) => d !== index) : [...prev, index]
    );
  };

  const toggleEquipment = (value: string) => {
    setSelectedEquipment((prev) =>
      prev.includes(value) ? prev.filter((e) => e !== value) : [...prev, value]
    );
  };

  const handleNext = async () => {
    if (selectedDays.length === 0) {
      Alert.alert('Select training days', 'Please select at least one training day.');
      return;
    }
    if (selectedEquipment.length === 0) {
      Alert.alert('Select equipment', 'Please select at least one equipment option.');
      return;
    }

    await updateProfile({
      available_days: selectedDays.sort(),
      equipment: selectedEquipment,
    });

    const { error } = useProfileStore.getState();
    if (error) {
      Alert.alert('Error', error);
      return;
    }
    navigation.navigate('OnboardingComplete');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <Text style={styles.heading}>When & where do you train?</Text>
        <Text style={styles.subheading}>
          Your program will only schedule sessions on your chosen days.
        </Text>

        {/* Training Days */}
        <Text style={styles.sectionLabel}>Training Days</Text>
        <View style={styles.daysRow}>
          {DAYS.map((day, index) => (
            <TouchableOpacity
              key={day}
              style={[styles.dayChip, selectedDays.includes(index) && styles.dayChipSelected]}
              onPress={() => toggleDay(index)}
            >
              <Text
                style={[styles.dayText, selectedDays.includes(index) && styles.dayTextSelected]}
              >
                {day}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Equipment */}
        <Text style={styles.sectionLabel}>Available Equipment</Text>
        <View style={styles.chips}>
          {EQUIPMENT_OPTIONS.map((eq) => (
            <TouchableOpacity
              key={eq.value}
              style={[styles.chip, selectedEquipment.includes(eq.value) && styles.chipSelected]}
              onPress={() => toggleEquipment(eq.value)}
            >
              <Text
                style={[
                  styles.chipText,
                  selectedEquipment.includes(eq.value) && styles.chipTextSelected,
                ]}
              >
                {eq.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[
            styles.button,
            (selectedDays.length === 0 || selectedEquipment.length === 0 || loading) &&
              styles.buttonDisabled,
          ]}
          onPress={handleNext}
          disabled={selectedDays.length === 0 || selectedEquipment.length === 0 || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Finish Setup</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.stepIndicator}>Step 4 of 4</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f' },
  inner: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40 },
  heading: { fontSize: 26, fontWeight: '800', color: '#ffffff', marginBottom: 8 },
  subheading: { fontSize: 15, color: '#888', marginBottom: 28 },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#aaa',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
    gap: 6,
  },
  dayChip: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 10,
    backgroundColor: '#1c1c1e',
    borderWidth: 2,
    borderColor: '#2c2c2e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayChipSelected: { borderColor: '#6C47FF', backgroundColor: '#1a1535' },
  dayText: { fontSize: 11, color: '#aaa', fontWeight: '700' },
  dayTextSelected: { color: '#a78bfa' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 36 },
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
