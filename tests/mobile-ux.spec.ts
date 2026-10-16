import { test, expect } from "@playwright/test";
import type { DetailTamu } from "../src/layanan/guest";

const ukuran = [320, 360, 375, 390, 412, 430, 768, 1440];
const layanan = [
  { id: 901, nama: "Potong Rambut", harga: 35000, durasiMenit: 30 },
  { id: 902, nama: "Perawatan Rambut dan Penataan untuk Kunjungan Spesial", harga: 50000, durasiMenit: 45 },
];
for (const width of ukuran) test(`Beranda dan form sentuh ${width}px`, async ({ page }) => {
  const galat: string[] = [];
  page.on("pageerror", e => galat.push(e.message));
  await page.route("**/api/public/services", r => r.fulfill({ json: layanan }));
  await page.route("**/api/public/booking-availability", r => r.fulfill({ json: { tersedia: true } }));
  await page.setViewportSize({ width, height: 844 });
  await page.goto("/");
  const mulai = page.locator(".aksi-hero").getByRole("link", { name: "Mulai Booking" });
  await expect(mulai).toBeVisible();
  await expect(page.locator(".aksi-hero").getByRole("link", { name: "Lacak Booking" })).toHaveAttribute("href", "#/lacak");
  await expect(page.locator(".kartu-layanan")).toHaveCount(2);
  await expect(page.locator(".kartu-layanan").first()).toContainText("35.000");
  if (width < 768) {
    expect((await mulai.boundingBox())!.y).toBeLessThan(650);
    await expect(page.locator(".visual-hero")).toBeHidden();
  }
  await mulai.click();
  await expect(page.getByLabel("Nama lengkap")).toBeVisible();
  await expect(page.getByLabel("Nomor HP", { exact: false })).toHaveAttribute("inputmode", "tel");
  const kirim = page.locator('button[type="submit"]');
  await kirim.click();
  await expect(page.getByLabel("Nama lengkap")).toBeFocused();
  await expect(page.locator("#error-nama")).toBeVisible();
  await page.getByLabel("Nama lengkap").fill("Pelanggan Uji");
  await page.getByLabel("Nomor HP", { exact: false }).fill("081234567890");
  await page.getByRole("checkbox").first().check();
  const tambah = page.getByRole("button", { name: "Tambah Potong Rambut", exact: true });
  const kotak = (await tambah.boundingBox())!;
  expect(kotak.width).toBeGreaterThanOrEqual(44);
  expect(kotak.height).toBeGreaterThanOrEqual(44);
  await tambah.click();
  await expect(page.getByLabel("Jumlah Potong Rambut", { exact: true })).toHaveText("2");
  await page.getByRole("checkbox").nth(1).check();
  await expect(page.getByTestId("estimasi-total")).toContainText("120.000");
  await page.getByRole("checkbox").nth(1).uncheck();
  await expect(page.getByTestId("estimasi-total")).toContainText("70.000");
  await page.getByLabel("Tanggal layanan").fill("2020-01-01");
  await page.getByLabel("Jam layanan").fill("14:00");
  await kirim.click();
  await expect(page.locator("#error-tanggal")).toBeVisible();
  await expect(page.getByLabel("Tanggal layanan")).toBeFocused();
  await expect(page.locator("form")).not.toContainText(/pilih barber|login/i);
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  // Reduced visual viewport checks layout recovery, not a physical mobile keyboard.
  await page.setViewportSize({ width, height: 420 });
  await page.getByLabel("Nomor HP", { exact: false }).focus();
  await expect(page.getByLabel("Nomor HP", { exact: false })).toBeInViewport();
  await page.setViewportSize({ width, height: 844 });
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(galat).toEqual([]);
});

test("Katalog loading, error dan kosong tetap dapat dipahami", async ({ page }) => {
  let mode: "loading" | "error" | "kosong" = "loading";
  let lepas!: () => void;
  const tunggu = new Promise<void>(resolve => { lepas = resolve; });
  await page.route("**/api/public/booking-availability", r => r.fulfill({ json: { tersedia: true } }));
  await page.route("**/api/public/services", async r => {
    if (mode === "loading") await tunggu;
    await r.fulfill(mode === "kosong" ? { json: [] } : { status: 503, json: { pesan: "Tidak tersedia" } });
  });
  await page.goto("/");
  await expect(page.getByRole("status")).toContainText("Memuat layanan");
  await expect.poll(() => Boolean(lepas)).toBe(true);
  mode = "error"; lepas!();
  await expect(page.getByRole("alert")).toBeVisible();
  mode = "kosong";
  await page.getByRole("button", { name: "Coba muat layanan lagi" }).click();
  await expect(page.getByText("Belum ada layanan yang tersedia. Silakan hubungi barbershop.")).toBeVisible();
  await expect(page.locator("body")).not.toContainText(/Preview|layanan demo/i);
});

test("Emulasi touch: input dan CTA tidak tertutup navigasi pada viewport pendek", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 420 }, isMobile: true, hasTouch: true });
  try {
    await context.route("**/api/public/services", r => r.fulfill({ json: layanan }));
    await context.route("**/api/public/booking-availability", r => r.fulfill({ json: { tersedia: true } }));
    const page = await context.newPage();
    await page.goto("http://127.0.0.1:5190/#/booking");
    await page.getByLabel("Nomor HP", { exact: false }).focus();
    await expect(page.locator(".nav-mobile")).toBeHidden();
    await expect(page.getByLabel("Nomor HP", { exact: false })).toBeInViewport();
    await page.locator("h1").focus();
    await expect(page.locator(".nav-mobile")).toBeVisible();
    const submit = page.locator('form button[type="submit"]');
    await submit.scrollIntoViewIfNeeded();
    const posisi = (await submit.boundingBox())!;
    const navigasi = (await page.locator(".nav-mobile").boundingBox())!;
    expect(posisi.y + posisi.height).toBeLessThanOrEqual(navigasi.y);
  } finally { await context.close(); }
});

test("Audit state booking, pembayaran dan sesi pada delapan viewport", async ({ page }) => {
  test.setTimeout(120000);
  const baru = (): DetailTamu => {
    const kini = new Date().toISOString();
    return { serverTime: kini, booking: {
      nomorBooking: "BB-AUDIT-UX", status: "AWAITING_DP", mulaiPada: new Date(Date.now()+86400000).toISOString(),
      selesaiPada: new Date(Date.now()+88200000).toISOString(), durasiMenit: 30, dibuatPada: kini,
      deadlineDp: new Date(Date.now()+900000).toISOString(), deadlinePelunasan: null, barber: null,
      dikonfirmasiPada: null, checkInPada: null, layananMulaiPada: null, layananSelesaiPada: null,
      aksesTamu: { nama: "Pelanggan Uji", nomorTelepon: "081234567890", kedaluwarsaPada: new Date(Date.now()+86400000).toISOString() },
      items: [{ layananId:901,namaLayanan:"Potong Rambut",qty:1,harga:35000,subtotal:35000,durasiMenit:30 }],
    }, ringkasan: { subtotal:35000,total:35000,nominalDpAwal:17500,jumlahDibayar:0,balance:35000,dpTerverifikasi:false,
      statusPembayaran:"UNPAID",invoiceSementara:true,invoice:null,transaksi:[] } };
  };
  let data = baru(), mode = "ringkasan";
  let tunda: Promise<void> | null = null;
  let lepasTunda = () => {};
  await page.routeWebSocket("**/socket.io/**", ws => ws.close());
  await page.route("**/api/**", async r => {
    const p = new URL(r.request().url()).pathname;
    if (p.endsWith("/public/services")) return r.fulfill({ json: layanan });
    if (p.endsWith("/public/booking-availability")) return r.fulfill({ json: { tersedia:true } });
    if (p.endsWith("/session/tracking")) return r.fulfill({ json: { kode:data.ringkasan.dpTerverifikasi ? "BB-"+Array(8).fill("AB12").join("-") : null } });
    if (mode === "loading") await tunda;
    if (mode === "error" || mode === "sesi") return r.fulfill({ status:mode === "sesi" ? 404 : 503,json:{ pesan:"Akses booking belum tersedia. Lacak kembali booking Anda." } });
    return r.fulfill({ json: { ...data,invoice:data.ringkasan.invoice } });
  });
  for (const width of ukuran) {
    await page.setViewportSize({ width,height:844 });
    for (const state of ["ringkasan","pending","expired","confirmed","pelunasan","invoice","error","sesi","loading"]) {
      mode=state; data=baru();
      if (state === "loading") tunda=new Promise<void>(resolve => { lepasTunda=resolve; });
      if (state === "pending") data.ringkasan.transaksi=[{ id:1,tujuan:"DP",status:"PENDING",nominal:17500 }];
      if (state === "expired") data.booking.deadlineDp=new Date(Date.now()-1000).toISOString();
      if (["confirmed","pelunasan","invoice"].includes(state)) {
        data.booking.status=state === "confirmed" ? "CONFIRMED" : "COMPLETED";
        Object.assign(data.ringkasan,{dpTerverifikasi:true,jumlahDibayar:17500,balance:17500,statusPembayaran:"DP_PAID"});
      }
      if (state === "invoice") Object.assign(data.ringkasan,{jumlahDibayar:35000,balance:0,statusPembayaran:"PAID",invoiceSementara:false,invoice:{nomorInvoice:"INV-UX-TEST",total:35000,dibuatPada:new Date().toISOString()}});
      await page.goto("/?audit="+state+width+"#/kunjungan"+(state === "invoice" ? "/invoice" : ["pending","expired","pelunasan"].includes(state) ? "/pembayaran" : "/detail"));
      if (state === "error" || state === "sesi") await expect(page.getByRole("alert")).toBeVisible();
      else {
        if (state === "loading") {
          await expect(page.getByRole("status").first()).toContainText("Memuat booking");
          lepasTunda();
        }
        await expect(page.getByTestId("nomor-booking")).toHaveText("BB-AUDIT-UX");
        if (state === "confirmed") await expect(page.getByTestId("kode-tracking")).toBeVisible();
        if (state === "invoice") await expect(page.getByTestId("nomor-invoice")).toHaveText("INV-UX-TEST");
      }
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
  }
});
