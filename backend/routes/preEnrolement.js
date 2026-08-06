const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const { db } = require('../db/database');
const { generateQRToken, logScan } = require('../utils/helpers');
const { isValidName, isValidCameroonPhone, normalizeCameroonPhone } = require('../utils/validators');

// POST /api/pre-enrolement  (client, via app mobile)
router.post(
  '/',
  [
    body('expediteur_nom')
      .notEmpty().withMessage('Le nom de l\'expéditeur est requis.')
      .custom(isValidName).withMessage('Le nom de l\'expéditeur doit contenir uniquement des lettres (2 caractères minimum).'),
    body('expediteur_telephone')
      .notEmpty().withMessage('Le téléphone de l\'expéditeur est requis.')
      .custom(isValidCameroonPhone).withMessage('Le téléphone de l\'expéditeur doit être un numéro camerounais valide (ex: 677123456).'),
    body('destinataire_nom')
      .notEmpty().withMessage('Le nom du destinataire est requis.')
      .custom(isValidName).withMessage('Le nom du destinataire doit contenir uniquement des lettres (2 caractères minimum).'),
    body('destinataire_telephone')
      .notEmpty().withMessage('Le téléphone du destinataire est requis.')
      .custom(isValidCameroonPhone).withMessage('Le téléphone du destinataire doit être un numéro camerounais valide (ex: 677123456).'),
    body('ville_depart').notEmpty().withMessage('La ville de départ est requise.'),
    body('ville_arrivee').notEmpty().withMessage('La ville d\'arrivée est requise.'),
    body('description_colis').notEmpty().withMessage('La description du colis est requise.'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const {
      expediteur_nom,
      expediteur_telephone,
      destinataire_nom,
      destinataire_telephone,
      ville_depart,
      ville_arrivee,
      description_colis,
      poids_estime,
    } = req.body;

    const qrTemporaire = generateQRToken();

    const preEnrolement = {
      id: uuidv4(),
      qr_temporaire: qrTemporaire,
      expediteur_nom: expediteur_nom.trim(),
      expediteur_telephone: normalizeCameroonPhone(expediteur_telephone),
      destinataire_nom: destinataire_nom.trim(),
      destinataire_telephone: normalizeCameroonPhone(destinataire_telephone),
      ville_depart,
      ville_arrivee,
      description_colis,
      poids_estime: poids_estime || null,
      statut: 'en_attente', // en_attente -> valide -> expire
      created_at: new Date().toISOString(),
    };

    db.data.pre_enrolements.push(preEnrolement);
    await db.write();

    res.status(201).json({
      success: true,
      message: 'Pré-enrôlement enregistré. Présentez ce QR au guichet.',
      pre_enrolement: preEnrolement,
    });
  }
);

// GET /api/pre-enrolement/:qr  (agent guichet scanne le QR temporaire)
router.get('/:qr', async (req, res) => {
  const { qr } = req.params;
  const preEnrolement = db.data.pre_enrolements.find((p) => p.qr_temporaire === qr);

  if (!preEnrolement) {
    return res.status(404).json({ success: false, message: 'Pré-enrôlement introuvable pour ce QR.' });
  }

  if (preEnrolement.statut === 'valide') {
    return res.status(409).json({ success: false, message: 'Ce pré-enrôlement a déjà été validé.' });
  }

  res.json({ success: true, pre_enrolement: preEnrolement });
});

module.exports = router;
