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
 *
 * PERUBAHAN v3 (performance):
 *   Menambahkan _memCache (in-memory cache) untuk menghindari JSON.parse
 *   berulang pada setiap operasi baca. Cache di-invalidate otomatis saat
 *   setSync / removeSync / importAll dipanggil.
 * ========================================================================= */

(function (global) {
  "use strict";

  /* ---------------------------------------------------------------------
   * Nama "namespace" prefix agar tidak bentrok dengan key localStorage
   * milik aplikasi lain di domain yang sama.
   * ------------------------------------------------------------------- */
  const NAMESPACE = "SOP_BGN_2026:";

  /* ---------------------------------------------------------------------
   * MEMORY CACHE — mencegah re-parse JSON berulang.
   * Struktur: { [key]: parsedObject }
   * Gunakan Object.create(null) agar tidak bentrok dengan nama key seperti
   * "constructor" atau "__proto__".
   * ------------------------------------------------------------------- */
  const _memCache = Object.create(null);

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
        // Gunakan indexOf === 0 agar kompatibel browser lama (tanpa startsWith).
        if (k && k.indexOf(NAMESPACE) === 0) {
          out.push(k.slice(NAMESPACE.length));
        }
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
     * Ambil objek dari storage (dengan memory cache).
     * @param {string} key
     * @returns {Object} Objek data, atau {} jika belum ada.
     */
    getSync(key) {
      // Cache HIT → langsung kembalikan tanpa parse ulang.
      if (Object.prototype.hasOwnProperty.call(_memCache, key)) {
        return _memCache[key];
      }
      // Cache MISS → baca dari backend, simpan ke cache untuk read berikutnya.
      const val = backend.get(key) || {};
      _memCache[key] = val;
      return val;
    },

    /**
     * Simpan objek ke storage.
     * Catatan: nilai objek disimpan ke cache DAN ke localStorage.
     * Pemanggil sebaiknya MUTASI objek lewat referensi hasil getSync()
     * lalu panggil setSync() untuk commit — ini sudah pola yang dipakai
     * di seluruh SOP saat ini.
     * @param {string} key
     * @param {Object} value
     */
    setSync(key, value) {
      _memCache[key] = value;
      backend.set(key, value);
    },

    /**
     * Hapus satu key dari storage (dan cache).
     * @param {string} key
     */
    removeSync(key) {
      delete _memCache[key];
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
     * Catatan: baca langsung dari backend agar tidak ada risiko stale cache.
     * @returns {string} JSON string.
     */
    exportAll() {
      const dump = {};
      backend.keys().forEach((k) => (dump[k] = backend.get(k)));
      return JSON.stringify(dump, null, 2);
    },

    /**
     * Import data SOP dari JSON hasil export.
     * Setelah import, cache di-refresh untuk key yang diimpor.
     * @param {string} jsonString
     * @returns {number} Jumlah key yang berhasil diimpor.
     */
    importAll(jsonString) {
      const dump = JSON.parse(jsonString);
      let count = 0;
      Object.keys(dump).forEach((k) => {
        backend.set(k, dump[k]);
        _memCache[k] = dump[k];
        count++;
      });
      return count;
    },

    /**
     * Reset seluruh memory cache.
     * Berguna jika ada proses eksternal yang mengubah localStorage langsung.
     */
    clearCache() {
      Object.keys(_memCache).forEach((k) => delete _memCache[k]);
    },

    /** Info versi namespace (untuk migrasi skema di masa depan). */
    namespace: NAMESPACE,
  };

  /* Ekspos ke window agar bisa dipanggil dari HTML apa pun. */
  global.SopStorage = SopStorage;
})(window);
