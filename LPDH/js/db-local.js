/* ============================================================
 * SAAS — LAPORAN KEUANGAN SPPG LPDH
 * File     : db-local.js
 * Fungsi   : Wrapper IndexedDB (offline-first).
 * ============================================================ */

const SAAS_DB = (() => {
  let _dbPromise = null;

  function open() {
    if (_dbPromise) return _dbPromise;
    _dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(SAAS_APP.db.name, SAAS_APP.db.version);

      req.onblocked = () => {
        reject(new Error('Database sedang dipakai tab lain. Tutup semua tab lalu refresh.'));
      };

      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        const stores = SAAS_APP.stores;

        if (!db.objectStoreNames.contains(stores.sessions)) {
          const s = db.createObjectStore(stores.sessions, { keyPath: 'id' });
          s.createIndex('byUser', 'userName');
          s.createIndex('bySavedAt', 'savedAt');
        }
        if (!db.objectStoreNames.contains(stores.records)) {
          const r = db.createObjectStore(stores.records, { keyPath: 'rowId' });
          r.createIndex('bySession', 'sessionId');
          r.createIndex('bySheet', ['sessionId', 'sheet']);
        }
        if (!db.objectStoreNames.contains(stores.template)) {
          db.createObjectStore(stores.template, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(stores.meta)) {
          db.createObjectStore(stores.meta, { keyPath: 'key' });
        }
        console.info('[SAAS-DB] Skema IndexedDB versi', SAAS_APP.db.version, 'siap.');
      };

      req.onsuccess = () => resolve(req.result);
      req.onerror   = () => reject(req.error);
    });
    return _dbPromise;
  }

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
    put:   (store, value) => tx(store, 'readwrite', (s) => s.put(value)),
    get:   (store, key)   => tx(store, 'readonly',  (s) => s.get(key)),
    del:   (store, key)   => tx(store, 'readwrite', (s) => s.delete(key)),
    clear: (store)        => tx(store, 'readwrite', (s) => s.clear()),
    all:   (store)        => tx(store, 'readonly',  (s) => s.getAll()),

    async resetDatabase() {
      const db = await open();
      db.close();
      _dbPromise = null;
      return new Promise((resolve, reject) => {
        const req = indexedDB.deleteDatabase(SAAS_APP.db.name);
        req.onsuccess = () => resolve(true);
        req.onerror   = () => reject(req.error);
        req.onblocked = () => reject(new Error('Tutup tab lain lalu refresh.'));
      });
    },

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
        const idx = t.objectStore(SAAS_APP.stores.records).index('bySheet');
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

    async saveTemplate(arrayBuffer, fileName) {
      return this.put(SAAS_APP.stores.template, {
        id: 'master',
        fileName,
        arrayBuffer,
        savedAt: new Date().toISOString(),
      });
    },
    async getTemplate() {
      return this.get(SAAS_APP.stores.template, 'master');
    },
    async hasTemplate() {
      return !!(await this.getTemplate());
    },

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