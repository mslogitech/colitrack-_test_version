const { supabaseAuth, supabaseAdmin } = require("../supabaseClient");

/**
 * Vérifie le header "Authorization: Bearer <access_token>" fourni par le frontend
 * (le token vient de la session Supabase Auth de l'agent connecté).
 * En cas de succès, attache req.agent = { id, email, nom_complet, role, ville_agence }.
 */
async function requireAgent(req, res, next) {
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
      .from("agents")
      .select("id, nom_complet, ville_agence, role, actif")
      .eq("id", userData.user.id)
      .single();

    if (profilError || !profil) {
      return res.status(403).json({ erreur: "Aucun profil agent associé à ce compte." });
    }
    if (!profil.actif) {
      return res.status(403).json({ erreur: "Ce compte agent a été désactivé." });
    }

    req.agent = { ...profil, email: userData.user.email };
    next();
  } catch (e) {
    console.error("Erreur middleware auth:", e);
    res.status(500).json({ erreur: "Erreur serveur lors de la vérification de session." });
  }
}

/** Restreint une route à certains rôles (ex: ["admin", "superviseur"]) */
function requireRole(...rolesAutorises) {
  return (req, res, next) => {
    if (!req.agent || !rolesAutorises.includes(req.agent.role)) {
      return res.status(403).json({ erreur: "Droits insuffisants pour cette action." });
    }
    next();
  };
}

module.exports = { requireAgent, requireRole };
