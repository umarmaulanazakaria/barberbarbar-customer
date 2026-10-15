import axios from "axios";
import { pesanAman } from './teks';
import type {
  Akun,
  Barber,
  Booking,
  DrafBooking,
  Layanan,
  Membership,
  Refund,
  Ringkasan,
} from "../tipe";
import { ambilSesi, keluar } from "./sesi";
export const alamatApi =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";
export function validasiAlamat(alamat: string) {
  const u = new URL(alamat);
  if (
    !["http:", "https:"].includes(u.protocol) ||
    u.username ||
    u.password ||
    u.search ||
    u.hash
  )
    throw new Error("Aplikasi belum dapat terhubung. Silakan hubungi pengelola.");
  return u.origin;
}
export const publik = axios.create({
  baseURL: alamatApi,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});
export async function privat<T>(
  metode: "get" | "post" | "patch",
  jalur: string,
  data?: unknown,
): Promise<T> {
  const { token, versi } = ambilSesi();
  if (!token) throw new Error("Silakan masuk untuk melanjutkan.");
  try {
    const r = await publik.request<T>({
      method: metode,
      url: jalur,
      data,
      headers: { Authorization: `Bearer ${token}` },
    });
    if (ambilSesi().versi !== versi) throw new Error("Sesi sudah berubah.");
    return r.data;
  } catch (e) {
    if (axios.isAxiosError(e) && e.response?.status === 401)
      await keluar(token);
    throw e;
  }
}
export const pesanError = (e: unknown) => {
  if (axios.isAxiosError<{ pesan?: string }>(e)) {
    if (e.response?.status === 429)
      return "Terlalu banyak percobaan. Tunggu beberapa menit, lalu coba lagi.";
    if (e.response?.status === 401)
      return "Sesi berakhir atau data masuk tidak sesuai. Silakan masuk kembali.";
    if (!e.response)
      return "Koneksi terputus. Periksa jaringan dan coba lagi.";
    if (e.response.status >= 500)
      return "Layanan sedang mengalami gangguan. Silakan coba lagi.";
    return pesanAman(e.response.data?.pesan, 'Permintaan belum dapat diproses.');
  }
  return pesanAman(e instanceof Error ? e.message : null);
};
export const ambilLayanan = async () =>
  (await publik.get<Layanan[]>("/public/services")).data;
export const ambilBarber = async () =>
  (await publik.get<Barber[]>("/public/barbers")).data;
export const verifikasiToken = async (token: string) =>
  (
    await publik.get<{ akun: Akun }>("/auth/customer/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
  ).data.akun;
export const ambilProfil = async () =>
  (await privat<{ akun: Akun }>("get", "/auth/customer/me")).akun;
export const ubahProfil = (data: { nama?: string; alamat?: string; email?: string; nomorTelepon?: string; passwordSaatIni?: string; passwordBaru?: string }) =>
  privat<{ sesiDicabut: boolean }>("patch", "/auth/customer/me", data);
export const ambilMembership = () =>
  privat<Membership>("get", "/customer/membership");
export const ajukanMembership = () =>
  privat("post", "/customer/membership/requests", {});
export const ambilBooking = async () =>
  (await privat<{ data: Booking[] }>("get", "/customer/bookings")).data;
export const detailBooking = async (id: number) =>
  (await privat<{ booking: Booking }>("get", `/customer/bookings/${id}`))
    .booking;
export const pembayaranBooking = async (id: number) =>
  (
    await privat<{ ringkasan: Ringkasan }>(
      "get",
      `/customer/bookings/${id}/payments`,
    )
  ).ringkasan;
export const ambilRefund = async () =>
  (await privat<{ data: Refund[] }>("get", "/customer/refunds")).data;
export const payloadBooking = (d: DrafBooking) => ({
  items: d.items.map((x) => ({ layananId: x.layananId, qty: x.qty })),
  barberPilihanId: d.barberPilihanId,
  mulaiPada: `${d.tanggal}T${d.jam}:00+07:00`,
  ...(d.catatan.trim() ? { catatan: d.catatan.trim() } : {}),
});
export const buatBooking = async (d: DrafBooking) =>
  (
    await privat<{ booking: Booking }>(
      "post",
      "/customer/bookings",
      payloadBooking(d),
    )
  ).booking;
export const jadwalUlang = async (id: number, d: DrafBooking) =>
  (
    await privat<{ booking: Booking }>(
      "post",
      `/customer/bookings/${id}/reschedule`,
      {
        mulaiPada: payloadBooking(d).mulaiPada,
        barberPilihanId: d.barberPilihanId,
        items: d.items,
      },
    )
  ).booking;
export const batalBooking = (id: number) =>
  privat("post", `/customer/bookings/${id}/cancel`, {});
export const jawabUsulan = (id: number, usulanId: number, terima: boolean) =>
  privat(
    "post",
    `/customer/bookings/${id}/barber-proposals/${usulanId}/${terima ? "accept" : "reject"}`,
    {},
  );
export const buatCheckout = (
  id: number,
  pelunasan: boolean,
  kunciIdempotensi: string,
) =>
  privat<{ transaksiId: number; token: string; redirect_url: string }>(
    "post",
    `/customer/bookings/${id}/payments/${pelunasan ? "online-settlement" : "dp"}`,
    { kunciIdempotensi },
  );
export const sinkronkanPembayaran = (id: number) =>
  privat("post", `/customer/payments/${id}/sync`, {});
