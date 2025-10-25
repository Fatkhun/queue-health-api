const express = require('express');
const router = express.Router();
const poliController = require('../controllers/poliController');
const { verifyToken, verifyRole } = require('../utils/jwt');

// Rute untuk menambah poli (akses hanya untuk admin atau petugas)
router.post('/create', verifyToken, verifyRole(['admin', 'petugas']), poliController.createPoli);

// Rute untuk mendapatkan semua poli (akses terbuka)
router.get('/', poliController.getAllPoli);

// Rute untuk mendapatkan detail poli berdasarkan ID
router.get('/:id', poliController.getPoliById);

// Rute untuk memperbarui poli berdasarkan ID (akses hanya untuk admin atau petugas)
router.put('/:id', verifyToken, verifyRole(['admin', 'petugas']), poliController.updatePoli);

// Rute untuk menghapus poli berdasarkan ID (akses hanya untuk admin atau petugas)
router.delete('/:id', verifyToken, verifyRole(['admin', 'petugas']), poliController.deletePoli);

module.exports = router;
