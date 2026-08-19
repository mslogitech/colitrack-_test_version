const { supabaseAuth, supabaseAdmin } = require("../supabaseClient");

/**
 * Vérifie le header "Authorization: Bearer <access_token>" d'un CLIENT
 * (compte auto-inscrit pour envoyer des colis — distinct des agents).
 * En cas de succès, attache req.client = { id, email, nom_complet, telephone }.
 */
async function requireClient(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) {
      return res.status(401).json({ erreur: "Authentification requise." });
    }

    const { data: userData, error: userError } = await supabaseAuth.auth.getUser(token);
    if (userError || !userData?.user) {
      return res.status(401).json({ erreur: "Session invalide ou expirée. Reconnecte-toi." });
    }

    const { data: profil, error: profilError } = await supabaseAdmin
      .from("clients")
      .select("id, nom_complet, telephone, email, actif")
      .eq("id", userData.user.id)
      .single();

    if (profilError || !profil) {
      return res.status(403).json({ erreur: "Aucun profil client associé à ce compte." });
    }
    if (!profil.actif) {
      return res.status(403).json({ erreur: "Ce compte a été désactivé." });
    }

    req.client = profil;
    next();
  } catch (e) {
    console.error("Erreur middleware auth client:", e);
    res.status(500).json({ erreur: "Erreur serveur lors de la vérification de session." });
  }
}

module.exports = { requireClient };
