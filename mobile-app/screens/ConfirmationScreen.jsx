import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { colors, typography } from '../theme';

export default function ConfirmationScreen({ route, navigation }) {
  const { preEnrolement } = route.params;

  return (
    <View style={styles.container}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>Pré-enrôlement confirmé</Text>
      </View>

      <Text style={styles.title}>Présentez ce QR au guichet</Text>
      <Text style={styles.subtitle}>
        L'agent scannera ce code pour finaliser l'enregistrement de votre colis
      </Text>

      <View style={styles.qrCard}>
        <QRCode value={preEnrolement.qr_temporaire} size={220} backgroundColor="#fff" color="#0F1326" />
      </View>

      <View style={styles.details}>
        <Row label="Trajet" value={`${preEnrolement.ville_depart} → ${preEnrolement.ville_arrivee}`} />
        <Row label="Destinataire" value={preEnrolement.destinataire_nom} />
        <Row label="Description" value={preEnrolement.description_colis} />
      </View>

      <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('Accueil')}>
        <Text style={styles.btnText}>Retour à l'accueil</Text>
      </TouchableOpacity>
    </View>
  );
}

function Row({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: 24, alignItems: 'center' },
  badge: {
    backgroundColor: colors.successBg, borderColor: '#1E4A31', borderWidth: 1,
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, marginTop: 20, marginBottom: 20,
  },
  badgeText: { color: colors.success, fontSize: 12, fontWeight: '600' },
  title: { ...typography.display, fontSize: 20, color: colors.text, textAlign: 'center', marginBottom: 6 },
  subtitle: { color: colors.textMuted, fontSize: 13, textAlign: 'center', marginBottom: 24, paddingHorizontal: 10 },
  qrCard: { backgroundColor: '#fff', padding: 20, borderRadius: 16, marginBottom: 24 },
  details: { width: '100%', backgroundColor: colors.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 24 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  rowLabel: { color: colors.textMuted, fontSize: 13 },
  rowValue: { color: colors.text, fontSize: 13, fontWeight: '600', maxWidth: '60%', textAlign: 'right' },
  btn: { backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32 },
  btnText: { color: colors.text, fontWeight: '600' },
});
