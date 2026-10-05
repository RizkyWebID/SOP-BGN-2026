/* ============================================================
 * SAAS — LAPORAN KEUANGAN SPPG LPDH
 * File     : forms/form-d-insentif.js
 * ============================================================ */

const SAAS_FORM_DINSENTIF = {
  async render(root, sessionId) {
    if (!sessionId) {
      root.innerHTML = '<p class="saas-hint">Buat sesi dulu di tab Sesi.</p>';
      return;
    }
    root.innerHTML = `
      <h2 class="saas-card__title">D. Insentif Ketersediaan & Mutu Layanan</h2>
      <p class="saas-hint mb-3">Isi syarat dan pembayaran insentif ke Mitra/Yayasan.</p>
      <div id="saas-dins-body"></div>
    `;
    await SAAS_FORM_BUILDER.renderFlat('D_Insentif', sessionId,
      root.querySelector('#saas-dins-body'), { rowIndex: 0 });
  },
};

window.SAAS_FORM_DINSENTIF = SAAS_FORM_DINSENTIF;