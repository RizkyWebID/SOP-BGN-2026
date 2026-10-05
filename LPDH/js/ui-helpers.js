/* ============================================================
 * SAAS — LAPORAN KEUANGAN SPPG LPDH
 * File     : ui-helpers.js
 * Fungsi   : Helper UI ringan — toast, formatter angka/tanggal,
 *            dialog konfirmasi berbasis Promise, escape HTML.
 * ============================================================ */

const SAAS_UI = (() => {

  /* Format angka gaya Indonesia: 1.234.567 */
  const fmtNumber = (n) =>
    new Intl.NumberFormat(SAAS_APP.ui.locale).format(Number(n) || 0);

  /* Format rupiah */
  const fmtIDR = (n) => 'Rp ' + fmtNumber(n);

  /* Format tanggal DD MMM YYYY */
  const fmtDate = (d) => new Date(d).toLocaleDateString(SAAS_APP.ui.locale, {
    day: '2-digit', month: 'short', year: 'numeric',
  });

  /* Escape HTML untuk pencegahan XSS sederhana */
  const escapeHtml = (str) =>
    String(str ?? '').replace(/[&<>"']/g, (m) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;',
      '"': '&quot;', "'": '&#39;',
    }[m]));

  /* Toast ringan (tanpa library) */
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

  /* Konfirmasi berbasis Promise (pakai confirm bawaan dulu; bisa
     diganti modal kustom nanti tanpa mengubah pemanggil). */
  function confirmDialog(message) {
    return new Promise((resolve) => resolve(window.confirm(message)));
  }

  /* Tampilkan spinner overlay (blokir interaksi sementara) */
  function showBusy(message = 'Memproses…') {
    let el = document.getElementById('saas-busy');
    if (!el) {
      el = document.createElement('div');
      el.id = 'saas-busy';
      el.className = 'saas-busy';
      el.innerHTML = `<div class="saas-busy__box">
        <div class="saas-busy__spin" aria-hidden="true"></div>
        <div class="saas-busy__msg">${escapeHtml(message)}</div>
      </div>`;
      document.body.appendChild(el);
    } else {
      el.querySelector('.saas-busy__msg').textContent = message;
      el.style.display = 'flex';
    }
  }
  function hideBusy() {
    const el = document.getElementById('saas-busy');
    if (el) el.style.display = 'none';
  }

  return {
    fmtNumber, fmtIDR, fmtDate, escapeHtml,
    toast, confirmDialog, showBusy, hideBusy,
  };
})();

window.SAAS_UI = SAAS_UI;