import React from 'react';
import {
  View,
  Text,
  TextInput,
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

export default function MetricsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<OnboardingStackParamList>>();
  const { updateProfile, loading } = useProfileStore();

  const [weight, setWeight] = React.useState('');
  const [height, setHeight] = React.useState('');
  const [age, setAge] = React.useState('');

  const handleNext = async () => {
    const w = parseFloat(weight);
    const h = parseFloat(height);
    const a = parseInt(age, 10);

    if (weight && (isNaN(w) || w < 20 || w > 300)) {
      Alert.alert('Invalid weight', 'Please enter a weight between 20 and 300 kg.');
      return;
    }
    if (height && (isNaN(h) || h < 100 || h > 250)) {
      Alert.alert('Invalid height', 'Please enter a height between 100 and 250 cm.');
      return;
    }
    if (age && (isNaN(a) || a < 10 || a > 120)) {
      Alert.alert('Invalid age', 'Please enter an age between 10 and 120.');
      return;
    }

    await updateProfile({
      body_weight: weight ? w : undefined,
      body_height: height ? h : undefined,
      body_age: age ? a : undefined,
    });

    const { error } = useProfileStore.getState();
    if (error) {
      Alert.alert('Error', error);
      return;
    }
    navigation.navigate('Schedule');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <Text style={styles.heading}>Your body stats</Text>
        <Text style={styles.subheading}>
          Optional — helps the AI calculate calories and macros accurately.
        </Text>

        {/* Weight */}
        <View style={styles.fieldWrapper}>
          <Text style={styles.label}>Body Weight</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="e.g. 78"
              placeholderTextColor="#555"
              keyboardType="numeric"
              value={weight}
              onChangeText={setWeight}
            />
            <Text style={styles.unit}>kg</Text>
          </View>
        </View>

        {/* Height */}
        <View style={styles.fieldWrapper}>
          <Text style={styles.label}>Height</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="e.g. 178"
              placeholderTextColor="#555"
              keyboardType="numeric"
              value={height}
              onChangeText={setHeight}
            />
            <Text style={styles.unit}>cm</Text>
          </View>
        </View>

        {/* Age */}
        <View style={styles.fieldWrapper}>
          <Text style={styles.label}>Age</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="e.g. 27"
              placeholderTextColor="#555"
              keyboardType="numeric"
              value={age}
              onChangeText={setAge}
            />
            <Text style={styles.unit}>yrs</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleNext}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Continue</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Schedule')} style={styles.skipWrapper}>
          <Text style={styles.skipText}>Skip this step</Text>
        </TouchableOpacity>

        <Text style={styles.stepIndicator}>Step 3 of 4</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f' },
  inner: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40 },
  heading: { fontSize: 26, fontWeight: '800', color: '#ffffff', marginBottom: 8 },
  subheading: { fontSize: 15, color: '#888', marginBottom: 32 },
  fieldWrapper: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '700', color: '#aaa', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.8 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  input: {
    flex: 1,
    backgroundColor: '#1c1c1e',
    borderWidth: 1,
    borderColor: '#2c2c2e',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
  },
  unit: { fontSize: 15, color: '#666', fontWeight: '600', width: 30 },
  button: {
    backgroundColor: '#6C47FF',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  skipWrapper: { marginTop: 16, alignItems: 'center' },
  skipText: { color: '#555', fontSize: 14 },
  stepIndicator: { textAlign: 'center', color: '#555', fontSize: 13, marginTop: 20 },
});
