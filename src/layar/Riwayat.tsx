import { useState } from 'react';
import { Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { Tumpukan } from '../navigasi';
import { Halaman, Kartu, Kesalahan, Lencana, Memuat, Tombol } from '../komponen/ui';
import { gaya } from '../tema';
import { useBooking } from '../layanan/kueri';
import { useSesi } from '../layanan/sesi';
import { rupiah, statusRamah, waktu } from '../layanan/aturan';
export function LayarRiwayat() {
 const nav = useNavigation<NativeStackNavigationProp<Tumpukan>>(), sesi = useSesi(), kueri = useBooking(), [selesai, setSelesai] = useState(false);
 if (!sesi.token) return <Halaman><Text style={gaya.judul}>Riwayat Anda</Text><Kartu><Text style={gaya.teks}>Booking tersimpan khusus untuk akun Anda. Masuk untuk melihatnya.</Text><Tombol judul="Masuk" tekan={() => nav.navigate('Masuk')} /></Kartu></Halaman>;
 const daftar = kueri.data?.filter(b => ['COMPLETED', 'CANCELLED', 'REJECTED', 'NO_SHOW'].includes(b.status) === selesai).sort((a, b) => Date.parse(b.dibuatPada) - Date.parse(a.dibuatPada));
 return <Halaman segarkan={() => void kueri.refetch()} memuat={kueri.isRefetching}><Text style={gaya.judul}>Booking Anda</Text><View style={gaya.baris}><Tombol judul="Berjalan" sekunder={selesai} tekan={() => setSelesai(false)} /><Tombol judul="Riwayat" sekunder={!selesai} tekan={() => setSelesai(true)} /></View>{kueri.isPending && <Memuat />}<Kesalahan error={kueri.error} ulang={() => void kueri.refetch()} />{daftar?.length === 0 && <Kartu><Text style={gaya.teks}>{selesai ? 'Belum ada riwayat booking.' : 'Belum ada booking yang berjalan.'}</Text></Kartu>}{daftar?.map(b => <Kartu key={b.id}><Lencana teks={statusRamah(b.status)} /><Text style={gaya.subjudul}>{waktu(b.mulaiPada)}</Text><Text style={gaya.redup}>{b.nomorBooking}{'\n'}{b.items.map(i => `${i.namaLayanan} ×${i.qty}`).join(', ')}</Text><Text style={gaya.teks}>{rupiah(b.total)}</Text><Tombol judul="Lihat detail" sekunder tekan={() => nav.navigate('DetailBooking', { id: b.id })} /></Kartu>)}</Halaman>;
}
