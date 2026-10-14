import { useState } from 'react';
import {
  FlatList, KeyboardAvoidingView, Modal, Platform, Pressable,
  StyleSheet, Text, TextInput, useWindowDimensions, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { gaya, warna } from '../tema';
import { Kesalahan, Memuat } from './ui';

type Pilihan = { nilai: number | null; label: string };
type Properti = {
  judul: string;
  pilihan: Pilihan[];
  nilai: number | null;
  ubah: (nilai: number | null) => void;
  memuat?: boolean;
  error?: unknown;
  ulang: () => void;
  nonaktif?: boolean;
};

export function PilihanBerpencarian({ judul, pilihan, nilai, ubah, memuat, error, ulang, nonaktif }: Properti) {
  const [terbuka, setTerbuka] = useState(false);
  const [pencarian, setPencarian] = useState('');
  const inset = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const terpilih = pilihan.find(p => p.nilai === nilai);
  const tidakTersedia = !memuat && !error && nilai !== null && !terpilih;
  const tutup = () => { setTerbuka(false); setPencarian(''); };
  const baris = (p: Pilihan) => (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={p.label}
      accessibilityState={{ selected: nilai === p.nilai, checked: nilai === p.nilai }}
      onPress={() => { ubah(p.nilai); tutup(); }}
      style={({ pressed }) => [styles.pilihan, nilai === p.nilai && styles.terpilih, pressed && { opacity: 0.7 }]}
    >
      <Text style={[gaya.teks, { flex: 1 }, nilai === p.nilai && { color: warna.utama, fontWeight: '700' }]}>{p.label}</Text>
      <Ionicons name={nilai === p.nilai ? 'radio-button-on' : 'radio-button-off'} size={22} color={nilai === p.nilai ? warna.utama : warna.redup} />
    </Pressable>
  );
  const query = pencarian.trim().toLocaleLowerCase('id-ID');
  // Pilihan umum tetap tersedia walau nama yang dicari tidak ditemukan.
  const umum = pilihan.find(p => p.nilai === null);
  const hasil = pilihan.filter(p => p.nilai !== null && p.label.toLocaleLowerCase('id-ID').includes(query));
  return (
    <View style={{ gap: 8 }}>
      <Text style={gaya.redup}>{judul}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${judul}: ${terpilih?.label ?? 'Pilihan perlu diperbarui'}`}
        accessibilityHint="Buka daftar dan cari nama barber"
        accessibilityState={{ expanded: terbuka, disabled: !!nonaktif }}
        disabled={nonaktif}
        onPress={() => { setPencarian(''); setTerbuka(true); }}
        style={[styles.field, nonaktif && { opacity: 0.5 }, tidakTersedia && { borderColor: warna.bahaya }]}
      >
        <Text style={[gaya.teks, { flex: 1 }]}>{terpilih?.label ?? 'Pilihan perlu diperbarui'}</Text>
        <Ionicons name="chevron-down" size={20} color={warna.utama} />
      </Pressable>
      {tidakTersedia && <Text accessibilityRole="alert" style={gaya.salah}>Barber pilihan tidak lagi tersedia. Silakan pilih ulang.</Text>}
      <Modal visible={terbuka} transparent animationType="slide" statusBarTranslucent onRequestClose={tutup}>
        <View style={styles.latar}>
          <Pressable style={StyleSheet.absoluteFill} accessibilityRole="button" accessibilityLabel="Tutup pilihan barber" onPress={tutup} />
          <KeyboardAvoidingView pointerEvents="box-none" behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.penghindar}>
            <View accessibilityViewIsModal style={[styles.sheet, { maxHeight: Math.max(180, height - inset.top - 24), paddingBottom: Math.max(inset.bottom, 16) }]}>
              <View style={styles.kepala}>
                <Text accessibilityRole="header" style={[gaya.subjudul, { flex: 1 }]}>{judul}</Text>
                <Pressable accessibilityRole="button" accessibilityLabel="Tutup pilihan barber" hitSlop={8} onPress={tutup} style={styles.tutup}>
                  <Ionicons name="close" size={24} color={warna.navy} />
                </Pressable>
              </View>
              <View style={styles.pencarian}>
                <Ionicons name="search-outline" size={20} color={warna.redup} />
                <TextInput accessibilityLabel="Cari nama barber" placeholder="Cari nama barber..." placeholderTextColor={warna.redup} value={pencarian} onChangeText={setPencarian} autoCapitalize="none" autoCorrect={false} returnKeyType="search" style={[gaya.teks, { flex: 1, paddingVertical: 12 }]} />
              </View>
              {memuat ? <Memuat /> : error ? <Kesalahan error={error} ulang={ulang} /> : (
                <FlatList
                  data={hasil} keyExtractor={p => String(p.nilai)} renderItem={({ item }) => baris(item)}
                  ListHeaderComponent={umum ? baris(umum) : null}
                  ListEmptyComponent={<Text accessibilityLiveRegion="polite" style={[gaya.redup, { padding: 20 }]}>Barber tidak ditemukan</Text>}
                  keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag"
                  style={{ flexShrink: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 12 }}
                  initialNumToRender={12}
                />
              )}
              <Text style={[gaya.redup, { paddingHorizontal: 20, paddingTop: 12 }]}>Ketersediaan pada jadwal pilihan diperiksa saat pengajuan booking.</Text>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: warna.putih, borderWidth: 1, borderColor: warna.garis, borderRadius: 14, padding: 14 },
  latar: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15,23,42,0.5)' },
  penghindar: { flex: 1, justifyContent: 'flex-end' },
  sheet: { backgroundColor: warna.latar, borderTopLeftRadius: 24, borderTopRightRadius: 24, flexShrink: 1, overflow: 'hidden', width: '100%', maxWidth: 680, alignSelf: 'center' },
  kepala: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, gap: 12 },
  tutup: { minHeight: 48, minWidth: 48, alignItems: 'center', justifyContent: 'center' },
  pencarian: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: warna.garis, borderRadius: 14, backgroundColor: warna.putih, margin: 20, marginTop: 12, paddingHorizontal: 14, minHeight: 50 },
  pilihan: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, padding: 14, borderRadius: 12, marginBottom: 6, backgroundColor: warna.putih },
  terpilih: { backgroundColor: '#EEF2FF' },
});
