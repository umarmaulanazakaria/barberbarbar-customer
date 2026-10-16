import { expect, test, type Page } from '@playwright/test';

const katalog = [
  { id: 1, nama: 'Signature Haircut', harga: 50000, durasiMenit: 30, internal: 'TIDAK BOLEH TAMPIL' },
  { id: 2, nama: 'Hair Wash & Styling', harga: 25000, durasiMenit: 20 },
  { id: 3, nama: 'Beard Trim', harga: 30000, durasiMenit: 20 },
  { id: 4, nama: 'Haircut & Clean Shave', harga: 75000, durasiMenit: 50 },
];
const tanggal = () => new Date(Date.now() + 7 * 3_600_000 + 2 * 86_400_000).toISOString().slice(0, 10);
const gangguan = new Map<Page, string[]>();
test.beforeEach(async ({ page }) => {
  const tidakDiizinkan: string[] = []; gangguan.set(page, tidakDiizinkan);
  await page.route('**/api/**', async r => {
    if (new URL(r.request().url()).pathname === '/api/public/services' && r.request().method() === 'GET')
      await r.fulfill({ json: katalog });
    else { tidakDiizinkan.push(`${r.request().method()} ${new URL(r.request().url()).pathname}`); await r.abort(); }
  });
  page.on('pageerror', e => tidakDiizinkan.push(`pageerror: ${e.message}`));
});
test.afterEach(async ({ page }) => { expect(gangguan.get(page)).toEqual([]); gangguan.delete(page); });
async function isiForm(page: Page) {
  await page.goto('/#/booking');
  await page.getByLabel('Nama lengkap').fill('Pelanggan Dummy');
  await page.getByLabel('Nomor HP', { exact: false }).fill('081234567890');
  await page.getByRole('checkbox', { name: 'Signature Haircut', exact: false }).check();
  await page.getByLabel('Tanggal layanan').fill(tanggal());
  await page.getByLabel('Jam layanan').fill('14:00');
}
async function bukaPratinjau(page: Page) { await isiForm(page); await page.getByRole('button', { name: 'Lihat pratinjau booking' }).click(); await expect(page.getByRole('heading', { level: 1 })).toHaveText('Begini rencana kunjunganmu.'); }

test('navigasi web dan katalog publik; tanpa autentikasi atau pemilihan barber', async ({ page }) => {
  const permintaan: { metode: string; auth: string | undefined }[] = [];
  page.on('request', r => { if (r.url().includes('/api/')) permintaan.push({ metode: r.method(), auth: r.headers().authorization }); });
  await page.goto('/'); await expect(page.getByRole('heading', { name: 'Signature Haircut' })).toBeVisible();
  await expect(page.getByText('Demo UI — belum terhubung ke proses booking/pembayaran')).toBeVisible();
  await expect(page.getByText('TIDAK BOLEH TAMPIL')).toHaveCount(0);
  await expect(page.getByRole('link', { name: /login|register|registrasi|masuk/i })).toHaveCount(0);
  await page.getByRole('link', { name: 'Pilih Signature Haircut' }).click();
  await expect(page.getByRole('checkbox', { name: 'Signature Haircut', exact: false })).toBeChecked();
  await expect(page.locator('form select')).toHaveCount(0);
  await expect(page.locator('form')).not.toContainText('Pilih barber');
  await page.goBack(); await expect(page.getByRole('heading', { level: 1 })).toContainText('Gaya baru.');
  expect(permintaan.length).toBeGreaterThan(0); expect(permintaan.every(p => p.metode === 'GET' && !p.auth)).toBeTruthy();
});
test('validasi field, fokus kesalahan, nomor HP dan jadwal terlewati', async ({ page }) => {
  await page.goto('/#/booking'); await page.getByRole('button', { name: 'Lihat pratinjau booking' }).click();
  await expect(page.getByLabel('Nama lengkap')).toBeFocused();
  await expect(page.getByText('Pilih minimal satu layanan dengan jumlah 1–10.')).toBeVisible();
  await page.getByLabel('Nama lengkap').fill('A'); await page.getByLabel('Nomor HP', { exact: false }).fill('hello');
  await page.getByLabel('Tanggal layanan').fill('2020-01-01'); await page.getByLabel('Jam layanan').fill('10:00');
  await page.getByRole('button', { name: 'Lihat pratinjau booking' }).click();
  await expect(page.getByText('Isi nama antara 2–80 karakter.')).toBeVisible();
  await expect(page.getByText('Gunakan nomor HP Indonesia, misalnya 081234567890.')).toBeVisible();
  await expect(page.getByText('Pilih tanggal layanan mulai hari ini (WIB).')).toBeVisible();
  await expect(page).toHaveURL(/#\/booking$/);
});
test('beberapa layanan, jumlah dan estimasi 50%; tidak ada request booking', async ({ page }) => {
  const mutasi: string[] = []; page.on('request', r => { if (r.method() !== 'GET') mutasi.push(r.url()); });
  await isiForm(page);
  await page.getByRole('button', { name: 'Tambah Signature Haircut' }).click();
  await page.getByRole('checkbox', { name: 'Hair Wash & Styling', exact: false }).check();
  await expect(page.getByTestId('estimasi-total')).toContainText('125.000'); await expect(page.getByTestId('estimasi-dp')).toContainText('62.500');
  await page.getByRole('button', { name: 'Lihat pratinjau booking' }).click();
  await expect(page.getByText('Belum diterbitkan', { exact: true })).toBeVisible();
  await expect(page.getByText('+6281234567890', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Tautan demo sesi ini')).toHaveValue(/#\/demo\/detail\/pratinjau-lokal$/);
  await expect(page.getByTestId('countdown')).toHaveText(/^(15:00|14:5\d)$/);
  expect(mutasi).toEqual([]);
});
test('pembayaran pending/success/failure tidak memalsukan verifikasi atau invoice', async ({ page }) => {
  const semuaRequest: string[] = []; page.on('request', r => semuaRequest.push(r.url()));
  await bukaPratinjau(page); await page.getByRole('link', { name: 'Lihat demo pembayaran' }).click();
  await expect(page.getByRole('button', { name: 'Buka Snap — belum tersedia' })).toBeDisabled();
  await page.getByRole('button', { name: 'Demo pending', exact: true }).click(); await expect(page.getByTestId('status-pembayaran')).toContainText('masih pending');
  await page.getByRole('button', { name: 'Demo callback sukses', exact: true }).click(); await expect(page.getByTestId('status-pembayaran')).toContainText('DP belum terverifikasi dan booking belum dikonfirmasi');
  await page.getByRole('button', { name: 'Demo gagal', exact: true }).click(); await expect(page.getByTestId('status-pembayaran')).toContainText('Tidak ada transaksi yang dibuat');
  await page.getByRole('navigation', { name: 'Halaman pratinjau' }).getByRole('link', { name: 'Detail', exact: true }).click();
  await expect(page.getByText('Belum tersedia', { exact: true })).toBeVisible();
  await expect(page.getByText('Belum ada tagihan backend', { exact: true })).toBeVisible();
  expect(semuaRequest.some(u => /midtrans|\/payments|\/customer\/bookings/.test(u))).toBeFalsy();
  await expect(page.locator('script[src*="midtrans"]')).toHaveCount(0);
});
test('countdown demo benar-benar berakhir tanpa mengubah status server', async ({ page }) => {
  await bukaPratinjau(page); await page.evaluate(() => { const n = Date.now() + 16 * 60_000; Date.now = () => n; });
  await expect(page.getByTestId('countdown')).toHaveText('00:00');
  await expect(page.getByText('Countdown demo berakhir. Ini tidak membatalkan atau mengubah booking server.')).toBeVisible();
  await expect(page.getByText('Pratinjau • tidak tersimpan', { exact: true })).toBeVisible();
});
test('tidak membaca booking tanpa token; tautan demo tidak membuka PII di tab baru', async ({ page, context }) => {
  await page.goto('/#/detail/123'); await expect(page.getByRole('heading', { name: 'Akses booking pribadi.' })).toBeVisible();
  await expect(page.getByText('Pelanggan Dummy')).toHaveCount(0);
  await bukaPratinjau(page); const tautan = await page.getByLabel('Tautan demo sesi ini').inputValue();
  const baru = await context.newPage(); await baru.route('**/api/**', r => r.fulfill({ json: katalog })); await baru.goto(tautan);
  await expect(baru.getByRole('heading', { name: 'Pratinjau tidak tersedia.' })).toBeVisible(); await expect(baru.getByText('Pelanggan Dummy')).toHaveCount(0); await baru.close();
  await page.reload(); await expect(page.getByRole('heading', { name: 'Pratinjau tidak tersedia.' })).toBeVisible();
  expect(await page.evaluate(() => ({ lokal: localStorage.length, sesi: sessionStorage.length, cookie: document.cookie }))).toEqual({ lokal: 0, sesi: 0, cookie: '' });
});
test('hapus pratinjau membersihkan data dan tautannya', async ({ page }) => {
  await bukaPratinjau(page); await page.getByRole('button', { name: 'Hapus data pratinjau dari tab ini' }).click();
  await expect(page).toHaveURL(/#\/$/); await page.goto('/#/demo/detail/pratinjau-lokal');
  await expect(page.getByRole('heading', { name: 'Pratinjau tidak tersedia.' })).toBeVisible(); await expect(page.getByText('Pelanggan Dummy')).toHaveCount(0);
});
test('kontrak guest dan Snap ditutup aman, termasuk akses tanpa token', async ({ page }) => {
  await page.goto('/');
  const hasil = await page.evaluate(async () => {
    const lokasi = '/src/layanan/kontrak.ts';
    const kontrak = await import(/* @vite-ignore */ lokasi);
    return Promise.all([
      kontrak.ambilBookingPribadi(''), kontrak.ambilBookingPribadi('token-fixture-bukan-secret'),
      kontrak.buatBookingTamu({ nama: 'Dummy', nomorTelepon: '081234567890', mulaiPada: '', items: [] }),
      kontrak.buatSnap(''), kontrak.buatSnap('token-fixture-bukan-secret'),
    ].map(p => p.then(() => 'BERHASIL_TIDAK_SEMESTINYA', (e: Error) => e.message)));
  });
  expect(hasil).toHaveLength(5); expect(hasil.every(p => !p.includes('BERHASIL_TIDAK_SEMESTINYA'))).toBeTruthy();
  expect(hasil[0]).toContain('Tautan pribadi yang valid diperlukan');
  expect(hasil[1]).toContain('Tidak ada data yang diminta');
  expect(hasil[2]).toContain('Tidak ada data yang dikirim');
  expect(hasil[4]).toContain('Tidak ada transaksi yang dibuat');
});
test('kegagalan katalog, empty state dan data malformed; demo selalu eksplisit', async ({ page }) => {
  await page.route('**/api/public/services', r => r.fulfill({ status: 503, json: { pesan: 'Rahasia internal fixture' } }));
  await page.goto('/'); await expect(page.getByRole('alert')).toContainText('Layanan publik belum dapat dimuat'); await expect(page.getByText('Rahasia internal fixture')).toHaveCount(0);
  await page.getByRole('button', { name: 'Gunakan layanan demo' }).click(); await expect(page.getByText('Layanan contoh • bukan daftar layanan aktual')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Signature Haircut' })).toBeVisible();
  await page.route('**/api/public/services', r => r.fulfill({ json: [] })); await page.getByRole('button', { name: 'Gunakan data publik' }).click();
  await expect(page.getByText('Belum ada layanan aktif yang tersedia.', { exact: false })).toBeVisible();
  await page.route('**/api/public/services', r => r.fulfill({ json: [{ id: 1, nama: 'Rusak', harga: -1 }] }));
  await page.getByRole('button', { name: 'Gunakan layanan demo' }).click(); await page.getByRole('button', { name: 'Gunakan data publik' }).click();
  await expect(page.getByRole('alert')).toBeVisible(); await expect(page.getByRole('heading', { name: 'Rusak' })).toHaveCount(0);
});
for (const lebar of [320, 375, 430, 768, 1440]) {
  test(`responsif ${lebar}px: beranda, form, detail, pembayaran`, async ({ page }) => {
    await page.setViewportSize({ width: lebar, height: 900 }); await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Signature Haircut' })).toBeVisible();
    const cekLebar = async () => expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
    await cekLebar(); await page.screenshot({ path: `test-results/visual/beranda-${lebar}.png`, fullPage: true });
    await isiForm(page); await cekLebar(); await page.screenshot({ path: `test-results/visual/form-${lebar}.png`, fullPage: true });
    await page.getByRole('button', { name: 'Lihat pratinjau booking' }).click(); await cekLebar(); await page.screenshot({ path: `test-results/visual/ringkasan-${lebar}.png`, fullPage: true });
    await page.getByRole('navigation', { name: 'Halaman pratinjau' }).getByRole('link', { name: 'Detail', exact: true }).click();
    await cekLebar(); await page.screenshot({ path: `test-results/visual/detail-${lebar}.png`, fullPage: true });
    await page.getByRole('link', { name: 'Lihat demo pembayaran' }).click(); await page.getByRole('button', { name: 'Demo callback sukses' }).click(); await cekLebar();
    await page.screenshot({ path: `test-results/visual/pembayaran-${lebar}.png`, fullPage: true });
  });
}
