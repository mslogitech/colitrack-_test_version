import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { creerPreEnrolement } from '../api/client';
import { isValidName, isValidCameroonPhone } from '../utils/validators';
import { colors, typography } from '../theme';

const VILLES = ['Douala', 'Yaoundé', 'Bafoussam', 'Bamenda', 'Garoua', 'Maroua', 'Bertoua', 'Ngaoundéré'];

export default function PreEnrolementScreen({ navigation }) {
  const [form, setForm] = useState({
    expediteur_nom: '',
    expediteur_telephone: '',
    destinataire_nom: '',
    destinataire_telephone: '',
    ville_depart: '',
    ville_arrivee: '',
    description_colis: '',
    poids_estime: '',
  });
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function markTouched(key) {
    setTouched((t) => ({ ...t, [key]: true }));
  }

  // Retourne un message d'erreur pour un champ donné, ou null si valide/pas encore rempli
  function fieldError(key) {
    const value = form[key];
    if (!value) return null;
    if (key.endsWith('_nom') && !isValidName(value)) {
      return 'Lettres uniquement, 2 caractères minimum.';
    }
    if (key.endsWith('_telephone') && !isValidCameroonPhone(value)) {
      return 'Numéro camerounais invalide (ex: 677123456).';
    }
    return null;
  }

  function isValid() {
    const required = ['expediteur_nom', 'expediteur_telephone', 'destinataire_nom', 'destinataire_telephone', 'ville_depart', 'ville_arrivee', 'description_colis'];
    const rempli = required.every((k) => form[k].trim().length > 0);
    if (!rempli) return false;
    const nomsValides = isValidName(form.expediteur_nom) && isValidName(form.destinataire_nom);
    const telsValides = isValidCameroonPhone(form.expediteur_telephone) && isValidCameroonPhone(form.destinataire_telephone);
    return nomsValides && telsValides;
  }

  async function handleSubmit() {
    setTouched({
      expediteur_nom: true, expediteur_telephone: true,
      destinataire_nom: true, destinataire_telephone: true,
    });
    if (!isValid()) {
      Alert.alert('Formulaire invalide', 'Vérifiez les champs en rouge : noms et numéros de téléphone doivent être valides.');
      return;
    }
    if (form.ville_depart === form.ville_arrivee) {
      Alert.alert('Trajet invalide', 'La ville de départ et d\'arrivée doivent être différentes.');
      return;
    }
    setLoading(true);
    const result = await creerPreEnrolement({
      ...form,
      poids_estime: form.poids_estime ? Number(form.poids_estime) : undefined,
    });
    setLoading(false);

    if (result.success) {
      navigation.navigate('Confirmation', { preEnrolement: result.data.pre_enrolement });
    } else if (result.offline) {
      Alert.alert('Mode hors ligne', result.message, [
        { text: 'OK', onPress: () => navigation.navigate('Accueil') },
      ]);
    } else {
      Alert.alert('Erreur', result.message);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Envoyer un colis</Text>
        <Text style={styles.subtitle}>Remplissez les informations, un QR sera généré pour le guichet</Text>

        <Section title="Expéditeur (vous)">
          <Field
            label="Nom complet"
            value={form.expediteur_nom}
            onChangeText={(v) => update('expediteur_nom', v)}
            onBlur={() => markTouched('expediteur_nom')}
            error={touched.expediteur_nom ? fieldError('expediteur_nom') : null}
          />
          <Field
            label="Téléphone"
            value={form.expediteur_telephone}
            onChangeText={(v) => update('expediteur_telephone', v)}
            onBlur={() => markTouched('expediteur_telephone')}
            error={touched.expediteur_telephone ? fieldError('expediteur_telephone') : null}
            keyboardType="phone-pad"
            placeholder="Ex: 677123456"
          />
        </Section>

        <Section title="Destinataire">
          <Field
            label="Nom complet"
            value={form.destinataire_nom}
            onChangeText={(v) => update('destinataire_nom', v)}
            onBlur={() => markTouched('destinataire_nom')}
            error={touched.destinataire_nom ? fieldError('destinataire_nom') : null}
          />
          <Field
            label="Téléphone"
            value={form.destinataire_telephone}
            onChangeText={(v) => update('destinataire_telephone', v)}
            onBlur={() => markTouched('destinataire_telephone')}
            error={touched.destinataire_telephone ? fieldError('destinataire_telephone') : null}
            keyboardType="phone-pad"
            placeholder="Ex: 699333444"
          />
        </Section>

        <Section title="Trajet">
          <PickerRow label="Ville de départ" value={form.ville_depart} options={VILLES} onSelect={(v) => update('ville_depart', v)} />
          <PickerRow label="Ville d'arrivée" value={form.ville_arrivee} options={VILLES} onSelect={(v) => update('ville_arrivee', v)} />
        </Section>

        <Section title="Colis">
          <Field label="Description" value={form.description_colis} onChangeText={(v) => update('description_colis', v)} placeholder="Ex: Carton de vêtements" />
          <Field label="Poids estimé (kg)" value={form.poids_estime} onChangeText={(v) => update('poids_estime', v)} keyboardType="numeric" />
        </Section>

        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color="#1A1206" /> : <Text style={styles.submitText}>Générer mon QR d'enregistrement</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Section({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Field({ label, error, ...props }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.input, error && styles.inputError]}
        placeholderTextColor={colors.textMuted}
        {...props}
      />
      {error && <Text style={styles.fieldError}>{error}</Text>}
    </View>
  );
}

function PickerRow({ label, value, options, onSelect }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 2 }}>
        {options.map((opt) => (
          <TouchableOpacity
            key={opt}
            onPress={() => onSelect(opt)}
            style={[styles.chip, value === opt && styles.chipActive]}
          >
            <Text style={[styles.chipText, value === opt && styles.chipTextActive]}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  container: { padding: 20, paddingBottom: 60 },
  title: { ...typography.display, fontSize: 24, color: colors.text, marginBottom: 4 },
  subtitle: { color: colors.textMuted, fontSize: 13, marginBottom: 24 },
  section: { backgroundColor: colors.surface, borderRadius: 14, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: colors.border },
  sectionTitle: { ...typography.display, fontSize: 14, color: colors.accent, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  field: { marginBottom: 12 },
  fieldLabel: { color: colors.textMuted, fontSize: 12, marginBottom: 6 },
  input: {
    backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, borderRadius: 10,
    padding: 12, color: colors.text, fontSize: 15,
  },
  inputError: {
    borderColor: colors.danger,
  },
  fieldError: {
    color: '#FF9A9E', fontSize: 11, marginTop: 4,
  },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1,
    borderColor: colors.border, marginRight: 8, backgroundColor: colors.bg,
  },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { color: colors.textMuted, fontSize: 13 },
  chipTextActive: { color: '#1A1206', fontWeight: '600' },
  submitBtn: { backgroundColor: colors.accent, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  submitText: { color: '#1A1206', fontWeight: '700', fontSize: 15 },
});
