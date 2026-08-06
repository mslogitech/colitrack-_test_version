/**
 * Script de peuplement : génère un parc de bus de démonstration
 * avec des trajets réalistes entre grandes villes camerounaises.
 *
 * Usage : node seed-buses.js
 * (le backend n'a pas besoin de tourner, ce script écrit directement dans la base)
 */
const path = require('path');
const { Low } = require('lowdb');
const { JSONFile } = require('lowdb/node');
const { v4: uuidv4 } = require('uuid');

const file = path.join(__dirname, 'db', 'colitrack.json');
const adapter = new JSONFile(file);
const db = new Low(adapter, {});

const VILLES = ['Douala', 'Yaoundé', 'Bafoussam', 'Bamenda', 'Garoua', 'Maroua', 'Bertoua', 'Ngaoundéré', 'Ebolowa', 'Kribi'];

// Trajets réalistes (les liaisons interurbaines les plus fréquentes au Cameroun)
const TRAJETS = [
  ['Douala', 'Yaoundé'], ['Yaoundé', 'Douala'],
  ['Douala', 'Bafoussam'], ['Bafoussam', 'Douala'],
  ['Douala', 'Bamenda'], ['Bamenda', 'Douala'],
  ['Yaoundé', 'Bafoussam'], ['Bafoussam', 'Yaoundé'],
  ['Yaoundé', 'Garoua'], ['Garoua', 'Yaoundé'],
  ['Yaoundé', 'Maroua'], ['Maroua', 'Yaoundé'],
  ['Yaoundé', 'Bertoua'], ['Bertoua', 'Yaoundé'],
  ['Yaoundé', 'Ngaoundéré'], ['Ngaoundéré', 'Yaoundé'],
  ['Douala', 'Kribi'], ['Kribi', 'Douala'],
  ['Douala', 'Ebolowa'], ['Ebolowa', 'Douala'],
  ['Yaoundé', 'Ebolowa'], ['Ebolowa', 'Yaoundé'],
  ['Bafoussam', 'Bamenda'], ['Bamenda', 'Bafoussam'],
  ['Garoua', 'Maroua'], ['Maroua', 'Garoua'],
  ['Ngaoundéré', 'Garoua'], ['Garoua', 'Ngaoundéré'],
  ['Douala', 'Bertoua'], ['Bertoua', 'Douala'],
];

const AGENCES = ['Général Express', 'Touristique Express', 'Vatican Express', 'Guichet Express', 'Buca Voyages'];
const HEURES = ['06:00', '07:30', '09:00', '10:30', '12:00', '13:30', '15:00', '16:30', '18:00', '20:00'];

function generateQRToken() {
  return `${uuidv4()}-${Date.now()}`;
}

function plaqueAleatoire() {
  const lettres = () => Array.from({ length: 2 }, () => String.fromCharCode(65 + Math.floor(Math.random() * 26))).join('');
  const chiffres = () => String(Math.floor(100 + Math.random() * 900));
  return `CE-${chiffres()}-${lettres()}`;
}

async function seed() {
  await db.read();
  db.data ||= {};
  db.data.bus ||= [];
  db.data.agents ||= [];
  db.data.pre_enrolements ||= [];
  db.data.colis ||= [];
  db.data.manifestes ||= [];
  db.data.historique_scans ||= [];

  const nombreBus = 35;
  const nouveauxBus = [];

  for (let i = 0; i < nombreBus; i++) {
    const [ville_depart, ville_arrivee] = TRAJETS[i % TRAJETS.length];
    const agence = AGENCES[i % AGENCES.length];
    const bus = {
      id: uuidv4(),
      qr_bus: generateQRToken(),
      immatriculation: plaqueAleatoire(),
      agence,
      ville_depart,
      ville_arrivee,
      heure_depart: HEURES[i % HEURES.length],
      statut: 'en_attente',
      created_at: new Date().toISOString(),
    };
    nouveauxBus.push(bus);
  }

  db.data.bus.push(...nouveauxBus);
  await db.write();

  console.log(`✅ ${nouveauxBus.length} bus créés avec succès.\n`);
  console.log('Aperçu des trajets couverts :');
  const trajetsUniques = [...new Set(nouveauxBus.map((b) => `${b.ville_depart} → ${b.ville_arrivee}`))];
  trajetsUniques.forEach((t) => console.log(`  - ${t}`));
  console.log(`\nTotal bus dans la base : ${db.data.bus.length}`);
}

seed().catch((err) => {
  console.error('Erreur lors du peuplement :', err);
  process.exit(1);
});
