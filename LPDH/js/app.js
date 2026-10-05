/* ============================================================
 * SAAS — LAPORAN KEUANGAN SPPG LPDH
 * File     : app.js
 * Fungsi   : Bootstrap aplikasi — set tahun & versi, tab routing,
 *            render view per tab. Pada batch 1 hanya tab "sesi"
 *            yang berfungsi; tab lain menampilkan placeholder
 *            sampai batch 2 di-isi.
 * ============================================================ */

(function bootstrap() {
  "use strict";

  // ---------- Info versi & tahun ----------
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  $("#saas-version").textContent = "Versi: " + SAAS_APP.brand.version;
  $("#saas-year").textContent = new Date().getFullYear();

  // ---------- State ----------
  const state = {
    activeSession: null, // objek sesi aktif (dari SAAS_DB)
    activeTab: "sesi",
  };

  // ---------- Routing tab ----------
  $$(".saas-tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      $$(".saas-tab").forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      state.activeTab = btn.dataset.tab;
      renderView();
    });
  });

  /* ---------- View dispatcher ---------- */
  function renderView() {
    const v = $("#saas-view");
    v.innerHTML = "";

    if (!state.activeSession) {
      if (state.activeTab !== "sesi") {
        v.innerHTML = '<p class="saas-hint">Buat sesi dulu di tab Sesi.</p>';
        return;
      }
    }

    const sid = state.activeSession && state.activeSession.id;

    switch (state.activeTab) {
      case "sesi":
        return renderViewSesi(v);
      case "identitas":
        return SAAS_FORM_IDENTITAS.render(v, sid);
      case "a-pm":
        return SAAS_FORM_APM.render(v, sid);
      case "b-bahan":
        return SAAS_FORM_GENERIC_TABLE.render(v, sid, {
          sheet: "B_BahanBaku",
          title: "B. Rincian Belanja Bahan Baku Pangan",
          hint: "Satu baris = satu transaksi. Nomor bukti wajib unik.",
          maxRows: 40,
        });
      case "c-ops":
        return SAAS_FORM_GENERIC_TABLE.render(v, sid, {
          sheet: "C_Operasional",
          title: "C. Rincian Biaya Operasional",
          hint: "Baris insentif relawan terisi otomatis dari C1_Relawan.",
          maxRows: 15,
        });
      case "c1-relawan":
        return SAAS_FORM_GENERIC_TABLE.render(v, sid, {
          sheet: "C1_Relawan",
          title: "C1. Daftar Nominatif Insentif Relawan",
          hint: "Nama, tugas, tanggal, dan link bukti bayar.",
          maxRows: 60,
        });
      case "d-insentif":
        return SAAS_FORM_DINSENTIF.render(v, sid);
      case "e-saldo":
        return SAAS_FORM_GENERIC_TABLE.render(v, sid, {
          sheet: "E_Saldo",
          title: "E. Saldo & Penerimaan Top Up",
          hint: "Baris top up (5 baris). Saldo awal diisi manual.",
          maxRows: 5,
        });
      case "f-topup":
        return renderViewTopUpInfo(v);
      case "export":
        return renderViewExport(v);
      default:
        v.innerHTML = '<p class="saas-hint">Tab tidak dikenal.</p>';
    }
  }

  /* Info F_TopUp (read-only untuk SPPG) */
  function renderViewTopUpInfo(root) {
    root.innerHTML = `
      <h2 class="saas-card__title">F. Usulan & Persetujuan Top Up</h2>
      <p class="saas-hint mb-3">
        Bagian ini <strong>diisi Tim PPK</strong> (kolom biru di master).
        Usulan SPPG terisi otomatis dari total B_BahanBaku + C_Operasional + D_Insentif
        saat file dibuka di Excel. Anda tidak perlu mengisi apa pun di sini.
      </p>
    `;
  }

  /* Export — versi aktif */
  function renderViewExport(root) {
    root.innerHTML = `
      <h2 class="saas-card__title">Export XLSX</h2>
      <p class="saas-hint mb-3">
        File yang diunduh dibuat BARU dari template master yang Anda tanam.
        File master asli tidak pernah diubah.
      </p>
      <button id="saas-btn-export" class="saas-btn saas-btn--accent">Export Sekarang</button>
    `;
    root
      .querySelector("#saas-btn-export")
      .addEventListener("click", async () => {
        if (!state.activeSession)
          return SAAS_UI.toast("Buat sesi dulu.", "warn");
        try {
          const blob = await SAAS_XLSX.exportSession(state.activeSession.id);
          const fname = await SAAS_XLSX.buildFileName(state.activeSession.id);
          SAAS_XLSX.downloadBlob(blob, fname);
          SAAS_UI.toast("Export berhasil: " + fname, "ok", 4000);
        } catch (err) {
          console.error(err);
          SAAS_UI.toast("Export gagal: " + err.message, "error", 5000);
        }
      });
  }

  // ---------- View: Sesi ----------
  function renderViewSesi(root) {
    root.innerHTML = `
      <h2 class="saas-card__title">Manajemen Sesi</h2>

      <div class="grid grid-cols-1 md-grid-cols-3 gap-3 mb-4">
        <label class="saas-field">
          <span>Nama Pengguna</span>
          <input id="saas-input-user" class="saas-input" placeholder="contoh: Budi" />
        </label>
        <label class="saas-field">
          <span>ID Sesi (otomatis)</span>
          <input id="saas-input-session" class="saas-input" readonly />
        </label>
        <div class="flex items-end gap-2">
          <button id="saas-btn-new-session" class="saas-btn saas-btn--primary">Buat Sesi Baru</button>
        </div>
      </div>

      <hr style="border:none;border-top:1px solid var(--c-border);margin:16px 0"/>

      <h3 class="saas-card__title">Template Master XLSX</h3>
      <p class="saas-hint mb-3">
        Tanam satu kali file master XLSX Anda. Template disimpan lokal
        di browser; file asli tidak pernah diubah.
      </p>
      <div class="flex items-center gap-2 flex-wrap">
        <input type="file" id="saas-input-master" accept=".xlsx" class="saas-input" />
        <button id="saas-btn-upload-master" class="saas-btn saas-btn--accent">Tanam Template</button>
        <span id="saas-template-status" class="saas-hint">Memeriksa…</span>
      </div>
    `;

    // Simpan referensi
    const elUser = $("#saas-input-user");
    const elSess = $("#saas-input-session");
    const btnNew = $("#saas-btn-new-session");
    const elMaster = $("#saas-input-master");
    const btnUp = $("#saas-btn-upload-master");
    const elStatus = $("#saas-template-status");

    // Isi status template
    SAAS_DB.hasTemplate().then((has) => {
      if (has) {
        SAAS_DB.getTemplate().then((t) => {
          elStatus.textContent = `Template tersedia (${t.fileName}, ditanam ${SAAS_UI.fmtDate(t.savedAt)})`;
        });
      } else {
        elStatus.textContent = "Belum ada template. Silakan tanam master XLSX.";
      }
    });

    // Buat sesi baru
    btnNew.addEventListener("click", async () => {
      const name = (elUser.value || "").trim();
      if (!name) return SAAS_UI.toast("Isi nama pengguna dulu.", "warn");
      const s = await SAAS_DB.createSession(name);
      state.activeSession = s;
      elSess.value = s.id;
      $("#saas-active-user").textContent = `Sesi: ${s.userName}`;
      SAAS_UI.toast("Sesi dibuat: " + s.id, "ok");
    });

    // Tanam template
    btnUp.addEventListener("click", async () => {
      const file = elMaster.files?.[0];
      if (!file) return SAAS_UI.toast("Pilih file master XLSX dulu.", "warn");
      if (!/\.xlsx$/i.test(file.name))
        return SAAS_UI.toast("File harus .xlsx", "warn");

      try {
        SAAS_UI.showBusy("Membaca master XLSX…");
        const buf = await file.arrayBuffer();
        await SAAS_DB.saveTemplate(buf, file.name);
        SAAS_UI.toast("Template berhasil ditanam.", "ok");
        elStatus.textContent = `Template tersedia (${file.name})`;
      } catch (err) {
        console.error(err);
        SAAS_UI.toast("Gagal menanam template: " + err.message, "error");
      } finally {
        SAAS_UI.hideBusy();
      }
    });
  }

  // ---------- View: Export (placeholder batch 1) ----------
  function renderViewExport(root) {
    root.innerHTML = `
      <h2 class="saas-card__title">Export XLSX</h2>
      <p class="saas-hint">
        Fitur export akan aktif di batch 2 setelah xlsx engine terpasang.
        Saat ini belum ada file yang bisa diunduh.
      </p>
    `;
  }

  // ---------- Render awal ----------
  renderView();

  console.info(
    "[SAAS] %s v%s siap.",
    SAAS_APP.brand.name,
    SAAS_APP.brand.version,
  );
})();
