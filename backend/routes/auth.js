const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const { db } = require('../db/database');
const { JWT_SECRET } = require('../middleware/auth');

// POST /api/agents/register  (création d'un compte agent - utile pour le pilote / admin)
router.post(
  '/register',
  [
    body('nom').notEmpty().withMessage('Le nom est requis.'),
    body('email').isEmail().withMessage('Email invalide.'),
    body('password').isLength({ min: 6 }).withMessage('Mot de passe : 6 caractères minimum.'),
    body('role').isIn(['guichet', 'quai', 'admin']).withMessage('Rôle invalide.'),
    body('agence').notEmpty().withMessage('L\'agence est requise.'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { nom, email, password, role, agence } = req.body;

    const existing = db.data.agents.find((a) => a.email === email);
    if (existing) {
      return res.status(409).json({ success: false, message: 'Un agent avec cet email existe déjà.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const agent = {
      id: uuidv4(),
      nom,
      email,
      password: hashedPassword,
      role, // 'guichet' | 'quai' | 'admin'
      agence,
      created_at: new Date().toISOString(),
    };

    db.data.agents.push(agent);
    await db.write();

    const { password: _pw, ...agentSafe } = agent;
    res.status(201).json({ success: true, agent: agentSafe });
  }
);

// POST /api/login
router.post(
  '/login',
  [body('email').isEmail(), body('password').notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;
    const agent = db.data.agents.find((a) => a.email === email);

    if (!agent) {
      return res.status(401).json({ success: false, message: 'Identifiants incorrects.' });
    }

    const match = await bcrypt.compare(password, agent.password);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Identifiants incorrects.' });
    }

    const token = jwt.sign(
      { id: agent.id, nom: agent.nom, role: agent.role, agence: agent.agence },
      JWT_SECRET,
      { expiresIn: '12h' }
    );

    res.json({
      success: true,
      token,
      agent: { id: agent.id, nom: agent.nom, email: agent.email, role: agent.role, agence: agent.agence },
    });
  }
);

module.exports = router;
