// Hanya kode publik yang dikenal diterjemahkan; pesan/stack database tidak diteruskan.
const pesanKode: Record<string, string> = {
  SLOT_TIDAK_TERSEDIA: "Slot atau barber sudah tidak tersedia. Kembali dan pilih jadwal lain.",
  MEMBERSHIP_TIDAK_VALID: "Membership tidak dapat digunakan pada jadwal ini. Periksa Nomor Member atau lanjutkan sebagai Reguler.",
  BOOKING_GRATIS_AKTIF: "Booking gratis aktif sudah ada untuk Membership ini. Selesaikan Booking tersebut sebelum menggunakan manfaat lagi.",
  PERMINTAAN_SUDAH_DITERIMA: "Permintaan Booking sudah diterima. Periksa Booking pada browser ini sebelum mengirim ulang.",
  HARGA_BERUBAH: "Harga berubah. Kembali ke checkout dan periksa ulang tagihan.",
  GANGGUAN_SERVER: "Server sedang mengalami gangguan. Periksa status Booking sebelum mencoba kembali atau hubungi Admin.",
};
export const pesanKoneksiGuest = "Tidak dapat terhubung ke server atau waktu tunggu habis. Periksa koneksi dan status Booking sebelum mengirim ulang.";
export async function pesanKegagalanGuest(hasil: Response): Promise<string> {
  let data: unknown;
  try { data = await hasil.json(); } catch { /* Proxy dapat mengirim respons non-JSON. */ }
  if (data && typeof data === "object" && "kodeKesalahan" in data && typeof data.kodeKesalahan === "string" && Object.hasOwn(pesanKode, data.kodeKesalahan)) return pesanKode[data.kodeKesalahan];
  if (hasil.status >= 500) return pesanKode.GANGGUAN_SERVER;
  if (hasil.status === 403) return "Permintaan tidak diizinkan. Buka aplikasi dari alamat resminya dan coba lagi.";
  if (hasil.status === 404) return "Kode Booking tidak ditemukan atau tidak valid.";
  if (hasil.status === 429) return "Terlalu banyak percobaan. Tunggu beberapa saat sebelum mencoba lagi.";
  if (hasil.status === 409) return "Permintaan berbenturan dengan status Booking saat ini. Periksa Booking dan perbarui pilihan sebelum mengirim ulang.";
  if (hasil.status === 400) return "Data atau jadwal tidak valid. Periksa pilihan layanan, identitas, dan jadwal Booking.";
  return "Permintaan Booking belum dapat dipastikan. Periksa status atau hubungi Admin.";
}
