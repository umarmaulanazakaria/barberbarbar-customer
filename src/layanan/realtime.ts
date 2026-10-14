import { io, type Socket } from "socket.io-client";
import { AppState } from "react-native";
import { alamatApi, validasiAlamat } from "./api";
import { ambilSesi, langgananSesi } from "./sesi";
import { cache } from "./cache";
export const eventCustomer = [
  "booking.changed",
  "order.changed",
  "payment.changed",
  "membership.changed",
  "refund.changed",
  "customer.changed",
  "catalog.changed",
] as const;
export function topikEvent(event: string): string[] {
  if (event === "catalog.changed") return ["layanan", "barber"];
  if (event === "membership.changed") return ["membership"];
  if (event === "customer.changed") return ["profil"];
  if (event === "refund.changed")
    return ["refund", "pembayaran", "booking", "detail"];
  return ["booking", "detail", "pembayaran"];
}
export function pasangRealtime(): () => void {
  let socket: Socket | undefined,
    token: string | null = null;
  const dilihat = new Set<string>();
  const segarkan = (topik?: string[]) => {
    if (AppState.currentState !== "active") return;
    void cache.invalidateQueries({
      predicate: (q) => !topik || topik.includes(String(q.queryKey[0])),
    });
  };
  const pasang = () => {
    const sesi = ambilSesi();
    if (sesi.token === token) return;
    socket?.removeAllListeners();
    socket?.disconnect();
    dilihat.clear();
    token = sesi.token;
    if (!token) return;
    try {
      socket = io(validasiAlamat(alamatApi), {
        auth: { token },
        autoConnect: false,
        reconnection: true,
      });
      socket.on("connect", () => segarkan());
      socket.on("realtime.ready", () => segarkan());
      for (const event of eventCustomer)
        socket.on(event, (data: unknown) => {
          if (
            !data ||
            typeof data !== "object" ||
            !("versi" in data) ||
            typeof data.versi !== "string"
          )
            return;
          const kunci = `${event}:${data.versi}`;
          if (dilihat.has(kunci)) return;
          dilihat.add(kunci);
          if (dilihat.size > 300)
            dilihat.delete(dilihat.values().next().value!);
          segarkan(topikEvent(event));
        });
      socket.on("connect_error", () => segarkan());
      socket.connect();
    } catch {
      /* REST dan foreground tetap tersedia ketika konfigurasi belum siap. */
    }
  };
  const lepas = langgananSesi(pasang);
  pasang();
  const state = AppState.addEventListener("change", (s) => {
    if (s === "active") segarkan();
  });
  const timer = setInterval(() => segarkan(), 30000);
  return () => {
    lepas();
    state.remove();
    clearInterval(timer);
    socket?.removeAllListeners();
    socket?.disconnect();
  };
}
