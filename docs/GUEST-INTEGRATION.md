# Integrasi guest Web — laporan aktual

16 Oktober 2026 (WIB). Melanjutkan commit lokal `5afa3b684269f2523a0bf1e162e77fb5f580db05`, tanpa membuat ulang UI atau menghapus tes lama.

## Hasil

Pembaruan finalisasi16 Oktober: kontrol demo dihapus dari entry publik; App lama hanya di tests/fixtures dan mode test. Riwayat pembayaran ditampilkan dari ledger. Booking3745 berhasil end-to-end dengan provider resmi: total Rp20.000, DP dan pelunasan masing-masing Rp10.000 settlement, otomatis CONFIRMED, operasional COMPLETED, PAID, balance0 dan satu invoice. Replay webhook/sync mempertahankan tepat dua kredit dan satu AUTO_CONFIRM_GUEST. Booking3742/3744 yang sebelumnya ditunda sudah CANCELLED tanpa kredit/invoice.

Pengujian: backend build/Prisma valid,12 guest/Native,15 booking/kasir,17 payment/refund dan27 scheduler PASS. Web build37 modules,14 tes lama pada mode test dan2 tes aplikasi publik/API fixture PASS. Provider suite regresi tersebut adalah MOCK; bukti provider nyata terpisah pada booking3745, memakai Snap dan simulator BCA resmi Midtrans tanpa intersepsi gateway. Invoice aktual lulus reload/browser baru/lima viewport. Backend menormalkan DTO daftar/detail Staff/Native ke UTC setelah ketidaksesuaian waktu terbukti. Rincian checkpoint dan bukti: laporan backend `WEB-FINALIZATION.md`.

| Pemeriksaan | Hasil |
| --- | --- |
| TypeScript dan Vite build | PASS, 37 modules |
| 14 tes browser UI awal | PASS, dipertahankan pada mode demo terisolasi |
| Web ke API aktual + PostgreSQL fixture sampai invoice | PASS; provider/Snap MOCK |
| Nomor booking/token server, tanpa akun/barber, multi layanan | PASS |
| Deadline DB15 menit, nominal backend, callback bukan konfirmasi | PASS |
| Reload/tab lain link pribadi | PASS |
| Staff check-in/start/complete, pelunasan dan invoice final | PASS pada fixture |
| Replay settlement, dua kredit DP+pelunasan dan satu invoice | PASS |
| Token tidak berada pada URL request backend | PASS |
| Lima lebar viewport UI lama dan invoice nyata fixture | PASS: 320,375,430,768,1440 |
| Midtrans provider Sandbox nyata | PASS booking3745: DP dan pelunasan settlement, dua kredit, satu invoice |
| Android Native/Staff device | DEFERRED, bukan klaim dari API/browser |
| Migration/aktivasi database existing | PASS, disetujui dan diterapkan; backend kompatibel aktif pada3000 |

UI nyata menampilkan status backend, terpisah dari route demo. Seluruh API booking memakai header Guest dan cache no-store; referrer no-referrer. Tidak mengirim harga, diskon, pilihan barber atau nominal checkout dari form. Tidak menyimpan token/PII ke storage atau log. Token pribadi berada pada hash link browser agar tidak menjadi URL request HTTP backend. Client Key Snap publik dibaca dari respons backend; Server Key tidak pernah masuk frontend.

Polling hanya memuat ulang REST. Setelah intent pending, pengecekan provider dijadwalkan terbatas; foreground/online memuat ulang. Snap callback success/pending/error/close tidak membuat ledger atau menandai CONFIRMED. Invoice dibaca melalui endpoint final dan hanya ditampilkan setelah backend mengesahkan.

## Endpoint yang dipakai

POST `/guest/bookings`, GET `/guest/bookings/current`, POST `/guest/bookings/current/checkout`, POST `/guest/bookings/current/sync`, GET `/guest/bookings/current/invoice`, serta katalog GET `/public/services`. Endpoint ringkasan `/guest/bookings/current/payments` juga tersedia untuk integrasi berikutnya; detail memuat ringkasan authoritative yang sama.

## Keterbatasan

Dua migration additive sudah disetujui dan diterapkan pada database existing. Backup terbaru terverifikasi dan snapshot22 domain sebelum/sesudah DDL identik. Writer backend lama telah dihentikan dan diganti runtime kompatibel pada port3000 dengan `GUEST_BOOKING_ENABLED=true`, database dan konfigurasi JWT/Sandbox existing yang sama. React Native original tidak diubah, memakai endpoint lama dan JWT existing. Project4 tidak diubah; integrasi Staff dibuktikan melalui API serta Socket.IO/REST, bukan klik perangkat.

Nomor HP guest belum bukti kepemilikan. Backend memakai identitas guest terpisah, tanpa diskon membership atau akses akun lama. Kontak guest tersedia sebagai tambahan DTO operator; tampilan kontak Staff lama belum dimodifikasi. Idempotency create mencegah duplikasi tetapi tautan yang hilang sebelum respons diterima belum dapat dipulihkan.

Satu Snap Sandbox dummy Rp5.000 dibuat sesuai persetujuan; user kemudian menunda pembayaran. Helper checkout lokal ditutup tanpa membuat pembayaran/refund tambahan. Audit read-only: booking AWAITING_DP, satu intent PENDING, nol kredit berhasil/invoice/bukti provider; Get Status resmi404 karena metode pembayaran belum diproses. Deadline dummy 16 Oktober 2026 12.47 WIB, setelah itu scheduler menangani expiry; pembatalan aktual belum diklaim sebelum diamati. Seluruh row existing pada snapshot22 kembali diverifikasi identik setelah fixture ditambahkan.

Tidak ada dependency baru, perubahan .env original, push atau PR. Rincian SQL, capacity lock, refund review dan backup terverifikasi ada di worktree backend: `server/GUEST-BOOKING-AUDIT.md` dan `server/GUEST-MIGRATION-PLAN.md`.
