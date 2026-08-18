const express = require("express");
const { supabaseAdmin } = require("../supabaseClient");
const { requireAgent } = require("../middleware/auth");
const { genererIdColis } = require("../utils/idGenerator");
const { genererQrDataUrl } = require("../utils/qr");
const { ETAPES, indexEtape } = require("../utils/constants");

const router = express.Router();

// Convertit une ligne snake_case de la DB vers le format attendu par le frontend (camelCase)
function versFormatFrontend(row, qrCode) {
  return {
    id: row.id,
    expNom: row.exp_nom,
    expTel: row.exp_tel,
    destNom: row.dest_nom,
    destTel: row.dest_tel,
    villeDepart: row.ville_depart,
    villeArrivee: row.ville_arrivee,
    description: row.description,
    poids: row.poids,
    statut: row.statut,
    qrCode: qrCode ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * POST /api/colis
 * Enregistre un nouveau colis (agent authentifié requis).
 */
router.post("/", requireAgent, async (req, res) => {
  const { expNom, expTel, destNom, destTel, villeDepart, villeArrivee, description, poids } = req.body || {};

  if (!expNom || !expTel || !destNom || !destTel || !villeDepart || !villeArrivee) {
    return res.status(400).json({ erreur: "Champs obligatoires manquants." });
  }
  if (villeDepart === villeArrivee) {
    return res.status(400).json({ erreur: "La ville de départ et d'arrivée doivent être différentes." });
  }

  const id = genererIdColis();

  const { data, error } = await supabaseAdmin
    .from("colis")
    .insert({
      id,
      exp_nom: expNom,
      exp_tel: expTel,
      dest_nom: destNom,
      dest_tel: destTel,
      ville_depart: villeDepart,
      ville_arrivee: villeArrivee,
      description: description || null,
      poids: poids ?? null,
      statut: "enregistre",
      cree_par: req.agent.id,
    })
    .select()
    .single();

  if (error) {
    console.error("Erreur insertion colis:", error);
    return res.status(500).json({ erreur: "Impossible d'enregistrer le colis." });
  }

  await supabaseAdmin
    .from("colis_historique")
    .insert({ colis_id: id, etape: "enregistre", agent_id: req.agent.id });

  const qrCode = await genererQrDataUrl(id);
  res.status(201).json(versFormatFrontend(data, qrCode));
});

/**
 * GET /api/colis
 * Liste les colis (tableau de bord admin), avec filtres optionnels.
 * Query params: statut, ville, q (recherche id/nom), limit, offset
 */
router.get("/", requireAgent, async (req, res) => {
  const { statut, ville, q, limit = 50, offset = 0 } = req.query;

  let query = supabaseAdmin
    .from("colis")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(Number(offset), Number(offset) + Number(limit) - 1);

  if (statut) query = query.eq("statut", statut);
  if (ville) query = query.or(`ville_depart.eq.${ville},ville_arrivee.eq.${ville}`);
  if (q) query = query.or(`id.ilike.%${q}%,exp_nom.ilike.%${q}%,dest_nom.ilike.%${q}%`);

  const { data, error, count } = await query;
  if (error) {
    console.error("Erreur listing colis:", error);
    return res.status(500).json({ erreur: "Impossible de récupérer la liste des colis." });
  }

  res.json({
    total: count,
    colis: data.map((row) => versFormatFrontend(row)),
  });
});

/**
 * GET /api/colis/:id
 * Détail d'un colis (utilisé aussi par le sondage régulier du frontend).
 */
router.get("/:id", requireAgent, async (req, res) => {
  const { data, error } = await supabaseAdmin.from("colis").select("*").eq("id", req.params.id).single();
  if (error || !data) {
    return res.status(404).json({ erreur: "Colis introuvable." });
  }
  // Régénéré à la volée (pas stocké en base) : le QR n'encode que l'id, donc reproductible à tout moment.
  const qrCode = await genererQrDataUrl(data.id);
  res.json(versFormatFrontend(data, qrCode));
});

/**
 * POST /api/colis/:id/scan
 * Fait avancer un colis à l'étape suivante après un scan QR.
 * Body: { etape: "charge" | "depart" | "arrive" }
 */
router.post("/:id/scan", requireAgent, async (req, res) => {
  const { etape } = req.body || {};
  if (!ETAPES.includes(etape)) {
    return res.status(400).json({ erreur: "Étape invalide." });
  }

  const { data: colis, error: fetchError } = await supabaseAdmin
    .from("colis")
    .select("*")
    .eq("id", req.params.id)
    .single();

  if (fetchError || !colis) {
    return res.status(404).json({ erreur: "Colis introuvable." });
  }

  const indexActuel = indexEtape(colis.statut);
  const indexDemande = indexEtape(etape);

  if (indexDemande !== indexActuel + 1) {
    return res.status(409).json({
      erreur: `Transition invalide : le colis est à l'étape "${colis.statut}", impossible de passer directement à "${etape}".`,
    });
  }

  const { data: updated, error: updateError } = await supabaseAdmin
    .from("colis")
    .update({ statut: etape })
    .eq("id", req.params.id)
    .select()
    .single();

  if (updateError) {
    console.error("Erreur mise à jour statut:", updateError);
    return res.status(500).json({ erreur: "Impossible de mettre à jour le statut." });
  }

  await supabaseAdmin
    .from("colis_historique")
    .insert({ colis_id: req.params.id, etape, agent_id: req.agent.id });

  res.json(versFormatFrontend(updated));
});

/**
 * GET /api/colis/:id/historique
 * Journal des étapes franchies (audit trail admin).
 */
router.get("/:id/historique", requireAgent, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from("colis_historique")
    .select("etape, created_at, agent_id, agents(nom_complet)")
    .eq("colis_id", req.params.id)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Erreur historique:", error);
    return res.status(500).json({ erreur: "Impossible de récupérer l'historique." });
  }
  res.json(data);
});

module.exports = router;
