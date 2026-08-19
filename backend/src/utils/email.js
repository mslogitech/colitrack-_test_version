const nodemailer = require("nodemailer");

var transporter = null;
var emailActif = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

if (emailActif) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465, // true pour le port 465, false pour les autres (STARTTLS)
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
} else {
  console.warn(
    "⚠ SMTP non configuré (SMTP_HOST/SMTP_USER/SMTP_PASS manquants dans .env) — " +
      "les notifications email sont désactivées, l'application continue de fonctionner normalement."
  );
}

/**
 * Envoie un email. Ne lance jamais d'exception : une erreur d'envoi est loguée
 * mais ne doit jamais faire échouer l'action métier (créer/scanner un colis).
 */
async function envoyerEmail({ to, subject, html }) {
  if (!emailActif || !to) return;
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"COLITRACK" <no-reply@colitrack.local>',
      to: to,
      subject: subject,
      html: html,
    });
  } catch (e) {
    console.error("Erreur d'envoi email (ignorée, ne bloque pas la requête) :", e.message);
  }
}

var STATUT_LABELS = { enregistre: "Enregistré", charge: "Chargé", depart: "En route", arrive: "Livré" };

function urlSuivi(colisId) {
  var base = process.env.PUBLIC_TRACK_URL || "http://localhost:3001/track.html";
  return base + "?id=" + encodeURIComponent(colisId);
}

function templateBase(titre, corps, colisId) {
  return (
    '<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;color:#1F2328;">' +
    '<div style="background:#1F2937;color:#fff;padding:16px 20px;border-radius:6px 6px 0 0;">' +
    '<strong style="font-size:16px;">COLI<span style="color:#E8952E;">TRACK</span></strong>' +
    "</div>" +
    '<div style="border:1px solid #E4E7EB;border-top:none;padding:20px;border-radius:0 0 6px 6px;">' +
    '<h2 style="font-size:16px;margin:0 0 10px;">' + titre + "</h2>" +
    '<p style="font-size:13px;line-height:1.6;color:#344054;">' + corps + "</p>" +
    '<a href="' + urlSuivi(colisId) + '" style="display:inline-block;margin-top:12px;background:#E8952E;color:#1F2937;text-decoration:none;padding:10px 16px;border-radius:4px;font-size:13px;font-weight:600;">Suivre mon colis</a>' +
    '<p style="font-size:11px;color:#6B7280;margin-top:18px;">Numéro de suivi : ' + colisId + "</p>" +
    "</div></div>"
  );
}

/**
 * Notifie l'expéditeur et le destinataire (si leurs emails sont connus) d'un
 * changement de statut d'un colis. Appelé à la création (enregistré) et à
 * chaque scan (chargé / en route / livré).
 */
async function notifierChangementStatut(colis, etape) {
  var label = STATUT_LABELS[etape] || etape;
  var sujet = "Colis " + colis.id + " — " + label;

  var corpsExp =
    "Bonjour " + colis.exp_nom + ", votre colis à destination de <strong>" + colis.ville_arrivee +
    "</strong> vient de passer à l'étape : <strong>" + label + "</strong>.";
  var corpsDest =
    "Bonjour " + colis.dest_nom + ", un colis vous concernant en provenance de <strong>" + colis.ville_depart +
    "</strong> vient de passer à l'étape : <strong>" + label + "</strong>.";

  await Promise.all([
    envoyerEmail({ to: colis.exp_email, subject: sujet, html: templateBase("Mise à jour de votre colis", corpsExp, colis.id) }),
    envoyerEmail({ to: colis.dest_email, subject: sujet, html: templateBase("Mise à jour de votre colis", corpsDest, colis.id) }),
  ]);
}

module.exports = { envoyerEmail, notifierChangementStatut, emailActif: emailActif };
