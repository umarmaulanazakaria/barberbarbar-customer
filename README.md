# BARBER BARBAR — Customer Mobile App

Aplikasi customer untuk melihat layanan, mengajukan membership, membuat booking, dan mengikuti status layanan serta pembayaran. Aplikasi memakai backend pusat yang juga digunakan Web Management dan Mobile Staff.

Project untuk **tugas kuliah, pembelajaran Fullstack, portofolio, dan demonstrasi lokal**; bukan aplikasi Production. Hosting berbayar bukan kebutuhan demo. Mobile berhasil menurut laporan pengguna (**USER-REPORTED**); bukti rinci UI native/checkout Android belum lengkap. Email nyata, refund historis dan advisory tetap dicatat jujur. Lihat [acceptance demo](https://github.com/umarmaulanazakaria/barberbarbar/blob/feature/project5-integration/docs/DEMO-ACCEPTANCE.md).

## Teknologi dan fitur

React Native 0.86, Expo SDK 57, React 19, TypeScript, React Navigation, React Query, Axios, SecureStore, Socket.IO, DateTimePicker, dan WebBrowser.

- Registrasi/login CUSTOMER, profil, perubahan identitas/kata sandi dengan verifikasi kata sandi saat ini, serta formulir lupa/reset password.
- Katalog layanan/barber aktif tanpa login; membership melalui persetujuan ADMIN.
- Booking multiservice dengan jumlah, searchable dropdown barber, reschedule, pembatalan, dan persetujuan usulan barber.
- Status DP/pelunasan, checkout Midtrans, refund, riwayat, serta invoice sendiri.
- Realtime dan sinkronisasi ketika aplikasi kembali aktif.

Navigasi utama: **Beranda, Booking, Riwayat, Akun**. Searchable dropdown dipakai pada booking baru dan reschedule. Desain navy, slate, indigo, dan latar terang tetap dipertahankan.

```text
App.tsx / index.ts       Entry aplikasi
src/layar/              Layar customer
src/komponen/           Komponen termasuk PilihanBerpencarian
src/                    Navigasi, sesi, API, tipe, dan aturan antarmuka
assets/                 Logo dan ikon
scripts/                Test dropdown, detail, draft, dan integrasi
docs/audit/             Bukti serta batas pengujian historis
```

## Menjalankan lokal

Siapkan Node.js/npm sesuai lockfile (baseline Node 24), backend Project 3, dan perangkat yang kompatibel dengan Expo SDK 57.

```powershell
npm.cmd ci
```

Salin `.env.example` menjadi `.env` dan isi `EXPO_PUBLIC_API_URL` dengan `http://<IP-LAN-KOMPUTER>:3000`. Gunakan IP backend saat ini; `localhost` pada HP menunjuk HP sendiri. Credential server/Midtrans tidak boleh masuk variabel publik atau bundle. File `.env` diabaikan Git.

```powershell
npm.cmd start -- --lan --port 8082
```

Gunakan LAN yang sama dengan komputer dan pindai QR memakai Expo Go yang mendukung SDK 57. Bila tidak kompatibel, gunakan development build sesuai SDK dan toolchain Android yang disiapkan terpisah. Restart Metro setelah perubahan environment.

## Booking, membership, dan pembayaran

Customer dapat booking tanpa membership. Pengajuan customer memakai benefit 10% setelah ADMIN menyetujui; membership INACTIVE diaktifkan kembali melalui flow ADMIN existing. Backend menentukan harga, snapshot diskon, slot, status, dan nominal transaksi.

Checkout dibuka melalui WebBrowser. Kembalinya browser tidak menetapkan PAID; aplikasi mengambil status dari backend setelah webhook terverifikasi. Pengujian provider memakai Sandbox; Production belum diaktifkan. Refund memerlukan ADMIN, dan PROCESSING belum berarti dana dikembalikan.

Jadwal ulang dapat mengubah layanan, jumlah, barber dan waktu; backend menentukan ulang durasi, harga dan kecukupan DP menggunakan diskon booking. Perubahan perlu konfirmasi ulang.

Pengiriman email nyata masih nonaktif sampai provider disetujui/dikonfigurasi. Backend sudah memiliki template dan kontrak transport yang diuji mock; jangan menganggap email telah terkirim. Tautan pemulihan memakai `barberbarbar-customer://reset-password` dengan token pada fragment, membuka formulir tanpa menjalankan reset otomatis. Scheme baru memerlukan development/native build yang diregistrasikan; jangan menganggap Expo Go otomatis mendukungnya. Lihat [panduan Expo](https://docs.expo.dev/linking/into-your-app/).

Perubahan email/telepon/kata sandi mencabut sesi lama dan meminta login kembali. Password/kode tidak disimpan ke storage atau log. Laporan umum pengguna bahwa mobile berhasil dicatat; acceptance per skenario dan checkout langsung Android tetap memerlukan bukti spesifik. Detail hasil terkini ada di [penutupan acceptance](https://github.com/umarmaulanazakaria/barberbarbar/blob/feature/project5-integration/docs/FINAL-ACCEPTANCE-CLOSURE.md).

## Pengujian

```powershell
npm.cmd run typecheck
npx.cmd expo install --check
npm.cmd run build:android
npm.cmd test
node scripts/test-pemulihan-customer.mjs
```

Suite menguji searchable dropdown, detail, draft reschedule, sesi, booking, pembayaran, membership, dan realtime melalui adapter lokal. Runner di backend menambah regresi HTTP/database dan browser Web. Ekspor Hermes berbeda dari acceptance UI Android. Output `dist`, `.expo`, cache, dan environment tidak dilacak Git.

## Repository terkait

- [Web Management + Backend](https://github.com/umarmaulanazakaria/barberbarbar)
- [Mobile ADMIN/STAFF](https://github.com/umarmaulanazakaria/barberbarbar-mobile)
- [Customer App](https://github.com/umarmaulanazakaria/barberbarbar-customer)

Advisory dependency, refund historis Rp2.000, email recovery, dan sejumlah keputusan PRD masih terbuka bersama pengujian perangkat. Periksa [audit dan batas rilis](docs/audit/F14-AUDIT.md) sebelum penerapan.

## Demonstrasi dan portofolio

[Menjalankan ekosistem](https://github.com/umarmaulanazakaria/barberbarbar/blob/feature/project5-integration/docs/PANDUAN-JALANKAN-DEMO.md) | [Presentasi](https://github.com/umarmaulanazakaria/barberbarbar/blob/feature/project5-integration/docs/PANDUAN-PRESENTASI.md) | [Naskah](https://github.com/umarmaulanazakaria/barberbarbar/blob/feature/project5-integration/docs/NASKAH-DEMO.md) | [Review Git/PR](https://github.com/umarmaulanazakaria/barberbarbar/blob/feature/project5-integration/docs/PORTFOLIO-RELEASE-REVIEW.md).

### Screenshot perangkat

Belum ada screenshot native terverifikasi dalam repository. [Panduan capture](docs/screenshots/README.md) menentukan layar yang diperlukan. Tidak memakai screenshot Web atau gambar fiktif sebagai pengganti Android.
