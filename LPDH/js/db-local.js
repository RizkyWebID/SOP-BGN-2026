/* ============================================================
 * SAAS — LAPORAN KEUANGAN SPPG LPDH
 * File     : db-local.js
 * Fungsi   : Wrapper IndexedDB (offline-first) untuk simpan data
 *            sementara sebelum di-export ke XLSX.
 * Catatan  : TIDAK menyentuh file master XLSX. Hanya DB lokal browser.
 * ============================================================ */

const SAAS_DB = (() => {
  let _dbPromise = null;

  /* Buka / buat database sesuai SAAS_APP.db */
  function open() {
    if (_dbPromise) return _dbPromise;
    _dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(SAAS_APP.db.name, SAAS_APP.db.version);

      // Skema awal — hanya jalan saat versi naik / pertama kali
      req.onupgradeneeded = (e) => {
        const db = e.target.result;

        // Store: sessions — metadata tiap workspace pengguna
        if (!db.objectStoreNames.contains(SAAS_APP.stores.sessions)) {
          const s = db.createObjectStore(SAAS_APP.stores.sessions, { keyPath: 'id' });
          s.createIndex('byUser', 'userName', { unique: false });
          s.createIndex('bySavedAt', 'savedAt', { unique: false });
        }

        // Store: records — baris data keuangan (terkait ke sessionId)
        if (!db.objectStoreNames.contains(SAAS_APP.stores.records)) {
          const r = db.createObjectStore(SAAS_APP.stores.records, { keyPath: 'rowId' });
          r.createIndex('bySession', 'sessionId', { unique: false });
        }

        // Store: master — snapshot STRUKTUR master (read-only, tidak boleh dimodifikasi)
        if (!db.objectStoreNames.contains(SAAS_APP.stores.master)) {
          db.createObjectStore(SAAS_APP.stores.master, { keyPath: 'id' });
        }

        // Store: meta — preferensi umum (sesi aktif, dsb.)
        if (!db.objectStoreNames.contains(SAAS_APP.stores.meta)) {
          db.createObjectStore(SAAS_APP.stores.meta, { keyPath: 'key' });
        }
      };

      req.onsuccess = () => resolve(req.result);
      req.onerror   = () => reject(req.error);
    });
    return _dbPromise;
  }

  /* Helper transaksi generik */
  async function tx(storeName, mode, fn) {
    const db = await open();
    return new Promise((resolve, reject) => {
      const t = db.transaction(storeName, mode);
      const store = t.objectStore(storeName);
      let result;
      try { result = fn(store); } catch (err) { return reject(err); }
      t.oncomplete = () => resolve(result?.result ?? result);
      t.onerror    = () => reject(t.error);
      t.onabort    = () => reject(t.error);
    });
  }

  return {
    /* API umum */
    put:   (store, value) => tx(store, 'readwrite', (s) => s.put(value)),
    get:   (store, key)   => tx(store, 'readonly',  (s) => s.get(key)),
    del:   (store, key)   => tx(store, 'readwrite', (s) => s.delete(key)),
    clear: (store)        => tx(store, 'readwrite', (s) => s.clear()),
    all:   (store)        => tx(store, 'readonly',  (s) => s.getAll()),

    /* Khusus: ambil semua record dalam satu sesi */
    async recordsBySession(sessionId) {
      const db = await open();
      return new Promise((resolve, reject) => {
        const t = db.transaction(SAAS_APP.stores.records, 'readonly');
        const idx = t.objectStore(SAAS_APP.stores.records).index('bySession');
        const req = idx.getAll(IDBKeyRange.only(sessionId));
        req.onsuccess = () => resolve(req.result || []);
        req.onerror   = () => reject(req.error);
      });
    },

    /* Buat sesi baru dengan ID mengikuti namespace SAAS */
    async createSession(userName) {
      const now = new Date();
      const id = SAAS_APP.namespace.buildSessionId(userName, now, now);
      const session = {
        id,
        userName,
        createdAt: now.toISOString(),
        savedAt:   now.toISOString(),
        notes: '',
      };
      await this.put(SAAS_APP.stores.sessions, session);
      return session;
    },

    /* Perbarui waktu simpan terakhir sebuah sesi */
    async touchSession(sessionId) {
      const s = await this.get(SAAS_APP.stores.sessions, sessionId);
      if (!s) return null;
      s.savedAt = new Date().toISOString();
      await this.put(SAAS_APP.stores.sessions, s);
      return s;
    },
  };
})();

window.SAAS_DB = SAAS_DB;