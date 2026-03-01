import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProfileStore } from '../store/profileStore';
import { useAISettingsStore } from '../store/aiSettingsStore';
import { apiClient } from '../lib/apiClient';

// ─── TDEE + macro computation ─────────────────────────────────────────────────

interface Targets {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

function computeTargets(profile: {
  goal?: string;
  body_weight?: number;
  body_height?: number;
  body_age?: number;
  available_days?: number[];
}): Targets | null {
  const w = profile.body_weight;
  const h = profile.body_height;
  const age = profile.body_age;
  if (!w || !h || !age) return null;

  const bmr = 10 * w + 6.25 * h - 5 * age;

  const days = (profile.available_days ?? []).length;
  const activityFactor =
    days <= 1 ? 1.2 :
    days <= 3 ? 1.375 :
    days <= 5 ? 1.55 : 1.725;

  const tdee = Math.round(bmr * activityFactor);

  const goal = profile.goal ?? 'general_fitness';
  const calorieAdjust =
    goal === 'muscle_gain' ? 300 :
    goal === 'fat_loss' ? -500 : 0;
  const calories = tdee + calorieAdjust;

  const proteinRate = goal === 'muscle_gain' ? 2.2 : goal === 'fat_loss' ? 2.0 : 1.8;
  const protein_g = Math.round(w * proteinRate);
  const fat_g = Math.round(w * 0.9);
  const carbs_g = Math.round((calories - protein_g * 4 - fat_g * 9) / 4);

  return { calories, protein_g, carbs_g: Math.max(carbs_g, 0), fat_g };
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChatMessage {
  id?: string;
  role: 'user' | 'ai';
  text: string;
  created_at?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) +
    ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

// ─── Macro card ───────────────────────────────────────────────────────────────

function MacroCard({ label, value, unit, color }: { label: string; value: number; unit: string; color: string }) {
  return (
    <View style={[macroStyles.card, { borderColor: color + '44' }]}>
      <Text style={[macroStyles.value, { color }]}>{value}</Text>
      <Text style={macroStyles.unit}>{unit}</Text>
      <Text style={macroStyles.label}>{label}</Text>
    </View>
  );
}
const macroStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
  },
  value: { fontSize: 20, fontWeight: '800' },
  unit: { color: '#666', fontSize: 10, marginTop: 1 },
  label: { color: '#888', fontSize: 10, marginTop: 3, textAlign: 'center' },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function NutritionScreen() {
  const { profile } = useProfileStore();
  const { coaching_style, detail_level } = useAISettingsStore();
  const targets = useMemo(() => (profile ? computeTargets(profile) : null), [profile]);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [asking, setAsking] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const scrollRef = useRef<ScrollView>(null);

  const goalLabels: Record<string, string> = {
    muscle_gain: 'Prise de masse',
    fat_loss: 'Sèche',
    endurance: 'Endurance',
    general_fitness: 'Forme générale',
  };

  // Load history on mount
  const loadHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const res = await apiClient.get<{ messages: { id: string; role: string; content: string; created_at: string }[] }>(
        '/nutrition/history'
      );
      const loaded: ChatMessage[] = res.data.messages.map((m) => ({
        id: m.id,
        role: m.role as 'user' | 'ai',
        text: m.content,
        created_at: m.created_at,
      }));
      setMessages(loaded);
    } catch {
      // Fail silently — chat works even without history
    } finally {
      setLoadingHistory(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 150);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const clearHistory = () => {
    Alert.alert(
      'Nouvelle conversation',
      "Effacer tout l'historique nutrition ?",
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Effacer',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete('/nutrition/history');
              setMessages([]);
            } catch {}
          },
        },
      ]
    );
  };

  const sendQuestion = async () => {
    const q = input.trim();
    if (!q || asking) return;
    setInput('');
    const userMsg: ChatMessage = { role: 'user', text: q };
    setMessages((prev) => [...prev, userMsg]);
    setAsking(true);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const res = await apiClient.post<{ answer: string }>('/nutrition/ask', {
        question: q,
        coaching_style,
        detail_level,
      });
      const aiMsg: ChatMessage = { role: 'ai', text: res.data.answer };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      setMessages((prev) => [...prev, { role: 'ai', text: "Désolé, impossible de répondre pour l'instant." }]);
    } finally {
      setAsking(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={80}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          style={{ flex: 1 }}
        >
          {/* Header row */}
          <View style={styles.headerRow}>
            <Text style={styles.title}>Nutrition</Text>
            {messages.length > 0 && (
              <TouchableOpacity style={styles.newChatBtn} onPress={clearHistory} activeOpacity={0.7}>
                <Text style={styles.newChatText}>+ Nouvelle</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Targets */}
          {targets ? (
            <>
              <View style={styles.goalBadge}>
                <Text style={styles.goalText}>
                  {goalLabels[profile?.goal ?? ''] ?? 'Forme générale'} — {targets.calories} kcal/jour
                </Text>
              </View>
              <View style={styles.macroRow}>
                <MacroCard label="Protéines" value={targets.protein_g} unit="g" color="#a78bfa" />
                <MacroCard label="Glucides" value={targets.carbs_g} unit="g" color="#f59e0b" />
                <MacroCard label="Lipides" value={targets.fat_g} unit="g" color="#38bdf8" />
              </View>
              <Text style={styles.disclaimer}>
                Estimation basée sur votre profil. Consultez un professionnel pour un suivi personnalisé.
              </Text>
            </>
          ) : (
            <View style={styles.noProfileCard}>
              <Text style={styles.noProfileText}>
                Complétez votre profil (poids, taille, âge) pour voir vos objectifs nutritionnels.
              </Text>
            </View>
          )}

          {/* Chat section */}
          <Text style={styles.chatTitle}>Conseiller IA</Text>

          {loadingHistory ? (
            <ActivityIndicator color="#a78bfa" style={{ marginVertical: 20 }} />
          ) : messages.length === 0 ? (
            <View style={styles.chatEmpty}>
              <Text style={styles.chatEmptyText}>
                Posez une question sur votre alimentation, vos macros ou la nutrition sportive.
              </Text>
              {['Quand manger des glucides ?', 'Combien de protéines par repas ?', 'Meilleurs aliments post-workout ?'].map((q) => (
                <TouchableOpacity
                  key={q}
                  style={styles.suggestion}
                  onPress={() => setInput(q)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.suggestionText}>{q}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}

          {messages.map((msg, i) => (
            <View key={msg.id ?? i}>
              {msg.created_at && (i === 0 || messages[i - 1]?.created_at !== msg.created_at) && (
                <Text style={styles.timestamp}>{formatTime(msg.created_at)}</Text>
              )}
              <View style={[styles.bubble, msg.role === 'user' ? styles.bubbleUser : styles.bubbleAi]}>
                <Text style={[styles.bubbleText, msg.role === 'user' ? styles.bubbleTextUser : styles.bubbleTextAi]}>
                  {msg.text}
                </Text>
              </View>
            </View>
          ))}

          {asking && (
            <View style={styles.bubbleAi}>
              <ActivityIndicator color="#a78bfa" size="small" />
            </View>
          )}

        </ScrollView>

        {/* Input bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="Posez une question nutrition..."
            placeholderTextColor="#444"
            value={input}
            onChangeText={setInput}
            multiline
            returnKeyType="send"
            onSubmitEditing={sendQuestion}
            color="#fff"
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || asking) && styles.sendBtnDisabled]}
            onPress={sendQuestion}
            disabled={!input.trim() || asking}
            activeOpacity={0.8}
          >
            <Text style={styles.sendBtnText}>↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f' },
  scroll: { padding: 16, paddingBottom: 20 },

  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  title: { color: '#fff', fontSize: 24, fontWeight: '700' },
  newChatBtn: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  newChatText: { color: '#a78bfa', fontSize: 12, fontWeight: '600' },

  goalBadge: {
    backgroundColor: '#a78bfa22',
    borderColor: '#a78bfa44',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 14,
    alignSelf: 'flex-start',
  },
  goalText: { color: '#a78bfa', fontSize: 13, fontWeight: '700' },

  macroRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  disclaimer: { color: '#3a3a3a', fontSize: 10, textAlign: 'center', marginBottom: 28 },

  noProfileCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    marginBottom: 28,
  },
  noProfileText: { color: '#666', fontSize: 13, lineHeight: 20, textAlign: 'center' },

  chatTitle: {
    color: '#aaa',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 14,
  },

  chatEmpty: { marginBottom: 16 },
  chatEmptyText: { color: '#555', fontSize: 13, marginBottom: 12, lineHeight: 20 },
  suggestion: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 8,
  },
  suggestionText: { color: '#888', fontSize: 13 },

  timestamp: { color: '#333', fontSize: 10, textAlign: 'center', marginVertical: 6 },

  bubble: { borderRadius: 14, padding: 12, marginBottom: 8, maxWidth: '88%' },
  bubbleUser: { backgroundColor: '#a78bfa22', alignSelf: 'flex-end', borderWidth: 1, borderColor: '#a78bfa44' },
  bubbleAi: { backgroundColor: '#1a1a1a', alignSelf: 'flex-start', borderWidth: 1, borderColor: '#2a2a2a' },
  bubbleText: { fontSize: 14, lineHeight: 20 },
  bubbleTextUser: { color: '#e0d4ff' },
  bubbleTextAi: { color: '#ccc' },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    padding: 12,
    paddingBottom: 16,
    backgroundColor: '#0f0f0f',
    borderTopWidth: 1,
    borderTopColor: '#1e1e1e',
  },
  input: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 14,
    maxHeight: 100,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#a78bfa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: { backgroundColor: '#3a3a3a' },
  sendBtnText: { color: '#fff', fontSize: 20, fontWeight: '700' },
});
