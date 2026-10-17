export type RingkasanTamu = {
  bebasDp?: boolean; syaratDpTerpenuhi?: boolean;
  subtotal: number;
  total: number;
  nominalDpAwal: number;
  jumlahDibayar: number;
  balance: number;
  dpTerverifikasi: boolean;
  statusPembayaran: string;
  invoiceSementara: boolean;
  invoice: { nomorInvoice: string; total: number; dibuatPada: string } | null;
  transaksi: { id: number; tujuan: string; status: string; nominal: number }[];
};
export type DetailTamu = {
  serverTime: string;
  booking: {
    nomorBooking: string;
    status: string;
    mulaiPada: string;
    selesaiPada: string;
    durasiMenit: number;
    dibuatPada: string;
    deadlineDp: string | null;
    deadlinePelunasan: string | null;
    barber: string | null;
    dikonfirmasiPada: string | null;
    checkInPada: string | null;
    layananMulaiPada: string | null;
    layananSelesaiPada: string | null;
    aksesTamu: { nama: string; nomorTelepon: string; kedaluwarsaPada: string };
    items: {
      layananId: number;
      namaLayanan: string;
      qty: number;
      harga: number;
      subtotal: number;
      durasiMenit: number;
    }[];
  };
  ringkasan: RingkasanTamu;
};
export type BookingTerbit = {
  booking: { nomorBooking: string };
  serverTime: string;
};
export type CheckoutTamu = {
  transaksiId: number;
  token: string;
  redirect_url: string;
  clientKey: string;
  isProduction: false;
};
export const guestAktif =
  import.meta.env.VITE_GUEST_BOOKING_ENABLED !== "false";
async function permintaan<T>(
  jalur: string,
  method: "GET" | "POST",
  body?: unknown,
): Promise<T> {
  if (!guestAktif)
    throw new Error("Pemesanan sedang tidak tersedia. Silakan coba lagi nanti.");
  const url = new URL(
    import.meta.env.VITE_API_BASE_URL || "/api",
    window.location.origin,
  );
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  )
    throw new Error("Konfigurasi layanan tidak valid.");
  url.pathname = url.pathname.replace(/\/$/, "") + "/guest/bookings/session" + jalur;
  let hasil: Response;
  try {
    hasil = await fetch(url, {
      method,
      credentials: "include",
      cache: "no-store",
      referrerPolicy: "no-referrer",
      signal: AbortSignal.timeout(20_000),
      headers: {
        Accept: "application/json",
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  } catch {
    throw new Error(
      "Hasil permintaan belum dapat dipastikan. Periksa koneksi dan status sebelum mencoba kembali.",
    );
  }
  if (!hasil.ok) {
    const pesan =
      hasil.status === 503
        ? "Booking online sedang tidak tersedia. Silakan coba lagi nanti atau hubungi Admin."
        : hasil.status === 403
        ? "Permintaan tidak diizinkan. Buka aplikasi dari alamat resminya dan coba lagi."
        : hasil.status === 404
        ? "Kode booking tidak ditemukan atau tidak valid."
        : hasil.status === 429
          ? "Terlalu banyak percobaan. Tunggu beberapa saat."
          : hasil.status === 409
            ? "Permintaan berbenturan dengan status atau kapasitas saat ini. Perbarui status; jangan membuat pembayaran ganda."
            : hasil.status === 400
              ? "Data atau jadwal tidak valid. Gunakan jam 09.00–23.00 WIB, maksimal 14 hari, minimal 3 jam untuk hari ini."
              : "Layanan booking belum tersedia atau status belum dapat dipastikan. Periksa kembali nanti.";
    throw new KesalahanGuest(hasil.status,pesan);
  }
  return hasil.json() as Promise<T>;
}
export class KesalahanGuest extends Error { constructor(public status:number,pesan:string){super(pesan)} }
export const buatGuest = (data: {
  nomorMember?: string;nama?:string;nomorTelepon?:string;barberPilihanId?:number;totalDiharapkan?:number;mulaiPada:string;items:{layananId:number;qty:number}[];kunciIdempotensi:string}) => permintaan<BookingTerbit>("","POST",data);
export const detailGuest = async(token?:string) => {if(token)await imporLegacyGuest(token);return permintaan<DetailTamu>("/current","GET")};
export const sinkronGuest = () => permintaan<DetailTamu>("/sync","POST",{});
export function checkoutGuest(tujuan:"DP"|"PELUNASAN",kunciIdempotensi:string):Promise<CheckoutTamu>;
export function checkoutGuest(token:string,tujuan:"DP"|"PELUNASAN",kunciIdempotensi:string):Promise<CheckoutTamu>;
export async function checkoutGuest(a:string,b:string,c?:string){if(c)await imporLegacyGuest(a);return permintaan<CheckoutTamu>("/checkout","POST",{tujuan:c?b:a,kunciIdempotensi:c??b});}
export const invoiceGuest = () => permintaan<DetailTamu & {invoice:NonNullable<RingkasanTamu["invoice"]>}>("/invoice","GET");
export const kodeTrackingGuest = () => permintaan<{kode:string|null}>("/tracking","POST",{});
export const lacakGuest = (kode:string) => permintaan<{berhasil:true}>("/track","POST",{kode});
export const imporLegacyGuest = (token:string) => permintaan<{berhasil:true}>("/legacy","POST",{token});
export const kesiapanGuest=async(signal?:AbortSignal)=>{
 const url=new URL(import.meta.env.VITE_API_BASE_URL||"/api",window.location.origin);
 if(!["http:","https:"].includes(url.protocol)||url.username||url.password||url.search||url.hash)throw Error("Konfigurasi layanan tidak valid.");
 url.pathname=url.pathname.replace(/\/$/,"")+"/public/booking-availability";
 const r=await fetch(url,{signal,credentials:"omit",cache:"no-store",referrerPolicy:"no-referrer"});if(!r.ok)return false;return(await r.json()).tersedia===true;
};
