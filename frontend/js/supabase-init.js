// Nécessite que js/config.js soit chargé avant ce script, et le CDN Supabase dans index.html.
if (!window.COLITRACK_CONFIG) {
  throw new Error(
    "Configuration manquante : copie js/config.example.js en js/config.js et renseigne tes clés Supabase."
  );
}

var supabaseClient = window.supabase.createClient(
  window.COLITRACK_CONFIG.supabaseUrl,
  window.COLITRACK_CONFIG.supabaseAnonKey
);
