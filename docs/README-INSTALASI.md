> Dokumen historis dipindahkan dari `barberbarbar-customer/README-INSTALASI.md`. Hasil dan path bukti mencatat waktu audit; panduan aktif ada di README utama dan laporan cleanup. Arsip privat kini berada di luar Stage 2.

# BARBER BARBAR Customer

Aplikasi Project 5 React Native + Expo + TypeScript, Android-first. Backend
tetap Project 3; tidak ada server atau database baru. Repository publik:
https://github.com/umarmaulanazakaria/barberbarbar-customer

## Preview di HP

1. Gunakan Node >=22.13 dan npm. Terpasang Expo57.0.29, RN0.86.3, React19.2.3.
   Dependency dikunci package-lock.json. Jika belum terpasang, `npm.cmd ci`.
2. Salin `.env.example` menjadi `.env`. Atur hanya EXPO_PUBLIC_API_URL.
   Contoh LAN saat audit: `http://192.168.1.9:3000`. IP dapat berubah.
   Jangan memasukkan Server Key, Client Key, JWT_SECRET atau DATABASE_URL.
3. Pada `../barberbarbar/server`, jalankan `npm.cmd run build`, kemudian
   `npm.cmd start`, menggunakan konfigurasi backend existing. Jangan reset DB.
4. Di folder customer: `npm.cmd start -- --lan`. Scan QR menggunakan Expo Go
   Android yang mendukung SDK57. HP dan komputer harus satu Wi-Fi; pastikan
   firewall/VPN/AP isolation tidak menghalangi API. Tidak ada software Android
   atau aturan firewall yang dipasang otomatis.
5. Setelah mengubah URL, mulai ulang Metro. localhost/127.0.0.1 pada HP bukan
   alamat komputer. Emulator Android existing dapat memakai10.0.2.2:3000.

Jika Expo Go belum mendukung SDK57, evaluasi dev build secara terpisah. Export
tidak membuktikan preview perangkat. ADB dan emulator tersedia pada komputer
audit, tetapi tidak ada perangkat/AVD. Tidak membuat atau memasang emulator.

## Fitur dan aturan

Pada langkah jadwal, tekan field **Pilih Barber** untuk membuka daftar pencarian.
Ketik nama (huruf besar/kecil tidak dibedakan), lalu pilih barber atau
**Barber siapa saja**. Modal menutup setelah pemilihan; tombol tutup/Back tidak
mengubah pilihan. Pilihan tetap pada draf saat maju/mundur. Flow reschedule
memakai komponen yang sama. Jika barber tidak lagi tersedia, pilih ulang;
ketersediaan jadwal final tetap diperiksa server. Tidak ada konfigurasi atau
dependency baru untuk dropdown ini.

- Empat tab Beranda, Booking, Riwayat, Akun; logo asli, navy/slate/indigo, terang.
- Katalog publik layanan/barber aktif, tanpa promosi atau identitas palsu.
- Login email/telepon, daftar201 atau pengaitan202 pending admin. JWT CUSTOMER
  di SecureStore. Profil hanya nama/alamat sendiri; email/telepon tidak diedit.
- Logout menghapus sesi/cache/socket dan navigasi privat. Respons sesi lama
  tidak dapat mengembalikan akun sebelumnya.
- Membership NON_MEMBER/PENDING_APPROVAL/ACTIVE/INACTIVE; pengajuan sekali tanpa
  formulir. Reaktivasi INACTIVE hanya admin; nonmember tetap dapat booking.
- Booking tiga langkah, multiservice/qty, barber tertentu/tersedia, kalender dan
  menit WIB. Pilihan tetap ada ketika kembali dari login; katalog/benefit dimuat
  ulang. Estimasi diskon ACTIVE10% dan DP50%; nilai final selalu backend.
- Buka09–23WIB, layanan selesai<=23; hari sama jeda>=3jam, rolling14hari.
  Kapasitas/overlap diperiksa backend saat create; tidak ada API daftar slot live.
- Detail/riwayat sendiri: layanan booking awal, tagihan terbaru, timeline,
  pembayaran, refund dan ringkasan/invoice final.
- Cancel sesuai state backend. Reschedule sesudah penolakan usulan barber pada
  round aktif, tanpa transaksi/refund pending, lalu konfirmasi ulang. Tidak ada
  tindakan check-in/start/complete oleh customer.
- Jika create timeout/5xx, periksa Riwayat sebelum mengajukan kembali agar tidak
  membuat booking ganda. App tidak otomatis mengulang mutasi.

## Pembayaran Sandbox

Nominal berasal dari database. App membuka redirect_url HTTPS
app.sandbox.midtrans.com/snap/ lewat expo-web-browser; tidak memakai snap.js di
React Native. URL/token hanya di memori fungsi, tidak masuk storage/log/nav.
Backend memakai ulang Snap pending existing. Callback tidak pernah mengkredit
ledger; saat kembali/foreground sync pending milik customer dan refetch REST.
DP sesudah CONFIRMED; pelunasan sesudah COMPLETED + DP sah. Perubahan layanan
mengikuti tagihan server terbaru. Invoice final hanya mengikuti hasil server.

Untuk pengujian nyata, Notification URL Sandbox harus menunjuk backend publik
`/midtrans/notifications` dengan tunnel aktif. Jangan memakai URL tunnel lama
tanpa verifikasi. Tidak mengaktifkan Production. Acuan:
[Midtrans redirect](https://docs.midtrans.com/docs/snap-snap-integration-guide),
[Expo57 WebBrowser](https://docs.expo.dev/versions/v57.0.0/sdk/webbrowser/).
Suite MOCK tidak membuktikan checkout HP/Sandbox nyata. Refund PROCESSING belum
berhasil. Refund historis Rp2.000 belum final dan tidak di-retry di task ini.

## Password

Pengiriman email/WhatsApp pemulihan belum tersedia; UI menyatakan hal ini.
Customer sungguhan belum dapat memulihkan password otomatis. Form kode hanya
untuk kode sah dari pengelola pada simulasi developer. Endpoint publik tidak
mengembalikan kode. Tidak ada endpoint change-password dengan password lama;
UI memakai bantuan pemulihan. Jangan mencetak atau membagikan token.

## Pengujian developer dan cadangan

```
npm.cmd run typecheck
npx.cmd expo install --check
npm.cmd run build:android
npm.cmd test
```

`npm test` menjalankan tes dropdown11 kelompok dengan adapter hook/native host,
kemudian tes integrasi customer14 kelompok. Uji adapter bukan device UI.
Tes integrasi membutuhkan backend terkompilasi pada folder sebelah dan DB localhost.
Credential backend dibaca hanya di memori; provider Midtrans diganti MOCK dalam
proses. Fixture dummy acak dibersihkan terarah dan snapshot22 model dibandingkan.
Jalankan suite DB berurutan. SecureStore/AppState menggunakan adapter; bukan
bukti UI/native storage. Tidak ada key/token/checkout yang dicetak.

Android export di dist adalah bundle Hermes, bukan APK. Dist diabaikan Git/ZIP.
`scripts/buat-cadangan.ps1` membuat ZIP source tracked setelah commit bersih dan
memverifikasi SHA256 setiap entry terhadap source. Manifest/checksum di luar repo.
Tidak memasukkan .env, dump, node_modules, .git atau file historis Project3/4.

Audit lengkap di F12-AUDIT.md. Device UI, navigasi klik, native checkout,
responsif, aksesibilitas dan E2E lintas aplikasi menunggu perangkat/F13.
Advisory toolchain masih ada; tidak menjalankan audit fix --force. Master PRD
v2.0 lengkap belum tersedia. Belum menyatakan aplikasi siap Production.
