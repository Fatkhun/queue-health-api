const supabase = require('../db');

const addPengaturanLayanan = async (req, res) => {
  const { poli_id, hari_operasional, jam_operasional_start, jam_operasional_end, kuota_harian } = req.body;

  // Pastikan hari_operasional adalah array
  if (!Array.isArray(hari_operasional)) {
    return res.badRequest('Hari operasional harus berupa array');
  }

  try {
    // Memasukkan pengaturan layanan ke tabel pengaturan_layanan
    const { data, error } = await supabase
      .from('pengaturan_layanan')
      .insert(
        {
          poli_id,
          hari_operasional,  // Menyimpan hari_operasional sebagai array
          jam_operasional_start,
          jam_operasional_end,
          kuota_harian
        }
      )
      .single();

    if (error) {
      return res.error('Gagal menambahkan pengaturan layanan', {}, 500);
    }

    res.created(data);
  } catch (error) {
    res.error('Terjadi kesalahan saat menambahkan pengaturan layanan', {}, 500);
  }
};


const getPengaturanLayanan = async (req, res) => {
  const { poli_id, hari_operasional } = req.params;

  try {
    const { data, error } = await supabase
      .from('pengaturan_layanan')
      .select('*')
      .eq('poli_id', poli_id)
      .contains('hari_operasional', [hari_operasional])  // Mencocokkan hari_operasional array dengan hari_operasional yang dicari
      .single();

    if (error || !data) {
      return res.notFound('Pengaturan layanan tidak ditemukan');
    }

    res.ok(data);
  } catch (error) {
    res.error('Terjadi kesalahan saat mengambil pengaturan layanan', {}, 500);
  }
};


const updatePengaturanLayanan = async (req, res) => {
  const { poli_id, hari_operasional } = req.params;
  const { jam_operasional_start, jam_operasional_end, kuota_harian } = req.body;

  // Pastikan hari_operasional adalah array
  if (!Array.isArray(hari_operasional)) {
    return res.badRequest('Hari operasional harus berupa array');
  }

  try {
    const { data, error } = await supabase
      .from('pengaturan_layanan')
      .update({
        hari_operasional,  // Update hari_operasional dengan array baru
        jam_operasional_start,
        jam_operasional_end,
        kuota_harian
      })
      .eq('poli_id', poli_id)
      .single();

    if (error || !data) {
      return res.notFound('Pengaturan layanan tidak ditemukan');
    }

    res.ok(data);
  } catch (error) {
    res.error('Terjadi kesalahan saat memperbarui pengaturan layanan', {}, 500);
  }
};


const deletePengaturanLayanan = async (req, res) => {
  const { poli_id, hari_operasional } = req.params;

  try {
    const { data, error } = await supabase
      .from('pengaturan_layanan')
      .delete()
      .eq('poli_id', poli_id)
      .contains('hari_operasional', [hari_operasional])  // Pastikan hari_operasional array mencocokkan hari_operasional yang dicari
      .single();

    if (error || !data) {
      return res.notFound('Pengaturan layanan tidak ditemukan');
    }

    res.ok({ message: 'Pengaturan layanan berhasil dihapus' });
  } catch (error) {
    res.error('Terjadi kesalahan saat menghapus pengaturan layanan', {}, 500);
  }
};


module.exports = { addPengaturanLayanan, getPengaturanLayanan, updatePengaturanLayanan, deletePengaturanLayanan };