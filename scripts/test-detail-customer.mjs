import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdir,writeFile,unlink} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
const fixture={id:1,nomorBooking:'DUMMY-REJECTED',status:'REJECTED',mulaiPada:'2026-10-20T10:00:00+07:00',selesaiPada:'2026-10-20T10:30:00+07:00',durasiMenit:30,barberPilihanId:null,barberFinalId:null,barberDisetujuiId:null,pesananId:null,subtotal:10000,discountPercent:0,diskon:0,total:10000,items:[],riwayat:[],usulanBarber:[],catatan:null,alasanPenolakan:'Alasan penolakan dummy yang harus terlihat customer'};
const modules={
 react:`export const useState=x=>[x,()=>{}],useRef=x=>({current:x}),useEffect=()=>{};`,
 'react-native':`export const Text='Text',Alert={},AppState={};`,
 'expo-web-browser':`export const openBrowserAsync=async()=>({type:'dismiss'});`,
 'expo-crypto':`export const randomUUID=()=>'fixture';`,
 '../komponen/ui':`export const Baris='Baris',Halaman='Halaman',Kartu='Kartu',Kesalahan='Kesalahan',Lencana='Lencana',Memuat='Memuat',Tombol='Tombol';`,
 '../tema':`export const gaya={judul:{},teks:{},redup:{},subjudul:{}};`,
 '../layanan/api':`let gagal=false;export const aturGagalUji=x=>gagal=x;export const batalBooking=()=>{},buatCheckout=async()=>({transaksiId:1,redirect_url:'https://app.sandbox.midtrans.com/snap/v2/fixture-only'}),jawabUsulan=()=>{},sinkronkanPembayaran=async()=>{if(gagal)throw Error('MOCK_TIMEOUT');};`,
 '../layanan/cache':`export const cache={invalidateQueries:async()=>{}};`,
 '../layanan/kueri':`let pembayaran,booking=${JSON.stringify(fixture)},jumlah=0;export const aturPembayaranUji=x=>pembayaran=x,aturBookingUji=x=>booking=x,jumlahSegarUji=()=>jumlah;const refetch=async()=>{jumlah++};export const useDetail=()=>({data:booking,refetch}),usePembayaran=()=>({data:pembayaran,refetch}),useRefund=()=>({data:[],refetch}),useBarber=()=>({data:[]});`,
 '../layanan/sesi':`export const useSesi=()=>({token:'fixture',versi:1}),ambilSesi=useSesi;`,
};
const output=path.resolve('node_modules/.cache/test-detail-customer.mjs');
try{
 const r=await build({stdin:{contents:`export {LayarDetailBooking} from './src/layar/DetailBooking'; export {aturPembayaranUji,aturBookingUji,jumlahSegarUji} from '../layanan/kueri'; export {aturGagalUji} from '../layanan/api';`,resolveDir:process.cwd(),sourcefile:'detail-fixture.ts'},bundle:true,write:false,platform:'node',format:'esm',packages:'external',jsx:'automatic',plugins:[{name:'native-adapter',setup(b){b.onResolve({filter:/.*/},a=>Object.hasOwn(modules,a.path)?{path:a.path,namespace:'fixture'}:undefined);b.onLoad({filter:/.*/,namespace:'fixture'},a=>({contents:modules[a.path],loader:'js'}));}}]});
 await mkdir(path.dirname(output),{recursive:true});await writeFile(output,r.outputFiles[0].text);const {LayarDetailBooking,aturPembayaranUji,aturBookingUji,jumlahSegarUji,aturGagalUji}=await import(pathToFileURL(output));
 const root=LayarDetailBooking({route:{params:{id:1}},navigation:{navigate(){}}});
 const texts=n=>typeof n==='string'?[n]:Array.isArray(n)?n.flatMap(texts):n&&typeof n==='object'?texts(n.props?.children):[];
 assert.ok(texts(root).some(t=>t.includes(fixture.alasanPenolakan)),'Alasan penolakan API harus tampil pada detail customer');console.log('PASS UI-REJECT: komponen detail aktual menampilkan alasan penolakan (host adapter, bukan device).');
 for(const mode of [true,false]){
  aturPembayaranUji({pembayaranPercobaan:mode,statusPembayaran:'AWAITING_DP',subtotal:10000,discountPercent:0,diskon:0,total:10000,nominalDp:5000,jumlahDibayarBruto:0,jumlahRefund:0,balance:10000,dpTerverifikasi:false,invoice:null,transaksi:[]});
  const tampilan=texts(LayarDetailBooking({route:{params:{id:1}},navigation:{navigate(){}}})).join(' ');
  assert.equal(tampilan.includes('Pembayaran percobaan — tidak ada uang sungguhan yang ditarik.'),mode);
  assert.ok(!/Sandbox|backend|webhook|server|COMPLETED|PAID/.test(tampilan));
 }
 console.log('PASS UI-PAYMENT: komponen Customer menampilkan pemberitahuan percobaan hanya dari flag backend; tanpa jargon/konfirmasi sukses palsu (adapter, bukan device).');
 aturBookingUji({...fixture,status:'COMPLETED'});
 aturPembayaranUji({dpTerverifikasi:true,balance:5000,transaksi:[]});
 const cariTombol=n=>Array.isArray(n)?n.flatMap(cariTombol):n&&typeof n==='object'?[...(n.props?.judul==='Lunasi Tagihan'?[n]:[]),...cariTombol(n.props?.children)]:[];
 for(const gagal of [false,true]){
  aturGagalUji(gagal);
  const tombol=cariTombol(LayarDetailBooking({route:{params:{id:1}},navigation:{navigate(){}}}))[0];assert.ok(tombol);
  const sebelum=jumlahSegarUji();tombol.props.tekan();
  for(let i=0;i<30&&jumlahSegarUji()===sebelum;i++)await new Promise(r=>setTimeout(r,10));
  assert.equal(jumlahSegarUji(),sebelum+3,'Kembali dari checkout selalu refetch REST, termasuk bila Get Status gagal');
 }
 console.log('PASS UI-RETURN: tutup checkout memicu tiga REST refetch setelah verifikasi sukses maupun timeout; tidak menandai lunas dari callback.');
}finally{await unlink(output).catch(()=>{});}
