const express = require('express');
const router = express.Router();
const pendaftaranOnlineController = require('../controllers/pendaftaranController');
const { verifyToken, verifyRole } = require('../utils/jwt');

// Rute untuk menambah pendaftaran online pasien
router.post('/create', verifyToken, verifyRole(['pasien']), pendaftaranOnlineController.createPendaftaran);

// Rute untuk mengambil pendaftaran pasien berdasarkan ID
router.get('/:id', verifyToken, verifyRole(['pasien', 'admin']), pendaftaranOnlineController.getPendaftaranById);

// Rute untuk memperbarui pendaftaran online pasien (misalnya, jika pasien mengubah jadwal atau membatalkan)
router.put('/:id', verifyToken, verifyRole(['pasien']), pendaftaranOnlineController.updatePendaftaran);

router.put('/:id', verifyToken, verifyRole(['pasien']), pendaftaranOnlineController.updateStatusPendaftaran);

// Rute untuk menghapus pendaftaran pasien
router.delete('/:id', verifyToken, verifyRole(['admin']), pendaftaranOnlineController.deletePendaftaran);

router.get('/riwayat/:pasien_id', verifyToken, pendaftaranOnlineController.getRiwayatKunjungan);

module.exports = router;
