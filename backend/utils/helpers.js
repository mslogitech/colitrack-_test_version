const { v4: uuidv4 } = require('uuid');

function generateQRToken() {
  // UUID + timestamp pour anti-replay, comme spécifié dans le cahier des charges
  return `${uuidv4()}-${Date.now()}`;
}

function generateOTP() {
  // Code à 4 chiffres
  return Math.floor(1000 + Math.random() * 9000).toString();
}

async function logScan(db, { colisId, agentId, type, details }) {
  db.data.historique_scans.push({
    id: uuidv4(),
    colis_id: colisId || null,
    agent_id: agentId || null,
    type, // 'validation' | 'chargement' | 'arrivee' | 'livraison'
    details: details || null,
    timestamp: new Date().toISOString(),
  });
  await db.write();
}

module.exports = { generateQRToken, generateOTP, logScan };
