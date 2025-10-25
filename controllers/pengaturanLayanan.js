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

// Fungsi untuk mendapatkan jadwal yang aktif
const getJadwalAktif = async (req, res) => {
  const { poli_id } = req.params;  // Mendapatkan poli_id dari parameter URL

  try {
    // Mendapatkan pengaturan layanan berdasarkan poli_id
    const { data: pengaturanLayanan, error: pengaturanError } = await supabase
      .from('pengaturan_layanan')
      .select('*')
      .eq('poli_id', poli_id)  // Filter berdasarkan poli_id
      .order('hari_operasional', { ascending: true });  // Mengurutkan berdasarkan hari operasional (misalnya Senin, Selasa, dst)

    if (pengaturanError) {
      return res.error('Gagal mengambil pengaturan layanan', {}, 500);
    }

    //console.log("data " + pengaturanLayanan)

    // Jika tidak ada pengaturan layanan ditemukan
    if (!pengaturanLayanan || pengaturanLayanan.length === 0) {
      return res.notFound('Pengaturan layanan tidak ditemukan untuk poli ini');
    }

    // Mendapatkan hari saat ini dan waktu saat ini
    const today = new Date();
    const dayOfWeek = today.toLocaleString('id-ID', { weekday: 'long', timeZone: 'Asia/Jakarta' }).toLowerCase();  // Nama hari dalam bahasa Indonesia
    const currentTime = today.getHours() * 60 + today.getMinutes();  // Menyimpan waktu saat ini dalam menit (jam * 60 + menit)

    // Filter untuk mendapatkan hari operasional yang aktif sesuai dengan hari ini
    const aktifLayanan = pengaturanLayanan.filter(item => {
      const hariOperasional = item.hari_operasional.map(hari => hari.toLowerCase());
      if (hariOperasional.includes(dayOfWeek)) {
        // Cek apakah waktu sekarang ada dalam jam operasional
        const jamStart = new Date(`1970-01-01T${item.jam_operasional_start}Z`);
        const jamEnd = new Date(`1970-01-01T${item.jam_operasional_end}Z`);
        const startMinutes = jamStart.getHours() * 60 + jamStart.getMinutes(); // Waktu dalam menit
        const endMinutes = jamEnd.getHours() * 60 + jamEnd.getMinutes(); // Waktu dalam menit

        return currentTime >= startMinutes && currentTime <= endMinutes;  // Cek apakah sekarang dalam jam operasional
      }
      return false;
    });

    // Mengembalikan data jadwal yang aktif
    res.ok(aktifLayanan);
  } catch (error) {
    console.error('Error: ', error);
    res.error('Terjadi kesalahan saat mengambil jadwal aktif', {}, 500);
  }
};


module.exports = { addPengaturanLayanan, getPengaturanLayanan, updatePengaturanLayanan, deletePengaturanLayanan, getJadwalAktif };