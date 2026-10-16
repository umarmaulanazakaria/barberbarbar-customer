import { useCallback, useEffect, useRef, useState } from "react";
import { hitungMundur, rupiah } from "../domain";
import {
  checkoutGuest,
  detailGuest,
  invoiceGuest,
  sinkronGuest,
  kodeTrackingGuest,
  KesalahanGuest,
  type DetailTamu,
} from "../layanan/guest";
import { muatSnap } from "../layanan/snap";
import { Ikon } from "./Ikon";
import "../tracking.css";

const labelStatus: Record<string, string> = {
  AWAITING_DP: "Menunggu pembayaran DP",
  CONFIRMED: "Booking dikonfirmasi",
  CHECKED_IN: "Sudah check-in",
  IN_SERVICE: "Sedang dilayani",
  COMPLETED: "Layanan selesai",
  CANCELLED: "Booking dibatalkan",
  NO_SHOW: "Tidak hadir",
  REJECTED: "Booking ditolak",
  PAID: "Lunas",
  DP_PAID: "DP terverifikasi",
  AWAITING_DP_PAYMENT: "Menunggu pembayaran",
  PARTIALLY_PAID: "Dibayar sebagian",
  UNPAID: "Belum dibayar",
  OVERDUE: "Pelunasan terlewati",
  REFUND_REVIEW: "Dalam peninjauan pengembalian dana",
  DP_FORFEITED: "DP hangus sesuai ketentuan",
};
const tanggal = (iso: string) =>
  new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(iso)) + " WIB";
export default function BookingTamu({
  halaman,
}: {
  halaman: "ringkasan" | "detail" | "pembayaran" | "invoice";
}) {
  const [kode,aturKode]=useState<string|null>(null);
  const [data, aturData] = useState<DetailTamu | null>(null),
    [error, aturError] = useState(""),
    [pesan, aturPesan] = useState("");
  const [sekarang, aturSekarang] = useState(Date.now),
    [sibuk, aturSibuk] = useState(false);
  const [invoiceDisahkan, aturInvoiceDisahkan] = useState(false);
  const urutan = useRef(0),
    kunci = useRef(false),
    offset = useRef(0),
    terakhirSync = useRef(0),
    terpasang = useRef(true);
  const simpan = useCallback((hasil: DetailTamu) => {
    offset.current = Date.parse(hasil.serverTime) - Date.now();
    aturData(hasil);
    aturSekarang(Date.now() + offset.current);
  }, []);
  const muat = useCallback(
    async (sinkron = false) => {
      const nomor = ++urutan.current;
      try {
        const hasil = await (sinkron
          ? sinkronGuest()
          : detailGuest());
        if (nomor !== urutan.current || !terpasang.current) return;
        simpan(hasil);
        aturError("");
        return hasil;
      } catch (e) {
        if(e instanceof KesalahanGuest && e.status===404){aturData(null);aturKode(null);}
        if (nomor === urutan.current && terpasang.current)
          aturError(
            e instanceof Error ? e.message : "Status belum dapat dimuat.",
          );
        return undefined;
      }
    },
    [simpan],
  );
  useEffect(() => {
    terpasang.current = true;
    void muat();
    const jam = window.setInterval(
      () => aturSekarang(Date.now() + offset.current),
      1000,
    );
    const polling = window.setInterval(() => {
      if (document.visibilityState === "visible")
        void muat().then((hasil) => {
          if (
            hasil?.ringkasan.transaksi.some((t) => t.status === "PENDING") &&
            Date.now() - terakhirSync.current > 30000
          ) {
            terakhirSync.current = Date.now();
            void muat(true);
          }
        });
    }, 10000);
    const fokus = () => {
      if (document.visibilityState === "visible") void muat();
    };
    document.addEventListener("visibilitychange", fokus);
    window.addEventListener("online", fokus);
    return () => {
      terpasang.current = false;
      urutan.current++;
      clearInterval(jam);
      clearInterval(polling);
      document.removeEventListener("visibilitychange", fokus);
      window.removeEventListener("online", fokus);
    };
  }, [muat, halaman]);
  useEffect(() => {
    if (halaman !== "invoice") return;
    let aktif = true;
    aturInvoiceDisahkan(false);
    void invoiceGuest()
      .then((hasil) => {
        if (aktif) {
          simpan(hasil);
          aturInvoiceDisahkan(true);
          aturError("");
        }
      })
      .catch((e) => {
        if (aktif)
          aturError(
            e instanceof Error
              ? e.message
              : "Invoice final belum dapat dimuat.",
          );
      });
    return () => {
      aktif = false;
    };
  }, [halaman, simpan]);
  const bukaSnap = async () => {
    if (kunci.current || !data) return;
    kunci.current = true;
    aturSibuk(true);
    aturError("");
    try {
      const checkout = await checkoutGuest(
        data.booking.status === "COMPLETED" ? "PELUNASAN" : "DP",
        crypto.randomUUID(),
      );
      if (checkout.isProduction !== false || !checkout.token)
        throw new Error("Checkout Sandbox belum tersedia.");
      await muatSnap(checkout.clientKey);
      if (!terpasang.current) return;
      const periksa = () => {
        aturPesan(
          "Memeriksa pembayaran Anda. Status akan diperbarui setelah pembayaran terverifikasi.",
        );
        void muat(true);
      };
      window.snap!.pay(checkout.token, {
        language: "id",
        onSuccess: periksa,
        onPending: periksa,
        onError: () => {
          aturPesan(
            "Checkout mengalami kendala. Periksa status sebelum mengulang pembayaran.",
          );
          void muat(true);
        },
        onClose: () => {
          aturPesan(
            "Pembayaran ditutup. Periksa status sebelum mencoba membayar kembali.",
          );
          void muat(true);
        },
      });
      await muat();
    } catch (e) {
      if (terpasang.current)
        aturError(
          e instanceof Error ? e.message : "Checkout belum dapat dibuka.",
        );
    } finally {
      kunci.current = false;
      if (terpasang.current) aturSibuk(false);
    }
  };
  useEffect(()=>{if(!data?.ringkasan.dpTerverifikasi||kode)return;let aktif=true;void kodeTrackingGuest().then(r=>{if(aktif)aturKode(r.kode)}).catch(()=>{if(aktif)aturPesan("Kode belum dapat dimuat. Perbarui status atau hubungi Admin.")});return()=>{aktif=false}},[data?.ringkasan.dpTerverifikasi,data?.booking.status,kode]);
  const salin=async()=>{if(!kode)return;try{await navigator.clipboard.writeText(kode);aturPesan("Kode tracking disalin. Simpan dan jangan bagikan kepada orang lain.")}catch{aturPesan("Pilih kode di atas untuk menyalinnya secara manual.")}};
  if (!data)
    return (
      <section className="halaman-kosong panel">
        <span className="ikon-besar">
          <Ikon nama="perisai" ukuran={30} />
        </span>
        <h1 tabIndex={-1}>Booking Anda</h1>
        <p role={error ? "alert" : "status"}>
          {error || "Memuat booking pada browser ini..."}
        </p>
        <button className="tombol utama" onClick={() => void muat()}>
          Perbarui status
        </button>
        <a className="tombol sekunder" href="#/lacak">Lacak Booking</a>
      </section>
    );
  const b = data.booking,
    u = data.ringkasan,
    batas = Date.parse(b.deadlineDp),
    habis = sekarang >= batas;
  const dapatDp = b.status === "AWAITING_DP" && !habis && !u.dpTerverifikasi;
  const dapatLunas =
    b.status === "COMPLETED" && u.dpTerverifikasi && u.balance > 0;
  const final =
    b.status === "COMPLETED" && u.statusPembayaran === "PAID" && !!u.invoice;

  return (
    <div className="halaman-pratinjau">
      <div className="judul-halaman pusat">
        <span className="ikon-besar">
          <Ikon nama={u.dpTerverifikasi ? "cek" : "kalender"} ukuran={28} />
        </span>
        <span className="eyebrow">BOOKING ANDA</span>
        <h1 tabIndex={-1}>
          {halaman === "invoice"
            ? "Invoice booking"
            : halaman === "pembayaran"
              ? "Pembayaran booking"
              : halaman === "detail"
                ? "Detail booking"
                : kode && b.status === "CONFIRMED" ? "Pembayaran DP berhasil" : "Booking Anda"}
        </h1>
        <p>
          Nomor booking{" "}
          <strong data-testid="nomor-booking">{b.nomorBooking}</strong>
        </p>
        <p>{labelStatus[b.status] ?? "Status diperbarui"}</p>
      </div>
      <nav className="tab-pratinjau" aria-label="Halaman booking">
        <a
          href={"#/kunjungan"}
          aria-current={halaman === "ringkasan" ? "page" : undefined}
        >
          Ringkasan
        </a>
        <a
          href={"#/kunjungan/detail"}
          aria-current={halaman === "detail" ? "page" : undefined}
        >
          Detail
        </a>
        <a
          href={"#/kunjungan/pembayaran"}
          aria-current={halaman === "pembayaran" ? "page" : undefined}
        >
          Pembayaran
        </a>
      </nav>
      {error && (
        <p className="pesan error" role="alert">
          {error}
        </p>
      )}
      {pesan && (
        <p className="pesan" role="status">
          {pesan}
        </p>
      )}
      <div className="grid-pratinjau">
        <div>
          <section className="panel">
            <div className="judul-panel">
              <span className="ikon-kotak">
                <Ikon nama="kalender" />
              </span>
              <div>
                <h2>Rincian kunjungan</h2>
                <p>Jadwal, layanan, dan pembayaran kunjungan Anda.</p>
              </div>
            </div>
            <dl className="detail-data">
              <div>
                <dt>Status booking</dt>
                <dd data-testid="status-booking">
                  {labelStatus[b.status] ?? b.status}
                </dd>
              </div>
              <div>
                <dt>Nama</dt>
                <dd>{b.aksesTamu.nama}</dd>
              </div>
              <div>
                <dt>Nomor HP</dt>
                <dd>{b.aksesTamu.nomorTelepon}</dd>
              </div>
              <div>
                <dt>Jadwal</dt>
                <dd>{tanggal(b.mulaiPada)}</dd>
              </div>
              <div><dt>Barber</dt><dd>{b.barber ?? "Belum ditentukan"}</dd></div>
              <div>
                <dt>Durasi</dt>
                <dd>{b.durasiMenit} menit</dd>
              </div>
              <div>
                <dt>Status DP</dt>
                <dd data-testid="dp-sah">
                  {u.dpTerverifikasi ? "Terverifikasi" : "Belum terverifikasi"}
                </dd>
              </div>
            </dl>
            <h3 className="subjudul">Layanan</h3>
            {b.items.map((i) => (
              <div className="baris-ringkas garis" key={i.layananId}>
                <span>
                  {i.namaLayanan}
                  <small>
                    {i.qty} × {rupiah(i.harga)}
                  </small>
                </span>
                <strong>{rupiah(i.subtotal)}</strong>
              </div>
            ))}
          </section>
          <section className="panel" aria-labelledby="judul-riwayat-pembayaran">
            <h2 id="judul-riwayat-pembayaran">Riwayat pembayaran</h2>
            {u.transaksi.length ? u.transaksi.map(t => (
              <div className="baris-ringkas garis" key={t.id}>
                <span>{t.tujuan === "DP" ? "Uang muka" : t.tujuan === "PELUNASAN" ? "Pelunasan" : "Pengembalian dana"}<small>{({PENDING:"Menunggu pembayaran",SUCCEEDED:"Berhasil",FAILED:"Gagal",EXPIRED:"Kedaluwarsa"} as Record<string,string>)[t.status] ?? "Sedang diperiksa"}</small></span>
                <strong>{rupiah(t.nominal)}</strong>
              </div>
            )) : <p>Belum ada transaksi pembayaran.</p>}
          </section>
          {kode && <section className="panel"><h2>Kode Tracking Booking Anda</h2>{b.status==="CONFIRMED"&&<p>Booking Anda telah dikonfirmasi.</p>}<div className="kode-tracking" data-testid="kode-tracking">{kode}</div><p>Simpan kode ini untuk memantau booking Anda.</p><div className="tracking-aksi"><button className="tombol utama" onClick={()=>void salin()}>Salin Kode</button><a className="tombol sekunder" href="#/kunjungan/detail">Lihat Detail Booking</a></div></section>}
          <section className="panel"><h2>Proses booking</h2><ol className="tahapan-tracking">{[
            ["DP Terverifikasi",u.dpTerverifikasi],["Booking Dikonfirmasi",!!b.dikonfirmasiPada],["Check-in",!!b.checkInPada],["Sedang Dilayani",!!b.layananMulaiPada],["Layanan Selesai",!!b.layananSelesaiPada],["Pelunasan",u.statusPembayaran==="PAID"],["Selesai",final],
          ].map(([label,selesai])=><li key={String(label)} data-selesai={Boolean(selesai)}>{label}</li>)}</ol></section>
          {halaman === "pembayaran" && (
            <section className="panel">
              <h2>Midtrans Sandbox</h2>
              <p className="catatan">
                Selesaikan pembayaran, lalu periksa statusnya di halaman ini.
                Booking dikonfirmasi setelah pembayaran terverifikasi.
              </p>
              {(dapatDp || dapatLunas) && (
                <button
                  className="tombol utama lebar"
                  disabled={sibuk || !!error}
                  onClick={() => void bukaSnap()}
                >
                  {sibuk
                    ? "Menyiapkan checkout…"
                    : dapatDp
                      ? "Bayar DP 50% dengan Snap"
                      : "Bayar sisa pelunasan dengan Snap"}
                </button>
              )}
              <button
                className="tombol sekunder lebar"
                disabled={sibuk}
                onClick={() => void muat(true)}
              >
                Periksa pembayaran
              </button>
              <p className="bantuan">
                Pembayaran ini menggunakan Sandbox, tanpa uang sungguhan.
                Nominal pembayaran sesuai tagihan booking Anda.
              </p>
              {b.status === "CANCELLED" && (
                <p className="pesan">
                  Booking ini tidak mengambil slot kembali. Pembayaran terlambat
                  diverifikasi untuk peninjauan pengembalian dana oleh ADMIN.
                </p>
              )}
            </section>
          )}
          {halaman === "invoice" && (
            <section className="panel invoice-final">
              <h2>Invoice final</h2>
              {final && invoiceDisahkan ? (
                <>
                  <p data-testid="nomor-invoice">{u.invoice!.nomorInvoice}</p>
                  <dl className="detail-data">
                    <div>
                      <dt>Tanggal</dt>
                      <dd>{tanggal(u.invoice!.dibuatPada)}</dd>
                    </div>
                    <div>
                      <dt>Total</dt>
                      <dd>{rupiah(u.invoice!.total)}</dd>
                    </div>
                    <div>
                      <dt>Status</dt>
                      <dd>Lunas</dd>
                    </div>
                  </dl>
                </>
              ) : (
                <p>
                  Invoice final belum tersedia. Layanan harus selesai dan
                  seluruh tagihan harus sudah terbayar.
                </p>
              )}
            </section>
          )}
        </div>
        <aside>
          <section className="panel ringkasan">
            <span className="eyebrow">TAGIHAN KUNJUNGAN</span>
            <h2>{labelStatus[u.statusPembayaran] ?? u.statusPembayaran}</h2>
            <dl className="nilai-ringkas">
              <div>
                <dt>Total layanan</dt>
                <dd>{rupiah(u.total)}</dd>
              </div>
              <div>
                <dt>DP 50%</dt>
                <dd>{rupiah(u.nominalDpAwal)}</dd>
              </div>
              <div>
                <dt>Sudah dibayar</dt>
                <dd>{rupiah(u.jumlahDibayar)}</dd>
              </div>
              <div>
                <dt>Sisa tagihan</dt>
                <dd data-testid="balance">{rupiah(u.balance)}</dd>
              </div>
            </dl>
            {b.status === "AWAITING_DP" && (
              <div className={`countdown ${habis ? "habis" : ""}`}>
                <span>
                  <Ikon nama="jam" /> Batas DP dari waktu server
                </span>
                <strong data-testid="countdown-aktual">
                  {hitungMundur(batas, sekarang)}
                </strong>
                <p>
                  {habis
                    ? "Batas pembayaran terlewati. Perbarui status; jangan lanjutkan checkout."
                    : tanggal(b.deadlineDp)}
                </p>
              </div>
            )}
            {b.deadlinePelunasan &&
              b.status === "COMPLETED" &&
              u.balance > 0 && (
                <p className="catatan">
                  Batas pelunasan: {tanggal(b.deadlinePelunasan)}
                </p>
              )}
            {halaman !== "pembayaran" && (dapatDp || dapatLunas) && (
              <a
                className="tombol utama lebar"
                href={"#/kunjungan/pembayaran"}
              >
                Lanjut ke pembayaran <Ikon nama="panah" />
              </a>
            )}
            {final && (
              <a
                className="tombol sekunder lebar"
                href={"#/kunjungan/invoice"}
              >
                Lihat invoice final
              </a>
            )}
            <button
              className="tombol-teks"
              disabled={sibuk}
              onClick={() => void muat()}
            >
              Perbarui status booking
            </button>
            <p className="catatan-privasi">
              Akses browser ini terbatas waktunya. Simpan kode tracking setelah DP terverifikasi. Jika akses hilang, hubungi Admin untuk verifikasi identitas.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
