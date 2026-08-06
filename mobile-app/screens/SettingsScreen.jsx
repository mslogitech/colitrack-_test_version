import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { getApiBase, setApiBase, testerConnexion, synchroniserFileAttente } from '../api/client';
import { colors, typography } from '../theme';

export default function SettingsScreen() {
  const [url, setUrl] = useState('');
  const [savedUrl, setSavedUrl] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null); // { ok, message }
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getApiBase().then((current) => {
      setUrl(current);
      setSavedUrl(current);
    });
  }, []);

  async function handleTester() {
    setTesting(true);
    setTestResult(null);
    const result = await testerConnexion(url);
    setTestResult(result);
    setTesting(false);
  }

  async function handleEnregistrer() {
    setSaving(true);
    try {
      const clean = await setApiBase(url);
      setSavedUrl(clean);
      Alert.alert('Adresse enregistrée', `L'application utilisera désormais :\n${clean}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleSyncManuelle() {
    const result = await synchroniserFileAttente();
    if (result.synced > 0) {
      Alert.alert('Synchronisation', `${result.synced} envoi(s) en attente ont été synchronisés.`);
    } else {
      Alert.alert('Synchronisation', 'Aucun envoi en attente à synchroniser.');
    }
  }

  const modifie = url.trim() !== savedUrl;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.title}>Paramètres</Text>
      <Text style={styles.subtitle}>Configuration de la connexion au serveur COLITRACK</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Adresse du serveur</Text>
        <Text style={styles.help}>
          Exemple : http://192.168.1.42:3000/api — demandez cette adresse à votre agence
          si vous ne la connaissez pas.
        </Text>
        <TextInput
          style={styles.input}
          value={url}
          onChangeText={setUrl}
          placeholder="http://192.168.1.42:3000/api"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />

        <TouchableOpacity style={styles.secondaryBtn} onPress={handleTester} disabled={testing || !url}>
          {testing ? <ActivityIndicator color={colors.text} /> : <Text style={styles.secondaryBtnText}>Tester la connexion</Text>}
        </TouchableOpacity>

        {testResult && (
          <View style={[styles.resultBox, testResult.ok ? styles.resultOk : styles.resultError]}>
            <Text style={testResult.ok ? styles.resultOkText : styles.resultErrorText}>
              {testResult.ok ? '✓ Connexion réussie au serveur.' : `✗ Échec : ${testResult.message}`}
            </Text>
          </View>
        )}

        <TouchableOpacity style={[styles.primaryBtn, !modifie && styles.btnDisabled]} onPress={handleEnregistrer} disabled={!modifie || saving}>
          {saving ? <ActivityIndicator color="#1A1206" /> : <Text style={styles.primaryBtnText}>Enregistrer cette adresse</Text>}
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Synchronisation hors-ligne</Text>
        <Text style={styles.help}>
          Les envois créés sans connexion sont mis en attente et synchronisés automatiquement.
          Vous pouvez aussi forcer la synchronisation ici.
        </Text>
        <TouchableOpacity style={styles.secondaryBtn} onPress={handleSyncManuelle}>
          <Text style={styles.secondaryBtnText}>Synchroniser maintenant</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>À propos</Text>
        <Row label="Application" value="COLITRACK Mobile" />
        <Row label="Version" value="1.0.0" />
        <Row label="Adresse active" value={savedUrl || '—'} />
      </View>
    </ScrollView>
  );
}

function Row({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  title: { ...typography.display, fontSize: 22, color: colors.text, marginBottom: 4 },
  subtitle: { color: colors.textMuted, fontSize: 13, marginBottom: 24 },
  section: { backgroundColor: colors.surface, borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.border },
  sectionTitle: { ...typography.display, fontSize: 14, color: colors.accent, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  help: { color: colors.textMuted, fontSize: 12, marginBottom: 12, lineHeight: 17 },
  input: {
    backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, borderRadius: 10,
    padding: 12, color: colors.text, fontSize: 14, marginBottom: 10, fontFamily: 'monospace',
  },
  primaryBtn: { backgroundColor: colors.accent, borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 10 },
  primaryBtnText: { color: '#1A1206', fontWeight: '700' },
  btnDisabled: { opacity: 0.4 },
  secondaryBtn: { backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12, alignItems: 'center' },
  secondaryBtnText: { color: colors.text, fontWeight: '600', fontSize: 13 },
  resultBox: { borderRadius: 8, padding: 10, marginTop: 10 },
  resultOk: { backgroundColor: colors.successBg, borderWidth: 1, borderColor: '#1E4A31' },
  resultError: { backgroundColor: colors.dangerBg, borderWidth: 1, borderColor: '#5B2226' },
  resultOkText: { color: colors.success, fontSize: 13 },
  resultErrorText: { color: '#FF9A9E', fontSize: 13 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  rowLabel: { color: colors.textMuted, fontSize: 13 },
  rowValue: { color: colors.text, fontSize: 13, fontWeight: '600', maxWidth: '60%' },
});
