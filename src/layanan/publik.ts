import type { Layanan } from '../domain';

export function bacaLayanan(data: unknown): Layanan[] {
  if (!Array.isArray(data)) throw new Error('Daftar layanan belum dapat dibaca.');
  const id = new Set<number>();
  return data.map((nilai: unknown) => {
    if (!nilai || typeof nilai !== 'object') throw new Error('Data layanan belum lengkap.');
    const p = nilai as Record<string, unknown>;
    if (typeof p.id !== 'number' || !Number.isSafeInteger(p.id) || p.id <= 0 || id.has(p.id) ||
      typeof p.nama !== 'string' || !p.nama.trim() || p.nama.length > 150 || typeof p.harga !== 'number' ||
      !Number.isSafeInteger(p.harga) || p.harga < 0 || typeof p.durasiMenit !== 'number' ||
      !Number.isSafeInteger(p.durasiMenit) || p.durasiMenit <= 0) throw new Error('Data layanan belum lengkap.');
    id.add(p.id);
    return { id: p.id, nama: p.nama, harga: p.harga, durasiMenit: p.durasiMenit, ...(typeof p.slotBookingMenit === "number" && Number.isSafeInteger(p.slotBookingMenit) && p.slotBookingMenit > 0 ? { slotBookingMenit: p.slotBookingMenit } : {}) };
  });
}
export async function ambilLayanan(sinyal?: AbortSignal): Promise<Layanan[]> {
  const dasar = import.meta.env.VITE_API_BASE_URL || '/api';
  const url = new URL(dasar, window.location.origin);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash)
    throw new Error('Alamat layanan belum dikonfigurasi dengan benar.');
  url.pathname = url.pathname.replace(/\/$/, '') + '/public/services';
  const kontrol = new AbortController(), batal = () => kontrol.abort();
  if (sinyal?.aborted) batal();
  sinyal?.addEventListener('abort', batal, { once: true });
  const timer = window.setTimeout(batal, 10_000);
  try {
    const hasil = await fetch(url, { method: 'GET', credentials: 'omit', signal: kontrol.signal, headers: { Accept: 'application/json' } });
    if (!hasil.ok) throw new Error('Daftar layanan belum dapat dimuat. Coba lagi atau buka layanan demo.');
    return bacaLayanan(await hasil.json());
  } catch (e) {
    if (sinyal?.aborted) throw e;
    throw new Error('Daftar layanan belum dapat dimuat. Coba lagi atau buka layanan demo.');
  } finally { clearTimeout(timer); sinyal?.removeEventListener('abort', batal); }
}
