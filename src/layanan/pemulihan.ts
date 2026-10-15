// Tautan hanya membuka formulir. Tidak menjalankan reset atau mempercayai URL
// sebagai sesi login; token tetap diverifikasi server saat pengguna menyimpan.
export function bacaTautanPemulihan(alamat: string): string | null {
  // URL RN tidak mem-parsing hostname custom scheme seperti URL Node/browser.
  // Format tunggal sesuai email backend; tanpa query/parameter ambigu/dependency.
  const cocok = /^barberbarbar-customer:\/\/reset-password#token=([a-f0-9]{64})$/.exec(alamat);
  return cocok?.[0] === alamat ? cocok[1] ?? null : null;
}
