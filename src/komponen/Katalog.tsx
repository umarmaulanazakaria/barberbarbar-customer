import type { Layanan } from '../domain';
import { rupiah } from '../domain';
import { Ikon } from './Ikon';

export type SumberKatalog = {
  layanan: Layanan[]; memuat: boolean; error: string; demo: boolean;
  gunakanDemo: () => void; gunakanPublik: () => void; perbarui: () => void;
};
export function StatusKatalog({ sumber: s }: { sumber: SumberKatalog }) {
  return <div className="status-katalog">
    <p><span className={`titik ${s.demo ? 'kuning' : ''}`} />{s.demo ? 'Layanan contoh • bukan daftar layanan aktual' : 'Layanan publik • dari backend existing'}</p>
    {s.demo ? <button className="tombol-teks" onClick={s.gunakanPublik}>Gunakan data publik</button>
      : <button className="tombol-teks" onClick={s.gunakanDemo}>Gunakan layanan demo</button>}
    {s.memuat && <p role="status">Memuat layanan…</p>}
    {s.error && <div className="pesan error" role="alert"><p>{s.error}</p><button className="tombol-teks" onClick={s.perbarui}>Coba muat layanan lagi</button></div>}
    {!s.memuat && !s.error && !s.layanan.length && <p className="pesan">Belum ada layanan aktif yang tersedia. Anda dapat melihat layanan demo.</p>}
  </div>;
}
export function Katalog({ sumber }: { sumber: SumberKatalog }) {
  return <section className="bagian" id="layanan" aria-labelledby="judul-layanan">
    <div className="kepala-bagian"><div><span className="eyebrow">PILIH GAYAMU</span><h2 id="judul-layanan">Layanan untuk versi<br className="desktop" /> terbaik dirimu.</h2></div><p>Mulai dari potongan baru hingga sentuhan akhir.<br />Pilih satu atau beberapa layanan sesuai kebutuhan.</p></div>
    <StatusKatalog sumber={sumber} />
    <div className="grid-layanan">{sumber.layanan.map((l, i) => <article className="kartu-layanan" key={l.id}>
      <div className="atas-layanan"><span className="ikon-kotak"><Ikon nama="gunting" ukuran={24} /></span><span className="nomor-layanan">{String(i + 1).padStart(2, '0')}</span></div>
      <h3>{l.nama}</h3><p className="durasi"><Ikon nama="jam" ukuran={15} /> {l.durasiMenit} menit</p>
      <div className="bawah-layanan"><strong>{rupiah(l.harga)}</strong><a href={`#/booking?layanan=${l.id}`} aria-label={`Pilih ${l.nama}`} className="tombol-ikon"><Ikon nama="panah" /></a></div>
    </article>)}</div>
  </section>;
}
