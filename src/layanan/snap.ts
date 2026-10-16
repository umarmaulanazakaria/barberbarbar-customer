type OpsiSnap = {onSuccess:()=>void;onPending:()=>void;onError:()=>void;onClose:()=>void;language:'id'};
declare global { interface Window { snap?: {pay:(token:string,opsi:OpsiSnap)=>void} } }
let sedangMemuat: Promise<void> | null = null, kunciAktif = '';
export async function muatSnap(clientKey: string) {
  if (!clientKey || clientKey.length > 255) throw new Error('Konfigurasi checkout belum tersedia.');
  if (window.snap && kunciAktif === clientKey) return;
  if (kunciAktif && kunciAktif !== clientKey) throw new Error('Konfigurasi checkout berubah. Muat ulang halaman pribadi.');
  if (sedangMemuat) return sedangMemuat;
  kunciAktif = clientKey;
  sedangMemuat = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    const gagal = () => { clearTimeout(timer); script.remove(); sedangMemuat = null; kunciAktif = ''; reject(new Error('Checkout tidak dapat dimuat. Periksa status sebelum mencoba kembali.')); };
    const timer = window.setTimeout(gagal, 15_000);
    script.src = 'https://app.sandbox.midtrans.com/snap/snap.js'; script.dataset.clientKey = clientKey; script.async = true; script.referrerPolicy = 'no-referrer';
    script.onload = () => { if (!window.snap) return gagal(); clearTimeout(timer); resolve(); }; script.onerror = gagal;
    document.head.appendChild(script);
  });
  return sedangMemuat;
}
