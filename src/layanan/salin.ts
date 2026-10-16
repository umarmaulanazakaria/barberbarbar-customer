export async function salinAtauPilihKode(kode: string, elemen: HTMLElement | null): Promise<boolean> {
  try {
    if (typeof navigator.clipboard?.writeText === "function") {
      await navigator.clipboard.writeText(kode);
      return true;
    }
  } catch { /* Izin clipboard ditolak: pilih teks tanpa mengklaim berhasil disalin. */ }
  if (elemen) {
    elemen.focus();
    const rentang = document.createRange();
    rentang.selectNodeContents(elemen);
    const pilihan = window.getSelection();
    pilihan?.removeAllRanges();
    pilihan?.addRange(rentang);
  }
  return false;
}
