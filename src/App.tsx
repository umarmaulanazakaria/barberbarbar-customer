import { useEffect, useRef, useState } from "react";
import {
  type DrafBooking,
  type Layanan,
} from "./domain";
import { ambilLayanan } from "./layanan/publik";
import { Ikon } from "./komponen/Ikon";
import { Katalog, type SumberKatalog } from "./komponen/Katalog";
import FormBooking from "./komponen/FormBooking";
import BookingTamu from "./komponen/BookingTamu";
import { buatGuest,imporLegacyGuest,kesiapanGuest } from "./layanan/guest";
import LacakBooking from "./komponen/LacakBooking";
import { buatKunciIdempotensi } from "./layanan/idempotensi";
import "./customer-final.css";
const bacaKunciBuat=()=>{try{const k=sessionStorage.getItem("bb-booking-create-pending");return k&&/^[a-f0-9-]{36}$/.test(k)?k:null}catch{return null}};

const legacy=/^#\/b\/([a-f0-9]{64})(?:\/(detail|pembayaran|invoice))?$/.exec(window.location.hash);
if(legacy)window.history.replaceState(null,"",window.location.pathname+window.location.search+"#/kunjungan"+(legacy[2]?"/"+legacy[2]:""));
let imporLegacy:ReturnType<typeof imporLegacyGuest>|undefined;

const bacaRute = () => window.location.hash.slice(1) || "/";
export default function App() {
  const [memulihkan,aturMemulihkan]=useState(Boolean(legacy)),[pesanLegacy,aturPesanLegacy]=useState("");
  useEffect(()=>{if(!legacy)return;imporLegacy??=imporLegacyGuest(legacy[1]);let aktif=true;void imporLegacy.then(()=>{if(aktif)aturMemulihkan(false)}).catch(()=>{if(aktif){aturPesanLegacy("Akses lama belum dapat dipulihkan. Buka kembali akses yang Anda simpan atau hubungi Admin.");aturMemulihkan(false)}});return()=>{aktif=false}},[]);
  const [rute, aturRute] = useState(bacaRute),
    [ulangi, aturUlangi] = useState(0);
  const [bookingSiap,aturBookingSiap]=useState<boolean|null>(null);
  useEffect(()=>{const c=new AbortController();aturBookingSiap(null);void kesiapanGuest(c.signal).then(v=>{if(!c.signal.aborted)aturBookingSiap(v)}).catch(()=>{if(!c.signal.aborted)aturBookingSiap(false)});return()=>c.abort()},[ulangi]);
  const [layanan, aturLayanan] = useState<Layanan[]>([]),
    [memuat, aturMemuat] = useState(true),
    [error, aturError] = useState("");
  const [mengirim, aturMengirim] = useState(false),
    [errorBooking, aturErrorBooking] = useState("");
  const [nomorAwal,aturNomorAwal]=useState("");
  const idempotensi = useRef<string | null>(bacaKunciBuat()),
    kunciKirim = useRef(false);
  const utama = useRef<HTMLElement>(null);
  useEffect(() => {
    const ganti = () => aturRute(bacaRute());
    window.addEventListener("hashchange", ganti);
    return () => window.removeEventListener("hashchange", ganti);
  }, []);
  useEffect(() => {
    const kontrol = new AbortController();
    aturError("");
    aturLayanan([]);
    aturMemuat(true);
    void ambilLayanan(kontrol.signal)
      .then((data) => {
        if (!kontrol.signal.aborted) aturLayanan(data);
      })
      .catch(() => {
        if (!kontrol.signal.aborted)
          aturError(
            "Layanan publik belum dapat dimuat. Periksa koneksi dan coba lagi.",
          );
      })
      .finally(() => {
        if (!kontrol.signal.aborted) aturMemuat(false);
      });
    return () => kontrol.abort();
  }, [ulangi]);
  const jalur = rute.split("?")[0];
  const diBeranda = jalur === "/" || jalur === "/layanan";
  useEffect(() => {
    document.title = `${diBeranda ? "Waktunya tampil rapi" : jalur === "/booking" ? "Rencanakan booking" : "Booking pribadi"} | BARBER BARBAR`;
    const timer = window.setTimeout(() => {
      if (jalur === "/layanan")
        document
          .getElementById("layanan")
          ?.scrollIntoView({ behavior: "smooth" });
      else {
        window.scrollTo({ top: 0 });
        utama.current
          ?.querySelector<HTMLElement>("h1")
          ?.focus({ preventScroll: true });
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [jalur, diBeranda]);
  const sumber: SumberKatalog = {
    layanan,
    memuat,
    error,
    perbarui: () => aturUlangi((n) => n + 1),
  };
  const lanjut = async (d: DrafBooking) => {
    if (kunciKirim.current) return;
    kunciKirim.current = true;
    aturMengirim(true);
    aturErrorBooking("");
    try {
      idempotensi.current ??= buatKunciIdempotensi();
      try{sessionStorage.setItem("bb-booking-create-pending",idempotensi.current)}catch{/* kunci tetap dipertahankan dalam tab */}
      const hasil = await buatGuest({
        ...(d.nomorMember?{nomorMember:d.nomorMember}:{nama:d.nama,nomorTelepon:d.telepon}),
        barberPilihanId:d.barberPilihanId, totalDiharapkan:d.totalDiharapkan,
        mulaiPada: `${d.tanggal}T${d.jam}:00+07:00`,
        items: d.pilihan.map((p) => ({
          layananId: p.layanan.id,
          qty: p.jumlah,
        })),
        kunciIdempotensi: idempotensi.current,
      });
      if (!hasil.booking.nomorBooking)
        throw new Error(
          "Respons booking belum dapat dibaca. Jangan membuat pembayaran ulang.",
        );
      idempotensi.current = null;
      try{sessionStorage.removeItem("bb-booking-create-pending")}catch{/* sesi dibatasi browser */}
      window.location.hash = "/kunjungan";
    } catch (e) {
      aturErrorBooking(
        e instanceof Error ? e.message : "Booking belum dapat dipastikan.",
      );
    } finally {
      kunciKirim.current = false;
      aturMengirim(false);
    }
  };
  const permintaanLayanan =
    Number(new URLSearchParams(rute.split("?")[1]).get("layanan")) || null;
  const pribadi = /^\/kunjungan(?:\/(detail|pembayaran|invoice))?$/.exec(jalur);

  return (
    <>
      <a
        href="#konten"
        className="skip-link"
        onClick={(e) => {
          e.preventDefault();
          utama.current?.focus();
        }}
      >
        Lewati ke konten
      </a>
      <header className="header">
        <div className="wadah header-dalam">
          <a className="logo" href="#/" aria-label="BARBER BARBAR — beranda">
            <img src="/logo.png" alt="BARBER BARBAR" width="255" height="80" />
          </a>
          <nav className="nav-desktop" aria-label="Navigasi utama">
            <a aria-current={jalur === "/" ? "page" : undefined} href="#/">
              Beranda
            </a>
            <a
              aria-current={jalur === "/layanan" ? "page" : undefined}
              href="#/layanan"
            >
              Layanan
            </a>
            <a href="#/lacak" aria-current={jalur==="/lacak"?"page":undefined}>Cek Status</a>
          </nav>
          <a href="#/booking" className="tombol utama tombol-header">
            Booking sekarang <Ikon nama="panah" ukuran={17} />
          </a>
        </div>
      </header>
      <main id="konten" tabIndex={-1} ref={utama} className={`wadah${diBeranda ? " beranda-customer" : ""}`}>
        {diBeranda ? (
          <>
            <section className="hero">
              <div className="teks-hero">
                <span className="eyebrow">
                  <span className="garis-mini" /> NOT CUTTING HEADS, JUST HAIR.
                </span>
                <h1 tabIndex={-1}>
                  Gaya baru.
                  <br />
                  Percaya diri <em>yang sama.</em>
                </h1>
                <p>
                  Luangkan waktu untuk tampil lebih rapi.
                  <br className="desktop" /> Pilih layanan dan rencanakan
                  kunjunganmu,
                  <br className="desktop" /> langsung dari genggaman.
                </p>
                <div className="aksi-hero">
                  <a className="tombol utama" href="#/booking">
                    Mulai Booking <Ikon nama="panah" />
                  </a>
                  <a className="tombol sekunder" href="#/lacak" aria-label="Lacak Booking Anda">
                    Lacak Booking
                  </a>
                </div>
                <div className="nilai-hero">
                  <span>
                    <Ikon nama="cek" ukuran={16} /> Tanpa akun
                  </span>
                  <span>
                    <Ikon nama="cek" ukuran={16} /> Pilih beberapa layanan
                  </span>
                </div>
              </div>
              <div
                className="visual-hero"
                aria-label="Ilustrasi rencana kunjungan"
              >
                <div className="lingkaran satu" />
                <div className="lingkaran dua" />
                <span className="aksen-silang" aria-hidden="true">
                  ✳
                </span>
                <div className="kartu-hero">
                  <div className="kepala-kartu-hero">
                    <span className="ikon-kotak">
                      <Ikon nama="gunting" ukuran={27} />
                    </span>
                    <span className="lencana">RENCANA GAYAMU</span>
                  </div>
                  <span className="eyebrow">SEDIKIT WAKTU UNTUK DIRIMU</span>
                  <h2>
                    Fresh cut.
                    <br />
                    Fresh start.
                  </h2>
                  <div className="garis-hero" />
                  <div className="fitur-kartu">
                    <span>
                      <Ikon nama="layanan" /> Layanan pilihanmu
                    </span>
                    <span>
                      <Ikon nama="kalender" /> Waktu yang kamu rencanakan
                    </span>
                    <span>
                      <Ikon nama="kartu" /> DP 50% Reguler
                    </span>
                  </div>
                  <span className="catatan-hero">
                    Booking mudah, tanpa akun
                  </span>
                </div>
                <div className="stiker-hero">
                  <span className="stiker-ikon">
                    <Ikon nama="jam" />
                  </span>
                  <div>
                    Atur waktumu.<small>Kami rapikan gayamu.</small>
                  </div>
                </div>
              </div>
            </section>
            <div className="strip-proses" aria-label="Proses booking">
              <div>
                <span>01</span>
                <p>
                  Pilih layanan<small>Sesuai kebutuhanmu</small>
                </p>
              </div>
              <div>
                <span>02</span>
                <p>
                  Barber & jadwal<small>Slot 45 menit dalam WIB</small>
                </p>
              </div>
              <div>
                <span>03</span>
                <p>
                  Konfirmasi kunjungan<small>Reguler dengan DP, Member tanpa DP</small>
                </p>
              </div>
            </div>
            <section className="cw-home-member"><div><span className="eyebrow">KEUNTUNGAN MEMBER</span><h2>Sudah punya Nomor Member?</h2><p>Booking cukup Nomor Member. Manfaat sesuai paket aktif dan diverifikasi saat kunjungan.</p></div><form onSubmit={e=>{e.preventDefault();window.location.hash="/booking"}}><label htmlFor="nomor-member-awal">Nomor Member</label><input id="nomor-member-awal" required value={nomorAwal} maxLength={60} autoComplete="off" onChange={e=>aturNomorAwal(e.target.value)} placeholder="Masukkan Nomor Member Anda"/><button className="tombol utama" type="submit">Booking sebagai Member <Ikon nama="panah"/></button></form></section>
            <Katalog sumber={sumber} />
            <section className="cta-bawah">
              <div>
                <span className="eyebrow">LOOK GOOD. FEEL GOOD.</span>
                <h2>
                  Gaya rapi dimulai
                  <br />
                  dari satu rencana.
                </h2>
                <p>
                  Pilih layanan, barber, dan slot. Reguler membayar DP 50%; Member mengikuti manfaat paket aktif.
                </p>
              </div>
              <a className="tombol utama" href="#/booking">
                Mulai booking{" "}
                <Ikon nama="panah" />
              </a>
            </section>
          </>
        ) : jalur === "/lacak" ? <LacakBooking/> : memulihkan ? <section className="panel"><p role="status">Memulihkan akses booking…</p></section> : pesanLegacy ? <section className="panel"><p role="alert">{pesanLegacy}</p><a href="#/lacak">Lacak Booking</a></section> : pribadi ? (
          <BookingTamu
            halaman={
              (pribadi[1] ?? "ringkasan") as
                | "ringkasan"
                | "detail"
                | "pembayaran"
                | "invoice"
            }
          />
        ) : jalur === "/booking" && bookingSiap!==true ? <section className="panel"><h1>Booking Anda</h1><p role={bookingSiap===null?"status":"alert"}>{bookingSiap===null?"Memeriksa kesiapan booking...":"Booking online sedang tidak tersedia. Silakan coba lagi nanti atau hubungi Admin."}</p><button className="tombol utama" onClick={()=>aturUlangi(n=>n+1)}>Periksa kembali</button></section> : jalur === "/booking" ? (
          <FormBooking
            key={permintaanLayanan}
            sumber={sumber}
            awal={null}
            layananAwal={permintaanLayanan}
            lanjut={(d) => void lanjut(d)}
            nomorAwal={nomorAwal}
            sibuk={mengirim}
            pesan={errorBooking}
          />
        ) : (
          <section className="halaman-kosong panel">
            <span className="ikon-besar">
              <Ikon nama="perisai" ukuran={30} />
            </span>
            <h1 tabIndex={-1}>
              Halaman tidak ditemukan.
            </h1>
            <p>
              Gunakan kode tracking untuk membuka booking Anda, atau kembali ke beranda untuk memilih layanan.
            </p>
            <a href="#/booking" className="tombol utama">
              Buat rencana baru <Ikon nama="panah" />
            </a>
          </section>
        )}
      </main>
      <footer className="footer wadah">
        <div>
          <strong>
            BARBER BARBAR<span>Not Cutting Heads, Just Hair.</span>
          </strong>
          <p>Rencanakan waktu. Temukan gaya.</p>
        </div>
        <p>
          Simpan kode tracking untuk melihat booking dan pembayaran Anda.
        </p>
      </footer>
      <nav className="nav-mobile" aria-label="Navigasi seluler">
        <a aria-current={jalur==="/"||jalur==="/layanan"?"page":undefined} href="#/"><Ikon nama="rumah"/>Beranda</a>
        <a aria-current={jalur==="/booking"?"page":undefined} href="#/booking"><Ikon nama="kalender"/>Booking</a>
        <a aria-current={jalur==="/lacak"||Boolean(pribadi)?"page":undefined} href="#/lacak"><Ikon nama="perisai"/>Cek Status</a>
      </nav>
    </>
  );
}
