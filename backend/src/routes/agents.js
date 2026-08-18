const express = require("express");
const { supabaseAdmin } = require("../supabaseClient");
const { requireAgent, requireRole } = require("../middleware/auth");

const router = express.Router();

/**
 * GET /api/agents/me
 * Retourne le profil de l'agent actuellement connecté (utile juste après le login frontend).
 */
router.get("/me", requireAgent, async (req, res) => {
  res.json(req.agent);
});

/**
 * GET /api/agents
 * Liste les agents (réservé au rôle chef (administrateur)).
 */
router.get("/", requireAgent, requireRole("chef"), async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from("agents")
    .select("id, nom_complet, ville_agence, role, actif, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Erreur listing agents:", error);
    return res.status(500).json({ erreur: "Impossible de récupérer la liste des agents." });
  }
  res.json(data);
});

/**
 * POST /api/agents
 * Crée un nouveau compte agent (réservé au rôle chef (administrateur)).
 * Body: { email, motDePasse, nomComplet, villeAgence, role }
 * Utilise l'API Admin de Supabase Auth pour créer directement un utilisateur confirmé,
 * puis crée la ligne de profil correspondante dans public.agents.
 */
router.post("/", requireAgent, requireRole("chef"), async (req, res) => {
  const { email, motDePasse, nomComplet, villeAgence, role = "guichet" } = req.body || {};

  if (!email || !motDePasse || !nomComplet) {
    return res.status(400).json({ erreur: "Email, mot de passe et nom complet sont obligatoires." });
  }
  if (!["chef", "guichet", "quai"].includes(role)) {
    return res.status(400).json({ erreur: "Rôle invalide." });
  }

  const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: motDePasse,
    email_confirm: true,
  });

  if (createError) {
    return res.status(400).json({ erreur: `Création du compte impossible : ${createError.message}` });
  }

  const { data: profil, error: profilError } = await supabaseAdmin
    .from("agents")
    .insert({
      id: userData.user.id,
      nom_complet: nomComplet,
      ville_agence: villeAgence || null,
      role,
    })
    .select()
    .single();

  if (profilError) {
    // Rollback best-effort : on supprime le compte auth orphelin si le profil échoue
    await supabaseAdmin.auth.admin.deleteUser(userData.user.id).catch(() => {});
    console.error("Erreur création profil agent:", profilError);
    return res.status(500).json({ erreur: "Le compte a été créé mais le profil agent a échoué." });
  }

  res.status(201).json(profil);
});

/**
 * PATCH /api/agents/:id
 * Active/désactive un agent ou change son rôle (réservé au rôle chef (administrateur)).
 */
router.patch("/:id", requireAgent, requireRole("chef"), async (req, res) => {
  const { actif, role, villeAgence } = req.body || {};
  const updates = {};
  if (typeof actif === "boolean") updates.actif = actif;
  if (role) updates.role = role;
  if (villeAgence !== undefined) updates.ville_agence = villeAgence;

  const { data, error } = await supabaseAdmin
    .from("agents")
    .update(updates)
    .eq("id", req.params.id)
    .select()
    .single();

  if (error) {
    console.error("Erreur mise à jour agent:", error);
    return res.status(500).json({ erreur: "Impossible de mettre à jour cet agent." });
  }
  res.json(data);
});

module.exports = router;
