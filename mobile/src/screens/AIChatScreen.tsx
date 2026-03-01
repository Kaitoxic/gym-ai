import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAISettingsStore } from '../store/aiSettingsStore';
import { apiClient } from '../lib/apiClient';
import { AIStackParamList } from '../navigation/AINavigator';

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
  return (
    d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) +
    ' ' +
    d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  );
}

const SUGGESTIONS = [
  { label: 'Muscu', text: 'Quel programme pour prise de masse en 4j/semaine ?' },
  { label: 'Nutrition', text: 'Combien de protéines par jour pour progresser ?' },
  { label: 'Cardio', text: 'Quel cardio sans impacter la récup musculaire ?' },
  { label: 'Récup', text: 'Comment optimiser ma récupération après une séance ?' },
  { label: 'Suppléments', text: 'La créatine est-elle vraiment efficace ?' },
  { label: 'Sèche', text: 'Comment perdre du gras sans perdre de muscle ?' },
];

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function AIChatScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AIStackParamList>>();
  const route = useRoute<RouteProp<AIStackParamList, 'AIChatScreen'>>();
  const { conversationId, title } = route.params;
  const { coaching_style, detail_level } = useAISettingsStore();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [asking, setAsking] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [conversationTitle, setConversationTitle] = useState(title);
  const [kbOffset, setKbOffset] = useState(0);
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);

  // Set navigation header title
  useLayoutEffect(() => {
    navigation.setOptions({ title: conversationTitle });
  }, [navigation, conversationTitle]);

  // Android keyboard listener — handles adjustNothing / adjustPan in Expo Go
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const showSub = Keyboard.addListener('keyboardDidShow', (e) => {
      setKbOffset(e.endCoordinates.height);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      setKbOffset(0);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Load message history
  const loadHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const res = await apiClient.get<{
        messages: { id: string; role: string; content: string; created_at: string }[];
      }>(`/chat/conversations/${conversationId}/messages`);
      setMessages(
        res.data.messages.map((m) => ({
          id: m.id,
          role: m.role as 'user' | 'ai',
          text: m.content,
          created_at: m.created_at,
        }))
      );
    } catch {
      // Fail silently
    } finally {
      setLoadingHistory(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 150);
    }
  }, [conversationId]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const sendQuestion = async (q?: string) => {
    const text = (q ?? input).trim();
    if (!text || asking) return;
    setInput('');
    const userMsg: ChatMessage = { role: 'user', text };
    setMessages((prev) => [...prev, userMsg]);
    setAsking(true);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const res = await apiClient.post<{ answer: string }>('/chat/ask', {
        question: text,
        conversation_id: conversationId,
        coaching_style,
        detail_level,
      });
      const aiMsg: ChatMessage = { role: 'ai', text: res.data.answer };
      setMessages((prev) => [...prev, aiMsg]);

      // Update title if it was default
      if (conversationTitle === 'Nouvelle conversation') {
        const newTitle = text.slice(0, 50) + (text.length > 50 ? '…' : '');
        setConversationTitle(newTitle);
      }
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

  const chatContent = (
    <>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[styles.scroll, Platform.OS === 'android' && { paddingBottom: kbOffset + 20 }]}
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
      >
        {/* Empty state */}
        {!loadingHistory && messages.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              Pose n'importe quelle question sur ta musculation, ta nutrition ou ton cardio.
            </Text>
            <View style={styles.chipGrid}>
              {SUGGESTIONS.map((s) => (
                <TouchableOpacity
                  key={s.label}
                  style={styles.chip}
                  onPress={() => sendQuestion(s.text)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.chipLabel}>{s.label}</Text>
                  <Text style={styles.chipText}>{s.text}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {loadingHistory && (
          <ActivityIndicator color="#a78bfa" style={{ marginVertical: 40 }} />
        )}

        {/* Messages */}
        {messages.map((msg, i) => (
          <View key={msg.id ?? i}>
            {msg.created_at &&
              (i === 0 || messages[i - 1]?.created_at !== msg.created_at) && (
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
            <ActivityIndicator color="#a78bfa" size="small" />
          </View>
        )}
      </ScrollView>

      {/* Input bar */}
      <View style={[
        styles.inputBar,
        Platform.OS === 'android' && {
          paddingBottom: kbOffset > 0 ? kbOffset : insets.bottom + 8,
        },
      ]}>
        <TextInput
          style={styles.input}
          placeholder="Pose ta question..."
          placeholderTextColor="#444"
          value={input}
          onChangeText={setInput}
          multiline
          returnKeyType="send"
          onSubmitEditing={() => sendQuestion()}
          color="#fff"
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!input.trim() || asking) && styles.sendBtnDisabled]}
          onPress={() => sendQuestion()}
          disabled={!input.trim() || asking}
          activeOpacity={0.8}
        >
          <Text style={styles.sendBtnText}>↑</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {Platform.OS === 'ios' ? (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding" keyboardVerticalOffset={88}>
          {chatContent}
        </KeyboardAvoidingView>
      ) : (
        <View style={{ flex: 1 }}>{chatContent}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f' },
  scroll: { padding: 16, paddingBottom: 20 },

  emptyState: { marginBottom: 16, marginTop: 8 },
  emptyText: { color: '#555', fontSize: 13, lineHeight: 20, marginBottom: 16 },
  chipGrid: { gap: 10 },
  chip: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 12,
    padding: 12,
  },
  chipLabel: {
    color: '#a78bfa',
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipText: { color: '#888', fontSize: 13 },

  timestamp: { color: '#333', fontSize: 10, textAlign: 'center', marginVertical: 6 },

  bubble: { borderRadius: 14, padding: 12, marginBottom: 8, maxWidth: '88%' },
  bubbleUser: {
    backgroundColor: '#a78bfa22',
    alignSelf: 'flex-end',
    borderWidth: 1,
    borderColor: '#a78bfa44',
  },
  bubbleAi: {
    backgroundColor: '#1a1a1a',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  bubbleText: { fontSize: 14, lineHeight: 20 },
  bubbleTextUser: { color: '#e0d4ff' },
  bubbleTextAi: { color: '#ccc' },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    padding: 12,
    paddingBottom: 8,
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
