const pasienModel = require('../models/pasienModel');
const bcrypt = require('bcryptjs');
const supabase = require('../db');

// Pendaftaran pasien
const registerPasien = async (req, res) => {
  const { nama, no_hp, password } = req.body;

  if (!nama || !no_hp || !password) {
    return res.badRequest('Nama, nomor HP, dan password wajib diisi');
  }

  try {
    const pasienData = { nama, no_hp, password };
    const pasien = await pasienModel.createPasien(pasienData);
    res.created(pasien);  // Menggunakan standar respons dengan kode 201 (CREATED)
  } catch (error) {
    res.error('Gagal mendaftar pasien', {}, 500);  // Menggunakan standar respons dengan kode 500 (INTERNAL_SERVER_ERROR)
  }
};

// Mendapatkan seluruh pasien (untuk admin atau petugas)
const getPasien = async (req, res) => {
  try {
    const pasien = await pasienModel.getAllPasien();
    res.ok(pasien);  // Menggunakan standar respons dengan kode 200 (OK)
  } catch (error) {
    res.error('Gagal mengambil data pasien', {}, 500);
  }
};

const createStaff = async (req, res) => {
  try {
    const { nama, no_hp, password, role } = req.body;

    // Validasi role yang boleh dibuat oleh admin
    const allowed = ['petugas','admin'];
    if (!allowed.includes(role)) {
      return res.forbidden('Role tidak diperbolehkan');
    }

    const hashed = await bcrypt.hash(password, 10);
    const { data, error } = await supabase
      .from('users')
      .insert({ nama, no_hp, password: hashed, role })
      .select('id, nama, no_hp, role, created_at, updated_at')
      .single();

    if (error) {
      if (error.code === '23505') return res.conflict('Nomor HP sudah terdaftar');
      throw error;
    }

    return res.created(data);
  } catch (e) {
    console.log("err " + e);
    return res.error('Gagal membuat akun petugas/admin');
  }
};

// Mendapatkan detail pasien berdasarkan ID
const getDetailPasien = async (req, res) => {
  const { id } = req.params;

  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();  // Mengambil satu data pasien berdasarkan ID

    if (error || !data) {
      return res.notFound('Pasien tidak ditemukan');
    }

    res.ok(data);  // Mengembalikan data pasien
  } catch (error) {
    res.error('Gagal mengambil detail pasien', {}, 500);
  }
};

// Menghapus pasien berdasarkan ID
const deletePasien = async (req, res) => {
  const { id } = req.params;

  try {
    const { data, error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);  // Menghapus pasien berdasarkan ID

    if (error || !data) {
      return res.notFound('Pasien tidak ditemukan');
    }

    res.ok({ message: 'Pasien berhasil dihapus' });  // Mengembalikan pesan sukses
  } catch (error) {
    res.error('Gagal menghapus pasien', {}, 500);
  }
};

const updatePasien = async (req, res) => {
  const { id } = req.params;
  const { nama, no_hp, password } = req.body;

  try {
    // Hash password jika ada perubahan password
    const hashedPassword = password ? bcrypt.hashSync(password, 10) : undefined;

    const { data, error } = await supabase
      .from('users')
      .update({
        nama,
        no_hp,
        password: hashedPassword || undefined,
        updated_at: new Date()  // Memperbarui updated_at secara manual (meskipun trigger sudah otomatis)
      })
      .eq('id', id);

    if (error || !data) {
      return res.notFound('Pasien tidak ditemukan');
    }

    res.ok(data);
  } catch (error) {
    res.error('Gagal memperbarui data pasien', {}, 500);
  }
};

module.exports = { createStaff, registerPasien, updatePasien, getPasien, getDetailPasien, deletePasien };
