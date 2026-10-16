import {test,expect,type Page} from '@playwright/test';
const jadwal=()=>new Date(Date.now()+7*3600000+7*86400000).toISOString().slice(0,10);
const akses=async(page:Page)=>'Guest '+new URL(await page.getByLabel('Tautan pribadi',{exact:true}).inputValue()).hash.split('/')[2];

test('Aplikasi publik memakai API tanpa kontrol demo atau hasil booking palsu',async({page})=>{
  await page.goto('/');
  await expect(page.getByRole('heading',{name:'Guest Browser Haircut'})).toBeVisible();
  await expect(page.getByRole('button',{name:/demo/i})).toHaveCount(0);
  await expect(page.locator('body')).not.toContainText(/PREVIEW|Coming Soon|Under Development|backend existing/);
  for(const width of [320,375,430,768,1440]){
    await page.setViewportSize({width,height:900});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
  }
  await page.goto('/#/demo/selesai');
  await expect(page.getByRole('heading',{name:'Halaman tidak ditemukan.'})).toBeVisible();
  await expect(page.getByTestId('nomor-booking')).toHaveCount(0);
  await page.route('**/api/public/services',r=>r.fulfill({status:503,body:'{}'}));
  await page.goto('/');await page.reload();
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page.getByRole('button',{name:/demo/i})).toHaveCount(0);
});
test('Web -> backend aktual -> DP mock -> Staff -> pelunasan -> invoice, tanpa mengubah Native',async({page,context,request})=>{
  const kesalahan:string[]=[],privatUrl:string[]=[],payloads:Record<string,unknown>[]=[];
  page.on('pageerror',e=>kesalahan.push(e.message));
  page.on('request',r=>{if(r.url().includes('/guest/')){privatUrl.push(r.url());if(r.method()==='POST'&&new URL(r.url()).pathname==='/api/guest/bookings')payloads.push(r.postDataJSON());}});
  await page.route('https://app.sandbox.midtrans.com/snap/snap.js',r=>r.fulfill({contentType:'application/javascript',body:`window.snap={pay:(token,opsi)=>{window.__opsiSnap=opsi;opsi.onPending();}};`}));
  await page.goto('/#/booking');await page.getByLabel('Nama lengkap').fill('Dummy Browser Guest');await page.getByLabel('Nomor HP',{exact:false}).fill('081234567890');
  await page.getByRole('checkbox',{name:'Guest Browser Haircut',exact:false}).check();await page.getByRole('checkbox',{name:'Guest Browser Wash',exact:false}).check();
  await page.getByLabel('Tanggal layanan').fill(jadwal());await page.getByLabel('Jam layanan').fill('14:00');
  await page.getByRole('button',{name:'Buat booking dan lanjut ke DP'}).click();
  await expect(page.getByTestId('nomor-booking')).toHaveText(/^BKG-/);await expect(page.getByTestId('status-booking')).toHaveText('Menunggu pembayaran DP');
  const auth=await akses(page),url=await page.getByLabel('Tautan pribadi',{exact:true}).inputValue();
  expect(payloads).toHaveLength(1);expect(payloads[0]).not.toHaveProperty('barberPilihanId');expect(payloads[0]).not.toHaveProperty('total');
  const sebelum=await request.get('http://127.0.0.1:3185/guest/bookings/current',{headers:{Authorization:auth}});expect(sebelum.status()).toBe(200);const data=await sebelum.json();expect(data.ringkasan.nominalDpAwal).toBe(7500);expect(Date.parse(data.booking.deadlineDp)-Date.parse(data.booking.dibuatPada)).toBe(900000);
  const baru=await context.newPage();await baru.goto(url);await expect(baru.getByTestId('nomor-booking')).toHaveText(data.booking.nomorBooking);await baru.close();
  await page.getByRole('link',{name:'Lanjut ke pembayaran'}).click();await page.getByRole('button',{name:'Bayar DP 50% dengan Snap'}).click();
  await expect.poll(()=>page.evaluate(()=>typeof (window as unknown as {__opsiSnap?:{onSuccess:unknown}}).__opsiSnap?.onSuccess)).toBe('function');
  await expect(page.getByTestId('dp-sah')).toHaveText('Belum terverifikasi');
  await page.evaluate(()=>{const w=window as unknown as {__opsiSnap:{onSuccess:()=>void}};w.__opsiSnap.onSuccess();});
  await expect(page.getByTestId('status-booking')).toHaveText('Menunggu pembayaran DP');
  expect((await request.post('http://127.0.0.1:3185/__fixture/settle',{headers:{Authorization:auth}})).status()).toBe(200);
  await page.getByRole('button',{name:'Perbarui status booking'}).click();await expect(page.getByTestId('status-booking')).toHaveText('Booking dikonfirmasi');await expect(page.getByTestId('dp-sah')).toHaveText('Terverifikasi');
  expect((await request.post('http://127.0.0.1:3185/__fixture/complete',{headers:{Authorization:auth}})).status()).toBe(200);
  await page.getByRole('button',{name:'Perbarui status booking'}).click();await expect(page.getByTestId('status-booking')).toHaveText('Layanan selesai');
  await page.getByRole('button',{name:'Bayar sisa pelunasan dengan Snap'}).click();
  expect((await request.post('http://127.0.0.1:3185/__fixture/settle',{headers:{Authorization:auth}})).status()).toBe(200);
  expect((await request.post('http://127.0.0.1:3185/__fixture/settle',{headers:{Authorization:auth}})).status()).toBe(200);
  await page.getByRole('button',{name:'Perbarui status booking'}).click();await expect(page.getByTestId('balance')).toContainText(/0/);
  await page.getByRole('link',{name:'Lihat invoice final'}).click();await expect(page.getByTestId('nomor-invoice')).toHaveText(/^INV-BKG-/);
  const audit=await request.get('http://127.0.0.1:3185/__fixture/audit',{headers:{Authorization:auth}});expect(await audit.json()).toEqual({creditCount:2,invoiceCount:1});
  for(const width of [320,375,430,768,1440]){await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();}
  expect(privatUrl.every(u=>!u.includes(auth.slice(6)))).toBeTruthy();expect(kesalahan).toEqual([]);
});
