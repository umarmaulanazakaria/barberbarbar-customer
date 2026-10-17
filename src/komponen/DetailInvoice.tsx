import type { DetailTamu } from "../layanan/guest";
import { rupiah } from "../domain";
import "../detail-ux.css";

export const waktuKunjungan = (iso: string) => Number.isFinite(Date.parse(iso))
  ? new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", dateStyle: "long", timeStyle: "short" }).format(new Date(iso)) + " WIB"
  : "Waktu belum tersedia";

type Properti = {
  data: DetailTamu; halaman: "detail" | "invoice"; invoiceDisahkan: boolean;
  error: string; pesan: string; kode: string | null; sibuk: boolean;
  labelStatus: Record<string,string>; sekarang: number;
  perbarui: (sinkron?: boolean) => Promise<unknown>; salin: () => Promise<void>;
};
export default function DetailInvoice({ data, halaman, invoiceDisahkan, error, pesan, kode, sibuk, labelStatus, sekarang, perbarui, salin }: Properti) {
  const b=data.booking, u=data.ringkasan;
  const final=b.status==="COMPLETED" && u.statusPembayaran==="PAID" && u.balance===0 && !u.invoiceSementara && !!u.invoice;
  const invoice=halaman==="invoice" && final && invoiceDisahkan ? u.invoice : null;
  const bolehBayar=(b.status==="AWAITING_DP" && sekarang<Date.parse(b.deadlineDp) && !u.dpTerverifikasi) || (b.status==="COMPLETED" && u.dpTerverifikasi && u.balance>0);
  const kejadian=[
    {nama:"Booking dikonfirmasi",waktu:b.dikonfirmasiPada},
    {nama:"Check-in",waktu:b.checkInPada},
    {nama:"Pelayanan dimulai",waktu:b.layananMulaiPada},
    {nama:"Pelayanan selesai",waktu:b.layananSelesaiPada},
  ].filter((k): k is {nama:string;waktu:string} => !!k.waktu);
  const layanan=<ul className="detail-layanan">{b.items.map(i=><li key={i.layananId}>
    <div><h3>{i.namaLayanan}</h3><p>{i.qty} × {rupiah(i.harga)} <span>· {i.durasiMenit} menit / layanan</span></p></div>
    <strong>{rupiah(i.subtotal)}</strong>
  </li>)}</ul>;
  const riwayat=<section className="panel" aria-labelledby="judul-riwayat-pembayaran">
    <h2 id="judul-riwayat-pembayaran">Riwayat pembayaran</h2>
    <p className="detail-catatan">Transaksi yang masih menunggu belum dihitung sebagai pembayaran diterima.</p>
    {u.transaksi.length ? <ul className="detail-transaksi">{u.transaksi.map(t=>{
      // Waktu sudah diproyeksikan API existing; properti opsional untuk respons lama.
      const waktu=(t as typeof t & {dibayarPada?:unknown}).dibayarPada;
      return <li key={t.id}><div><h3>{t.tujuan==="DP"?"DP / uang muka":t.tujuan==="PELUNASAN"?"Pelunasan":t.tujuan==="REFUND"?"Pengembalian dana":"Transaksi pembayaran"}</h3>
        <p>{({PENDING:"Menunggu pembayaran",SUCCEEDED:"Berhasil",FAILED:"Gagal",EXPIRED:"Kedaluwarsa",PROCESSING:"Sedang diproses",CANCELLED:"Dibatalkan"} as Record<string,string>)[t.status]??"Sedang diperiksa"}</p>
        {t.status==="SUCCEEDED" && typeof waktu==="string" && Number.isFinite(Date.parse(waktu)) && <time dateTime={waktu}>{waktuKunjungan(waktu)}</time>}
      </div><strong>{rupiah(t.nominal)}</strong></li>;
    })}</ul>:<p>Belum ada transaksi pembayaran.</p>}
  </section>;
  return <div className="detail-ux">
    <header className="detail-judul">
      <span className="eyebrow">BOOKING PRIBADI</span>
      <h1 tabIndex={-1}>{halaman==="invoice"?"Invoice booking":"Detail booking"}</h1>
      <p>Nomor booking <strong data-testid="nomor-booking">{b.nomorBooking}</strong></p>
    </header>
    <nav className="detail-tab" aria-label="Halaman booking">
      <a href="#/kunjungan">Ringkasan</a><a href="#/kunjungan/detail" aria-current={halaman==="detail"?"page":undefined}>Detail</a><a href="#/kunjungan/pembayaran">Pembayaran</a>
    </nav>
    {error && <p className="pesan error" role="alert">{error}</p>}
    {pesan && <p className="pesan" role="status">{pesan}</p>}
    {halaman==="invoice" && !invoice && <section className="panel invoice-terkunci"><h2>Invoice final belum tersedia</h2><p>Layanan harus selesai dan seluruh tagihan harus sudah terbayar. Invoice ditampilkan setelah aksesnya berhasil diperiksa.</p><a href="#/kunjungan/detail" className="tombol sekunder">Kembali ke detail booking</a></section>}
    {invoice ? <article className="panel detail-invoice" aria-label="Invoice final">
      <div className="kepala-invoice"><img src="/logo.png" alt="BARBER BARBAR" width="204" height="64"/><span className="detail-status">✓ Lunas</span></div>
      <h2>Invoice final</h2><strong className="nomor-invoice" data-testid="nomor-invoice">{invoice.nomorInvoice}</strong>
      <p><time dateTime={invoice.dibuatPada}>{waktuKunjungan(invoice.dibuatPada)}</time></p>
      <dl className="detail-pasangan"><div><dt>Pelanggan</dt><dd>{b.aksesTamu.nama}</dd></div><div><dt>Nomor HP</dt><dd>{b.aksesTamu.nomorTelepon}</dd></div></dl>
      <h3 className="detail-subjudul">Layanan kunjungan</h3>{layanan}
      <dl className="detail-uang"><div><dt>Subtotal layanan</dt><dd>{rupiah(u.subtotal)}</dd></div><div className="detail-total"><dt>Total invoice</dt><dd>{rupiah(invoice.total)}</dd></div><div><dt>DP awal terverifikasi</dt><dd>{u.dpTerverifikasi?rupiah(u.nominalDpAwal):"Belum terverifikasi"}</dd></div><div><dt>Total pembayaran tercatat</dt><dd>{rupiah(u.jumlahDibayar)}</dd></div><div><dt>Sisa tagihan</dt><dd data-testid="balance">{rupiah(u.balance)}</dd></div></dl>
      <p className="detail-catatan">Tagihan lunas. Rincian DP dan pelunasan tercantum pada riwayat pembayaran.</p>
    </article> : <section className="panel detail-kunjungan" aria-labelledby="judul-kunjungan">
      <span className="detail-status" data-testid="status-booking">{labelStatus[b.status]??"Status sedang diperiksa"}</span>
      <h2 id="judul-kunjungan">Jadwal kunjungan</h2><p className="detail-jadwal"><time dateTime={b.mulaiPada}>{waktuKunjungan(b.mulaiPada)}</time></p>
      <dl className="detail-pasangan"><div><dt>Pelanggan</dt><dd>{b.aksesTamu.nama}</dd></div><div><dt>Barber</dt><dd>{b.barber??"Belum ditentukan"}</dd></div><div><dt>Durasi booking</dt><dd>{b.durasiMenit} menit</dd></div></dl>
    </section>}
    <div className="detail-grid"><div className="detail-kolom">
      {!invoice && <section className="panel" aria-labelledby="judul-layanan-detail"><h2 id="judul-layanan-detail">Layanan pilihan Anda</h2>{layanan}</section>}
      {!invoice && <section className="panel" aria-labelledby="judul-proses-booking"><h2 id="judul-proses-booking">Proses booking</h2>
        <p className="detail-saat-ini">Saat ini: <strong>{labelStatus[b.status]??"Status sedang diperiksa"}</strong></p>
        {kejadian.length ? <ol className="detail-timeline">{kejadian.map(k=><li key={k.nama}><span className="detail-penanda" aria-hidden="true">✓</span><div><strong>{k.nama}</strong><time dateTime={k.waktu}>{waktuKunjungan(k.waktu)}</time></div></li>)}</ol>:<p>Belum ada waktu perkembangan layanan yang tercatat.</p>}
        <p className="detail-catatan">Pelayanan selesai tidak berarti tagihan sudah lunas. Status pembayaran ditampilkan terpisah.</p>
      </section>}
      {riwayat}
      {kode && !invoice && <details open className="panel detail-kode"><summary>Kode Tracking Booking Anda</summary><p>Simpan secara pribadi untuk membuka kembali booking ini.</p><div className="kode-tracking" data-testid="kode-tracking" tabIndex={0}>{kode}</div><button className="tombol sekunder" onClick={()=>void salin()}>Salin Kode</button></details>}
    </div><aside className="detail-kolom">
      {!invoice && <section className="panel" aria-labelledby="judul-tagihan-detail"><h2 id="judul-tagihan-detail">Tagihan kunjungan</h2><p className="detail-status">{labelStatus[u.statusPembayaran]??"Status pembayaran diperbarui"}</p>
        <dl className="detail-uang"><div><dt>Total tagihan</dt><dd>{rupiah(u.total)}</dd></div><div><dt>DP awal {u.dpTerverifikasi?"terverifikasi":"belum terverifikasi"}</dt><dd data-testid="dp-sah">{u.dpTerverifikasi?rupiah(u.nominalDpAwal):"Belum diterima"}</dd></div><div><dt>Total pembayaran tercatat</dt><dd>{rupiah(u.jumlahDibayar)}</dd></div><div className="detail-total"><dt>Sisa tagihan</dt><dd data-testid="balance">{rupiah(u.balance)}</dd></div></dl>
        {bolehBayar && <a className="tombol utama lebar" href="#/kunjungan/pembayaran">Lanjut ke pembayaran</a>}
        {final && <a className="tombol sekunder lebar" href="#/kunjungan/invoice">Lihat invoice final</a>}
      </section>}
      <section className="panel detail-bantuan"><h2>Booking tetap terpantau</h2><p>Status diperbarui otomatis saat terhubung. Anda juga dapat memeriksanya kembali.</p><button className="tombol sekunder lebar" disabled={sibuk} onClick={()=>void perbarui()}>Perbarui status booking</button><p className="detail-catatan">Sesi browser terbatas waktunya. Gunakan kode tracking jika sesi berakhir. Jika kode hilang, hubungi Admin untuk verifikasi identitas.</p></section>
    </aside></div>
  </div>;
}
