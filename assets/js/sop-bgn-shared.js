/* =========================================================================
 * SOP BGN - SHARED JAVASCRIPT (GLOBAL)
 * -------------------------------------------------------------------------
 * File    : assets/js/sop-bgn-shared.js
 * Fungsi  : Menyimpan seluruh FUNGSI UTILITAS yang dipakai bersama oleh
 *           semua formulir SOP.
 *
 * ATURAN PENTING:
 *   - File ini HANYA berisi helper global.
 *   - JANGAN menaruh logika spesifik per SOP (mis. hitungRataRata untuk
 *     SOP-014) di file ini.
 *   - Logika spesifik per SOP ditulis di tag <script> pada file HTML
 *     SOP yang bersangkutan.
 *
 * Dependensi:
 *   - assets/css/sop-bgn-shared.css (untuk style .sop-modal-bg, #global-notif, dll)
 * ========================================================================= */

/* =========================================================================
 * 1. NOTIFIKASI
 * ========================================================================= */

/**
 * Menampilkan notifikasi mengambang di pojok kanan atas.
 * @param {string} msg  - Pesan yang akan ditampilkan.
 * @param {string} type - "success" (hijau) atau "error" (merah). Default "success".
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

  // Reset timer agar notifikasi baru selalu tampil 3 detik penuh
  clearTimeout(showNotif._timer);
  showNotif._timer = setTimeout(() => el.classList.remove("is-visible"), 3000);
}

/* =========================================================================
 * 2. TAB SWITCHING (Mode User / Mode Admin)
 * ========================================================================= */

/**
 * Berpindah antara Mode User (Input) dan Mode Admin (Cetak).
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

    // Sinkronkan tanggal antar-tab
    const uTanggal = document.getElementById("u_tanggal");
    const aTanggal = document.getElementById("a_tanggal_pilih");
    if (uTanggal && aTanggal) aTanggal.value = uTanggal.value;

    if (typeof loadDataAdmin === "function") loadDataAdmin();
  }
}

/* =========================================================================
 * 3. PENYIMPANAN LOKAL (LocalStorage)
 * ========================================================================= */

/**
 * Mengambil seluruh database dari localStorage.
 * @param {string} key - Kunci localStorage.
 * @returns {Object} Objek database (kosong jika belum ada).
 */
function getDB(key) {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : {};
}

/**
 * Menyimpan seluruh database ke localStorage.
 * @param {string} key     - Kunci localStorage.
 * @param {Object} dataObj - Objek database yang akan disimpan.
 */
function saveDB(key, dataObj) {
  localStorage.setItem(key, JSON.stringify(dataObj));
}

/* =========================================================================
 * 4. MODAL (Buka / Tutup)
 * ========================================================================= */

/**
 * Membuka modal berdasarkan ID element.
 * @param {string} id - ID elemen modal (mis. "modal-ttd").
 */
function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add("is-open");
}

/**
 * Menutup modal berdasarkan ID element.
 * @param {string} id - ID elemen modal.
 */
function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove("is-open");
}

/* =========================================================================
 * 5. SIGNATURE PAD (Tanda Tangan Digital)
 * ========================================================================= */

/**
 * Mengaktifkan canvas sebagai papan tanda tangan (mouse + touch).
 * @param {string} canvasId - ID elemen canvas.
 */
function setupSignaturePad(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  let isDrawing = false;

  // Konfigurasi kuas
  ctx.strokeStyle = "#000033";
  ctx.lineWidth = 2.5;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  /** Ambil posisi kursor/jari relatif terhadap canvas (dengan skala). */
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
 * Menghapus seluruh coretan pada canvas tanda tangan.
 * @param {string} canvasId - ID elemen canvas.
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
 * Mengubah format tanggal "YYYY-MM-DD" menjadi "Senin, 1 Januari 2025".
 * @param {string} isoDate - Tanggal dalam format "YYYY-MM-DD".
 * @returns {string} Tanggal terformat lokal Indonesia.
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
