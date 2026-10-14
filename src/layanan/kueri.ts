import { useQuery } from "@tanstack/react-query";
import { useSesi } from "./sesi";
import {
  ambilBarber,
  ambilBooking,
  ambilLayanan,
  ambilMembership,
  ambilProfil,
  ambilRefund,
  detailBooking,
  pembayaranBooking,
} from "./api";
export const useLayanan = () =>
  useQuery({ queryKey: ["layanan"], queryFn: ambilLayanan });
export const useBarber = () =>
  useQuery({ queryKey: ["barber"], queryFn: ambilBarber });
export function useProfil() {
  const s = useSesi();
  return useQuery({
    queryKey: ["profil", s.versi],
    queryFn: ambilProfil,
    enabled: !!s.token,
  });
}
export function useMembership() {
  const s = useSesi();
  return useQuery({
    queryKey: ["membership", s.versi],
    queryFn: ambilMembership,
    enabled: !!s.token,
  });
}
export function useBooking() {
  const s = useSesi();
  return useQuery({
    queryKey: ["booking", s.versi],
    queryFn: ambilBooking,
    enabled: !!s.token,
  });
}
export function useDetail(id: number) {
  const s = useSesi();
  return useQuery({
    queryKey: ["detail", s.versi, id],
    queryFn: () => detailBooking(id),
    enabled: !!s.token,
  });
}
export function usePembayaran(id: number) {
  const s = useSesi();
  return useQuery({
    queryKey: ["pembayaran", s.versi, id],
    queryFn: () => pembayaranBooking(id),
    enabled: !!s.token,
  });
}
export function useRefund() {
  const s = useSesi();
  return useQuery({
    queryKey: ["refund", s.versi],
    queryFn: ambilRefund,
    enabled: !!s.token,
  });
}
