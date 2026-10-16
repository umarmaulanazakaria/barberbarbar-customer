export type Layanan = { id: number; nama: string; harga: number; durasiMenit: number };
export type PilihanLayanan = { layanan: Layanan; jumlah: number };
export type DrafBooking = { nama: string; telepon: string; tanggal: string; jam: string; pilihan: PilihanLayanan[] };
export type KesalahanForm = Partial<Record<keyof DrafBooking, string>>;
export type PratinjauBooking = DrafBooking & { batasDemo: number; sumber: 'publik' | 'demo' };

export const labelDemo = 'Demo UI — belum terhubung ke proses booking/pembayaran';
export const rupiah = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);
export function tanggalWib(sekarang = Date.now()) { return new Date(sekarang + 7 * 3_600_000).toISOString().slice(0, 10); }
export function waktuWib(tanggal: string, jam: string) {
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Asia/Jakarta' })
    .format(new Date(`${tanggal}T${jam}:00+07:00`)) + ' WIB';
}
export function normalisasiTelepon(nilai: string) {
  const bersih = nilai.replace(/[\s()-]/g, '');
  return bersih.startsWith('08') ? '+62' + bersih.slice(1) : bersih.startsWith('62') ? '+' + bersih : bersih;
}
export function estimasi(pilihan: PilihanLayanan[]) {
  const total = pilihan.reduce((n, p) => n + p.layanan.harga * p.jumlah, 0);
  const durasi = pilihan.reduce((n, p) => n + p.layanan.durasiMenit * p.jumlah, 0);
  return { total, dp: Math.ceil(total / 2), durasi };
}
export function validasiDraf(d: DrafBooking, sekarang = Date.now()): KesalahanForm {
  const salah: KesalahanForm = {};
  if (d.nama.trim().length < 2 || d.nama.trim().length > 80) salah.nama = 'Isi nama antara 2–80 karakter.';
  if (!/^\+628\d{7,11}$/.test(normalisasiTelepon(d.telepon))) salah.telepon = 'Gunakan nomor HP Indonesia, misalnya 081234567890.';
  if (!d.pilihan.length || d.pilihan.some(p => !Number.isInteger(p.jumlah) || p.jumlah < 1 || p.jumlah > 10) || !Number.isSafeInteger(estimasi(d.pilihan).total))
    salah.pilihan = 'Pilih minimal satu layanan dengan jumlah 1–10.';
  const iso = `${d.tanggal}T${d.jam}:00+07:00`, jadwal = Date.parse(iso);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d.tanggal) || !Number.isFinite(jadwal) || tanggalWib(jadwal) !== d.tanggal || d.tanggal < tanggalWib(sekarang))
    salah.tanggal = 'Pilih tanggal layanan mulai hari ini (WIB).';
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(d.jam)) salah.jam = 'Pilih jam layanan yang valid.';
  else if (Number.isFinite(jadwal) && jadwal <= sekarang) salah.jam = 'Pilih jadwal yang belum terlewati (WIB).';
  return salah;
}
export function hitungMundur(batas: number, sekarang: number) {
  const sisa = Math.max(0, Math.ceil((batas - sekarang) / 1000));
  return `${String(Math.floor(sisa / 60)).padStart(2, '0')}:${String(sisa % 60).padStart(2, '0')}`;
}
