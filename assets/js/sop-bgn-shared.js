/* =========================================================================
 * SOP BGN - SHARED JAVASCRIPT (GLOBAL)
 * -------------------------------------------------------------------------
 * File    : assets/js/sop-bgn-shared.js
 * Fungsi  : Kumpulan helper GLOBAL yang dipakai bersama oleh index.html
 *           (dashboard) dan 8 formulir SOP (via sop-bgn-form-core.js).
 *
 * PRINSIP:
 *   - HANYA berisi helper umum yang tidak bergantung pada state form
 *     spesifik.
 *   - Helper cell builder (cellStd, cellSuhu, dst.) TIDAK mengenal kolom
 *     SOP manapun. Murni menghasilkan HTML <td> dual-element:
 *     div (untuk cetak) + input/textarea (untuk edit di layar).
 *   - Logika spesifik per SOP tetap di file HTML masing-masing.
 *
 * DEPENDENSI: tidak ada (murni utility, tanpa panggilan eksternal).
 *
 * ISI FILE:
 *   1. Notifikasi      → showNotif
 *   2. Tab switching   → switchTab
 *   3. Penyimpanan     → getDB, saveDB, getSopRecordCount, getSopRecordStats
 *   4. Modal           → openModal, closeModal
 *   5. Signature pad   → setupSignaturePad, clearSig
 *   6. Utilitas tanggal → formatTanggalID, getTodayLocalISO
 *   7. Keamanan        → escapeHtml, escapeAttr
 *   8. Cell builder    → cellStd, cellTextarea, cellSuhu, cellCustom,
 *                        cellRupiah
 *   9. Format nilai    → stripSuhuDerajat, displaySuhu
 *  10. Sanitizer input → onInputHargaUser, onInputHargaAdmin, onInputKontak
 * ========================================================================= */

/* =========================================================================
 * 1. NOTIFIKASI
 * ========================================================================= */

/**
 * Menampilkan notifikasi mengambang di pojok kanan atas.
 * @param {string} msg  - Pesan yang ditampilkan.
 * @param {string} type - "success" (default) atau "error".
 */
function showNotif(msg, type = "success") {
  const el = document.getElementById("global-notif");
  if (!el) return;
  el.textContent = msg;
  el.classList.remove("is-success", "is-error");
  el.classList.add(
    "is-visible",
    type === "success" ? "is-success" : "is-error",
  );
  clearTimeout(showNotif._timer);
  showNotif._timer = setTimeout(() => el.classList.remove("is-visible"), 3000);
}

/* =========================================================================
 * 2. TAB SWITCHING
 * ========================================================================= */

/**
 * Berpindah antara Mode User dan Mode Admin.
 * @param {string} tab - "user" atau "admin".
 */
function switchTab(tab) {
  const vUser = document.getElementById("user-view");
  const vAdmin = document.getElementById("admin-view");
  const btnUser = document.getElementById("btn-tab-user");
  const btnAdmin = document.getElementById("btn-tab-admin");
  if (!vUser || !vAdmin) return;

  if (tab === "user") {
    vUser.classList.replace("hidden", "block");
    vAdmin.classList.replace("block", "hidden");
    btnUser.classList.replace("border-transparent", "border-indigo-500");
    btnUser.classList.add("bg-indigo-700");
    btnAdmin.classList.remove("bg-indigo-700", "border-indigo-500");
    if (typeof loadDataForDate === "function") loadDataForDate();
  } else {
    vUser.classList.replace("block", "hidden");
    vAdmin.classList.replace("hidden", "block");
    btnAdmin.classList.replace("border-transparent", "border-indigo-500");
    btnAdmin.classList.add("bg-indigo-700");
    btnUser.classList.remove("bg-indigo-700", "border-indigo-500");

    const uTanggal = document.getElementById("u_tanggal");
    const aTanggal = document.getElementById("a_tanggal_pilih");
    if (uTanggal && aTanggal) aTanggal.value = uTanggal.value;

    if (typeof loadDataAdmin === "function") loadDataAdmin();
  }
}

/* =========================================================================
 * 3. PENYIMPANAN — WRAPPER KE sop-bgn-storage.js
 * ========================================================================= */

/**
 * Ambil seluruh database 1 SOP dari storage.
 * @param {string} key - Contoh "db_sop_014".
 * @returns {Object}
 */
function getDB(key) {
  if (typeof SopStorage !== "undefined") {
    return SopStorage.getSync(key);
  }
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : {};
}

/**
 * Simpan seluruh database 1 SOP ke storage.
 * @param {string} key
 * @param {Object} dataObj
 */
function saveDB(key, dataObj) {
  if (typeof SopStorage !== "undefined") {
    SopStorage.setSync(key, dataObj);
    return;
  }
  localStorage.setItem(key, JSON.stringify(dataObj));
}

/**
 * Hitung jumlah tanggal (record harian) yang tersimpan untuk 1 SOP.
 * @param {string} storageKey - Contoh "db_sop_014".
 * @returns {number}
 */
function getSopRecordCount(storageKey) {
  if (typeof SopStorage === "undefined") return 0;
  const db = SopStorage.getSync(storageKey);
  return Object.keys(db).length;
}

/**
 * Hitung statistik DRAFT vs SAVED untuk 1 SOP (dipakai badge dashboard).
 *   - DRAFT : record dengan status === "draft"
 *   - SAVED : record dengan status "final" ATAU "verified"
 *
 * @param {string} storageKey - Contoh "db_sop_014".
 * @returns {{draft:number, saved:number, total:number}}
 */
function getSopRecordStats(storageKey) {
  if (typeof SopStorage === "undefined") {
    return { draft: 0, saved: 0, total: 0 };
  }
  const db = SopStorage.getSync(storageKey);
  let draft = 0;
  let saved = 0;
  for (const dateKey in db) {
    const rec = db[dateKey];
    if (!rec || typeof rec !== "object") continue;
    if (rec.status === "draft") draft++;
    else if (rec.status === "final" || rec.status === "verified") saved++;
  }
  return { draft, saved, total: draft + saved };
}

/* =========================================================================
 * 4. MODAL
 * ========================================================================= */

/**
 * Membuka modal by ID.
 * @param {string} id
 */
function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add("is-open");
}

/**
 * Menutup modal by ID.
 * @param {string} id
 */
function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove("is-open");
}

/* =========================================================================
 * 5. SIGNATURE PAD
 * ========================================================================= */

/**
 * Mengaktifkan canvas sebagai papan tanda tangan (mouse + touch).
 * @param {string} canvasId
 */
function setupSignaturePad(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  let isDrawing = false;

  ctx.strokeStyle = "#000033";
  ctx.lineWidth = 2.5;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    let cx = e.clientX,
      cy = e.clientY;
    if (e.touches && e.touches.length > 0) {
      cx = e.touches[0].clientX;
      cy = e.touches[0].clientY;
    }
    return { x: (cx - rect.left) * scaleX, y: (cy - rect.top) * scaleY };
  }

  const start = (e) => {
    e.preventDefault();
    isDrawing = true;
    const p = getPos(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  };
  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const p = getPos(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  };
  const stop = (e) => {
    e.preventDefault();
    isDrawing = false;
  };

  canvas.addEventListener("mousedown", start);
  canvas.addEventListener("mousemove", draw);
  canvas.addEventListener("mouseup", stop);
  canvas.addEventListener("mouseout", stop);
  canvas.addEventListener("touchstart", start, { passive: false });
  canvas.addEventListener("touchmove", draw, { passive: false });
  canvas.addEventListener("touchend", stop);
}

/**
 * Menghapus coretan pada canvas tanda tangan.
 * @param {string} canvasId
 */
function clearSig(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
}

/* =========================================================================
 * 6. UTILITAS TANGGAL
 * ========================================================================= */

/**
 * Format "YYYY-MM-DD" → "Senin, 1 Januari 2025" (Bahasa Indonesia).
 * @param {string} isoDate
 * @returns {string}
 */
function formatTanggalID(isoDate) {
  if (!isoDate) return "";
  const [y, m, d] = isoDate.split("-");
  return new Date(y, m - 1, d).toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Tanggal HARI INI dalam format "YYYY-MM-DD" berdasarkan WAKTU LOKAL
 * (bukan UTC). Penting agar di WIB/WITA/WIT tanggal tidak mundur 1 hari
 * saat dibuka pagi.
 * @returns {string}
 */
function getTodayLocalISO() {
  const d = new Date();
  const pad = function (n) {
    return n < 10 ? "0" + n : String(n);
  };
  return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
}

/* =========================================================================
 * 7. KEAMANAN — ANTI XSS
 * ========================================================================= */

/**
 * Escape karakter HTML berbahaya. WAJIB dipakai sebelum menyisipkan data
 * user ke innerHTML / template literal.
 * @param {*} str
 * @returns {string}
 */
function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Escape untuk atribut HTML (value="...").
 * @param {*} str
 * @returns {string}
 */
function escapeAttr(str) {
  return escapeHtml(str);
}

/* =========================================================================
 * 8. CELL BUILDER — DUAL-ELEMENT (DIV CETAK + INPUT EDIT)
 * -------------------------------------------------------------------------
 * Setiap cell terdiri dari:
 *   - <div class="hidden print:block">  → yang tampil saat cetak/PDF
 *   - <input> / <textarea>              → yang tampil & edit di layar
 *
 * Keduanya punya konten yang sama. Saat user edit input, JS oninput
 * mensinkronkan nilainya ke div cetak.
 * ========================================================================= */

/**
 * Cell standar (input text). Class `cls` diterapkan ke div + input.
 * @param {string} id         - ID unik input (mis. "a_nama_0").
 * @param {*}      val        - Nilai data.
 * @param {string} [cls]      - Tailwind class, default "text-center".
 * @returns {string} HTML <td>.
 */
function cellStd(id, val, cls) {
  cls = cls || "text-center";
  return (
    '<td class="border border-black p-0 relative">' +
    '<div class="hidden print:block w-full ' +
    cls +
    ' whitespace-normal break-words">' +
    escapeHtml(val) +
    "</div>" +
    '<input type="text" id="' +
    id +
    '" value="' +
    escapeAttr(val) +
    '" ' +
    'oninput="this.previousElementSibling.innerText = this.value" ' +
    'class="w-full ' +
    cls +
    ' bg-transparent print:hidden">' +
    "</td>"
  );
}

/**
 * Cell khusus narasi panjang (textarea multi-baris).
 * Dipakai untuk kolom seperti "Aspek yang Diperiksa" atau "Keterangan".
 * @param {string} id
 * @param {*}      val
 * @param {string} [cls]
 * @returns {string}
 */
function cellTextarea(id, val, cls) {
  cls = cls || "text-left";
  return (
    '<td class="border border-black p-0 relative">' +
    '<div class="hidden print:block w-full ' +
    cls +
    ' whitespace-pre-wrap break-words px-2">' +
    escapeHtml(val) +
    "</div>" +
    '<textarea id="' +
    id +
    '" oninput="this.previousElementSibling.innerText = this.value" ' +
    'class="w-full ' +
    cls +
    ' bg-transparent px-2 print:hidden resize-none overflow-hidden h-full" ' +
    'rows="2">' +
    escapeHtml(val) +
    "</textarea>" +
    "</td>"
  );
}

/**
 * Cell khusus nilai suhu (°C).
 *   - Data tersimpan: angka polos (mis. "36.5")
 *   - Display       : "36.5°C" (otomatis tambah °C sekali)
 *   - Anti-bug      : walau data lama masih "36.5°C", tetap bersih.
 * @param {string} id
 * @param {*}      rawVal
 * @returns {string}
 */
function cellSuhu(id, rawVal) {
  var raw = stripSuhuDerajat(rawVal);
  var disp = raw ? raw + "°C" : "";
  var oninputJs =
    "this.previousElementSibling.innerText = this.value ? this.value + '\\u00B0C' : ''";
  return (
    '<td class="border border-black p-0 relative">' +
    '<div class="hidden print:block w-full text-center whitespace-normal break-words">' +
    escapeHtml(disp) +
    "</div>" +
    '<input type="text" id="' +
    id +
    '" value="' +
    escapeAttr(raw) +
    '" ' +
    'oninput="' +
    oninputJs +
    '" ' +
    'class="w-full text-center bg-transparent print:hidden">' +
    "</td>"
  );
}

/**
 * Cell dengan handler oninput custom (mis. untuk sanitasi harga/kontak).
 * @param {string} id
 * @param {*}      val
 * @param {string} [cls]
 * @param {string} [oninputExpr] - Ekspresi JS string, default sinkron div.
 * @returns {string}
 */
function cellCustom(id, val, cls, oninputExpr) {
  cls = cls || "text-center";
  var handler =
    oninputExpr || "this.previousElementSibling.innerText = this.value";
  return (
    '<td class="border border-black p-0 relative">' +
    '<div class="hidden print:block w-full ' +
    cls +
    ' whitespace-normal break-words">' +
    escapeHtml(val) +
    "</div>" +
    '<input type="text" id="' +
    id +
    '" value="' +
    escapeAttr(val) +
    '" ' +
    'oninput="' +
    handler +
    '" ' +
    'class="w-full ' +
    cls +
    ' bg-transparent print:hidden">' +
    "</td>"
  );
}

/**
 * Cell khusus Rupiah (khusus SOP-017).
 *   - Div cetak  : "15.000"  (thousand separator)
 *   - Input edit : "15000"   (raw angka, untuk kalkulasi)
 *   - Oninput    : format div + strip non-digit dari input
 * @param {string} id
 * @param {*}      rawVal
 * @returns {string}
 */
function cellRupiah(id, rawVal) {
  var raw = String(rawVal || "").replace(/\D/g, "");
  var disp = raw ? new Intl.NumberFormat("id-ID").format(raw) : "";
  return (
    '<td class="border border-black p-0 relative">' +
    '<div class="hidden print:block w-full text-center whitespace-normal break-words">' +
    escapeHtml(disp) +
    "</div>" +
    '<input type="text" id="' +
    id +
    '" value="' +
    escapeAttr(raw) +
    '" ' +
    'oninput="onInputHargaAdmin(this)" ' +
    'inputmode="numeric" maxlength="15" ' +
    'class="w-full text-center bg-transparent print:hidden">' +
    "</td>"
  );
}

/* =========================================================================
 * 9. FORMAT NILAI
 * ========================================================================= */

/**
 * Bersihkan suffix °C dari nilai suhu agar tidak menumpuk (double °C).
 * Contoh: "36.5°C" → "36.5", "36.5" → "36.5".
 * @param {*} val
 * @returns {string}
 */
function stripSuhuDerajat(val) {
  if (val === null || val === undefined) return "";
  return String(val)
    .replace(/[°\u00B0]C?/g, "")
    .trim();
}

/**
 * Tampilkan nilai suhu dengan suffix °C (sekali saja).
 * @param {*} val
 * @returns {string}
 */
function displaySuhu(val) {
  var raw = stripSuhuDerajat(val);
  return raw ? raw + "°C" : "";
}

/* =========================================================================
 * 10. SANITIZER INPUT
 * -------------------------------------------------------------------------
 * Dipakai sebagai handler `oninput` di form. Memastikan nilai yang masuk
 * sesuai format yang diharapkan, mencegah karakter aneh dari paste.
 * ========================================================================= */

/**
 * Harga (user form): hanya digit 0-9.
 * @param {HTMLInputElement} el
 */
function onInputHargaUser(el) {
  var clean = String(el.value || "").replace(/\D/g, "");
  if (el.value !== clean) el.value = clean;
}

/**
 * Harga (admin view): hanya digit 0-9 + auto-format ribuan di div cetak.
 * @param {HTMLInputElement} el
 */
function onInputHargaAdmin(el) {
  var clean = String(el.value || "").replace(/\D/g, "");
  if (el.value !== clean) el.value = clean;
  var prev = el.previousElementSibling;
  if (prev) {
    prev.innerText = clean ? new Intl.NumberFormat("id-ID").format(clean) : "";
  }
}

/**
 * Kontak / No. HP: hanya digit, "+", "-", dan spasi.
 * Contoh valid: "0812-3456-7890" atau "+62 812 3456 7890".
 * @param {HTMLInputElement} el
 */
function onInputKontak(el) {
  var clean = String(el.value || "").replace(/[^0-9+\-\s]/g, "");
  if (el.value !== clean) el.value = clean;
}
