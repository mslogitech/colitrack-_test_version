/** Génère un identifiant type "CLT-260818-4F2A" (préfixe + date YYMMDD + suffixe aléatoire) */
function genererIdColis() {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const suffixe = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `CLT-${yy}${mm}${dd}-${suffixe}`;
}

module.exports = { genererIdColis };
