import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { createNavigationContainerRef, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { QueryClientProvider, focusManager } from '@tanstack/react-query';
import { AppState, Linking } from 'react-native';
import { bacaTautanPemulihan } from './src/layanan/pemulihan';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import type { TabUtama, Tumpukan } from './src/navigasi';
import { cache } from './src/layanan/cache';
import { alamatApi, validasiAlamat, verifikasiToken } from './src/layanan/api';
import { ambilSesi, langgananSesi, pulihkanSesi, useSesi } from './src/layanan/sesi';
import { pasangRealtime } from './src/layanan/realtime';
import { gaya, warna } from './src/tema';
import { Halaman, Kesalahan, Memuat, Tombol } from './src/komponen/ui';
import { LayarBeranda } from './src/layar/Beranda';
import { LayarBooking, LayarJadwalUlang } from './src/layar/Booking';
import { LayarRiwayat } from './src/layar/Riwayat';
import { LayarAkun } from './src/layar/Akun';
import { LayarMasuk, LayarDaftar, LayarLupaPassword } from './src/layar/Autentikasi';
import { LayarDetailBooking } from './src/layar/DetailBooking';
const Stack = createNativeStackNavigator<Tumpukan>(), Tab = createBottomTabNavigator<TabUtama>();
const navigasi = createNavigationContainerRef<Tumpukan>();
const ikon = { Beranda: 'home-outline', Booking: 'calendar-outline', Riwayat: 'time-outline', Akun: 'person-outline' } as const;
function NavigasiTab() { return <Tab.Navigator screenOptions={({ route }) => ({ headerShown: false, tabBarActiveTintColor: warna.utama, tabBarInactiveTintColor: warna.redup, tabBarStyle: { backgroundColor: warna.putih, borderTopColor: warna.garis }, tabBarLabelStyle: { fontSize: 12, fontWeight: '600' }, tabBarIcon: ({ color, size }) => <Ionicons name={ikon[route.name]} size={size} color={color} /> })}><Tab.Screen name="Beranda" component={LayarBeranda} /><Tab.Screen name="Booking" component={LayarBooking} /><Tab.Screen name="Riwayat" component={LayarRiwayat} /><Tab.Screen name="Akun" component={LayarAkun} /></Tab.Navigator>; }
function Aplikasi() {
 const sesi = useSesi(), [error, setError] = useState<unknown>(null), [konfigurasi, setKonfigurasi] = useState<unknown>(null);
 const [tokenPemulihan, setTokenPemulihan] = useState<string | null>(null);
 const bukaPemulihan = () => { if (tokenPemulihan && navigasi.isReady()) { navigasi.navigate('LupaPassword', { token: tokenPemulihan }); setTokenPemulihan(null); } };
 useEffect(() => { const terima = (url: string) => { const token = bacaTautanPemulihan(url); if (token) setTokenPemulihan(token); }; void Linking.getInitialURL().then(url => { if (url) terima(url); }).catch(() => {}); const l = Linking.addEventListener('url', e => terima(e.url)); return () => l.remove(); }, []);
 useEffect(bukaPemulihan, [tokenPemulihan, sesi.siap]);
 const pulihkan = () => { setError(null); void pulihkanSesi(verifikasiToken).catch(setError); };
 useEffect(() => {
  try { validasiAlamat(alamatApi); } catch (e) { setKonfigurasi(e); }
  pulihkan(); const stop = pasangRealtime();
  let token = ambilSesi().token;
  const lepas = langgananSesi(() => { const baru = ambilSesi().token; if (token && !baru && navigasi.isReady()) navigasi.resetRoot({ index: 0, routes: [{ name: 'Utama' }] }); token = baru; });
  const state = AppState.addEventListener('change', s => focusManager.setFocused(s === 'active'));
  return () => { lepas(); stop(); state.remove(); };
 }, []);
 if (konfigurasi) return <Halaman><Text style={gaya.judul}>Alamat server belum siap</Text><Text style={gaya.teks}>Atur EXPO_PUBLIC_API_URL pada konfigurasi lokal, lalu mulai ulang Expo.</Text></Halaman>;
 if (!sesi.siap) return <Memuat />;
 return <><Kesalahan error={error} ulang={pulihkan} />{error && !sesi.token && <Tombol judul="Lanjut melihat layanan" sekunder tekan={() => setError(null)} />}<NavigationContainer ref={navigasi} onReady={bukaPemulihan}><Stack.Navigator screenOptions={{ headerTintColor: warna.navy, headerStyle: { backgroundColor: warna.latar }, headerShadowVisible: false, contentStyle: { backgroundColor: warna.latar } }}><Stack.Screen name="Utama" component={NavigasiTab} options={{ headerShown: false }} /><Stack.Screen name="Masuk" component={LayarMasuk} options={{ title: 'Masuk' }} /><Stack.Screen name="Daftar" component={LayarDaftar} options={{ title: 'Daftar akun' }} /><Stack.Screen name="LupaPassword" component={LayarLupaPassword} options={{ title: 'Bantuan password' }} /><Stack.Screen name="DetailBooking" component={LayarDetailBooking} options={{ title: 'Booking Anda' }} /><Stack.Screen name="JadwalUlang" component={LayarJadwalUlang} options={{ title: 'Jadwalkan ulang' }} /></Stack.Navigator></NavigationContainer></>;
}
export default function App() { return <SafeAreaProvider><QueryClientProvider client={cache}><SafeAreaView style={gaya.halaman} edges={['top', 'left', 'right']}><StatusBar style="dark" /><Aplikasi /></SafeAreaView></QueryClientProvider></SafeAreaProvider>; }
