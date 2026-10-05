/* ============================================================
 * SAAS — LAPORAN KEUANGAN SPPG LPDH
 * File     : export-xlsx.js
 * Fungsi   : Menghasilkan file XLSX BARU dengan struktur identik
 *            master. File master TIDAK PERNAH ditimpa.
 *
 * ⚠️  PENTING:
 *  - Nama sheet, urutan kolom, dan header WAJIB sama persis master.
 *  - Kita hanya mengisi baris data dari DB lokal.
 *  - Jangan tambah/kurangi sheet atau kolom.
 *
 * TODO:
 *  - Isi buildWorkbook() setelah struktur master diketahui.
 * ============================================================ */

const SAAS_EXPORT = {
  /**
   * Buat file XLSX dari sesi tertentu.
   * @param {string} sessionId
   * @returns {Promise<Blob>} blob file XLSX siap diunduh
   */
  async buildWorkbook(sessionId) {
    // Ambil data sesi + record
    const session = await SAAS_DB.get(SAAS_APP.stores.sessions, sessionId);
    if (!session) throw new Error('Sesi tidak ditemukan.');
    const rows = await SAAS_DB.recordsBySession(sessionId);

    // TODO: gunakan struktur master dari store 'master' sebagai template.
    //       Susun worksheet, isi baris, hasilkan Blob.
    throw new Error('buildWorkbook belum diisi — menunggu struktur master XLSX.');
  },

  /* Trigger unduhan file */
  downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    setTimeout(() => { a.remove(); URL.revokeObjectURL(url); }, 500);
  },
};

window.SAAS_EXPORT = SAAS_EXPORT;