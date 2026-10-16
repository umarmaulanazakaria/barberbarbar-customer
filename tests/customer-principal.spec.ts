import { test, expect } from "@playwright/test";
import type { DetailTamu } from "../src/layanan/guest";

// UI produksi, seluruh API diintersepsi. Tidak menyentuh database/provider.
const lebarLayar = [320, 360, 375, 390, 412, 430, 768, 1440];
const kode = "BB-" + Array(8).fill("AB12").join("-");
const katalog = [
  { id: 1, nama: "Potong Rambut", harga: 20000, durasiMenit: 30 },
  { id: 2, nama: "Cuci Rambut", harga: 10000, durasiMenit: 15 },
];
function detail(): DetailTamu {
  const sekarang = new Date().toISOString();
  return {
    serverTime: sekarang,
    booking: {
      nomorBooking: "BB-UJI-WEB", status: "AWAITING_DP",
      mulaiPada: new Date(Date.now() + 86400000).toISOString(),
      selesaiPada: new Date(Date.now() + 90000000).toISOString(),
      durasiMenit: 60, dibuatPada: sekarang,
      deadlineDp: new Date(Date.now() + 900000).toISOString(),
      deadlinePelunasan: null, barber: null, dikonfirmasiPada: null,
      checkInPada: null, layananMulaiPada: null, layananSelesaiPada: null,
      aksesTamu: { nama: "Customer Fixture", nomorTelepon: "081234567890", kedaluwarsaPada: new Date(Date.now() + 86400000).toISOString() },
      items: katalog.map(l => ({ layananId: l.id, namaLayanan: l.nama, qty: 1, harga: l.harga, subtotal: l.harga, durasiMenit: l.durasiMenit })),
    },
    ringkasan: { subtotal: 30000, total: 30000, nominalDpAwal: 15000, jumlahDibayar: 0, balance: 30000, dpTerverifikasi: false, statusPembayaran: "UNPAID", invoiceSementara: true, invoice: null, transaksi: [] },
  };
}

test("Customer utama: delapan viewport, otoritas pembayaran, tracking dan invoice", async ({ page }) => {
  const gangguan: string[] = [];
  page.on("pageerror", e => gangguan.push(e.name));
  page.on("console", m => { if (m.type() === "error") gangguan.push(m.text()); });
  let data = detail();
  const takDikenal: string[] = [];
  await page.route("**/api/**", async r => {
    const p = new URL(r.request().url()).pathname;
    if (p === "/api/public/services") return r.fulfill({ json: katalog });
    if (p === "/api/public/booking-availability") return r.fulfill({ json: { tersedia: true } });
    if (p.endsWith("/session/current") || p.endsWith("/session/sync")) return r.fulfill({ json: data });
    if (p.endsWith("/session/tracking")) return r.fulfill({ json: { kode: data.ringkasan.dpTerverifikasi ? kode : null } });
    if (p.endsWith("/session/invoice")) return r.fulfill({ json: { ...data, invoice: data.ringkasan.invoice } });
    takDikenal.push(p);
    return r.abort();
  });
  for (const width of lebarLayar) {
    await page.setViewportSize({ width, height: 950 });
    for (const route of ["/", "/booking", "/lacak", "/kunjungan/detail", "/kunjungan/pembayaran"]) {
      await page.goto("/#" + route);
      await expect(page.locator("h1")).toBeVisible();
      if (route === "/booking") {
        await expect(page.getByLabel("Nama lengkap")).toBeVisible();
        await expect(page.getByRole("checkbox")).toHaveCount(2);
        await expect(page.locator("form select")).toHaveCount(0);
        await expect(page.locator("form")).not.toContainText(/login|membership|pilih barber/i);
      }
      await expect(page.locator("body")).not.toContainText(/PREVIEW|SIMULASI|Demo UI/);
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
    await expect(page.getByTestId("dp-sah")).toHaveText("Belum terverifikasi");
  }
  for (const [status, label] of [["PENDING", "Menunggu pembayaran"], ["FAILED", "Gagal"], ["EXPIRED", "Kedaluwarsa"]]) {
    data.ringkasan.transaksi = [{ id: 1, tujuan: "DP", status, nominal: 15000 }];
    await page.getByRole("button", { name: "Perbarui status booking" }).click();
    await expect(page.locator("section").filter({ has: page.getByRole("heading", { name: "Riwayat pembayaran" }) })).toContainText(label);
    await expect(page.getByTestId("dp-sah")).toHaveText("Belum terverifikasi");
    await expect(page.getByTestId("kode-tracking")).toHaveCount(0);
  }
  data.booking.deadlineDp = new Date(Date.now() - 1000).toISOString();
  await page.getByRole("button", { name: "Perbarui status booking" }).click();
  await expect(page.getByRole("button", { name: "Bayar DP 50% dengan Snap" })).toHaveCount(0);
  await expect(page.getByTestId("countdown-aktual")).toHaveText("00:00");
  data.booking.status = "CONFIRMED";
  data.booking.dikonfirmasiPada = new Date().toISOString();
  Object.assign(data.ringkasan, { dpTerverifikasi: true, jumlahDibayar: 15000, balance: 15000, statusPembayaran: "DP_PAID" });
  await page.getByRole("button", { name: "Perbarui status booking" }).click();
  await expect(page.getByTestId("kode-tracking")).toHaveText(kode);
  data.booking.status = "COMPLETED";
  Object.assign(data.ringkasan, { jumlahDibayar: 30000, balance: 0, statusPembayaran: "PAID", invoiceSementara: false, invoice: { nomorInvoice: "INV-BKG-UJI", total: 30000, dibuatPada: new Date().toISOString() } });
  for (const width of lebarLayar) {
    await page.setViewportSize({ width, height: 950 });
    await page.goto("/#/kunjungan/invoice");
    await expect(page.getByTestId("nomor-invoice")).toHaveText("INV-BKG-UJI");
    await expect(page.getByTestId("balance")).toHaveText(/0/);
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  expect(takDikenal).toEqual([]);
  expect(gangguan).toEqual([]);
});
