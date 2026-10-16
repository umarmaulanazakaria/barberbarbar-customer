export type RingkasanTamu = {
  subtotal: number; total: number; nominalDpAwal: number; jumlahDibayar: number; balance: number;
  dpTerverifikasi: boolean; statusPembayaran: string; invoiceSementara: boolean;
  invoice: { nomorInvoice: string; total: number; dibuatPada: string } | null;
  transaksi: { id: number; tujuan: string; status: string; nominal: number }[];
};
export type DetailTamu = {
  serverTime: string;
  booking: { nomorBooking: string; status: string; mulaiPada: string; selesaiPada: string; durasiMenit: number;
    dibuatPada: string; deadlineDp: string; deadlinePelunasan: string | null;
    aksesTamu: { nama: string; nomorTelepon: string; kedaluwarsaPada: string };
    items: { layananId: number; namaLayanan: string; qty: number; harga: number; subtotal: number; durasiMenit: number }[] };
  ringkasan: RingkasanTamu;
};
export type BookingTerbit = { token: string; tautanPribadi: string; booking: { nomorBooking: string }; serverTime: string };
export type CheckoutTamu = { transaksiId: number; token: string; redirect_url: string; clientKey: string; isProduction: false };
export const guestAktif = import.meta.env.VITE_GUEST_BOOKING_ENABLED !== 'false';
async function permintaan<T>(jalur: string, method: 'GET' | 'POST', token?: string, body?: unknown): Promise<T> {
  if (!guestAktif) throw new Error('Booking guest belum diaktifkan pada mode demo.');
  const url = new URL(import.meta.env.VITE_API_BASE_URL || '/api', window.location.origin);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) throw new Error('Konfigurasi layanan tidak valid.');
  if (token !== undefined && !/^[a-f0-9]{64}$/.test(token)) throw new Error('Tautan pribadi tidak valid.');
  url.pathname = url.pathname.replace(/\/$/, '') + '/guest/bookings' + jalur;
  let hasil: Response;
  try { hasil = await fetch(url, { method, credentials: 'omit', cache: 'no-store', referrerPolicy: 'no-referrer', signal: AbortSignal.timeout(20_000),
    headers: { Accept: 'application/json', ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...(token ? { Authorization: `Guest ${token}` } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }) }); }
  catch { throw new Error('Hasil permintaan belum dapat dipastikan. Periksa koneksi dan status sebelum mencoba kembali.'); }
  if (!hasil.ok) {
    const pesan = hasil.status === 404 ? 'Tautan pribadi tidak valid atau tidak tersedia.' : hasil.status === 429 ? 'Terlalu banyak percobaan. Tunggu beberapa saat.' : hasil.status === 409 ? 'Permintaan berbenturan dengan status atau kapasitas saat ini. Perbarui status; jangan membuat pembayaran ganda.' : hasil.status === 400 ? 'Data atau jadwal tidak valid. Gunakan jam 09.00–23.00 WIB, maksimal 14 hari, minimal 3 jam untuk hari ini.' : 'Layanan booking belum tersedia atau status belum dapat dipastikan. Periksa kembali nanti.';
    throw new Error(pesan);
  }
  return hasil.json() as Promise<T>;
}
export const buatGuest = (data: {nama:string;nomorTelepon:string;mulaiPada:string;items:{layananId:number;qty:number}[];kunciIdempotensi:string}) => permintaan<BookingTerbit>('', 'POST', undefined, data);
export const detailGuest = (token: string) => permintaan<DetailTamu>('/current', 'GET', token);
export const sinkronGuest = (token: string) => permintaan<DetailTamu>('/current/sync', 'POST', token, {});
export const checkoutGuest = (token: string, tujuan: 'DP' | 'PELUNASAN', kunciIdempotensi: string) => permintaan<CheckoutTamu>('/current/checkout', 'POST', token, { tujuan, kunciIdempotensi });
export const invoiceGuest = (token: string) => permintaan<DetailTamu & {invoice:NonNullable<RingkasanTamu['invoice']>}>('/current/invoice', 'GET', token);
