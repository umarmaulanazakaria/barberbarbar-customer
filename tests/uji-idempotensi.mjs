import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {buatKunciIdempotensi} from '../src/layanan/idempotensi.ts';
const awal=Object.getOwnPropertyDescriptor(globalThis,'crypto'),acak=Math.random;
const pakai=s=>Object.defineProperty(globalThis,'crypto',{value:s,configurable:true});
try{
 Math.random=()=>{throw Error('Random lemah tidak boleh dipakai')};
 const native='12345678-1234-4234-8234-123456789abc';pakai({randomUUID:()=>native});assert.equal(buatKunciIdempotensi(),native);
 pakai({getRandomValues:a=>{a.fill(255);return a}});assert.equal(buatKunciIdempotensi(),'ffffffff-ffff-4fff-bfff-ffffffffffff');
 pakai({getRandomValues:a=>{a.fill(0);return a}});assert.equal(buatKunciIdempotensi(),'00000000-0000-4000-8000-000000000000');
 pakai({getRandomValues:webcrypto.getRandomValues.bind(webcrypto)});const keys=new Set();for(let n=0;n<1000;n++){const k=buatKunciIdempotensi();assert.match(k,/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/);keys.add(k)}assert.equal(keys.size,1000);
 for(const sumber of [undefined,{}, {getRandomValues:()=>{throw Error('Tidak tersedia')}}]){pakai(sumber);assert.throws(buatKunciIdempotensi,/pengacakan aman/)}
 console.log('PASS UUID: native, fallback kriptografis, bit v4/variant, identifier berbeda, tanpa Math.random dan kegagalan aman');
}finally{Math.random=acak;if(awal)Object.defineProperty(globalThis,'crypto',awal);else delete globalThis.crypto;}
