const express = require("express");
const { supabaseAdmin } = require("../supabaseClient");
const { requireAgent, requireRole } = require("../middleware/auth");

const router = express.Router();

// Toutes les routes de ce fichier sont réservées au rôle "chef" (administrateur).
router.use(requireAgent, requireRole("chef"));

/**
 * GET /api/finance/encaissements
 * Liste les encaissements (filtrables par date via ?depuis=YYYY-MM-DD).
 */
router.get("/encaissements", async (req, res) => {
  const { depuis, agentId, limit = 100, offset = 0 } = req.query;

  let query = supabaseAdmin
    .from("encaissements")
    .select("*, agents(nom_complet)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(Number(offset), Number(offset) + Number(limit) - 1);

  if (depuis) query = query.gte("created_at", depuis);
  if (agentId) query = query.eq("agent_id", agentId);

  const { data, error, count } = await query;
  if (error) {
    console.error("Erreur listing encaissements:", error);
    return res.status(500).json({ erreur: "Impossible de récupérer les encaissements." });
  }
  res.json({ total: count, encaissements: data });
});

/**
 * POST /api/finance/encaissements
 * Enregistre un encaissement (généralement déclenché au moment de POST /api/colis,
 * mais exposé séparément pour permettre des encaissements a posteriori ou des créances).
 * Body: { colisId, montant, moyenPaiement }
 */
router.post("/encaissements", async (req, res) => {
  const { colisId, montant, moyenPaiement } = req.body || {};
  if (montant == null || !moyenPaiement) {
    return res.status(400).json({ erreur: "montant et moyenPaiement sont obligatoires." });
  }
  if (!["especes", "orange_money", "mtn_momo", "virement"].includes(moyenPaiement)) {
    return res.status(400).json({ erreur: "Moyen de paiement invalide." });
  }

  const { data, error } = await supabaseAdmin
    .from("encaissements")
    .insert({ colis_id: colisId || null, agent_id: req.agent.id, montant, moyen_paiement: moyenPaiement })
    .select()
    .single();

  if (error) {
    console.error("Erreur création encaissement:", error);
    return res.status(500).json({ erreur: "Impossible d'enregistrer l'encaissement." });
  }
  res.status(201).json(data);
});

/**
 * GET /api/finance/resume
 * KPIs financiers agrégés : revenu du mois en cours, encaissé aujourd'hui,
 * répartition par moyen de paiement sur les 30 derniers jours.
 */
router.get("/resume", async (req, res) => {
  const debutMois = new Date();
  debutMois.setDate(1);
  debutMois.setHours(0, 0, 0, 0);

  const debutJour = new Date();
  debutJour.setHours(0, 0, 0, 0);

  const [{ data: moisData, error: moisError }, { data: jourData, error: jourError }] = await Promise.all([
    supabaseAdmin.from("encaissements").select("montant, moyen_paiement").gte("created_at", debutMois.toISOString()),
    supabaseAdmin.from("encaissements").select("montant").gte("created_at", debutJour.toISOString()),
  ]);

  if (moisError || jourError) {
    console.error("Erreur résumé finance:", moisError || jourError);
    return res.status(500).json({ erreur: "Impossible de calculer le résumé financier." });
  }

  const revenuMois = moisData.reduce((s, e) => s + Number(e.montant), 0);
  const encaisseJour = jourData.reduce((s, e) => s + Number(e.montant), 0);

  const repartition = moisData.reduce((acc, e) => {
    acc[e.moyen_paiement] = (acc[e.moyen_paiement] || 0) + Number(e.montant);
    return acc;
  }, {});

  res.json({
    revenuMois,
    encaisseJour,
    transactionsJour: jourData.length,
    repartitionParMoyen: repartition,
  });
});

module.exports = router;
