const supabase = require('../db');

// Menambah pendaftaran online pasien beserta antrean
const createPendaftaran = async (req, res) => {
  const { poli_id, pasien_id, jadwal, keluhan, tanggal_daftar } = req.body;

  // Mengambil waktu lokal Indonesia (WIB)
  const localTime = new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' });
  const today = new Date(localTime);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);  // Mengatur tanggal besok

  // Format tanggal agar sama dengan format yang digunakan di database
  const todayFormatted = today.toISOString().split('T')[0]; // 'YYYY-MM-DD'
  const tomorrowFormatted = tomorrow.toISOString().split('T')[0]; // 'YYYY-MM-DD'

  // Validasi apakah tanggal_daftar yang dipilih adalah hari ini atau besok
  const selectedDate = tanggal_daftar.split('T')[0];  // Ambil tanggal dari tanggal_daftar (YYYY-MM-DD)

  if (selectedDate !== todayFormatted && selectedDate !== tomorrowFormatted) {
    return res.badRequest('Pasien hanya bisa mendaftar untuk hari ini atau besok');
  }

  // Validasi apakah jadwal ada
  if (!jadwal) {
    return res.badRequest('Jadwal harus diisi');
  }

  // Validasi format tanggal jadwal (misalnya, harus dalam format ISO 8601)
  const jadwalDate = new Date(jadwal);
  if (isNaN(jadwalDate)) {
    return res.badRequest('Format jadwal tidak valid');
  }

  // Mengambil waktu lokal Indonesia (WIB) untuk validasi jadwal
  const jadwalLocal = new Date(jadwal).toLocaleString('en-US', { timeZone: 'Asia/Jakarta' });
  const jadwalParsed = new Date(jadwalLocal);

  // Validasi apakah waktu yang dipilih pasien sesuai dengan jam operasional poli
  const { data: pengaturanLayanan, error: pengaturanError } = await supabase
    .from('pengaturan_layanan')
    .select('*')
    .eq('poli_id', poli_id)
    .limit(1)
    .single();

  console.log("data " + JSON.stringify(pengaturanError))
  if (pengaturanError || !pengaturanLayanan) {
    return res.notFound('Pengaturan layanan poli tidak ditemukan');
  }

  // Validasi apakah hari yang dipilih pasien sesuai dengan hari operasional
  const jadwalDay = jadwalParsed.toLocaleString('id-ID', { weekday: 'long', timeZone: 'Asia/Jakarta' }).toLowerCase();  
  console.log("compare hari " + jadwalDay + " " + pengaturanLayanan.hari_operasional);
  if (!pengaturanLayanan.hari_operasional.map(day => day.toLowerCase()).includes(jadwalDay)) {
    return res.badRequest('Jadwal yang dipilih tidak sesuai dengan hari operasional poli');
  }

  // Validasi apakah waktu yang dipilih sesuai dengan jam operasional
  const jamOperasionalStart = new Date(`1970-01-01T${pengaturanLayanan.jam_operasional_start}Z`);
  const jamOperasionalEnd = new Date(`1970-01-01T${pengaturanLayanan.jam_operasional_end}Z`);
  const jadwalTime = new Date(`1970-01-01T${jadwal.split('T')[1]}Z`);

  // Konversi waktu ke format 24 jam
  const startMinutes = jamOperasionalStart.getHours() * 60 + jamOperasionalStart.getMinutes();  // Waktu mulai dalam menit
  const endMinutes = jamOperasionalEnd.getHours() * 60 + jamOperasionalEnd.getMinutes();  // Waktu selesai dalam menit
  const jadwalMinutes = jadwalTime.getHours() * 60 + jadwalTime.getMinutes();  // Waktu jadwal dalam menit

  if (jadwalMinutes < startMinutes || jadwalMinutes > endMinutes) {
    return res.badRequest('Waktu yang dipilih tidak sesuai dengan jam operasional poli');
  }

  try {
    // Memasukkan data pendaftaran online ke tabel pendaftaran_online
    const { data: pendaftaranData, error: pendaftaranError } = await supabase
      .from('pendaftaran_online')
      .insert(
        {
          pasien_id: pasien_id,
          poli_id,
          tanggal_daftar: selectedDate,
          jadwal,
          keluhan
        }
      )
      .select()
      .single();


    if (pendaftaranError) {
      return res.error('Gagal menambahkan pendaftaran online', {}, 500);
    }

    // Mendapatkan nomor antrean berikutnya untuk poli
    const { data: antreanData, error: antreanError } = await supabase
      .from('antrean')
      .select('nomor_antrean')
      .eq('poli_id', poli_id)
      .order('nomor_antrean', { ascending: false })
      .limit(1)
      .single();

    let nomorAntrean = 1;
    if (antreanData && antreanData.nomor_antrean) {
      nomorAntrean = antreanData.nomor_antrean + 1;
    }

    // Format nomor antrean dengan prefix "A-"
    const nomorAntreanFormatted = `A-${nomorAntrean}`;

    // Menghitung estimasi waktu berdasarkan antrean sebelumnya (misalnya, 5 menit per pasien)
    const estimasiWaktu = new Date();
    estimasiWaktu.setMinutes(estimasiWaktu.getMinutes() + 5 * (nomorAntrean - 1));

    // Memasukkan data antrean ke tabel antrean, dengan relasi ke pendaftaran_online
    const { data: antreanCreated, error: antreanCreateError } = await supabase
      .from('antrean')
      .insert(
        {
          pasien_id: pasien_id,
          poli_id,
          nomor_antrean: nomorAntrean,  // Menyimpan nomor antrean sebagai integer
          status: 'antri',
          estimasi_waktu: estimasiWaktu,
          pendaftaran_online_id: pendaftaranData.id  // Menyimpan relasi dengan pendaftaran online
        }
      )
      .select().single();

    if (antreanCreateError) {
      return res.error('Gagal menambahkan antrean', {}, 500);
    }

    // Menambahkan nomor antrean dengan prefix "A-" ke dalam respons
    const response = {
      code: 201,
      message: 'CREATED',
      data: {
        pendaftaran: {
          ...pendaftaranData,
          antrean: {
            ...antreanCreated,
            nomor_antrean: nomorAntreanFormatted  // Mengembalikan nomor antrean dengan prefix "A-"
          }
        }
      }
    };

    res.created(response.data);
  } catch (error) {
    console.log("err " + error);
    res.error('Terjadi kesalahan saat menambah pendaftaran online dan antrean', {}, 500);
  }
};


// Mengambil pendaftaran online pasien berdasarkan ID
const getPendaftaranById = async (req, res) => {
  const { id } = req.params;

  try {
    const { data, error } = await supabase
      .from('pendaftaran_online')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.notFound('Pendaftaran online tidak ditemukan');
    }

    res.ok(data);
  } catch (error) {
    res.error('Terjadi kesalahan saat mengambil pendaftaran online', {}, 500);
  }
};

const updateStatusPendaftaran = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;  // Hanya menerima status

  if (!status) {
    return res.badRequest('Status harus diisi');
  }

  // Validasi status yang diterima
  const validStatuses = ['dibatalkan', 'checkin'];
  if (!validStatuses.includes(status)) {
    return res.badRequest('Status tidak valid. Pilih antara "dibatalkan" atau "checkin"');
  }

  try {
    // Memperbarui status antrean jika ada
    const { data: antreanData, error: antreanError } = await supabase
      .from('antrean')
      .select('*')
      .eq('pendaftaran_online_id', id)
      .single();

    if (antreanError || !antreanData) {
      return res.notFound('Antrean tidak ditemukan');
    }

    // Memperbarui status antrean dengan status yang baru
    const statusUpdate = { status };  // Set status antrean menjadi status yang baru

    // Memperbarui status antrean
    const { data: updatedAntreanData, error: antreanUpdateError } = await supabase
      .from('antrean')
      .update(statusUpdate)
      .eq('id', antreanData.id)
      .single();

    if (antreanUpdateError) {
      return res.error('Gagal memperbarui antrean', {}, 500);
    }

    // Mengembalikan respons setelah status diperbarui
    const response = {
      code: 200,
      message: 'UPDATED',
      data: {
        antrean: updatedAntreanData  // Mengembalikan antrean yang sudah diupdate
      }
    };

    res.ok(response.data);

  } catch (error) {
    console.log("Error: ", error);
    res.error('Terjadi kesalahan saat memperbarui status antrean', {}, 500);
  }
};



// Memperbarui pendaftaran online pasien (misalnya, jika pasien mengubah jadwal atau membatalkan)
const updatePendaftaran = async (req, res) => {
  const { id } = req.params;
  const { jadwal, keluhan } = req.body;

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const todayFormatted = today.toISOString().split('T')[0]; // 'YYYY-MM-DD'
  const tomorrowFormatted = tomorrow.toISOString().split('T')[0]; // 'YYYY-MM-DD'

  const selectedDate = jadwal.split('T')[0];

  if (selectedDate !== todayFormatted && selectedDate !== tomorrowFormatted) {
    return res.badRequest('Pasien hanya bisa mendaftar untuk hari ini atau besok');
  }

  try {
    // Memperbarui data pendaftaran online
    const { data: updatedPendaftaranData, error: pendaftaranError } = await supabase
      .from('pendaftaran_online')
      .update({ jadwal, keluhan, updated_at: new Date() })
      .eq('id', id)
      .single();

    if (pendaftaranError || !updatedPendaftaranData) {
      return res.notFound('Pendaftaran online tidak ditemukan');
    }

    // Memperbarui data antrean (misalnya, jika status atau estimasi waktu perlu diperbarui)
    const { data: antreanData, error: antreanError } = await supabase
      .from('antrean')
      .select('*')
      .eq('pendaftaran_online_id', id)
      .single();

    if (antreanError || !antreanData) {
      return res.notFound('Antrean tidak ditemukan');
    }

    // Menghitung ulang estimasi waktu berdasarkan antrean baru
    const estimasiWaktu = new Date();
    estimasiWaktu.setMinutes(estimasiWaktu.getMinutes() + 5 * (antreanData.nomor_antrean - 1));

    const { data: updatedAntreanData, error: antreanUpdateError } = await supabase
      .from('antrean')
      .update({ estimasi_waktu: estimasiWaktu })
      .eq('id', antreanData.id)
      .single();

    if (antreanUpdateError) {
      return res.error('Gagal memperbarui antrean', {}, 500);
    }

    const response = {
      code: 200,
      message: 'OK',
      data: {
        pendaftaran: {
          ...updatedPendaftaranData,
          antrean: updatedAntreanData  // Memasukkan objek antrean ke dalam pendaftaran
        }
      }
    };

    res.ok(response.data);
  } catch (error) {
    res.error('Terjadi kesalahan saat memperbarui pendaftaran online dan antrean', {}, 500);
  }
};

const getRiwayatKunjungan = async (req, res) => {
  const { pasien_id } = req.params;  // ID pasien yang ingin dilihat riwayat kunjungannya

  try {
    // Mengambil seluruh data pendaftaran online untuk pasien tertentu
    const { data: riwayatData, error: riwayatError } = await supabase
      .from('pendaftaran_online')
      .select('*, antrean(*)')  // Mengambil semua data dari pendaftaran dan relasi antrean
      .eq('pasien_id', pasien_id)  // Filter berdasarkan pasien_id
      .order('tanggal_daftar', { ascending: false });  // Mengurutkan berdasarkan tanggal_daftar (terbaru dulu)

    if (riwayatError) {
      return res.error('Gagal mengambil riwayat kunjungan', {}, 500);
    }

    // Jika tidak ada data riwayat ditemukan
    if (riwayatData.length === 0) {
      return res.notFound('Riwayat kunjungan tidak ditemukan');
    }

    // Mengubah antrean dari array menjadi object tunggal, jika hanya ada satu antrean
    const riwayatDenganAntrean = riwayatData.map((pendaftaran) => {
      // Cek apakah antrean adalah array dan pilih satu antrean (jika ada lebih dari satu)
      if (pendaftaran.antrean && Array.isArray(pendaftaran.antrean) && pendaftaran.antrean.length > 0) {
        pendaftaran.antrean = pendaftaran.antrean[0];  // Ambil antrean pertama
      }
      return pendaftaran;
    });

    // Mengembalikan data riwayat kunjungan
    res.ok(riwayatDenganAntrean);
  } catch (error) {
    console.error('Error: ', error);
    res.error('Terjadi kesalahan saat mengambil riwayat kunjungan', {}, 500);
  }
};



// Menghapus pendaftaran online pasien
const deletePendaftaran = async (req, res) => {
  const { id } = req.params;

  try {
    // Mengambil data pendaftaran online untuk mencari antrean terkait
    const { data: pendaftaranData, error: pendaftaranError } = await supabase
      .from('pendaftaran_online')
      .select('id')
      .eq('id', id)
      .single();

    if (pendaftaranError || !pendaftaranData) {
      return res.notFound('Pendaftaran online tidak ditemukan');
    }

    // Menghapus data antrean yang terkait dengan pendaftaran online
    const { data: antreanData, error: antreanError } = await supabase
      .from('antrean')
      .delete()
      .eq('pendaftaran_online_id', id);

    if (antreanError || !antreanData) {
      return res.notFound('Antrean tidak ditemukan');
    }

    // Menghapus pendaftaran online
    const { data, error } = await supabase
      .from('pendaftaran_online')
      .delete()
      .eq('id', id);

    if (error || !data) {
      return res.notFound('Pendaftaran online tidak ditemukan');
    }

    res.ok({ message: 'Pendaftaran online dan antrean berhasil dihapus' });
  } catch (error) {
    res.error('Terjadi kesalahan saat menghapus pendaftaran online dan antrean', {}, 500);
  }
};


module.exports = { createPendaftaran, getPendaftaranById, updatePendaftaran, updateStatusPendaftaran, deletePendaftaran, getRiwayatKunjungan};
