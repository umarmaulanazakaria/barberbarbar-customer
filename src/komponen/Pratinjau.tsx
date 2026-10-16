import { useEffect, useState } from 'react';
import { estimasi, hitungMundur, rupiah, waktuWib, type PratinjauBooking } from '../domain';
import type { CallbackSnap } from '../layanan/kontrak';
import { Ikon } from './Ikon';

export default function Pratinjau({ data, halaman, hapus }: { data: PratinjauBooking; halaman: 'selesai' | 'detail' | 'pembayaran'; hapus: () => void }) {
  const [sekarang, aturSekarang] = useState(Date.now), [callback, aturCallback] = useState<CallbackSnap | null>(null), [salin, aturSalin] = useState('');
  useEffect(() => { const timer = window.setInterval(() => aturSekarang(Date.now()), 1000); return () => clearInterval(timer); }, []);
  const ringkas = estimasi(data.pilihan), habis = sekarang >= data.batasDemo;
  const tautan = new URL('#/demo/detail/pratinjau-lokal', window.location.href).href;
  const salinTautan = async () => {
    try { await navigator.clipboard.writeText(tautan); aturSalin('Tautan demo disalin. Hanya dapat dilihat pada sesi tab ini.'); }
    catch { aturSalin('Penyalinan tidak tersedia. Pilih dan salin tautan di bawah secara manual.'); }
  };
  return <div className="halaman-pratinjau">
    <a href="#/booking" className="kembali"><Ikon nama="kembali" ukuran={16} /> Ubah rencana</a>
    <div className="judul-halaman pusat"><span className="ikon-besar"><Ikon nama={halaman === 'pembayaran' ? 'kartu' : 'kalender'} ukuran={28} /></span>
      <span className="eyebrow">PRATINJAU LOKAL</span><h1 tabIndex={-1}>{halaman === 'selesai' ? 'Begini rencana kunjunganmu.' : halaman === 'detail' ? 'Detail rencana booking.' : 'Pratinjau pembayaran.'}</h1>
      <p>Belum ada booking yang tersimpan atau pembayaran yang dibuat.</p>
    </div>
    <nav className="tab-pratinjau" aria-label="Halaman pratinjau"><a aria-current={halaman === 'selesai' ? 'page' : undefined} href="#/demo/selesai">Ringkasan</a><a aria-current={halaman === 'detail' ? 'page' : undefined} href="#/demo/detail/pratinjau-lokal">Detail</a><a aria-current={halaman === 'pembayaran' ? 'page' : undefined} href="#/demo/pembayaran">Pembayaran</a></nav>
    <div className="grid-pratinjau"><div>
      <section className="panel"><div className="judul-panel"><span className="ikon-kotak"><Ikon nama="kalender" /></span><div><h2>Rencana layanan</h2><p>{data.sumber === 'demo' ? 'Menggunakan layanan contoh' : 'Menggunakan katalog publik'}</p></div></div>
        <dl className="detail-data"><div><dt>Nomor booking</dt><dd>Belum diterbitkan</dd></div><div><dt>Status booking</dt><dd><span className="lencana">Pratinjau • tidak tersimpan</span></dd></div><div><dt>Nama</dt><dd>{data.nama}</dd></div><div><dt>Nomor HP</dt><dd>{data.telepon}</dd></div><div><dt>Jadwal layanan</dt><dd>{waktuWib(data.tanggal, data.jam)}</dd></div><div><dt>Estimasi durasi</dt><dd>{ringkas.durasi} menit</dd></div></dl>
        <h3 className="subjudul">Pilihan layanan</h3>{data.pilihan.map(p => <div className="baris-ringkas garis" key={p.layanan.id}><span>{p.layanan.nama}<small>{p.jumlah} × {rupiah(p.layanan.harga)}</small></span><strong>{rupiah(p.jumlah * p.layanan.harga)}</strong></div>)}
      </section>
      {halaman === 'selesai' && <section className="panel tautan-demo"><h2><Ikon nama="tautan" /> Rancangan link pribadi</h2><p>Pada integrasi final, link rahasia hanya diterbitkan backend. Link berikut merupakan navigasi demo, bukan bukti booking dan tidak berlaku di tab lain.</p><label htmlFor="tautan-demo">Tautan demo sesi ini</label><input id="tautan-demo" readOnly value={tautan} onFocus={e => e.target.select()} /><button className="tombol sekunder" onClick={() => void salinTautan()}>Salin tautan demo</button><p role="status" className="bantuan">{salin}</p></section>}
      {halaman === 'detail' && <section className="panel"><h2>Status DP dan invoice</h2><dl className="detail-data"><div><dt>DP terverifikasi</dt><dd>Belum terverifikasi</dd></div><div><dt>Pelunasan</dt><dd>Belum ada tagihan backend</dd></div><div><dt>Invoice</dt><dd>Belum tersedia</dd></div></dl><p className="catatan">Invoice final hanya tersedia setelah backend menyatakan pembayaran lunas. Tidak ada invoice simulasi yang diterbitkan.</p></section>}
      {halaman === 'pembayaran' && <section className="panel"><div className="judul-panel"><span className="ikon-kotak"><Ikon nama="kartu" /></span><div><h2>Midtrans Snap Web</h2><p>Rancangan tampilan checkout, belum aktif.</p></div></div>
        <div className="checkout-placeholder"><Ikon nama="perisai" ukuran={32} /><h3>Belum ada transaksi</h3><p>Checkout akan dibuka setelah booking dan token pembayaran diterbitkan backend.</p><button className="tombol utama" disabled>Buka Snap — belum tersedia</button></div>
        <fieldset className="skenario"><legend>Pratinjau respons antarmuka</legend><p>Kontrol berikut hanya mengganti tampilan. Tidak memanggil Midtrans.</p><div className="opsi-skenario">{(['pending', 'success', 'failure'] as const).map(s => <button type="button" aria-pressed={callback === s} className="tombol sekunder" key={s} onClick={() => aturCallback(s)}>Demo {s === 'pending' ? 'pending' : s === 'success' ? 'callback sukses' : 'gagal'}</button>)}</div></fieldset>
        <div role="status" className={`pesan ${callback === 'failure' ? 'error' : ''}`} data-testid="status-pembayaran">{callback === 'pending' ? 'Demo: pembayaran masih pending. DP tetap belum terverifikasi.' : callback === 'success' ? 'Demo: callback sukses diterima. Tetap menunggu verifikasi backend; DP belum terverifikasi dan booking belum dikonfirmasi.' : callback === 'failure' ? 'Demo: pembayaran gagal atau checkout ditutup. Tidak ada transaksi yang dibuat; coba skenario lain untuk melihat penanganan tampilannya.' : 'Belum ada respons pembayaran. Pilih skenario demo untuk melihat tampilan status.'}</div>
      </section>}
    </div><aside><section className="panel ringkasan"><span className="eyebrow">ESTIMASI PEMBAYARAN</span><h2>Uang muka 50%</h2><p className="angka-dp">{rupiah(ringkas.dp)}</p><p className="bantuan">Bukan tagihan. Seluruh nominal masih estimasi.</p>
      <dl className="nilai-ringkas"><div><dt>Estimasi total</dt><dd>{rupiah(ringkas.total)}</dd></div><div><dt>Estimasi setelah DP</dt><dd>{rupiah(ringkas.total - ringkas.dp)}</dd></div><div><dt>Status DP</dt><dd>Belum terverifikasi</dd></div></dl>
      <div className={`countdown ${habis ? 'habis' : ''}`}><span><Ikon nama="jam" /> Countdown demo 15 menit</span><strong data-testid="countdown">{hitungMundur(data.batasDemo, sekarang)}</strong><p>{habis ? 'Countdown demo berakhir. Ini tidak membatalkan atau mengubah booking server.' : 'Jam perangkat untuk pratinjau; deadline final nantinya ditetapkan backend.'}</p></div>
      {halaman !== 'pembayaran' && <a className="tombol utama lebar" href="#/demo/pembayaran">Lihat demo pembayaran <Ikon nama="panah" /></a>}
      <p className="catatan-privasi">Pada alur final, booking baru CONFIRMED setelah pembayaran diverifikasi backend. Tidak ada persetujuan admin dalam rancangan guest ini.</p>
    </section><button className="tombol-teks hapus-demo" onClick={hapus}>Hapus data pratinjau dari tab ini</button></aside></div>
  </div>;
}
