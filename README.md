# BARBER BARBAR — Customer Web

React Web mobile-first untuk merencanakan kunjungan dari browser HP. React, TypeScript, Vite dan CSS responsif; tanpa runtime Expo, React Native atau React Native Web.

> **Demo UI — belum terhubung ke proses booking/pembayaran.**
> Hanya katalog layanan publik yang dapat dibaca dari backend. Tidak membuat booking, nomor booking server, token rahasia, pembayaran atau invoice.

## Dua versi, satu repository

| Folder | Fungsi |
| --- | --- |
| `../barberbarbar-customer` | React Native Expo existing untuk penilaian; tidak diubah |
| `barberbarbar-customer-web` | Worktree Web, branch lokal `feat/project5-react-web-mobile-first` |

Basis Web: `origin/main` commit `2f1e40645067d8ec09f8df2a7b8b172ba57779d0`. File `.git` Web mengarah ke repository existing, bukan repository baru. Branch Web tanpa upstream. **Hanya commit lokal; tidak ada push, PR atau merge.**

## Menjalankan lokal

Dependency Web telah dipasang terpisah dengan persetujuan pengguna. Dari folder Web:

```powershell
npm.cmd run dev
```

Buka **http://127.0.0.1:5175/**. Dev server mengikat loopback. Navigasi hash memungkinkan reload tanpa rewrite SPA.

`GET /api/public/services` diproxy Vite ke `http://127.0.0.1:3000/public/services`. Backend Project 3 dijalankan secara terpisah, tanpa perubahan source atau konfigurasi oleh pekerjaan ini. Jika backend tidak tersedia, klik **Gunakan layanan demo**; aplikasi tidak mengganti katalog secara diam-diam.

Konfigurasi opsional pada `.env.local` Web saja:

```dotenv
VITE_API_BASE_URL=/api
```

`VITE_*` bersifat publik dan masuk bundle browser. Jangan isi credential, Server Key Midtrans, JWT atau password database. `.env` original tidak disalin. Untuk hosting kelak, sediakan proxy `/api` atau origin API publik dengan CORS yang sesuai. Deployment belum termasuk lingkup.

## Halaman dan batas implementasi

- **Beranda:** logo existing, hero, layanan, harga, durasi dan navigasi booking.
- **Buat booking:** nama, nomor HP Indonesia, beberapa layanan/jumlah, tanggal/jam WIB, estimasi biaya dan DP 50%. Tanpa login, registrasi atau pilihan barber.
- **Ringkasan demo:** nomor booking **belum diterbitkan**, jadwal, countdown demo 15 menit dan tautan navigasi sesi. Tautan bukan token rahasia; tidak membuka data setelah reload atau di tab lain.
- **Detail demo:** layanan, jadwal, DP belum terverifikasi, pelunasan dan invoice belum tersedia.
- **Pembayaran demo:** Snap belum aktif. Skenario pending/callback sukses/gagal hanya mengubah pesan. Callback sukses tidak menandai DP sah atau booking CONFIRMED.

PII hanya di memori tab, tidak ditulis ke localStorage, sessionStorage, cookie atau log. Nama/nomor HP tidak dikirim lewat request publik atau URL. Tombol hapus pratinjau dan reload membuang data demo.

## Struktur source

| File | Tanggung jawab |
| --- | --- |
| `src/App.tsx` | Navigasi hash, layout, katalog dan state demo |
| `src/domain.ts` | Tipe domain, normalisasi HP, validasi WIB, estimasi |
| `src/demo.ts` | Katalog contoh terisolasi |
| `src/layanan/publik.ts` | Fetch GET-only dan validasi respons |
| `src/layanan/kontrak.ts` | Rancangan guest/Snap; fungsi selalu menolak tanpa request |
| `src/komponen/Katalog.tsx` | Loading/error/empty dan sumber katalog |
| `src/komponen/FormBooking.tsx` | Form serta estimasi |
| `src/komponen/Pratinjau.tsx` | Ringkasan, detail dan skenario pembayaran |
| `src/komponen/Ikon.tsx` | SVG lokal |
| `src/style.css` | Navy/slate/indigo dan layout responsif |
| `src/main.tsx`, `index.html` | Entry React DOM |
| `vite.config.ts`, `tsconfig.json` | Konfigurasi Web |
| `playwright.config.ts`, `tests/customer-web.spec.ts` | E2E Chrome existing, API fixture |

Entry dan komponen Native hanya diganti pada branch Web. Source original tetap pada worktree React Native dan histori Git. Dokumen audit/instalasi/PR lama serta script backup lama adalah riwayat React Native, bukan panduan Web. Gunakan README ini dan [audit Web](docs/REACT-WEB-AUDIT.md).

## Validasi

```powershell
npm.cmd run typecheck
npm.cmd run build
npm.cmd test
npm.cmd audit
```

Playwright memakai Chrome existing (`channel: chrome`), tanpa mengunduh browser. Vite tes di `127.0.0.1:5185`, API diintersep fixture, tanpa transaksi backend. Screenshot lima halaman pada lebar 320, 375, 430, 768 dan 1440 px berada di `test-results/visual/` (diabaikan Git).

`npm.cmd run preview` melayani build di http://127.0.0.1:4175/. Preview build tidak menyediakan proxy development; gunakan layanan demo atau konfigurasi origin API publik sebelum build.

## Integrasi berikutnya

`src/layanan/kontrak.ts` adalah rancangan, bukan endpoint yang tersedia. Setelah penilaian, backend perlu menetapkan guest booking, validasi jadwal/harga/jumlah, DP 50% dan deadline 15 menit, token pribadi aman, rate limit, idempotency, verifikasi webhook/provider dan auto confirmation. Barber ditentukan Staff saat operasional; tidak ada persetujuan admin pada rancangan guest.

Jangan mengaktifkan submit/Snap hanya dengan mengganti tampilan success. Nomor booking, tautan rahasia, tagihan, status dan invoice wajib berasal dari backend terverifikasi. Tes backend guest, expiry DP dan auto confirmation **belum dilaksanakan**.
