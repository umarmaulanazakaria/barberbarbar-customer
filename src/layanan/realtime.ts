import { io } from "socket.io-client";

// Event hanya sinyal refetch. Tidak pernah dipakai untuk menetapkan PAID/CONFIRMED.
export function langgananBookingTamu(perbarui: () => void) {
  const asal = new URL(import.meta.env.VITE_API_BASE_URL || "/api", window.location.origin);
  if (!["http:", "https:"].includes(asal.protocol) || asal.username || asal.password || asal.search || asal.hash)
    return () => {};
  const socket = io(asal.origin, {
    path: "/socket.io", auth: { tipe: "TAMU" }, withCredentials: true,
    autoConnect: false, forceNew: true, reconnectionDelayMax: 10_000,
    // WebSocket menyertakan Origin melalui proxy same-origin; cookie tetap HttpOnly.
    transports: ["websocket"],
  });
  let timer: ReturnType<typeof setTimeout> | undefined;
  const segarkan = () => {
    // Satu transaksi dapat menghasilkan beberapa event; gabungkan refetch serentak.
    if (timer) return;
    timer = setTimeout(() => { timer = undefined; perbarui(); }, 150);
  };
  const ditolak = (error: Error) => {
    if (error.message === "AKSES_DITOLAK") { socket.disconnect(); segarkan(); }
  };
  const terputus = (alasan: string) => {
    if (alasan === "io server disconnect") { socket.disconnect(); segarkan(); }
  };
  socket.on("connect", segarkan);
  socket.on("realtime.ready", segarkan);
  socket.on("booking.changed", segarkan);
  socket.on("order.changed", segarkan);
  socket.on("payment.changed", segarkan);
  socket.on("connect_error", ditolak);
  socket.on("disconnect", terputus);
  socket.connect();
  return () => {
    if (timer) clearTimeout(timer);
    socket.off("connect", segarkan);
    socket.off("realtime.ready", segarkan);
    socket.off("booking.changed", segarkan);
    socket.off("order.changed", segarkan);
    socket.off("payment.changed", segarkan);
    socket.off("connect_error", ditolak);
    socket.off("disconnect", terputus);
    socket.disconnect();
  };
}
