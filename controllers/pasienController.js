const pasienModel = require('../models/pasienModel');

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

module.exports = { updatePasien };


module.exports = { registerPasien, getPasien, getDetailPasien, deletePasien };
