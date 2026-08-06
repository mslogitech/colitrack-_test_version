const express = require('express');
const router = express.Router();
const { db } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

const NB_JOURS_HISTORIQUE = 14;
const STATUTS = ['valide', 'charge', 'en_transit', 'arrive', 'livre'];

function dateKey(isoString) {
  return new Date(isoString).toISOString().slice(0, 10); // YYYY-MM-DD
}

function derniersJours(n) {
  const jours = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    jours.push(d.toISOString().slice(0, 10));
  }
  return jours;
}

// GET /api/statistiques  (accessible à tout agent authentifié)
router.get('/statistiques', authenticateToken, async (req, res) => {
  const colis = db.data.colis;
  const agents = db.data.agents;
  const bus = db.data.bus;
  const manifestes = db.data.manifestes;

  // --- Totaux généraux ---
  const totalColis = colis.length;
  const totalRevenue = colis.reduce((sum, c) => sum + (Number(c.prix) || 0), 0);
  const colisLivres = colis.filter((c) => c.statut === 'livre');
  const tauxLivraison = totalColis > 0 ? Math.round((colisLivres.length / totalColis) * 100) : 0;

  // --- Répartition par statut ---
  const parStatut = STATUTS.reduce((acc, s) => {
    acc[s] = colis.filter((c) => c.statut === s).length;
    return acc;
  }, {});

  // --- Série temporelle : colis créés et revenu par jour (14 derniers jours) ---
  const jours = derniersJours(NB_JOURS_HISTORIQUE);
  const colisParJour = jours.map((jour) => {
    const colisDuJour = colis.filter((c) => dateKey(c.created_at) === jour);
    return {
      date: jour,
      colis: colisDuJour.length,
      revenue: colisDuJour.reduce((sum, c) => sum + (Number(c.prix) || 0), 0),
    };
  });

  // --- Trajets les plus actifs ---
  const trajetsCount = {};
  for (const c of colis) {
    const key = `${c.ville_depart} → ${c.ville_arrivee}`;
    trajetsCount[key] = (trajetsCount[key] || 0) + 1;
  }
  const topTrajets = Object.entries(trajetsCount)
    .map(([trajet, count]) => ({ trajet, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  // --- Temps moyen de livraison (de la validation à la livraison, en heures) ---
  const delaisLivraison = colisLivres
    .filter((c) => c.created_at && c.livre_at)
    .map((c) => (new Date(c.livre_at) - new Date(c.created_at)) / (1000 * 60 * 60));
  const tempsMoyenLivraisonHeures = delaisLivraison.length > 0
    ? Math.round((delaisLivraison.reduce((a, b) => a + b, 0) / delaisLivraison.length) * 10) / 10
    : null;

  // --- Performance par agence (basée sur l'agent ayant validé le colis) ---
  const agentsById = Object.fromEntries(agents.map((a) => [a.id, a]));
  const parAgence = {};
  for (const c of colis) {
    const agent = agentsById[c.agent_validation_id];
    const agence = agent ? agent.agence : 'Inconnue';
    if (!parAgence[agence]) parAgence[agence] = { agence, total: 0, livres: 0, revenue: 0 };
    parAgence[agence].total += 1;
    if (c.statut === 'livre') parAgence[agence].livres += 1;
    parAgence[agence].revenue += Number(c.prix) || 0;
  }
  const performanceAgences = Object.values(parAgence).sort((a, b) => b.total - a.total);

  // --- Utilisation du parc de bus ---
  const busUtilises = new Set(colis.filter((c) => c.bus_id).map((c) => c.bus_id)).size;
  const tauxUtilisationBus = bus.length > 0 ? Math.round((busUtilises / bus.length) * 100) : 0;

  // --- Colis potentiellement en retard : en transit depuis plus de 24h ---
  const maintenant = Date.now();
  const colisEnRetard = colis.filter((c) => {
    if (c.statut !== 'en_transit') return false;
    const heuresDepuisCreation = (maintenant - new Date(c.created_at)) / (1000 * 60 * 60);
    return heuresDepuisCreation > 24;
  }).length;

  res.json({
    success: true,
    genere_le: new Date().toISOString(),
    totaux: {
      total_colis: totalColis,
      total_revenue: totalRevenue,
      total_bus: bus.length,
      total_manifestes: manifestes.length,
      taux_livraison_pct: tauxLivraison,
      temps_moyen_livraison_heures: tempsMoyenLivraisonHeures,
      taux_utilisation_bus_pct: tauxUtilisationBus,
      colis_en_retard: colisEnRetard,
    },
    par_statut: parStatut,
    serie_temporelle: colisParJour,
    top_trajets: topTrajets,
    performance_agences: performanceAgences,
  });
});

module.exports = router;
