# BARBER BARBAR — Customer Web

React Web mobile-first yang hidup berdampingan dengan React Native Customer. Tidak memakai runtime Expo/React Native Web. Source Native original dan Mobile Staff tidak diubah.

## Status aktual

Alur Web -> backend aktual -> PostgreSQL fixture -> DP -> auto confirmation -> proses Staff -> pelunasan -> invoice telah diuji, dengan provider Midtrans MOCK. Ini bukan bukti transaksi Sandbox/provider nyata.

**Database existing belum dimigrasikan dan backend development port3000 belum dialihkan.** Aktivasi memerlukan persetujuan sesuai laporan backend `GUEST-MIGRATION-PLAN.md`. Sampai itu dilakukan, request guest ke backend original dapat mengembalikan belum tersedia; jangan menyatakan rollout selesai.

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

Mode UI demo terisolasi tetap tersedia melalui layanan demo atau `VITE_GUEST_BOOKING_ENABLED=false`, dengan label Demo UI. Seluruh 14 tes awal tetap dipertahankan. Demo tidak membuat booking/transaksi, sementara alur publik nyata hanya menampilkan nomor/status dari backend.

## Alur nyata

1. Pilih layanan/jumlah, tanggal/jam WIB, nama dan nomor HP tanpa login atau pilihan barber.
2. Submit hanya ID layanan/jumlah/jadwal/data kontak/UUID idempotency. Backend menghitung harga/DP, memeriksa kapasitas dan membuat nomor booking serta token.
3. Simpan link pribadi `#/b/<token>`. Token tidak dikirim pada URL request backend atau parameter Midtrans, hanya header Guest. Link dapat dibuka ulang pada browser/tab lain sampai masa akses berakhir. Nomor booking bukan password.
4. Countdown menggunakan deadline dan offset waktu server, bukan membuat deadline baru ketika membuka checkout.
5. Snap Sandbox dimuat hanya setelah klik pembayaran, dengan token pembayaran dari backend. Pending/success/error/close callback hanya memicu pembacaan ulang; bukan bukti lunas.
6. Backend memverifikasi status provider, mengonfirmasi guest tepat waktu, dan mengirim perubahan kepada Staff. Web melakukan polling REST, foreground dan online recovery.
7. Staff memakai endpoint existing untuk check-in, menentukan barber, layanan dan selesai. UI Web membaca item aktual jika layanan diubah.
8. Pelunasan memakai balance backend; invoice hanya tersedia saat COMPLETED+PAID melalui endpoint privat final.

Guest tidak diberi akun atau membership dari nomor HP. Link pribadi adalah credential bearer: jangan dibagikan. PII tidak disimpan di storage/cookie browser atau log. URL menggunakan hash dan meta Referrer-Policy no-referrer. Token hanya berupa hash SHA-256 pada backend dan berlaku 30 hari setelah layanan.

Jika respons create hilang, retry dengan UUID sama tidak menggandakan booking tetapi tidak dapat memulihkan token yang belum diterima. Belum ada recovery link; tanpa checkout, hold tersebut expired dalam 15 menit. Simpan tautan segera setelah diterbitkan.

## Pengujian

```powershell
npm.cmd run typecheck
npm.cmd run build
npm.cmd test
npm.cmd run test:guest
```

- `npm test`: 14 tes UI lama, mode demo dan API fixture; lima ukuran layar.
- `test:guest`: browser Chrome existing ke backend aktual di localhost3185 dan PostgreSQL khusus fixture. Tidak mengintersep API booking; Snap.js/provider diganti mock. Backend fixture harus dijalankan dahulu dari worktree backend dengan `scripts/serve-guest-browser.mjs`, hanya pada database bernama `bb_guest_20261016_*`.
- Test server frontend port5186 menggunakan `BARBER_API_PROXY_TARGET=http://127.0.0.1:3185`; variabel ini hanya konfigurasi Vite development, bukan browser secret.
- Backend runner fixture harus mengisi DATABASE_URL khusus test, JWT test dan credential merchant dummy. Jangan menjalankan script fixture pada database existing. Jangan mengaktifkan endpoint kontrol fixture pada aplikasi utama; script memisahkan server test dari app.

Dependency tidak ditambah pada pekerjaan integrasi ini. Tidak mengunduh browser. Tidak mengklaim tes perangkat atau provider PASS dari mock.

## File integrasi

Baru: `src/layanan/guest.ts`, `src/layanan/snap.ts`, `src/komponen/BookingTamu.tsx`, `tests/guest-live.spec.ts`, `playwright.guest.config.ts` dan `docs/GUEST-INTEGRATION.md`.

Diubah: App, form existing, façade kontrak, config Vite/Playwright/TypeScript, index referrer policy, environment example, npm script dan dokumentasi. Desain, katalog, validasi, estimasi dan seluruh tes UI awal dipertahankan. `docs/REACT-WEB-AUDIT.md` adalah snapshot UI awal commit5afa3b6.

Dua worktree tetap satu repository: Native pada `barberbarbar-customer`, Web pada branch `feat/project5-react-web-mobile-first`. Backend pada branch terpisah `feat/guest-booking-web-compatible`. Semua perubahan hanya commit lokal. **Tidak ada push, PR, merge atau deploy Production.**
