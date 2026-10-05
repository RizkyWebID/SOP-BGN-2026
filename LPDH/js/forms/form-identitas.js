/* ============================================================
 * SAAS — LAPORAN KEUANGAN SPPG LPDH
 * File     : forms/form-identitas.js
 * Fungsi   : Form input sheet Identitas.
 * ============================================================ */

const SAAS_FORM_IDENTITAS = {
  async render(root, sessionId) {
    if (!sessionId) {
      root.innerHTML = '<p class="saas-hint">Buat sesi dulu di tab Sesi.</p>';
      return;
    }
    const h = document.createElement('h2');
    h.className = 'saas-card__title';
    h.textContent = 'Identitas LPDH';
    root.appendChild(h);

    const hint = document.createElement('p');
    hint.className = 'saas-hint mb-3';
    hint.textContent =
      'Isi data identitas SPPG. Sel kuning di master akan terisi otomatis saat export.';
    root.appendChild(hint);

    const body = document.createElement('div');
    root.appendChild(body);

    await SAAS_FORM_BUILDER.renderFlat('Identitas', sessionId, body, { rowIndex: 0 });
  },
};

window.SAAS_FORM_IDENTITAS = SAAS_FORM_IDENTITAS;