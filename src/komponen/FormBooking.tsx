import { kutipanMembership } from "../layanan/membership";
import { useRef, useState, type FormEvent } from "react";
import {
  estimasi,
  normalisasiTelepon,
  rupiah,
  tanggalWib,
  validasiDraf,
  type DrafBooking,
  type KesalahanForm,
} from "../domain";
import { Ikon } from "./Ikon";
import { StatusKatalog, type SumberKatalog } from "./Katalog";

export default function FormBooking({
  sumber,
  awal,
  layananAwal,
  lanjut,
  nyata = false,
  sibuk = false,
  pesan = "",
}: {
  sumber: SumberKatalog;
  awal: DrafBooking | null;
  layananAwal: number | null;
  lanjut: (draf: DrafBooking) => void;
  nyata?: boolean;
  sibuk?: boolean;
  pesan?: string;
}) {
  const [nomorMember, aturMember] = useState(awal?.nomorMember??"");
  const [nama, aturNama] = useState(awal?.nama ?? ""),
    [telepon, aturTelepon] = useState(awal?.telepon ?? "");
  const [tanggal, aturTanggal] = useState(awal?.tanggal ?? ""),
    [jam, aturJam] = useState(awal?.jam ?? "");
  const [jumlah, aturJumlah] = useState<Record<number, number>>(() => ({
    ...Object.fromEntries(
      awal?.pilihan.map((p) => [p.layanan.id, p.jumlah]) ?? [],
    ),
    ...(layananAwal ? { [layananAwal]: 1 } : {}),
  }));
  const [salah, aturSalah] = useState<KesalahanForm>({});
  const formulir = useRef<HTMLFormElement>(null);
  const pilihan = sumber.layanan
    .filter((l) => (jumlah[l.id] ?? 0) > 0)
    .map((layanan) => ({ layanan, jumlah: jumlah[layanan.id] }));
  const [kutipan, aturKutipan] = useState<{sidik:string;total:number}|null>(null), [memeriksaMember, aturMemeriksa] = useState(false), [galatMember, aturGalatMember] = useState("");
  const sidikMember = JSON.stringify({nomorMember:nomorMember.trim().toUpperCase(),mulaiPada: tanggal && jam ? tanggal+"T"+jam+":00+07:00" : "",items:pilihan.map(p=>({layananId:p.layanan.id,qty:p.jumlah}))});
  const memberSah = !!nomorMember.trim() && kutipan?.sidik===sidikMember;
  const reguler = estimasi(pilihan), ringkas = memberSah ? {...reguler,total:kutipan!.total,dp:0}:reguler;
  const periksaMember = async()=>{aturMemeriksa(true);aturGalatMember("");try{const body=JSON.parse(sidikMember) as {nomorMember:string;mulaiPada:string;items:{layananId:number;qty:number}[]};const hasil=await kutipanMembership(body);aturKutipan({sidik:sidikMember,total:hasil.total})}catch(e){aturKutipan(null);aturGalatMember(e instanceof Error?e.message:"Membership belum dapat diperiksa.")}finally{aturMemeriksa(false)}};
  const kirim = (e: FormEvent) => {
    e.preventDefault();
    const draf = {
      ...(nomorMember.trim()?{nomorMember:nomorMember.trim().toUpperCase()}:{}),
      nama: nama.trim(),
      telepon: normalisasiTelepon(telepon),
      tanggal,
      jam,
      pilihan,
    };
    const error = validasiDraf(draf);
    if(nomorMember.trim()&&!memberSah)error.nomorMember="Periksa Nomor Member setelah memilih layanan dan jadwal.";
    aturSalah(error);
    if (Object.keys(error).length) {
      requestAnimationFrame(() =>
        formulir.current
          ?.querySelector<HTMLElement>('[aria-invalid="true"]')
          ?.focus(),
      );
      return;
    }
    lanjut(draf);
  };
  return (
    <div className="halaman-form">
      <a href="#/" className="kembali">
        <Ikon nama="kembali" ukuran={16} /> Kembali ke beranda
      </a>
      <div className="judul-halaman">
        <span className="eyebrow">WAKTU UNTUK DIRIMU</span>
        <h1 tabIndex={-1}>Rencanakan booking.</h1>
        <p>Pilih layanan, tentukan waktu, dan isi data dirimu. Semudah itu.</p>
      </div>
      <ol className="langkah" aria-label="Tahapan booking">
        <li className="aktif">
          <span>01</span> Rencana
        </li>
        <li>
          <span>02</span> Ringkasan
        </li>
        <li>
          <span>03</span> Pembayaran
        </li>
      </ol>
      {pesan && (
        <p role="alert" className="pesan error">
          {pesan}
        </p>
      )}
      <form noValidate onSubmit={kirim} ref={formulir} className="grid-form" aria-busy={sibuk}>
        <fieldset className="isi-form" disabled={sibuk}>
          <legend className="sr-only">Data, layanan, dan jadwal booking</legend>
          <section className="panel">
            <div className="judul-panel">
              <span className="angka">01</span>
              <div>
                <h2>Kenalan dulu, yuk.</h2>
                <p>
                  {nyata
                    ? "Data dikirim untuk booking ini. Tidak membuat atau mengakses akun."
                    : "Data hanya digunakan untuk pratinjau di tab ini."}
                </p>
              </div>
            </div>
            <div className="grid-dua">
              <div className="kolom">
                <label htmlFor="nama">
                  Nama lengkap <span aria-hidden="true">*</span>
                </label>
                <input
                  id="nama"
                  name="nama"
                  autoComplete="name"
                  placeholder="Nama kamu"
                  value={nama}
                  maxLength={80}
                  aria-invalid={!!salah.nama}
                  aria-describedby={salah.nama ? "error-nama" : undefined}
                  onChange={(e) => aturNama(e.target.value)}
                />
                {salah.nama && (
                  <p className="error-kolom" id="error-nama">
                    {salah.nama}
                  </p>
                )}
              </div>
              <div className="kolom">
                <label htmlFor="telepon">
                  Nomor HP <span aria-hidden="true">*</span>
                </label>
                <input
                  id="telepon"
                  name="tel"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="08xxxxxxxxxx"
                  value={telepon}
                  maxLength={24}
                  aria-invalid={!!salah.telepon}
                  aria-describedby={
                    salah.telepon ? "error-telepon" : "bantuan-telepon"
                  }
                  onChange={(e) => aturTelepon(e.target.value)}
                />
                <p id="bantuan-telepon" className="bantuan">
                  Gunakan nomor HP Indonesia yang aktif.
                </p>
                {salah.telepon && (
                  <p className="error-kolom" id="error-telepon">
                    {salah.telepon}
                  </p>
                )}
              </div>
            </div>
          </section>
          <section className="panel"><label htmlFor="nomor-member">Nomor Member (opsional)</label><input id="nomor-member" maxLength={60} autoComplete="off" value={nomorMember} onChange={e=>aturMember(e.target.value.toUpperCase())}/><p className="bantuan">Manfaat dan masa aktif diverifikasi otomatis pada jadwal pelayanan. Member aktif bebas DP; identitas diperiksa saat check-in. Tekan Periksa Membership setelah memilih layanan dan jadwal.</p><button type="button" className="tombol sekunder" disabled={sibuk||memeriksaMember||!nomorMember.trim()||!tanggal||!jam||!pilihan.length} onClick={()=>void periksaMember()}>{memeriksaMember?"Memeriksa...":"Periksa Membership"}</button>{memberSah&&<p role="status">Membership berlaku pada jadwal pilihan. Tagihan {rupiah(kutipan!.total)}, bebas DP.</p>}{(galatMember||salah.nomorMember)&&<p className="error-kolom" role="alert">{galatMember||salah.nomorMember}</p>}</section>
          <section className="panel">
            <div className="judul-panel">
              <span className="angka">02</span>
              <div>
                <h2>Mau layanan apa?</h2>
                <p>
                  Boleh pilih lebih dari satu. Jumlah per layanan maksimal 10.
                </p>
              </div>
            </div>
            <StatusKatalog sumber={sumber} />
            <fieldset
              className="pilihan-layanan"
              aria-invalid={!!salah.pilihan}
              aria-describedby={salah.pilihan ? "error-pilihan" : undefined}
              tabIndex={-1}
            >
              <legend className="sr-only">Pilihan layanan</legend>
              {sumber.layanan.map((l) => (
                <div
                  key={l.id}
                  className={`pilihan ${jumlah[l.id] ? "terpilih" : ""}`}
                >
                  <label className="label-pilihan">
                    <input
                      type="checkbox"
                      checked={!!jumlah[l.id]}
                      onChange={(e) =>
                        aturJumlah((j) => ({
                          ...j,
                          [l.id]: e.target.checked ? 1 : 0,
                        }))
                      }
                    />
                    <span>
                      <strong>{l.nama}</strong>
                      <small>
                        {rupiah(l.harga)}
                      </small>
                    </span>
                  </label>
                  {!!jumlah[l.id] && (
                    <div className="pengatur-jumlah">
                      <button
                        type="button"
                        aria-label={`Kurangi ${l.nama}`}
                        disabled={jumlah[l.id] <= 1}
                        onClick={() =>
                          aturJumlah((j) => ({ ...j, [l.id]: j[l.id] - 1 }))
                        }
                      >
                        −
                      </button>
                      <output aria-label={`Jumlah ${l.nama}`} aria-live="polite">
                        {jumlah[l.id]}
                      </output>
                      <button
                        type="button"
                        aria-label={`Tambah ${l.nama}`}
                        disabled={jumlah[l.id] >= 10}
                        onClick={() =>
                          aturJumlah((j) => ({ ...j, [l.id]: j[l.id] + 1 }))
                        }
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </fieldset>
            {salah.pilihan && (
              <p className="error-kolom" id="error-pilihan">
                {salah.pilihan}
              </p>
            )}
          </section>
          <section className="panel">
            <div className="judul-panel">
              <span className="angka">03</span>
              <div>
                <h2>Tentukan waktunya.</h2>
                <p>Seluruh jadwal menggunakan Waktu Indonesia Barat.</p>
              </div>
            </div>
            <div className="grid-dua">
              <div className="kolom">
                <label htmlFor="tanggal">
                  Tanggal layanan <span aria-hidden="true">*</span>
                </label>
                <input
                  id="tanggal"
                  type="date"
                  min={tanggalWib()}
                  value={tanggal}
                  aria-invalid={!!salah.tanggal}
                  aria-describedby={salah.tanggal ? "error-tanggal" : undefined}
                  onChange={(e) => aturTanggal(e.target.value)}
                />
                {salah.tanggal && (
                  <p className="error-kolom" id="error-tanggal">
                    {salah.tanggal}
                  </p>
                )}
              </div>
              <div className="kolom">
                <label htmlFor="jam">
                  Jam layanan (WIB) <span aria-hidden="true">*</span>
                </label>
                <input
                  id="jam"
                  type="time"
                  value={jam}
                  aria-invalid={!!salah.jam}
                  aria-describedby={salah.jam ? "error-jam" : undefined}
                  onChange={(e) => aturJam(e.target.value)}
                />
                {salah.jam && (
                  <p className="error-kolom" id="error-jam">
                    {salah.jam}
                  </p>
                )}
              </div>
            </div>
            <p className="catatan">
              <Ikon nama="kalender" ukuran={18} />{" "}
              {nyata
                ? "Jam 09.00–23.00 WIB, maksimal 14 hari ke depan, minimal 3 jam untuk hari ini. Ketersediaan diverifikasi saat booking dibuat."
                : "Ketersediaan jadwal belum diverifikasi. Ini belum memesan slot layanan."}
            </p>
          </section>
        </fieldset>
        <aside className="panel ringkasan" aria-labelledby="judul-ringkasan">
          <span className="eyebrow">RENCANA KUNJUNGAN</span>
          <h2 id="judul-ringkasan">Ringkasan pilihan</h2>
          <div className="daftar-ringkas">
            {pilihan.length ? (
              pilihan.map((p) => (
                <div className="baris-ringkas" key={p.layanan.id}>
                  <span>
                    {p.layanan.nama}
                    <small>
                      {p.jumlah} × {rupiah(p.layanan.harga)}
                    </small>
                  </span>
                  <strong>{rupiah(p.jumlah * p.layanan.harga)}</strong>
                </div>
              ))
            ) : (
              <p className="kosong-ringkas">
                Pilih layanan favoritmu untuk melihat estimasi biaya.
              </p>
            )}
          </div>
          <dl className="nilai-ringkas">
            <div>
              <dt>Slot Booking</dt>
              <dd>{ringkas.durasi} menit</dd>
            </div>
            <div>
              <dt>Estimasi total</dt>
              <dd data-testid="estimasi-total">{rupiah(ringkas.total)}</dd>
            </div>
            <div className="dp">
              <dt>{memberSah?"Bebas DP Membership":"Estimasi DP 50%"}</dt>
              <dd data-testid="estimasi-dp">{rupiah(ringkas.dp)}</dd>
            </div>
          </dl>
          <p className="bantuan">
            Estimasi mengikuti layanan yang dipilih. Periksa tagihan final dan
            nominal DP setelah booking dibuat.
          </p>
          <button className="tombol utama lebar" type="submit" disabled={sibuk||memeriksaMember||!!nomorMember.trim()&&!memberSah}>
            {sibuk
              ? "Membuat booking…"
              : nyata
                ? memberSah?"Buat Booking Member":"Buat booking dan lanjut ke DP"
                : "Lihat pratinjau booking"}{" "}
            <Ikon nama="panah" />
          </button>
          <p className="catatan-privasi">
            <Ikon nama="perisai" ukuran={16} />{" "}
            {nyata
              ? memberSah?"Booking Member langsung dikonfirmasi. Tunjukkan nama dan nomor HP member saat check-in.":"Selesaikan DP dalam 15 menit untuk mengonfirmasi booking. Kode tracking tersedia setelah DP terverifikasi."
              : "Tidak mengirim nama atau nomor HP ke server. Tidak membuat booking atau pembayaran."}
          </p>
        </aside>
      </form>
    </div>
  );
}
