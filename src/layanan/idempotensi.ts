export function buatKunciIdempotensi(): string {
  const sumber = globalThis.crypto;
  try {
    if (typeof sumber?.randomUUID === "function") return sumber.randomUUID();
    if (typeof sumber?.getRandomValues === "function") {
      const byte = sumber.getRandomValues(new Uint8Array(16));
      byte[6] = (byte[6] & 0x0f) | 0x40;
      byte[8] = (byte[8] & 0x3f) | 0x80;
      const hex = Array.from(byte, b => b.toString(16).padStart(2, "0")).join("");
      return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
    }
  } catch { /* Jangan mengganti sumber acak yang gagal dengan random lemah. */ }
  throw new Error("Browser tidak menyediakan pengacakan aman untuk booking. Gunakan browser terbaru atau akses HTTPS, lalu coba lagi.");
}
