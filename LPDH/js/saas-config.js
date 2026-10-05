/* ============================================================
 * SAAS — LAPORAN KEUANGAN SPPG LPDH
 * File     : saas-config.js
 * Fungsi   : Konfigurasi global (brand, versi, namespace DB,
 *            konstanta export, range register bukti).
 * ============================================================ */

const SAAS_APP = {
  brand: {
    name:       'Laporan Keuangan SPPG LPDH',
    shortName:  'SPPG LPDH',
    vendor:     'SAAS',
    version:    '1.0.0',
  },

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

  stores: {
    sessions: 'sessions',
    records:  'records',
    template: 'template',
    meta:     'meta',
  },

  db: {
    name:    'SAAS_LPDH_DB',
    version: 2,   // ← dinaikkan dari 1 → 2 untuk memperbaiki skema
  },

  export: {
    REGISTER_RANGE_OLD: '$C$5:$C$130',
    REGISTER_RANGE_NEW: '$C$5:$C$125',
    REGISTER_SHEET: 'I_RegisterBukti',
    READONLY_SHEETS: [
      'Petunjuk', 'G_CekPPK', 'H_RekapPPK',
      'I_RegisterBukti', 'J_Pengesahan', 'Ref',
    ],
    INPUT_SHEETS: [
      'Identitas', 'A_PM', 'B_BahanBaku', 'C_Operasional',
      'C1_Relawan', 'D_Insentif', 'E_Saldo', 'F_TopUp',
    ],
  },

  ui: {
    defaultTheme: 'soft-light',
    locale:       'id-ID',
    currency:     'IDR',
    rowsPerPage:  25,
  },
};

window.SAAS_APP = SAAS_APP;