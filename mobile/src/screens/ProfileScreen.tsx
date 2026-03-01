import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProfileStore } from '../store/profileStore';
import { useAuthStore } from '../store/authStore';
import { useAISettingsStore, CoachingStyle, DetailLevel } from '../store/aiSettingsStore';

function Row({ label, value }: { label: string; value?: string | number | null }) {
  if (!value && value !== 0) return null;
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{String(value)}</Text>
    </View>
  );
}

// ─── Option button ────────────────────────────────────────────────

function OptionBtn({
  label,
  description,
  selected,
  onPress,
  color,
}: {
  label: string;
  description: string;
  selected: boolean;
  onPress: () => void;
  color: string;
}) {
  return (
    <TouchableOpacity
      style={[optStyles.btn, selected && { borderColor: color, backgroundColor: color + '15' }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={optStyles.row}>
        <Text style={[optStyles.label, selected && { color }]}>{label}</Text>
        {selected && <Text style={[optStyles.check, { color }]}>✓</Text>}
      </View>
      <Text style={optStyles.desc}>{description}</Text>
    </TouchableOpacity>
  );
}

const optStyles = StyleSheet.create({
  btn: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { color: '#ccc', fontSize: 14, fontWeight: '700' },
  check: { fontSize: 14, fontWeight: '800' },
  desc: { color: '#555', fontSize: 11, marginTop: 3, lineHeight: 16 },
});

// ─── Main Screen ──────────────────────────────────────────────────

export default function ProfileScreen() {
  const { profile } = useProfileStore();
  const { signOut } = useAuthStore();
  const { coaching_style, detail_level, loaded, load, setCoachingStyle, setDetailLevel } = useAISettingsStore();

  useEffect(() => {
    if (!loaded) load();
  }, [loaded, load]);

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  function capitalize(s: string) {
    return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ');
  }

  const styleOptions: { value: CoachingStyle; label: string; description: string; color: string }[] = [
    { value: 'motivating', label: 'Motivant & bienveillant', description: 'Coach encourageant, chaleureux, axé sur la progression.', color: '#a78bfa' },
    { value: 'strict', label: 'Strict & direct', description: "Coach exigeant, sans fioritures. Va droit au but, comme un coach militaire.", color: '#f59e0b' },
    { value: 'scientific', label: 'Scientifique & analytique', description: "Explications basées sur des mécanismes physiologiques et des données.", color: '#22d3ee' },
  ];

  const detailOptions: { value: DetailLevel; label: string; description: string }[] = [
    { value: 'short', label: 'Concis', description: '3-5 phrases max. Idéal pour des réponses rapides.' },
    { value: 'detailed', label: 'Détaillé', description: '2-3 paragraphes avec exemples pratiques.' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Mon Profil</Text>

        {profile ? (
          <View style={styles.card}>
            <Row label="Objectif" value={profile.goal ? capitalize(profile.goal) : null} />
            <Row label="Niveau" value={profile.fitness_level ? capitalize(profile.fitness_level) : null} />
            <Row label="Poids" value={profile.body_weight ? `${profile.body_weight} kg` : null} />
            <Row label="Taille" value={profile.body_height ? `${profile.body_height} cm` : null} />
            <Row label="Âge" value={profile.body_age} />
            {profile.equipment && profile.equipment.length > 0 && (
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Équipement</Text>
                <Text style={styles.rowValue}>{profile.equipment.map(capitalize).join(', ')}</Text>
              </View>
            )}
            {profile.available_days && profile.available_days.length > 0 && (
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Jours d'entraînement</Text>
                <Text style={styles.rowValue}>
                  {profile.available_days
                    .map((d) => ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'][d])
                    .join(', ')}
                </Text>
              </View>
            )}
            {profile.injury_notes ? (
              <View style={[styles.row, { borderBottomWidth: 0 }]}>
                <Text style={styles.rowLabel}>Blessures</Text>
                <Text style={styles.rowValue}>{profile.injury_notes}</Text>
              </View>
            ) : null}
          </View>
        ) : (
          <Text style={styles.noProfile}>Aucun profil trouvé.</Text>
        )}

        {/* ─── AI Settings ─── */}
        <Text style={styles.sectionTitle}>Paramètres IA</Text>

        <Text style={styles.subTitle}>Style de coaching</Text>
        {styleOptions.map((opt) => (
          <OptionBtn
            key={opt.value}
            label={opt.label}
            description={opt.description}
            selected={coaching_style === opt.value}
            onPress={() => setCoachingStyle(opt.value)}
            color={opt.color}
          />
        ))}

        <Text style={[styles.subTitle, { marginTop: 16 }]}>Niveau de détail</Text>
        {detailOptions.map((opt) => (
          <OptionBtn
            key={opt.value}
            label={opt.label}
            description={opt.description}
            selected={detail_level === opt.value}
            onPress={() => setDetailLevel(opt.value)}
            color="#a78bfa"
          />
        ))}

        <Text style={styles.aiNote}>
          Ces paramètres s'appliquent à tous les chats IA (Nutrition, Cardio, Adaptation de séance).
        </Text>

        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Se déconnecter</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f' },
  content: { padding: 20, paddingBottom: 40 },
  title: { color: '#ffffff', fontSize: 24, fontWeight: '700', marginBottom: 20 },
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    marginBottom: 28,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  rowLabel: { color: '#888', fontSize: 14, fontWeight: '500' },
  rowValue: { color: '#ffffff', fontSize: 14, fontWeight: '600', textAlign: 'right', flex: 1, marginLeft: 16 },
  noProfile: { color: '#555', fontSize: 14, textAlign: 'center', marginTop: 40, marginBottom: 28 },

  sectionTitle: {
    color: '#aaa',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 14,
  },
  subTitle: { color: '#666', fontSize: 12, fontWeight: '600', marginBottom: 8, marginTop: 4 },

  aiNote: { color: '#333', fontSize: 11, textAlign: 'center', marginTop: 12, marginBottom: 28, lineHeight: 16 },

  signOutBtn: {
    backgroundColor: '#ef444422',
    borderColor: '#ef4444',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  signOutText: { color: '#ef4444', fontWeight: '700', fontSize: 15 },
});
