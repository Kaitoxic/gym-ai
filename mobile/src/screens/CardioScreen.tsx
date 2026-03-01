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
import { apiClient } from '../lib/apiClient';

// ─── Cardio recommendations ───────────────────────────────────────────────────

interface CardioRec {
  lissSteps: string;
  hiitFreq: string;
  miitFreq: string;
  focus: string;
}

function computeCardioRec(profile: {
  goal?: string;
  fitness_level?: string;
}): CardioRec {
  const level = profile.fitness_level ?? 'beginner';
  const goal = profile.goal ?? 'general_fitness';

  const lissMap: Record<string, string> = {
    beginner: '7 000 – 10 000 pas/jour',
    intermediate: '10 000 – 15 000 pas/jour',
    advanced: '12 000 – 20 000 pas/jour',
  };

  const hiitMap: Record<string, string> = {
    beginner: '0 – 1x / semaine',
    intermediate: '1x / semaine',
    advanced: '1 – 2x / semaine',
  };

  const miitMap: Record<string, string> = {
    beginner: '0 – 1x / semaine',
    intermediate: '1 – 2x / semaine',
    advanced: '2 – 3x / semaine',
  };

  const focusMap: Record<string, string> = {
    fat_loss: 'Priorité LISS quotidien + 1 HIIT/semaine pour maximiser la dépense calorique.',
    muscle_gain: 'Privilégier le LISS léger pour la récupération. Éviter le HIIT avant les séances de jambes.',
    endurance: 'Base MIIT solide + HIIT progressif pour améliorer le VO2max.',
    general_fitness: 'Combo LISS + MIIT pour une santé cardiovasculaire optimale et une bonne récupération.',
    powerbuilding: 'LISS en priorité. 1 HIIT max/semaine pour ne pas impacter la récupération musculaire.',
  };

  return {
    lissSteps: lissMap[level] ?? lissMap.beginner,
    hiitFreq: hiitMap[level] ?? hiitMap.beginner,
    miitFreq: miitMap[level] ?? miitMap.beginner,
    focus: focusMap[goal] ?? focusMap.general_fitness,
  };
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

// ─── Info card ────────────────────────────────────────────────────────────────

function CardioInfoCard({
  emoji,
  label,
  value,
  color,
}: {
  emoji: string;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <View style={[infoStyles.card, { borderColor: color + '44' }]}>
      <Text style={infoStyles.emoji}>{emoji}</Text>
      <Text style={[infoStyles.value, { color }]}>{value}</Text>
      <Text style={infoStyles.label}>{label}</Text>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  emoji: { fontSize: 22 },
  value: { fontSize: 13, fontWeight: '800', textAlign: 'center' },
  label: { color: '#666', fontSize: 10, textAlign: 'center' },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function CardioScreen() {
  const { profile } = useProfileStore();
  const rec = useMemo(() => computeCardioRec(profile ?? {}), [profile]);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [asking, setAsking] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const scrollRef = useRef<ScrollView>(null);

  const levelLabels: Record<string, string> = {
    beginner: 'Débutant',
    intermediate: 'Intermédiaire',
    advanced: 'Avancé',
  };

  const goalLabels: Record<string, string> = {
    muscle_gain: 'Prise de masse',
    fat_loss: 'Sèche',
    endurance: 'Endurance',
    general_fitness: 'Forme générale',
    powerbuilding: 'Powerbuilding',
  };

  // Load history on mount
  const loadHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const res = await apiClient.get<{ messages: { id: string; role: string; content: string; created_at: string }[] }>(
        '/cardio/history'
      );
      const loaded: ChatMessage[] = res.data.messages.map((m) => ({
        id: m.id,
        role: m.role as 'user' | 'ai',
        text: m.content,
        created_at: m.created_at,
      }));
      setMessages(loaded);
    } catch {
      // Fail silently
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
      "Effacer tout l'historique cardio ?",
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Effacer',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete('/cardio/history');
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
      const res = await apiClient.post<{ answer: string }>('/cardio/ask', { question: q });
      const aiMsg: ChatMessage = { role: 'ai', text: res.data.answer };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'ai', text: "Désolé, impossible de répondre pour l'instant." },
      ]);
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
        >
          {/* Header row */}
          <View style={styles.headerRow}>
            <Text style={styles.title}>Cardio</Text>
            {messages.length > 0 && (
              <TouchableOpacity style={styles.newChatBtn} onPress={clearHistory} activeOpacity={0.7}>
                <Text style={styles.newChatText}>+ Nouvelle</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Profile badges */}
          <View style={styles.badgeRow}>
            {profile?.fitness_level && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {levelLabels[profile.fitness_level] ?? profile.fitness_level}
                </Text>
              </View>
            )}
            {profile?.goal && (
              <View style={[styles.badge, styles.badgeGoal]}>
                <Text style={styles.badgeText}>
                  {goalLabels[profile.goal] ?? profile.goal}
                </Text>
              </View>
            )}
          </View>

          {/* Focus message */}
          <View style={styles.focusCard}>
            <Text style={styles.focusText}>{rec.focus}</Text>
          </View>

          {/* Info cards */}
          <View style={styles.cardRow}>
            <CardioInfoCard emoji="🚶" label="LISS quotidien" value={rec.lissSteps} color="#22d3ee" />
          </View>
          <View style={styles.cardRow}>
            <CardioInfoCard emoji="⚡" label="HIIT / semaine" value={rec.hiitFreq} color="#f59e0b" />
            <CardioInfoCard emoji="🏃" label="MIIT / semaine" value={rec.miitFreq} color="#a78bfa" />
          </View>

          {/* Tips */}
          <View style={styles.tipsCard}>
            <Text style={styles.tipsTitle}>CONSEILS CLÉS</Text>
            <Text style={styles.tipLine}>• Caler le cardio intense en jour off ou le matin (6h+ avant la muscu)</Text>
            <Text style={styles.tipLine}>• Ne jamais faire du HIIT avant une séance jambes</Text>
            <Text style={styles.tipLine}>• LISS quotidien = marche rapide, vélo léger, escaliers</Text>
            <Text style={styles.tipLine}>• HIIT : 10-20 min max — rameur, sprint, airbike (30s / 30s)</Text>
          </View>

          {/* Chat section */}
          <Text style={styles.chatTitle}>Coach IA Cardio</Text>

          {loadingHistory ? (
            <ActivityIndicator color="#22d3ee" style={{ marginVertical: 20 }} />
          ) : messages.length === 0 ? (
            <View style={styles.chatEmpty}>
              <Text style={styles.chatEmptyText}>
                Posez une question sur votre cardio, le VO2max ou les méthodes LISS/HIIT/MIIT.
              </Text>
              {[
                'Combien de fois faire du HIIT par semaine ?',
                'Le cardio fait-il perdre du muscle ?',
                'Quel cardio pour améliorer mon VO2max ?',
              ].map((q) => (
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
              <View
                style={[
                  styles.bubble,
                  msg.role === 'user' ? styles.bubbleUser : styles.bubbleAi,
                ]}
              >
                <Text
                  style={[
                    styles.bubbleText,
                    msg.role === 'user' ? styles.bubbleTextUser : styles.bubbleTextAi,
                  ]}
                >
                  {msg.text}
                </Text>
              </View>
            </View>
          ))}

          {asking && (
            <View style={styles.bubbleAi}>
              <ActivityIndicator color="#22d3ee" size="small" />
            </View>
          )}

          <View style={{ height: 80 }} />
        </ScrollView>

        {/* Input bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="Posez une question cardio..."
            placeholderTextColor="#444"
            value={input}
            onChangeText={setInput}
            multiline
            returnKeyType="send"
            onSubmitEditing={sendQuestion}
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
  newChatText: { color: '#22d3ee', fontSize: 12, fontWeight: '600' },

  badgeRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  badge: {
    backgroundColor: '#22d3ee22',
    borderColor: '#22d3ee44',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeGoal: {
    backgroundColor: '#a78bfa22',
    borderColor: '#a78bfa44',
  },
  badgeText: { color: '#ccc', fontSize: 12, fontWeight: '600' },

  focusCard: {
    backgroundColor: '#0e2a30',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#22d3ee33',
    padding: 14,
    marginBottom: 16,
  },
  focusText: { color: '#67e8f9', fontSize: 13, lineHeight: 20 },

  cardRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },

  tipsCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    padding: 14,
    marginTop: 4,
    marginBottom: 28,
    gap: 6,
  },
  tipsTitle: {
    color: '#555',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 4,
  },
  tipLine: { color: '#888', fontSize: 12, lineHeight: 18 },

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
  bubbleUser: {
    backgroundColor: '#22d3ee22',
    alignSelf: 'flex-end',
    borderWidth: 1,
    borderColor: '#22d3ee44',
  },
  bubbleAi: {
    backgroundColor: '#1a1a1a',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  bubbleText: { fontSize: 14, lineHeight: 20 },
  bubbleTextUser: { color: '#a7f3fd' },
  bubbleTextAi: { color: '#ccc' },

  inputBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
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
    backgroundColor: '#22d3ee',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: { backgroundColor: '#3a3a3a' },
  sendBtnText: { color: '#0f0f0f', fontSize: 20, fontWeight: '700' },
});
