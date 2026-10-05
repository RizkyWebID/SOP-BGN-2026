/* ============================================================
 * SAAS — LAPORAN KEUANGAN SPPG LPDH
 * File     : xlsx-engine.js
 * Fungsi   : Engine baca master XLSX + export hasil kerja.
 *
 * ALUR:
 *   1) User tanam master sekali → simpan ArrayBuffer ke IndexedDB.
 *   2) Saat export:
 *      a) Ambil template dari IndexedDB.
 *      b) Muat dengan ExcelJS (formula, style, merged tetap utuh).
 *      c) Tulis data input user ke sel target (hanya sel input).
 *      d) REWRITE formula duplikat: $C$5:$C$130 → $C$5:$C$125
 *         di semua sheet (sesuai permintaan terbaru).
 *      e) writeBuffer() → Blob → unduh.
 *
 * JAMINAN:
 *   - File master ASLI di disk tidak pernah disentuh.
 *   - Struktur kolom, header, merged cell, validation tetap.
 *   - Hanya sel input (kuning) yang ditulis.
 * ============================================================ */

const SAAS_XLSX = (() => {

  /* ---------- Muat template dari IndexedDB ---------- */
  async function loadTemplate() {
    const t = await SAAS_DB.getTemplate();
    if (!t || !t.arrayBuffer) {
      throw new Error('Template master belum ditanam. Buka tab Sesi dulu.');
    }
    return t.arrayBuffer;
  }

  /* ---------- Muat workbook ExcelJS dari ArrayBuffer ---------- */
  async function loadWorkbook(arrayBuffer) {
    if (typeof ExcelJS === 'undefined') {
      throw new Error('ExcelJS belum ter-load. Periksa index.html.');
    }
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(arrayBuffer);
    return wb;
  }

  /* ---------- Rewrite formula register di seluruh workbook ---------- */
  /**
   * Ubah semua formula yang mengandung `$C$5:$C$130` menjadi `$C$5:$C$125`.
   * Alasan: baris 126–130 di I_RegisterBukti adalah baris ringkasan,
   *         bukan baris data (per revisi dari user/PPK).
   */
  function rewriteRegisterRange(wb) {
    const OLD = SAAS_APP.export.REGISTER_RANGE_OLD;
    const NEW = SAAS_APP.export.REGISTER_RANGE_NEW;
    let count = 0;

    wb.eachSheet((ws) => {
      ws.eachRow({ includeEmpty: false }, (row) => {
        row.eachCell({ includeEmpty: false }, (cell) => {
          const v = cell.value;
          if (v && typeof v === 'object' && typeof v.formula === 'string'
              && v.formula.indexOf(OLD) !== -1) {
            const newFormula = v.formula.split(OLD).join(NEW);
            // ExcelJS: tulis balik dengan formula baru, result = result lama
            cell.value = { formula: newFormula, result: v.result };
            count++;
          }
        });
      });
    });

    console.info('[SAAS-XLSX] Rewrite formula: %d sel diperbarui.', count);
    return count;
  }

  /* ---------- Helper: ubah tanggal ISO/string → Date Excel ---------- */
  function toExcelDate(val) {
    if (!val) return null;
    if (val instanceof Date) return val;
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  }

  /* ---------- Tulis data input user ke sel target ---------- */
  /**
   * @param {Workbook} wb
   * @param {Array}    rows   — daftar record dari DB
   *                            { sheet, rowIndex, data: {key: value} }
   * @param {Object}   map    — SAAS_CELL_MAP
   */
  function applyInputData(wb, rows, map) {
    // Kelompokkan per sheet untuk akses cepat
    const bySheet = {};
    rows.forEach((r) => {
      (bySheet[r.sheet] = bySheet[r.sheet] || []).push(r);
    });

    Object.keys(bySheet).forEach((sheetName) => {
      const ws = wb.getWorksheet(sheetName);
      if (!ws) {
        console.warn('[SAAS-XLSX] Sheet tidak ada:', sheetName);
        return;
      }
      const mapSheet = map[sheetName];
      if (!mapSheet) return;

      bySheet[sheetName].forEach((rec) => {
        const idx = rec.rowIndex;  // nomor baris master (1-based)
        const data = rec.data || {};

        mapSheet.forEach((def) => {
          if (def.cell) {
            // Skema sel tunggal (mis. Identitas!B6)
            if (Object.prototype.hasOwnProperty.call(data, def.key)) {
              writeCell(ws, def.cell, data[def.key], def);
            }
          } else if (def.range && def.cols) {
            // Skema baris berulang (mis. B_BahanBaku rows 6..45)
            if (idx < def.range.from || idx > def.range.to) return;
            def.cols.forEach((c) => {
              const addr = c.col + idx;
              if (Object.prototype.hasOwnProperty.call(data, c.key)) {
                writeCell(ws, addr, data[c.key], c);
              }
            });
          }
        });
      });
    });
  }

  /* ---------- Tulis satu sel (dengan normalisasi tipe) ---------- */
  function writeCell(ws, addr, value, def) {
    const cell = ws.getCell(addr);
    if (value === '' || value === null || value === undefined) {
      cell.value = null;
      return;
    }
    switch (def.type) {
      case 'date':
        cell.value = toExcelDate(value);
        break;
      case 'number':
        cell.value = Number(value);
        break;
      case 'url':
        // Simpan sebagai teks (master pun menyimpan link sebagai teks biasa)
        cell.value = String(value);
        break;
      default:
        cell.value = String(value);
    }
  }

  /* ---------- Export: rakit & unduh ---------- */
  /**
   * @param {string} sessionId
   * @returns {Promise<Blob>}
   */
  async function exportSession(sessionId) {
    SAAS_UI.showBusy('Menyiapkan export…');
    try {
      const template = await loadTemplate();
      const wb = await loadWorkbook(template);
      const rows = await SAAS_DB.rowsBySession(sessionId);

      // Tulis data user
      applyInputData(wb, rows, SAAS_CELL_MAP);

      // Rewrite formula (per permintaan terbaru)
      rewriteRegisterRange(wb);

      // Serialisasi
      SAAS_UI.showBusy('Menulis file XLSX…');
      const buffer = await wb.xlsx.writeBuffer();
      return new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
    } finally {
      SAAS_UI.hideBusy();
    }
  }

  /* ---------- Unduh Blob sebagai file ---------- */
  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      a.remove();
      URL.revokeObjectURL(url);
    }, 800);
  }

  /* ---------- Bangun nama file sesuai master ──────────────── */
  /**
   * Master punya formula di Identitas!B29:
   *   =B6 & "_" & B7 & "_LPDH_" & TEXT(B15,"yyyymmdd")
   * Kita replikasi di sini agar nama file konsisten dengan isi.
   */
  async function buildFileName(sessionId) {
    const rows = await SAAS_DB.rowsBySession(sessionId);
    const ident = rows.find((r) => r.sheet === 'Identitas')?.data || {};
    const id   = ident.id_sppg || 'SPPG';
    const nama = ident.nama_sppg || 'SPPG';
    const tgl  = ident.tgl_layanan
      ? new Date(ident.tgl_layanan)
      : new Date();
    const pad  = (n) => String(n).padStart(2, '0');
    const tglStr = `${tgl.getFullYear()}${pad(tgl.getMonth()+1)}${pad(tgl.getDate())}`;
    return `${id}_${nama}_LPDH_${tglStr}.xlsx`;
  }

  return {
    loadTemplate,
    exportSession,
    downloadBlob,
    buildFileName,
    rewriteRegisterRange,  // diekspos untuk unit test
  };
})();

window.SAAS_XLSX = SAAS_XLSX;