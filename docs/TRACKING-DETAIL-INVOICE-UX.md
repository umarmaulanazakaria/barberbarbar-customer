# Pelacakan, detail kunjungan, timeline dan invoice mobile

Audit dan implementasi pada source asli, 17 Oktober 2026. Baseline branch `feat/project5-react-web-mobile-first`, HEAD `f3ad8b181e7075ac9167b32c1a5772ff7a169a7d`. Hasil ini mencakup UI browser dan integrasi provider **MOCK**, bukan bukti pembayaran provider nyata atau kesiapan Production.

## Temuan dan perubahan

Tracking existing sudah memakai POST dan cookie sesi HttpOnly. Tidak ada kode rahasia yang perlu dimasukkan ke URL. Normalisasi tetap di backend existing: hapus spasi/tanda hubung, uppercase, validasi `BB` diikuti 32 karakter heksadesimal. Frontend meneruskan input tanpa mengubah formatnya sendiri. Error salah/dicabut tetap umum; pesan rate limit dan koneksi dari REST client dipertahankan. Link sesi browser sekarang langsung menuju Detail, tanpa meminta kode ulang. Pemulihan kode hilang tetap melalui verifikasi identitas Admin.

CSS existing memakai `font: inherit` dan dapat menimpa ukuran input menjadi 13px. Selector yang lebih spesifik kini memastikan input 16px, fokus jelas, tombol minimal 48px, serta warna indigo yang konsisten. Navigasi bawah disembunyikan ketika input tracking fokus pada perangkat sentuh agar ruang input tidak tertutup. Ini verifikasi browser/CSS, bukan pengujian keyboard Android fisik.

Detail kini memprioritaskan status operasional, jadwal WIB dan pelanggan, diikuti barber/durasi, layanan aktual beserta qty, harga dan subtotal. Nomor booking tetap sederhana dan dapat membungkus. Nominal tagihan berasal dari `total`, `nominalDpAwal`, `jumlahDibayar`, dan `balance` pada respons backend; tidak dihitung ulang dari frontend. Label DP awal terverifikasi tidak menyatakan transaksi pending sudah diterima. Warna didampingi teks status.

Renderer baru `DetailInvoice.tsx` memisahkan presentasi dari controller existing. Perubahan pada `BookingTamu.tsx` dibatasi pada delegasi renderer, petunjuk sesi berakhir, serta pengesahan invoice. Renderer fallback lama tidak dihapus pada pekerjaan ini agar perubahan historis file tersebut tetap utuh. Ringkasan/Pembayaran tetap memakai komponen sebelumnya.

Backend existing memproyeksikan `dikonfirmasiPada`, `checkInPada`, `layananMulaiPada`, dan `layananSelesaiPada`. Timeline menampilkan hanya kejadian yang mempunyai waktu tersebut. Status terkini ditampilkan terpisah, termasuk pembatalan. Tidak membuat waktu DP, pembatalan, pelunasan, atau riwayat transisi dari perkiraan status. Pelayanan `COMPLETED` dijelaskan terpisah dari pembayaran `PAID`.

Backend juga sudah mengirim `transaksi[].dibayarPada`; tipe client lama belum mendeklarasikannya. Presenter membacanya sebagai properti opsional bertipe `unknown`, memvalidasi string tanggal, dan menampilkannya hanya untuk transaksi berhasil. Tidak membuat endpoint, mengubah kontrak, atau mengganti tipe dengan `any`. DP/pelunasan/refund tetap ditampilkan satu per transaksi dengan nominal/status masing-masing, bukan dijumlah ulang di UI.

Invoice baru memuat logo, nomor/tanggal resmi WIB, pelanggan, layanan/qty, subtotal, total invoice, DP awal terverifikasi, total pembayaran dan saldo. Rincian nominal pelunasan ada pada riwayat transaksi. Dokumen final memerlukan `COMPLETED`, `PAID`, saldo nol, invoice nonsementara, dan sukses GET endpoint invoice yang sah. Tidak menambah generator PDF/cetak/download; fitur tersebut tidak ditemukan pada UI existing ini.

Pengujian menemukan race existing: sesudah GET current menolak sesi, perubahan dependency invoice dapat memulai permintaan invoice baru, sehingga respons yang datang terlambat bisa menampilkan kembali data lama. Effect kini menunggu detail sesi yang sah dan tetap memeriksa versi akses. Setelah sesi dicabut, tidak memulai permintaan invoice tanpa detail; respons lama diabaikan. Tombol perbarui pada halaman invoice juga mengulang pengesahan resmi setelah detail berhasil dimuat, sehingga error sementara dapat dipulihkan tanpa menganggap ringkasan PAID sebagai izin invoice.

Socket.IO, room tamu, debouncing event, polling 10 detik, online/visibility refresh, cleanup, checkout, nominal DP, deadline, webhook dan ledger tidak diubah. Tidak ada perubahan backend, database, dependency, environment, Admin, atau Staff.

## Screenshot browser BEFORE / AFTER

Semua gambar memakai data sintetis lewat intercept API; tidak memuat customer asli, sesi asli, credential atau kode tracking produksi. BEFORE diambil sebelum source UI diubah. AFTER final memakai UI yang diuji, termasuk pengujian snapshot Git index secara terpisah. Screenshot full-page menyertakan navigasi fixed pada posisi viewport awal; konten tetap dapat digulir. Timeline juga diambil sebagai gambar bagian tersendiri.

| Lebar | Tracking | Detail | Timeline | Invoice |
|---|---|---|---|---|
|320|[BEFORE](screenshots/detail-ux/before-320-tracking.png) / [AFTER](screenshots/detail-ux/after-320-tracking.png)|[BEFORE](screenshots/detail-ux/before-320-detail.png) / [AFTER](screenshots/detail-ux/after-320-detail.png)|[BEFORE](screenshots/detail-ux/before-320-timeline.png) / [AFTER](screenshots/detail-ux/after-320-timeline.png)|[BEFORE](screenshots/detail-ux/before-320-invoice.png) / [AFTER](screenshots/detail-ux/after-320-invoice.png)|
|375|[BEFORE](screenshots/detail-ux/before-375-tracking.png) / [AFTER](screenshots/detail-ux/after-375-tracking.png)|[BEFORE](screenshots/detail-ux/before-375-detail.png) / [AFTER](screenshots/detail-ux/after-375-detail.png)|[BEFORE](screenshots/detail-ux/before-375-timeline.png) / [AFTER](screenshots/detail-ux/after-375-timeline.png)|[BEFORE](screenshots/detail-ux/before-375-invoice.png) / [AFTER](screenshots/detail-ux/after-375-invoice.png)|
|390|[BEFORE](screenshots/detail-ux/before-390-tracking.png) / [AFTER](screenshots/detail-ux/after-390-tracking.png)|[BEFORE](screenshots/detail-ux/before-390-detail.png) / [AFTER](screenshots/detail-ux/after-390-detail.png)|[BEFORE](screenshots/detail-ux/before-390-timeline.png) / [AFTER](screenshots/detail-ux/after-390-timeline.png)|[BEFORE](screenshots/detail-ux/before-390-invoice.png) / [AFTER](screenshots/detail-ux/after-390-invoice.png)|

Total 24 screenshot. Review visual mencakup layout sempit, tab yang tidak memotong kata Pembayaran, perataan angka, logo invoice, timeline dan input tracking. Ini bukan audit aksesibilitas lengkap.

## Hasil pengujian

| Skenario wajib | Hasil | Bukti pengujian |
|---|---|---|
|1. Kode valid|PASS|Browser fixture REST nyata dan UI MOCK; format lowercase/tanpa tanda hubung diterima backend existing|
|2. Kode salah|PASS|Error umum, tidak menampilkan detail customer|
|3. Kode revoked|PASS|UI MOCK penolakan tracking; integrasi fixture mencabut sesi lewat event dan REST|
|4. Sesi guest expired|PASS|HTTP404 menghapus data/kode/invoice; respons invoice terlambat tidak mengembalikan data|
|5. Akses melalui sesi sah|PASS|Link sesi langsung Detail; browser baru dengan cookie sah memulihkan booking|
|6. Isolasi A/B|PASS|Dua context/cookie, booking dan room berbeda; settlement A tidak memicu refetch/status B; parameter nomor booking tidak mengganti sesi B; invoice B tetap ditolak|
|7. Multi layanan/qty|PASS|Qty2, harga dan subtotal backend; 14 item panjang pada delapan viewport|
|8. Barber belum ditentukan|PASS|Fallback tanpa membuat identitas barber|
|9. Barber telah ditentukan|PASS|Nama dari respons setelah pembaruan|
|10. Check-in sampai selesai|PASS|Integrasi Socket.IO dan transisi melalui polling; timestamp dari respons|
|11. COMPLETED belum PAID|PASS|Status layanan selesai tetap terlihat; invoice tidak tersedia|
|12. DP dengan sisa tagihan|PASS|Saldo backend dan link pembayaran existing, pending tidak menjadi lunas|
|13. Pelunasan/saldo nol|PASS|Provider MOCK fixture, dua kredit ledger; replay tidak mengkredit ulang|
|14. Invoice belum berhak|PASS|Penolakan endpoint, saldo positif, dan pengesahan gagal tidak menampilkan nomor invoice|
|15. Invoice final|PASS|Nomor resmi dari fixture backend, qty, tagihan, waktu transaksi, status lunas|
|16. Reconnect/fallback|PASS|Socket pause, polling 10 detik, reconnect dua kali, REST refetch dan cleanup|
|17. Reload detail|PASS|Data dan empat kejadian tetap tampil; tidak menduplikasi timeline|
|18. HTTP LAN|PASS browser desktop|Origin HTTP Wi-Fi aktual; tiga tes kompatibilitas, mutasi booking diintercept|
|19. Nama/kode/item panjang|PASS|Nama/nomor tanpa spasi, kode panjang, 14 layanan; tidak bocor ke URL|
|20. Delapan viewport|PASS|Tabel berikut; tidak ada horizontal overflow|

Pengujian status expired memakai respons HTTP404 yang sama dengan penolakan sesi existing. Pengujian revoked tracking UI memakai respons penolakan MOCK; integrasi nyata fixture membuktikan pencabutan sesi existing. Tidak mengklaim perubahan masa berlaku atau mekanisme otorisasi backend.

| Lebar CSS px | Tracking | Detail/timeline | Invoice | Nama panjang/14 item |
|---|---|---|---|---|
|320|PASS|PASS|PASS|PASS|
|360|PASS|PASS|PASS|PASS|
|375|PASS|PASS|PASS|PASS|
|390|PASS|PASS|PASS|PASS|
|412|PASS|PASS|PASS|PASS|
|430|PASS|PASS|PASS|PASS|
|768|PASS|PASS|PASS|PASS|
|1440|PASS|PASS|PASS|PASS|

Perintah dari folder Customer Web, dependency existing, tanpa instalasi:

```powershell
npm.cmd run typecheck
npm.cmd run build
npx.cmd playwright test --config playwright.detail-ux.config.ts
npx.cmd playwright test --config playwright.payment-ux.config.ts
npx.cmd playwright test --config playwright.mobile-ux.config.ts
npx.cmd playwright test --config playwright.customer-principal.config.ts
npx.cmd playwright test
```

Integrasi memakai `playwright.realtime.config.ts` dan `playwright.tracking.config.ts` dengan server fixture existing pada3185, Customer5186, Admin5188. Runner memverifikasi nama database fixture terpisah dari DB utama, memakai provider MOCK, dan melaporkan `PASS browser fixture cleanup24`. Jangan menjalankan fixture terhadap database aplikasi utama. Tes LAN memakai `LAN_TEST_ORIGIN` yang dideteksi dari Wi-Fi, bukan hardcode source.

Rekap: **69 kasus browser unik PASS**: detail21, pembayaran16, mobile11, aplikasi utama1, pratinjau14, HTTP LAN3, realtime2, tracking1. Kasus yang gagal selama pengembangan (font13px, race invoice, ekspektasi whitespace Rupiah, visibilitas kode) sudah diperbaiki dan pengujian terkait diulang. Tidak ada FAIL/BLOCKED tersisa pada cakupan browser ini. TypeScript dan production build working tree **PASS**. Snapshot Git index fitur juga diuji TypeScript/build dan21 kasus detail agar commit tidak bergantung pada perubahan historis.

**NOT RUN:** Android fisik, keyboard perangkat fisik, transaksi Midtrans provider nyata, audit aksesibilitas lengkap. Tidak ada klaim Production-ready.

## File dan perlindungan Git

- Baru: `src/komponen/DetailInvoice.tsx`, `src/detail-ux.css`, `tests/detail-ux.spec.ts`, `playwright.detail-ux.config.ts`, laporan ini dan24 PNG.
- Diubah: `src/main.tsx`, `playwright.config.ts`, `tests/realtime-live.spec.ts`.
- Delta fitur saja pada file historis: `src/komponen/BookingTamu.tsx`, `src/komponen/LacakBooking.tsx`. Formatting/perubahan historis keduanya tidak dimasukkan commit.

18 file historis tetap unstaged setelah commit. Index Customer Web semula kosong; hanya delta fitur direview dan di-stage secara eksplisit. Snapshot hash file tracked tiga project diambil sebelum edit. Perubahan P3/Staff harus tetap identik, termasuk index Prisma, commit launcher P3 `f9cc109`, dan `src/layanan/booking.ts` Staff. Tidak melakukan push, merge, PR, reset, atau membuat worktree/branch baru. Hash commit final dilaporkan setelah commit lokal dibuat.

## Batas data dan keputusan berikutnya

Guest API ini tidak memproyeksikan riwayat kejadian lengkap, alasan/waktu pembatalan, maupun waktu perubahan setiap status pembayaran. Timeline tidak menebaknya; timestamp pembayaran tidak ditampilkan jika respons lama tidak menyediakannya. Durasi total booking dan durasi per layanan ditampilkan sesuai proyeksi existing, tanpa menjumlah ulang ketika item layanan berubah. Bila kelak dibutuhkan audit trail lengkap, alasan pembatalan, dokumen unduhan, atau durasi agregat operasional baru, perlu lingkup backend/bisnis tersendiri. Tidak ada endpoint atau generator baru pada pekerjaan ini.
