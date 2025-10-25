const supabase = require('../db');

// Menambahkan poli baru
const createPoli = async (req, res) => {
  const { nama_poli } = req.body;

  if (!nama_poli) {
    return res.badRequest('Nama poli harus diisi');
  }

  try {
    // Memasukkan data poli ke tabel poli
    const { data, error } = await supabase
      .from('poli')
      .insert({ nama_poli })
      .select()
      .single();

    if (error) {
      return res.error('Gagal menambahkan poli', {}, 500);
    }

    res.created({}, "Berhasil menambah poli");
  } catch (error) {
    res.error('Terjadi kesalahan saat menambahkan poli', {}, 500);
  }
};

// Mengambil semua poli
const getAllPoli = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('poli')
      .select('*');

    if (error || !data) {
      return res.notFound('Poli tidak ditemukan');
    }

    res.ok(data);
  } catch (error) {
    res.error('Terjadi kesalahan saat mengambil data poli', {}, 500);
  }
};

// Mengambil poli berdasarkan ID
const getPoliById = async (req, res) => {
  const { id } = req.params;

  try {
    const { data, error } = await supabase
      .from('poli')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.notFound('Poli tidak ditemukan');
    }

    res.ok(data);
  } catch (error) {
    res.error('Terjadi kesalahan saat mengambil detail poli', {}, 500);
  }
};

// Memperbarui poli berdasarkan ID
const updatePoli = async (req, res) => {
  const { id } = req.params;
  const { nama_poli } = req.body;

  if (!nama_poli) {
    return res.badRequest('Nama poli harus diisi');
  }

  try {
    const { data, error } = await supabase
      .from('poli')
      .update({ nama_poli })
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.notFound('Poli tidak ditemukan');
    }

    res.ok(data);
  } catch (error) {
    res.error('Terjadi kesalahan saat memperbarui poli', {}, 500);
  }
};

// Menghapus poli berdasarkan ID
const deletePoli = async (req, res) => {
  const { id } = req.params;

  try {
    const { data, error } = await supabase
      .from('poli')
      .delete()
      .eq('id', id);

    if (error || !data) {
      return res.notFound('Poli tidak ditemukan');
    }

    res.ok({ message: 'Poli berhasil dihapus' });
  } catch (error) {
    res.error('Terjadi kesalahan saat menghapus poli', {}, 500);
  }
};

module.exports = { createPoli, getAllPoli, getPoliById, updatePoli, deletePoli };
