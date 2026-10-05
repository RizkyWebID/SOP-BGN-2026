/* ============================================================
 * SAAS — LAPORAN KEUANGAN SPPG LPDH
 * File     : app.js
 * Fungsi   : Bootstrap aplikasi — pasang event, isi info versi,
 *            dan rangkai modul (DB, UI, Import, Export).
 * ============================================================ */

(function bootstrap() {
  'use strict';

  /* -------- Isi info versi & tahun -------- */
  document.getElementById('saas-version').textContent = 'Versi: ' + SAAS_APP.brand.version;
  document.getElementById('saas-year').textContent = new Date().getFullYear();

  /* -------- Simpan sesi aktif di memori -------- */
  let activeSession = null;

  /* -------- Ambil elemen UI penting -------- */
  const elUser     = document.getElementById('input-user');
  const elSession  = document.getElementById('input-session');
  const btnNew     = document.getElementById('btn-new-session');
  const btnMaster  = document.getElementById('btn-import-master');
  const btnImport  = document.getElementById('btn-import-data');
  const btnManual  = document.getElementById('btn-input-manual');
  const btnExport  = document.getElementById('btn-export');

  /* -------- Buat sesi baru -------- */
  btnNew.addEventListener('click', async () => {
    const userName = (elUser.value || '').trim();
    if (!userName) return SAAS_UI.toast('Isi nama pengguna dulu.', 'warn');

    activeSession = await SAAS_DB.createSession(userName);
    elSession.value = activeSession.id;
    SAAS_UI.toast('Sesi dibuat: ' + activeSession.id, 'ok');
  });

  /* -------- Baca struktur master XLSX (read-only) -------- */
  btnMaster.addEventListener('click', () => {
    // TODO: pemicu input file → SAAS_IMPORT.readMasterStructure(file)
    SAAS_UI.toast('Fitur baca master akan diisi setelah file XLSX diterima.', 'warn');
  });

  /* -------- Import data kerjaan -------- */
  btnImport.addEventListener('click', () => {
    if (!activeSession) return SAAS_UI.toast('Buat sesi dulu.', 'warn');
    // TODO: pemicu input file → SAAS_IMPORT.importWorkbook(file, activeSession.id)
    SAAS_UI.toast('Fitur import akan diisi setelah struktur master diketahui.', 'warn');
  });

  /* -------- Input manual -------- */
  btnManual.addEventListener('click', () => {
    if (!activeSession) return SAAS_UI.toast('Buat sesi dulu.', 'warn');
    // TODO: buka modal form input manual (menunggu mapping kolom master)
    SAAS_UI.toast('Form input manual akan dibuka setelah kolom master diketahui.', 'warn');
  });

  /* -------- Export XLSX -------- */
  btnExport.addEventListener('click', async () => {
    if (!activeSession) return SAAS_UI.toast('Buat sesi dulu.', 'warn');
    // TODO: SAAS_EXPORT.buildWorkbook(activeSession.id) → download
    SAAS_UI.toast('Export akan aktif setelah struktur master XLSX diterima.', 'warn');
  });

  /* -------- Banner kecil: status API siap -------- */
  console.info('[SAAS] %s v%s siap. Namespace: %s',
    SAAS_APP.brand.name, SAAS_APP.brand.version, SAAS_APP.namespace.prefix + '...');
})();