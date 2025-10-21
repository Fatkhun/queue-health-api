const bcrypt = require('bcryptjs');
const supabase = require('../db');

// Menambahkan pasien baru
const createPasien = async (data) => {
  // Hash password sebelum menyimpannya
  const hashedPassword = bcrypt.hashSync(data.password, 10);  // 10 adalah tingkat salt
  const pasienData = {
    nama: data.nama,
    no_hp: data.no_hp,
    password: hashedPassword
  };

  const { data: pasien, error } = await supabase
    .from('users')
    .insert([pasienData]);

  if (error) {
    throw error;
  }
  return pasien;
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
