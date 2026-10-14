import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

// Jalankan komponen TSX aktual dengan adapter hooks/host native; bukan renderer/device RN.
const temporary = path.resolve('node_modules/.cache/test-pilihan-barber.mjs');
await mkdir(path.dirname(temporary), { recursive: true });
const adapters = {
 react: `let state=[],index=0;export function useState(initial){const i=index++;if(!(i in state))state[i]=initial;return[state[i],v=>{state[i]=typeof v==='function'?v(state[i]):v;}];}export function mulai(){index=0;}export function reset(){state=[];index=0;}`,
 'react-native': `export const FlatList='FlatList',KeyboardAvoidingView='KeyboardAvoidingView',Modal='Modal',Pressable='Pressable',Text='Text',TextInput='TextInput',View='View';export const Platform={OS:'android'},StyleSheet={create:x=>x,absoluteFill:{position:'absolute'}},useWindowDimensions=()=>({height:800,width:360});`,
 '@expo/vector-icons': `export const Ionicons='Icon';`,
 'react-native-safe-area-context': `export const useSafeAreaInsets=()=>({top:24,bottom:24,left:0,right:0});`,
 './ui': `export const Kesalahan='Kesalahan',Memuat='Memuat';`,
};
let total=0;
const pass = pesan => { total++; console.log(`PASS DROPDOWN: ${pesan}`); };
try {
 const result = await build({ stdin: { contents: `export {PilihanBerpencarian} from './src/komponen/PilihanBerpencarian';export * as hooks from 'react';`, resolveDir:process.cwd(),sourcefile:'dropdown-fixture.ts' }, bundle:true,write:false,platform:'node',format:'esm',packages:'external',jsx:'automatic',plugins:[{name:'native-host-adapter',setup(b){b.onResolve({filter:/^(react|react-native|@expo\/vector-icons|react-native-safe-area-context|\.\/ui)$/},a=>({path:a.path,namespace:'adapter'}));b.onLoad({filter:/.*/,namespace:'adapter'},a=>({contents:adapters[a.path],loader:'js'}));}}] });
 await writeFile(temporary,result.outputFiles[0].text);const {PilihanBerpencarian:Component,hooks}=await import(pathToFileURL(temporary));
 const options=[{nilai:null,label:'Barber siapa saja'},{nilai:7,label:'Barber Alpha'},{nilai:9,label:'Barber BETA'}];let selected=null,changes=0,retries=0;
 const props={judul:'Pilih Barber',pilihan:options,nilai:selected,ubah:v=>{selected=v;changes++;},ulang:()=>retries++};
 const render=(extra={})=>{hooks.mulai();return Component({...props,nilai:selected,...extra});};
 const nodes=root=>{if(!root||typeof root!=='object')return[];if(Array.isArray(root))return root.flatMap(nodes);return[root,...nodes(root.props?.children)];};
 const find=(root,type,match=()=>true)=>{const n=nodes(root).find(n=>n.type===type&&match(n));assert.ok(n,`Host ${type} ditemukan`);return n;};
 const modal=root=>find(root,'Modal');
 let tree=render();assert.equal(modal(tree).props.visible,false);assert.equal(find(tree,'Pressable',n=>n.props.accessibilityState?.expanded===false).props.accessibilityLabel,'Pilih Barber: Barber siapa saja');pass('Default tertutup, satu field, default null berlabel Barber siapa saja');
 const open=()=>{find(tree,'Pressable',n=>'expanded' in(n.props.accessibilityState??{})).props.onPress();tree=render();assert.equal(modal(tree).props.visible,true);};
 const search=q=>{find(tree,'TextInput').props.onChangeText(q);tree=render();return find(tree,'FlatList');};
 open();let list=search('  bEtA ');assert.deepEqual(list.props.data.map(p=>p.nilai),[9]);assert.equal(list.props.ListHeaderComponent.props.accessibilityLabel,'Barber siapa saja');pass('Buka modal; pencarian langsung trim/case-insensitive, pilihan umum tetap tersedia');
 list=search('tidak-ada');assert.equal(list.props.data.length,0);assert.equal(list.props.ListEmptyComponent.props.children,'Barber tidak ditemukan');pass('Query tanpa hasil menampilkan Barber tidak ditemukan');
 list=search('alpha');list.props.renderItem({item:list.props.data[0]}).props.onPress();tree=render();assert.equal(selected,7);assert.equal(modal(tree).props.visible,false);assert.equal(find(tree,'Pressable',n=>'expanded' in(n.props.accessibilityState??{})).props.accessibilityLabel,'Pilih Barber: Barber Alpha');pass('Memilih ID aktual menutup modal, label field mengikuti pilihan');
 open();list=find(tree,'FlatList');assert.equal(find(tree,'TextInput').props.value,'');assert.equal(list.props.renderItem({item:options[1]}).props.accessibilityState.checked,true);list.props.renderItem({item:options[2]}).props.onPress();tree=render();assert.equal(selected,9);open();find(tree,'FlatList').props.ListHeaderComponent.props.onPress();tree=render();assert.equal(selected,null);pass('Selected indicator, ganti pilihan, buka ulang reset search, memilih siapa saja tetap null');
 open();const before=changes;modal(tree).props.onRequestClose();tree=render();assert.equal(modal(tree).props.visible,false);assert.equal(changes,before);open();find(tree,'Pressable',n=>n.props.accessibilityLabel==='Tutup pilihan barber').props.onPress();tree=render();assert.equal(modal(tree).props.visible,false);assert.equal(changes,before);pass('Back Android dan cancel/tutup tidak mengubah pilihan');
 open();tree=render({memuat:true});find(tree,'Memuat');assert.ok(!nodes(tree).some(n=>n.type==='FlatList'));tree=render({error:new Error('fixture')});find(tree,'Kesalahan').props.ulang();assert.equal(retries,1);assert.ok(!nodes(tree).some(n=>n.type==='FlatList'));pass('Loading dan error/retry tidak menyajikan daftar cache sebagai pilihan aktif');
 tree=render({nonaktif:true});assert.equal(find(tree,'Pressable',n=>'expanded' in(n.props.accessibilityState??{})).props.disabled,true);selected=7;tree=render({pilihan:[options[0]]});assert.ok(nodes(tree).some(n=>n.props?.children==='Barber pilihan tidak lagi tersedia. Silakan pilih ulang.'));assert.equal(selected,7);pass('Disabled dan barber hilang memberi informasi tanpa mengganti ID menjadi null diam-diam');
 const keyboard=find(tree,'KeyboardAvoidingView');assert.equal(keyboard.props.behavior,'height');assert.equal(keyboard.props.pointerEvents,'box-none');tree=render();list=find(tree,'FlatList');assert.equal(list.props.keyboardShouldPersistTaps,'handled');assert.equal(list.props.keyboardDismissMode,'on-drag');assert.ok(nodes(tree).some(n=>n.props?.accessibilityViewIsModal));pass('Konfigurasi Android keyboard, safe-area container, FlatList/taps/a11y terpasang; bukan bukti keyboard native');
 hooks.reset();selected=9;tree=render();assert.ok(find(tree,'Pressable',n=>'expanded' in(n.props.accessibilityState??{})).props.accessibilityLabel.endsWith('Barber BETA'));assert.equal(changes,before);pass('Remount komponen mempertahankan pilihan controlled dari draf parent');
 const bookingSource=await readFile('src/layar/Booking.tsx','utf8');assert.equal((bookingSource.match(/<PilihanBerpencarian /g)??[]).length,2);assert.ok(!bookingSource.includes('barber.data?.map(b => <Tombol'));assert.ok(!bookingSource.includes('barbers.data?.map(b => <Tombol'));pass('Booking baru dan reschedule memakai komponen yang sama; daftar tombol lama dihapus');
 console.log(`TOTAL ${total} kelompok dropdown PASS; sentuhan/device/navigasi native DEFERRED.`);
} finally { await unlink(temporary).catch(()=>{}); }
