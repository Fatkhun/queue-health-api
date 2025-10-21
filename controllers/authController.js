const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { secretKey } = require('../config/jwtSecret');
const supabase = require('../db');

// Function to generate JWT token
const generateToken = (user) => {
  return jwt.sign(user, secretKey, { expiresIn: '1h' });
};

// Login untuk petugas, pasien, dan super admin
const login = async (req, res) => {
  const { no_hp, password } = req.body;

  try {
    const { data, error } = await supabase
      .from('users')  // Atau ganti dengan nama tabel yang sesuai
      .select('*')
      .eq('no_hp', no_hp)
      .single();

    if (error || !data) {
      return res.unauthorized('Nomor HP tidak ditemukan');
    }

    const isPasswordValid = await bcrypt.compare(password, data.password);

    if (!isPasswordValid) {
      return res.unauthorized('Password salah');
    }

    // Generate JWT token dengan role
    const token = generateToken({ id: data.id, role: data.role });

    return res.ok({ token });
  } catch (error) {
    console.error(error);
    return res.error('Terjadi kesalahan saat login', {}, 500);
  }
};

module.exports = { login };
