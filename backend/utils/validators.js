/**
 * Validation stricte des données saisies par les utilisateurs (client ou agent).
 * Cible spécifiquement le format des numéros de téléphone camerounais et
 * empêche la saisie de noms manifestement invalides (chiffres seuls, vide, etc.)
 */

// Numéros mobiles camerounais : 9 chiffres commençant par 6, avec ou sans
// préfixe international (+237 ou 237). Ex: 677123456, +237677123456, 237 677 123 456
const CAMEROON_PHONE_REGEX = /^6\d{8}$/;

/**
 * Normalise un numéro de téléphone camerounais : retire espaces, tirets,
 * points, et le préfixe international s'il est présent.
 * Retourne null si le format est invalide même après nettoyage.
 */
function normalizeCameroonPhone(raw) {
  if (!raw || typeof raw !== 'string') return null;
  let cleaned = raw.replace(/[\s.\-()]/g, '');
  cleaned = cleaned.replace(/^\+?237/, ''); // retire le préfixe international
  if (!CAMEROON_PHONE_REGEX.test(cleaned)) return null;
  return cleaned;
}

function isValidCameroonPhone(raw) {
  return normalizeCameroonPhone(raw) !== null;
}

// Un nom valide : au moins 2 caractères, uniquement lettres (accents compris),
// espaces, apostrophes et tirets. Rejette les chiffres et caractères spéciaux.
const NAME_REGEX = /^[a-zA-ZÀ-ÖØ-öø-ÿ' -]{2,60}$/;

function isValidName(raw) {
  if (!raw || typeof raw !== 'string') return false;
  return NAME_REGEX.test(raw.trim());
}

/**
 * Valide un lot de champs personne (nom + téléphone) et retourne la liste
 * des erreurs rencontrées, avec des messages en français prêts à afficher.
 */
function validatePersonFields({ nom, telephone, label }) {
  const errors = [];
  if (nom !== undefined && !isValidName(nom)) {
    errors.push(`Le nom de ${label} semble invalide (lettres uniquement, 2 caractères minimum).`);
  }
  if (telephone !== undefined && !isValidCameroonPhone(telephone)) {
    errors.push(`Le téléphone de ${label} n'est pas un numéro camerounais valide (ex: 677123456).`);
  }
  return errors;
}

module.exports = {
  isValidCameroonPhone,
  normalizeCameroonPhone,
  isValidName,
  validatePersonFields,
};
