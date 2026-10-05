/* ============================================================
 * SAAS — LAPORAN KEUANGAN SPPG LPDH
 * File     : forms/form-generic-table.js
 * Fungsi   : Form generik untuk sheet dengan pola baris-berulang
 *            (B_BahanBaku, C_Operasional, C1_Relawan, E_Saldo topup).
 * ============================================================ */

const SAAS_FORM_GENERIC_TABLE = {
  async render(root, sessionId, { sheet, title, hint, maxRows }) {
    if (!sessionId) {
      root.innerHTML = '<p class="saas-hint">Buat sesi dulu di tab Sesi.</p>';
      return;
    }
    const defs = (SAAS_CELL_MAP[sheet] || []).find((d) => d.range);
    if (!defs) {
      root.innerHTML = `<p class="saas-hint">Definisi sheet ${sheet} tidak ditemukan.</p>`;
      return;
    }
    const cols = defs.cols;

    root.innerHTML = `
      <h2 class="saas-card__title">${title}</h2>
      <p class="saas-hint mb-3">${hint}</p>
      <div class="flex items-center gap-2 mb-2">
        <button id="saas-add-row" class="saas-btn saas-btn--primary">+ Tambah Baris</button>
        <span class="saas-hint" id="saas-row-count"></span>
      </div>
      <div class="saas-table-wrap">
        <table class="saas-table"><thead><tr></tr></thead><tbody></tbody></table>
      </div>
    `;

    const thead = root.querySelector('thead tr');
    const thNo = document.createElement('th'); thNo.textContent = '#'; thead.appendChild(thNo);
    cols.forEach((c) => {
      const th = document.createElement('th'); th.textContent = c.label; thead.appendChild(th);
    });

    const tbody = root.querySelector('tbody');
    const addRowBtn = root.querySelector('#saas-add-row');
    const rowCountEl = root.querySelector('#saas-row-count');

    // Cari baris terakhir yang terisi
    const saved = await SAAS_DB.rowsBySheet(sessionId, sheet);
    const usedIdx = saved.map((r) => r.rowIndex).sort((a, b) => a - b);
    const nextIdx = usedIdx.length ? Math.max(...usedIdx) + 1 : defs.range.from;
    const startFrom = Math.min(nextIdx, defs.range.to);

    // Selalu tampilkan minimal 1 baris (baris kosong pun boleh)
    const rowsToRender = [];
    for (let i = defs.range.from; i <= startFrom && i <= defs.range.to; i++) {
      rowsToRender.push(i);
    }

    for (const rowIndex of rowsToRender) {
      await this._renderRow(tbody, sessionId, sheet, cols, rowIndex);
    }
    rowCountEl.textContent = `${rowsToRender.length} / ${maxRows} baris maksimal`;

    addRowBtn.addEventListener('click', async () => {
      const cur = tbody.children.length;
      const usedCount = defs.range.from + cur;
      if (usedCount > defs.range.to) {
        return SAAS_UI.toast(`Maksimum ${maxRows} baris.`, 'warn');
      }
      await this._renderRow(tbody, sessionId, sheet, cols, usedCount);
      rowCountEl.textContent = `${tbody.children.length} / ${maxRows} baris maksimal`;
    });
  },

  async _renderRow(tbody, sessionId, sheet, cols, rowIndex) {
    const tr = document.createElement('tr');
    const tdNo = document.createElement('td'); tdNo.textContent = rowIndex - 5;
    tr.appendChild(tdNo);

    const rec = await SAAS_DB.getRow(sessionId, sheet, rowIndex);
    const data = (rec && rec.data) || {};

    cols.forEach((def) => {
      const td = document.createElement('td');
      td.appendChild(
        SAAS_FORM_BUILDER.renderField(def, data[def.key], sessionId, sheet, rowIndex)
      );
      tr.appendChild(td);
    });

    tbody.appendChild(tr);
  },
};

window.SAAS_FORM_GENERIC_TABLE = SAAS_FORM_GENERIC_TABLE;