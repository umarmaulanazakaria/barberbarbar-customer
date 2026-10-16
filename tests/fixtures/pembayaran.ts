import type { DetailTamu } from "../../src/layanan/guest";
export function dataPembayaran(): DetailTamu {
  const kini = new Date().toISOString();
  const hari = new Date(Date.now()+7*3600000+86400000).toISOString().slice(0,10);
  return { serverTime: kini, booking: {
    nomorBooking: "BB-UX-PEMBAYARAN", status: "AWAITING_DP", mulaiPada: new Date(hari+"T14:00:00+07:00").toISOString(),
    selesaiPada: new Date(hari+"T15:30:00+07:00").toISOString(), durasiMenit: 90, dibuatPada: kini,
    deadlineDp: new Date(Date.parse(kini)+900000).toISOString(), deadlinePelunasan: null, barber: null,
    dikonfirmasiPada: null,checkInPada:null,layananMulaiPada:null,layananSelesaiPada:null,
    aksesTamu:{nama:"Pelanggan Uji",nomorTelepon:"081234567890",kedaluwarsaPada:new Date(Date.now()+86400000).toISOString()},
    items:[{layananId:901,namaLayanan:"Potong Rambut",qty:2,harga:35000,subtotal:70000,durasiMenit:30},
      {layananId:902,namaLayanan:"Perawatan Rambut dan Penataan",qty:1,harga:30000,subtotal:30000,durasiMenit:30}],
  },ringkasan:{subtotal:100000,total:100000,nominalDpAwal:50000,jumlahDibayar:0,balance:100000,dpTerverifikasi:false,statusPembayaran:"UNPAID",invoiceSementara:true,invoice:null,transaksi:[]} };
}
