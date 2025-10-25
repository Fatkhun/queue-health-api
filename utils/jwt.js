const jwt = require('jsonwebtoken');
const { secretKey } = require('../config/jwtSecret');

// Verifikasi JWT Token middleware
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization'];

  if (!token || !token.startsWith('Bearer ')) {
    return res.status(403).json({ message: 'Token diperlukan' });
  }

  const tokenValue = token.split(' ')[1];  // Mengambil token setelah 'Bearer'

  //console.log('Received token:', tokenValue);  // Log token untuk memastikan token diterima dengan benar

  jwt.verify(tokenValue, secretKey, (err, decoded) => {
    if (err) {
      console.error('JWT Verification Error:', err);  // Log error verifikasi token
      return res.status(401).json({ message: 'Token tidak valid' });
    }

    req.user = decoded;  // Menyimpan payload token dalam request
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
