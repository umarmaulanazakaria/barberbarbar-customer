import { test, expect } from "@playwright/test";

test("Isolasi Customer A dan B: REST, detail, room realtime dan invoice",async({browser,baseURL})=>{
  const asal=baseURL!,fixture="http://127.0.0.1:3185",a=await browser.newContext(),b=await browser.newContext();
  try {
    const layanan=await (await a.request.get(asal+"/api/public/services")).json() as {id:number}[];
    const nomor:string[]=[];
    for(const [i,c] of [a,b].entries()){
      const hari=new Date(Date.now()+7*3600000+(10+i)*86400000).toISOString().slice(0,10);
      const r=await c.request.post(asal+"/api/guest/bookings/session",{headers:{Origin:asal},data:{nama:i===0?"Pelanggan Isolasi A":"Pelanggan Isolasi B",nomorTelepon:i===0?"081234567891":"081234567892",mulaiPada:hari+"T14:00:00+07:00",items:[{layananId:layanan[0].id,qty:1}],kunciIdempotensi:crypto.randomUUID()}});
      expect(r.status()).toBe(201);nomor.push((await r.json()).booking.nomorBooking);
    }
    const pa=await a.newPage(),pb=await b.newPage();
    // Hilangkan polling hanya di pengujian ini untuk membuktikan isolasi event.
    await pb.addInitScript(()=>{const interval=window.setInterval.bind(window);window.setInterval=(h,t,...args)=>interval(t===10000?()=>{}:h,t,...args);});
    let bacaB=0;pb.on("request",r=>{if(r.url().includes("/session/current"))bacaB++;});
    await pa.goto(asal+"/#/kunjungan/detail");await pb.goto(asal+"/#/kunjungan/detail");
    await expect(pa.getByTestId("nomor-booking")).toHaveText(nomor[0]);await expect(pb.getByTestId("nomor-booking")).toHaveText(nomor[1]);
    await expect(pa.getByText("Pelanggan Isolasi B",{exact:true})).toHaveCount(0);await expect(pb.getByText("Pelanggan Isolasi A",{exact:true})).toHaveCount(0);
    await expect.poll(async()=> (await (await a.request.get(fixture+"/__fixture/socket/audit")).json()).guests).toBe(2);
    await pb.waitForTimeout(350);const awal=bacaB;
    // Parameter identitas publik tidak dapat mengganti booking milik sesi B.
    const current=await (await b.request.get(asal+"/api/guest/bookings/session/current?nomorBooking="+encodeURIComponent(nomor[0]))).json();expect(current.booking.nomorBooking).toBe(nomor[1]);
    expect((await a.request.post(asal+"/api/guest/bookings/session/checkout",{headers:{Origin:asal},data:{tujuan:"DP",kunciIdempotensi:crypto.randomUUID()}})).status()).toBe(200);
    const cookie=(await a.cookies()).find(c=>c.name==="bb_guest_session")!;
    expect((await a.request.post(fixture+"/__fixture/settle",{headers:{Cookie:"bb_guest_session="+cookie.value}})).status()).toBe(200);
    await expect(pa.getByTestId("status-booking")).toHaveText("Booking dikonfirmasi");await pb.waitForTimeout(500);
    await expect(pb.getByTestId("status-booking")).toHaveText("Menunggu pembayaran DP");expect(bacaB).toBe(awal);
    const invoice=await b.request.get(asal+"/api/guest/bookings/session/invoice");expect(invoice.status()).toBe(409);expect(await invoice.text()).not.toContain(nomor[0]);
    await expect(pb.getByTestId("nomor-invoice")).toHaveCount(0);
  } finally {await a.close();await b.close();}
});

// Wajib server serve-guest-browser.mjs: guard database fixture dan provider MOCK.
test("Realtime guest: settlement, Staff, fallback, reconnect, invoice dan pencabutan sesi", async ({ page, context, browser }) => {
  const fixture = "http://127.0.0.1:3185";
  expect((await context.request.get(fixture + "/__fixture/health")).status()).toBe(200);
  const errors: string[] = [];
  await page.addInitScript(() => {
    const interval = window.setInterval.bind(window);
    window.setInterval = (handler, timeout, ...args) => interval(timeout === 10000 ? () => {
      if ((window as unknown as { fallbackUji?: boolean }).fallbackUji && typeof handler === "function") handler(...args);
    } : handler, timeout, ...args);
  });
  page.on("pageerror", e => errors.push(e.name));
  const post = async (p: string) => expect((await context.request.post(fixture + "/__fixture/" + p)).status()).toBe(200);
  const audit = async () => (await context.request.get(fixture + "/__fixture/socket/audit")).json() as Promise<{guests: number; operators: number; connections: number}>;
  const adminContext = await browser.newContext(), adminPage = await adminContext.newPage();
  adminPage.on("pageerror", e => errors.push(e.name));
  await adminPage.goto("http://127.0.0.1:5188/login");
  await adminPage.locator('input[type="email"]').fill("admin-browser-guest@example.invalid");
  await adminPage.locator('input[type="password"]').fill("fixture-only-browser");
  await adminPage.getByRole("button", {name:"Masuk",exact:true}).click();
  await expect(adminPage.getByRole("heading", {name:"Dashboard",exact:true})).toBeVisible();
  await adminPage.goto("http://127.0.0.1:5188/orders?jenis=BOOKING&periode=SEMUA");
  await expect.poll(async () => (await audit()).operators).toBe(1);
  const rowAdmin = adminPage.locator("tbody tr").filter({hasText:"Customer Realtime Fixture"});
  await page.route("https://app.sandbox.midtrans.com/snap/snap.js", r => r.fulfill({contentType:"application/javascript",body:"window.snap={pay:(t,o)=>{window.__snapPretend=true;o.onSuccess();}}"}));
  await page.goto("/#/booking");
  await page.getByLabel("Nama lengkap").fill("Customer Realtime Fixture");
  await page.getByLabel("Nomor HP", { exact: false }).fill("081234567890");
  await page.getByRole("checkbox", { name: "Guest Browser Haircut", exact: false }).check();
  await page.getByLabel("Tanggal layanan").fill(new Date(Date.now()+7*3600000+5*86400000).toISOString().slice(0,10));
  await page.getByLabel("Jam layanan").fill("14:00");
  await page.getByRole("button", { name: "Buat booking dan lanjut ke DP" }).click();
  await expect(page.getByTestId("status-booking")).toHaveText("Menunggu pembayaran DP");
  await expect(rowAdmin).toBeVisible({timeout:5000});
  await expect.poll(async () => (await audit()).guests).toBe(1);
  const koneksiAwal = (await audit()).connections;
  await page.getByRole("link", { name: "Lanjut ke pembayaran" }).click();
  await page.getByRole("button", { name: "Bayar DP 50% dengan Snap" }).click();
  await expect.poll(() => page.evaluate(() => Boolean((window as unknown as {__snapPretend?:boolean}).__snapPretend))).toBe(true);
  await expect(page.getByTestId("dp-sah")).toHaveText("Belum terverifikasi");
  // Abaikan seluruh GET periodik agar PASS perubahan berikut hanya mungkin lewat event.
  let baca = 0;
  page.on("request", r => { if (r.url().includes("/session/current")) baca++; });
  const awal = baca;
  await post("settle");
  await expect(page.getByTestId("status-booking")).toHaveText("Booking dikonfirmasi", { timeout: 5000 });
  await expect(rowAdmin).toContainText("Dikonfirmasi", {timeout:5000});
  await expect(page.getByTestId("kode-tracking")).toBeVisible();
  expect(baca).toBeGreaterThan(awal);
  for (const [action, label] of [["check-in", "Sudah check-in"], ["start", "Sedang dilayani"]]) {
    await post("service/" + action);
    await expect(page.getByTestId("status-booking")).toHaveText(label, {timeout:5000});
  }
  expect((await audit()).connections).toBe(koneksiAwal); // re-render/navigasi tidak membuka socket baru
  await post("socket/pause");
  await expect.poll(async () => (await audit()).guests).toBe(0);
  await page.evaluate(() => { (window as unknown as { fallbackUji?: boolean }).fallbackUji = true; });
  await post("service/complete");
  await expect(page.getByTestId("status-booking")).toHaveText("Layanan selesai", {timeout:16000}); // REST fallback 10 detik
  await page.evaluate(() => { (window as unknown as { fallbackUji?: boolean }).fallbackUji = false; });
  for (let i=0;i<2;i++) {
    const sebelumReconnect = baca;
    await post("socket/resume");
    await expect.poll(async () => (await audit()).guests, {timeout:20000}).toBe(1);
    await expect.poll(() => baca).toBeGreaterThan(sebelumReconnect);
    if (i===0) { await post("socket/pause"); await expect.poll(async () => (await audit()).guests).toBe(0); }
  }
  await page.getByRole("link", { name: "Lacak Booking", exact: true }).click();
  await expect.poll(async () => (await audit()).guests).toBe(0);
  await page.getByRole("link", { name: "Lanjutkan booking pada browser ini" }).click();
  await expect.poll(async () => (await audit()).guests).toBe(1);
  await page.getByRole("link", { name: "Lanjut ke pembayaran" }).click();
  const checkoutPelunasan = page.waitForResponse(r => new URL(r.url()).pathname.endsWith("/session/checkout") && r.request().method() === "POST");
  await page.getByRole("button", { name: "Bayar sisa pelunasan dengan Snap" }).click();
  expect((await checkoutPelunasan).status()).toBe(200);
  // Halaman invoice yang dibuka sebelum PAID harus menunggu pengesahan REST,
  // lalu berubah otomatis setelah payment.changed, tanpa navigasi ulang.
  await page.evaluate(() => { window.location.hash = "/kunjungan/invoice"; });
  await expect(page.getByTestId("nomor-invoice")).toHaveCount(0);
  await post("settle");
  await expect(page.getByTestId("nomor-invoice")).toHaveText(/^INV-BKG-/, {timeout:5000});
  await expect(page.getByRole("article", { name: "Invoice final" })).toContainText("Lunas", {timeout:5000});
  await expect(rowAdmin).toContainText("Pembayaran Berhasil", {timeout:5000});
  await post("settle"); // replay tidak mengkredit dua kali
  await page.getByRole("link", { name: "Detail", exact: true }).click();
  await page.getByRole("link", { name: "Lihat invoice final" }).click();
  await expect(page.getByTestId("nomor-invoice")).toHaveText(/^INV-BKG-/);
  expect(await (await context.request.get(fixture + "/__fixture/audit")).json()).toEqual({creditCount:2,invoiceCount:1});
  await post("revoke");
  await expect(page.getByRole("alert")).toContainText("Kode booking tidak ditemukan", {timeout:5000});
  await expect(page.getByTestId("kode-tracking")).toHaveCount(0);
  await expect(page.getByTestId("nomor-invoice")).toHaveCount(0);
  await expect.poll(async () => (await audit()).guests).toBe(0);
  expect(errors).toEqual([]);
  await adminContext.close();
});
