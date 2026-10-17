export type SlotWeb = { tanggal: string; serverTime: string; slotMenit: number; barber: { id: number; nama: string }[]; slot: { mulaiPada: string; selesaiPada: string; barberId: number[] }[] };
export type RencanaWeb = { nomorMember?: string; barberPilihanId: number; mulaiPada: string; items: { layananId: number; qty: number }[] };
export type KutipanWeb = { items: { layananId: number; nama: string; qty: number; harga: number; subtotal: number }[]; subtotal: number; diskonMember: number; total: number; nominalDp: number; sisaSetelahDp: number; bebasDp: boolean; barber: { id: number; nama: string } | null; mulaiPada: string; selesaiPada: string; slotMenit: number };
async function baca<T>(jalur: string, body?: unknown, signal?: AbortSignal): Promise<T> {
  const url = new URL(import.meta.env.VITE_API_BASE_URL || "/api", location.origin);
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.search || url.hash) throw Error("Alamat Booking belum valid.");
  const [rute, query] = jalur.split("?"); url.pathname = url.pathname.replace(/\/$/, "") + "/guest/bookings" + rute; url.search = query ?? "";
  const kontrol = new AbortController(), batal = () => kontrol.abort();
  signal?.addEventListener("abort", batal, { once: true }); if (signal?.aborted) batal();
  const timer = setTimeout(batal, 15000);
  try {
    const res = await fetch(url, { method: body ? "POST" : "GET", signal: kontrol.signal, cache: "no-store", credentials: "omit", referrerPolicy: "no-referrer", headers: { Accept: "application/json", ...(body ? { "Content-Type": "application/json" } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
    const data: unknown = await res.json();
    if (!res.ok) throw Error(res.status === 429 ? "Terlalu banyak percobaan. Tunggu sebelum memeriksa kembali." : data && typeof data === "object" && "pesan" in data && typeof data.pesan === "string" ? data.pesan : "Rencana Booking belum dapat diverifikasi.");
    return data as T;
  } finally { clearTimeout(timer); signal?.removeEventListener("abort", batal); }
}
export async function ambilSlotWeb(tanggal: string, signal?: AbortSignal) {
  const data = await baca<SlotWeb>(`/slots?tanggal=${encodeURIComponent(tanggal)}`, undefined, signal);
  if (!Array.isArray(data.barber) || !Array.isArray(data.slot) || data.slotMenit !== 45) throw Error("Jadwal belum dapat dibaca. Muat ulang.");
  return data;
}
export async function kutipanWeb(rencana: RencanaWeb) {
  const d = await baca<KutipanWeb>("/quote", rencana);
  if (![d.subtotal, d.diskonMember, d.total, d.nominalDp, d.sisaSetelahDp].every(n => Number.isSafeInteger(n) && n >= 0) || !Array.isArray(d.items) || typeof d.bebasDp !== "boolean" || d.nominalDp + d.sisaSetelahDp !== d.total || d.bebasDp && d.nominalDp !== 0 || d.barber?.id !== rencana.barberPilihanId) throw Error("Harga belum dapat dipastikan. Periksa ulang rencana Booking.");
  return d;
}
