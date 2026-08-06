const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const { db } = require('../db/database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { generateQRToken, generateOTP, logScan } = require('../utils/helpers');
const { isValidName, isValidCameroonPhone, normalizeCameroonPhone } = require('../utils/validators');

// POST /api/valider-colis  (agent guichet valide le pré-enrôlement -> crée le colis avec QR final)
router.post(
  '/valider-colis',
  authenticateToken,
  requireRole('guichet', 'admin'),
  [
    body('qr_temporaire').notEmpty().withMessage('Le QR temporaire est requis.'),
    body('expediteur_nom').optional().custom(isValidName).withMessage('Nom d\'expéditeur invalide (lettres uniquement).'),
    body('expediteur_telephone').optional().custom(isValidCameroonPhone).withMessage('Téléphone d\'expéditeur invalide (ex: 677123456).'),
    body('destinataire_nom').optional().custom(isValidName).withMessage('Nom de destinataire invalide (lettres uniquement).'),
    body('destinataire_telephone').optional().custom(isValidCameroonPhone).withMessage('Téléphone de destinataire invalide (ex: 677123456).'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const {
      qr_temporaire,
      poids_final,
      prix,
      expediteur_nom,
      expediteur_telephone,
      destinataire_nom,
      destinataire_telephone,
      ville_depart,
      ville_arrivee,
      description_colis,
    } = req.body;

    const preEnrolement = db.data.pre_enrolements.find((p) => p.qr_temporaire === qr_temporaire);
    if (!preEnrolement) {
      return res.status(404).json({ success: false, message: 'Pré-enrôlement introuvable.' });
    }
    if (preEnrolement.statut === 'valide') {
      return res.status(409).json({ success: false, message: 'Ce pré-enrôlement a déjà été validé.' });
    }

    const qrFinal = generateQRToken();

    // Le guichetier peut corriger les informations saisies par le client
    // (faute de frappe, numéro erroné, etc.) au moment de la validation.
    const valeursFinales = {
      expediteur_nom: expediteur_nom?.trim() ?? preEnrolement.expediteur_nom,
      expediteur_telephone: expediteur_telephone ? normalizeCameroonPhone(expediteur_telephone) : preEnrolement.expediteur_telephone,
      destinataire_nom: destinataire_nom?.trim() ?? preEnrolement.destinataire_nom,
      destinataire_telephone: destinataire_telephone ? normalizeCameroonPhone(destinataire_telephone) : preEnrolement.destinataire_telephone,
      ville_depart: ville_depart ?? preEnrolement.ville_depart,
      ville_arrivee: ville_arrivee ?? preEnrolement.ville_arrivee,
      description_colis: description_colis ?? preEnrolement.description_colis,
    };

    // Détecte si le guichetier a modifié une donnée par rapport à la saisie initiale du client
    const champsModifies = Object.keys(valeursFinales).filter(
      (cle) => String(valeursFinales[cle]) !== String(preEnrolement[cle])
    );

    const colis = {
      id: uuidv4(),
      qr_final: qrFinal,
      pre_enrolement_id: preEnrolement.id,
      ...valeursFinales,
      poids_final: poids_final || preEnrolement.poids_estime || null,
      prix: prix || null,
      statut: 'valide', // valide -> charge -> en_transit -> arrive -> livre
      bus_id: null,
      otp: null,
      agent_validation_id: req.agent.id,
      champs_corriges_par_agent: champsModifies,
      created_at: new Date().toISOString(),
    };

    db.data.colis.push(colis);
    preEnrolement.statut = 'valide';

    const detailValidation = champsModifies.length > 0
      ? `Colis validé au guichet ${req.agent.agence} (champs corrigés: ${champsModifies.join(', ')})`
      : `Colis validé au guichet ${req.agent.agence}`;
    await logScan(db, { colisId: colis.id, agentId: req.agent.id, type: 'validation', details: detailValidation });
    await db.write();

    res.status(201).json({ success: true, message: 'Colis validé. QR final généré.', colis });
  }
);

// POST /api/bus  (créer un bus - utilitaire pour le pilote)
router.post(
  '/bus',
  authenticateToken,
  requireRole('admin', 'quai'),
  [body('immatriculation').notEmpty(), body('ville_depart').notEmpty(), body('ville_arrivee').notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    const { immatriculation, ville_depart, ville_arrivee, heure_depart } = req.body;

    const bus = {
      id: uuidv4(),
      qr_bus: generateQRToken(),
      immatriculation,
      ville_depart,
      ville_arrivee,
      heure_depart: heure_depart || null,
      statut: 'en_attente', // en_attente -> charge -> parti -> arrive
      created_at: new Date().toISOString(),
    };
    db.data.bus.push(bus);
    await db.write();
    res.status(201).json({ success: true, bus });
  }
);

// GET /api/bus  (liste des bus)
router.get('/bus', authenticateToken, async (req, res) => {
  res.json({ success: true, bus: db.data.bus });
});

// POST /api/scan/chargement  (agent quai scanne colis + bus -> contrôle de cohérence)
router.post(
  '/scan/chargement',
  authenticateToken,
  requireRole('quai', 'admin'),
  [body('qr_colis').notEmpty(), body('qr_bus').notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { qr_colis, qr_bus } = req.body;

    const colis = db.data.colis.find((c) => c.qr_final === qr_colis);
    if (!colis) {
      return res.status(404).json({ success: false, message: 'Colis introuvable.' });
    }
    const bus = db.data.bus.find((b) => b.qr_bus === qr_bus);
    if (!bus) {
      return res.status(404).json({ success: false, message: 'Bus introuvable.' });
    }

    // Contrôle de cohérence : le trajet du colis doit correspondre au trajet du bus
    if (colis.ville_depart !== bus.ville_depart || colis.ville_arrivee !== bus.ville_arrivee) {
      await logScan(db, {
        colisId: colis.id,
        agentId: req.agent.id,
        type: 'chargement_refuse',
        details: `Incohérence: colis ${colis.ville_depart}->${colis.ville_arrivee} vs bus ${bus.ville_depart}->${bus.ville_arrivee}`,
      });
      return res.status(409).json({
        success: false,
        message: `Incohérence détectée : ce colis va de ${colis.ville_depart} à ${colis.ville_arrivee}, mais ce bus dessert ${bus.ville_depart} à ${bus.ville_arrivee}.`,
      });
    }

    if (colis.statut !== 'valide') {
      return res.status(409).json({ success: false, message: `Ce colis ne peut pas être chargé (statut actuel: ${colis.statut}).` });
    }

    colis.statut = 'charge';
    colis.bus_id = bus.id;

    let manifeste = db.data.manifestes.find((m) => m.bus_id === bus.id && m.statut === 'ouvert');
    if (!manifeste) {
      manifeste = {
        id: uuidv4(),
        bus_id: bus.id,
        colis_ids: [],
        statut: 'ouvert',
        agent_id: req.agent.id,
        created_at: new Date().toISOString(),
      };
      db.data.manifestes.push(manifeste);
    }
    manifeste.colis_ids.push(colis.id);

    await logScan(db, { colisId: colis.id, agentId: req.agent.id, type: 'chargement', details: `Chargé sur bus ${bus.immatriculation}` });
    await db.write();

    res.json({ success: true, message: 'Colis chargé avec succès.', colis, manifeste });
  }
);

// POST /api/cloture-manifeste  (clôture du chargement d'un bus)
router.post(
  '/cloture-manifeste',
  authenticateToken,
  requireRole('quai', 'admin'),
  [body('manifeste_id').notEmpty()],
  async (req, res) => {
    const { manifeste_id } = req.body;
    const manifeste = db.data.manifestes.find((m) => m.id === manifeste_id);
    if (!manifeste) {
      return res.status(404).json({ success: false, message: 'Manifeste introuvable.' });
    }
    manifeste.statut = 'cloture';
    manifeste.cloture_at = new Date().toISOString();

    const bus = db.data.bus.find((b) => b.id === manifeste.bus_id);
    if (bus) bus.statut = 'parti';

    // Passe tous les colis du manifeste en "en_transit"
    for (const colisId of manifeste.colis_ids) {
      const colis = db.data.colis.find((c) => c.id === colisId);
      if (colis) colis.statut = 'en_transit';
    }

    await db.write();
    res.json({ success: true, message: 'Manifeste clôturé. Bus en transit.', manifeste });
  }
);

// POST /api/scan/arrivee  (agent scanne le colis à l'arrivée -> génère OTP)
router.post(
  '/scan/arrivee',
  authenticateToken,
  requireRole('quai', 'admin'),
  [body('qr_colis').notEmpty()],
  async (req, res) => {
    const { qr_colis } = req.body;
    const colis = db.data.colis.find((c) => c.qr_final === qr_colis);
    if (!colis) {
      return res.status(404).json({ success: false, message: 'Colis introuvable.' });
    }
    if (colis.statut !== 'en_transit') {
      return res.status(409).json({ success: false, message: `Ce colis n'est pas en transit (statut: ${colis.statut}).` });
    }

    colis.statut = 'arrive';
    colis.otp = generateOTP();
    colis.otp_generated_at = new Date().toISOString();

    await logScan(db, { colisId: colis.id, agentId: req.agent.id, type: 'arrivee', details: 'Colis arrivé, OTP généré' });
    await db.write();

    // Dans une vraie prod: envoyer l'OTP par SMS au destinataire ici.
    res.json({ success: true, message: 'Colis arrivé. OTP généré pour le destinataire.', colis });
  }
);

// POST /api/livraison  (le destinataire présente l'OTP -> validation finale)
router.post(
  '/livraison',
  authenticateToken,
  requireRole('guichet', 'quai', 'admin'),
  [body('qr_colis').notEmpty(), body('otp').notEmpty()],
  async (req, res) => {
    const { qr_colis, otp } = req.body;
    const colis = db.data.colis.find((c) => c.qr_final === qr_colis);
    if (!colis) {
      return res.status(404).json({ success: false, message: 'Colis introuvable.' });
    }
    if (colis.statut !== 'arrive') {
      return res.status(409).json({ success: false, message: `Ce colis n'est pas prêt pour la livraison (statut: ${colis.statut}).` });
    }
    if (colis.otp !== otp) {
      await logScan(db, { colisId: colis.id, agentId: req.agent.id, type: 'livraison_refusee', details: 'OTP incorrect' });
      await db.write();
      return res.status(401).json({ success: false, message: 'Code OTP incorrect.' });
    }

    colis.statut = 'livre';
    colis.livre_at = new Date().toISOString();

    await logScan(db, { colisId: colis.id, agentId: req.agent.id, type: 'livraison', details: 'Colis livré au destinataire' });
    await db.write();

    res.json({ success: true, message: 'Colis livré avec succès.', colis });
  }
);

// GET /api/colis/:qr  (suivi client - app mobile)
router.get('/colis/:qr', async (req, res) => {
  const colis = db.data.colis.find((c) => c.qr_final === req.params.qr);
  if (!colis) {
    return res.status(404).json({ success: false, message: 'Colis introuvable.' });
  }
  const { otp, ...colisSansOTP } = colis;
  res.json({ success: true, colis: colisSansOTP });
});

// GET /api/colis  (liste - admin/agents)
router.get('/colis', authenticateToken, async (req, res) => {
  res.json({ success: true, colis: db.data.colis });
});

// GET /api/historique/:colisId (audit trail d'un colis)
router.get('/historique/:colisId', authenticateToken, async (req, res) => {
  const historique = db.data.historique_scans.filter((h) => h.colis_id === req.params.colisId);
  res.json({ success: true, historique });
});

module.exports = router;
