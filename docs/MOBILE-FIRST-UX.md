# Penyempurnaan Beranda dan Form Booking

17 Oktober 2026. Customer Web pada folder asli, branch `feat/project5-react-web-mobile-first`. Commit lokal saja; tidak push/merge/PR/deploy.

## Audit dan perubahan

Baseline Git Web `7c7bd97`: 18 perubahan historis, index kosong. Project3 tetap pada commit launcher lokal `f9cc109` dengan tiga perubahan historis (Prisma staged); Staff satu perubahan historis. Hash source dan index diambil sebelum implementasi. Seluruh file historis, termasuk `guest.ts`, `style.css`, `BookingTamu.tsx`, `LacakBooking.tsx` dan tes tracking existing, tidak diedit atau dimasukkan commit UI.

Screenshot awal berasal dari browser Chrome pada Web existing5175 dengan context kosong, katalog backend aktual, tanpa membuat booking. Seluruh delapan viewport diaudit. Temuan: hero mobile setinggi sekitar843px pada375/390 karena ilustrasi350px; katalog terdorong jauh ke bawah. Teks bantuan10–11px dan tombol jumlah38×35px kurang nyaman untuk sentuhan. CTA putih pada indigo existing memiliki kontras3,61:1. State terpilih dan label/input sudah tersedia, sehingga dipertahankan.

Beranda: ilustrasi dekoratif tetap ada pada desktop, disembunyikan pada layar di bawah768px. Hero dan kartu katalog dipadatkan, CTA **Mulai Booking** dan **Lacak Booking** dibuat bersebelahan. Link katalog tetap memilih layanan dari backend. Logo/tagline/navy/slate/indigo dipertahankan. Indigo CTA diperdalam dalam palet existing: kontras teks normal5,39:1, hover4,64:1. Logo/header dan navigasi seluler memiliki target sentuh minimum44px. Status aktif Booking pada navigasi tidak lagi ikut menyala ketika membuka Lacak.

Form: input16px/tinggi48px, label14px dan bantuan13px; kontrol jumlah minimum44×44px, perubahan jumlah diumumkan melalui output polite. Panel, jarak dan label layanan dirapikan. Fieldset dikunci selama request, selain tombol submit existing yang tetap disabled; kunci idempotency dan guard parent tidak diubah. Tidak ada sticky CTA baru. Pada perangkat touch, navigasi bawah disembunyikan sementara ketika input teks/tanggal/jam fokus; konten tetap dapat digulir. Emulasi viewport pendek bukan bukti keyboard perangkat fisik.

Semua CSS tambahan ada di `src/mobile-ux.css`, dimuat setelah stylesheet historis. Selector utama dibatasi Beranda/Form; header/nav bersama mendapat penyesuaian kecil dan diuji regresi pada halaman lain. Tidak ada dependency baru, pengubahan API/domain/backend, atau fitur contoh pada aplikasi publik.

## Perbandingan nyata

Screenshot full-page berisi katalog publik aktual yang sama dan form kosong. Navigasi fixed tampak pada posisi viewport awal dalam full-page capture; interaksi gulir dan CTA diuji terpisah.

| Viewport | Beranda sebelum → sesudah | Form sebelum → sesudah |
|---|---|---|
|375px|[sebelum](screenshots/mobile-ux/before-375-home.png) → [sesudah](screenshots/mobile-ux/after-375-home.png)|[sebelum](screenshots/mobile-ux/before-375-form.png) → [sesudah](screenshots/mobile-ux/after-375-form.png)|
|390px|[sebelum](screenshots/mobile-ux/before-390-home.png) → [sesudah](screenshots/mobile-ux/after-390-home.png)|[sebelum](screenshots/mobile-ux/before-390-form.png) → [sesudah](screenshots/mobile-ux/after-390-form.png)|

Tinggi Beranda375:3286→2271px;390:3286→2274px (sekitar31% lebih pendek). Hero375:843→358px;390:843→360px. Form375:2475→2582px;390:2456→2560px. Form sengaja sedikit lebih panjang untuk teks/target sentuh yang lebih mudah dibaca dan digunakan. Desktop1440 tetap mempertahankan komposisi hero existing.

## Pengujian aktual

| Viewport CSS px | Beranda/Form | State halaman lain |
|---|---|---|
|320|PASS tanpa overflow; form/qty/validasi|PASS tanpa overflow|
|360|PASS tanpa overflow; form/qty/validasi|PASS tanpa overflow|
|375|PASS tanpa overflow; form/qty/validasi|PASS tanpa overflow|
|390|PASS tanpa overflow; form/qty/validasi|PASS tanpa overflow|
|412|PASS tanpa overflow; form/qty/validasi|PASS tanpa overflow|
|430|PASS tanpa overflow; form/qty/validasi|PASS tanpa overflow|
|768|PASS tanpa overflow; form/qty/validasi|PASS tanpa overflow|
|1440|PASS tanpa overflow; form/qty/validasi|PASS tanpa overflow|

State audit: ringkasan/detail, pending DP, expired, konfirmasi/kode tracking, pelunasan, invoice, error, sesi berakhir dan loading, masing-masing pada8viewport (API diintersepsi, bukan transaksi nyata). Beranda juga diuji loading/error/kosong. Input nama/telepon, fokus error dekat field, tanggal lampau, layanan panjang, multi-layanan/qty dan pembatalan pilihan lulus. Tidak mengklaim slot tersedia realtime.

- PASS TypeScript check dan production build.
- PASS11 kasus suite `playwright.mobile-ux.config.ts`, termasuk72 kombinasi state/viewport dan emulasi touch390×420.
- PASS1 kasus aplikasi utama existing: delapan viewport, otoritas pembayaran, tracking/invoice.
- PASS14 kasus UI fixture existing; entry fixture tidak dimuat dalam UI publik.
- PASS1 kasus reliability existing: timeout/503, double-submit, retry mempertahankan draf dan UUID yang sama.
- PASS2 kasus browser integrasi: realtime guest lintas Staff/Admin, fallback REST/reconnect/revocation, tracking, booking, DP50%/15menit, lifecycle, pelunasan dan invoice dengan provider MOCK. Backend/PostgreSQL fixture terisolasi; cleanup24model lulus. Tidak membuat transaksi provider nyata atau mengubah data bisnis.
- PASS fallback UUID kriptografis existing, tanpa Math.random.
- PASS pengukuran kontras CTA aktual5,39:1, pemeriksaan hash preservasi dan Git diff.
- NOT RUN keyboard/datepicker/checkout/Android fisik; emulator touch/viewport tidak menggantikan perangkat nyata.

Percobaan audit state pertama tidak memuat ulang dokumen ketika hash rute sama; harness diperbaiki menjadi reload fixture unik dan gate loading deterministik. Penambahan CTA tracking juga mengungkap locator lama yang ambigu; nama aksesibel CTA utama diperjelas tanpa mengedit tes tracking historis. Suite akhir lulus. Tidak memperbaiki tes dengan melemahkan otorisasi atau pembayaran.

## File paket perubahan

`src/App.tsx`, `src/main.tsx`, `src/komponen/FormBooking.tsx`, `src/mobile-ux.css`, `playwright.config.ts`, `playwright.mobile-ux.config.ts`, `tests/mobile-ux.spec.ts`, laporan ini dan8screenshot pada `docs/screenshots/mobile-ux/`. Pemisahan config mencegah tes UI produksi tercampur dengan entry fixture preview.

Perintah dari folder Web: `npm.cmd run build`, `node node_modules/@playwright/test/cli.js test --config playwright.mobile-ux.config.ts`, kemudian config principal/reliability/realtime/tracking existing secara berurutan. Suite realtime/tracking harus memakai backend3185 dan database fixture sesuai README; jangan dijalankan ke database bisnis.

## Temuan tahap berikutnya

Ringkasan/Pembayaran masih memuat banyak panel informasi; lanjutkan hirarki nominal tagihan, DP sah, sisa bayar dan deadline tanpa mengubah keputusan provider. Detail/Invoice memiliki tipografi lama yang lebih kecil daripada form baru; tinjau sebagai paket berikutnya dengan regresi pembayaran. Kode tracking panjang membutuhkan pembacaan/salin manual yang jelas; fallback clipboard existing dipertahankan dan lulus integrasi. Tablet768 masih memakai dekorasi hero existing yang tinggi; dapat dipadatkan pada iterasi tablet tersendiri. Belum ada klaim audit aksesibilitas menyeluruh atau performa perangkat nyata.
