const bcrypt = require('bcryptjs');
const supabase = require('../db');

const createPasien = async ({ nama, no_hp, password }) => {
  // hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Force role = 'pasien' di server
  const payload = {
    nama,
    no_hp,
    password: hashedPassword,
    role: 'pasien'
  };

  const { data, error } = await supabase
    .from('users')
    .insert(payload)
    .select('id, nama, no_hp, role, created_at, updated_at')
    .single();

  if (error) {
    // Tangani pelanggaran unique no_hp (Postgres code 23505)
    if (error.code === '23505') {
      const err = new Error('NO_HP_ALREADY_USED');
      err.status = 409;
      throw err;
    }
    throw error;
  }

  return data; // password tidak pernah dikembalikan
};

// Mengambil seluruh data pasien
const getAllPasien = async () => {
  const { data: pasien, error } = await supabase
    .from('users')
    .select('*');

  if (error) {
    throw error;
  }
  return pasien;
};

module.exports = { createPasien, getAllPasien };
