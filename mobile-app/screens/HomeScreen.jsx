import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getEnviosLocaux, synchroniserFileAttente } from '../api/client';
import { colors, typography, STATUT_LABELS } from '../theme';

export default function HomeScreen({ navigation }) {
  const [envois, setEnvois] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const charger = useCallback(async () => {
    const locaux = await getEnviosLocaux();
    setEnvois(locaux);
    await synchroniserFileAttente();
  }, []);

  useFocusEffect(useCallback(() => { charger(); }, [charger]));

  async function onRefresh() {
    setRefreshing(true);
    await charger();
    setRefreshing(false);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={styles.logoMark} />
          <Text style={styles.brand}>COLITRACK</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Paramètres')} style={styles.settingsBtn}>
          <Text style={styles.settingsBtnText}>⚙</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.hero}>Envoyez un colis en quelques secondes</Text>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.primaryAction} onPress={() => navigation.navigate('Pré-enrôlement')}>
          <Text style={styles.primaryActionText}>+ Nouvel envoi</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryAction} onPress={() => navigation.navigate('Suivi')}>
          <Text style={styles.secondaryActionText}>Suivre un colis</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Mes derniers envois</Text>

      <FlatList
        data={envois}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Aucun envoi pour le moment.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.envoiCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.envoiRoute}>{item.ville_depart} → {item.ville_arrivee}</Text>
              <Text style={styles.envoiDest}>{item.destinataire_nom}</Text>
            </View>
            <Text style={styles.envoiStatut}>{STATUT_LABELS[item.statut] || item.statut}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 20, paddingTop: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  settingsBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  settingsBtnText: { color: colors.textMuted, fontSize: 16 },
  logoMark: { width: 12, height: 12, backgroundColor: colors.accent, borderRadius: 3, transform: [{ rotate: '45deg' }], marginRight: 10 },
  brand: { ...typography.display, fontSize: 18, color: colors.text, letterSpacing: -0.5 },
  hero: { ...typography.display, fontSize: 24, color: colors.text, marginBottom: 20, lineHeight: 30 },
  actions: { flexDirection: 'row', gap: 10, marginBottom: 28 },
  primaryAction: { flex: 1, backgroundColor: colors.accent, borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  primaryActionText: { color: '#1A1206', fontWeight: '700' },
  secondaryAction: { flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  secondaryActionText: { color: colors.text, fontWeight: '600' },
  sectionTitle: { color: colors.textMuted, fontSize: 13, fontWeight: '600', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  empty: { paddingVertical: 40, alignItems: 'center' },
  emptyText: { color: colors.textMuted },
  envoiCard: {
    flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 12, padding: 14,
    marginBottom: 10, borderWidth: 1, borderColor: colors.border, alignItems: 'center',
  },
  envoiRoute: { color: colors.text, fontWeight: '600', fontSize: 14 },
  envoiDest: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  envoiStatut: { color: colors.accent, fontSize: 11, fontWeight: '600' },
});
