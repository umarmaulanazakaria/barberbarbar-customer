// Rancangan kontrak guest. Belum merupakan kontrak endpoint backend yang tersedia.
export type DrafBookingTamu = {
  nama: string; nomorTelepon: string; mulaiPada: string;
  items: { layananId: number; qty: number }[];
};
export type BookingPribadi = {
  nomorBooking: string; mulaiPada: string; status: string;
  total: number; nominalDp: number; deadlineDp: string;
  dpTerverifikasi: boolean; balance: number;
  invoice: { nomorInvoice: string; url: string } | null;
};
export type ResponsBookingTamu = { booking: BookingPribadi; tautanPribadi: string };
export type ResponsSnap = { snapToken: string; transaksiId: string };
export type CallbackSnap = 'pending' | 'success' | 'failure';

export async function buatBookingTamu(_draf: DrafBookingTamu): Promise<ResponsBookingTamu> {
  throw new Error('Booking tamu belum tersedia. Tidak ada data yang dikirim.');
}
export async function ambilBookingPribadi(token: string): Promise<BookingPribadi> {
  if (!token.trim()) throw new Error('Tautan pribadi yang valid diperlukan.');
  throw new Error('Integrasi tautan pribadi belum tersedia. Tidak ada data yang diminta.');
}
export async function buatSnap(token: string): Promise<ResponsSnap> {
  if (!token.trim()) throw new Error('Tautan pribadi yang valid diperlukan.');
  throw new Error('Pembayaran belum tersedia. Tidak ada transaksi yang dibuat.');
}
// Kelak: token Snap hanya dari backend, callback hanya memicu pembacaan ulang
// status backend. Success callback tidak boleh menandai DP sah/CONFIRMED sendiri.
