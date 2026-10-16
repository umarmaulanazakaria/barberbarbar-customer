# Booking dan tracking Customer Web

16 Oktober 2026. Implementasi pada folder asli, mempertahankan React Native Customer dan perubahan lokal existing.

Booking baru tanpa akun dan tanpa memilih barber menggunakan sesi cookie HttpOnly. URL kunjungan tidak mengandung token atau kode. DP 50% dan batas 15 menit berasal dari backend; hanya bukti pembayaran yang diverifikasi backend dapat mengonfirmasi booking dan membuka kode tracking. Callback Snap sukses saja tidak cukup.

Menu Lacak Booking menukar kode melalui POST menjadi sesi browser. Kode tidak disimpan pada URL/localStorage. Customer dapat melihat detail layanan, barber final, status dan waktu pelayanan, pembayaran, sisa tagihan serta invoice final setelah lunas. Tautan legacy tetap ditukar ke sesi dan segera dihapus dari address bar.

Formulir menunggu `/public/booking-availability`. Jika backend belum siap, customer mendapat pesan ketersediaan dan tombol periksa ulang. Gangguan localhost:5175 sebelumnya disebabkan aktivasi booking backend yang hilang saat proses restart; konfigurasi lokal sekarang dipersistenkan pada `.env` backend yang tidak masuk Git. Proxy existing tidak perlu diubah.

Pengujian: build TypeScript/Vite PASS; browser booking sampai invoice PASS dengan API/database fixture dan provider mock. Termasuk DP 50%, deadline 15 menit, callback palsu tidak mengonfirmasi, settlement fixture, replay tanpa kredit ganda, kode stabil, copy, sesi browser ulang, pencarian salah/benar, tanpa cookie tidak ada kebocoran, legacy, readiness nonaktif dan lebar 320–1440px. Smoke runtime asli localhost:5175 membuktikan formulir terlihat dan endpoint kesiapan aktif.

Tidak ada pembayaran Sandbox nyata baru dalam pengujian ini; hasil mock tidak dinyatakan sebagai verifikasi provider nyata. Tidak mengubah package/lock atau dependency React Native. Tidak ada push/merge. Pengujian dan backup migration backend dijelaskan di Project 3 `docs/audit/DASHBOARD-TRACKING-BOOKING.md`.
