/* ============================================================
 * SAAS — LAPORAN KEUANGAN SPPG LPDH
 * File     : import-xlsx.js
 * Fungsi   : 1) Baca STRUKTUR file master XLSX (read-only) untuk
 *               membangun form input otomatis.
 *            2) Import data kerjaan dari file XLSX user.
 *
 * ⚠️  PENTING:
 *  - File master TIDAK PERNAH ditulis ulang / dimodifikasi.
 *  - Fungsi baca di sini hanya mengambil: nama sheet, header kolom,
 *    dan tipe data dasar, lalu disimpan ke store 'master'.
 *  - Struktur yang disimpan nanti WAJIB dipakai apa adanya saat
 *    export, agar server perusahaan menerima.
 *
 * TODO (menunggu file master dari user):
 *  - Isi fungsi readMasterStructure() sesuai sheet & kolom asli.
 *  - Isi fungsi mapImportedRow() sesuai nama kolom asli.
 * ============================================================ */

const SAAS_IMPORT = {
  /**
   * Membaca STRUKTUR master (read-only).
   * @param {File} file — file master XLSX
   * @returns {Promise<object>} struktur { fileName, sheets: [{name, columns:[]}] }
   */
  async readMasterStructure(file) {
    // TODO: gunakan SheetJS (XLSX.read) — mode baca saja.
    // Untuk sementara kita return placeholder.
    throw new Error('readMasterStructure belum diisi — menunggu file master XLSX.');
  },

  /**
   * Import data kerjaan user dari XLSX ke DB lokal.
   * @param {File} file
   * @param {string} sessionId
   */
  async importWorkbook(file, sessionId) {
    // TODO: baca sheet, map tiap baris ke objek record,
    //       lalu simpan ke store 'records' dengan sessionId.
    throw new Error('importWorkbook belum diisi — menunggu struktur kolom master.');
  },
};

window.SAAS_IMPORT = SAAS_IMPORT;