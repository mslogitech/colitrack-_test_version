/**
 * Génère des colis de démonstration répartis sur les 14 derniers jours,
 * avec des statuts, prix et agences variés, pour peupler le module Statistiques
 * avec des données réalistes. Usage : node seed-demo-data.js
 */
const path = require('path');
const { Low } = require('lowdb');
const { JSONFile } = require('lowdb/node');
const { v4: uuidv4 } = require('uuid');

const file = path.join(__dirname, 'db', 'colitrack.json');
const adapter = new JSONFile(file);
const db = new Low(adapter, {});

const VILLES_PAIRES = [
  ['Douala', 'Yaoundé'], ['Yaoundé', 'Douala'], ['Douala', 'Bafoussam'],
  ['Yaoundé', 'Garoua'], ['Douala', 'Bamenda'], ['Yaoundé', 'Bertoua'],
];
const AGENCES = ['Douala Central', 'Yaoundé Mvan', 'Bafoussam Centre'];
const STATUT_WEIGHTS = [
  ['valide', 3], ['charge', 2], ['en_transit', 2], ['arrive', 1], ['livre', 8],
];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function pickWeighted(pairs) {
  const total = pairs.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [val, w] of pairs) {
    if (r < w) return val;
    r -= w;
  }
  return pairs[0][0];
}

function generateQRToken() {
  return `${uuidv4()}-${Date.now()}`;
}

function randomDateWithinDays(nbJours) {
  const now = Date.now();
  const offsetMs = Math.random() * nbJours * 24 * 60 * 60 * 1000;
  return new Date(now - offsetMs);
}

async function seed() {
  await db.read();
  db.data ||= {};
  db.data.agents ||= [];
  db.data.pre_enrolements ||= [];
  db.data.colis ||= [];
  db.data.bus ||= [];
  db.data.manifestes ||= [];
  db.data.historique_scans ||= [];

  const agents = db.data.agents;
  if (agents.length === 0) {
    console.log('⚠️  Aucun agent trouvé. Lancez d\'abord: node seed-agents.js');
    process.exit(1);
  }

  const nombreColis = 120;
  const nouveauxColis = [];

  for (let i = 0; i < nombreColis; i++) {
    const [ville_depart, ville_arrivee] = pick(VILLES_PAIRES);
    const createdAt = randomDateWithinDays(14);
    const statut = pickWeighted(STATUT_WEIGHTS);
    const agent = pick(agents);
    const prix = Math.round((2000 + Math.random() * 8000) / 100) * 100;

    const colis = {
      id: uuidv4(),
      qr_final: generateQRToken(),
      pre_enrolement_id: uuidv4(),
      expediteur_nom: `Client${i}`,
      expediteur_telephone: `6${Math.floor(70000000 + Math.random() * 9999999)}`,
      destinataire_nom: `Destinataire${i}`,
      destinataire_telephone: `6${Math.floor(70000000 + Math.random() * 9999999)}`,
      ville_depart,
      ville_arrivee,
      description_colis: 'Colis de démonstration',
      poids_final: Math.round((1 + Math.random() * 20) * 10) / 10,
      prix,
      statut,
      bus_id: statut !== 'valide' ? uuidv4() : null,
      otp: statut === 'arrive' ? String(Math.floor(1000 + Math.random() * 9000)) : null,
      agent_validation_id: agent.id,
      champs_corriges_par_agent: [],
      created_at: createdAt.toISOString(),
    };

    if (statut === 'livre') {
      const delaiHeures = 3 + Math.random() * 30; // livraison entre 3h et 33h après validation
      colis.livre_at = new Date(createdAt.getTime() + delaiHeures * 60 * 60 * 1000).toISOString();
    }

    nouveauxColis.push(colis);
  }

  db.data.colis.push(...nouveauxColis);
  await db.write();

  console.log(`✅ ${nouveauxColis.length} colis de démonstration créés (répartis sur 14 jours).`);
  const parStatut = nouveauxColis.reduce((acc, c) => { acc[c.statut] = (acc[c.statut] || 0) + 1; return acc; }, {});
  console.log('Répartition:', parStatut);
  console.log(`Total colis dans la base : ${db.data.colis.length}`);
}

seed().catch((err) => {
  console.error('Erreur lors du peuplement des données de démonstration :', err);
  process.exit(1);
});
