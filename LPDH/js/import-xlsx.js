/* ============================================================
 * SAAS — LAPORAN KEUANGAN SPPG LPDH
 * File     : import-xlsx.js
 * Fungsi   : Import data dari file XLSX kerjaan user ke IndexedDB.
 *
 * ALUR:
 *   1) User pilih file XLSX (format sama dengan master).
 *   2) Baca dengan ExcelJS (read-only).
 *   3) Iterasi sheet sesuai SAAS_CELL_MAP, ambil cell terkait,
 *      simpan ke IndexedDB sebagai records sesi aktif.
 *   4) User lanjut edit di form atau langsung export.
 *
 * CATATAN:
 *   - File XLSX input TIDAK diubah. Hanya dibaca.
 *   - Import MENIMPA data sesi pada sheet yang sama.
 * ============================================================ */

const SAAS_IMPORT = (() => {

  /* Normalisasi nilai cell ExcelJS → string/angka */
  function normalize(v) {
    if (v === null || v === undefined) return '';
    if (v instanceof Date) return v.toISOString().slice(0, 10);

    if (typeof v === 'object') {
      if (Array.isArray(v.richText)) {
        return v.richText.map((r) => r.text || '').join('');
      }
      if ('result' in v && v.result !== undefined) {
        return normalize(v.result);
      }
      if (v.text !== undefined) return String(v.text);
      if (v.hyperlink) return String(v.hyperlink);
      return '';
    }
    return String(v);
  }

  async function readWorkbook(file) {
    if (typeof ExcelJS === 'undefined') {
      throw new Error('ExcelJS belum ter-load. Periksa index.html.');
    }
    const buf = await file.arrayBuffer();
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buf);
    return wb;
  }

  async function importWorkbook(file, sessionId) {
    if (!sessionId) throw new Error('Belum ada sesi aktif.');
    const wb = await readWorkbook(file);

    let totalRows = 0;
    const touchedSheets = [];

    Object.keys(SAAS_CELL_MAP).forEach((sheetName) => {
      const defs = SAAS_CELL_MAP[sheetName];
      if (!defs || defs.length === 0) return;

      const ws = wb.getWorksheet(sheetName);
      if (!ws) return;

      touchedSheets.push(sheetName);

      // Bagian A: sel tunggal (flat) → rowIndex = 0
      const flatDefs = defs.filter((d) => d.cell);
      if (flatDefs.length) {
        const dataFlat = {};
        flatDefs.forEach((def) => {
          const val = normalize(ws.getCell(def.cell).value);
          if (val !== '') dataFlat[def.key] = val;
        });
        if (Object.keys(dataFlat).length) {
          SAAS_DB.putRow(sessionId, sheetName, 0, dataFlat);
          totalRows++;
        }
      }

      // Bagian B: baris berulang
      defs.filter((d) => d.range && d.cols).forEach((def) => {
        for (let r = def.range.from; r <= def.range.to; r++) {
          const dataRow = {};
          def.cols.forEach((c) => {
            const addr = c.col + r;
            const val = normalize(ws.getCell(addr).value);
            if (val !== '') dataRow[c.key] = val;
          });
          if (Object.keys(dataRow).length) {
            SAAS_DB.putRow(sessionId, sheetName, r, dataRow);
            totalRows++;
          }
        }
      });
    });

    return { rows: totalRows, sheets: touchedSheets };
  }

  return { importWorkbook, readWorkbook, normalize };
})();

window.SAAS_IMPORT = SAAS_IMPORT;