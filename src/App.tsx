import { useEffect, useRef, useState } from 'react';
import { labelDemo, type DrafBooking, type Layanan, type PratinjauBooking } from './domain';
import { layananDemo } from './demo';
import { ambilLayanan } from './layanan/publik';
import { Ikon } from './komponen/Ikon';
import { Katalog, type SumberKatalog } from './komponen/Katalog';
import FormBooking from './komponen/FormBooking';
import Pratinjau from './komponen/Pratinjau';
import BookingTamu from './komponen/BookingTamu';
import {buatGuest,guestAktif} from './layanan/guest';

const bacaRute = () => window.location.hash.slice(1) || '/';
export default function App() {
  const [rute, aturRute] = useState(bacaRute), [demo, aturDemo] = useState(false), [ulangi, aturUlangi] = useState(0);
  const [layanan, aturLayanan] = useState<Layanan[]>([]), [memuat, aturMemuat] = useState(true), [error, aturError] = useState('');
  const [pratinjau, aturPratinjau] = useState<PratinjauBooking | null>(null);
  const [mengirim,aturMengirim]=useState(false),[errorBooking,aturErrorBooking]=useState('');
  const idempotensi=useRef(crypto.randomUUID()),kunciKirim=useRef(false);
  const utama = useRef<HTMLElement>(null);
  useEffect(() => { const ganti = () => aturRute(bacaRute()); window.addEventListener('hashchange', ganti); return () => window.removeEventListener('hashchange', ganti); }, []);
  useEffect(() => {
    const kontrol = new AbortController(); aturError(''); aturLayanan([]);
    if (demo) { aturLayanan(layananDemo); aturMemuat(false); return; }
    aturMemuat(true);
    void ambilLayanan(kontrol.signal).then(data => { if (!kontrol.signal.aborted) aturLayanan(data); })
      .catch(() => { if (!kontrol.signal.aborted) aturError('Layanan publik belum dapat dimuat. Periksa koneksi, coba lagi, atau gunakan layanan demo.'); })
      .finally(() => { if (!kontrol.signal.aborted) aturMemuat(false); });
    return () => kontrol.abort();
  }, [demo, ulangi]);
  const jalur = rute.split('?')[0];
  const diBeranda = jalur === '/' || jalur === '/layanan';
  useEffect(() => {
    document.title = `${diBeranda ? 'Waktunya tampil rapi' : jalur === '/booking' ? 'Rencanakan booking' : 'Pratinjau booking'} | BARBER BARBAR`;
    const timer = window.setTimeout(() => {
      if (jalur === '/layanan') document.getElementById('layanan')?.scrollIntoView({ behavior: 'smooth' });
      else { window.scrollTo({ top: 0 }); utama.current?.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true }); }
    }, 0);
    return () => clearTimeout(timer);
  }, [jalur, diBeranda]);
  const sumber: SumberKatalog = { layanan, memuat, error, demo, gunakanDemo: () => aturDemo(true), gunakanPublik: () => aturDemo(false), perbarui: () => aturUlangi(n => n + 1) };
  const lanjut = async (d: DrafBooking) => {
    if(!guestAktif||demo){aturPratinjau({ ...d, sumber: demo ? 'demo' : 'publik', batasDemo: Date.now() + 15 * 60_000 }); window.location.hash = '/demo/selesai';return;}
    if(kunciKirim.current)return;kunciKirim.current=true;aturMengirim(true);aturErrorBooking('');
    try{const hasil=await buatGuest({nama:d.nama,nomorTelepon:d.telepon,mulaiPada:`${d.tanggal}T${d.jam}:00+07:00`,items:d.pilihan.map(p=>({layananId:p.layanan.id,qty:p.jumlah})),kunciIdempotensi:idempotensi.current});
      if(!/^[0-9a-f]{64}$/.test(hasil.token))throw new Error('Respons booking belum dapat dibaca. Jangan membuat pembayaran ulang.');
      idempotensi.current=crypto.randomUUID();aturPratinjau(null);window.location.hash=`/b/${hasil.token}`;
    }catch(e){aturErrorBooking(e instanceof Error?e.message:'Booking belum dapat dipastikan.');}finally{kunciKirim.current=false;aturMengirim(false);}
  };
  const hapus = () => { aturPratinjau(null); window.location.hash = '/'; };
  const permintaanLayanan = Number(new URLSearchParams(rute.split('?')[1]).get('layanan')) || null;
  const pribadi=/^\/b\/([a-f0-9]{64})(?:\/(detail|pembayaran|invoice))?$/.exec(jalur);
  const nyata=guestAktif&&!demo&&!jalur.startsWith('/demo/');
  return <>
    <a href="#konten" className="skip-link" onClick={e => { e.preventDefault(); utama.current?.focus(); }}>Lewati ke konten</a>
    <div className="pita-demo"><span className="label-lab">{nyata?'SANDBOX':'PREVIEW'}</span><p>{nyata?'Pembayaran Sandbox — tidak ada uang sungguhan yang ditarik.':labelDemo}</p></div>
    <header className="header"><div className="wadah header-dalam"><a className="logo" href="#/" aria-label="BARBER BARBAR — beranda"><img src="/logo.png" alt="BARBER BARBAR" width="255" height="80" /></a><nav className="nav-desktop" aria-label="Navigasi utama"><a aria-current={jalur === '/' ? 'page' : undefined} href="#/">Beranda</a><a aria-current={jalur === '/layanan' ? 'page' : undefined} href="#/layanan">Layanan</a></nav><a href="#/booking" className="tombol utama tombol-header">Booking sekarang <Ikon nama="panah" ukuran={17} /></a></div></header>
    <main id="konten" tabIndex={-1} ref={utama} className="wadah">
      {diBeranda ? <>
        <section className="hero"><div className="teks-hero"><span className="eyebrow"><span className="garis-mini" /> NOT CUTTING HEADS, JUST HAIR.</span><h1 tabIndex={-1}>Gaya baru.<br />Percaya diri <em>yang sama.</em></h1><p>Luangkan waktu untuk tampil lebih rapi.<br className="desktop" /> Pilih layanan dan rencanakan kunjunganmu,<br className="desktop" /> langsung dari genggaman.</p><div className="aksi-hero"><a className="tombol utama" href="#/booking">Booking sekarang <Ikon nama="panah" /></a><a className="tombol sekunder" href="#/layanan">Lihat layanan</a></div><div className="nilai-hero"><span><Ikon nama="cek" ukuran={16} /> Tanpa akun</span><span><Ikon nama="cek" ukuran={16} /> Pilih beberapa layanan</span></div></div>
          <div className="visual-hero" aria-label="Ilustrasi rencana kunjungan"><div className="lingkaran satu" /><div className="lingkaran dua" /><span className="aksen-silang" aria-hidden="true">✳</span><div className="kartu-hero"><div className="kepala-kartu-hero"><span className="ikon-kotak"><Ikon nama="gunting" ukuran={27} /></span><span className="lencana">RENCANA GAYAMU</span></div><span className="eyebrow">SEDIKIT WAKTU UNTUK DIRIMU</span><h2>Fresh cut.<br />Fresh start.</h2><div className="garis-hero" /><div className="fitur-kartu"><span><Ikon nama="layanan" /> Layanan pilihanmu</span><span><Ikon nama="kalender" /> Waktu yang kamu rencanakan</span><span><Ikon nama="kartu" /> Rancangan DP 50%</span></div><span className="catatan-hero">Preview pengalaman booking BARBER BARBAR</span></div><div className="stiker-hero"><span className="stiker-ikon"><Ikon nama="jam" /></span><div>Atur waktumu.<small>Kami rapikan gayamu.</small></div></div></div>
        </section>
        <div className="strip-proses" aria-label="Rancangan proses booking"><div><span>01</span><p>Pilih layanan<small>Sesuai kebutuhanmu</small></p></div><div><span>02</span><p>Atur jadwal<small>Tanggal & jam dalam WIB</small></p></div><div><span>03</span><p>DP & siap datang<small>Setelah verifikasi backend</small></p></div></div>
        <Katalog sumber={sumber} />
        <section className="cta-bawah"><div><span className="eyebrow">LOOK GOOD. FEEL GOOD.</span><h2>Gaya rapi dimulai<br />dari satu rencana.</h2><p>{nyata?'Buat booking tanpa akun. Simpan tautan pribadi dan bayar DP 50%.':'Jelajahi alur booking tanpa membuat pesanan sungguhan.'}</p></div><a className="tombol utama" href="#/booking">{nyata?'Mulai booking':'Coba pratinjau booking'} <Ikon nama="panah" /></a></section>
      </> : pribadi ? <BookingTamu key={pribadi[1]} token={pribadi[1]} halaman={(pribadi[2]??'ringkasan') as 'ringkasan'|'detail'|'pembayaran'|'invoice'}/>
        : jalur === '/booking' ? <FormBooking key={permintaanLayanan} sumber={sumber} awal={pratinjau} layananAwal={permintaanLayanan} lanjut={d=>void lanjut(d)} nyata={nyata} sibuk={mengirim} pesan={errorBooking} />
        : ['/demo/selesai', '/demo/detail/pratinjau-lokal', '/demo/pembayaran'].includes(jalur) && pratinjau ? <Pratinjau key={jalur} data={pratinjau} halaman={jalur === '/demo/selesai' ? 'selesai' : jalur === '/demo/pembayaran' ? 'pembayaran' : 'detail'} hapus={hapus} />
        : <section className="halaman-kosong panel"><span className="ikon-besar"><Ikon nama="perisai" ukuran={30} /></span><h1 tabIndex={-1}>{jalur.startsWith('/demo/') ? 'Pratinjau tidak tersedia.' : jalur.startsWith('/detail') ? 'Akses booking pribadi.' : 'Halaman tidak ditemukan.'}</h1><p>{jalur.startsWith('/demo/') ? 'Data demo hanya ada di memori tab saat rencana dibuat. Tidak ada booking server yang dapat dibuka dari tautan ini.' : jalur.startsWith('/detail') ? 'Diperlukan tautan rahasia yang diterbitkan dan diverifikasi backend. Integrasi guest belum tersedia; tidak ada data booking yang diminta atau ditampilkan.' : 'Kembali ke beranda untuk memilih layanan.'}</p><a href="#/booking" className="tombol utama">Buat rencana baru <Ikon nama="panah" /></a></section>}
    </main>
    <footer className="footer wadah"><div><strong>BARBER BARBAR<span>Not Cutting Heads, Just Hair.</span></strong><p>Rencanakan waktu. Temukan gaya.</p></div><p>React Web • {nyata?'Booking guest Sandbox':'Pratinjau lokal'}<br />{nyata?'Pembayaran diverifikasi backend.':'Booking & pembayaran guest belum tersedia pada demo.'}</p></footer>
    <nav className="nav-mobile" aria-label="Navigasi seluler"><a aria-current={jalur === '/' ? 'page' : undefined} href="#/"><Ikon nama="rumah" />Beranda</a><a aria-current={jalur === '/layanan' ? 'page' : undefined} href="#/layanan"><Ikon nama="layanan" />Layanan</a><a aria-current={!diBeranda ? 'page' : undefined} href="#/booking"><Ikon nama="kalender" />Booking</a></nav>
  </>;
}
