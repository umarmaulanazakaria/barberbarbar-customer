# BARBER BARBAR — Customer Web

Aplikasi customer aktif memakai React 19, TypeScript, Vite dan Socket.IO. Customer mengakses dari browser desktop atau HP; tidak memerlukan runtime React Native. Nama repository GitHub tetap barberbarbar-customer.

## Arsitektur

Tiga aplikasi memakai satu API Express/Prisma dan PostgreSQL yang sama. Admin memakai desain **Admin Minimal**, Customer memakai **mobile-first**, Staff memakai **Minimal V3**. Harga, slot, kelayakan Member, keputusan operasional dan pembayaran ditetapkan backend. Socket.IO hanya memberi sinyal refetch REST.

- [Admin Web dan Backend](https://github.com/umarmaulanazakaria/barberbarbar/tree/main)
- [React Native Staff](https://github.com/umarmaulanazakaria/barberbarbar-mobile/tree/main)
- [Customer Web](https://github.com/umarmaulanazakaria/barberbarbar-customer/tree/main)

## Fitur mobile-first

- Katalog layanan aktif melalui API publik, tanpa login.
- Wizard Layanan → Barber → Jadwal → Identitas/Member → Checkout.
- Slot berasal dari backend: satu booking 45 menit, tidak dikalikan qty layanan.
- Reguler mengisi nama/HP dan membayar DP 50% dalam 15 menit.
- Member memasukkan nomor numerik atau legacy tanpa mengetik nama/HP. Backend memeriksa masa berlaku, manfaat dan batas booking gratis aktif; verifikasi Kartu Member + KTP dilakukan di toko.
- Nomor booking, sesi privat HttpOnly dan kode tracking rahasia.
- Pembayaran Snap Sandbox, status backend, deadline aktual, pelunasan dan invoice final.
- Realtime scoped sesi dengan fallback REST/polling; tidak menjadikan event/callback sebagai bukti lunas.

## Struktur

```text
src/App.tsx       Routing hash dan entry aplikasi publik
src/komponen/     Katalog, wizard, detail, pembayaran dan tracking
src/layanan/      Kontrak HTTP, Snap, idempotensi dan realtime
src/domain.ts     Tipe, format dan validasi presentasi
tests/            Tes UI dan kontrak integrasi
docs/             Panduan dan bukti historis
```

## Instalasi dan menjalankan

```powershell
npm.cmd ci
npm.cmd run dev
```

Customer: http://localhost:5175. Backend harus berjalan di port 3000 dan Admin di 5173. Dari HP gunakan http://IP_LAPTOP:5175 pada jaringan yang sama. Vite bind 0.0.0.0 dan proxy /api serta /socket.io menuju backend; tidak perlu hardcode IP backend di browser atau ADB Reverse. Proxy development bukan konfigurasi deployment.

Environment Web opsional, hanya nilai publik:

```dotenv
VITE_API_BASE_URL=/api
VITE_GUEST_BOOKING_ENABLED=true
```

Backend mengaktifkan GUEST_BOOKING_ENABLED, kunci tracking dan origin yang sesuai secara privat. Tidak mengisi Server Key pada Web. Client Key publik dan transaksi Snap disediakan backend. Untuk deployment, sediakan reverse proxy/API origin serta WebSocket yang benar dan HTTPS; vite preview bukan server Production.

## Pembayaran dan privasi

Harga/DP/balance/deadline berasal dari database. Callback success Snap hanya meminta sinkronisasi; backend harus memverifikasi status provider, referensi dan nominal. CONFIRMED tidak ditetapkan oleh frontend. Invoice final memerlukan syarat backend termasuk penyelesaian dan pelunasan. Simpan kode tracking pribadi; jangan mencantumkannya di screenshot, log, issue atau URL publik. Data demo dan fixture tes tidak menjadi bukti pembayaran nyata. Entry publik tidak menyediakan tombol sukses palsu.

## Pemeriksaan

```powershell
npm.cmd run typecheck
npm.cmd run build
node node_modules/@playwright/test/cli.js test --config playwright.customer-principal.config.ts
```

Audit terbaru: build snapshot commit dan working tree lulus; suite Customer utama lulus delapan viewport dengan seluruh API diintersepsi. Test backend terpisah membuktikan integrasi fixture/provider mock. Suite lama yang mengasumsikan formulir satu halaman atau larangan pilihan barber perlu diselaraskan sebelum digunakan sebagai gerbang rilis.

## Batas verifikasi

Audit 18 Oktober 2026 memisahkan snapshot commit dari WIP lokal. TypeScript / build bukan bukti seluruh alur UI atau pembayaran provider. Lihat [laporan audit pusat](https://github.com/umarmaulanazakaria/barberbarbar/blob/main/docs/audit/AUDIT-SISTEM-TERKINI.md). Pengujian integrasi memakai PostgreSQL fixture dan provider mock; bukan settlement Sandbox baru. Perangkat Android/iOS dan printer fisik belum diuji dalam audit ini. Advisory dependency masih terbuka. **Belum siap dinyatakan rilis penuh; bukan Production.**

[Kontrak dan catatan integrasi terbaru](docs/INTEGRASI-TERKINI.md). Bukti settlement historis tetap di dokumentasi backend; tidak diklaim sebagai pengujian provider baru atau seluruh kontrak Member terbaru. Source Native lama bukan target pengembangan aktif dan riwayat/arsip historis tidak dihapus dalam audit ini.

## Versi demo pada main

Branch `main` memuat snapshot fitur terbaru yang digabungkan dengan tetap mempertahankan riwayat. Verifikasi rilis memakai build/TypeScript dan fixture/mock lokal; tidak membuat transaksi nyata atau mengubah data operasional. Jalankan demo dengan konfigurasi lokal dan Midtrans Sandbox existing. Pengujian perangkat HP, printer fisik dan pembayaran provider langsung tidak diklaim lulus dari pengujian ini. WIP lokal tetap terpisah dari versi GitHub.
