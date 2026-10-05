/* ============================================================
 * SAAS — LAPORAN KEUANGAN SPPG LPDH
 * File     : ui-helpers.js
 * Fungsi   : Helper UI ringan (toast, format angka/tanggal, dialog).
 * ============================================================ */

const SAAS_UI = (() => {
  /* Format angka gaya Indonesia: 1.234.567 */
  const fmtNumber = (n) => new Intl.NumberFormat(SAAS_APP.ui.locale).format(Number(n) || 0);

  /* Format rupiah ringkas */
  const fmtIDR = (n) => 'Rp ' + fmtNumber(n);

  /* Format tanggal DD MMM YYYY */
  const fmtDate = (d) => new Date(d).toLocaleDateString(SAAS_APP.ui.locale, {
    day: '2-digit', month: 'short', year: 'numeric'
  });

  /* Toast ringan tanpa library — otomatis hilang */
  function toast(msg, type = 'info', ms = 2600) {
    let host = document.getElementById('saas-toast-host');
    if (!host) {
      host = document.createElement('div');
      host.id = 'saas-toast-host';
      host.className = 'saas-toast-host';
      document.body.appendChild(host);
    }
    const el = document.createElement('div');
    el.className = `saas-toast saas-toast--${type}`;
    el.textContent = msg;
    host.appendChild(el);
    requestAnimationFrame(() => el.classList.add('is-show'));
    setTimeout(() => {
      el.classList.remove('is-show');
      setTimeout(() => el.remove(), 250);
    }, ms);
  }

  /* Konfirmasi sederhana berbasis Promise (tanpa alert bawaan) */
  function confirmDialog(message) {
    return new Promise((resolve) => {
      const ok = window.confirm(message); // fallback simpel dulu
      resolve(ok);
    });
  }

  return { fmtNumber, fmtIDR, fmtDate, toast, confirmDialog };
})();

window.SAAS_UI = SAAS_UI;