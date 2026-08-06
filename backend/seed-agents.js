/**
 * Script de peuplement : crée les deux comptes agents de test
 * (guichet + quai), avec mot de passe déjà hashé, directement dans la base.
 *
 * Usage : node seed-agents.js
 * (le backend n'a pas besoin de tourner, ce script écrit directement dans la base)
 */
const path = require('path');
const bcrypt = require('bcryptjs');
const { Low } = require('lowdb');
const { JSONFile } = require('lowdb/node');
const { v4: uuidv4 } = require('uuid');

const file = path.join(__dirname, 'db', 'colitrack.json');
const adapter = new JSONFile(file);
const db = new Low(adapter, {});

const COMPTES = [
  { nom: 'Aline Guichet', email: 'guichet@colitrack.cm', password: 'test123', role: 'guichet', agence: 'Douala Central' },
  { nom: 'Paul Quai', email: 'quai@colitrack.cm', password: 'test123', role: 'quai', agence: 'Douala Central' },
];

async function seed() {
  await db.read();
  db.data ||= {};
  db.data.agents ||= [];
  db.data.pre_enrolements ||= [];
  db.data.colis ||= [];
  db.data.bus ||= [];
  db.data.manifestes ||= [];
  db.data.historique_scans ||= [];

  for (const compte of COMPTES) {
    const existant = db.data.agents.find((a) => a.email === compte.email);
    if (existant) {
      console.log(`⏭  ${compte.email} existe déjà, on ne recrée pas.`);
      continue;
    }
    const hashedPassword = await bcrypt.hash(compte.password, 10);
    db.data.agents.push({
      id: uuidv4(),
      nom: compte.nom,
      email: compte.email,
      password: hashedPassword,
      role: compte.role,
      agence: compte.agence,
      created_at: new Date().toISOString(),
    });
    console.log(`✅ Compte créé : ${compte.email} (${compte.role}) / mot de passe : ${compte.password}`);
  }

  await db.write();
  console.log(`\nTotal agents dans la base : ${db.data.agents.length}`);
}

seed().catch((err) => {
  console.error('Erreur lors du peuplement des agents :', err);
  process.exit(1);
});
