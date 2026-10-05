/* ============================================================
 * SAAS — LAPORAN KEUANGAN SPPG LPDH
 * File     : saas-config.js
 * Fungsi   : Konfigurasi global aplikasi (brand, versi, namespace)
 * Penulis  : —
 * Catatan  : SEMUA prefix database HARUS mengacu ke SAAS_NAMESPACE
 *            agar tidak tabrakan dengan aplikasi lain di domain sama.
 * ============================================================ */

// [SAAS] Objek konfigurasi utama — jangan diubah tanpa koordinasi
const SAAS_APP = {
  // Identitas produk (dipakai di header, footer, title, dll)
  brand: {
    name: 'Laporan Keuangan SPPG LPDH',
    shortName: 'SPPG LPDH',
    vendor: 'SAAS',
    version: '0.1.0-foundation',
  },

  // [SAAS] Namespace database — format: LPDH_<UserName>_<TanggalBuat>-<TanggalSave>
  // Sengaja dibuat fungsi agar tiap user & sesi punya "ruang" sendiri.
  // Contoh hasil: LPDH_budi_20260115-20260120
  namespace: {
    prefix: 'LPDH_',
    // Bangun ID sesi unik. userName dibersihkan agar aman jadi key.
    buildSessionId(userName, dateCreated, dateSaved) {
      const safeUser = String(userName || 'user')
        .trim()
        .replace(/[^a-zA-Z0-9]/g, '')      // hanya huruf & angka
        .slice(0, 24) || 'user';
      const fmt = (d) => {
        const dt = new Date(d);
        const p = (n) => String(n).padStart(2, '0');
        return `${dt.getFullYear()}${p(dt.getMonth() + 1)}${p(dt.getDate())}`;
      };
      const c = fmt(dateCreated || new Date());
      const s = fmt(dateSaved || new Date());
      return `LPDH_${safeUser}_${c}-${s}`;
    },
  },

  // Nama object store di IndexedDB
  stores: {
    sessions: 'sessions',   // daftar workspace/sesi user
    records:  'records',    // baris data keuangan
    master:   'master',     // salinan struktur master XLSX (read-only)
    meta:     'meta',       // preferensi aktif (sesi terpilih, dll)
  },

  // Versi skema IndexedDB — naikkan jika ada perubahan struktur store
  db: {
    name: 'SAAS_LPDH_DB',
    version: 1,
  },

  // Preferensi UI
  ui: {
    defaultTheme: 'soft-light',   // tema terang lembut, tidak menyilaukan
    rowsPerPage: 25,
    locale: 'id-ID',
    currency: 'IDR',
  },
};

// Ekspos ke global window (pakai namespace SAAS agar tidak bentrok)
window.SAAS_APP = SAAS_APP;