const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'colitrack_dev_secret_change_in_production';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Token d\'authentification manquant.' });
  }

  jwt.verify(token, JWT_SECRET, (err, agent) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Token invalide ou expiré.' });
    }
    req.agent = agent;
    next();
  });
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.agent || !roles.includes(req.agent.role)) {
      return res.status(403).json({ success: false, message: 'Accès refusé : rôle insuffisant.' });
    }
    next();
  };
}

module.exports = { authenticateToken, requireRole, JWT_SECRET };
