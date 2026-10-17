import { test, expect, type Page } from "@playwright/test";
import { dataPembayaran } from "./fixtures/pembayaran";
const env=(globalThis as typeof globalThis & {process?:{env:Record<string,string|undefined>}}).process?.env??{};
function dataDetail() {
  const d=dataPembayaran();
  Object.assign(d.booking,{status:"COMPLETED",barber:"Barber Uji",dikonfirmasiPada:"2026-10-17T03:00:00Z",checkInPada:"2026-10-17T06:50:00Z",layananMulaiPada:"2026-10-17T07:00:00Z",layananSelesaiPada:"2026-10-17T08:30:00Z"});
  Object.assign(d.ringkasan,{dpTerverifikasi:true,statusPembayaran:"PAID",jumlahDibayar:100000,balance:0,invoiceSementara:false,invoice:{nomorInvoice:"INV-UX-001",total:100000,dibuatPada:"2026-10-17T08:35:00Z"},transaksi:[{id:1,tujuan:"DP",status:"SUCCEEDED",nominal:50000,dibayarPada:"2026-10-17T03:00:00Z"},{id:2,tujuan:"PELUNASAN",status:"SUCCEEDED",nominal:50000,dibayarPada:"2026-10-17T08:35:00Z"}]});
  return d;
}
async function siapkan(page:Page) {
  const s={data:dataDetail(),status:200,invoice:200,tracking:200,lacak:200,koneksi:true,reads:0,codes:[] as string[],kode:null as string|null};
  await page.routeWebSocket("**/socket.io/**",ws=>ws.close());
  await page.route("**/api/**",r=>{
    const p=new URL(r.request().url()).pathname;
    if(p.endsWith("/public/services"))return r.fulfill({json:[]});
    if(p.endsWith("/public/booking-availability"))return r.fulfill({json:{tersedia:true}});
    if(p.endsWith("/track")){s.codes.push(r.request().postDataJSON().kode);if(!s.koneksi)return r.abort();return r.fulfill({status:s.lacak,json:{berhasil:true}});}
    if(p.endsWith("/tracking"))return r.fulfill({status:s.tracking,json:{kode:s.kode}});
    if(p.endsWith("/invoice"))return r.fulfill({status:s.invoice,json:s.data});
    s.reads++;return r.fulfill({status:s.status,json:s.data});
  });return s;
}
test("Screenshot tracking, detail, timeline dan invoice",async({page})=>{
  await siapkan(page);
  const dir=env.BB_DETAIL_SCREENSHOTS;
  for(const width of [320,375,390])for(const jalur of ["/lacak","/kunjungan/detail","/kunjungan/invoice"]){
    await page.setViewportSize({width,height:844});await page.goto("/?capture="+width+jalur+"#"+jalur);
    if(jalur.includes("kunjungan"))await expect(page.getByTestId("nomor-booking")).toBeVisible();
    if(jalur.includes("invoice"))await expect(page.getByTestId("nomor-invoice")).toBeVisible();
    await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    if(dir){const prefix=dir+`/${env.BB_DETAIL_PHASE??"after"}-${width}-`;await page.screenshot({path:prefix+(jalur==="/lacak"?"tracking":jalur.endsWith("invoice")?"invoice":"detail")+".png",fullPage:true});
      if(jalur.endsWith("detail"))await page.getByRole("heading",{name:"Proses booking",exact:true}).locator("..").screenshot({path:prefix+"timeline.png"});}
  }
});

for(const width of [320,360,375,390,412,430,768,1440])test(`Detail, timeline dan invoice tanpa overflow ${width}px`,async({page})=>{
  const s=await siapkan(page);await page.setViewportSize({width,height:844});
  s.data.booking.aksesTamu.nama="PelangganDenganNamaSangatPanjangTanpaSpasi".repeat(3);
  s.data.booking.nomorBooking="BKG-"+"1234567890".repeat(8);
  s.data.booking.items=Array.from({length:14},(_,i)=>({...s.data.booking.items[i%2],layananId:i+1,namaLayanan:"LayananPerawatanSangatPanjangTanpaSpasi".repeat(3)}));
  for(const jalur of ["/lacak","/kunjungan/detail","/kunjungan/invoice"]){
    await page.goto("/?width="+width+jalur+"#"+jalur);
    if(jalur.includes("kunjungan"))await expect(page.getByTestId("nomor-booking")).toHaveText(s.data.booking.nomorBooking);
    if(jalur.endsWith("invoice"))await expect(page.getByTestId("nomor-invoice")).toBeVisible();
    await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  }
});
test("Kode valid dikirim hanya pada POST; sesi sah langsung menuju detail",async({page})=>{
  const s=await siapkan(page),kode="bb ab12-ab12-ab12-ab12-ab12-ab12-ab12-ab12",urls:string[]=[];
  page.on("request",r=>urls.push(r.url()));await page.goto("/#/lacak");
  const input=page.getByLabel("Kode Tracking Booking",{exact:true});await input.fill(kode);
  expect(await input.evaluate(e=>parseFloat(getComputedStyle(e).fontSize))).toBeGreaterThanOrEqual(16);
  await page.getByRole("button",{name:"Lacak Booking",exact:true}).click();
  await expect(page).toHaveURL(/#\/kunjungan\/detail$/);await expect(page.getByTestId("nomor-booking")).toBeVisible();
  expect(s.codes).toEqual([kode]);expect(urls.some(u=>u.includes("ab12"))).toBe(false);
  await page.goto("/#/lacak");await page.getByRole("link",{name:"Lanjutkan booking pada browser ini"}).click();
  await expect(page).toHaveURL(/#\/kunjungan\/detail$/);await expect(page.getByTestId("nomor-booking")).toBeVisible();
});
for(const kasus of ["salah","dicabut","rate-limit","koneksi"] as const)test(`Tracking ${kasus}: aman dan dapat dicoba kembali`,async({page})=>{
  const s=await siapkan(page);s.lacak=kasus==="rate-limit"?429:404;if(kasus==="koneksi")s.koneksi=false;
  await page.goto("/#/lacak");await page.getByLabel("Kode Tracking Booking",{exact:true}).fill("BB-INVALID");
  await page.getByRole("button",{name:"Lacak Booking",exact:true}).click();
  await expect(page.locator(".tracking-form [role=alert]")).toContainText(kasus==="rate-limit"?"Terlalu banyak":kasus==="koneksi"?"Periksa koneksi":"tidak ditemukan atau tidak valid");
  await expect(page.getByText("Pelanggan Uji",{exact:true})).toHaveCount(0);await expect(page.getByTestId("nomor-invoice")).toHaveCount(0);
  await expect(page.getByRole("button",{name:"Lacak Booking",exact:true})).toBeEnabled();
});
test("Sesi kedaluwarsa mencabut detail, kode dan invoice; respons invoice terlambat diabaikan",async({page})=>{
  const s=await siapkan(page);await page.goto("/#/kunjungan/detail");await expect(page.getByText("Pelanggan Uji",{exact:true})).toBeVisible();
  s.status=404;await page.getByRole("button",{name:"Perbarui status booking"}).click();
  await expect(page.getByText("Pelanggan Uji",{exact:true})).toHaveCount(0);await expect(page.getByText(/Jika sesi browser berakhir/)).toBeVisible();
  s.status=200;let lepas=()=>{};const gate=new Promise<void>(r=>{lepas=r;});
  await page.route("**/api/guest/bookings/session/invoice",async r=>{await gate;await r.fulfill({json:s.data});});
  await page.goto("/#/kunjungan/invoice");await expect(page.getByTestId("nomor-booking")).toBeVisible();
  s.status=404;await page.getByRole("button",{name:"Perbarui status booking"}).click();await expect(page.getByTestId("nomor-booking")).toHaveCount(0);
  lepas();await page.waitForTimeout(250);await expect(page.getByTestId("nomor-invoice")).toHaveCount(0);await expect(page.getByText("Pelanggan Uji",{exact:true})).toHaveCount(0);
});
test("Multi qty, barber, transisi operasional melalui polling tanpa reset scroll atau duplikasi",async({page})=>{
  const s=await siapkan(page);Object.assign(s.data.booking,{status:"CONFIRMED",barber:null,checkInPada:null,layananMulaiPada:null,layananSelesaiPada:null});
  await page.clock.install();await page.setViewportSize({width:390,height:700});await page.goto("/#/kunjungan/detail");
  await expect(page.getByText("Belum ditentukan",{exact:true})).toBeVisible();await expect(page.locator(".detail-layanan")).toContainText("2 ×");
  await expect(page.locator(".detail-layanan")).toContainText("70.000");await expect(page.locator(".detail-timeline li")).toHaveCount(1);
  await page.evaluate(()=>window.scrollTo(0,500));const y=await page.evaluate(()=>scrollY);
  const changements=[{status:"CHECKED_IN",checkInPada:"2026-10-17T06:50:00Z",barber:"Barber Final"},{status:"IN_SERVICE",layananMulaiPada:"2026-10-17T07:00:00Z"},{status:"COMPLETED",layananSelesaiPada:"2026-10-17T08:30:00Z"}];
  for(const [i,delta] of changements.entries()){Object.assign(s.data.booking,delta);await page.clock.runFor(10050);await expect(page.locator(".detail-timeline li")).toHaveCount(i+2);}
  await expect(page.getByText("Barber Final",{exact:true})).toBeVisible();expect(await page.evaluate(()=>scrollY)).toBe(y);
  await expect(page.locator(".detail-timeline")).toContainText("WIB");
  await page.reload();await expect(page.getByTestId("nomor-booking")).toBeVisible();await expect(page.locator(".detail-timeline li")).toHaveCount(4);
});
test("COMPLETED belum PAID, DP dan pending tidak menjadi invoice; pelunasan resmi membuka invoice",async({page})=>{
  const s=await siapkan(page);Object.assign(s.data.ringkasan,{statusPembayaran:"PARTIALLY_PAID",balance:50000,jumlahDibayar:50000,invoice:null,invoiceSementara:true});
  s.data.ringkasan.transaksi[1].status="PENDING";s.invoice=409;
  await page.goto("/#/kunjungan/detail");await expect(page.getByTestId("status-booking")).toHaveText("Layanan selesai");await expect(page.getByTestId("balance")).toContainText("50.000");
  await expect(page.getByRole("link",{name:"Lanjut ke pembayaran"})).toBeVisible();await expect(page.getByRole("link",{name:"Lihat invoice final"})).toHaveCount(0);
  await expect(page.locator(".detail-transaksi")).toContainText("Menunggu pembayaran");
  await page.goto("/#/kunjungan/invoice");await expect(page.getByRole("heading",{name:"Invoice final belum tersedia"})).toBeVisible();await expect(page.getByTestId("nomor-invoice")).toHaveCount(0);
  s.invoice=200;s.data=dataDetail();await page.reload();await expect(page.getByTestId("nomor-invoice")).toHaveText("INV-UX-001");
  await expect(page.getByTestId("balance")).toHaveText(/Rp\s*0/);await expect(page.locator(".detail-invoice")).toContainText("2 ×");await expect(page.locator(".detail-transaksi time")).toHaveCount(2);
});
test("Waktu pembayaran tidak tersedia dan pembatalan tidak menciptakan riwayat fiktif",async({page})=>{
  const s=await siapkan(page);s.data.booking.status="CANCELLED";s.data.booking.dikonfirmasiPada=null;s.data.booking.checkInPada=null;s.data.booking.layananMulaiPada=null;s.data.booking.layananSelesaiPada=null;
  s.data.ringkasan.statusPembayaran="REFUND_REVIEW";s.data.ringkasan.transaksi=[{id:4,tujuan:"DP",status:"PENDING",nominal:50000}];
  await page.goto("/#/kunjungan/detail");await expect(page.getByTestId("status-booking")).toHaveText("Booking dibatalkan");await expect(page.locator(".detail-timeline")).toHaveCount(0);
  await expect(page.locator(".detail-transaksi time")).toHaveCount(0);await expect(page.getByRole("link",{name:"Lihat invoice final"})).toHaveCount(0);
});
test("Kode panjang tetap privat, dapat dibuka dan dipilih pada detail 320px",async({page})=>{
  const s=await siapkan(page);s.kode="BB-"+Array(8).fill("AB12").join("-");
  await page.setViewportSize({width:320,height:844});await page.goto("/#/kunjungan/detail");
  await expect(page.getByTestId("kode-tracking")).toBeVisible();await page.locator(".detail-kode summary").click();await expect(page.getByTestId("kode-tracking")).toBeHidden();await page.locator(".detail-kode summary").click();await expect(page.getByTestId("kode-tracking")).toHaveText(s.kode);
  await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  expect(page.url()).not.toContain(s.kode);await expect(page.getByRole("button",{name:"Salin Kode",exact:true})).toBeVisible();
});
test("Gagal mengesahkan invoice tidak menampilkan dokumen final meskipun ringkasan PAID",async({page})=>{
  const s=await siapkan(page);s.invoice=403;await page.goto("/#/kunjungan/invoice");
  await expect(page.getByRole("alert")).toContainText("tidak diizinkan");await expect(page.getByTestId("nomor-invoice")).toHaveCount(0);
  await expect(page.getByRole("heading",{name:"Invoice final belum tersedia"})).toBeVisible();
  s.invoice=200;await page.getByRole("button",{name:"Perbarui status booking"}).click();await expect(page.getByTestId("nomor-invoice")).toHaveText("INV-UX-001");
});
test("Status PAID dengan saldo tidak nol tidak cukup untuk menerbitkan invoice",async({page})=>{
  const s=await siapkan(page);s.data.ringkasan.balance=1;await page.goto("/#/kunjungan/invoice");
  await expect(page.getByTestId("nomor-booking")).toBeVisible();await expect(page.getByTestId("nomor-invoice")).toHaveCount(0);
  await expect(page.getByTestId("balance")).toHaveText(/1/);
});
