const CAMEROON_PHONE_REGEX = /^6\d{8}$/;

export function normalizeCameroonPhone(raw) {
  if (!raw || typeof raw !== 'string') return null;
  let cleaned = raw.replace(/[\s.\-()]/g, '');
  cleaned = cleaned.replace(/^\+?237/, '');
  if (!CAMEROON_PHONE_REGEX.test(cleaned)) return null;
  return cleaned;
}

export function isValidCameroonPhone(raw) {
  return normalizeCameroonPhone(raw) !== null;
}

const NAME_REGEX = /^[a-zA-ZÀ-ÖØ-öø-ÿ' -]{2,60}$/;

export function isValidName(raw) {
  if (!raw || typeof raw !== 'string') return false;
  return NAME_REGEX.test(raw.trim());
}
