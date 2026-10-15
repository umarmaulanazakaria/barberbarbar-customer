> Dokumen historis dipindahkan dari `barberbarbar-customer/PULL-REQUEST.md`. Hasil dan path bukti mencatat waktu audit; panduan aktif ada di README utama dan laporan cleanup. Arsip privat kini berada di luar Stage 2.

# Tambahkan aplikasi customer yang terhubung dengan backend operasional

Aplikasi Expo menyediakan empat tab Beranda/Booking/Riwayat/Akun, katalog
publik, auth/pengaitan/profil, membership, booking multiservice, searchable
barber, status/tagihan/checkout/refund/invoice dan sinkronisasi REST/Socket.
Harga dan status pembayaran tetap ditentukan backend; SecureStore menangani
credential sesi. Identitas visual BARBER BARBAR dipertahankan.

Perbaikan finalisasi mencegah refetch detail menimpa barber draf jadwal ulang.
Regresi source aktual menguji pilihan spesifik/null dan perpindahan route.
Validasi lengkap dan batas adapter/provider ada di audit utama Project3:
TypeScript, Expo check, Android export, SDK/API, dropdown, detail dan draf.
Device UI/checkout Sandbox dari app belum terbukti. Recovery email belum
delivery; perubahan identitas/password dan item reschedule perlu keputusan
PRD. Advisory high/moderate tetap dicatat, bukan dinyatakan selesai.

Backend kompatibel dan acceptance staging harus tersedia sebelum distribusi
app. Env/credential tidak ikut repository. **Belum ada origin/main** pada repo
ini: pemilik perlu menetapkan base branch/history sebelum PR dapat dibuka.
Dokumen ini draft teks review, tidak membuat main/merge/deploy secara otomatis.
