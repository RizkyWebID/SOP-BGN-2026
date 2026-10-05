/* ============================================================
 * SAAS — LAPORAN KEUANGAN SPPG LPDH
 * File     : forms/_form-builder.js
 * Fungsi   : Generator form generik dari SAAS_CELL_MAP.
 *            Semua sheet yang polanya "flat" (Identitas,
 *            D_Insentif) bisa pakai ini langsung.
 *            Sheet yang butuh layout khusus (A_PM, B_BahanBaku,
 *            C_Operasional, C1_Relawan, E_Saldo) tetap pakai
 *            builder ini + override opsional.
 * ============================================================ */

const SAAS_FORM_BUILDER = (() => {
  /* Render satu field */
  function renderField(def, value, sessionId, sheet, rowIndex) {
    const id = `f_${sheet}_${rowIndex}_${def.key}`;

    // Label + wrapper
    const wrapper = document.createElement("label");
    wrapper.className = "saas-field";
    wrapper.setAttribute("for", id);

    const label = document.createElement("span");
    label.textContent = def.label + (def.required ? " *" : "");
    wrapper.appendChild(label);

    let input;
    if (def.type === "select") {
      input = document.createElement("select");
      input.className = "saas-select";
      const blank = document.createElement("option");
      blank.value = "";
      blank.textContent = "— pilih —";
      input.appendChild(blank);
      (def.options || []).forEach((o) => {
        const opt = document.createElement("option");
        opt.value = o;
        opt.textContent = o;
        input.appendChild(opt);
      });
      // Ganti blok: input.value = value ?? '';
      // Menjadi:

      if (def.type === "date" && value) {
        // Potong ke YYYY-MM-DD supaya <input type="date"> mengenali
        input.value = String(value).slice(0, 10);
      } else {
        input.value = value ?? "";
      }
    } else {
      input = document.createElement("input");
      input.className = "saas-input saas-input--yellow";
      if (def.type === "number") input.type = "number";
      else if (def.type === "date") input.type = "date";
      else if (def.type === "time") input.type = "time";
      else if (def.type === "url") input.type = "url";
      else input.type = "text";
      if (def.len) {
        input.maxLength = def.len;
        input.setAttribute("inputmode", "numeric");
        input.setAttribute("pattern", "\\d*");
      }
      // Ganti blok: input.value = value ?? '';
      // Menjadi:

      if (def.type === "date" && value) {
        // Potong ke YYYY-MM-DD supaya <input type="date"> mengenali
        input.value = String(value).slice(0, 10);
      } else {
        input.value = value ?? "";
      }
    }

    // Auto-save saat berubah
    const save = async () => {
      const row = (await SAAS_DB.getRow(sessionId, sheet, rowIndex)) || {};
      const data = Object.assign({}, row.data || {});
      data[def.key] = input.value;
      await SAAS_DB.putRow(sessionId, sheet, rowIndex, data);
      await SAAS_DB.touchSession(sessionId);
    };
    input.addEventListener("change", save);
    input.addEventListener("blur", save);

    wrapper.appendChild(input);
    return wrapper;
  }

  /* Render seluruh sheet flat (def.cell saja) */
  function renderFlat(sheet, sessionId, root, opts = {}) {
    const defs = SAAS_CELL_MAP[sheet] || [];
    const rowIndex = opts.rowIndex || 0;

    // Ambil data tersimpan
    return SAAS_DB.getRow(sessionId, sheet, rowIndex).then((rec) => {
      const data = (rec && rec.data) || {};
      const grid = document.createElement("div");
      grid.className = "grid grid-cols-1 md-grid-cols-3 gap-3";
      defs.forEach((def) => {
        if (!def.cell) return;
        grid.appendChild(
          renderField(def, data[def.key], sessionId, sheet, rowIndex),
        );
      });
      root.appendChild(grid);
    });
  }

  return { renderField, renderFlat };
})();

window.SAAS_FORM_BUILDER = SAAS_FORM_BUILDER;
