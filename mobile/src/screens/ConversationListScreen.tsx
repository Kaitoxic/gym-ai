import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { apiClient } from '../lib/apiClient';
import { AIStackParamList } from '../navigation/AINavigator';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Conversation {
  id: string;
  title: string;
  preview: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "À l'instant";
  if (minutes < 60) return `Il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Il y a ${days}j`;
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ConversationListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AIStackParamList>>();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const loadConversations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<{ conversations: Conversation[] }>('/chat/conversations');
      setConversations(res.data.conversations);
    } catch {
      // Fail silently
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadConversations);
    return unsubscribe;
  }, [navigation, loadConversations]);

  const createConversation = async () => {
    try {
      const res = await apiClient.post<{ id: string; title: string }>('/chat/conversations', {});
      navigation.navigate('AIChatScreen', {
        conversationId: res.data.id,
        title: res.data.title,
      });
    } catch {
      Alert.alert('Erreur', 'Impossible de créer une conversation.');
    }
  };

  const deleteConversation = (id: string, title: string) => {
    Alert.alert('Supprimer', `Supprimer "${title}" ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiClient.delete(`/chat/conversations/${id}`);
            setConversations((prev) => prev.filter((c) => c.id !== id));
          } catch {}
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: Conversation }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('AIChatScreen', { conversationId: item.id, title: item.title })}
      onLongPress={() => deleteConversation(item.id, item.title)}
      activeOpacity={0.7}
    >
      <View style={styles.cardContent}>
        <View style={styles.cardMain}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
          {item.preview && (
            <Text style={styles.cardPreview} numberOfLines={2}>{item.preview}</Text>
          )}
        </View>
        <Text style={styles.cardTime}>{timeAgo(item.updated_at)}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Coach IA</Text>
          <Text style={styles.subtitle}>Muscu · Nutrition · Cardio</Text>
        </View>
        <TouchableOpacity style={styles.newBtn} onPress={createConversation} activeOpacity={0.7}>
          <Text style={styles.newBtnText}>＋</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color="#a78bfa" style={{ marginTop: 60 }} />
      ) : conversations.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🤖</Text>
          <Text style={styles.emptyTitle}>Pas encore de conversation</Text>
          <Text style={styles.emptyText}>
            Pose n'importe quelle question sur ta musculation, ta nutrition ou ton cardio.
          </Text>
          <TouchableOpacity style={styles.startBtn} onPress={createConversation} activeOpacity={0.8}>
            <Text style={styles.startBtnText}>Nouvelle conversation</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f' },

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e1e1e',
  },
  title: { color: '#fff', fontSize: 24, fontWeight: '700' },
  subtitle: { color: '#555', fontSize: 12, marginTop: 2 },
  newBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#a78bfa',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  newBtnText: { color: '#fff', fontSize: 22, fontWeight: '700', lineHeight: 28 },

  list: { padding: 16, gap: 10 },

  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    padding: 14,
  },
  cardContent: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  cardMain: { flex: 1 },
  cardTitle: { color: '#fff', fontSize: 14, fontWeight: '600', marginBottom: 4 },
  cardPreview: { color: '#555', fontSize: 12, lineHeight: 18 },
  cardTime: { color: '#333', fontSize: 11, marginTop: 2, flexShrink: 0 },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 8 },
  emptyText: { color: '#555', fontSize: 14, lineHeight: 22, textAlign: 'center', marginBottom: 24 },
  startBtn: {
    backgroundColor: '#a78bfa',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  startBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
