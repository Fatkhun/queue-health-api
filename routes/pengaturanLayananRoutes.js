const express = require('express');
const router = express.Router();
const pengaturanLayananController = require('../controllers/pengaturanLayanan');
const { verifyToken, verifyRole } = require('../utils/jwt');

// Rute untuk menambah pengaturan layanan (akses hanya untuk admin atau petugas)
router.post('/create', verifyToken, verifyRole(['admin', 'petugas']), pengaturanLayananController.addPengaturanLayanan);

// Rute untuk mendapatkan pengaturan layanan berdasarkan poli dan hari operasional
router.get('/:poli_id/:hari_operasional', pengaturanLayananController.getPengaturanLayanan);

// Rute untuk mengupdate pengaturan layanan berdasarkan poli dan hari operasional (akses hanya untuk admin atau petugas)
router.put('/:poli_id/:hari_operasional', verifyToken, verifyRole(['admin', 'petugas']), pengaturanLayananController.updatePengaturanLayanan);

// Rute untuk menghapus pengaturan layanan berdasarkan poli dan hari operasional (akses hanya untuk admin atau petugas)
router.delete('/:poli_id/:hari_operasional', verifyToken, verifyRole(['admin', 'petugas']), pengaturanLayananController.deletePengaturanLayanan);

// Endpoint untuk mengambil jadwal aktif berdasarkan poli_id
router.get('/jadwal/aktif/:poli_id', verifyToken, pengaturanLayananController.getJadwalAktif);

module.exports = router;