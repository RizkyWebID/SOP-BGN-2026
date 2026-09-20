/* =========================================================================
 * SOP BGN - STORAGE ABSTRACTION LAYER
 * -------------------------------------------------------------------------
 * File    : assets/js/sop-bgn-storage.js
 * Fungsi  : Layer abstraksi penyimpanan. Saat ini memakai localStorage,
 *           tetapi API-nya dibuat agar MUDAH dimigrasi ke IndexedDB,
 *           Firebase, Supabase, atau backend MySQL/PostgreSQL di masa depan.
 *
 * CARA PAKAI (sinkron — sama seperti localStorage):
 *   SopStorage.setSync("db_sop_014", data);
 *   const data = SopStorage.getSync("db_sop_014");
 *   SopStorage.removeSync("db_sop_014");
 *
 * CARA PAKAI (async — disiapkan untuk migrasi backend):
 *   await SopStorage.set("db_sop_014", data);
 *   const data = await SopStorage.get("db_sop_014");
 *
 * MIGRASI KE BACKEND LAIN:
 *   Cukup ubah isi method _backendGet / _backendSet di bawah.
 *   Semua SOP tidak perlu diubah karena hanya memanggil
 *   getDB() / saveDB() dari sop-bgn-shared.js.
 * ========================================================================= */

(function (global) {
  "use strict";

  /* ---------------------------------------------------------------------
   * Nama "namespace" prefix agar tidak bentrok dengan key localStorage
   * milik aplikasi lain di domain yang sama.
   * ------------------------------------------------------------------- */
  const NAMESPACE = "SOP_BGN_2026:";

  /* ---------------------------------------------------------------------
   * BACKEND SINKRON — saat ini memakai localStorage.
   * Jika migrasi ke backend, ganti isi dua method ini.
   * ------------------------------------------------------------------- */
  const backend = {
    get(key) {
      const raw = localStorage.getItem(NAMESPACE + key);
      return raw ? JSON.parse(raw) : null;
    },
    set(key, value) {
      localStorage.setItem(NAMESPACE + key, JSON.stringify(value));
    },
    remove(key) {
      localStorage.removeItem(NAMESPACE + key);
    },
    keys() {
      const out = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(NAMESPACE)) out.push(k.slice(NAMESPACE.length));
      }
      return out;
    },
  };

  /* ---------------------------------------------------------------------
   * API PUBLIK
   * ------------------------------------------------------------------- */
  const SopStorage = {
    /* ---------- API SINKRON (kompatibel dengan kode lama) ---------- */

    /**
     * Ambil objek dari storage.
     * @param {string} key
     * @returns {Object} Objek data, atau {} jika belum ada.
     */
    getSync(key) {
      return backend.get(key) || {};
    },

    /**
     * Simpan objek ke storage.
     * @param {string} key
     * @param {Object} value
     */
    setSync(key, value) {
      backend.set(key, value);
    },

    /**
     * Hapus satu key dari storage.
     * @param {string} key
     */
    removeSync(key) {
      backend.remove(key);
    },

    /**
     * Daftar semua key yang tersimpan di namespace SOP.
     * @returns {string[]}
     */
    listKeysSync() {
      return backend.keys();
    },

    /* ---------- API ASYNC (disiapkan untuk migrasi backend) ---------- */

    /**
     * Ambil objek dari storage (async).
     * @param {string} key
     * @returns {Promise<Object>}
     */
    async get(key) {
      return this.getSync(key);
    },

    /**
     * Simpan objek ke storage (async).
     * @param {string} key
     * @param {Object} value
     * @returns {Promise<void>}
     */
    async set(key, value) {
      this.setSync(key, value);
    },

    /**
     * Hapus satu key (async).
     * @param {string} key
     * @returns {Promise<void>}
     */
    async remove(key) {
      this.removeSync(key);
    },

    /* ---------- UTILITAS ---------- */

    /**
     * Export seluruh data SOP sebagai JSON (untuk backup manual).
     * @returns {string} JSON string.
     */
    exportAll() {
      const dump = {};
      backend.keys().forEach((k) => (dump[k] = backend.get(k)));
      return JSON.stringify(dump, null, 2);
    },

    /**
     * Import data SOP dari JSON hasil export.
     * @param {string} jsonString
     * @returns {number} Jumlah key yang berhasil diimpor.
     */
    importAll(jsonString) {
      const dump = JSON.parse(jsonString);
      let count = 0;
      Object.keys(dump).forEach((k) => {
        backend.set(k, dump[k]);
        count++;
      });
      return count;
    },

    /** Info versi namespace (untuk migrasi skema di masa depan). */
    namespace: NAMESPACE,
  };

  /* Ekspos ke window agar bisa dipanggil dari HTML apa pun. */
  global.SopStorage = SopStorage;
})(window);
