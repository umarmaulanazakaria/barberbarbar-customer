> Dokumen historis dipindahkan dari `barberbarbar-customer/F14-AUDIT.md`. Hasil dan path bukti mencatat waktu audit; panduan aktif ada di README utama dan laporan cleanup. Arsip privat kini berada di luar Stage 2.

# Finalisasi aplikasi Customer

Baseline: b3a7575fc36efa833cdf89dc1f07f958f7490579 pada
feature/project5-integration. [Audit utama](../../../barberbarbar/docs/audit/F14-AUDIT.md),
[checklist Android](../../../barberbarbar/docs/README-PENGUJIAN-ANDROID.md).

Bug yang direproduksi: user memilih barber22 pada jadwal ulang, tetapi refetch
detail mengembalikannya menjadi11. Inisialisasi draf sekarang sekali perID
booking; barber22/null bertahan saat refetch dan route booking lain memuat
drafnya sendiri. Test komponen aktual memakai hook/native host adapter gagal
sebelum fix dan PASS sesudah. Tidak mengubah PilihanBerpencarian, desain,
endpoint, dependency atau environment. npm test memasukkan regresi draf.

TS/Expo check/Hermes/SDK/dropdown dan hasil baru tercatat audit utama. Perangkat
dan checkout Sandbox WebBrowser tetap DEFERRED. UI recovery sudah menjelaskan
email belum tersedia; tidak ada layanan pengiriman baru atau klaim email
terkirim. UI edit item reschedule/current-password/identitas masih gap PRD.

Remote hanya mempunyai feature/project5-integration, belum ada origin/main.
Teks PR disiapkan, tetapi base branch harus diputuskan pemilik. Tidak membuat
main, merge atau deployment otomatis. Advisory masih perlu triage.
