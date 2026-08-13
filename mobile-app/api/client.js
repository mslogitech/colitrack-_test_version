import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Valeur de secours si aucune adresse n'a été configurée dans l'écran Paramètres.
// Modifiable aussi directement ici pour un déploiement en production.
const DEFAULT_API_BASE = https://colistracktest.mslogitech.com;
const STORAGE_KEY_API_BASE = 'colitrack_api_base';

let cachedApiBase = DEFAULT_API_BASE;

export async function getApiBase() {
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEY_API_BASE);
    cachedApiBase = saved || DEFAULT_API_BASE;
  } catch (_) {
    cachedApiBase = DEFAULT_API_BASE;
  }
  return cachedApiBase;
}

export async function setApiBase(url) {
  const clean = url.trim().replace(/\/+$/, ''); // retire les / de fin
  await AsyncStorage.setItem(STORAGE_KEY_API_BASE, clean);
  cachedApiBase = clean;
  client.defaults.baseURL = clean;
  return clean;
}

export async function testerConnexion(url) {
  try {
    const testUrl = `${url.trim().replace(/\/+$/, '')}/health`;
    const res = await axios.get(testUrl, { timeout: 5000 });
    return { ok: true, data: res.data };
  } catch (err) {
    return { ok: false, message: err.message };
  }
}

const client = axios.create({ baseURL: DEFAULT_API_BASE, timeout: 15000 });

// Initialise le baseURL réel dès le chargement du module, à partir de la valeur sauvegardée
getApiBase().then((url) => { client.defaults.baseURL = url; });

export async function creerPreEnrolement(payload) {
  try {
    const { data } = await client.post('/pre-enrolement', payload);
    // Sauvegarde locale pour le suivi hors-ligne et l'historique de l'utilisateur
    await enregistrerLocalement(data.pre_enrolement);
    return { success: true, data };
  } catch (err) {
    if (!err.response) {
      // Pas de réseau : on met la demande en file d'attente pour synchronisation ultérieure
      await mettreEnFileAttente(payload);
      return { success: false, offline: true, message: 'Hors ligne. La demande sera envoyée automatiquement dès le retour du réseau.' };
    }
    return { success: false, message: err.response?.data?.message || 'Erreur lors de l\'enregistrement.' };
  }
}

export async function suivreColis(qr) {
  const { data } = await client.get(`/colis/${encodeURIComponent(qr)}`);
  return data.colis;
}

// --- Gestion offline-first ---

const STORAGE_KEY_ENVOIS = 'colitrack_envois_locaux';
const STORAGE_KEY_QUEUE = 'colitrack_file_attente';

async function enregistrerLocalement(preEnrolement) {
  const existants = JSON.parse((await AsyncStorage.getItem(STORAGE_KEY_ENVOIS)) || '[]');
  existants.unshift(preEnrolement);
  await AsyncStorage.setItem(STORAGE_KEY_ENVOIS, JSON.stringify(existants));
}

async function mettreEnFileAttente(payload) {
  const queue = JSON.parse((await AsyncStorage.getItem(STORAGE_KEY_QUEUE)) || '[]');
  queue.push({ payload, timestamp: Date.now() });
  await AsyncStorage.setItem(STORAGE_KEY_QUEUE, JSON.stringify(queue));
}

export async function getEnviosLocaux() {
  return JSON.parse((await AsyncStorage.getItem(STORAGE_KEY_ENVOIS)) || '[]');
}

// Appelé au démarrage de l'app et lors de la reconnexion réseau (voir NetInfo dans App.js)
export async function synchroniserFileAttente() {
  const queue = JSON.parse((await AsyncStorage.getItem(STORAGE_KEY_QUEUE)) || '[]');
  if (queue.length === 0) return { synced: 0 };

  const restants = [];
  let synced = 0;
  for (const item of queue) {
    try {
      const { data } = await client.post('/pre-enrolement', item.payload);
      await enregistrerLocalement(data.pre_enrolement);
      synced += 1;
    } catch {
      restants.push(item); // on garde en attente si toujours pas de réseau
    }
  }
  await AsyncStorage.setItem(STORAGE_KEY_QUEUE, JSON.stringify(restants));
  return { synced, remaining: restants.length };
}

export default client;
