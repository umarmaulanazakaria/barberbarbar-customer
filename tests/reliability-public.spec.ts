import { test, expect } from "@playwright/test";

// UI asli pada port utama. Semua mutasi booking diintersepsi di browser;
// tidak diteruskan ke backend dan tidak membuat fixture pada database utama.
test("Timeout/503, duplicate submit dan retry mempertahankan draf serta kunci request", async ({ page, baseURL }) => {
  expect(new URL(baseURL!).hostname).toBe("localhost");
  const errors: string[] = [], keys: string[] = [];
  page.on("pageerror", e => errors.push(e.name));
  let mode: "timeout" | "hold" = "timeout";
  let lepas: (() => void) | undefined;
  await page.route(/\/guest\/bookings\/session\/?$/, async route => {
    expect(route.request().method()).toBe("POST");
    const body = route.request().postDataJSON();
    keys.push(body.kunciIdempotensi);
    expect(body).not.toHaveProperty("harga");
    expect(body).not.toHaveProperty("nominalDp");
    expect(body).not.toHaveProperty("barberPilihanId");
    if (mode === "timeout") return route.abort("timedout");
    await new Promise<void>(resolve => { lepas = resolve; });
    await route.fulfill({ status: 503, json: { pesan: "Tidak tersedia" } });
  });
  try {
    await page.goto("/#/booking");
    await page.getByLabel("Nama lengkap").fill("Uji koneksi tidak dikirim");
    await page.getByLabel("Nomor HP", { exact: false }).fill("081234567890");
    await page.getByRole("checkbox").first().check();
    await page.getByLabel("Tanggal layanan").fill(new Date(Date.now() + 7 * 3600000 + 86400000).toISOString().slice(0, 10));
    await page.getByLabel("Jam layanan").fill("14:00");
    const kirim = page.locator('form button[type="submit"]');
    await expect(kirim).toHaveText(/Buat booking dan lanjut ke DP/);
    await kirim.click();
    await expect(page.getByRole("alert")).toContainText("Hasil permintaan belum dapat dipastikan");
    await expect(kirim).toBeEnabled();
    await expect(page.getByLabel("Nama lengkap")).toHaveValue("Uji koneksi tidak dikirim");
    mode = "hold";
    await kirim.click();
    await expect.poll(() => keys.length).toBe(2);
    await expect(kirim).toBeDisabled();
    // Event sintetis kedua menguji kunci sinkron parent, bukan hanya disabled UI.
    await page.locator("form").dispatchEvent("submit");
    expect(keys).toHaveLength(2);
    expect(keys[0]).toBe(keys[1]);
    await expect.poll(() => Boolean(lepas)).toBe(true);
    lepas!();
    await expect(page.getByRole("alert")).toContainText("Booking online sedang tidak tersedia");
    await expect(kirim).toBeEnabled();
    await expect(page).toHaveURL(/#\/booking$/);
    expect(errors).toEqual([]);
  } finally {
    lepas?.();
    await page.unrouteAll({ behavior: "wait" });
  }
});
