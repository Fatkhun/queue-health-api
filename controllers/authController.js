const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { secretKey } = require('../config/jwtSecret');
const supabase = require('../db');

// Function to generate JWT token
const generateToken = (user) => {
  return jwt.sign(user, secretKey, { expiresIn: '7d' });
};

// Login untuk petugas, pasien, dan super admin
const login = async (req, res) => {
  const { no_hp, password } = req.body;

  // Validasi input
  if (!no_hp || !password) {
    return res.badRequest('Nomor HP dan password harus diisi');
  }

  try {
    // Ambil data pengguna berdasarkan no_hp
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('no_hp', no_hp)
      .single();  // Mengambil satu data pengguna

    if (error || !data) {
      return res.notFound('Nomor HP tidak ditemukan');
    }

    // Verifikasi password
    const isPasswordValid = await bcrypt.compare(password, data.password);
    if (!isPasswordValid) {
      return res.unauthorized('Password salah');
    }

    // Generate JWT token dengan role
    const token = generateToken({ id: data.id, role: data.role });

    // Mengembalikan token dan data pengguna yang relevan
    return res.ok({ token, id: data.id, role: data.role });
  } catch (error) {
    console.error(error);
    return res.error('Terjadi kesalahan saat login', {}, 500);
  }
};

module.exports = { login };
