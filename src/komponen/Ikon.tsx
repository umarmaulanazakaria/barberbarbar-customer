export type NamaIkon = 'gunting' | 'jam' | 'panah' | 'cek' | 'kalender' | 'rumah' | 'layanan' | 'perisai' | 'tautan' | 'kartu' | 'kembali';
const jalur: Record<NamaIkon, string> = {
  gunting: 'm8 8 12 12M8 16 20 4M14 14l6-10M9 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm0 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
  jam: 'M12 8v5l3 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z',
  panah: 'M4 12h16m-6-6 6 6-6 6', cek: 'm5 12 4 4L19 6',
  kalender: 'M7 2v4m10-4v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14H3V6a2 2 0 0 1 2-2ZM7 14h3m4 0h3m-10 4h3',
  rumah: 'm3 10 9-7 9 7v11h-6v-7H9v7H3Z',
  layanan: 'M4 4h6v6H4Zm10 0h6v6h-6ZM4 14h6v6H4Zm10 0h6v6h-6Z',
  perisai: 'm12 2 9 4v6c0 6-9 10-9 10S3 18 3 12V6Zm-4 9 3 3 5-5',
  tautan: 'm10 13 4-4m-7 6-1 1a4 4 0 0 0 6 6l4-4a4 4 0 0 0 0-6m1-3 1-1a4 4 0 0 0-6-6L8 6a4 4 0 0 0 0 6',
  kartu: 'M2 8h20M4 4h16a2 2 0 0 1 2 2v14H2V6a2 2 0 0 1 2-2Zm2 11h4',
  kembali: 'M20 12H4m6-6-6 6 6 6',
};
export function Ikon({ nama, ukuran = 20 }: { nama: NamaIkon; ukuran?: number }) {
  return <svg width={ukuran} height={ukuran} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={jalur[nama]} /></svg>;
}
