# Integrasi Customer Web terkini

Snapshot audit 18 Oktober 2026, baseline aef2959. UI mobile-first dan aturan bisnis tidak diubah dalam audit; tes utama diperbarui untuk wizard dan slot 45 existing.

| Tahap | Kontrak |
| --- | --- |
| Katalog | GET /public/services, hanya field publik/aktif |
| Kesiapan | GET /public/booking-availability; katalog tersedia tidak otomatis berarti booking siap |
| Jadwal | GET /guest/bookings/slots?tanggal=YYYY-MM-DD |
| Harga | POST /guest/bookings/quote; Member dan slot diperiksa server |
| Pembuatan | POST /guest/bookings/session; UUID idempotensi, sesi HttpOnly |
| Detail/pembayaran | Endpoint privat /guest/bookings/session/current dan checkout/sync |
| Tracking | Kode rahasia ditukar sesi melalui POST, bukan data publik |
| Operasional | Admin/Staff melalui API operator, bukan flag Customer |

Wizard memilih layanan, barber tersedia, slot, lalu mode Reguler/Member. Reguler memakai kontak, DP 50% dan deadline15 menit. Member aktif tidak perlu kontak ulang atau DP; harga layanan paket dan manfaat dihitung backend, identitas diperiksa fisik di toko. Nomor legacy tetap dapat digunakan jika backend menyatakan layak.

HTTP LAN memakai /api same-origin melalui Vite; localhost backend hanya berada pada proxy komputer. Origin guest harus cocok konfigurasi backend. /socket.io memakai target backend yang sama. Jangan menaruh credential privat pada VITE_*; semua nilainya dapat masuk bundle browser. HTTPS/reverse proxy deployment dan cookie harus diverifikasi tersendiri.

## Verifikasi dan batas

Build/TypeScript snapshot serta working tree lulus. Satu suite Customer utama lulus pada320,360,375,390,412,430,768 dan1440 px: routing, langkah awal wizard, overflow, status pending/failed/expired, deadline, tracking dan invoice. Seluruh API diintersepsi; tidak membuktikan settlement provider atau perangkat HP. Tidak mengklaim seluruh wizard telah diklik end-to-end oleh suite ini.

Regresi backend fixture membuktikan guest regular, slot 45/qty, DP, check-in/barber/start/complete, pelunasan/invoice, race, tracking/recovery, Member numerik/legacy, mismatch dan Walk-in. Provider mock/stub; tidak ada transaksi Midtrans baru. npm audit Customer:0 advisory pada saat pemeriksaan.

Suite historis guest/form lama tidak dijadikan gerbang rilis karena asumsi larangan barber/durasi per layanan sudah berubah. WIP18 file termasuk komponen, layanan, style dan tes tetap tidak dicampur ke commit audit. Tidak menghapus UI arsip atau mengubah mode produksi untuk membuat tes lulus.

Bukti provider lama terdapat pada laporan backend; hasil sekarang terpisah dari bukti tersebut. [Matriks audit pusat](https://github.com/umarmaulanazakaria/barberbarbar/blob/feature/project5-integration/docs/audit/AUDIT-SISTEM-TERKINI.md). Dokumen historis tetap disimpan dengan linknya.
