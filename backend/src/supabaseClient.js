const { createClient } = require("@supabase/supabase-js");

const { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY } = process.env;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    "Variables d'environnement Supabase manquantes. " +
      "Vérifie SUPABASE_URL, SUPABASE_ANON_KEY et SUPABASE_SERVICE_ROLE_KEY dans ton fichier .env " +
      "(voir .env.example)."
  );
}

// Client "anon" : utilisé uniquement pour vérifier les tokens d'accès envoyés par le frontend.
// Ne jamais utiliser ce client pour écrire dans la base (il respecte les RLS, donc échouera de toute façon).
const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Client "service_role" : bypass RLS. Réservé au serveur, ne JAMAIS exposer cette clé au frontend.
// Les vérifications d'autorisation (qui a le droit de faire quoi) sont donc à la charge de nos routes/middlewares.
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

module.exports = { supabaseAuth, supabaseAdmin };
