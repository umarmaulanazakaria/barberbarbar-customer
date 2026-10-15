import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { build } from 'esbuild';
import { mkdir, writeFile, unlink } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
const modules={
 react:`let i=0,dirty=false;const state=[],queue=[];export function mulai(){i=0;dirty=false;}export function efek(){while(queue.length)queue.shift()();return dirty;}export function useState(x){const j=i++;if(!(j in state))state[j]=x;return[state[j],x=>{state[j]=x;dirty=true;}];}export function useEffect(fn,deps){const j=i++,old=state[j];if(!old||deps.some((x,k)=>x!==old[k])){state[j]=deps;queue.push(fn);}}`,
 'react-native':`export const Text='Text';`,
 '../komponen/ui':`export const Halaman='Halaman',Kartu='Kartu',Kesalahan='Kesalahan',Kolom='Kolom',Tombol='Tombol';`,
 '../tema':`export const gaya={};`,
 '../layanan/sesi':`export const ambilSesi=()=>({}),mulaiSesi=()=>{};`,
 '../layanan/api':`let calls=[];export const kiriman=()=>calls;export const verifikasiToken=()=>{};export const publik={post:async(url,data)=>{calls.push({url,data});return{data:{pesan:'Permintaan diproses',pengirimanTersedia:false}};}};`,
};
const output=path.resolve('node_modules/.cache/test-pemulihan-customer.mjs');
try{
 const r=await build({stdin:{contents:`export {LayarLupaPassword} from './src/layar/Autentikasi';export {bacaTautanPemulihan} from './src/layanan/pemulihan';export {estimasi} from './src/layanan/aturan';export {mulai,efek} from 'react';export {kiriman} from '../layanan/api';`,resolveDir:process.cwd()},bundle:true,write:false,format:'esm',platform:'node',packages:'external',jsx:'automatic',plugins:[{name:'adapter',setup(b){b.onResolve({filter:/.*/},a=>Object.hasOwn(modules,a.path)?{path:a.path,namespace:'mock'}:undefined);b.onLoad({filter:/.*/,namespace:'mock'},a=>({contents:modules[a.path],loader:'js'}));}}]});
 await mkdir(path.dirname(output),{recursive:true});await writeFile(output,r.outputFiles[0].text);const m=await import(pathToFileURL(output));
 const token=randomBytes(32).toString('hex'),link='barberbarbar-customer://reset-password#token='+token;
 assert.equal(m.bacaTautanPemulihan(link),token);
 const URLAsli=globalThis.URL;
 try{globalThis.URL=class{constructor(){throw Error('Native URL custom scheme tidak tersedia');}};assert.equal(m.bacaTautanPemulihan(link),token);}finally{globalThis.URL=URLAsli;}
 for(const x of ['https://evil.invalid/#token='+token,'barberbarbar-customer://evil#token='+token,link+'&token='+token,link+'&lain=1','barberbarbar-customer://reset-password?token='+token,link+'x',link+'\n','javascript:alert(1)'])assert.equal(m.bacaTautanPemulihan(x),null);
 const props={route:{params:{token}},navigation:{setParams(x){props.route.params={...props.route.params,...x};}}};
 const semua=n=>Array.isArray(n)?n.flatMap(semua):n&&typeof n==='object'?[n,...semua(n.props?.children)]:[];
 const render=()=>{let result;for(let i=0;i<5;i++){m.mulai();result=semua(m.LayarLupaPassword(props));if(!m.efek())return result;}throw Error('Render tidak stabil');};
 let nodes=render();assert.equal(props.route.params.token,undefined);
 const field=label=>nodes.find(n=>n.props?.label===label),button=judul=>nodes.find(n=>n.props?.judul===judul);
 assert.equal(field('Kode pemulihan').props.value,token);assert.equal(field('Kode pemulihan').props.secureTextEntry,true);
 field('Kata sandi baru').props.onChangeText('KataSandiDummyBaru');field('Ulangi kata sandi baru').props.onChangeText('KataSandiDummyBaru');nodes=render();button('Simpan kata sandi baru').props.tekan();
 await new Promise(r=>setTimeout(r,20));nodes=render();assert.equal(m.kiriman()[0].url,'/auth/customer/reset-password');assert.equal(m.kiriman()[0].data.token,token);assert.equal(field('Kode pemulihan').props.value,'');assert.equal(field('Kata sandi baru').props.value,'');
 field('Email akun').props.onChangeText('dummy@example.invalid');nodes=render();button('Ajukan pemulihan').props.tekan();await new Promise(r=>setTimeout(r,20));nodes=render();assert.ok(nodes.some(n=>typeof n.props?.children==='string'&&n.props.children.includes('belum tersedia')));
 assert.equal(m.estimasi({items:[{layananId:1,qty:1}]},[{id:1,harga:10001,durasiMenit:30}],true).diskon,1000);
 console.log('PASS PEMULIHAN-UI: tautan valid/berbahaya/duplikat, token params dibersihkan, formulir reset dan status delivery jujur; pembulatan estimasi mengikuti server (adapter, bukan Android/inbox).');
}finally{await unlink(output).catch(()=>{});}
