const { Low } = require('lowdb');
const { JSONFile } = require('lowdb/node');
const path = require('path');

const file = path.join(__dirname, 'colitrack.json');
const adapter = new JSONFile(file);

const defaultData = {
  agents: [],
  pre_enrolements: [],
  colis: [],
  bus: [],
  manifestes: [],
  historique_scans: [],
};

const db = new Low(adapter, defaultData);

async function initDB() {
  await db.read();
  db.data ||= defaultData;
  // Ensure all collections exist even if file already existed partially
  for (const key of Object.keys(defaultData)) {
    if (!db.data[key]) db.data[key] = [];
  }
  await db.write();
  return db;
}

module.exports = { db, initDB };
