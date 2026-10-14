import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";
import { gaya, warna } from "../tema";
import { pesanError } from "../layanan/api";
export function Halaman({
  children,
  segarkan,
  memuat = false,
}: {
  children: ReactNode;
  segarkan?: () => void;
  memuat?: boolean;
}) {
  return (
    <ScrollView
      style={gaya.halaman}
      contentContainerStyle={gaya.isi}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        segarkan ? (
          <RefreshControl
            refreshing={memuat}
            onRefresh={segarkan}
            tintColor={warna.utama}
          />
        ) : undefined
      }
    >
      {children}
    </ScrollView>
  );
}
export function Kartu({ children }: { children: ReactNode }) {
  return <View style={gaya.kartu}>{children}</View>;
}
export function Tombol({
  judul,
  tekan,
  sibuk,
  nonaktif,
  sekunder = false,
  bahaya = false,
}: {
  judul: string;
  tekan: () => void;
  sibuk?: boolean;
  nonaktif?: boolean;
  sekunder?: boolean;
  bahaya?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!(nonaktif || sibuk), busy: !!sibuk }}
      disabled={nonaktif || sibuk}
      onPress={tekan}
      style={({ pressed }) => [
        gaya.tombol,
        { opacity: nonaktif || sibuk ? 0.5 : pressed ? 0.75 : 1 },
        sekunder && { backgroundColor: "#EEF2FF" },
        bahaya && { backgroundColor: warna.bahaya },
      ]}
    >
      {sibuk ? (
        <ActivityIndicator color={sekunder ? warna.utama : warna.putih} />
      ) : (
        <Text style={[gaya.labelTombol, sekunder && { color: warna.utama }]}>
          {judul}
        </Text>
      )}
    </Pressable>
  );
}
export function Kolom({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={{ gap: 7 }}>
      <Text style={gaya.redup}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={warna.redup}
        {...props}
        style={[gaya.input, props.style]}
      />
    </View>
  );
}
export function Kesalahan({
  error,
  ulang,
}: {
  error: unknown;
  ulang?: () => void;
}) {
  if (!error) return null;
  return (
    <Kartu>
      <Text accessibilityRole="alert" style={gaya.salah}>
        {pesanError(error)}
      </Text>
      {ulang && <Tombol judul="Coba lagi" sekunder tekan={ulang} />}
    </Kartu>
  );
}
export function Memuat() {
  return (
    <View style={{ padding: 24 }}>
      <ActivityIndicator color={warna.utama} accessibilityLabel="Memuat data" />
    </View>
  );
}
export function Lencana({ teks }: { teks: string }) {
  return (
    <View style={gaya.lencana}>
      <Text style={{ color: warna.utama, fontWeight: "600" }}>{teks}</Text>
    </View>
  );
}
export function Baris({ kiri, kanan }: { kiri: string; kanan: string }) {
  return (
    <View style={gaya.baris}>
      <Text style={[gaya.redup, { flex: 1 }]}>{kiri}</Text>
      <Text
        style={[
          gaya.teks,
          { flexShrink: 1, fontWeight: "600", textAlign: "right" },
        ]}
      >
        {kanan}
      </Text>
    </View>
  );
}
