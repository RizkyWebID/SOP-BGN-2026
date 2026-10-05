/* ============================================================
 * SAAS — LAPORAN KEUANGAN SPPG LPDH
 * File     : saas-config.js
 * Fungsi   : Konfigurasi global (brand, versi, namespace DB,
 *            konstanta export, range register bukti).
 * Catatan  : SEMUA prefix DB mengacu ke SAAS_APP.namespace.
 *            Perubahan range export cukup di sini saja.
 * ============================================================ */

const SAAS_APP = {
  // ---------- Identitas produk ----------
  brand: {
    name:       'Laporan Keuangan SPPG LPDH',
    shortName:  'SPPG LPDH',
    vendor:     'SAAS',
    version:    '1.0.0',
  },

  // ---------- Namespace DB lokal ----------
  // Format: LPDH_<UserName>_<TanggalBuat>-<TanggalSave>
  namespace: {
    prefix: 'LPDH_',
    buildSessionId(userName, dateCreated, dateSaved) {
      const safe = String(userName || 'user')
        .trim().replace(/[^a-zA-Z0-9]/g, '').slice(0, 24) || 'user';
      const fmt = (d) => {
        const dt = new Date(d);
        const p = (n) => String(n).padStart(2, '0');
        return `${dt.getFullYear()}${p(dt.getMonth() + 1)}${p(dt.getDate())}`;
      };
      return `LPDH_${safe}_${fmt(dateCreated || new Date())}-${fmt(dateSaved || new Date())}`;
    },
  },

  // ---------- Store IndexedDB ----------
  stores: {
    sessions: 'sessions',  // daftar sesi (workspace) user
    records:  'records',   // baris data per sesi (per sheet)
    template: 'template',  // blob master XLSX (read-only, sekali tanam)
    meta:     'meta',      // preferensi umum (sesi aktif, dsb)
  },

  db: {
    name:    'SAAS_LPDH_DB',
    version: 1,
  },

  // ---------- Konstanta export (JANGAN ubah tanpa koordinasi PPK) ----------
  export: {
    // Range register bukti yang benar (per permintaan terbaru).
    // Formula di master masih $C$5:$C$130, akan direwrite saat export.
    REGISTER_RANGE_OLD: '$C$5:$C$130',
    REGISTER_RANGE_NEW: '$C$5:$C$125',

    // Nama kolom kunci pada sheet I_RegisterBukti
    REGISTER_SHEET: 'I_RegisterBukti',

    // Sheet yang TIDAK boleh diubah user (100% formula)
    READONLY_SHEETS: [
      'Petunjuk', 'G_CekPPK', 'H_RekapPPK',
      'I_RegisterBukti', 'J_Pengesahan', 'Ref',
    ],

    // Sheet yang punya sel input user (urut sesuai pengisian)
    INPUT_SHEETS: [
      'Identitas', 'A_PM', 'B_BahanBaku', 'C_Operasional',
      'C1_Relawan', 'D_Insentif', 'E_Saldo', 'F_TopUp',
    ],
  },

  // ---------- Preferensi UI ----------
  ui: {
    defaultTheme: 'soft-light',
    locale:       'id-ID',
    currency:     'IDR',
    rowsPerPage:  25,
  },
};

window.SAAS_APP = SAAS_APP;