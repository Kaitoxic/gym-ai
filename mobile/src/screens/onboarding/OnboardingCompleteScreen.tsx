import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useProfileStore } from '../../store/profileStore';
import { apiClient } from '../../lib/apiClient';

interface NutritionGuidance {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  summary: string;
}

export default function OnboardingCompleteScreen() {
  const { profile, updateProfile } = useProfileStore();
  const [guidance, setGuidance] = React.useState<NutritionGuidance | null>(null);
  const [loadingGuidance, setLoadingGuidance] = React.useState(false);
  const [guidanceError, setGuidanceError] = React.useState<string | null>(null);
  const [finishing, setFinishing] = React.useState(false);

  // Fetch AI nutrition guidance on mount
  React.useEffect(() => {
    fetchNutritionGuidance();
  }, []);

  const fetchNutritionGuidance = async () => {
    setLoadingGuidance(true);
    setGuidanceError(null);
    try {
      const res = await apiClient.post<{ result: string }>('/ai/proxy', {
        messages: [
          {
            role: 'user',
            content: buildNutritionPrompt(),
          },
        ],
        format: 'json',
      });

      // Parse JSON from AI response
      const raw = res.data.result;
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as NutritionGuidance;
        setGuidance(parsed);
      } else {
        setGuidanceError('Could not parse nutrition data.');
      }
    } catch {
      setGuidanceError('Could not load nutrition guidance. You can retry below.');
    } finally {
      setLoadingGuidance(false);
    }
  };

  const buildNutritionPrompt = () => {
    const goal = profile?.goal ?? 'general_fitness';
    const weight = profile?.body_weight;
    const height = profile?.body_height;
    const age = profile?.body_age;

    const goalText: Record<string, string> = {
      muscle_gain: 'build muscle',
      fat_loss: 'lose fat',
      endurance: 'improve endurance',
      general_fitness: 'maintain general fitness',
    };

    return `You are a nutrition expert. Given this user profile:
- Goal: ${goalText[goal] ?? goal}
- Weight: ${weight ? `${weight} kg` : 'unknown'}
- Height: ${height ? `${height} cm` : 'unknown'}
- Age: ${age ? `${age} years` : 'unknown'}

Calculate approximate daily nutrition targets and return ONLY a JSON object (no markdown, no explanation):
{
  "calories": <number>,
  "protein": <number in grams>,
  "carbs": <number in grams>,
  "fat": <number in grams>,
  "summary": "<one sentence personalised advice>"
}`;
  };

  const handleFinish = async () => {
    setFinishing(true);
    await updateProfile({ onboarding_done: true });
    // authStore will detect onboarding_done=true and route to main tabs
    // (handled in App.tsx root navigator)
  };

  const goalLabels: Record<string, string> = {
    muscle_gain: 'Build Muscle',
    fat_loss: 'Lose Fat',
    endurance: 'Boost Endurance',
    general_fitness: 'General Fitness',
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.inner}>
        <Text style={styles.emoji}>🎉</Text>
        <Text style={styles.heading}>You're all set!</Text>
        <Text style={styles.subheading}>
          Your profile is saved. Here's your personalised nutrition guidance to get started.
        </Text>

        {/* Profile Summary */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your Profile</Text>
          <Row label="Goal" value={goalLabels[profile?.goal ?? ''] ?? '—'} />
          <Row
            label="Level"
            value={
              profile?.fitness_level
                ? profile.fitness_level.charAt(0).toUpperCase() + profile.fitness_level.slice(1)
                : '—'
            }
          />
          <Row label="Weight" value={profile?.body_weight ? `${profile.body_weight} kg` : '—'} />
          <Row label="Height" value={profile?.body_height ? `${profile.body_height} cm` : '—'} />
          <Row
            label="Training days"
            value={
              profile?.available_days?.length
                ? `${profile.available_days.length} days / week`
                : '—'
            }
          />
        </View>

        {/* Nutrition Guidance */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Daily Nutrition Targets</Text>
          {loadingGuidance ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color="#6C47FF" />
              <Text style={styles.loadingText}>Calculating your macros...</Text>
            </View>
          ) : guidanceError ? (
            <View>
              <Text style={styles.errorText}>{guidanceError}</Text>
              <TouchableOpacity onPress={fetchNutritionGuidance} style={styles.retryBtn}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : guidance ? (
            <>
              <View style={styles.macroRow}>
                <MacroBox label="Calories" value={`${guidance.calories}`} unit="kcal" />
                <MacroBox label="Protein" value={`${guidance.protein}g`} unit="" />
                <MacroBox label="Carbs" value={`${guidance.carbs}g`} unit="" />
                <MacroBox label="Fat" value={`${guidance.fat}g`} unit="" />
              </View>
              <Text style={styles.summary}>{guidance.summary}</Text>
            </>
          ) : null}
        </View>

        <TouchableOpacity
          style={[styles.button, finishing && styles.buttonDisabled]}
          onPress={handleFinish}
          disabled={finishing}
        >
          {finishing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Go to my program</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

function MacroBox({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <View style={styles.macroBox}>
      <Text style={styles.macroValue}>{value}</Text>
      {unit ? <Text style={styles.macroUnit}>{unit}</Text> : null}
      <Text style={styles.macroLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f' },
  inner: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 60, alignItems: 'center' },
  emoji: { fontSize: 48, marginBottom: 12 },
  heading: { fontSize: 28, fontWeight: '800', color: '#ffffff', marginBottom: 8, textAlign: 'center' },
  subheading: { fontSize: 15, color: '#888', textAlign: 'center', marginBottom: 28, lineHeight: 22 },
  card: {
    backgroundColor: '#1c1c1e',
    borderRadius: 16,
    padding: 18,
    width: '100%',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2c2c2e',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#aaa',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 14,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: '#2c2c2e' },
  rowLabel: { fontSize: 14, color: '#888' },
  rowValue: { fontSize: 14, color: '#ffffff', fontWeight: '600' },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  loadingText: { color: '#888', fontSize: 14 },
  errorText: { color: '#ff4444', fontSize: 14, marginBottom: 10 },
  retryBtn: { alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8, borderWidth: 1, borderColor: '#6C47FF' },
  retryText: { color: '#6C47FF', fontWeight: '700', fontSize: 14 },
  macroRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  macroBox: { flex: 1, alignItems: 'center' },
  macroValue: { fontSize: 20, fontWeight: '800', color: '#ffffff' },
  macroUnit: { fontSize: 11, color: '#666', marginTop: 1 },
  macroLabel: { fontSize: 12, color: '#888', marginTop: 2 },
  summary: { fontSize: 13, color: '#aaa', lineHeight: 19, textAlign: 'center', paddingTop: 8, borderTopWidth: 1, borderTopColor: '#2c2c2e' },
  button: {
    backgroundColor: '#6C47FF',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    width: '100%',
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
