import { useEffect, useRef, useState } from "react";
import { normalisasiTelepon, rupiah, tanggalWib, type DrafBooking } from "../domain";
import { ambilSlotWeb, kutipanWeb, type SlotWeb, type KutipanWeb, type RencanaWeb } from "../layanan/rencana-booking";
import { StatusKatalog, type SumberKatalog } from "./Katalog";
import { Ikon } from "./Ikon";
const tahap = ["Layanan", "Barber", "Jadwal", "Identitas / Member", "Checkout"];
const jam = (v: string) => new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(v));
export default function FormBooking({ sumber, awal, layananAwal, lanjut, sibuk = false, pesan = "", nomorAwal = "" }: {
  sumber: SumberKatalog; awal: DrafBooking | null; layananAwal: number | null; lanjut: (d: DrafBooking) => void; sibuk?: boolean; pesan?: string; nyata?: boolean; nomorAwal?: string;
}) {
  const [langkah, aturLangkah] = useState(0), panel = useRef<HTMLDivElement>(null);
  const [jumlah, aturJumlah] = useState<Record<number, number>>(() => ({ ...Object.fromEntries(awal?.pilihan.map(p => [p.layanan.id, p.jumlah]) ?? []), ...(layananAwal ? { [layananAwal]: 1 } : {}) }));
  const [tanggal, aturTanggal] = useState(awal?.tanggal ?? tanggalWib()), [barberId, aturBarber] = useState(awal?.barberPilihanId ?? 0), [mulai, aturMulai] = useState("");
  const [slot, aturSlot] = useState<SlotWeb | null>(null), [muatSlot, aturMuatSlot] = useState(false), [ulangi, aturUlangi] = useState(0);
  const [nomorMember, aturNomor] = useState(awal?.nomorMember ?? nomorAwal), [member, aturMember] = useState(!!(awal?.nomorMember || nomorAwal));
  const [nama, aturNama] = useState(awal?.nama ?? ""), [hp, aturHp] = useState(awal?.telepon ?? "");
  const [kutipan, aturKutipan] = useState<{ sidik: string; data: KutipanWeb } | null>(null), [memeriksa, aturMemeriksa] = useState(false), [galat, aturGalat] = useState("");
  const pilihan = sumber.layanan.filter(l => (jumlah[l.id] ?? 0) > 0).map(layanan => ({ layanan, jumlah: jumlah[layanan.id] }));
  const body: RencanaWeb = { ...(member ? { nomorMember: nomorMember.trim().toUpperCase() } : {}), barberPilihanId: barberId, mulaiPada: mulai, items: pilihan.map(p => ({ layananId: p.layanan.id, qty: p.jumlah })) };
  const sidik = JSON.stringify(body), harga = kutipan?.sidik === sidik ? kutipan.data : null;
  useEffect(() => {
    if (langkah < 1 || !tanggal) return;
    const c = new AbortController(); aturMuatSlot(true); aturGalat(""); aturSlot(null);
    void ambilSlotWeb(tanggal, c.signal).then(d => { if (!c.signal.aborted) aturSlot(d); }).catch(e => { if (!c.signal.aborted) aturGalat(e instanceof Error ? e.message : "Slot belum tersedia."); }).finally(() => { if (!c.signal.aborted) aturMuatSlot(false); });
    return () => c.abort();
  }, [tanggal, langkah > 0, ulangi]);
  useEffect(() => { if (!slot) return; if (barberId && !slot.barber.some(b => b.id === barberId)) { aturBarber(0); aturMulai(""); } if (mulai && !slot.slot.some(s => s.mulaiPada === mulai && s.barberId.includes(barberId))) aturMulai(""); }, [slot, barberId, mulai]);
  useEffect(() => { panel.current?.focus({ preventScroll: true }); }, [langkah]);
  const selanjutnya = async () => {
    if (sibuk || memeriksa) return; aturGalat("");
    if (langkah === 0 && (!pilihan.length || sumber.memuat || !!sumber.error || pilihan.length > 20)) { aturGalat("Pilih satu atau beberapa layanan aktif, maksimal 20 jenis."); return; }
    if (langkah === 1 && (!barberId || !slot?.barber.some(b => b.id === barberId))) { aturGalat("Pilih barber yang tersedia pada tanggal kunjungan."); return; }
    if (langkah === 2 && (!mulai || !slot?.slot.some(s => s.mulaiPada === mulai && s.barberId.includes(barberId)))) { aturGalat("Pilih slot yang tersedia."); return; }
    if (langkah === 3) {
      if (member && !/^(?:\d{8,60}|MEM-\d{3,})$/i.test(nomorMember.trim())) { aturGalat("Periksa Nomor Member Anda."); return; }
      if (!member && (nama.trim().length < 2 || nama.trim().length > 80 || !/^\+628\d{7,11}$/.test(normalisasiTelepon(hp)))) { aturGalat("Isi nama dan nomor HP Indonesia yang valid."); return; }
      aturMemeriksa(true);
      try { const d = await kutipanWeb(body); aturKutipan({ sidik, data: d }); aturLangkah(4); } catch (e) { aturGalat(e instanceof Error ? e.message : "Booking belum dapat diverifikasi."); } finally { aturMemeriksa(false); }
      return;
    }
    aturLangkah(n => n + 1);
  };
  const konfirmasi = () => {
    if (!harga || sibuk) return;
    const waktu = new Date(new Date(mulai).getTime() + 7 * 3600000).toISOString();
    lanjut({ ...(member ? { nomorMember: nomorMember.trim().toUpperCase() } : {}), nama: member ? "" : nama.trim(), telepon: member ? "" : normalisasiTelepon(hp), tanggal: waktu.slice(0, 10), jam: waktu.slice(11, 16), pilihan, barberPilihanId: barberId, totalDiharapkan: harga.total });
  };
  const maksimal = new Date(Date.parse((slot?.serverTime ?? new Date().toISOString())) + (14 * 24 + 7) * 3600000).toISOString().slice(0, 10);
  const pilihTanggal = <label className="cw-field">Tanggal kunjungan · WIB<input type="date" value={tanggal} min={tanggalWib(slot ? Date.parse(slot.serverTime) : Date.now())} max={maksimal} onChange={e => { aturTanggal(e.target.value); aturMulai(""); aturKutipan(null); }}/></label>;
  return <section className="cw-booking"><a href="#/" className="kembali"><Ikon nama="kembali" ukuran={16}/>Beranda</a><div className="judul-halaman"><span className="eyebrow">BOOKING TANPA AKUN</span><h1>Rencanakan kunjunganmu.</h1><p>Satu Booking, satu slot 45 menit. Pilih layanan sesuai kebutuhan.</p></div>
    <ol className="cw-steps" aria-label="Tahapan Booking">{tahap.map((t, i) => <li key={t} className={langkah === i ? "aktif" : i < langkah ? "selesai" : ""} aria-current={langkah === i ? "step" : undefined}><span>{i + 1}</span><b>{t}</b></li>)}</ol>
    <div ref={panel} tabIndex={-1} className="cw-wizard-panel" aria-busy={sibuk || memeriksa}>
      <div className="cw-step-title"><span>LANGKAH {langkah + 1} / 5</span><h2>{tahap[langkah]}</h2></div>
      {pesan && <div role="alert" className="pesan error"><p>{pesan}</p><a href="#/kunjungan/detail">Periksa Booking pada browser ini</a></div>}{galat && <p role="alert" className="pesan error">{galat}</p>}
      <fieldset disabled={sibuk || memeriksa} className="cw-fields"><legend className="sr-only">{tahap[langkah]}</legend>
      {langkah === 0 && <><StatusKatalog sumber={sumber}/><div className="cw-service-list">{sumber.layanan.map(l => <div className={`cw-service ${(jumlah[l.id] ?? 0) > 0 ? "dipilih" : ""}`} key={l.id}><div><h3>{l.nama}</h3><strong>{rupiah(l.harga)}</strong></div><div className="cw-qty"><button type="button" aria-label={`Kurangi ${l.nama}`} disabled={!(jumlah[l.id] > 0)} onClick={() => aturJumlah(v => ({ ...v, [l.id]: Math.max(0, (v[l.id] ?? 0) - 1) }))}>−</button><output aria-label={`Jumlah ${l.nama}`}>{jumlah[l.id] ?? 0}</output><button type="button" aria-label={`Tambah ${l.nama}`} disabled={jumlah[l.id] >= 10} onClick={() => aturJumlah(v => ({ ...v, [l.id]: (v[l.id] ?? 0) + 1 }))}>+</button></div></div>)}</div><p className="catatan">Harga akhir dan manfaat Membership diperiksa backend saat checkout.</p></>}
      {langkah === 1 && <>{pilihTanggal}<p className="catatan">Barber berikut memiliki slot tersedia pada hari dipilih. Pilih waktu pada langkah berikutnya.</p>{muatSlot ? <p role="status">Memeriksa ketersediaan barber...</p> : <div className="cw-barbers">{slot?.barber.map(b => <button type="button" key={b.id} aria-pressed={barberId === b.id} onClick={() => { aturBarber(b.id); aturMulai(""); aturKutipan(null); }}><span className="cw-barber-avatar" aria-hidden="true">{b.nama.slice(0, 1)}</span><strong>{b.nama}</strong><small>Pilih barber</small></button>)}{!slot?.barber.length && <p>Belum ada barber tersedia. Coba tanggal lain.</p>}</div>}<button type="button" className="tombol-teks" onClick={() => aturUlangi(n => n + 1)}>Periksa kembali</button></>}
      {langkah === 2 && <>{pilihTanggal}<p className="cw-selected">Barber: <strong>{slot?.barber.find(b => b.id === barberId)?.nama ?? "Pilih ulang barber"}</strong> · Slot 45 menit</p>{muatSlot ? <p role="status">Memuat slot tersedia...</p> : <div className="cw-slots">{slot?.slot.filter(s => s.barberId.includes(barberId)).map(s => <button type="button" key={s.mulaiPada} aria-pressed={mulai === s.mulaiPada} onClick={() => { aturMulai(s.mulaiPada); aturKutipan(null); }}>{jam(s.mulaiPada)}<small>— {jam(s.selesaiPada)} WIB</small></button>)}{!slot?.slot.some(s => s.barberId.includes(barberId)) && <p>Tidak ada slot untuk barber ini. Kembali untuk memilih barber lain.</p>}</div>}<p className="catatan">Slot belum dipesan sampai Booking berhasil dibuat. Ketersediaan diperiksa ulang saat konfirmasi.</p></>}
      {langkah === 3 && <><div className="cw-mode"><button type="button" aria-pressed={!member} onClick={() => { aturMember(false); aturKutipan(null); }}>Reguler</button><button type="button" aria-pressed={member} onClick={() => { aturMember(true); aturKutipan(null); }}>Punya Nomor Member</button></div>{member ? <><label className="cw-field">Nomor Member<input value={nomorMember} maxLength={60} autoComplete="off" spellCheck={false} onChange={e => { aturNomor(e.target.value); aturKutipan(null); }} placeholder="Masukkan Nomor Member Anda"/></label><p className="cw-member-note">Tidak perlu mengisi ulang nama atau HP. Identitas pemilik tidak ditampilkan di Web dan akan diverifikasi Staff saat kedatangan. Membership harus aktif pada jadwal layanan.</p><button className="tombol-teks" type="button" onClick={() => { aturMember(false); aturKutipan(null); aturGalat(""); }}>Membership tidak berlaku? Lanjut sebagai Reguler</button></> : <><label className="cw-field">Nama lengkap<input value={nama} onChange={e => aturNama(e.target.value)} maxLength={80} autoComplete="name" placeholder="Nama pemesan"/></label><label className="cw-field">Nomor HP<input value={hp} onChange={e => aturHp(e.target.value)} maxLength={24} type="tel" autoComplete="tel" placeholder="Nomor HP aktif"/></label><p className="catatan">Data digunakan untuk Booking ini. Tidak membuat akun atau profil pelanggan terdaftar.</p></>}</>}
      {langkah === 4 && harga && <><div className="cw-checkout"><div className="cw-checkout-head"><img src="/logo.png" alt="BARBER BARBAR"/><span>RINGKASAN BOOKING</span></div><dl><div><dt>Barber</dt><dd>{harga.barber?.nama}</dd></div><div><dt>Jadwal · WIB</dt><dd>{tanggal} · {jam(harga.mulaiPada)}–{jam(harga.selesaiPada)}</dd></div><div><dt>Pemesan</dt><dd>{member ? "Member · identitas diverifikasi di lokasi" : nama}</dd></div></dl><ul>{harga.items.map(i => <li key={i.layananId}><span>{i.nama} ×{i.qty}</span><b>{rupiah(i.subtotal)}</b></li>)}</ul><dl><div><dt>Subtotal tarif aktif</dt><dd>{rupiah(harga.subtotal)}</dd></div><div><dt>Diskon Member</dt><dd>−{rupiah(harga.diskonMember)}</dd></div><div className="total"><dt>Total tagihan</dt><dd>{rupiah(harga.total)}</dd></div><div><dt>{harga.bebasDp ? "DP Member" : "DP 50% melalui Midtrans"}</dt><dd>{rupiah(harga.nominalDp)}</dd></div><div><dt>Sisa setelah DP</dt><dd>{rupiah(harga.sisaSetelahDp)}</dd></div></dl></div><p className="cw-member-note">{harga.bebasDp ? "Booking Member yang memenuhi syarat dikonfirmasi tanpa DP. Tambahan berbayar dilunasi setelah pelayanan dan verifikasi identitas." : "Setelah Booking dibuat, bayar DP dalam 15 menit. Booking dikonfirmasi setelah pembayaran diverifikasi backend."}</p><p className="catatan">Tarif/promo mengikuti katalog aktif Admin. Harga dan slot diperiksa kembali saat konfirmasi.</p></>}
      </fieldset>
      <div className="cw-wizard-actions">{langkah > 0 && <button type="button" className="tombol sekunder" disabled={sibuk || memeriksa} onClick={() => { aturLangkah(n => n - 1); aturGalat(""); }}>Kembali</button>}{langkah < 4 ? <button type="button" className="tombol utama" disabled={sibuk || memeriksa || muatSlot && langkah > 0} onClick={() => void selanjutnya()}>{memeriksa ? "Memeriksa harga..." : "Lanjut"}<Ikon nama="panah" ukuran={17}/></button> : <button type="button" className="tombol utama" disabled={sibuk || !harga} onClick={konfirmasi}>{sibuk ? "Membuat Booking..." : harga?.bebasDp ? "Konfirmasi Booking Member" : "Buat Booking & Lanjut DP"}</button>}</div>
    </div>
  </section>;
}
