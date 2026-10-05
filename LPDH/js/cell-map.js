/* ============================================================
 * SAAS — LAPORAN KEUANGAN SPPG LPDH
 * File     : cell-map.js
 * Fungsi   : Peta lengkap sel input user (sel KUNING di master).
 *
 * ATURAN:
 *   - Hanya sel di sini yang ditulis saat export / dibaca saat import.
 *   - Sheet G_CekPPK, H_RekapPPK, I_RegisterBukti, J_Pengesahan,
 *     Ref → TIDAK ADA input (read-only murni).
 *   - Sheet F_TopUp → kolom PPK di-skip; hanya info read-only.
 * ============================================================ */

const SAAS_CELL_MAP = {

  /* ------------------------------------------------------------
   * IDENTITAS
   * ------------------------------------------------------------ */
  Identitas: [
    { cell: 'B5',  key: 'no_lpdh',      label: 'Nomor LPDH',            type: 'text' },
    { cell: 'B6',  key: 'id_sppg',      label: 'ID SPPG',               type: 'text', required: true },
    { cell: 'B7',  key: 'nama_sppg',    label: 'Nama SPPG',             type: 'text', required: true },
    { cell: 'B8',  key: 'desa',         label: 'Desa/Kelurahan',        type: 'text' },
    { cell: 'B9',  key: 'kecamatan',    label: 'Kecamatan',             type: 'text' },
    { cell: 'B10', key: 'kab_kota',     label: 'Kabupaten/Kota',        type: 'text', required: true },
    { cell: 'B11', key: 'provinsi',     label: 'Provinsi',              type: 'text' },
    { cell: 'B12', key: 'mitra',        label: 'Nama Mitra/Yayasan',    type: 'text' },
    { cell: 'B13', key: 'no_va',        label: 'Nomor VA',              type: 'text', required: true },
    { cell: 'B14', key: 'bank',         label: 'Bank Himbara',          type: 'text' },
    { cell: 'B15', key: 'tgl_layanan',  label: 'Tanggal Pelayanan',     type: 'date', required: true },
    { cell: 'B17', key: 'minggu_ke',    label: 'Minggu ke-',            type: 'number' },
    {
      cell: 'B18', key: 'status_hari', label: 'Status Hari', type: 'select',
      options: ['HPE','Libur nasional/cuti bersama','Libur sekolah/libur khusus daerah',
                'Tanpa pembelajaran tatap muka','Kondisi tertentu (pemda/BGN)',
                'Melebihi 5 hari dalam seminggu'],
    },
    { cell: 'B19', key: 'hpe_ke',       label: 'HPE ke- (1–5)',         type: 'number', min: 1, max: 5 },
    { cell: 'B25', key: 'tgl_unggah',   label: 'Tanggal unggah SIPGN',  type: 'date' },
    { cell: 'B26', key: 'jam_unggah',   label: 'Jam unggah (jj:mm)',    type: 'time' },
    { cell: 'B36', key: 'nama_pengawas',label: 'Nama Pengawas Keuangan',type: 'text' },
    { cell: 'D36', key: 'nik_pengawas', label: 'NIK Pengawas (16 digit)', type: 'text', len: 16 },
    { cell: 'F36', key: 'ttd_pengawas', label: 'Sudah ttd Pengawas', type: 'select', options:['Ya','Tidak'] },
    { cell: 'B37', key: 'nama_kepala',  label: 'Nama Kepala SPPG',      type: 'text' },
    { cell: 'D37', key: 'nip_kepala',   label: 'NIP Kepala (18 digit)', type: 'text', len: 18 },
    { cell: 'F37', key: 'ttd_kepala',   label: 'Sudah ttd Kepala', type: 'select', options:['Ya','Tidak'] },
    { cell: 'B38', key: 'nama_yayasan', label: 'Nama Perwakilan Yayasan', type: 'text' },
    { cell: 'D38', key: 'nik_yayasan',  label: 'NIK Yayasan (16 digit)', type: 'text', len: 16 },
    { cell: 'F38', key: 'ttd_yayasan',  label: 'Sudah ttd Yayasan', type: 'select', options:['Ya','Tidak'] },
  ],

  /* ------------------------------------------------------------
   * A_PM — 10 kelompok sasaran + ringkasan produksi
   * ------------------------------------------------------------ */
  A_PM: [
    {
      range: { from: 6, to: 15 },
      cols: [
        { col: 'E', key: 'target_pm',          label: 'Target PM (SPS)',     type: 'number' },
        { col: 'F', key: 'pop_distribusi',     label: 'Distribusi POP',      type: 'number' },
        { col: 'G', key: 'fleet_diterima',     label: 'Diterima Fleet',      type: 'number' },
        { col: 'H', key: 'fleet_tidak',        label: 'Tidak Diterima',      type: 'number' },
        { col: 'I', key: 'alasan',             label: 'Alasan',              type: 'select',
          options: ['Kualitas tidak layak/tidak standar','Kemasan rusak/tumpah',
                    'PM tidak hadir','Libur/kegiatan mendadak',
                    'Keterlambatan pengiriman','Kelebihan kirim/dikembalikan','Lainnya'] },
        { col: 'K', key: 'bnba',               label: 'BNBA Tersedia',       type: 'select', options:['Ya','Tidak'] },
        { col: 'L', key: 'no_bast',            label: 'No. BAST',            type: 'text' },
        { col: 'M', key: 'link_bast',          label: 'Link Bukti BAST',     type: 'url' },
      ],
    },
    { cell: 'C19', key: 'total_produksi',     label: 'Total porsi diproduksi', type: 'number' },
    { cell: 'C21', key: 'uji_organoleptik',   label: 'Uji organoleptik',       type: 'number' },
    { cell: 'C22', key: 'sampel_makanan',     label: 'Sampel makanan',         type: 'number' },
    { cell: 'C23', key: 'tidak_terdistribusi',label: 'Tidak terdistribusi',    type: 'number' },
    { cell: 'C24', key: 'buffer_produksi',    label: 'Buffer produksi',        type: 'number' },
  ],

  /* ------------------------------------------------------------
   * B_BahanBaku — 40 transaksi
   * ------------------------------------------------------------ */
  B_BahanBaku: [
    {
      range: { from: 6, to: 45 },
      cols: [
        { col: 'C', key: 'tgl',       label: 'Tanggal Transaksi', type: 'date' },
        { col: 'D', key: 'nama_bahan',label: 'Nama Bahan',        type: 'text' },
        { col: 'E', key: 'kategori',  label: 'Kategori',          type: 'select',
          options: ['Karbohidrat','Protein hewani','Protein nabati','Sayuran',
                    'Buah','Susu','Minyak dan bumbu','Lainnya'] },
        { col: 'F', key: 'volume',    label: 'Volume',            type: 'number' },
        { col: 'G', key: 'satuan',    label: 'Satuan',            type: 'text' },
        { col: 'H', key: 'harga',     label: 'Harga Satuan',      type: 'number' },
        { col: 'J', key: 'pemasok',   label: 'Nama Pemasok',      type: 'text' },
        { col: 'K', key: 'no_bukti',  label: 'No. Bukti/Nota',    type: 'text' },
        { col: 'L', key: 'link',      label: 'Link Bukti',        type: 'url' },
      ],
    },
  ],

  /* ------------------------------------------------------------
   * C_Operasional — baris 7..21 (baris 6 auto dari C1_Relawan)
   * ------------------------------------------------------------ */
  C_Operasional: [
    {
      range: { from: 7, to: 21 },
      cols: [
        { col: 'C', key: 'tgl',       label: 'Tanggal Transaksi', type: 'date' },
        { col: 'D', key: 'uraian',    label: 'Uraian',            type: 'text' },
        { col: 'E', key: 'volume',    label: 'Volume',            type: 'number' },
        { col: 'F', key: 'satuan',    label: 'Satuan',            type: 'text' },
        { col: 'G', key: 'harga',     label: 'Harga Satuan',      type: 'number' },
        { col: 'I', key: 'no_bukti',  label: 'No. Bukti',         type: 'text' },
        { col: 'J', key: 'link',      label: 'Link Bukti',        type: 'url' },
      ],
    },
  ],

  /* ------------------------------------------------------------
   * C1_Relawan — 60 relawan
   * ------------------------------------------------------------ */
  C1_Relawan: [
    {
      range: { from: 6, to: 65 },
      cols: [
        { col: 'C', key: 'nama',      label: 'Nama Relawan',       type: 'text' },
        { col: 'D', key: 'tugas',     label: 'Tugas',              type: 'text' },
        { col: 'E', key: 'tgl_bayar', label: 'Tanggal Pembayaran', type: 'date' },
        { col: 'F', key: 'hari_kerja',label: 'Hari Kerja',         type: 'number' },
        { col: 'G', key: 'besaran',   label: 'Besaran Harian',     type: 'number' },
        { col: 'I', key: 'metode',    label: 'Metode Bayar',       type: 'select', options:['Tunai','Transfer'] },
        { col: 'J', key: 'no_bukti',  label: 'No. Bukti Pembayaran', type: 'text' },
        { col: 'K', key: 'link',      label: 'Link Bukti Bayar',   type: 'url' },
      ],
    },
  ],

  /* ------------------------------------------------------------
   * D_Insentif
   * ------------------------------------------------------------ */
  D_Insentif: [
    { cell: 'B6',  key: 'kontaminasi',   label: 'Terjadi kontaminasi/gagal salur', type: 'select', options:['Ya','Tidak'] },
    { cell: 'B7',  key: 'fatal',         label: 'Terjadi kejadian fatal',          type: 'select', options:['Ya','Tidak'] },
    { cell: 'B8',  key: 'suspend',       label: 'SPPG suspend',                    type: 'select', options:['Ya','Tidak'] },
    { cell: 'B9',  key: 'verif_mutu',    label: 'Verifikasi mutu memenuhi',        type: 'select', options:['Ya','Tidak'] },
    { cell: 'B10', key: 'data_sipgn',    label: 'Data PM telah diinput SIPGN',     type: 'select', options:['Ya','Tidak'] },
    { cell: 'C19', key: 'no_pernyataan', label: 'No. pernyataan PPK',              type: 'text' },
    { cell: 'C20', key: 'nilai_pernyataan', label: 'Nilai pernyataan PPK (Rp)',    type: 'number' },
    { cell: 'C21', key: 'nominal_bayar', label: 'Nominal dibayarkan (Rp)',         type: 'number' },
    { cell: 'C22', key: 'tgl_bayar',     label: 'Tanggal pembayaran',              type: 'date' },
    { cell: 'C23', key: 'no_bukti',      label: 'No. Bukti Pembayaran',            type: 'text' },
    { cell: 'C24', key: 'no_kuitansi',   label: 'No. Kuitansi',                    type: 'text' },
    { cell: 'C25', key: 'kuitansi_ttd',  label: 'Kuitansi ditandatangani Mitra',   type: 'select', options:['Ya','Tidak'] },
    { cell: 'C26', key: 'link_pdf',      label: 'Link PDF bukti bayar',            type: 'url' },
    { cell: 'C27', key: 'ref_va',        label: 'Ref. transaksi VA',               type: 'text' },
  ],

  /* ------------------------------------------------------------
   * E_Saldo — saldo awal + top up
   * ------------------------------------------------------------ */
  E_Saldo: [
    { cell: 'B5',  key: 'saldo_bahan', label: 'Saldo awal Bahan Baku (Rp)',  type: 'number' },
    { cell: 'B6',  key: 'saldo_ops',   label: 'Saldo awal Operasional (Rp)', type: 'number' },
    { cell: 'B7',  key: 'saldo_ins',   label: 'Saldo awal Insentif (Rp)',    type: 'number' },
    { cell: 'E10', key: 'saldo_va',    label: 'Saldo VA (mutasi rekening)',  type: 'number' },
    { cell: 'E12', key: 'penjelasan',  label: 'Penjelasan selisih (bila ada)', type: 'text' },
    {
      range: { from: 19, to: 23 },
      cols: [
        { col: 'C', key: 'tgl_terima',  label: 'Tanggal diterima',  type: 'date' },
        { col: 'D', key: 'no_sp2d',     label: 'No. SP2D',          type: 'text' },
        { col: 'E', key: 'bahan',       label: 'Bahan Baku (Rp)',   type: 'number' },
        { col: 'F', key: 'ops',         label: 'Operasional (Rp)',  type: 'number' },
        { col: 'G', key: 'ins',         label: 'Insentif (Rp)',     type: 'number' },
        { col: 'I', key: 'no_kuitansi', label: 'No. Kuitansi',      type: 'text' },
        { col: 'J', key: 'link',        label: 'Link Bukti Terima', type: 'url' },
      ],
    },
  ],

  /* ------------------------------------------------------------
   * Read-only / tanpa input
   * ------------------------------------------------------------ */
  F_TopUp:        [],
  Petunjuk:       [],
  G_CekPPK:       [],
  H_RekapPPK:     [],
  I_RegisterBukti:[],
  J_Pengesahan:   [],
  Ref:            [],
};

window.SAAS_CELL_MAP = SAAS_CELL_MAP;