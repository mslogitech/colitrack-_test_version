// Copie ce fichier en "config.js" (même dossier) et remplis tes valeurs réelles.
// La clé "anon" Supabase est prévue pour être publique côté client (elle est
// contrainte par les policies RLS côté serveur) — ce n'est PAS la clé service_role.
window.COLITRACK_CONFIG = {
  supabaseUrl: "https://xxxxxxxxxxxx.supabase.co",
  supabaseAnonKey: "colle-ta-clé-anon-ici",
  // URL de l'API backend. En local : http://localhost:3001
  // En prod (Contabo) : https://api.tondomaine.com
  apiBase: "http://localhost:3001",
};
