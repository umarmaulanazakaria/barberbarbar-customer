import * as SecureStore from "expo-secure-store";
import axios from "axios";
import { useSyncExternalStore } from "react";
import { cache } from "./cache";
import type { Akun } from "../tipe";
const kunci = "barberbarbar.customer.jwt";
type Sesi = {
  token: string | null;
  akun: Akun | null;
  siap: boolean;
  versi: number;
};
let sesi: Sesi = { token: null, akun: null, siap: false, versi: 0 };
const pendengar = new Set<() => void>();
let antrean: Promise<unknown> = Promise.resolve();
function simpan(token: string | null) {
  const kerja = antrean.then(() =>
    token
      ? SecureStore.setItemAsync(kunci, token)
      : SecureStore.deleteItemAsync(kunci),
  );
  antrean = kerja.catch(() => undefined);
  return kerja;
}
export const ambilSesi = () => sesi;
export const langgananSesi = (fn: () => void) => {
  pendengar.add(fn);
  return () => {
    pendengar.delete(fn);
  };
};
function ubah(data: Partial<Sesi>) {
  sesi = { ...sesi, ...data };
  for (const fn of pendengar) fn();
}
export const useSesi = () => useSyncExternalStore(langgananSesi, ambilSesi);
export async function mulaiSesi(token: string, akun: Akun, versiAwal: number) {
  if (sesi.versi !== versiAwal) return;
  // Hapus cache dan putuskan socket lama sebelum identitas berganti.
  cache.clear();
  ubah({ token, akun, siap: true, versi: sesi.versi + 1 });
  try {
    await simpan(token);
  } catch {
    await keluar(token);
    throw new Error(
      "Sesi tidak dapat disimpan dengan aman. Silakan masuk kembali.",
    );
  }
}
export async function keluar(tokenLama?: string) {
  if (tokenLama && sesi.token !== tokenLama) return;
  cache.clear();
  ubah({ token: null, akun: null, siap: true, versi: sesi.versi + 1 });
  await simpan(null);
}
export async function pulihkanSesi(
  verifikasi: (token: string) => Promise<Akun>,
) {
  const versi = sesi.versi;
  try {
    await antrean;
    const token = await SecureStore.getItemAsync(kunci);
    if (!token) {
      if (sesi.versi === versi) ubah({ siap: true });
      return;
    }
    const akun = await verifikasi(token);
    if (sesi.versi === versi)
      ubah({ token, akun, siap: true, versi: versi + 1 });
  } catch (error) {
    // Gangguan jaringan tidak menghapus credential tersimpan; 401 ditangani pemanggil.
    if (
      sesi.versi === versi &&
      axios.isAxiosError(error) &&
      error.response?.status === 401
    )
      await keluar();
    if (sesi.versi === versi) ubah({ siap: true });
    throw error;
  }
}
