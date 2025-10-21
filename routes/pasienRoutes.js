const express = require('express');
const router = express.Router();
const pasienController = require('../controllers/pasienController');
const { verifyToken, verifyRole } = require('../utils/jwt');

// Rute yang hanya dapat diakses oleh admin atau petugas
router.get('/', verifyToken, verifyRole(['admin', 'petugas']), pasienController.getPasien);

// Rute yang hanya dapat diakses oleh admin atau admin
router.post('/create', verifyToken, verifyRole(['pasien','petugas', 'admin']), pasienController.registerPasien);

// Rute untuk mendapatkan detail pasien berdasarkan ID
router.get('/:id', verifyToken, verifyRole(['pasien','admin', 'petugas']), pasienController.getDetailPasien);

// Rute untuk menghapus pasien berdasarkan ID
router.delete('/:id', verifyToken, verifyRole(['admin', 'petugas']), pasienController.deletePasien);

module.exports = router;
