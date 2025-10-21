const jwt = require('jsonwebtoken');
const { secretKey } = require('../config/jwtSecret');

// Verifikasi JWT Token middleware
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(403).json({ message: 'Token diperlukan' });

  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) return res.status(401).json({ message: 'Token tidak valid' });
    req.user = decoded;  // Menyimpan payload token dalam request untuk digunakan di route
    next();
  });
};

// Verifikasi Role middleware
const verifyRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.forbidden('Akses ditolak, Anda tidak memiliki hak akses');
    }
    next();
  };
};

module.exports = { verifyToken, verifyRole };
