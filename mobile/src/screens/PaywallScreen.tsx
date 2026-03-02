import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useSubscriptionStore } from '../store/subscriptionStore';

const PRO_FEATURES = [
  { icon: '🤖', title: 'Programmes IA illimités', desc: 'Génère des plans sur mesure en quelques secondes' },
  { icon: '💬', title: 'Coach IA illimité', desc: 'Messages illimités avec historique complet' },
  { icon: '📈', title: 'Progression optimisée', desc: 'Le coach adapte chaque programme à tes résultats' },
  { icon: '⚡', title: 'Accès prioritaire', desc: 'Toujours le meilleur modèle IA disponible' },
];

export default function PaywallScreen() {
  const navigation = useNavigation();
  const { openCheckout } = useSubscriptionStore();
  const [loading, setLoading] = useState<'monthly' | 'yearly' | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');

  const handleSubscribe = async () => {
    setLoading(selectedPlan);
    const { error } = await openCheckout(selectedPlan);
    setLoading(null);

    if (error) {
      if (error.includes('not configured')) {
        Alert.alert('Indisponible', 'Le paiement n\'est pas encore configuré.');
      } else {
        Alert.alert('Erreur', error);
      }
    } else {
      const { status } = useSubscriptionStore.getState();
      if (status === 'pro') {
        Alert.alert('Bienvenue Pro !', 'Ton abonnement est actif.', [
          { text: 'Super !', onPress: () => navigation.goBack() },
        ]);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>

        <View style={styles.badge}>
          <Text style={styles.badgeText}>PRO</Text>
        </View>

        <Text style={styles.title}>Passe à GymCoach Pro</Text>
        <Text style={styles.subtitle}>
          Entraîne-toi smarter avec un coach IA sans limites
        </Text>

        {/* Features */}
        <View style={styles.featureList}>
          {PRO_FEATURES.map((f) => (
            <View key={f.title} style={styles.featureRow}>
              <Text style={styles.featureIcon}>{f.icon}</Text>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureDesc}>{f.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Plan selector */}
        <View style={styles.planRow}>
          <TouchableOpacity
            style={[styles.planCard, selectedPlan === 'yearly' && styles.planCardSelected]}
            onPress={() => setSelectedPlan('yearly')}
            activeOpacity={0.8}
          >
            {selectedPlan === 'yearly' && (
              <View style={styles.bestValueBadge}>
                <Text style={styles.bestValueText}>-33%</Text>
              </View>
            )}
            <Text style={styles.planDuration}>Annuel</Text>
            <Text style={styles.planPrice}>6,67€<Text style={styles.planPer}>/mois</Text></Text>
            <Text style={styles.planBilled}>79,99€ / an</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.planCard, selectedPlan === 'monthly' && styles.planCardSelected]}
            onPress={() => setSelectedPlan('monthly')}
            activeOpacity={0.8}
          >
            <Text style={styles.planDuration}>Mensuel</Text>
            <Text style={styles.planPrice}>9,99€<Text style={styles.planPer}>/mois</Text></Text>
            <Text style={styles.planBilled}>Résiliable à tout moment</Text>
          </TouchableOpacity>
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={[styles.ctaBtn, loading && styles.ctaBtnDisabled]}
          onPress={handleSubscribe}
          disabled={!!loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.ctaText}>
              Commencer l'essai — {selectedPlan === 'yearly' ? '79,99€/an' : '9,99€/mois'}
            </Text>
          )}
        </TouchableOpacity>

        <Text style={styles.legal}>
          Paiement sécurisé par Stripe. Résiliable à tout moment depuis les paramètres.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  scroll: { padding: 20, paddingBottom: 40 },

  closeBtn: { alignSelf: 'flex-end', padding: 4, marginBottom: 8 },
  closeText: { color: '#555', fontSize: 18 },

  badge: {
    alignSelf: 'center',
    backgroundColor: '#a78bfa22',
    borderWidth: 1,
    borderColor: '#a78bfa',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 16,
  },
  badgeText: { color: '#a78bfa', fontSize: 12, fontWeight: '800', letterSpacing: 2 },

  title: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
  },

  featureList: { gap: 16, marginBottom: 28 },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  featureIcon: { fontSize: 24, marginTop: 2 },
  featureText: { flex: 1 },
  featureTitle: { color: '#fff', fontSize: 15, fontWeight: '600', marginBottom: 2 },
  featureDesc: { color: '#666', fontSize: 13, lineHeight: 18 },

  planRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  planCard: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    padding: 16,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  planCardSelected: {
    borderColor: '#a78bfa',
    backgroundColor: '#a78bfa11',
  },
  bestValueBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#a78bfa',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderBottomLeftRadius: 8,
  },
  bestValueText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  planDuration: { color: '#888', fontSize: 12, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase' },
  planPrice: { color: '#fff', fontSize: 22, fontWeight: '800' },
  planPer: { fontSize: 13, fontWeight: '400', color: '#888' },
  planBilled: { color: '#555', fontSize: 11, marginTop: 4, textAlign: 'center' },

  ctaBtn: {
    backgroundColor: '#a78bfa',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  ctaBtnDisabled: { opacity: 0.6 },
  ctaText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  legal: { color: '#444', fontSize: 11, textAlign: 'center', lineHeight: 16 },
});
