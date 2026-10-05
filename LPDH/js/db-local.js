/* ============================================================
 * SAAS — LAPORAN KEUANGAN SPPG LPDH
 * File     : db-local.js
 * Fungsi   : Wrapper IndexedDB (offline-first).
 *            Menyimpan sesi, baris data input, dan blob
 *            template XLSX master (read-only).
 * Catatan  : TIDAK menyentuh file master XLSX di disk.
 *            File master hanya disimpan sebagai salinan blob
 *            agar struktur & formula terjaga saat export.
 * ============================================================ */

const SAAS_DB = (() => {
  let _dbPromise = null;

  /* Buka database, buat store jika belum ada */
  function open() {
    if (_dbPromise) return _dbPromise;
    _dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(SAAS_APP.db.name, SAAS_APP.db.version);

      req.onupgradeneeded = (e) => {
        const db = e.target.result;

        // sessions: metadata tiap workspace user
        if (!db.objectStoreNames.contains(SAAS_APP.stores.sessions)) {
          const s = db.createObjectStore(SAAS_APP.stores.sessions, { keyPath: 'id' });
          s.createIndex('byUser', 'userName');
          s.createIndex('bySavedAt', 'savedAt');
        }

        // records: satu baris data input (per sheet per sesi)
        // keyPath = rowId = `${sessionId}::${sheet}::${rowIndex}`
        if (!db.objectStoreNames.contains(SAAS_APP.stores.records)) {
          const r = db.createObjectStore(SAAS_APP.stores.records, { keyPath: 'rowId' });
          r.createIndex('bySession', 'sessionId');
          r.createIndex('bySheet', ['sessionId', 'sheet']);
        }

        // template: salinan blob master (satu entri, id = 'master')
        if (!db.objectStoreNames.contains(SAAS_APP.stores.template)) {
          db.createObjectStore(SAAS_APP.stores.template, { keyPath: 'id' });
        }

        // meta: preferensi umum (sesi aktif, versi template, dll)
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
    /* ---------- API umum ---------- */
    put:   (store, value) => tx(store, 'readwrite', (s) => s.put(value)),
    get:   (store, key)   => tx(store, 'readonly',  (s) => s.get(key)),
    del:   (store, key)   => tx(store, 'readwrite', (s) => s.delete(key)),
    clear: (store)        => tx(store, 'readwrite', (s) => s.clear()),
    all:   (store)        => tx(store, 'readonly',  (s) => s.getAll()),

    /* ---------- Sesi ---------- */
    async createSession(userName) {
      const now = new Date();
      const id = SAAS_APP.namespace.buildSessionId(userName, now, now);
      const session = {
        id, userName,
        createdAt: now.toISOString(),
        savedAt:   now.toISOString(),
        notes:     '',
      };
      await this.put(SAAS_APP.stores.sessions, session);
      return session;
    },

    async touchSession(sessionId) {
      const s = await this.get(SAAS_APP.stores.sessions, sessionId);
      if (!s) return null;
      s.savedAt = new Date().toISOString();
      await this.put(SAAS_APP.stores.sessions, s);
      return s;
    },

    /* ---------- Records (baris data) ---------- */
    // rowId = `${sessionId}::${sheet}::${rowIndex}`
    rowId(sessionId, sheet, rowIndex) {
      return `${sessionId}::${sheet}::${rowIndex}`;
    },

    async putRow(sessionId, sheet, rowIndex, data) {
      const rowId = this.rowId(sessionId, sheet, rowIndex);
      return this.put(SAAS_APP.stores.records, {
        rowId, sessionId, sheet, rowIndex, data,
        updatedAt: new Date().toISOString(),
      });
    },

    async getRow(sessionId, sheet, rowIndex) {
      return this.get(SAAS_APP.stores.records, this.rowId(sessionId, sheet, rowIndex));
    },

    async deleteRow(sessionId, sheet, rowIndex) {
      return this.del(SAAS_APP.stores.records, this.rowId(sessionId, sheet, rowIndex));
    },

    async rowsBySheet(sessionId, sheet) {
      const db = await open();
      return new Promise((resolve, reject) => {
        const t = db.transaction(SAAS_APP.stores.records, 'readonly');
        const idx = t.objectStore(SAAS_APP.stores.records)
          .index('bySheet');
        const req = idx.getAll(IDBKeyRange.only([sessionId, sheet]));
        req.onsuccess = () => resolve(req.result || []);
        req.onerror   = () => reject(req.error);
      });
    },

    async rowsBySession(sessionId) {
      const db = await open();
      return new Promise((resolve, reject) => {
        const t = db.transaction(SAAS_APP.stores.records, 'readonly');
        const idx = t.objectStore(SAAS_APP.stores.records).index('bySession');
        const req = idx.getAll(IDBKeyRange.only(sessionId));
        req.onsuccess = () => resolve(req.result || []);
        req.onerror   = () => reject(req.error);
      });
    },

    /* ---------- Template master ---------- */
    async saveTemplate(arrayBuffer, fileName) {
      return this.put(SAAS_APP.stores.template, {
        id: 'master',
        fileName,
        arrayBuffer,   // Uint8Array / ArrayBuffer
        savedAt: new Date().toISOString(),
      });
    },
    async getTemplate() {
      return this.get(SAAS_APP.stores.template, 'master');
    },
    async hasTemplate() {
      return !!(await this.getTemplate());
    },

    /* ---------- Meta ---------- */
    async setMeta(key, value) {
      return this.put(SAAS_APP.stores.meta, { key, value });
    },
    async getMeta(key) {
      const r = await this.get(SAAS_APP.stores.meta, key);
      return r ? r.value : null;
    },
  };
})();

window.SAAS_DB = SAAS_DB;