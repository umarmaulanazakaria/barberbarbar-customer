import {buatGuest,detailGuest,checkoutGuest,guestAktif,type BookingTerbit,type DetailTamu,type CheckoutTamu} from './guest';
// Façade kompatibel dengan preview. Mode nyata memakai endpoint guest terpisah.
export type DrafBookingTamu = {
  nama: string; nomorTelepon: string; mulaiPada: string;
  items: { layananId: number; qty: number }[]; kunciIdempotensi:string;
};
export type BookingPribadi = {
  nomorBooking: string; mulaiPada: string; status: string;
  total: number; nominalDp: number; deadlineDp: string;
  dpTerverifikasi: boolean; balance: number;
  invoice: { nomorInvoice: string; url: string } | null;
};
export type ResponsBookingTamu = BookingTerbit;
export type ResponsSnap = CheckoutTamu;
export type CallbackSnap = 'pending' | 'success' | 'failure';

export async function buatBookingTamu(draf: DrafBookingTamu): Promise<ResponsBookingTamu> {
  if(!guestAktif)throw new Error('Mode demo. Tidak ada data yang dikirim.');
  return buatGuest(draf);
}
export async function ambilBookingPribadi(token: string): Promise<DetailTamu> {
  if (!token.trim()) throw new Error('Tautan pribadi yang valid diperlukan.');
  if(!guestAktif)throw new Error('Mode demo. Tidak ada data yang diminta.');
  return detailGuest(token);
}
export async function buatSnap(token: string): Promise<ResponsSnap> {
  if (!token.trim()) throw new Error('Tautan pribadi yang valid diperlukan.');
  if(!guestAktif)throw new Error('Mode demo. Tidak ada transaksi yang dibuat.');
  return checkoutGuest(token,'DP',crypto.randomUUID());
}
// Token Snap hanya dari backend, callback hanya memicu pembacaan ulang
// status backend. Success callback tidak boleh menandai DP sah/CONFIRMED sendiri.
