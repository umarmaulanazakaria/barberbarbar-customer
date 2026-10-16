import { test, expect, type Page } from "@playwright/test";
import { dataPembayaran } from "./fixtures/pembayaran";
const env=(globalThis as typeof globalThis & {process?:{env:Record<string,string|undefined>}}).process?.env??{};

test("Screenshot ringkasan dan pembayaran", async ({ page }) => {
  const data=dataPembayaran();
  await page.routeWebSocket("**/socket.io/**", ws=>ws.close());
  await page.route("**/api/**", r=>{
    const p=new URL(r.request().url()).pathname;
    if(p.endsWith("/public/services"))return r.fulfill({json:[]});
    if(p.endsWith("/public/booking-availability"))return r.fulfill({json:{tersedia:true}});
    if(p.endsWith("/tracking"))return r.fulfill({json:{kode:null}});
    return r.fulfill({json:data});
  });
  const dir=env.BB_PAY_SCREENSHOTS;
  for(const width of [375,390,1440])for(const halaman of ["ringkasan","pembayaran"]){
    await page.setViewportSize({width,height:844});
    await page.goto("/?capture="+width+halaman+"#/kunjungan"+(halaman==="pembayaran"?"/pembayaran":""));
    await expect(page.getByTestId("nomor-booking")).toHaveText(data.booking.nomorBooking);
    await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    if(dir)await page.screenshot({path:dir+`/${env.BB_PAY_PHASE??"after"}-${width}-${halaman}.png`,fullPage:true});
  }
});

async function siapkan(page: Page) {
  const state = { data:dataPembayaran(), checkout:0, sync:0, tracking:0, jaringan:200, kegagalanCheckout:false, tahanSync:false, lepasSync:()=>{} };
  const gate = new Promise<void>(resolve=>{state.lepasSync=resolve;});
  await page.routeWebSocket("**/socket.io/**", ws=>ws.close());
  await page.route("https://app.sandbox.midtrans.com/snap/snap.js",r=>r.fulfill({contentType:"application/javascript",body:`window.jumlahSnap=0;window.snap={pay:function(token,opsi){window.jumlahSnap++;window.opsiSnap=opsi;}};`}));
  await page.route("**/api/**",async r=>{
    const p=new URL(r.request().url()).pathname;
    if(p.endsWith("/public/services"))return r.fulfill({json:[]});
    if(p.endsWith("/public/booking-availability"))return r.fulfill({json:{tersedia:true}});
    if(p.endsWith("/tracking")){state.tracking++;return r.fulfill({json:{kode:"BB-"+Array(8).fill("AB12").join("-")}});}
    if(p.endsWith("/checkout")){
      state.checkout++;
      const body=r.request().postDataJSON();expect(body).not.toHaveProperty("nominal");expect(body).not.toHaveProperty("harga");
      if(state.kegagalanCheckout)return r.abort("timedout");
      return r.fulfill({json:{transaksiId:1,token:"fixture-only",clientKey:"fixture-client-key",isProduction:false,redirect_url:"https://app.sandbox.midtrans.com/fixture"}});
    }
    if(p.endsWith("/sync")){state.sync++;if(state.tahanSync)await gate;}
    if(state.jaringan!==200)return r.fulfill({status:state.jaringan,json:{pesan:"Tidak tersedia"}});
    return r.fulfill({json:state.data});
  });
  return state;
}
const popup = (page: Page, aksi:"onSuccess"|"onPending"|"onError"|"onClose")=>page.evaluate(n=>{
  (window as Window & {opsiSnap?:Record<string,()=>void>}).opsiSnap?.[n]();
},aksi);

for(const width of [320,360,375,390,412,430,768,1440]) test(`Nominal backend dan layout pembayaran ${width}px`,async({page})=>{
  const s=await siapkan(page);
  await page.setViewportSize({width,height:844});
  for(const jalur of ["/kunjungan","/kunjungan/pembayaran"]){
    await page.goto("/?w="+width+"#"+jalur);
    await expect(page.getByTestId("nominal-utama")).toContainText("50.000");
    await expect(page.getByTestId("balance")).toContainText("100.000");
    await expect(page.locator(".layanan-pembayaran")).toContainText("2 ×");
    await expect(page.locator(".layanan-pembayaran")).toContainText("70.000");
    await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  }
  // One service, different authoritative nominal: no frontend DP recalculation.
  s.data.booking.items=s.data.booking.items.slice(0,1);
  Object.assign(s.data.ringkasan,{total:70000,nominalDpAwal:35000,balance:70000});
  await page.getByRole("button",{name:"Perbarui status booking"}).click();
  await expect(page.getByTestId("nominal-utama")).toContainText("35.000");
  expect(s.checkout).toBe(0);
});

test("Popup tunggal, callback success bukan settlement, konfirmasi sah dan saldo backend",async({page})=>{
  const s=await siapkan(page);
  await page.goto("/#/kunjungan/pembayaran");
  const bayar=page.getByRole("button",{name:"Bayar DP 50% dengan Snap",exact:true});
  await bayar.click();
  const terbuka=page.locator(".biaya-ux button.utama");
  await expect(terbuka).toBeDisabled();
  await terbuka.dispatchEvent("click");await terbuka.dispatchEvent("click");
  await expect.poll(()=>page.evaluate(()=>(window as Window & {jumlahSnap?:number}).jumlahSnap??0)).toBe(1);
  expect(s.checkout).toBe(1);
  await popup(page,"onSuccess");
  await expect(page.getByRole("heading",{name:"Sedang memeriksa pembayaran",exact:true})).toBeVisible();
  await expect(page.getByTestId("kode-tracking")).toHaveCount(0);expect(s.tracking).toBe(0);
  const sync=s.sync;await popup(page,"onClose");expect(s.sync).toBe(sync);
  Object.assign(s.data.booking,{status:"CONFIRMED",dikonfirmasiPada:new Date().toISOString()});
  Object.assign(s.data.ringkasan,{dpTerverifikasi:true,jumlahDibayar:50000,balance:50000,statusPembayaran:"DP_PAID"});
  await page.getByRole("button",{name:"Perbarui status booking"}).click();
  await expect(page.getByRole("heading",{name:"Pembayaran DP berhasil",exact:true})).toBeVisible();
  await expect(page.getByTestId("kode-tracking")).toBeVisible();
  await expect(page.getByTestId("balance")).toContainText("50.000");
});

for(const aksi of ["onPending","onError","onClose"] as const)test(`Callback ${aksi} tidak memberi konfirmasi palsu`,async({page})=>{
  const s=await siapkan(page);await page.goto("/#/kunjungan/pembayaran");
  await page.getByRole("button",{name:"Bayar DP 50% dengan Snap"}).click();
  await expect.poll(()=>page.evaluate(()=>(window as Window & {jumlahSnap?:number}).jumlahSnap??0)).toBe(1);
  await popup(page,aksi);
  await expect(page.getByTestId("dp-sah")).toHaveText("Belum terverifikasi");
  await expect(page.getByTestId("kode-tracking")).toHaveCount(0);
  await expect.poll(()=>s.sync).toBe(1);expect(s.checkout).toBe(1);
});

test("Jam perangkat berbeda, refresh mempertahankan deadline, peringatan dan sinkronisasi expiry tunggal",async({page})=>{
  const s=await siapkan(page), server=Date.parse(s.data.serverTime);
  await page.clock.install({time:new Date("2035-01-01T00:00:00Z")});
  await page.goto("/#/kunjungan/pembayaran");
  await expect(page.getByTestId("countdown-aktual")).toHaveText("15:00");
  await page.clock.fastForward(60000);
  s.data.serverTime=new Date(server+60000).toISOString();
  await page.reload();await expect(page.getByTestId("countdown-aktual")).toHaveText("14:00");
  s.data.serverTime=new Date(server+781000).toISOString();
  await page.clock.fastForward(721000);
  await expect(page.getByText("Kurang dari 2 menit. Selesaikan pembayaran sebelum batas waktu.")).toBeVisible();
  s.tahanSync=true;
  s.data.serverTime=new Date(server+901000).toISOString();
  await page.clock.fastForward(120000);
  await expect(page.getByTestId("countdown-aktual")).toHaveText("00:00");
  await expect(page.getByRole("heading",{name:"Memeriksa batas pembayaran"})).toBeVisible();
  await expect(page.getByRole("button",{name:"Bayar DP 50% dengan Snap"})).toHaveCount(0);
  await expect.poll(()=>s.sync).toBe(1);
  s.data.serverTime=new Date(server+906000).toISOString();
  await page.clock.fastForward(5000);expect(s.sync).toBe(1);
  s.data.booking.status="CANCELLED";s.data.ringkasan.transaksi=[{id:1,tujuan:"DP",nominal:50000,status:"EXPIRED"}];s.lepasSync();
  await expect(page.getByRole("heading",{name:"Booking dibatalkan",exact:true})).toBeVisible();
  expect(s.checkout).toBe(0);
});

test("Gagal, review, timeout dan ledger DP tanpa konfirmasi tidak membocorkan kode",async({page})=>{
  const s=await siapkan(page);
  s.data.ringkasan.transaksi=[{id:1,tujuan:"DP",nominal:50000,status:"FAILED"}];
  await page.goto("/#/kunjungan/pembayaran");await expect(page.getByRole("heading",{name:"Pembayaran gagal",exact:true})).toBeVisible();
  s.kegagalanCheckout=true;await page.getByRole("button",{name:"Bayar DP 50% dengan Snap"}).click();
  await expect(page.getByRole("alert")).toContainText("Hasil permintaan belum dapat dipastikan");
  s.jaringan=503;await page.getByRole("button",{name:"Periksa pembayaran"}).click();
  await expect(page.getByRole("alert")).toBeVisible();
  s.jaringan=200;s.data.ringkasan.dpTerverifikasi=true;s.data.ringkasan.transaksi=[];
  await page.getByRole("button",{name:"Periksa pembayaran"}).click();
  await expect(page.getByRole("heading",{name:"Sedang memeriksa pembayaran",exact:true})).toBeVisible();
  await expect(page.getByTestId("kode-tracking")).toHaveCount(0);expect(s.tracking).toBe(0);
  s.data.booking.status="CANCELLED";s.data.ringkasan.statusPembayaran="REFUND_REVIEW";s.data.ringkasan.jumlahDibayar=50000;
  await page.getByRole("button",{name:"Periksa pembayaran"}).click();
  await expect(page.getByRole("heading",{name:"Pembayaran membutuhkan penanganan",exact:true})).toBeVisible();
  await expect(page.getByRole("button",{name:"Bayar DP 50% dengan Snap"})).toHaveCount(0);
  await expect(page.getByTestId("kode-tracking")).toHaveCount(0);
});

test("Kode sah dari booking yang pernah dikonfirmasi tetap dapat dipakai saat review",async({page})=>{
  const s=await siapkan(page);
  Object.assign(s.data.booking,{status:"CANCELLED",dikonfirmasiPada:new Date().toISOString()});
  Object.assign(s.data.ringkasan,{dpTerverifikasi:true,jumlahDibayar:50000,balance:0,statusPembayaran:"REFUND_REVIEW"});
  await page.goto("/#/kunjungan/pembayaran");
  await expect(page.getByRole("heading",{name:"Pembayaran membutuhkan penanganan",exact:true})).toBeVisible();
  await expect(page.getByTestId("kode-tracking")).toBeVisible();
  await expect(page.getByRole("button",{name:"Bayar DP 50% dengan Snap"})).toHaveCount(0);
  expect(s.tracking).toBe(1);
});
