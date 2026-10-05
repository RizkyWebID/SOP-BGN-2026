/* ============================================================
 * SAAS — LAPORAN KEUANGAN SPPG LPDH
 * File     : forms/form-a-pm.js
 * Fungsi   : Form input sheet A_PM (10 kelompok sasaran +
 *            ringkasan produksi).
 * ============================================================ */

const SAAS_FORM_APM = {

  /* Kode & nama kelompok sasaran (baris 6..15 di master) */
  KELOMPOK: [
    { kode: 'KS-01', nama: 'PAUD/TK/RA' },
    { kode: 'KS-02', nama: 'SD/MI Kelas 1–3' },
    { kode: 'KS-03', nama: 'SD/MI Kelas 4–6' },
    { kode: 'KS-04', nama: 'SMP/MTs' },
    { kode: 'KS-05', nama: 'SMA/MA/SMK/SLB' },
    { kode: 'KS-06', nama: 'Santri' },
    { kode: 'KS-07', nama: 'Ibu Hamil' },
    { kode: 'KS-08', nama: 'Ibu Menyusui' },
    { kode: 'KS-09', nama: 'Anak Balita (6–59 bulan)' },
    { kode: 'PTK',   nama: 'Pendidik dan Tenaga Kependidikan' },
  ],

  async render(root, sessionId) {
    if (!sessionId) {
      root.innerHTML = '<p class="saas-hint">Buat sesi dulu di tab Sesi.</p>';
      return;
    }

    root.innerHTML = `
      <h2 class="saas-card__title">A. Produksi, Distribusi, Penerimaan Porsi</h2>
      <p class="saas-hint mb-3">
        Isi per kelompok sasaran. BNBA & nomor BAST wajib untuk PM dihitung.
      </p>
      <div class="saas-table-wrap mb-4">
        <table class="saas-table" id="saas-apm-table">
          <thead><tr></tr></thead>
          <tbody></tbody>
        </table>
      </div>
      <h3 class="saas-card__title">Ringkasan Produksi (Aplikasi POP)</h3>
      <div id="saas-apm-summary" class="grid grid-cols-1 md-grid-cols-2 gap-3"></div>
    `;

    const mapA = SAAS_CELL_MAP.A_PM.find((x) => x.range);
    const cols = mapA.cols;

    // Header
    const thead = root.querySelector('#saas-apm-table thead tr');
    const thKode = document.createElement('th'); thKode.textContent = 'Kode'; thead.appendChild(thKode);
    const thNama = document.createElement('th'); thNama.textContent = 'Kelompok'; thead.appendChild(thNama);
    cols.forEach((c) => {
      const th = document.createElement('th'); th.textContent = c.label; thead.appendChild(th);
    });

    // Body: 10 baris
    const tbody = root.querySelector('#saas-apm-table tbody');
    for (let i = 0; i < this.KELOMPOK.length; i++) {
      const rowIndex = 6 + i;   // baris master
      const tr = document.createElement('tr');

      const tdKode = document.createElement('td'); tdKode.textContent = this.KELOMPOK[i].kode; tr.appendChild(tdKode);
      const tdNama = document.createElement('td'); tdNama.textContent = this.KELOMPOK[i].nama; tr.appendChild(tdNama);

      // Ambil record tersimpan untuk baris ini
      const rec = await SAAS_DB.getRow(sessionId, 'A_PM', rowIndex);
      const data = (rec && rec.data) || {};

      cols.forEach((def) => {
        const td = document.createElement('td');
        const field = SAAS_FORM_BUILDER.renderField(def, data[def.key], sessionId, 'A_PM', rowIndex);
        td.appendChild(field);
        tr.appendChild(td);
      });

      tbody.appendChild(tr);
    }

    // Ringkasan produksi (baris C19..C24)
    const sumHost = root.querySelector('#saas-apm-summary');
    const sumDefs = SAAS_CELL_MAP.A_PM.filter((d) => d.cell);
    const sumRec = await SAAS_DB.getRow(sessionId, 'A_PM', 0);
    const sumData = (sumRec && sumRec.data) || {};
    sumDefs.forEach((def) => {
      sumHost.appendChild(
        SAAS_FORM_BUILDER.renderField(def, sumData[def.key], sessionId, 'A_PM', 0)
      );
    });
  },
};

window.SAAS_FORM_APM = SAAS_FORM_APM;