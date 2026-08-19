const express = require("express");
const { supabaseAdmin } = require("../supabaseClient");
const { requireClient } = require("../middleware/clientAuth");
const { genererIdColis } = require("../utils/idGenerator");
const { genererQrDataUrl } = require("../utils/qr");
const { notifierChangementStatut } = require("../utils/email");

const router = express.Router();

/**
 * POST /api/clients/register
 * Inscription libre-service (aucune authentification requise pour appeler cette route —
 * c'est justement elle qui crée le compte).
 * Body: { email, motDePasse, nomComplet, telephone }
 */
router.post("/register", async (req, res) => {
  const { email, motDePasse, nomComplet, telephone } = req.body || {};
  if (!email || !motDePasse || !nomComplet) {
    return res.status(400).json({ erreur: "Email, mot de passe et nom complet sont obligatoires." });
  }
  if (motDePasse.length < 6) {
    return res.status(400).json({ erreur: "Le mot de passe doit contenir au moins 6 caractères." });
  }

  // email_confirm:true = pas d'email de vérification requis avant de pouvoir se connecter,
  // pour limiter la friction à l'inscription. À resserrer plus tard si besoin (SMTP configuré).
  const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: motDePasse,
    email_confirm: true,
  });

  if (createError) {
    const message = createError.message.includes("already been registered")
      ? "Un compte existe déjà avec cet email."
      : "Inscription impossible : " + createError.message;
    return res.status(400).json({ erreur: message });
  }

  const { data: profil, error: profilError } = await supabaseAdmin
    .from("clients")
    .insert({ id: userData.user.id, nom_complet: nomComplet, telephone: telephone || null, email })
    .select()
    .single();

  if (profilError) {
    await supabaseAdmin.auth.admin.deleteUser(userData.user.id).catch(() => {});
    console.error("Erreur création profil client:", profilError);
    return res.status(500).json({ erreur: "Le compte a été créé mais le profil client a échoué." });
  }

  res.status(201).json(profil);
});

/**
 * GET /api/clients/me
 */
router.get("/me", requireClient, async (req, res) => {
  res.json(req.client);
});

/**
 * GET /api/clients/colis
 * Liste des colis envoyés par ce client.
 */
router.get("/colis", requireClient, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from("colis")
    .select("id, ville_depart, ville_arrivee, description, poids, statut, created_at")
    .eq("client_id", req.client.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Erreur listing colis client:", error);
    return res.status(500).json({ erreur: "Impossible de récupérer tes colis." });
  }

  res.json(
    data.map((c) => ({
      id: c.id,
      villeDepart: c.ville_depart,
      villeArrivee: c.ville_arrivee,
      description: c.description,
      poids: c.poids,
      statut: c.statut,
      createdAt: c.created_at,
    }))
  );
});

/**
 * POST /api/clients/colis
 * Envoi d'un colis en libre-service par un client authentifié.
 * L'expéditeur est automatiquement le client connecté (nom/téléphone/email de son profil) ;
 * seuls le destinataire, la destination et le colis restent à saisir.
 * Body: { villeDepart, villeArrivee, destNom, destTel, destEmail, description, poids }
 */
router.post("/colis", requireClient, async (req, res) => {
  const { villeDepart, villeArrivee, destNom, destTel, destEmail, description, poids } = req.body || {};

  if (!villeDepart || !villeArrivee || !destNom || !destTel) {
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
      exp_nom: req.client.nom_complet,
      exp_tel: req.client.telephone || "",
      exp_email: req.client.email,
      dest_nom: destNom,
      dest_tel: destTel,
      dest_email: destEmail || null,
      ville_depart: villeDepart,
      ville_arrivee: villeArrivee,
      description: description || null,
      poids: poids ?? null,
      statut: "enregistre",
      client_id: req.client.id,
    })
    .select()
    .single();

  if (error) {
    console.error("Erreur insertion colis (client):", error);
    return res.status(500).json({ erreur: "Impossible d'enregistrer le colis." });
  }

  await supabaseAdmin.from("colis_historique").insert({ colis_id: id, etape: "enregistre" });

  notifierChangementStatut(data, "enregistre").catch(() => {});

  const qrCode = await genererQrDataUrl(id);
  res.status(201).json({
    id: data.id,
    expNom: data.exp_nom,
    destNom: data.dest_nom,
    villeDepart: data.ville_depart,
    villeArrivee: data.ville_arrivee,
    description: data.description,
    poids: data.poids,
    statut: data.statut,
    qrCode,
  });
});

module.exports = router;
