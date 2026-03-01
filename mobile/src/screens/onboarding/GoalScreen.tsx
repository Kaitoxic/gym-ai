import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '../../navigation/OnboardingNavigator';
import { useProfileStore, type Goal } from '../../store/profileStore';

const GOALS: { value: Goal; label: string; description: string }[] = [
  {
    value: 'muscle_gain',
    label: 'Build Muscle',
    description: 'Increase muscle mass and strength',
  },
  {
    value: 'fat_loss',
    label: 'Lose Fat',
    description: 'Burn fat and improve body composition',
  },
  {
    value: 'endurance',
    label: 'Boost Endurance',
    description: 'Improve cardiovascular fitness and stamina',
  },
  {
    value: 'general_fitness',
    label: 'General Fitness',
    description: 'Stay active and feel great overall',
  },
];

export default function GoalScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<OnboardingStackParamList>>();
  const { updateProfile, loading } = useProfileStore();
  const [selected, setSelected] = React.useState<Goal | null>(null);

  const handleNext = async () => {
    if (!selected) return;
    await updateProfile({ goal: selected });
    const { error } = useProfileStore.getState();
    if (error) {
      Alert.alert('Error', error);
      return;
    }
    navigation.navigate('Fitness');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <Text style={styles.heading}>What's your primary goal?</Text>
        <Text style={styles.subheading}>This shapes your entire training program.</Text>

        <View style={styles.options}>
          {GOALS.map((g) => (
            <TouchableOpacity
              key={g.value}
              style={[styles.option, selected === g.value && styles.optionSelected]}
              onPress={() => setSelected(g.value)}
              activeOpacity={0.75}
            >
              <Text style={[styles.optionLabel, selected === g.value && styles.optionLabelSelected]}>
                {g.label}
              </Text>
              <Text style={styles.optionDesc}>{g.description}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.button, (!selected || loading) && styles.buttonDisabled]}
          onPress={handleNext}
          disabled={!selected || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Continue</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.stepIndicator}>Step 1 of 4</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f' },
  inner: { flex: 1, paddingHorizontal: 24, paddingTop: 24 },
  heading: {
    fontSize: 26,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 8,
  },
  subheading: {
    fontSize: 15,
    color: '#888',
    marginBottom: 32,
  },
  options: { gap: 12, marginBottom: 32 },
  option: {
    backgroundColor: '#1c1c1e',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#2c2c2e',
    padding: 18,
  },
  optionSelected: {
    borderColor: '#6C47FF',
    backgroundColor: '#1a1535',
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  optionLabelSelected: { color: '#a78bfa' },
  optionDesc: { fontSize: 13, color: '#888' },
  button: {
    backgroundColor: '#6C47FF',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  stepIndicator: {
    textAlign: 'center',
    color: '#555',
    fontSize: 13,
    marginTop: 20,
  },
});
