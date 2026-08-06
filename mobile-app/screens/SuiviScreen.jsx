import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, ScrollView,
} from 'react-native';
import { suivreColis } from '../api/client';
import { colors, typography, STATUT_LABELS } from '../theme';

const ETAPES = ['valide', 'charge', 'en_transit', 'arrive', 'livre'];

export default function SuiviScreen() {
  const [qr, setQr] = useState('');
  const [colis, setColis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSearch() {
    if (!qr.trim()) return;
    setLoading(true);
    setError('');
    setColis(null);
    try {
      const data = await suivreColis(qr.trim());
      setColis(data);
    } catch (err) {
      setError('Colis introuvable. Vérifiez le code QR saisi.');
    } finally {
      setLoading(false);
    }
  }

  const etapeActuelle = colis ? ETAPES.indexOf(colis.statut) : -1;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.title}>Suivre un colis</Text>
      <Text style={styles.subtitle}>Entrez le code figurant sur votre étiquette d'envoi</Text>

      <View style={styles.searchRow}>
        <TextInput
          style={styles.input}
          value={qr}
          onChangeText={setQr}
          placeholder="Code du colis..."
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
        />
        <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
          {loading ? <ActivityIndicator color="#1A1206" /> : <Text style={styles.searchBtnText}>Suivre</Text>}
        </TouchableOpacity>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {colis && (
        <View style={styles.resultCard}>
          <Text style={styles.route}>{colis.ville_depart} → {colis.ville_arrivee}</Text>
          <Text style={styles.statusLabel}>{STATUT_LABELS[colis.statut] || colis.statut}</Text>

          <View style={styles.timeline}>
            {ETAPES.map((etape, i) => (
              <View key={etape} style={styles.timelineRow}>
                <View style={[styles.dot, i <= etapeActuelle && styles.dotActive]} />
                <Text style={[styles.timelineLabel, i <= etapeActuelle && styles.timelineLabelActive]}>
                  {STATUT_LABELS[etape]}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.divider} />
          <Text style={styles.meta}>Destinataire : {colis.destinataire_nom}</Text>
          <Text style={styles.meta}>Description : {colis.description_colis}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  title: { ...typography.display, fontSize: 22, color: colors.text, marginBottom: 4 },
  subtitle: { color: colors.textMuted, fontSize: 13, marginBottom: 20 },
  searchRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  input: {
    flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: 10, padding: 12, color: colors.text,
  },
  searchBtn: { backgroundColor: colors.accent, borderRadius: 10, paddingHorizontal: 18, justifyContent: 'center' },
  searchBtnText: { color: '#1A1206', fontWeight: '700' },
  error: { color: '#FF9A9E', marginBottom: 16 },
  resultCard: { backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 18 },
  route: { ...typography.display, fontSize: 18, color: colors.text, marginBottom: 4 },
  statusLabel: { color: colors.accent, fontSize: 13, fontWeight: '600', marginBottom: 20 },
  timeline: { marginBottom: 16 },
  timelineRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.border, marginRight: 12 },
  dotActive: { backgroundColor: colors.success },
  timelineLabel: { color: colors.textMuted, fontSize: 13 },
  timelineLabelActive: { color: colors.text, fontWeight: '600' },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 12 },
  meta: { color: colors.textMuted, fontSize: 13, marginBottom: 4 },
});
