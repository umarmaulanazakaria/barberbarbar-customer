import { useEffect, useRef } from "react";
import type { DetailTamu } from "../layanan/guest";
import { hitungMundur, rupiah } from "../domain";
import { Ikon } from "./Ikon";
import "../pembayaran-ux.css";

export function bookingDikonfirmasi(data: DetailTamu | null) {
  if(!data)return false;
  return Boolean((data.ringkasan.dpTerverifikasi || data.ringkasan.bebasDp) && (data.booking.dikonfirmasiPada || ["CONFIRMED", "CHECKED_IN", "IN_SERVICE", "COMPLETED"].includes(data.booking.status)));
}
const waktu = (iso: string) => new Intl.DateTimeFormat("id-ID", {
  timeZone: "Asia/Jakarta", dateStyle: "long", timeStyle: "short",
}).format(new Date(iso)) + " WIB";

export default function RingkasanPembayaran({ data, halaman, sekarang, sibuk, error, pesan, kode, labelStatus, bayar, perbarui, salin }: {
  data: DetailTamu; halaman: "ringkasan" | "pembayaran"; sekarang: number;
  sibuk: boolean; error: string; pesan: string; kode: string | null;
  labelStatus: Record<string, string>; bayar: () => Promise<void>;
  perbarui: (sinkron?: boolean) => Promise<unknown>; salin: () => Promise<void>;
}) {
  const b = data.booking, u = data.ringkasan;
  const batas = Date.parse(b.deadlineDp??""), valid = Number.isFinite(batas);
  const habis = valid && sekarang >= batas, hampir = valid && !habis && batas - sekarang <= 120000;
  const terkonfirmasi = bookingDikonfirmasi(data);
  const terminal = ["CANCELLED", "REJECTED", "NO_SHOW"].includes(b.status);
  const hangus = u.statusPembayaran === "DP_FORFEITED";
  const tinjauan = u.statusPembayaran === "REFUND_REVIEW" || (terminal && u.jumlahDibayar > 0 && !hangus);
  const transaksi = [...u.transaksi].reverse().find(t => t.tujuan === (b.status === "COMPLETED" ? "PELUNASAN" : "DP"));
  const dapatDp = b.status === "AWAITING_DP" && valid && !habis && !u.dpTerverifikasi;
  const dapatLunas = b.status === "COMPLETED" && (u.dpTerverifikasi || u.syaratDpTerpenuhi) && u.balance > 0 && !tinjauan;
  const final = b.status === "COMPLETED" && u.statusPembayaran === "PAID" && !!u.invoice;
  const sudahSinkron = useRef("");
  useEffect(() => {
    const kunci = b.nomorBooking + ":" + b.deadlineDp;
    if (b.status === "AWAITING_DP" && habis && sudahSinkron.current !== kunci) {
      sudahSinkron.current = kunci;
      void perbarui(true);
    }
  }, [b.nomorBooking, b.deadlineDp, b.status, habis, perbarui]);

  let judul = "Menunggu pembayaran DP", penjelasan = "Bayar DP sebelum batas waktu. Booking dikonfirmasi setelah pembayaran terverifikasi.", nada = "info";
  if (tinjauan) { judul = "Pembayaran membutuhkan penanganan"; penjelasan = "Status pembayaran sedang ditinjau. Hubungi Admin untuk memeriksa tindak lanjut pembayaran sebelum mencoba membayar lagi."; nada = "peringatan"; }
  else if (hangus) { judul = "DP mengikuti ketentuan booking"; penjelasan = "DP tercatat hangus sesuai ketentuan booking. Hubungi Admin jika memerlukan penjelasan."; nada = "peringatan"; }
  else if (terminal) { judul = labelStatus[b.status] ?? "Booking tidak aktif"; penjelasan = "Booking ini tidak dapat dilanjutkan ke pembayaran. Periksa status atau hubungi Admin."; nada = "peringatan"; }
  else if (final) { judul = u.bebasDp && u.total===0 ? "Pelayanan Membership selesai" : "Pembayaran lunas"; penjelasan = u.bebasDp && u.total===0 ? "Layanan gratis tercatat sebagai penggunaan Membership. Invoice Rp0 tersedia tanpa transaksi pembayaran." : "Seluruh tagihan sudah dibayar. Invoice final sudah tersedia."; nada = "berhasil"; }
  else if(u.bebasDp && terkonfirmasi){judul=b.status==="COMPLETED"?"Layanan selesai":"Booking Member dikonfirmasi";penjelasan=dapatLunas?"Lunasi layanan tambahan untuk memperoleh invoice final.":"Membership bebas DP. Simpan kode tracking dan tunjukkan identitas member saat check-in.";nada="berhasil";}
  else if (terkonfirmasi) { judul = b.status === "COMPLETED" ? "Layanan selesai" : "Pembayaran DP berhasil"; penjelasan = dapatLunas ? "Lunasi sisa tagihan booking Anda untuk mendapatkan invoice final." : "DP sudah terverifikasi. Simpan kode tracking dan lihat detail booking Anda."; nada = "berhasil"; }
  else if (b.status === "AWAITING_DP" && (!valid || habis)) { judul = "Memeriksa batas pembayaran"; penjelasan = "Batas waktu berakhir atau belum dapat dipastikan. Pembayaran belum dapat dilanjutkan. Periksa status booking Anda."; nada = "peringatan"; }
  else if (transaksi?.status === "FAILED") { judul = "Pembayaran gagal"; penjelasan = "Transaksi sebelumnya gagal. Periksa status sebelum mencoba lagi selama booking masih mengizinkan pembayaran."; nada = "peringatan"; }
  else if (transaksi?.status === "EXPIRED") { judul = "Transaksi pembayaran kedaluwarsa"; penjelasan = "Transaksi sebelumnya tidak berlaku. Pembayaran ulang hanya tersedia bila status booking dan batas waktunya masih mengizinkan."; nada = "peringatan"; }
  else if (u.dpTerverifikasi || /Memeriksa|ditutup|kendala/i.test(pesan) || transaksi?.status === "SUCCEEDED") { judul = "Sedang memeriksa pembayaran"; penjelasan = "Pembayaran sedang diperiksa. Status booking akan diperbarui setelah pembayaran terverifikasi."; }

  return <div className={`halaman-pembayaran-ux mode-${halaman}`}>
    <header className="judul-pembayaran">
      <span className="eyebrow">BOOKING ANDA</span>
      <h1 tabIndex={-1}>{judul}</h1>
      <p>Nomor booking <strong data-testid="nomor-booking">{b.nomorBooking}</strong></p>
      <span className="status-booking-ux" data-testid="status-booking">{labelStatus[b.status] ?? "Status diperbarui"}</span>
    </header>
    <nav className="tab-pembayaran" aria-label="Halaman booking">
      <a href="#/kunjungan" aria-current={halaman === "ringkasan" ? "page" : undefined}>Ringkasan</a>
      <a href="#/kunjungan/detail">Detail</a>
      <a href="#/kunjungan/pembayaran" aria-current={halaman === "pembayaran" ? "page" : undefined}>Pembayaran</a>
    </nav>
    <p className={`status-pembayaran-ux ${nada}`} role="status">{penjelasan}</p>
    {error && <p className="pesan error" role="alert">{error}</p>}
    {pesan && !terkonfirmasi && <p className="pesan" role="status">{pesan}</p>}
    <div className="grid-pembayaran-ux">
      <section className="panel kunjungan-ux">
        <h2><Ikon nama="kalender" ukuran={21}/> Kunjungan Anda</h2>
        <p className="jadwal-ux">{waktu(b.mulaiPada)}</p>
        <p className="teks-sekunder">{b.durasiMenit} menit · {b.aksesTamu.nama}</p>
        <dl className="detail-kunjungan-ux"><div><dt>Nomor HP</dt><dd>{b.aksesTamu.nomorTelepon}</dd></div><div><dt>Status DP</dt><dd data-testid="dp-sah">{u.bebasDp ? "Bebas DP (Membership)" : u.dpTerverifikasi ? "Terverifikasi" : "Belum terverifikasi"}</dd></div></dl>
        <h3>Layanan pilihan</h3>
        <ul className="layanan-pembayaran">{b.items.map(i => <li key={i.layananId}><div><strong>{i.namaLayanan}</strong><small>{i.qty} × {rupiah(i.harga)}</small></div><strong>{rupiah(i.subtotal)}</strong></li>)}</ul>
      </section>
      <section className="panel biaya-ux" aria-labelledby="judul-biaya">
        <span className="eyebrow">TAGIHAN DARI BOOKING ANDA</span>
        <h2 id="judul-biaya">{dapatLunas ? "Sisa pelunasan" : u.bebasDp ? "Bebas DP Membership" : u.dpTerverifikasi ? "DP terverifikasi" : "DP 50%"}</h2>
        <p className="nominal-utama-ux" data-testid="nominal-utama">{rupiah(dapatLunas ? u.balance : u.nominalDpAwal)}</p>
        <dl className="rincian-biaya-ux"><div><dt>Total layanan</dt><dd>{rupiah(u.total)}</dd></div><div><dt>Sudah dibayar</dt><dd>{rupiah(u.jumlahDibayar)}</dd></div><div><dt>Sisa tagihan</dt><dd data-testid="balance">{rupiah(u.balance)}</dd></div></dl>
        {!u.bebasDp && !u.dpTerverifikasi && <p className="teks-sekunder">Sisa tagihan berkurang setelah pembayaran terverifikasi.</p>}
        {b.status === "AWAITING_DP" && <div className={`batas-dp-ux ${habis || hampir ? "peringatan" : ""}`}>
          <div><span>Sisa waktu pembayaran DP</span><strong role="timer" aria-live="off" data-testid="countdown-aktual">{valid ? hitungMundur(batas, sekarang) : "--:--"}</strong></div>
          <p>{habis ? "Batas waktu terlewati. Memeriksa status resmi booking." : valid ? `Bayar sebelum ${waktu(b.deadlineDp??"")}.` : "Perbarui status untuk memeriksa batas waktu."}</p>
          {hampir && <p role="status">Kurang dari 2 menit. Selesaikan pembayaran sebelum batas waktu.</p>}
        </div>}
        {b.deadlinePelunasan && dapatLunas && <p className="teks-sekunder">Batas pelunasan: {waktu(b.deadlinePelunasan)}</p>}
        {halaman === "ringkasan" && (dapatDp || dapatLunas) && <a className="tombol utama lebar" href="#/kunjungan/pembayaran">Lanjut ke pembayaran <Ikon nama="panah"/></a>}
        {halaman === "pembayaran" && <>
          {(dapatDp || dapatLunas) && <button className="tombol utama lebar" disabled={sibuk || !!error} onClick={()=>void bayar()}>{sibuk ? "Menyiapkan checkout…" : dapatDp ? "Bayar DP 50% dengan Snap" : "Bayar sisa pelunasan dengan Snap"}</button>}
          <button className="tombol sekunder lebar" disabled={sibuk} onClick={()=>void perbarui(true)}>Periksa pembayaran</button>
          <p className="teks-sekunder">Midtrans Sandbox · tanpa uang sungguhan. Selesaikan pembayaran, lalu periksa statusnya di halaman ini.</p>
        </>}
        {final && <a className="tombol sekunder lebar" href="#/kunjungan/invoice">Lihat invoice final</a>}
        <button className="tombol-teks" disabled={sibuk} onClick={()=>void perbarui()}>Perbarui status booking</button>
      </section>
      {terkonfirmasi && kode && <section className="panel tracking-ux"><h2>Kode Tracking Booking Anda</h2><p>{terminal ? "Gunakan kode ini untuk melihat perkembangan booking Anda, termasuk penanganan pembayaran." : "Booking Anda telah dikonfirmasi. Simpan kode ini dan jangan bagikan."}</p><div className="kode-tracking" data-testid="kode-tracking" tabIndex={0}>{kode}</div><div className="tracking-aksi"><button className="tombol utama" onClick={()=>void salin()}>Salin Kode</button><a className="tombol sekunder" href="#/kunjungan/detail">Lihat Detail Booking</a></div></section>}
      <section className="panel riwayat-ux"><h2>Riwayat pembayaran</h2>{u.transaksi.length ? u.transaksi.map(t=><div className="baris-ringkas garis" key={t.id}><span>{t.tujuan === "DP" ? "Uang muka" : t.tujuan === "PELUNASAN" ? "Pelunasan" : "Pengembalian dana"}<small>{({PENDING:"Menunggu pembayaran",SUCCEEDED:"Berhasil",FAILED:"Gagal",EXPIRED:"Kedaluwarsa"} as Record<string,string>)[t.status]??"Sedang diperiksa"}</small></span><strong>{rupiah(t.nominal)}</strong></div>) : <p>Belum ada transaksi pembayaran.</p>}</section>
    </div>
    <p className="privasi-pembayaran">Akses ini bersifat pribadi. Kode tracking tersedia setelah DP sah dan booking dikonfirmasi. Jika akses hilang, hubungi Admin untuk verifikasi identitas.</p>
  </div>;
}
