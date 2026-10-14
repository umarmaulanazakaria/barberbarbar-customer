import type { Booking, DrafBooking, Layanan, Ringkasan } from "../tipe";
export const rupiah = (nilai: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(nilai);
export const waktu = (iso: string) =>
  new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso)) + " WIB";
export const tanggalWib = (waktuKini = Date.now()) =>
  new Date(waktuKini + 7 * 3600000).toISOString().slice(0, 10);
export function estimasi(
  draf: DrafBooking,
  layanan: Layanan[],
  member: boolean,
) {
  let subtotal = 0,
    durasi = 0;
  for (const item of draf.items) {
    const l = layanan.find((x) => x.id === item.layananId);
    if (l) {
      subtotal += l.harga * item.qty;
      durasi += l.durasiMenit * item.qty;
    }
  }
  const diskon = member ? Math.round(subtotal * 0.1) : 0,
    total = subtotal - diskon;
  return { subtotal, diskon, total, dp: Math.ceil(total * 0.5), durasi };
}
export function validasiJadwal(
  draf: DrafBooking,
  durasi: number,
  kini = Date.now(),
): string | null {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(draf.tanggal) ||
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(draf.jam)
  )
    return "Pilih tanggal dan jam yang valid.";
  const mulai = Date.parse(`${draf.tanggal}T${draf.jam}:00+07:00`);
  if (!Number.isFinite(mulai) || tanggalWib(mulai) !== draf.tanggal)
    return "Tanggal tidak valid.";
  if (mulai <= kini || mulai > kini + 14 * 86400000)
    return "Pilih jadwal mendatang dalam 14 hari ke depan.";
  if (draf.tanggal === tanggalWib(kini) && mulai < kini + 180 * 60000)
    return "Booking hari ini perlu jeda minimal 3 jam.";
  const menit = Number(draf.jam.slice(0, 2)) * 60 + Number(draf.jam.slice(3));
  if (durasi <= 0 || menit < 540 || menit >= 1380 || menit + durasi > 1380)
    return "Layanan harus dimulai dan selesai antara 09.00–23.00 WIB.";
  return null;
}
export function izinCustomer(b: Booking, p?: Ringkasan) {
  const pending = b.usulanBarber.find((x) => x.status === "PENDING");
  const terakhir = b.usulanBarber[0];
  return {
    batal:
      ["PENDING_CONFIRMATION", "CONFIRMED", "CHECKED_IN"].includes(b.status) &&
      !b.pesananId,
    usulan: !!pending && ["CONFIRMED", "CHECKED_IN"].includes(b.status),
    jadwalUlang:
      !!p &&
      b.status === "CONFIRMED" &&
      Date.parse(b.mulaiPada) - Date.now() >= 3600000 &&
      !b.pesananId &&
      terakhir?.status === "REJECTED" &&
      !!terakhir.diputuskanPada &&
      !!b.dikonfirmasiPada &&
      Date.parse(terakhir.diputuskanPada) >= Date.parse(b.dikonfirmasiPada) &&
      !p.transaksi.some((x) => x.status === "PENDING"),
    dp:
      b.status === "CONFIRMED" &&
      !!p &&
      !p.dpTerverifikasi &&
      !p.transaksi.some((x) => x.tujuan === "DP" && x.status === "SUCCEEDED") &&
      (!b.deadlineDp || Date.parse(b.deadlineDp) > Date.now()),
    lunasi: b.status === "COMPLETED" && !!p?.dpTerverifikasi && p.balance > 0,
  };
}
export function checkoutAman(alamat: string) {
  const u = new URL(alamat);
  if (
    u.protocol !== "https:" ||
    u.hostname !== "app.sandbox.midtrans.com" ||
    u.port ||
    u.username ||
    u.password ||
    !u.pathname.startsWith("/snap/")
  )
    throw new Error("Tautan pembayaran Sandbox tidak valid.");
  return alamat;
}
const label: Record<string, string> = {
  PENDING_CONFIRMATION: "Menunggu konfirmasi",
  CONFIRMED: "Booking dikonfirmasi",
  CHECKED_IN: "Sudah check-in",
  IN_SERVICE: "Sedang dilayani",
  COMPLETED: "Layanan selesai",
  REJECTED: "Ditolak",
  CANCELLED: "Dibatalkan",
  NO_SHOW: "Tidak hadir",
  PENDING: "Menunggu",
  APPROVED: "Disetujui",
  SUCCEEDED: "Berhasil",
  FAILED: "Gagal",
  EXPIRED: "Kedaluwarsa",
  PROCESSING: "Sedang diproses",
  PENDING_APPROVAL: "Menunggu persetujuan",
  ACTIVE: "Member aktif",
  INACTIVE: "Member nonaktif",
  NON_MEMBER: "Belum menjadi member",
  AWAITING_DP: "Menunggu DP",
  DP_PAID: "DP sudah dibayar",
  UNPAID: "Belum dibayar",
  PARTIALLY_PAID: "Dibayar sebagian",
  OVERDUE: "Lewat batas pembayaran",
  PAID: "Lunas",
  REFUND_REVIEW: "Pengembalian dana ditinjau",
  DP_FORFEITED: "DP hangus",
  DP: "Uang muka",
  PELUNASAN: "Pelunasan",
  REFUND: "Pengembalian dana",
};
export const statusRamah = (status: string) =>
  label[status] ?? "Status sedang diperbarui";
