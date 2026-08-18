// Ordre officiel des étapes — doit rester synchronisé avec STEPS/ETAPES côté frontend
const ETAPES = ["enregistre", "charge", "depart", "arrive"];

function indexEtape(etape) {
  return ETAPES.indexOf(etape);
}

module.exports = { ETAPES, indexEtape };
