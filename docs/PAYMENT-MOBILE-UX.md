# Ringkasan dan pembayaran mobile-first

17 Oktober 2026. Source asli Customer Web, branch `feat/project5-react-web-mobile-first`, melanjutkan `faeeb3d`. Commit lokal terpisah, tanpa push/merge/PR/deploy. Backend, database, migration, environment, webhook dan kontrak finansial tidak diubah.

## Temuan dan hasil

Pada baseline, tombol Snap, nominal DP dan countdown berada pada panel terpisah yang berjauhan. Jadwal/layanan dan timeline panjang mendahului pembayaran di HP. Teks nominal/sekunder kecil; sulit membedakan total tagihan yang masih penuh sebelum DP dengan sisa sesudah DP sah. Guard checkout dilepas setelah pemanggilan `snap.pay` kembali, sementara popup masih aktif; klik ulang berpotensi membuka popup lagi.

Renderer `RingkasanPembayaran` kini dipakai hanya pada Ringkasan/Pembayaran. Controller fetch/session/Snap existing tetap dipakai. Ringkasan mengutamakan jadwal WIB, durasi, pelanggan dan layanan (qty × harga, subtotal backend). Pembayaran mengutamakan kartu tagihan: DP, total, sudah dibayar, balance backend, deadline dan tindakan dalam satu panel. Desktop memakai dua kolom; mobile tanpa sticky CTA. Ukuran tombol minimum48px, teks utama14–16px, nominal besar dan angka tabular. Palet navy/slate/indigo serta gaya tahap sebelumnya dipertahankan. Detail operasional/Invoice tetap memakai renderer existing.

Nominal tidak dihitung ulang: `total`, `nominalDpAwal`, `jumlahDibayar`, `balance` dan subtotal item langsung dari respons backend. Sebelum DP sah, sisa tagihan masih nilai balance aktual; UI menjelaskan bahwa nilai berkurang setelah verifikasi. Tidak membuat angka estimasi sisa DP sendiri.

Countdown tetap berasal dari deadline dan offset `serverTime` controller existing; tidak ada interval baru. Refresh tidak memperpanjang deadline. Peringatan statis muncul di bawah2menit, tanpa animasi. Ketika batas lokal tercapai, checkout disembunyikan dan satu refetch sync dilakukan untuk nomor/deadline tersebut. UI mengatakan sedang memeriksa, bukan menyatakan booking final expired dari timer lokal. Deadline invalid gagal tertutup. Status `CANCELLED` dari backend ditampilkan sebagai pembatalan; transaksi `EXPIRED` sebagai kedaluwarsa. Backend tidak memproyeksikan alasan pembatalan ke tipe guest ini, sehingga UI tidak mengarang alasan expired untuk setiap CANCELLED.

Kunci Snap ditahan sampai callback pertama atau error persiapan. Callback ganda (misalnya success diikuti close) tidak memicu pemrosesan ulang. Success/pending/error/close hanya meminta sinkronisasi; tidak mengkredit ledger, mengonfirmasi booking atau membuat invoice. Popup ditutup tidak otomatis menjadi gagal. Riwayat FAILED/EXPIRED, status review dan DP_FORFEITED ditampilkan sesuai nilai backend tanpa janji refund. Tombol ulang hanya mengikuti status booking, deadline dan prasyarat existing.

Kode tracking tidak diminta hanya berdasarkan callback atau ledger DP tanpa konfirmasi. DP harus sah dan booking sudah/pernah dikonfirmasi sesuai status/timestamp backend. Kode sah existing tetap dapat dilihat saat booking yang pernah dikonfirmasi kemudian dibatalkan/review, sesuai kontrak backend yang mempertahankan kode tersebut. Pembayaran terlambat yang tidak pernah dikonfirmasi tidak menerbitkan kode melalui UI. Pemulihan, cookie HttpOnly, salin manual, room guest dan pencabutan sesi existing dipertahankan.

## Screenshot sebelum/sesudah

Screenshot browser menggunakan fixture sintetis yang sama (dua layanan, qty2+1, totalRp100.000, DP50.000, jadwal14.00WIB); bukan record pelanggan/provider nyata. Baseline awal diambil sebelum perubahan. Untuk perbandingan laporan dengan jadwal konsisten, kode snapshot baseline direproduksi melalui overlay Vite privat tanpa mengganti working tree. AFTER juga diuji dari candidate Git index. Tidak ada token/credential/data customer asli dalam gambar.

| Viewport | Ringkasan | Pembayaran |
|---|---|---|
|375|[sebelum](screenshots/payment-ux/before-375-ringkasan.png) → [sesudah](screenshots/payment-ux/after-375-ringkasan.png)|[sebelum](screenshots/payment-ux/before-375-pembayaran.png) → [sesudah](screenshots/payment-ux/after-375-pembayaran.png)|
|390|[sebelum](screenshots/payment-ux/before-390-ringkasan.png) → [sesudah](screenshots/payment-ux/after-390-ringkasan.png)|[sebelum](screenshots/payment-ux/before-390-pembayaran.png) → [sesudah](screenshots/payment-ux/after-390-pembayaran.png)|
|1440|[sebelum](screenshots/payment-ux/before-1440-ringkasan.png) → [sesudah](screenshots/payment-ux/after-1440-ringkasan.png)|[sebelum](screenshots/payment-ux/before-1440-pembayaran.png) → [sesudah](screenshots/payment-ux/after-1440-pembayaran.png)|

Tinggi Ringkasan375:2323→1982px;390:2304→1930px. Pembayaran375:2537→2121px;390:2518→2069px. Desktop Ringkasan1731→1258px dan Pembayaran1990→1376px. Full-page screenshot menampilkan navigasi fixed pada posisi viewport awal; gulir tetap diperlukan untuk konten berikutnya.

## Pengujian aktual

| Viewport CSS px | Ringkasan/Pembayaran | Regresi state/halaman lain |
|---|---|---|
|320|PASS tanpa overflow, nominal backend|PASS|
|360|PASS tanpa overflow, nominal backend|PASS|
|375|PASS tanpa overflow, nominal backend|PASS|
|390|PASS tanpa overflow, nominal backend|PASS|
|412|PASS tanpa overflow, nominal backend|PASS|
|430|PASS tanpa overflow, nominal backend|PASS|
|768|PASS tanpa overflow, nominal backend|PASS|
|1440|PASS tanpa overflow, nominal backend|PASS|

- PASS16 kasus `playwright.payment-ux.config.ts`: satu/multi layanan, qty/subtotal/DP/balance backend, double-click/popup tunggal, pending/success tanpa settlement/error/close, settlement sah, timeout, FAILED, review, kode dan kompatibilitas terminal yang pernah dikonfirmasi.
- PASS jam perangkat dimajukan ke2035 dengan waktu server2026; countdown tetap15menit. Setelah60detik dan refresh menjadi14:00, bukan reset15:00. Peringatan<2menit, sync expiry satu kali, checkout berhenti dan status final menunggu server.
- PASS TypeScript/build working copy; TypeScript, build produksi dan16kasus browser juga dijalankan pada seluruh source candidate index tanpa WIP historis. Overlay audit privat tidak membuat project/worktree baru atau mengubah source pengguna.
- PASS1 kasus aplikasi utama existing (8viewport, otoritas DP/status/invoice),11kasus mobile UX sebelumnya (termasuk72kombinasi state/viewport),14kasus fixture UI existing.
- PASS2 kasus integrasi browser dengan backend/PostgreSQL fixture: booking→DP Midtrans MOCK→Staff/lifecycle→pelunasan→invoice; replay tanpa kredit/invoice ganda, REST fallback, Socket.IO reconnect, isolasi sesi dan revocation. Cleanup24model lulus. Provider MOCK, bukan pembayaran Sandbox nyata.
- PASS3kasus browser HTTP LAN `192.168.1.9:5175`: tidak crash pada insecure context, UUID kriptografis fallback, retry/double-submit dan clipboard manual. Mutasi booking diintersepsi, tidak masuk database bisnis. IP hanya nilai pengujian aktual, bukan hardcode source.
- PASS tes UUID existing; Git diff dan preservasi source historis.
- NOT RUN perangkat Android fisik, keyboard/datepicker fisik dan popup Midtrans provider nyata. Desktop Chrome/viewport/LAN tidak diklaim sebagai pengujian Android nyata.

Percobaan awal harness memakai locator tombol yang berubah menjadi loading dan waktu server fixture yang tidak ikut maju ketika clock perangkat dimajukan; harness diperbaiki, kemudian seluruh skenario lulus. Fixture deadline memakai timestamp yang sama dengan serverTime agar pembulatan MM:SS tidak menampilkan15:01 karena selisih1ms; rumus produksi tidak diubah. Loader overlay privat sempat membutuhkan penyesuaian resolusi plugin/cwd compiler; konfigurasi aplikasi dan dependency tidak diubah. Tidak melonggarkan guard untuk membuat tes lulus.

## File dan Git

`src/komponen/RingkasanPembayaran.tsx`, `src/pembayaran-ux.css`, perubahan terbatas `src/komponen/BookingTamu.tsx`, `playwright.config.ts`, `playwright.payment-ux.config.ts`, `tests/payment-ux.spec.ts`, `tests/fixtures/pembayaran.ts`, laporan ini dan12screenshot pada `docs/screenshots/payment-ux/`.

Baseline Web memiliki18file historis dan index kosong. Karena controller termasuk file historis, perubahan baru direplay ke blob HEAD untuk staging parsial; tidak memakai `git add` seluruh controller. Snapshot baseline dan pembuktian reverse-delta memastikan WIP historis tetap ada. Candidate index diuji terpisah sebelum commit biasa dengan daftar staged yang diperiksa. Tujuh belas file historis lainnya, termasuk `guest.ts`, `snap.ts`, `style.css` dan tests tracking, tidak disentuh. Project3 tetap pada commit launcher `f9cc109` dengan3perubahan historis/Prisma staged; Staff1perubahan historis tetap utuh. Tidak ada push, perubahan history atau penggantian environment.

Jalankan dari folder Web: `npm.cmd run build`, `node node_modules/@playwright/test/cli.js test --config playwright.payment-ux.config.ts`. Suite integrasi realtime/tracking wajib memakai backend dan database fixture sebagaimana README, bukan database bisnis. Jalankan browser suites berurutan agar direktori hasil tes tidak berbenturan.

## Tahap berikutnya

Detail/Invoice masih memakai tipografi/layout lama dan dapat dirapikan terpisah tanpa mengubah eligibility invoice. Pertimbangkan hierarki item aktual setelah perubahan layanan, timeline operasional dan tampilan invoice panjang di320px. Belum ada pengujian perangkat fisik atau klaim audit aksesibilitas menyeluruh. Tetap gunakan backend sebagai satu-satunya sumber keputusan finansial.
