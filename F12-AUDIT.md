# Audit aplikasi mobile customer

## Patch UX pemilihan barber, 15 Oktober 2026

Baseline fae408253cdeddb72a68bb831915a781c4bbcf56, branch
feature/project5-integration, working tree Project5 bersih sebelum patch.
Pemilihan barber pada booking baru dan reschedule kini satu field tertutup yang
membuka modal bawah dengan pencarian nama, bukan deretan tombol panjang.
Komponen reusable src/komponen/PilihanBerpencarian.tsx memakai Modal/FlatList/
KeyboardAvoidingView/Pressable/TextInput serta icon/safe-area yang sudah ada.
Tidak memasang dependency baru; package/lock dependency tetap sama. package.json
hanya menambahkan suite komponen sebelum tes integrasi customer pada npm test.

Nama barber berasal dari useBarber → GET /public/barbers, whitelist id/nama aktif.
Tidak ada data nama hardcode atau metadata rating/foto. Kontrak belum mempunyai
endpoint daftar eligibility menurut jadwal; kapasitas/overlap tetap validasi
backend saat submit. Patch tidak membuat algoritma eligibility baru.
"Barber siapa saja" tetap null; barber spesifik tetap ID number. Controlled value
disimpan pada draf parent sehingga maju/mundur tidak menghapus pilihan. Pilihan
yang hilang dari katalog tidak diganti diam-diam ke null: field memberi pesan
pilih ulang, dan ringkasan tidak menyebutnya barber siapa saja. Validasi submit
existing tetap berlaku. Multi-service/qty, harga/member/durasi/lifecycle/payment/
refund/scheduler/auth/realtime tidak diubah.

Modal: pencarian trim dan case-insensitive, radio selected, tutup setelah memilih,
reset pencarian saat dibuka kembali, opsi umum tetap tersedia ketika mencari,
"Barber tidak ditemukan", loading/error/retry, disabled, tombol close/backdrop
dan onRequestClose Android. Close/cancel tidak memanggil perubahan nilai. Warna
navy/indigo existing; area sentuh >=48, daftar virtual, maxHeight responsif,
padding safe-area, keyboardShouldPersistTaps handled, drag dismiss dan
KeyboardAvoidingView Android height/iOS padding. Ini konfigurasi source yang
diperiksa, belum bukti keyboard/native accessibility bekerja di HP.

| Pemeriksaan patch | Hasil |
|---|---|
| TypeScript strict |PASS|
| Expo dependency check |PASS, dependencies up to date|
| Android Hermes export |PASS,1072 modul, sekitar2.8MB,37assets|
| Komponen aktual TSX dengan adapter hook/native host |11 kelompok PASS|
| Open/close/back/cancel/search/no-result/select/change/null |PASS adapter|
| Selected controlled setelah remount; API ID/null pada payload |PASS adapter + integrasi|
| Loading/error/retry/disabled/barber hilang |PASS adapter|
| Integrasi API customer + multiservice/qty + reschedule |14 kelompok PASS, provider MOCK|
| Cleanup fixture |22 model domain existing identik|
| Tap/back/keyboard/scroll panjang/safe area/navigasi native |DEFERRED: ADB devices dan emulator -list-avds kosong|

scripts/test-pilihan-barber.mjs mengeksekusi komponen TSX aktual dengan adapter
state/host; bukan renderer React Native atau device. Tes memastikan kedua flow
memakai komponen yang sama. Navigasi tab/gesture native belum diuji; controlled
state dan export saja tidak cukup untuk mengklaim device PASS. Tidak mengulang
pembayaran Sandbox nyata. Temuan dependency/refund/PRD/device dari baseline di
bawah tetap terbuka; patch UI tidak memperbaiki advisory dependency tersebut.

Perubahan hanya Project5: komponen baru, layar Booking, dua script tes,
package.json, README dan audit ini. Project3 staged historis Prisma dan perubahan
format lokal Project4 src/layanan/booking.ts tetap dipertahankan, tidak diedit/
stage/commit. src/layar/LayarTambahPelanggan.tsx tetap dilindungi.
ZIP lama beserta manifest/checksum dipertahankan di backup-arsip sebelum arsip
utama diperbarui. ZIP final lengkap mengikuti commit patch; checksum seluruh
entry diverifikasi oleh script existing dan dicatat pada manifest eksternal.
Hash commit/checksum final dilaporkan terpisah agar dokumen tidak merujuk commit
dirinya. Tidak force push, merge main, migration atau perubahan credential.

15 Oktober 2026, Asia/Jakarta. **F12 PARSIAL untuk acceptance akhir perangkat.**
Source aplikasi Expo Android benar-benar dibuat dan terhubung ke backend Project3.
Pengujian API/controller dan bundle lulus; tidak mengklaim seluruh interaksi UI,
native storage, checkout HP atau E2E lintas tiga aplikasi sudah lulus.

## Acuan, batasan dan persetujuan

Source auth/public/member/booking/lifecycle/payment/refund/realtime Project3 dan
pola session/API/navigation/asset Project4 diperiksa bersama audit F2–F11.
Master PRD v2.0 lengkap tidak ditemukan; memakai prompt lengkap terbaru,
keputusan pengguna dan kontrak source, bukan mengklaim validasi PRD yang absen.
Baseline Project3 35f99717d61fbf330573245ff55a8e3110d771ac; Project4
dd38dc82a486bbd0d8b5d2283b16a267a20be083. F7 refund historis belum final,
F10 browser E2E dan F11 device E2E tetap DEFERRED.

Pengguna menyetujui folder/repo customer terpisah, bundle instalasi dependency,
konfigurasi API publik dan pembuatan repository GitHub publik. Repository benar:
https://github.com/umarmaulanazakaria/barberbarbar-customer,
branch feature/project5-integration. Credential GitHub hanya dipakai di memori.
Tidak menambah DB/server aplikasi, schema, migration, Android software, native
Midtrans SDK, Firebase, push notification atau autentikasi operator baru.

## Dependency aktual

| Paket | Versi terpasang |
|---|---|
| Expo / React Native / React |57.0.29 /0.86.3 /19.2.3|
| Navigation native /stack /tabs |7.4.1 /7.18.10 /7.19.2|
| React Query / Axios / Socket.IO client |5.102.8 /1.20.0 /4.8.4|
| SecureStore / Crypto / WebBrowser /StatusBar |57.0.4 /57.0.4 /57.0.3 /57.0.1|
| DateTimePicker / SafeArea / Screens |9.1.0 /5.7.0 /4.26.2|
| Vector icons / TypeScript / esbuild |15.1.1 /6.0.3 /0.28.2|

Expo range ~57.0.28 menyelesaikan patch57.0.29 pada instalasi baru, bukan upgrade
SDK. `expo install --check` PASS. Instalasi npm melaporkan23 advisory, sedangkan
audit lengkap JSON berikutnya46 paket terdampak:0 critical,39 high,7 moderate.
Rantai akar braces<=3.0.3 (GHSA-vfj7-8cjw-p6xm), node-forge<=1.4.0
(GHSA-86w9-cpqp-85rv), uuid<11.1.1 (GHSA-w5hq-g745-h8pq). Audit tidak menawarkan
fix kompatibel otomatis pada akar dependency langsung. Banyak dampak berasal
dari tooling Expo/Metro; tidak mengartikan semua paket sebagai46 exploit runtime
terpisah, dan tidak menyatakan aman Production. Tidak menjalankan force fix,
override major atau instalasi di luar paket yang disetujui. Perlu evaluasi
advisory/toolchain lanjutan sebelum rilis.

## Desain dan struktur file

Logo/icon asli disalin dari Project3 client/public. Tidak membuat logo baru.
Token warna dipisahkan src/tema.ts: navy#0F172A, slate#1E293B, indigo#4F46E5,
lightindigo#818CF8, background#F6F8FC, putih, muted#64748B, border#E2E8F0.
Empat bottom tab berikon: Beranda/Booking/Riwayat/Akun. Kartu, tombol besar,
safe area, scroll, maxWidth680, error/retry/loading/empty dan teks Indonesia.
Visual responsif/native keyboard/accessibility belum disahkan tanpa perangkat.

- App.tsx/index.ts/navigasi.ts: root Expo, stack/tab, recovery dan lifecycle.
- src/komponen/ui.tsx dan tema.ts: komponen serta token UI.
- src/tipe.ts: DTO whitelist customer, bukan model operator/Prisma langsung.
- src/layanan/api.ts: katalog/auth/profile/member/booking/payment/refund REST.
- sesi.ts/cache.ts/kueri.ts: SecureStore serial, versi sesi, cache dan hooks.
- aturan.ts: estimate, WIB/range/time validation, izin UI dan whitelist checkout.
- realtime.ts: satu socket per sesi, dedup, target invalidation dan fallback.
- src/layar: Beranda, Booking/JadwalUlang, Riwayat, Akun, Autentikasi,
  DetailBooking; tidak mengimpor source Project4 sebagai dependency runtime.
- scripts/test-customer.mjs: harness aktualAPI/SDK dengan adapter native/provider
  MOCK; scripts/buat-cadangan.ps1: backup source/checksum seluruh entry.
- package/lock, tsconfig/app.json, assets, .gitignore/.env.example,
  README-INSTALASI.md dan audit ini melengkapi source runnable.

## Pemetaan UI → API → backend → database

| UI | API existing | Sumber/otoritas backend |
|---|---|---|
| Beranda/layanan/barber |GET /public/services, /public/barbers|Whitelist Layanan/Barber aktif|
| Login/daftar |POST /auth/customer/login, /register|AkunPelanggan/Pelanggan atau PermohonanPengaitanAkun202|
| Profil |GET/PATCH /auth/customer/me|JWT CUSTOMER, pemilik; nama/alamat saja|
| Bantuan password |POST /auth/customer/forgot-password, /reset-password|Hash PasswordResetToken; delivery belum ada|
| Member |GET /customer/membership; POST /customer/membership/requests|Membership/PermohonanMembership, admin memutuskan|
| Booking/draf |GET/POST /customer/bookings; GET /:id|Booking/ItemBooking, harga/durasi/diskon/DP dan kapasitas server|
| Pengganti barber |POST /:id/barber-proposals/:proposalId/accept atau reject|UsulanBarberBooking own-only|
| Reschedule/cancel |POST /:id/reschedule, /cancel|Round/DP/refund/time/state diperiksa backend|
| Tagihan/invoice/history payment |GET /:id/payments|TransaksiPembayaranBooking/Pesanan/InvoiceBooking|
| Checkout |POST /:id/payments/dp, /online-settlement|Kunci idempotensi; nominal DB, Snap Sandbox server|
| Rekonsiliasi |POST /customer/payments/:id/sync|Get Status server, bukti provider/ledger atomik|
| Refund sendiri |GET /customer/refunds|PermohonanRefundBooking; read-only customer|

`:id` booking pada baris customer berada di `/customer/bookings/:id`.
Tidak mengirim owner/status/nominal/diskon frontend pada create/checkout.
Tidak ada room yang dipilih client atau endpoint operator dipakai layar customer.

## Perilaku dan keamanan

- Login email/telepon, register201 vs pengaitan202 dengan pesan menunggu admin.
  Tidak memalsukan akun aktif. JWT disimpan SecureStore; role tidak dikirim di
  handshake. Verifikasi /me memisahkan CUSTOMER dan operator.
- Cache privat memakai versi sesi; request privat menolak response versi lama.
  Logout/401 menutup socket, membersihkan cache/credential, reset navigasi privat.
  Restore/login lama tidak menghidupkan sesi sesudah logout; write diserialkan.
- Booking tiga langkah menjaga pilihan saat kembali/login; katalog/member
  direfresh. Harga/durasi/DP merupakan estimasi sampai hasil server. ACTIVE10%
  meskipun diskon operator custom25%; INACTIVE tetap bisa booking reguler.
- Validasi minute-level WIB09–23, same-day>=3jam dan rolling14hari. Kalender
  memakai tanggal/jam pilihan lalu payload offset+07:00; server final kapasitas.
- Mutex mutasi, tidak auto retry. Timeout/5xx create yang tidak pasti mengarahkan
  pemeriksaan riwayat, bukan mengirim booking berulang tanpa pemeriksaan.
- Cancel/reschedule/consent dibatasi UI sesuai kontrak dan tetap diverifikasi
  backend. Reschedule perlu proposal REJECTED round aktif; tidak membuat hak
  reschedule umum yang tidak tersedia. Refund tidak dapat disetujui customer.
- Snap redirect HTTPS host/path Sandbox di-whitelist; tidak ada Server Key,
  Snap token di storage/log/navigation, atau perubahan PAID dari callback.
  DP hanya CONFIRMED; settlement COMPLETED. Invoice hanya mengikuti REST server.
- Socket auth {token} saja, tujuh event customer, tidak berlangganan event ADMIN
  account-link.changed. connect/realtime.ready/foreground refetch; perubahan
  menginvalidasi topik terkait; dedup bounded300, fallback30detik ketika aktif.
  Cleanup timer/listener/socket pada pergantian sesi/unmount. NOTIFY bukan outbox;
  REST tetap otoritatif. Pending payment sync hanya milik customer, bukan retry
  refund otomatis. Tidak menampilkan PROCESSING sebagai refund berhasil.
- `.env` diabaikan Git; hanya URL API publik dalam .env.example. IP Wi-Fi saat
  audit192.168.1.9, port3000. Tidak membaca credential server ke laporan/ZIP.

## Hasil pengujian aktual

| Pengujian | Hasil |
|---|---|
| TypeScript customer strict/noUnused |PASS|
| Expo dependency check |PASS|
| Android Hermes export |PASS;1071 modul, sekitar2.8MB,37assets; bukan APK/device|
| Katalog publik/aktif/whitelist |PASS API aktual|
| Register201/pengaitan202, login email/telepon, own-profile |PASS API aktual|
| CUSTOMER ditolak operator, akun lain list/detail/payment/refund |PASS;IDOR404|
| Empat status membership, duplicate/ADMIN decision,10% snapshot |PASS|
| Multiservice/qty/WIB/boundaries/create/DP beforeconfirm guard |PASS|
| Proposal accept/reject, reschedule→pending, cancel |PASS|
| Checkout contract/idempotency/whitelist/pending tanpa kredit |PASS provider MOCK|
| DP evidence/lifecycle/settlement/replay/balance0/PAID/final invoice |PASS provider MOCK|
| Refund pending ADMIN/no false-credit/own-only |PASS provider MOCK; tidak ada refund provider dikirim|
| Satu socket sesi actual SDK/auth-only/reconnect/foreground/background |PASS controller + AppState adapter|
| SecureStore serial/persistence/logout/stale restore/response lama |PASS adapter; native storage belum diuji|
| Forgot umum/reset dummy valid satu kali/oldpassword+JWT revoked |PASS API;delivery tetap tidak tersedia|
| Cleanup fixture customer |PASS;22 model domain existing identik|
| Navigasi tap/tab/back/auth-return, keyboard/responsive/accessibility |DEFERRED perangkat; source/typecheck/export saja|
| Checkout browser pada HP dan transaksi Sandbox baru dari app ini |DEFERRED; tidak dijalankan/diklaim dari MOCK|
| UI lintas Project3/4/5 E2E |DEFERRED F13|

Harness customer mencatat14 kelompok PASS. Provider sepenuhnya MOCK dan
credential test acak hanya di memori; tidak menyentuh refund historis. ADB
devices kosong, emulator -list-avds kosong. Tidak ada uji visual/device yang
dapat dipastikan. Tidak menganggap build/typecheck sebagai bukti UX berhasil.

Regresi terpisah setelah cleanup: F2 foundation, reset11, public4, membership12,
booking15, operational11, payment8, scheduler26, realtime23 (termasuk Midtrans12
MOCK) PASS. Backend build/Prisma validate PASS;18 migration up-to-date tanpa
deploy. Build Web PASS dengan warning ukuran chunk existing; Web harness9 PASS.
Mobile strict TypeScript PASS, harness10 PASS dan snapshot22 model identik.

Satu percobaan Mobile awal overlap fixture backend tidak dipakai sebagai bukti
snapshot. Percobaan terpisah kemudian menemukan race harness subscriber saat
mock api.get, yang dapat membuat tes restore macet. Proses harness saja
dihentikan; fixture satu suite diverifikasi identitas dummy-nya lalu dibersihkan
dalam transaksi dengan perbandingan22 model selain fixture. Harness ditambal
untuk menghentikan subscriber sebelum mock, diuji ulang10 PASS. Perubahan
Project4 terbatas scripts/test-integrasi-mobile.mjs dan F11-AUDIT.md; commit
ae639155cd24629358b95fae2deb8418efbb11bb. Tidak mengubah alur operasional.

## Status historis Midtrans dan batasan tetap

F7 membuktikan DP nyataRp5.000, pelunasanRp5.000, webhook/replay/invoice/lifecycle
sampai COMPLETED sebelumnya. Tidak mengulang dan tidak menyebut bukti itu sebagai
pengujian aplikasi mobile baru. Refund historisRp2.000/F7-REFUND-48 belum final;
Get Status terakhir14Oktober2026 settlement tanpa entri refund/bank_confirmed_at.
Tidak meminta refund/retry baru, menambah ledger refund atau merekonstruksi
fixture lama. F7 tetap PARSIAL. F10 browser/F11 perangkat tetap DEFERRED.

Fondasi forgot/reset belum dapat dipakai customer sungguhan tanpa delivery.
Endpoint change-password terautentikasi belum tersedia, tidak diciptakan diam-diam.
Tidak ada fitur slot availability API, push notification, APK distribusi atau
Production. Advisory dependency belum ditangani dengan upgrade tidak disetujui.

## Git, perlindungan dan ZIP

Preview lokal saat penutupan: backend3000 dan Metro8082 LISTENING pada0.0.0.0;
HTTP LAN192.168.1.9 untuk katalog dan manifest Expo keduanya200. Manifest
menyatakan host192.168.1.9:8082 dan nama BARBER BARBAR Customer. Ini membuktikan
host lokal siap, bukan reachability dari HP. Helper backend preview dijalankan
dengan SCHEDULER_BOOKING_AKTIF=false pada proses saja agar tidak memproses data
existing tanpa kebutuhan; server/.env tidak disunting. Metro berjalan CI mode
untuk preview stabil, tanpa watch. Untuk sesi pengembangan normal, hentikan
helper lalu ikuti npm start pada README. URI ExpoGo: exp://192.168.1.9:8082.

Project5 commit memakai judul Bahasa Indonesia tanpa prefix/nomor fase dan push
ke origin/feature/project5-integration; hash final/upstream dibuktikan laporan
akhir dan manifest ZIP eksternal agar audit tidak merujuk hash commit dirinya.
Project4 perbaikan harness juga commit/push; tidak amend commit lama, force push
atau merge main. Project3 tidak ada perubahan baru; staged historis
server/src/lib/prisma.ts tetap blob6594970f6d44cfae4ac899cd83f14f6991dce0a0.
Project4 src/layar/LayarTambahPelanggan.tsx tidak diedit/stage/commit.

ZIP BARBERBARBAR-F12-CUSTOMER-APP.zip di Stage2 hanya source Project5 tracked,
package/lock/assets/README/audit/.env.example/scripts. Script membandingkan
ukuran/SHA256 setiap entry dengan source dan menulis daftar entry+checksum serta
commit pada `.zip.manifest.json`, checksum arsip pada `.zip.sha256`. ZIP hanya
backup, tidak perlu di-replace pada workspace ini. Tidak memasukkan .git,
node_modules/dist/.expo/.env/dump/credential/file historis Project3/4.

F13 perlu perangkat Android/ExpoGo kompatibel, validasi UI/gesture/keyboard,
restart/nativeSecureStore, jaringan/foreground/reconnect, klik lintas aplikasi,
checkout Sandbox nyata dari customer dan pemeriksaan refund final independen.
Keterbatasan ini membuat acceptance akhir tetap PARSIAL.
