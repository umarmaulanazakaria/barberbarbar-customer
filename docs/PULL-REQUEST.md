# Sediakan aplikasi customer untuk booking dan pemantauan layanan

Draft teks review; origin/main belum ada dan default remote masih feature/project5-integration saat audit. Jangan membuka PR dengan base palsu. [Rencana main yang menjaga seluruh history](https://github.com/umarmaulanazakaria/barberbarbar/blob/feature/project5-integration/docs/PORTFOLIO-RELEASE-REVIEW.md) memerlukan persetujuan pemilik sebelum pembuatan branch/default remote. Belum dieksekusi.

Aplikasi Expo menyediakan Beranda/Booking/Riwayat/Akun, katalog publik, auth/pengaitan/profil, membership, booking multiservice/jumlah, searchable barber, reschedule items/qty, checkout/refund request/invoice, REST refetch dan Socket.IO. Harga/status pembayaran authoritative backend, sesi melalui SecureStore. Perubahan identitas/password memerlukan password saat ini dan login ulang. Reset link membuka formulir tanpa mengubah password otomatis; email nyata nonaktif dan scheme memerlukan native/development build.

File signifikan untuk review awal: App.tsx/app.json, src/layar, src/komponen/PilihanBerpencarian.tsx, src/layanan/api.ts, sesi.ts, realtime.ts, pemulihan.ts dan aturan; scripts/test-customer.mjs, test-pilihan-barber.mjs, test-detail-customer.mjs, test-draf-jadwal-ulang.mjs, test-pemulihan-customer.mjs. Tugas demo terbaru hanya dokumentasi README/PR/panduan capture, tanpa kode/dependency baru.

TypeScript, Expo check, Android Hermes, adapter dropdown/detail/draft/recovery dan SDK integrasi PASS sebagai bagian 29/29 regresi lintas repository. Native berhasil menurut pengguna (USER-REPORTED), rincian skenario dan checkout UI Android DEFERRED. Hasil SDK/mock tidak menggantikan perangkat/provider. Screenshot native belum tersedia, panduan capture disiapkan.

DEMO READY WITH LIMITATIONS untuk pembelajaran/demo lokal. Advisory, email nyata, refund historis dan Master PRD lengkap tetap memiliki keterbatasan. Tidak membuat transaksi baru, mengaktifkan Production, mengubah default/main atau merge tanpa persetujuan.
