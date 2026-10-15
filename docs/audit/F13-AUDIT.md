> Dokumen historis dipindahkan dari `barberbarbar-customer/F13-AUDIT.md`. Hasil dan path bukti mencatat waktu audit; panduan aktif ada di README utama dan laporan cleanup. Arsip privat kini berada di luar Stage 2.

# Verifikasi ulang aplikasi Customer

15 Oktober 2026. [Audit utama](../../../barberbarbar/docs/audit/F13-AUDIT.md),
[matriks](../../../barberbarbar/server/e2e/MATRIKS-E2E.md),
[panduan perangkat/provider](../../../barberbarbar/docs/README-PENGUJIAN.md).

Perbaikan minimal: izin reschedule mengikuti batas satu jam yang divalidasi
backend; tipe DTO dan detail booking menampilkan alasan penolakan. Regresi
komponen detail gagal sebelum fix dan PASS sesudah dengan host adapter.
Test customer menambah assertion boundary izin; npm test memasukkan detail.

TypeScript, Expo dependency check, Android export (1072 modules), integrasi
14 kelompok, dropdown 11 kelompok dan detail penolakan PASS. SDK source aktual
ikut alur browser Web: membership, booking, lifecycle dan invoice/refetch.
SecureStore/AppState/native host adalah adapter. Provider seluruh suite MOCK;
bukan checkout Sandbox dari Android. Device/AVD tidak tersedia dan user
menetapkan UI Android DEFERRED. Tidak mengubah dependency atau environment.

Forgot-password belum delivery email. API current-password change/perubahan
identitas belum ada; UI reschedule belum edit service/qty. Dependency tersisa
16 high/7 moderate (0 critical) memerlukan triage. F13 PARSIAL; refund historis
Rp2.000 tidak diklaim berhasil dan tidak ada refund/retry provider baru.
