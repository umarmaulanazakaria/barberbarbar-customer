import {useState} from "react";
import {lacakGuest} from "../layanan/guest";
import "../tracking.css";
export default function LacakBooking(){
 const[kode,aturKode]=useState(""),[sibuk,aturSibuk]=useState(false),[pesan,aturPesan]=useState("");
 return <section className="panel tracking-form"><span className="eyebrow">BOOKING ANDA</span><h1>Lacak Booking Anda</h1><p>Masukkan kode tracking untuk melihat status dan detail booking Anda.</p>
 <form onSubmit={async e=>{e.preventDefault();if(sibuk)return;aturSibuk(true);aturPesan("");try{await lacakGuest(kode);aturKode("");window.location.hash="/kunjungan/detail"}catch(e){aturPesan(e instanceof Error?e.message:"Kode booking tidak ditemukan atau tidak valid.")}finally{aturSibuk(false)}}}>
 <label htmlFor="kode-tracking">Kode Tracking Booking</label><input id="kode-tracking" value={kode} onChange={e=>aturKode(e.target.value)} required maxLength={100} autoComplete="off" autoCapitalize="characters" spellCheck={false} placeholder="Masukkan kode"/><button className="tombol utama lebar" disabled={sibuk}>{sibuk?"Memeriksa kode…":"Lacak Booking"}</button></form>
 {pesan&&<p className="pesan error" role="alert">{pesan}</p>}<p className="catatan">Kode hilang dan sesi browser tidak tersedia? Hubungi Admin untuk verifikasi identitas dan pemulihan akses. Nama atau nomor HP saja tidak dapat membuka booking.</p><a href="#/kunjungan" className="tombol-teks">Lanjutkan booking pada browser ini</a></section>;
}
