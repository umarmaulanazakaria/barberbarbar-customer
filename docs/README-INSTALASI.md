# Instalasi Customer Web

Aplikasi customer aktif memakai React, TypeScript dan Vite. React Native Customer hanya tersimpan dalam riwayat Git dan backup privat, bukan dependency aplikasi ini.

1. Gunakan Node.js dan npm yang kompatibel dengan Vite 7 (Node >=22.12), lalu jalankan npm.cmd ci di folder barberbarbar-customer-web jika dependency belum tersedia.
2. Jalankan backend existing di ../barberbarbar/server pada port 3000. Jangan reset database atau mengulang migration yang sudah diterapkan.
3. Konfigurasi publik opsional ada pada .env.example: VITE_API_BASE_URL=/api dan VITE_GUEST_BOOKING_ENABLED=true. Jangan menyalin credential backend ke variabel VITE_.
4. Jalankan npm.cmd run dev. Buka http://localhost:5175 atau http://IP-LAPTOP:5175 dari HP pada Wi-Fi yang sama. Proxy development /api dan /socket.io menuju backend. Tidak membutuhkan Expo, ADB Reverse, atau folder Native Customer.
5. Jalankan npm.cmd run build untuk TypeScript dan build produksi. Deployment produksi memerlukan HTTPS serta reverse proxy backend dan upgrade WebSocket; Vite development bukan server produksi.

## Booking dan pembayaran

Booking guest tanpa login. Wizard main saat ini memilih layanan, barber dan jadwal sebelum identitas/Member serta checkout. Nilai DP 50% dan deadline 15 menit dihitung backend. Callback Snap hanya memicu refresh; settlement harus diverifikasi server sebelum booking dikonfirmasi. Tracking rahasia tersedia setelah DP sah. Pelunasan memakai balance database dan invoice final hanya mengikuti status server.

Credential Midtrans Sandbox tetap di server/.env. Notification URL menuju endpoint /midtrans/notifications melalui tunnel/backend publik yang aktif. Jangan mengaktifkan Production atau membuat transaksi provider untuk sekadar menguji instalasi.

## Pengujian dan cadangan

Jalankan npm.cmd run typecheck, npm.cmd run build dan suite playwright.customer-principal.config.ts (Chrome existing). Suite guest/realtime/tracking membutuhkan backend dan database fixture terisolasi sesuai README; jangan arahkan fixture ke database bisnis. Mock tidak membuktikan pembayaran provider atau pengujian Android fisik.

Script scripts/buat-cadangan.ps1 membuat ZIP source tracked beserta checksum di LOCALAPPDATA/BARBERBARBAR/source-backups, di luar Stage 2. Git working tree harus bersih; .env, database dump, node_modules dan .git dikecualikan. Cadangan penuh perubahan lokal dan riwayat saat finalisasi disimpan terpisah secara privat.
