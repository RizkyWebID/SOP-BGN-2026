/* =========================================================================
 * SOP BGN - FORM CORE
 * -------------------------------------------------------------------------
 * File    : assets/js/sop-bgn-form-core.js
 * Fungsi  : Menyediakan logika generik untuk seluruh 8 formulir SOP,
 *           sehingga setiap file SOP hanya perlu mendeklarasikan:
 *             - Konfigurasi (storageKey, minRows, dsb.)
 *             - Cara render 1 baris (HTML-nya)
 *             - Cara collect data dari form / admin
 *
 * Setelah `SopForm.setup({...})` dipanggil, semua handler berikut otomatis
 * tersedia sebagai fungsi global dan siap dipakai di HTML:
 *
 *   loadDataForDate()        - Refresh view user dari storage
 *   loadDataAdmin()          - Refresh view admin dari storage
 *   tambahBaris(e)           - Tambah 1 baris dari form (form submit)
 *   hapusBaris(i)            - Hapus baris ke-i
 *   simpanDraftGlobal()      - Simpan sebagai draft
 *   bukaModalTtdUser()       - Buka modal tanda tangan user
 *   simpanFinalLaporan()     - Simpan final + TTD user
 *   bukaModalTtdAdmin()      - Buka modal verifikasi admin
 *   simpanVerifikasiAdmin()  - Simpan verified + TTD admin
 *
 * DEPENDENSI:
 *   - sop-bgn-storage.js   (getDB, saveDB, SopStorage)
 *   - sop-bgn-shared.js    (escapeHtml, escapeAttr, formatTanggalID,
 *                           getTodayLocalISO, showNotif, openModal,
 *                           closeModal, setupSignaturePad)
 *
 * URUTAN LOAD (WAJIB):
 *   1. sop-bgn-storage.js
 *   2. sop-bgn-shared.js
 *   3. sop-bgn-form-core.js
 *   4. <script> per SOP (memanggil SopForm.setup)
 * ========================================================================= */

(function (global) {
  "use strict";

  /* ---------------------------------------------------------------------
   * DEFAULT RECORD — struktur 1 tanggal (dipakai semua SOP).
   * ------------------------------------------------------------------- */
  function defaultRecord() {
    return {
      shift: "",
      menu: "",
      porsi: "",
      status: "draft",
      rows: [],
      ttd_user: null,
      ttd_admin: null,
      nama_petugas: "",
      nama_pengawas: "",
      nama_kepala: "",
    };
  }

  const SopForm = {
    /* ---------- Config default (di-override via setup) ---------- */
    config: {
      storageKey: null,
      minRows: 10,
      defaultKepala: "Rizky Arinanda. AR, S.Kom",
      recordInit: defaultRecord,
      emptyAdminRow: null,
      emptyUserColspan: 99,
      emptyUserMessage: "Belum ada data yang tercatat pada tanggal ini.",

      /* Renderer (WAJIB) */
      renderUserRow: null,
      renderAdminRow: null,
      renderUserTableOverride: null,
      renderAdminTableOverride: null,

      /* Collector (WAJIB) */
      collectFromForm: null,
      collectFromAdmin: null,

      /* Hook opsional (dipanggil setelah form.reset()) */
      afterTambahBaris: null,
    },

    /* ---------- State runtime ---------- */
    currentDate: null,
    currentRows: [],

    /* =====================================================================
     * SETUP — dipanggil 1× per SOP
     * ===================================================================== */
    setup: function (userConfig) {
      if (!userConfig || !userConfig.storageKey) {
        console.error("[SopForm] config.storageKey wajib diisi.");
        return;
      }
      this.config = Object.assign({}, this.config, userConfig);
      this.currentDate = getTodayLocalISO();
      this._exposeGlobals();

      var self = this;
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", function () {
          self._initPage();
        });
      } else {
        this._initPage();
      }
    },

    /* =====================================================================
     * AUTO-EXPOSE HANDLER GLOBAL
     * HTML cukup memanggil nama generik: tambahBaris, hapusBaris, dst.
     * Alias backward-compat tetap disediakan agar template lama tetap jalan.
     * ===================================================================== */
    _exposeGlobals: function () {
      var self = this;
      var handlers = {
        loadDataForDate: function () {
          self.loadDataForDate();
        },
        loadDataAdmin: function () {
          self.loadDataAdmin();
        },
        simpanDraftGlobal: function () {
          self.simpanDraftGlobal();
        },
        bukaModalTtdUser: function () {
          self.bukaModalTtdUser();
        },
        simpanFinalLaporan: function () {
          self.simpanFinalLaporan();
        },
        bukaModalTtdAdmin: function () {
          self.bukaModalTtdAdmin();
        },
        simpanVerifikasiAdmin: function () {
          self.simpanVerifikasiAdmin();
        },
        /* Handler utama (nama standar) */
        tambahBaris: function (e) {
          self.tambahBaris(e);
        },
        hapusBaris: function (i) {
          self.hapusBaris(i);
        },
        /* Alias backward-compat */
        tambahBarisProses: function (e) {
          self.tambahBaris(e);
        },
        tambahBarisGramasi: function (e) {
          self.tambahBaris(e);
        },
        tambahBarisTemuan: function (e) {
          self.tambahBaris(e);
        },
        hapusBarisProses: function (i) {
          self.hapusBaris(i);
        },
        hapusBarisTemuan: function (i) {
          self.hapusBaris(i);
        },
      };
      Object.keys(handlers).forEach(function (name) {
        global[name] = handlers[name];
      });
    },

    /* =====================================================================
     * INIT PAGE
     * ===================================================================== */
    _initPage: function () {
      var uTgl = document.getElementById("u_tanggal");
      var aTgl = document.getElementById("a_tanggal_pilih");
      if (uTgl) uTgl.value = this.currentDate;
      if (aTgl) aTgl.value = this.currentDate;

      if (typeof setupSignaturePad === "function") {
        setupSignaturePad("sig-user");
        setupSignaturePad("sig-admin");
      }
      this.loadDataForDate();
    },

    /* =====================================================================
     * DATA — Ambil / init record 1 tanggal
     * ===================================================================== */
    getTodayData: function (date) {
      var db = getDB(this.config.storageKey);
      if (!db[date]) {
        db[date] = this.config.recordInit();
        if (!("nama_petugas" in db[date])) db[date].nama_petugas = "";
        if (!("nama_pengawas" in db[date])) db[date].nama_pengawas = "";
        if (!("nama_kepala" in db[date])) db[date].nama_kepala = "";
      }
      return db[date];
    },

    /* =====================================================================
     * LOAD DATA — MODE USER
     * ===================================================================== */
    loadDataForDate: function () {
      var tgl = document.getElementById("u_tanggal");
      if (!tgl) return;
      this.currentDate = tgl.value;
      var data = this.getTodayData(this.currentDate);

      var map = { u_shift: data.shift, u_menu: data.menu, u_porsi: data.porsi };
      Object.keys(map).forEach(function (id) {
        var el = document.getElementById(id);
        if (el) el.value = map[id] || "";
      });

      this.currentRows = data.rows || [];
      this.renderUserTable();
      this.checkFormLockStatus(data);
    },

    /* =====================================================================
     * RENDER TABEL USER
     * ===================================================================== */
    renderUserTable: function () {
      if (typeof this.config.renderUserTableOverride === "function") {
        this.config.renderUserTableOverride(this);
        return;
      }
      var tbody = document.getElementById("u_table_body");
      if (!tbody) return;
      tbody.innerHTML = "";

      var data = this.getTodayData(this.currentDate);
      var locked = data.status === "final" || data.status === "verified";

      if (this.currentRows.length === 0) {
        var span = this.config.emptyUserColspan;
        tbody.innerHTML =
          '<tr><td colspan="' +
          span +
          '" class="p-4 text-center text-gray-400 italic">' +
          escapeHtml(this.config.emptyUserMessage) +
          "</td></tr>";
        return;
      }

      var self = this;
      this.currentRows.forEach(function (r, idx) {
        var html = self.config.renderUserRow(r, idx, locked);
        if (html) tbody.insertAdjacentHTML("beforeend", html);
      });
    },

    /* =====================================================================
     * TAMBAH BARIS
     * ===================================================================== */
    tambahBaris: function (e) {
      if (e && typeof e.preventDefault === "function") e.preventDefault();
      var data = this.getTodayData(this.currentDate);
      if (data.status === "final" || data.status === "verified") {
        return showNotif("Laporan sudah terkunci!", "error");
      }
      if (typeof this.config.collectFromForm !== "function") {
        console.warn("[SopForm] config.collectFromForm belum di-set.");
        return;
      }

      var newRow = this.config.collectFromForm();
      if (!newRow) return;
      this.currentRows.push(newRow);
      this.renderUserTable();

      var form = document.getElementById("form-input-baris");
      if (form) form.reset();

      if (typeof this.config.afterTambahBaris === "function") {
        this.config.afterTambahBaris();
      }
      showNotif("Data berhasil ditambahkan.");
    },

    /* =====================================================================
     * HAPUS BARIS
     * ===================================================================== */
    hapusBaris: function (idx) {
      var data = this.getTodayData(this.currentDate);
      if (data.status === "final" || data.status === "verified") {
        return showNotif("Laporan sudah terkunci!", "error");
      }
      this.currentRows.splice(idx, 1);
      this.renderUserTable();
      showNotif("Baris berhasil dihapus.", "error");
    },

    /* =====================================================================
     * CEK STATUS KUNCI FORM
     * ===================================================================== */
    checkFormLockStatus: function (data) {
      var banner = document.getElementById("status-banner");
      var inputs = document.querySelectorAll(
        "#user-view input:not(#u_tanggal), " +
          "#user-view select, " +
          "#user-view textarea, " +
          "#btn-tambah-proses",
      );
      var btnDraft = document.getElementById("btn-draft");
      var btnFinal = document.getElementById("btn-final");
      if (!banner) return;

      if (data.status === "verified") {
        banner.textContent = "LAPORAN TELAH DIVERIFIKASI & TERKUNCI SEPENUHNYA";
        banner.className =
          "p-4 rounded-lg font-bold text-center bg-blue-100 text-blue-800 mb-6 block text-xs";
        inputs.forEach(function (el) {
          el.disabled = true;
        });
        if (btnDraft) btnDraft.classList.add("hidden");
        if (btnFinal) btnFinal.classList.add("hidden");
      } else if (data.status === "final") {
        banner.textContent =
          "LAPORAN TANGGAL INI SUDAH FINAL (MENUNGGU VERIFIKASI)";
        banner.className =
          "p-4 rounded-lg font-bold text-center bg-green-100 text-green-800 mb-6 block text-xs";
        inputs.forEach(function (el) {
          el.disabled = true;
        });
        if (btnDraft) btnDraft.classList.add("hidden");
        if (btnFinal) btnFinal.classList.add("hidden");
      } else {
        banner.classList.replace("block", "hidden");
        inputs.forEach(function (el) {
          el.disabled = false;
        });
        if (btnDraft) btnDraft.classList.remove("hidden");
        if (btnFinal) btnFinal.classList.remove("hidden");
      }
    },

    /* =====================================================================
     * SIMPAN DRAFT
     * ===================================================================== */
    simpanDraftGlobal: function () {
      var db = getDB(this.config.storageKey);
      var data = this.getTodayData(this.currentDate);
      if (data.status === "final" || data.status === "verified") {
        return showNotif("Laporan sudah terkunci!", "error");
      }
      var uShift = document.getElementById("u_shift");
      var uMenu = document.getElementById("u_menu");
      var uPorsi = document.getElementById("u_porsi");
      if (uShift) data.shift = uShift.value;
      if (uMenu) data.menu = uMenu.value;
      if (uPorsi) data.porsi = uPorsi.value;
      data.rows = this.currentRows;

      db[this.currentDate] = data;
      saveDB(this.config.storageKey, db);
      showNotif("Draft laporan berhasil disimpan.");
    },

    /* =====================================================================
     * MODAL TTD USER
     * ===================================================================== */
    bukaModalTtdUser: function () {
      if (this.currentRows.length === 0) {
        return alert("Belum ada data yang diinput.");
      }
      this.simpanDraftGlobal();
      openModal("modal-ttd");
      setTimeout(function () {
        var c = document.getElementById("sig-user");
        if (c) c.width = c.parentElement.getBoundingClientRect().width;
      }, 100);
    },

    /* =====================================================================
     * SIMPAN FINAL + TTD USER
     * ===================================================================== */
    simpanFinalLaporan: function () {
      var canvasUser = document.getElementById("sig-user");
      var namaInput = document.getElementById("m_nama_petugas");
      var nama = namaInput ? namaInput.value : "";
      if (!nama) return alert("Mohon isi Nama Petugas.");

      var db = getDB(this.config.storageKey);
      var data = db[this.currentDate] || this.getTodayData(this.currentDate);
      data.ttd_user = canvasUser.toDataURL();
      data.status = "final";
      data.nama_petugas = nama;

      db[this.currentDate] = data;
      saveDB(this.config.storageKey, db);
      closeModal("modal-ttd");
      this.loadDataForDate();
      showNotif("Laporan Final Berhasil Disimpan & Dikunci!");
    },

    /* =====================================================================
     * LOAD DATA — MODE ADMIN
     * ===================================================================== */
    loadDataAdmin: function () {
      var datePicker = document.getElementById("a_tanggal_pilih");
      if (!datePicker) return;
      var dateStr = datePicker.value;
      var db = getDB(this.config.storageKey);
      var data = db[dateStr] || this.getTodayData(dateStr);

      /* Helper lokal: isi nilai input & teks cetak */
      function setVal(id, val) {
        var el = document.getElementById(id);
        if (el) el.value = val || "";
      }
      function setText(id, val) {
        var el = document.getElementById(id);
        if (el) el.innerText = val || "";
      }

      setText("a_tanggal_txt", formatTanggalID(dateStr));
      setVal("a_shift", data.shift);
      setText("print_a_shift", data.shift);
      setVal("a_menu", data.menu);
      setText("print_a_menu", data.menu);
      setVal("a_porsi", data.porsi);
      setText("print_a_porsi", data.porsi);

      setVal("a_nama_petugas", data.nama_petugas);
      setText("print_a_nama_petugas", data.nama_petugas);
      setVal("a_nama_pengawas", data.nama_pengawas);
      setText("print_a_nama_pengawas", data.nama_pengawas);
      var kepala = data.nama_kepala || this.config.defaultKepala;
      setVal("a_nama_kepala", kepala);
      setText("print_a_nama_kepala", kepala);

      /* Tabel */
      if (typeof this.config.renderAdminTableOverride === "function") {
        this.config.renderAdminTableOverride(data, this);
      } else {
        this._defaultRenderAdminTable(data);
      }

      /* TTD user — validasi data URL sebelum render */
      var sigUser = document.getElementById("a_render_sig_petugas");
      if (sigUser) {
        sigUser.innerHTML =
          data.ttd_user && /^data:image\//.test(data.ttd_user)
            ? '<img src="' +
              escapeAttr(data.ttd_user) +
              '" alt="TTD Petugas" style="max-height: 50px;">'
            : "";
      }

      /* Tombol verif / cetak + lock input admin */
      var btnVerif = document.getElementById("btn-verifikasi-admin");
      var btnPrint = document.getElementById("btn-print-admin");
      var sigAdmin = document.getElementById("a_render_sig_pengawas");
      var adminInputs = document.querySelectorAll(
        "#admin-view input, #admin-view textarea",
      );

      if (data.status === "verified") {
        if (btnVerif) btnVerif.classList.add("hidden");
        if (btnPrint) btnPrint.classList.remove("hidden");
        adminInputs.forEach(function (el) {
          el.readOnly = true;
        });
        if (
          data.ttd_admin &&
          sigAdmin &&
          /^data:image\//.test(data.ttd_admin)
        ) {
          sigAdmin.innerHTML =
            '<img src="' +
            escapeAttr(data.ttd_admin) +
            '" alt="TTD Pengawas" style="max-height: 50px;">';
        }
      } else {
        if (btnVerif) btnVerif.classList.remove("hidden");
        if (btnPrint) btnPrint.classList.add("hidden");
        adminInputs.forEach(function (el) {
          el.readOnly = false;
        });
        if (sigAdmin) sigAdmin.innerHTML = "";
      }
    },

    /* Render tabel admin default (dengan baris padding hingga minRows) */
    _defaultRenderAdminTable: function (data) {
      var tbody = document.getElementById("a_table_body");
      if (!tbody) return;
      tbody.innerHTML = "";

      var rowCount = Math.max(this.config.minRows, data.rows.length);
      var self = this;
      var emptyRow =
        typeof this.config.emptyAdminRow === "function"
          ? this.config.emptyAdminRow()
          : {};

      for (var i = 1; i <= rowCount; i++) {
        var r = data.rows[i - 1] || emptyRow;
        var html = self.config.renderAdminRow(r, i, i - 1);
        if (html) tbody.insertAdjacentHTML("beforeend", html);
      }
    },

    /* =====================================================================
     * MODAL TTD ADMIN
     * ===================================================================== */
    bukaModalTtdAdmin: function () {
      var mInput = document.getElementById("m_nama_pengawas");
      var aInput = document.getElementById("a_nama_pengawas");
      if (mInput && aInput) mInput.value = aInput.value;
      openModal("modal-ttd-admin");
      setTimeout(function () {
        var c = document.getElementById("sig-admin");
        if (c) c.width = c.parentElement.getBoundingClientRect().width;
      }, 100);
    },

    /* =====================================================================
     * SIMPAN VERIFIKASI ADMIN
     * ===================================================================== */
    simpanVerifikasiAdmin: function () {
      var canvasAdmin = document.getElementById("sig-admin");
      var mInput = document.getElementById("m_nama_pengawas");
      var namaPengawas = mInput ? mInput.value : "";
      if (!namaPengawas) return alert("Mohon isi Nama Pengawas.");

      var dateStr = document.getElementById("a_tanggal_pilih").value;
      var db = getDB(this.config.storageKey);
      var data = db[dateStr] || this.getTodayData(dateStr);

      /* Baca editan dari tabel admin (jika ada collector) */
      if (
        data.rows &&
        data.rows.length > 0 &&
        typeof this.config.collectFromAdmin === "function"
      ) {
        data.rows.forEach(function (r, idx) {
          var updated = SopForm.config.collectFromAdmin(idx);
          if (updated) Object.assign(r, updated);
        });
      }

      /* Baca info umum dari input admin */
      function setFrom(id, key) {
        var el = document.getElementById(id);
        if (el) data[key] = el.value;
      }
      setFrom("a_shift", "shift");
      setFrom("a_menu", "menu");
      setFrom("a_porsi", "porsi");
      setFrom("a_nama_petugas", "nama_petugas");
      setFrom("a_nama_kepala", "nama_kepala");

      data.nama_pengawas = namaPengawas;
      data.ttd_admin = canvasAdmin.toDataURL();
      data.status = "verified";

      db[dateStr] = data;
      saveDB(this.config.storageKey, db);
      closeModal("modal-ttd-admin");
      this.loadDataAdmin();
      showNotif("Laporan berhasil DIVERIFIKASI!");
    },
  };

  global.SopForm = SopForm;
})(window);
