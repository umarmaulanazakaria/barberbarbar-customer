export type Layanan = {
  id: number;
  nama: string;
  harga: number;
  durasiMenit: number;
};
export type Barber = { id: number; nama: string };
export type Pelanggan = {
  id: number;
  nama: string;
  nomorTelepon: string;
  alamat: string | null;
  status: string;
};
export type Akun = { id: number; email: string; pelanggan: Pelanggan };
export type Membership = {
  status: "NON_MEMBER" | "PENDING_APPROVAL" | "ACTIVE" | "INACTIVE";
  dapatMengajukan: boolean;
  diskonPersen: number;
  membership: { memberCode: string; isActive: boolean } | null;
  permohonan: { status: string; catatanKeputusan?: string | null } | null;
};
export type ItemBooking = {
  layananId: number;
  namaLayanan: string;
  harga: number;
  durasiMenit: number;
  qty: number;
  subtotal: number;
};
export type Usulan = {
  id: number;
  barberId: number;
  alasan: string;
  status: string;
  dibuatPada: string;
  diputuskanPada: string | null;
};
export type Booking = {
  id: number;
  nomorBooking: string;
  status: string;
  mulaiPada: string;
  selesaiPada: string;
  durasiMenit: number;
  barberPilihanId: number | null;
  barberDisetujuiId: number | null;
  barberFinalId: number | null;
  pesananId: number | null;
  subtotal: number;
  discountPercent: number;
  diskon: number;
  total: number;
  nominalDp: number;
  catatan: string | null;
  alasanPenolakan: string | null;
  dibuatPada: string;
  dikonfirmasiPada: string | null;
  deadlineDp: string | null;
  deadlinePelunasan: string | null;
  items: ItemBooking[];
  usulanBarber: Usulan[];
  riwayat: { aksi: string; statusSetelah: string; dibuatPada: string }[];
};
export type Transaksi = {
  id: number;
  tujuan: string;
  kanal: string;
  status: string;
  nominal: number;
  dibuatPada: string;
  dibayarPada: string | null;
};
export type Ringkasan = {
  total: number;
  subtotal: number;
  discountPercent: number;
  diskon: number;
  nominalDp: number;
  jumlahDibayar: number;
  jumlahDibayarBruto: number;
  jumlahRefund: number;
  balance: number;
  dpTerverifikasi: boolean;
  statusPembayaran: string;
  invoiceSementara: boolean;
  invoice: { nomorInvoice: string; total: number; dibuatPada: string } | null;
  transaksi: Transaksi[];
};
export type Refund = {
  id: number;
  bookingId: number;
  nominal: number;
  alasan: string;
  status: string;
  dibuatPada: string;
  catatanKeputusan: string | null;
};
export type DrafBooking = {
  items: { layananId: number; qty: number }[];
  barberPilihanId: number | null;
  tanggal: string;
  jam: string;
  catatan: string;
};
