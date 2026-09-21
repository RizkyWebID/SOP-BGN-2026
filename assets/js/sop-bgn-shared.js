/* =========================================================================
 * SOP BGN - SHARED JAVASCRIPT (GLOBAL)
 * -------------------------------------------------------------------------
 * File    : assets/js/sop-bgn-shared.js
 * Fungsi  : Helper utility untuk semua formulir SOP.
 * Versi   : v4 — tambah getSopRecordCount() untuk badge dashboard.
 *
 * PERUBAHAN v4:
 *   - getSopRecordCount(storageKey) : hitung jumlah tanggal tersimpan.
 * PERUBAHAN v3:
 *   - getTodayLocalISO() : fix UTC-vs-lokal.
 *   - escapeHtml/escapeAttr : anti Stored XSS.
 * ========================================================================= */

/* =========================================================================
 * 1. NOTIFIKASI
 * ========================================================================= */

/**
 * Menampilkan notifikasi mengambang di pojok kanan atas.
 * @param {string} msg  - Pesan.
 * @param {string} type - "success" atau "error". Default "success".
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
 * 3. PENYIMPANAN — DELEGASI KE sop-bgn-storage.js
 * ========================================================================= */

/**
 * Ambil seluruh database dari storage.
 * @param {string} key
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
 * Simpan seluruh database ke storage.
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
 * Dipakai oleh dashboard untuk menampilkan badge jumlah data.
 *
 * @param {string} storageKey - Contoh: "db_sop_014"
 * @returns {number} Jumlah tanggal yang memiliki data.
 */
function getSopRecordCount(storageKey) {
  if (typeof SopStorage === "undefined") return 0;
  const db = SopStorage.getSync(storageKey);
  return Object.keys(db).length;
}

/* =========================================================================
 * 4. MODAL (BUKA / TUTUP)
 * ========================================================================= */

/**
 * Membuka modal.
 * @param {string} id - ID elemen modal.
 */
function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add("is-open");
}

/**
 * Menutup modal.
 * @param {string} id - ID elemen modal.
 */
function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove("is-open");
}

/* =========================================================================
 * 5. SIGNATURE PAD
 * ========================================================================= */

/**
 * Mengaktifkan canvas sebagai papan tanda tangan.
 * @param {string} canvasId - ID elemen canvas.
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
 * Format "YYYY-MM-DD" → "Senin, 1 Januari 2025".
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
 * Mendapatkan tanggal HARI INI dalam format "YYYY-MM-DD" berdasarkan
 * waktu LOKAL perangkat (bukan UTC).
 *
 * @returns {string} Contoh: "2026-09-21"
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
 * Escape karakter HTML berbahaya agar aman disisipkan ke innerHTML.
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
