# BARBER BARBAR — Customer Web

**Aplikasi Customer utama dan satu-satunya target pengembangan Customer aktif**, memakai React + TypeScript + Vite. React Native Customer dipensiunkan sebagai arsip, tanpa menghapus source, perubahan lokal atau data pusat. Mobile Staff tetap React Native + Expo. Tidak memakai runtime Expo/React Native Web.

Keputusan dan audit migrasi: [Customer Web utama](../barberbarbar/docs/CUSTOMER-WEB-UTAMA.md).

## Status aktual

Alur Web -> backend aktual -> DP Midtrans Sandbox -> konfirmasi otomatis -> operasional -> pelunasan Sandbox -> invoice final telah lulus dengan provider resmi pada booking3745. DP dan pelunasan masing-masing Rp10.000 berstatus settlement; balance Rp0, tepat dua kredit dan satu invoice. Replay webhook tidak menggandakan pembayaran.

**Backend kompatibel aktif di port3000 dengan database existing yang sama.**21 migration tersedia (termasuk tracking), tanpa migration ulang. Data existing tetap terlindungi. Booking uji lama yang ditunda sudah CANCELLED tanpa kredit/invoice. Rincian bukti provider, checkpoint dan regresi ada pada laporan backend `server/WEB-FINALIZATION.md`. Perangkat Android belum tersedia; pengujian UI Mobile Staff/Native tetap DEFERRED.

## Menjalankan

```powershell
npm.cmd run dev
```

Buka http://127.0.0.1:5175/. Proxy `/api` menuju backend Project 3 di port3000. Default UI memakai alur guest nyata; API backend memerlukan `GUEST_BOOKING_ENABLED=true` setelah migration. Public katalog tetap `GET /public/services`.

Variabel publik opsional pada `.env.local` Web saja:

```dotenv
VITE_API_BASE_URL=/api
VITE_GUEST_BOOKING_ENABLED=true
```

`VITE_*` masuk browser: jangan isi Server Key, credential atau JWT. Jangan menyalin `.env` Native/backend. Backend memakai credential Sandbox existing melalui konfigurasi proses; Client Key publik untuk Snap dikirim backend, bukan di-hardcode.

Aplikasi publik hanya memakai API nyata: tidak menyediakan katalog demo, hasil pratinjau, simulasi pembayaran, atau invoice contoh. Seluruh14 tes awal tetap dipertahankan melalui `tests/fixtures/AppPratinjau.tsx`, yang hanya dimuat pada Vite mode `test`. Build publik tidak menyertakan kontrol atau hasil demo. Menonaktifkan API tidak menghasilkan sukses palsu.

Pengujian booking3745 memakai Hair Wash existing Rp20.000, identitas uji, checkout Web resmi dan simulator BCA milik Midtrans Sandbox. Aplikasi publik tidak memiliki tombol simulasi atau sukses palsu. Invoice nyata lulus reload, browser context baru dan lima viewport. Login/daftar operasional/check-in/barber/start/complete diuji melalui API operator existing; tidak diklaim sebagai pengujian perangkat Mobile.

## Alur nyata

1. Pilih layanan/jumlah, tanggal/jam WIB, nama dan nomor HP tanpa login atau pilihan barber.
2. Submit hanya ID layanan/jumlah/jadwal/data kontak/UUID idempotency. Backend menghitung harga/DP, memeriksa kapasitas dan membuat nomor booking serta token.
3. Booking baru menggunakan sesi HttpOnly pada browser. Setelah DP sah, simpan kode tracking rahasia. Kode dikirim hanya melalui body POST tracking, bukan URL. Link pribadi lama tetap didukung sebagai kompatibilitas historis.
4. Countdown menggunakan deadline dan offset waktu server, bukan membuat deadline baru ketika membuka checkout.
5. Snap Sandbox dimuat hanya setelah klik pembayaran, dengan token pembayaran dari backend. Pending/success/error/close callback hanya memicu pembacaan ulang; bukan bukti lunas.
6. Backend memverifikasi status provider, mengonfirmasi guest tepat waktu, dan mengirim perubahan kepada Staff. Web melakukan polling REST, foreground dan online recovery.
7. Staff memakai endpoint existing untuk check-in, menentukan barber, layanan dan selesai. UI Web membaca item aktual jika layanan diubah.
8. Pelunasan memakai balance backend; invoice hanya tersedia saat COMPLETED+PAID melalui endpoint privat final.

Guest tidak diberi akun atau membership dari nomor HP. Kode tracking dan akses legacy adalah credential: jangan dibagikan. PII tidak disimpan di storage/cookie browser atau log. URL menggunakan hash dan meta Referrer-Policy no-referrer. Token hanya berupa hash SHA-256 pada backend dan berlaku 30 hari setelah layanan.

Jika respons create hilang, retry mempertahankan UUID agar tidak menggandakan booking; jangan menganggap sesi pasti sudah diterima. Tanpa DP sah, hold berakhir dalam 15 menit. Setelah DP sah, kode tracking dapat memulihkan sesi. Jika kode dan sesi hilang, pemulihan ADMIN wajib verifikasi identitas.

## Pengujian

```powershell
npm.cmd run typecheck
npm.cmd run build
npm.cmd test
npm.cmd run test:guest
```

- `npm test`: 14 tes UI lama, mode demo dan API fixture; lima ukuran layar.
- `test:guest`: browser Chrome existing ke backend aktual di localhost3185 dan PostgreSQL khusus fixture. Tidak mengintersep API booking; Snap.js/provider diganti mock. Backend fixture harus dijalankan dahulu dari source asli backend dengan `scripts/serve-guest-browser.mjs`, hanya pada database bernama `bb_guest_20261016_*`.
- Test server frontend port5186 menggunakan `BARBER_API_PROXY_TARGET=http://127.0.0.1:3185`; variabel ini hanya konfigurasi Vite development, bukan browser secret.
- Backend runner fixture harus mengisi DATABASE_URL khusus test, JWT test dan credential merchant dummy. Jangan menjalankan script fixture pada database existing. Jangan mengaktifkan endpoint kontrol fixture pada aplikasi utama; script memisahkan server test dari app.

Dependency tidak ditambah pada pekerjaan integrasi ini. Tidak mengunduh browser. Tidak mengklaim tes perangkat atau provider PASS dari mock.

## File integrasi

Baru: `src/layanan/guest.ts`, `src/layanan/snap.ts`, `src/komponen/BookingTamu.tsx`, `tests/guest-live.spec.ts`, `playwright.guest.config.ts` dan `docs/GUEST-INTEGRATION.md`.

Diubah: App, form existing, façade kontrak, config Vite/Playwright/TypeScript, index referrer policy, environment example, npm script dan dokumentasi. Desain, katalog, validasi, estimasi dan seluruh tes UI awal dipertahankan. `docs/REACT-WEB-AUDIT.md` adalah snapshot UI awal commit5afa3b6.

Native arsip dan Web masih tercatat sebagai dua worktree dalam satu repository Git. Native pada `barberbarbar-customer`, Web pada branch `feat/project5-react-web-mobile-first`. Backend pusat pada source asli `barberbarbar`, branch `feature/project5-integration`. Semua perubahan hanya commit lokal. **Tidak ada push, PR, merge atau deploy Production.**

## Validasi aplikasi Customer utama

```powershell
node node_modules/@playwright/test/cli.js test --config playwright.customer-principal.config.ts
```

Suite ini membuka UI aplikasi aktual (bukan entry pratinjau), mengintersepsi seluruh API, memeriksa delapan viewport 320?1440 px, status pembayaran, tracking dan invoice. Tidak membuat transaksi provider atau record database. Suite guest/tracking menggunakan backend dan PostgreSQL fixture untuk membuktikan integrasi kontrak. Lint belum dikonfigurasi.
