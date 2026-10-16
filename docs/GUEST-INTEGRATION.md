# Integrasi guest Web — laporan aktual

16 Oktober 2026 (WIB). Melanjutkan commit lokal `5afa3b684269f2523a0bf1e162e77fb5f580db05`, tanpa membuat ulang UI atau menghapus tes lama.

## Hasil

| Pemeriksaan | Hasil |
| --- | --- |
| TypeScript dan Vite build | PASS, 39 modules |
| 14 tes browser UI awal | PASS, dipertahankan pada mode demo terisolasi |
| Web ke API aktual + PostgreSQL fixture sampai invoice | PASS; provider/Snap MOCK |
| Nomor booking/token server, tanpa akun/barber, multi layanan | PASS |
| Deadline DB15 menit, nominal backend, callback bukan konfirmasi | PASS |
| Reload/tab lain link pribadi | PASS |
| Staff check-in/start/complete, pelunasan dan invoice final | PASS pada fixture |
| Replay settlement, dua kredit DP+pelunasan dan satu invoice | PASS |
| Token tidak berada pada URL request backend | PASS |
| Lima lebar viewport UI lama dan invoice nyata fixture | PASS: 320,375,430,768,1440 |
| Midtrans provider Sandbox nyata | DEFERRED, belum dibuat transaksi |
| Android Native/Staff device | DEFERRED, bukan klaim dari API/browser |
| Migration/aktivasi database existing | DEFERRED, menunggu persetujuan |

UI nyata menampilkan status backend, terpisah dari route demo. Seluruh API booking memakai header Guest dan cache no-store; referrer no-referrer. Tidak mengirim harga, diskon, pilihan barber atau nominal checkout dari form. Tidak menyimpan token/PII ke storage atau log. Token pribadi berada pada hash link browser agar tidak menjadi URL request HTTP backend. Client Key Snap publik dibaca dari respons backend; Server Key tidak pernah masuk frontend.

Polling hanya memuat ulang REST. Setelah intent pending, pengecekan provider dijadwalkan terbatas; foreground/online memuat ulang. Snap callback success/pending/error/close tidak membuat ledger atau menandai CONFIRMED. Invoice dibaca melalui endpoint final dan hanya ditampilkan setelah backend mengesahkan.

## Endpoint yang dipakai

POST `/guest/bookings`, GET `/guest/bookings/current`, POST `/guest/bookings/current/checkout`, POST `/guest/bookings/current/sync`, GET `/guest/bookings/current/invoice`, serta katalog GET `/public/services`. Endpoint ringkasan `/guest/bookings/current/payments` juga tersedia untuk integrasi berikutnya; detail memuat ringkasan authoritative yang sama.

## Keterbatasan

Rollout database existing belum dilaksanakan. `GUEST_BOOKING_ENABLED` backend harus diaktifkan hanya setelah migration disetujui dan writer backend lama sudah diganti runtime kompatibel. React Native original tidak diubah, memakai endpoint lama dan JWT existing. Project4 tidak diubah; integrasi Staff dibuktikan melalui API serta Socket.IO/REST, bukan klik perangkat.

Nomor HP guest belum bukti kepemilikan. Backend memakai identitas guest terpisah, tanpa diskon membership atau akses akun lama. Kontak guest tersedia sebagai tambahan DTO operator; tampilan kontak Staff lama belum dimodifikasi. Idempotency create mencegah duplikasi tetapi tautan yang hilang sebelum respons diterima belum dapat dipulihkan.

Tidak ada dependency baru, migration existing, transaksi provider nyata, push atau PR pada pekerjaan ini. Rincian SQL, capacity lock, refund review dan backup terverifikasi ada di worktree backend: `server/GUEST-BOOKING-AUDIT.md` dan `server/GUEST-MIGRATION-PLAN.md`.
