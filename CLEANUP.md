# Cleanup Customer Web

16 Oktober 2026, pada folder asli. Tidak ada perubahan desain, kontrak booking, tracking, sesi, nominal/deadline DP, Midtrans, pelunasan atau invoice.

- App publik tidak lagi menyuplai dua callback kosong dan flag demo konstan kepada katalog. Kontrol contoh opsional hanya disuplai fixture test.
- Playwright default mengecualikan suite guest/tracking live; suite tersebut tetap dijalankan melalui konfigurasi khusus agar tidak bercampur dengan server preview fixture.
- Fixture preview, komponen Pratinjau, data contoh dan CSS-nya tetap dipertahankan: masih direferensikan 14 tes dan bukan UI publik.
- `test-results/.last-run.json` dihapus sesudah tes selesai karena hanya metadata generated yang dapat dibuat ulang. Tidak menghapus screenshot/trace bukti historis.
- Tidak ada dependency, package/lock, environment, asset historis atau private-link compatibility yang dihapus.

Build TypeScript/Vite PASS. Browser tracking PASS terhadap API/PostgreSQL fixture dan provider mock: booking tanpa akun/barber, DP50%, batas15menit, callback palsu tidak mengonfirmasi, settlement fixture, kode stabil, copy, sesi ulang, pencarian salah/benar, pelayanan, pelunasan, invoice, replay tanpa kredit ganda, legacy dan responsive. Suite fixture antarmuka: 14 PASS. Hasil mock tidak dinyatakan sebagai pembayaran Sandbox nyata.

Saat cleanup berlangsung terdapat enam perubahan file tambahan di luar edit cleanup, yang dipertahankan di luar commit: `playwright.tracking.config.ts`, `src/komponen/BookingTamu.tsx`, `src/komponen/LacakBooking.tsx`, `tests/customer-web.spec.ts`, `tests/guest-live.spec.ts` dan `tests/tracking-live.spec.ts`. Satu karakter baru `F;` pada BookingTamu menyebabkan TS2304; setelah izin eksplisit pengguna, hanya baris itu dihapus. Build dan browser tracking diulang dan PASS. Sebelas perubahan historis awal juga tetap utuh dan tidak ikut commit cleanup.

Laporan lintas project, daftar penghapusan, snapshot data, dependency dan kegagalan Native Customer existing tersedia di Project3: `docs/audit/CLEANUP-WORKSPACE-20261016.md`. Tidak ada push, merge, worktree baru atau transaksi provider nyata baru.
