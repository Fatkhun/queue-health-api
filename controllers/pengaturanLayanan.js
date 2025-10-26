const supabase = require('../db');

const addPengaturanLayanan = async (req, res) => {
  const { poli_id, hari_operasional, jam_operasional_start, jam_operasional_end, kuota_harian } = req.body;

  // Pastikan hari_operasional adalah array
  if (!Array.isArray(hari_operasional)) {
    return res.badRequest('Hari operasional harus berupa array');
  }

  try {
    // Mengecek apakah poli_id sudah ada di pengaturan_layanan
    const { data: existingData, error: fetchError } = await supabase
      .from('pengaturan_layanan')
      .select('*')
      .eq('poli_id', poli_id)
      .single();

    if (fetchError) {
      return res.error('Gagal memeriksa data pengaturan layanan', {}, 500);
    }

    if (existingData) {
      // Jika data sudah ada, lakukan update
      const { data, error } = await supabase
        .from('pengaturan_layanan')
        .update({
          hari_operasional,
          jam_operasional_start,
          jam_operasional_end,
          kuota_harian
        })
        .eq('poli_id', poli_id)
        .single();

      if (error) {
        return res.error('Gagal memperbarui pengaturan layanan', {}, 500);
      }

      return res.ok({}, "Berhasil memperbarui pengaturan layanan");
    } else {
      // Jika data belum ada, lakukan insert
      const { data, error } = await supabase
        .from('pengaturan_layanan')
        .insert({
          poli_id,
          hari_operasional,
          jam_operasional_start,
          jam_operasional_end,
          kuota_harian
        })
        .select()
        .single();

      if (error) {
        return res.error('Gagal menambahkan pengaturan layanan', {}, 500);
      }

      return res.created({}, "Berhasil menambah pengaturan layanan");
    }
  } catch (error) {
    return res.error('Terjadi kesalahan saat menambahkan atau memperbarui pengaturan layanan', {}, 500);
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

    // Jika tidak ada pengaturan layanan ditemukan
    if (!pengaturanLayanan || pengaturanLayanan.length === 0) {
      return res.notFound('Pengaturan layanan tidak ditemukan untuk poli ini');
    }

    // Mendapatkan hari saat ini dan waktu saat ini
    const today = new Date();
    const dayOfWeek = today.toLocaleString('id-ID', { weekday: 'long', timeZone: 'Asia/Jakarta' }).toLowerCase();  // Nama hari dalam bahasa Indonesia
    const currentTime = today.getHours() * 60 + today.getMinutes();  // Menyimpan waktu saat ini dalam menit (jam * 60 + menit)

    console.log("hari " + dayOfWeek);

    // Filter untuk mendapatkan hari operasional yang aktif sesuai dengan hari ini
    const aktifLayanan = pengaturanLayanan.filter(item => {
      const hariOperasional = item.hari_operasional.map(hari => hari.toLowerCase());
      if (hariOperasional.includes(dayOfWeek)) {
        // Cek apakah waktu sekarang ada dalam jam operasional
        const jamStart = item.jam_operasional_start.split(':');
        const jamEnd = item.jam_operasional_end.split(':');

        // Mengonversi jam mulai dan jam selesai ke menit
        const startMinutes = parseInt(jamStart[0]) * 60 + parseInt(jamStart[1]); // Waktu mulai dalam menit
        const endMinutes = parseInt(jamEnd[0]) * 60 + parseInt(jamEnd[1]); // Waktu selesai dalam menit

        console.log("today " + today + " poli start " + startMinutes);
        console.log("curr " + currentTime + " start poli " + startMinutes + " end poli " + endMinutes);

        // Cek apakah waktu sekarang dalam rentang jam operasional
        return currentTime >= startMinutes && currentTime <= endMinutes;
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