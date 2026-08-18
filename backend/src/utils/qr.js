const QRCode = require("qrcode");

/** Génère un QR code (data URL PNG base64) encodant simplement l'id du colis */
async function genererQrDataUrl(colisId) {
  return QRCode.toDataURL(colisId, {
    margin: 1,
    width: 256,
    color: { dark: "#111117", light: "#F3ECD9" },
  });
}

module.exports = { genererQrDataUrl };
