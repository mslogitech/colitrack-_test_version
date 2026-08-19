const express = require("express");
const { supabaseAdmin } = require("../supabaseClient");
const { ETAPES } = require("../utils/constants");

const router = express.Router();

var STATUT_LABELS = { enregistre: "Enregistré", charge: "Chargé", depart: "En route", arrive: "Livré" };

// Limitation de débit très simple en mémoire, pour dissuader l'énumération d'identifiants
// de colis par force brute. Suffisant pour une phase de lancement ; à remplacer par un
// vrai middleware (ex: express-rate-limit + store partagé) si le trafic grossit.
var tentatives = new Map(); // ip -> [timestamps]
var FENETRE_MS = 60 * 1000;
var MAX_TENTATIVES = 20;

function rateLimitPublic(req, res, next) {
  var ip = req.ip;
  var maintenant = Date.now();
  var historique = (tentatives.get(ip) || []).filter(function (t) { return maintenant - t < FENETRE_MS; });
  if (historique.length >= MAX_TENTATIVES) {
    return res.status(429).json({ erreur: "Trop de recherches. Réessaie dans une minute." });
  }
  historique.push(maintenant);
  tentatives.set(ip, historique);
  next();
}

/**
 * GET /api/public/colis/:id
 * Suivi public d'un colis — aucune authentification requise.
 * Ne renvoie QUE les informations nécessaires au suivi : ni téléphone, ni agent,
 * ni aucune autre donnée sensible ou interne.
 */
router.get("/colis/:id", rateLimitPublic, async (req, res) => {
  var id = (req.params.id || "").trim().toUpperCase();
  if (!id) {
    return res.status(400).json({ erreur: "Numéro de suivi manquant." });
  }

  var { data: colis, error } = await supabaseAdmin
    .from("colis")
    .select("id, ville_depart, ville_arrivee, description, poids, statut, created_at, updated_at")
    .eq("id", id)
    .single();

  if (error || !colis) {
    return res.status(404).json({ erreur: "Aucun colis ne correspond à ce numéro de suivi." });
  }

  var { data: historique } = await supabaseAdmin
    .from("colis_historique")
    .select("etape, created_at")
    .eq("colis_id", id)
    .order("created_at", { ascending: true });

  res.json({
    id: colis.id,
    villeDepart: colis.ville_depart,
    villeArrivee: colis.ville_arrivee,
    description: colis.description,
    poids: colis.poids,
    statut: colis.statut,
    statutLabel: STATUT_LABELS[colis.statut] || colis.statut,
    etapes: ETAPES.map(function (etape) {
      var passage = (historique || []).find(function (h) { return h.etape === etape; });
      return { etape: etape, label: STATUT_LABELS[etape], franchie: !!passage, date: passage ? passage.created_at : null };
    }),
    derniereMiseAJour: colis.updated_at,
  });
});

module.exports = router;
