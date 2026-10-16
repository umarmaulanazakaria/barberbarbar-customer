import { useRef, useState, type FormEvent } from 'react';
import { estimasi, normalisasiTelepon, rupiah, tanggalWib, validasiDraf, type DrafBooking, type KesalahanForm } from '../domain';
import { Ikon } from './Ikon';
import { StatusKatalog, type SumberKatalog } from './Katalog';

export default function FormBooking({ sumber, awal, layananAwal, lanjut, nyata=false, sibuk=false, pesan='' }: {
  sumber: SumberKatalog; awal: DrafBooking | null; layananAwal: number | null; lanjut: (draf: DrafBooking) => void;
  nyata?:boolean; sibuk?:boolean; pesan?:string;
}) {
  const [nama, aturNama] = useState(awal?.nama ?? ''), [telepon, aturTelepon] = useState(awal?.telepon ?? '');
  const [tanggal, aturTanggal] = useState(awal?.tanggal ?? ''), [jam, aturJam] = useState(awal?.jam ?? '');
  const [jumlah, aturJumlah] = useState<Record<number, number>>(() => ({
    ...Object.fromEntries(awal?.pilihan.map(p => [p.layanan.id, p.jumlah]) ?? []),
    ...(layananAwal ? { [layananAwal]: 1 } : {}),
  }));
  const [salah, aturSalah] = useState<KesalahanForm>({});
  const formulir = useRef<HTMLFormElement>(null);
  const pilihan = sumber.layanan.filter(l => (jumlah[l.id] ?? 0) > 0).map(layanan => ({ layanan, jumlah: jumlah[layanan.id] }));
  const ringkas = estimasi(pilihan);
  const kirim = (e: FormEvent) => {
    e.preventDefault();
    const draf = { nama: nama.trim(), telepon: normalisasiTelepon(telepon), tanggal, jam, pilihan };
    const error = validasiDraf(draf); aturSalah(error);
    if (Object.keys(error).length) {
      requestAnimationFrame(() => formulir.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return;
    }
    lanjut(draf);
  };
  return <div className="halaman-form">
    <a href="#/" className="kembali"><Ikon nama="kembali" ukuran={16} /> Kembali ke beranda</a>
    <div className="judul-halaman"><span className="eyebrow">WAKTU UNTUK DIRIMU</span><h1 tabIndex={-1}>Rencanakan booking.</h1><p>Pilih layanan, tentukan waktu, dan isi data dirimu. Semudah itu.</p></div>
    <ol className="langkah" aria-label="Tahapan pratinjau"><li className="aktif"><span>01</span> Rencana</li><li><span>02</span> Ringkasan</li><li><span>03</span> Pembayaran</li></ol>
    {pesan&&<p role="alert" className="pesan error">{pesan}</p>}
    <form noValidate onSubmit={kirim} ref={formulir} className="grid-form">
      <div className="isi-form">
        <section className="panel"><div className="judul-panel"><span className="angka">01</span><div><h2>Kenalan dulu, yuk.</h2><p>{nyata?'Data dikirim untuk booking ini. Tidak membuat atau mengakses akun.':'Data hanya digunakan untuk pratinjau di tab ini.'}</p></div></div>
          <div className="grid-dua"><div className="kolom"><label htmlFor="nama">Nama lengkap <span aria-hidden="true">*</span></label><input id="nama" name="nama" autoComplete="name" placeholder="Nama kamu" value={nama} maxLength={80} aria-invalid={!!salah.nama} aria-describedby={salah.nama ? 'error-nama' : undefined} onChange={e => aturNama(e.target.value)} />{salah.nama && <p className="error-kolom" id="error-nama">{salah.nama}</p>}</div>
          <div className="kolom"><label htmlFor="telepon">Nomor HP <span aria-hidden="true">*</span></label><input id="telepon" name="tel" type="tel" inputMode="tel" autoComplete="tel" placeholder="08xxxxxxxxxx" value={telepon} maxLength={24} aria-invalid={!!salah.telepon} aria-describedby={salah.telepon ? 'error-telepon' : 'bantuan-telepon'} onChange={e => aturTelepon(e.target.value)} /><p id="bantuan-telepon" className="bantuan">Gunakan nomor HP Indonesia yang aktif.</p>{salah.telepon && <p className="error-kolom" id="error-telepon">{salah.telepon}</p>}</div></div>
        </section>
        <section className="panel"><div className="judul-panel"><span className="angka">02</span><div><h2>Mau layanan apa?</h2><p>Boleh pilih lebih dari satu. Jumlah per layanan maksimal 10.</p></div></div>
          <StatusKatalog sumber={sumber} />
          <fieldset className="pilihan-layanan" aria-invalid={!!salah.pilihan} aria-describedby={salah.pilihan ? 'error-pilihan' : undefined} tabIndex={-1}><legend className="sr-only">Pilihan layanan</legend>
            {sumber.layanan.map(l => <div key={l.id} className={`pilihan ${jumlah[l.id] ? 'terpilih' : ''}`}><label className="label-pilihan"><input type="checkbox" checked={!!jumlah[l.id]} onChange={e => aturJumlah(j => ({ ...j, [l.id]: e.target.checked ? 1 : 0 }))} /><span><strong>{l.nama}</strong><small>{l.durasiMenit} menit · {rupiah(l.harga)}</small></span></label>
              {!!jumlah[l.id] && <div className="pengatur-jumlah"><button type="button" aria-label={`Kurangi ${l.nama}`} disabled={jumlah[l.id] <= 1} onClick={() => aturJumlah(j => ({ ...j, [l.id]: j[l.id] - 1 }))}>−</button><output aria-label={`Jumlah ${l.nama}`}>{jumlah[l.id]}</output><button type="button" aria-label={`Tambah ${l.nama}`} disabled={jumlah[l.id] >= 10} onClick={() => aturJumlah(j => ({ ...j, [l.id]: j[l.id] + 1 }))}>+</button></div>}
            </div>)}
          </fieldset>{salah.pilihan && <p className="error-kolom" id="error-pilihan">{salah.pilihan}</p>}
        </section>
        <section className="panel"><div className="judul-panel"><span className="angka">03</span><div><h2>Tentukan waktunya.</h2><p>Seluruh jadwal menggunakan Waktu Indonesia Barat.</p></div></div>
          <div className="grid-dua"><div className="kolom"><label htmlFor="tanggal">Tanggal layanan <span aria-hidden="true">*</span></label><input id="tanggal" type="date" min={tanggalWib()} value={tanggal} aria-invalid={!!salah.tanggal} aria-describedby={salah.tanggal ? 'error-tanggal' : undefined} onChange={e => aturTanggal(e.target.value)} />{salah.tanggal && <p className="error-kolom" id="error-tanggal">{salah.tanggal}</p>}</div>
          <div className="kolom"><label htmlFor="jam">Jam layanan (WIB) <span aria-hidden="true">*</span></label><input id="jam" type="time" value={jam} aria-invalid={!!salah.jam} aria-describedby={salah.jam ? 'error-jam' : undefined} onChange={e => aturJam(e.target.value)} />{salah.jam && <p className="error-kolom" id="error-jam">{salah.jam}</p>}</div></div>
          <p className="catatan"><Ikon nama="kalender" ukuran={18} /> {nyata?'Jam 09.00–23.00 WIB, maksimal 14 hari ke depan, minimal 3 jam untuk hari ini. Ketersediaan diverifikasi saat booking dibuat.':'Ketersediaan jadwal belum diverifikasi. Ini belum memesan slot layanan.'}</p>
        </section>
      </div>
      <aside className="panel ringkasan" aria-labelledby="judul-ringkasan"><span className="eyebrow">RENCANA KUNJUNGAN</span><h2 id="judul-ringkasan">Ringkasan pilihan</h2><div className="daftar-ringkas">{pilihan.length ? pilihan.map(p => <div className="baris-ringkas" key={p.layanan.id}><span>{p.layanan.nama}<small>{p.jumlah} × {rupiah(p.layanan.harga)}</small></span><strong>{rupiah(p.jumlah * p.layanan.harga)}</strong></div>) : <p className="kosong-ringkas">Pilih layanan favoritmu untuk melihat estimasi biaya.</p>}</div>
        <dl className="nilai-ringkas"><div><dt>Estimasi durasi</dt><dd>{ringkas.durasi} menit</dd></div><div><dt>Estimasi total</dt><dd data-testid="estimasi-total">{rupiah(ringkas.total)}</dd></div><div className="dp"><dt>Estimasi DP 50%</dt><dd data-testid="estimasi-dp">{rupiah(ringkas.dp)}</dd></div></dl>
        <p className="bantuan">Nominal ini hanya estimasi antarmuka. Tagihan final dan DP nantinya ditentukan backend.</p>
        <button className="tombol utama lebar" type="submit" disabled={sibuk}>{sibuk?'Membuat booking…':nyata?'Buat booking dan lanjut ke DP':'Lihat pratinjau booking'} <Ikon nama="panah" /></button>
        <p className="catatan-privasi"><Ikon nama="perisai" ukuran={16} /> {nyata?'Booking menahan kapasitas selama 15 menit. DP dan deadline final ditetapkan backend. Simpan tautan pribadi setelah booking dibuat.':'Tidak mengirim nama atau nomor HP ke server. Tidak membuat booking atau pembayaran.'}</p>
      </aside>
    </form>
  </div>;
}
