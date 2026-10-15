import type { NativeStackScreenProps } from "@react-navigation/native-stack";
export type Tumpukan = {
  Utama: undefined;
  Masuk: undefined;
  Daftar: undefined;
  LupaPassword: { token?: string | undefined } | undefined;
  DetailBooking: { id: number };
  JadwalUlang: { id: number };
};
export type PropertiLayar<N extends keyof Tumpukan> = NativeStackScreenProps<
  Tumpukan,
  N
>;
export type TabUtama = {
  Beranda: undefined;
  Booking: undefined;
  Riwayat: undefined;
  Akun: undefined;
};
