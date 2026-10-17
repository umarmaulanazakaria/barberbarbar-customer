export async function kutipanMembership(data: { nomorMember: string; mulaiPada: string; items: { layananId: number; qty: number }[] }) {
  const url = new URL(import.meta.env.VITE_API_BASE_URL || "/api", window.location.origin);
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.search || url.hash) throw new Error("Alamat layanan belum valid.");
  url.pathname = url.pathname.replace(/\/$/, "") + "/public/member-quote";
  const respons = await fetch(url, { method: "POST", credentials: "omit", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data), signal: AbortSignal.timeout(10000) });
  const isi: unknown = await respons.json();
  if (!respons.ok) throw new Error(isi && typeof isi === "object" && "pesan" in isi && typeof isi.pesan === "string" ? isi.pesan : "Membership belum dapat diverifikasi.");
  if (!isi || typeof isi !== "object" || !("total" in isi) || typeof isi.total !== "number" || !Number.isSafeInteger(isi.total) || isi.total < 0 || !("bebasDp" in isi) || isi.bebasDp !== true) throw new Error("Tagihan Membership belum dapat dibaca.");
  return { total: isi.total, bebasDp: true };
}
