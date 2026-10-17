import { StrictMode, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./style.css";
import "./mobile-ux.css";
import "./detail-ux.css";
const Halaman = import.meta.env.MODE === "test" ? lazy(() => import("../tests/fixtures/AppPratinjau")) : App;
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Suspense fallback={<p role="status">Memuat halaman...</p>}><Halaman /></Suspense>
  </StrictMode>,
);
