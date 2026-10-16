# Akses Customer Web melalui Wi-Fi lokal

Tanggal: 17 Oktober 2026. Source asli, tanpa ADB Reverse, kabel USB, dependency baru, migration, perubahan credential atau transaksi provider nyata.

## Penyebab dan perbaikan

`App.tsx` memanggil `crypto.randomUUID()` sebagai argumen `useRef` saat setiap render. Pada HTTP melalui IP LAN, Chrome tidak menganggap origin sebagai secure context sehingga metode tersebut tidak tersedia. Panggilan itu menghentikan React sebelum halaman tampil. `localhost` mendapat perlakuan secure context khusus; hasil di localhost tidak membuktikan kompatibilitas HTTP LAN.

Generator terpusat `src/layanan/idempotensi.ts` memakai `crypto.randomUUID()` jika tersedia, kemudian `crypto.getRandomValues()` untuk 16 byte UUID v4 dengan bit versi 4 dan variant RFC yang benar. Tanpa sumber kriptografis, generator menolak dengan pesan yang ditangani UI. Tidak memakai Math.random/timestamp sebagai sumber acak atau menambah package UUID.

Kunci booking dibuat hanya ketika submit pertama, disimpan dalam ref dan digunakan kembali saat timeout, error jaringan, 503 atau double-submit. Setelah respons create sah diterima, ref dikosongkan; operasi booking berikutnya mendapat identifier baru. Tidak ada generator di render, dan tidak membuat identifier baru setelah backend sukses yang kemudian dapat menggagalkan navigasi. Checkout dan façade pembayaran memakai helper yang sama, tetap melalui kontrak idempotensi backend existing.

Tidak menambah penyimpanan PII/token/kode ke browser storage. Refresh tidak otomatis mengulang POST; akses booking existing mengikuti cookie/sesi dan rute existing. Kunci/draf yang belum berhasil diterima tidak dipersist ke storage: retry yang dijamin memakai kunci sama adalah retry dalam operasi halaman yang sama, bukan klaim pemulihan request yang ambigu sesudah seluruh halaman dimuat ulang.

## Clipboard dan API browser

`src/layanan/salin.ts` menggunakan Clipboard API jika tersedia dan berhasil. Jika tidak tersedia/izin ditolak, kode tracking yang sudah terotorisasi difokuskan dan dipilih melalui DOM Selection; UI meminta tekan lama → Salin pada HP atau Ctrl+C pada laptop. Tidak menampilkan sukses salin jika API gagal. Elemen kode diberi `tabIndex=0`. Tidak menggunakan layanan clipboard eksternal, URL, log atau storage untuk kode.

Clipboard otomatis tetap memerlukan secure context/izin browser; pemilihan manual bekerja melalui HTTP LAN. Komponen pratinjau historis hanya fixture test, dan panggilan clipboard di sana sudah memiliki catch; tidak dimuat oleh entry publik. Fetch, WebSocket, timer dan cookie sesi tetap digunakan melalui proxy/sumber data existing. Snap tetap script HTTPS Sandbox dari kontrak backend; callback bukan settlement. Tidak ada Service Worker atau Web Crypto subtle yang menjadi prasyarat halaman aktif.

## Konfigurasi jaringan dan Origin

- `npm.cmd run dev` memakai `vite.config.ts`: host `0.0.0.0`, port 5175, strictPort. Tidak ada CLI loopback yang menimpa config lagi. Listener existing saat audit sudah menggunakan `0.0.0.0:5175`; tidak dihentikan atau digandakan.
- Laptop: `http://localhost:5175`; HP pada Wi-Fi sama: `http://IP-LAPTOP:5175`. Gunakan IPv4 Wi-Fi aktif yang ditampilkan Vite/ipconfig. IP tertentu tidak di-hardcode dalam source aplikasi.
- Browser memakai `/api` dan `/socket.io` pada origin halaman. Proxy tetap menuju backend loopback 3000, WebSocket `ws:true`, tanpa menulis ulang Origin untuk melewati pemeriksaan. Backend tidak perlu dituju sebagai localhost dari HP.
- Allowlist guest REST dan Socket.IO kini memakai modul bersama `server/src/lib/asal-web-tamu.ts`. Selain konfigurasi eksplisit existing, mode non-Production hanya menambahkan HTTP port5175 untuk alamat RFC1918 dari interface lokal aktual. Bukan seluruh rentang IP privat, bukan wildcard, bukan IP HP, dan bukan port backend.
- `NODE_ENV=production` tidak menambah alamat LAN otomatis; hanya allowlist eksplisit/default existing. Cookie Secure Production, Origin wajib untuk mutasi/guest socket, sesi HttpOnly, expiry/versi akses dan room scoped tidak dilonggarkan. Tetapkan Production environment serta origin HTTPS eksplisit ketika menyiapkan deployment.
- Setelah DHCP/interface berubah, jalankan ulang backend development agar snapshot allowlist Socket.IO mengikuti alamat baru. Tidak perlu mengedit IP dalam source atau credential.
- Tidak mengubah firewall, tunnel, port forwarding, backend bind atau environment asli. Gunakan Wi-Fi tepercaya. Jika firewall jaringan privat menghalangi, periksa izin port frontend5175 secara terbatas; jangan mematikan firewall global.

## Pengujian aktual

| Pemeriksaan | Hasil |
|---|---|
| Unit UUID | PASS: jalur native, getRandomValues, pola/bit v4/variant, 1.000 identifier berbeda, tidak memakai Math.random, gagal aman tanpa Crypto |
| Chrome desktop HTTP IP LAN aktual | PASS: `isSecureContext=false`, randomUUID undefined, getRandomValues tersedia; beranda/form tampil tanpa pageerror |
| Retry/double-submit/booking baru/refresh | PASS: seluruh POST diintersepsi, kunci tetap selama retry, submit kedua tertahan, booking baru mendapat kunci berbeda, refresh tidak mengirim POST ulang |
| Tanpa seluruh Web Crypto | PASS: halaman tetap tampil; submit menampilkan pesan pengacakan aman dan tidak mengirim POST |
| Tombol Salin Kode aktual di HTTP LAN | PASS: clipboard tidak tersedia maupun ditolak memilih kode; tidak mengklaim sukses; input tracking menerima kode yang ditempel/dimasukkan |
| localhost5175 dan IP LAN5175 | PASS: katalog melalui proxy HTTP200/lima layanan; localhost browser retry/double-submit lulus |
| Origin development/Production | PASS: hanya alamat adapter privat/port5175, alamat lain/port3000 ditolak; Production tidak auto-allow LAN |
| REST dan socket dengan sesi sah/Origin LAN | PASS pada fixture: sesi valid tetap hanya memperoleh room booking sendiri |
| Socket.IO, fallback, reconnect, pelunasan/invoice | PASS: browser Customer/Admin dan tracking existing pada fixture DB/provider MOCK |
| Tujuh suite integrasi | PASS: realtime guest12, realtime existing23, Midtrans17, guest12, tracking13, Staff10, browser Admin11; total98 kelompok |
| UI/kompatibilitas browser | PASS: 21 kasus, termasuk tiga LAN, delapan viewport, 14 UI existing, realtime, tracking dan reliability localhost |
| TypeScript/build | PASS Customer Web dan backend; kandidat commit parsial diuji tanpa menimpa pemformatan pengguna |
| Chrome Android fisik | USER-REPORTED PASS untuk beranda dan form melalui Wi-Fi tanpa ADB Reverse, dikonfirmasi pengguna pada sesi ini |
| Pembayaran di HP/provider nyata | NOT RUN; tidak disimpulkan dari MOCK atau konfirmasi tampilan |

Pengujian database hanya pada fixture existing terpisah dengan cleanup diverifikasi. Test LAN di aplikasi utama mengintersepsi seluruh POST booking; tidak membuat record/tagihan nyata. Regresi awal menemukan fixture Midtrans memakai jadwal hari ke14 pukul10 yang melewati batas14×24 jam saat suite dijalankan sebelum pukul10. Hanya fixture dipindahkan ke hari13 pukul16; tidak mengubah validasi jadwal atau aturan pembayaran.

## Menjalankan tes

```powershell
# Dari Customer Web
node tests/uji-idempotensi.mjs
npm.cmd run build
# Isi hanya URL publik LAN saat ini pada environment terminal test:
$env:LAN_TEST_ORIGIN='http://IP-LAPTOP:5175'
node node_modules/@playwright/test/cli.js test --config playwright.lan.config.ts
```

`LAN_TEST_ORIGIN` hanya parameter proses pengujian, tidak menyunting `.env`. Untuk fixture DB/socket, gunakan runner terisolasi existing dan jangan arahkan ke database aplikasi utama. Tidak menginstal paket baru.

## Git dan batasan

Perubahan historis Prisma staged, dashboard/F10, Staff, Native arsip, serta seluruh WIP Customer Web dipertahankan. File BookingTamu, façade kontrak dan Vite memakai commit parsial sehingga format pengguna tidak ikut di-commit. Package-lock dan credential tetap identik. Hanya commit lokal; tanpa push/merge/PR/deploy.

HTTP LAN cukup untuk alur yang diuji beserta fallback. Untuk Clipboard otomatis dan deployment, gunakan HTTPS dengan sertifikat yang dipercaya browser/HP. Vite mendukung `server.https` dengan sertifikat; konfigurasi TLS/instalasi sertifikat tidak dilakukan pada tugas ini. Tidak memakai flag browser untuk menonaktifkan keamanan.

Referensi: [MDN randomUUID](https://developer.mozilla.org/en-US/docs/Web/API/Crypto/randomUUID), [MDN getRandomValues](https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues), [Vite host/proxy/HTTPS](https://vite.dev/config/server-options).
