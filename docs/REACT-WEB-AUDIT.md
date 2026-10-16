> Snapshot historis UI awal commit 5afa3b6. Untuk status integrasi terbaru, lihat GUEST-INTEGRATION.md.

# Audit React Web Customer terpisah

Tanggal: 16 Oktober 2026 (WIB).

## Lingkup dan Git

- Folder baru `Stage 2/barberbarbar-customer-web`, branch `feat/project5-react-web-mobile-first`.
- Worktree menggunakan common Git directory `barberbarbar-customer/.git`, bukan repository baru.
- Basis `origin/main` diperiksa terhadap remote: `2f1e40645067d8ec09f8df2a7b8b172ba57779d0`. Tidak memerlukan fetch; ref tidak digeser.
- Branch aktif original tetap `feature/project5-integration`, HEAD `38e3fced6dffa0fdbb3bd3f29b0f1c8ea54d2078`.
- Tidak ada branch `main` lokal sebelum pekerjaan; tetap tidak dibuat. Remote `main` dan ref `origin/main` dipertahankan.
- Branch Web tidak memiliki upstream. Tidak ada push, perubahan remote origin, Pull Request atau merge dari pekerjaan ini.
- Entry `App.tsx`, `index.ts`, `app.json`, source runtime dan test Native diganti **hanya pada branch/worktree Web**. File original tetap berada pada worktree React Native, termasuk semua perubahan lokal pengguna.
- Dokumen audit historis Native, aset existing dan script backup lama tetap dipertahankan sebagai riwayat, bukan alur runtime Web.

## Implementasi

| Halaman | Implementasi saat ini |
| --- | --- |
| Beranda | Logo existing, hero, layanan/harga/durasi, CTA dan navigasi mobile/desktop |
| Buat booking | Nama, HP Indonesia, pilihan multi-layanan/jumlah 1–10, tanggal/jam WIB, estimasi total/durasi/DP 50% |
| Booking berhasil | Rancangan ringkasan dengan nomor **belum diterbitkan**, bukan klaim booking tersimpan |
| Detail | Data draf lokal, status pratinjau, DP belum terverifikasi, pelunasan dan invoice belum tersedia |
| Pembayaran | Snap nonaktif, skenario pesan pending/callback sukses/gagal, countdown demo 15 menit |

Label `Demo UI — belum terhubung ke proses booking/pembayaran` selalu terlihat. Data layanan publik dan katalog demo memiliki label sumber berbeda; fallback hanya setelah tindakan pengguna. Tidak ada akun/login/registrasi atau pemilihan barber.

`src/layanan/publik.ts` hanya melakukan `GET /public/services`, dengan `credentials: omit`, tanpa JWT. Respons divalidasi dan dipetakan ke ID/nama/harga/durasi. Error backend tidak ditampilkan mentah. Data internal tambahan dari fixture tidak masuk tampilan.

`src/layanan/kontrak.ts` menyiapkan tipe rancangan guest/Snap. Seluruh fungsi guest/private/Snap menolak tanpa mengirim request, termasuk jika diberi token. Tidak ada endpoint guest rekaan yang dipanggil. Tidak memuat SDK/script Midtrans.

Harga dan DP pada form adalah estimasi antarmuka, bukan tagihan authoritative. Callback sukses demo tetap menunggu verifikasi backend, tidak membuat status CONFIRMED, ledger, pembayaran atau invoice. Countdown memakai jam perangkat hanya untuk preview; expiry server belum diimplementasikan.

PII hanya berada di memori tab, tidak dikirim ke server, tidak masuk URL, storage, cookie atau log. Tautan demo adalah path statis, bukan token rahasia. Tab lain/reload tidak membuka data. Ada tombol hapus data pratinjau. Route detail tanpa token tidak membaca atau menampilkan booking.

## Dependency

Instalasi disetujui khusus worktree Web:

- Runtime: React/React DOM 19.3.0.
- Development: Vite 7.3.6, plugin React 5.2.0, TypeScript 5.9.3, types React/React DOM 19.3.0, Playwright 1.64.1.
- Fetch, CSS, SVG dan API browser digunakan tanpa dependency tambahan.
- Tidak mengubah dependency React Native atau mengunduh browser. Tes memakai Chrome existing.
- `npm audit`: **0 advisory** pada saat pengujian, bukan jaminan hasil di masa depan.

## Hasil pengujian

`npm.cmd run typecheck` **PASS**. `npm.cmd run build` **PASS**: 36 modules, CSS sekitar 19.5 kB dan JS sekitar 251.5 kB (sebelum gzip).

`npm.cmd test`: **14 PASS** menggunakan Chrome headless existing dan API fixture. Intersep request menolak endpoint di luar GET katalog; fixture tidak menyentuh database atau provider.

| Skenario | Hasil |
| --- | --- |
| Navigasi beranda/layanan/form, back browser, pilih dari kartu | PASS |
| Tidak ada login/registrasi/pilihan barber; GET katalog tanpa JWT | PASS |
| Validasi nama, telepon, layanan kosong, tanggal/jam terlewati, fokus error | PASS |
| Beberapa layanan dan jumlah; total/DP estimasi | PASS |
| Ringkasan jujur tanpa nomor server, tautan demo dan countdown | PASS |
| Pending/callback sukses/gagal tidak memalsukan verifikasi, invoice atau CONFIRMED | PASS |
| Countdown demo menjadi 00:00 tanpa memutasi booking | PASS |
| Akses tanpa token, reload/tab lain tidak membaca PII; storage kosong | PASS |
| Hapus data pratinjau | PASS |
| Fungsi kontrak guest/private/Snap menolak tanpa request | PASS |
| Katalog gagal, empty dan malformed; error aman; demo eksplisit | PASS |
| Beranda, form, ringkasan, detail, pembayaran pada 320/375/430/768/1440 px | PASS; tanpa overflow horizontal, 25 screenshot |
| Smoke HTTP Web lokal | PASS: HTTP 200 di `127.0.0.1:5175` |
| GET nyata melalui proxy `/api/public/services` | PASS: HTTP 200, 5 layanan; kolom ID/nama/harga/durasi |
| Guest booking backend, expiry DP server, token rahasia, auto confirmation | NOT IMPLEMENTED / belum diuji |
| Midtrans Snap/provider nyata | NOT IMPLEMENTED / tidak dijalankan |

Pengujian awal menemukan overflow dekorasi hero di 320 px; ukuran dekorasi diperbaiki dan diuji ulang. Pemeriksaan visual menggunakan screenshot browser, bukan pengujian perangkat HP fisik. Artefak screenshot, build, trace dan dependency diabaikan Git.

## Perlindungan original dan rahasia

Snapshot read-only membandingkan SHA-256 seluruh tracked file original, `.env` yang ada, Git index, HEAD, branch dan status. Project 3, Project 4 dan React Native Customer mempertahankan seluruh source, konfigurasi aplikasi, environment, staging dan perubahan lokal awal. Verifikasi ini membuktikan original tidak diganti; Expo original tidak dijalankan ulang dan tidak diklaim sebagai tes perangkat baru.

File historis tetap sama: `server/src/lib/prisma.ts`, `src/layar/LayarTambahPelanggan.tsx`, dan `src/layanan/booking.ts` Project 4. Tidak ada source backend atau database yang ditulis. Metadata worktree/branch baru muncul pada Git bersama; key IDE `branch.feat/project5-react-web-mobile-first.vscode-merge-base=origin/main` teramati, tanpa perubahan remote atau ref main.

`.env*`, dependency, build dan test artifacts diabaikan, kecuali `.env.example` yang hanya berisi URL publik `/api`. Tidak ada Server Key, Client Key, credential database atau token aktual di source Web. `VITE_*` selalu publik; credential tidak boleh ditaruh di sana.

## Status

**SUCCESS untuk UI/teknis development lokal yang diminta.** Integrasi guest, pembayaran, expiry dan auto confirmation masih rancangan, bukan keberhasilan backend. Implementasi final memerlukan pekerjaan backend tersendiri setelah penilaian. Seluruh perubahan Web disimpan sebagai commit lokal; identitas commit tersedia melalui `git log -1` pada branch Web.
