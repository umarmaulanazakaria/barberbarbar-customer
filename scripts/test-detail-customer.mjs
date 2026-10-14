import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdir,writeFile,unlink} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
const fixture={id:1,nomorBooking:'DUMMY-REJECTED',status:'REJECTED',mulaiPada:'2026-10-20T10:00:00+07:00',selesaiPada:'2026-10-20T10:30:00+07:00',durasiMenit:30,barberPilihanId:null,barberFinalId:null,barberDisetujuiId:null,pesananId:null,subtotal:10000,discountPercent:0,diskon:0,total:10000,items:[],riwayat:[],usulanBarber:[],catatan:null,alasanPenolakan:'Alasan penolakan dummy yang harus terlihat customer'};
const modules={
 react:`export const useState=x=>[x,()=>{}],useRef=x=>({current:x}),useEffect=()=>{};`,
 'react-native':`export const Text='Text',Alert={},AppState={};`,
 'expo-web-browser':`export const openBrowserAsync=()=>{};`,
 'expo-crypto':`export const randomUUID=()=>'fixture';`,
 '../komponen/ui':`export const Baris='Baris',Halaman='Halaman',Kartu='Kartu',Kesalahan='Kesalahan',Lencana='Lencana',Memuat='Memuat',Tombol='Tombol';`,
 '../tema':`export const gaya={judul:{},teks:{},redup:{},subjudul:{}};`,
 '../layanan/api':`export const batalBooking=()=>{},buatCheckout=()=>{},jawabUsulan=()=>{},sinkronkanPembayaran=()=>{};`,
 '../layanan/cache':`export const cache={};`,
 '../layanan/kueri':`export const useDetail=()=>({data:${JSON.stringify(fixture)}}),usePembayaran=()=>({}),useRefund=()=>({data:[]}),useBarber=()=>({data:[]});`,
 '../layanan/sesi':`export const useSesi=()=>({token:'fixture',versi:1}),ambilSesi=useSesi;`,
};
const output=path.resolve('node_modules/.cache/test-detail-customer.mjs');
try{
 const r=await build({stdin:{contents:`export {LayarDetailBooking} from './src/layar/DetailBooking';`,resolveDir:process.cwd(),sourcefile:'detail-fixture.ts'},bundle:true,write:false,platform:'node',format:'esm',packages:'external',jsx:'automatic',plugins:[{name:'native-adapter',setup(b){b.onResolve({filter:/.*/},a=>Object.hasOwn(modules,a.path)?{path:a.path,namespace:'fixture'}:undefined);b.onLoad({filter:/.*/,namespace:'fixture'},a=>({contents:modules[a.path],loader:'js'}));}}]});
 await mkdir(path.dirname(output),{recursive:true});await writeFile(output,r.outputFiles[0].text);const {LayarDetailBooking}=await import(pathToFileURL(output));
 const root=LayarDetailBooking({route:{params:{id:1}},navigation:{navigate(){}}});
 const texts=n=>typeof n==='string'?[n]:Array.isArray(n)?n.flatMap(texts):n&&typeof n==='object'?texts(n.props?.children):[];
 assert.ok(texts(root).some(t=>t.includes(fixture.alasanPenolakan)),'Alasan penolakan API harus tampil pada detail customer');console.log('PASS UI-REJECT: komponen detail aktual menampilkan alasan penolakan (host adapter, bukan device).');
}finally{await unlink(output).catch(()=>{});}
