import { test, expect } from "@playwright/test";
test("HTTP LAN asli: render, UUID fallback, retry/double-submit dan booking baru", async ({page,baseURL}) => {
  expect(new URL(baseURL!).hostname).not.toBe("localhost");
  const errors:string[]=[],keys:string[]=[];page.on("pageerror",e=>errors.push(e.name));
  let mode:"timeout"|"hold"|"success"="timeout",lepas:(()=>void)|undefined;
  await page.route(/\/guest\/bookings\/session\/?$/,async r=>{
    expect(r.request().method()).toBe("POST");keys.push(r.request().postDataJSON().kunciIdempotensi);
    if(mode==="timeout")return r.abort("timedout");
    if(mode==="hold") {await new Promise<void>(resolve=>{lepas=resolve});return r.fulfill({status:503,json:{}})}
    return r.fulfill({status:201,json:{booking:{nomorBooking:"BB-TEST-INTERCEPT"},serverTime:new Date().toISOString()}});
  });
  await page.goto("/");
  expect(await page.evaluate(()=>({secure:isSecureContext,uuid:typeof crypto.randomUUID,random:typeof crypto.getRandomValues}))).toEqual({secure:false,uuid:"undefined",random:"function"});
  await expect(page.locator("h1")).toContainText("Gaya baru");
  const isi=async()=>{await page.goto("/#/booking");await page.getByLabel("Nama lengkap").fill("Uji browser tidak dikirim");await page.getByLabel("Nomor HP",{exact:false}).fill("081234567890");await page.getByRole("checkbox").first().check();await page.getByLabel("Tanggal layanan").fill(new Date(Date.now()+7*3600000+86400000).toISOString().slice(0,10));await page.getByLabel("Jam layanan").fill("14:00")};
  await isi();const submit=page.locator('form button[type="submit"]');await submit.click();
  await expect(page.getByRole("alert")).toContainText("Hasil permintaan belum dapat dipastikan");
  expect(keys[0]).toMatch(/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/);
  mode="hold";await submit.click();await expect.poll(()=>keys.length).toBe(2);await page.locator("form").dispatchEvent("submit");expect(keys).toHaveLength(2);expect(keys[1]).toBe(keys[0]);
  await expect.poll(()=>Boolean(lepas)).toBe(true);lepas!();await expect(submit).toBeEnabled();mode="success";await submit.click();await expect(page).toHaveURL(/#\/kunjungan$/);expect(keys[2]).toBe(keys[0]);
  await isi();await submit.click();await expect(page).toHaveURL(/#\/kunjungan$/);expect(keys[3]).not.toBe(keys[0]);
  await page.reload();await expect(page.locator("h1")).toBeVisible();expect(keys).toHaveLength(4);expect(errors).toEqual([]);
});
test("Tanpa seluruh Web Crypto: halaman tetap tampil, submit ditolak dengan pesan aman",async({page})=>{
  await page.addInitScript(()=>{Object.defineProperty(window,"crypto",{value:undefined,configurable:true})});
  const errors:string[]=[];page.on("pageerror",e=>errors.push(e.name));let posts=0;
  await page.route(/\/guest\/bookings\/session\/?$/,r=>{posts++;return r.abort()});
  await page.goto("/#/booking");await page.getByLabel("Nama lengkap").fill("Tidak dikirim");await page.getByLabel("Nomor HP",{exact:false}).fill("081234567890");await page.getByRole("checkbox").first().check();await page.getByLabel("Tanggal layanan").fill(new Date(Date.now()+7*3600000+86400000).toISOString().slice(0,10));await page.getByLabel("Jam layanan").fill("14:00");await page.locator('form button[type="submit"]').click();
  await expect(page.getByRole("alert")).toContainText("pengacakan aman");expect(posts).toBe(0);expect(errors).toEqual([]);
});
test("Clipboard tidak tersedia/ditolak: kode dipilih tanpa klaim sukses dan dapat ditempel",async({page})=>{
  const kode="BB-"+Array(8).fill("A123").join("-");
  const waktu=new Date().toISOString();
  await page.route("**/api/guest/bookings/session/current",r=>r.fulfill({json:{serverTime:waktu,booking:{nomorBooking:"BB-TEST-CLIPBOARD",status:"CONFIRMED",mulaiPada:waktu,selesaiPada:waktu,durasiMenit:30,dibuatPada:waktu,deadlineDp:waktu,deadlinePelunasan:null,barber:null,dikonfirmasiPada:waktu,checkInPada:null,layananMulaiPada:null,layananSelesaiPada:null,aksesTamu:{nama:"Fixture browser",nomorTelepon:"081234567890",kedaluwarsaPada:waktu},items:[]},ringkasan:{subtotal:10000,total:10000,nominalDpAwal:5000,jumlahDibayar:5000,balance:5000,dpTerverifikasi:true,statusPembayaran:"DP_PAID",invoiceSementara:true,invoice:null,transaksi:[]}}}));
  await page.route("**/api/guest/bookings/session/tracking",r=>r.fulfill({json:{kode}}));
  await page.routeWebSocket("**/socket.io/**",ws=>ws.close());
  for(const ditolak of [false,true]){
    await page.goto("/#/kunjungan/detail");
    if(ditolak)await page.evaluate(()=>Object.defineProperty(navigator,"clipboard",{value:{writeText:async()=>{throw Error("Izin ditolak")}},configurable:true}));
    await expect(page.getByTestId("kode-tracking")).toHaveText(kode);
    await page.getByRole("button",{name:"Salin Kode",exact:true}).click();
    await expect(page.getByRole("status")).toContainText("Kode tracking dipilih");
    expect(await page.evaluate(()=>getSelection()?.toString())).toBe(kode);
    await expect(page.locator("body")).not.toContainText("Kode tracking disalin.");
    await page.goto("/#/lacak");await page.getByLabel("Kode Tracking Booking",{exact:true}).fill(kode);await expect(page.getByLabel("Kode Tracking Booking",{exact:true})).toHaveValue(kode);
  }
});
