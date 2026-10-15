import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdir, writeFile, unlink } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

// Komponen aktual, hook/native host adapter; bukan UI perangkat Android.
const modules = {
  react: `let indeks=0,ubah=false;const nilai=[],antrian=[];export function mulai(){indeks=0;ubah=false;}export function efek(){while(antrian.length)antrian.shift()();return ubah;}export function useState(awal){const i=indeks++;if(!(i in nilai))nilai[i]=typeof awal==='function'?awal():awal;return[nilai[i],v=>{nilai[i]=typeof v==='function'?v(nilai[i]):v;ubah=true;}];}export function useRef(v){const i=indeks++;return nilai[i]??=( {current:v} );}export function useEffect(fn,deps){const i=indeks++,lama=nilai[i];if(!lama||deps.some((v,j)=>!Object.is(v,lama[j]))){nilai[i]=deps;antrian.push(fn);}}`,
  'react-native': `export const Text='Text',View='View',Platform={OS:'android'},Alert={alert(){}};`,
  '@react-native-community/datetimepicker': `export default 'DateTimePicker';`,
  '@react-navigation/native': `export const useNavigation=()=>({});`,
  '../komponen/ui': `export const Baris='Baris',Halaman='Halaman',Kartu='Kartu',Kesalahan='Kesalahan',Kolom='Kolom',Lencana='Lencana',Memuat='Memuat',Tombol='Tombol';`,
  '../komponen/PilihanBerpencarian': `export const PilihanBerpencarian='PilihanBerpencarian';`,
  '../tema': `export const gaya={};`,
  '../layanan/api': `export const ambilBarber=()=>{},ambilLayanan=()=>{},ambilMembership=()=>{},buatBooking=()=>{},jadwalUlang=()=>{};`,
  '../layanan/cache': `export const cache={};`,
  '../layanan/kueri': `let data;export const ganti=x=>data=x;export const useDetail=()=>({data}),useBarber=()=>({data:[]}),useLayanan=()=>({}),useMembership=()=>({});`,
  '../layanan/sesi': `export const ambilSesi=()=>({}),langgananSesi=()=>()=>{},useSesi=()=>({});`,
};
const output = path.resolve('node_modules/.cache/test-draf-jadwal-ulang.mjs');
try {
  const r = await build({ stdin: { contents: `export {LayarJadwalUlang} from './src/layar/Booking';export {mulai,efek} from 'react';export {ganti} from '../layanan/kueri';`, resolveDir: process.cwd(), sourcefile: 'draf-fixture.ts' }, bundle: true, write: false, platform: 'node', format: 'esm', packages: 'external', jsx: 'automatic', plugins: [{ name: 'native-adapter', setup(b) { b.onResolve({ filter: /.*/ }, a => Object.hasOwn(modules, a.path) ? { path: a.path, namespace: 'fixture' } : undefined); b.onLoad({ filter: /.*/, namespace: 'fixture' }, a => ({ contents: modules[a.path], loader: 'js' })); } }] });
  await mkdir(path.dirname(output), { recursive: true }); await writeFile(output, r.outputFiles[0].text);
  const mod = await import(pathToFileURL(output));
  const semua = n => Array.isArray(n) ? n.flatMap(semua) : n && typeof n === 'object' ? [n, ...semua(n.props?.children)] : [];
  const tampil = id => { let root; for (let n = 0; n < 5; n++) { mod.mulai(); root = mod.LayarJadwalUlang({ route: { params: { id } }, navigation: {} }); if (!mod.efek()) return semua(root); } throw new Error('Render adapter tidak stabil'); };
  const pilihan = root => root.find(n => n.type === 'PilihanBerpencarian');
  const fixture = { id: 1, items: [{ layananId: 10, qty: 1 }], barberPilihanId: 11 };
  mod.ganti(undefined); let root = tampil(1);
  const jadwal = root => root.find(n => n.props?.draf && typeof n.props.ubah === 'function');
  const tanggalAwal = jadwal(root).props.draf.tanggal;
  jadwal(root).props.ubah({ ...jadwal(root).props.draf, tanggal: '2026-11-01', jam: '12:13' });
  mod.ganti(fixture); root = tampil(1); assert.equal(pilihan(root).props.nilai, 11);
  assert.equal(jadwal(root).props.draf.tanggal, '2026-11-01', 'Data pertama tidak boleh menimpa tanggal yang sudah diisi');
  pilihan(root).props.ubah(22); root = tampil(1); assert.equal(pilihan(root).props.nilai, 22);
  mod.ganti({ ...fixture, riwayat: [{ aksi: 'REFETCH' }] }); root = tampil(1);
  assert.equal(pilihan(root).props.nilai, 22, 'Refetch detail tidak boleh menimpa barber pilihan pengguna');
  pilihan(root).props.ubah(null); mod.ganti({ ...fixture }); root = tampil(1);
  assert.equal(pilihan(root).props.nilai, null, 'Barber siapa saja tetap null sesudah refetch');
  mod.ganti({ ...fixture, id: 2, barberPilihanId: 33 }); root = tampil(2);
  assert.equal(pilihan(root).props.nilai, 33, 'Route booking berbeda harus menginisialisasi ulang');
  assert.equal(jadwal(root).props.draf.tanggal, tanggalAwal, 'Route baru tidak membawa tanggal draf sebelumnya');
  console.log('PASS DRAF: pilihan barber termasuk null bertahan saat refetch; route berbeda memuat drafnya sendiri (adapter).');
} finally { await unlink(output).catch(() => {}); }
