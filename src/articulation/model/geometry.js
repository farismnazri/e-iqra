// Adapted from Makhraj 3D by ms@ebooksunnah.com, https://makhraj3d.ebooksunnah.com/
// Owner-supplied source, 23 October 2026. Reuse terms require confirmation before release.
// See MAKHRAJ_3D.md. Internal anatomical keys retain upstream names for pose fidelity.
import * as THREE from 'three'
/* ============================================================
   geometri.js — Definisi 2D potongan sagital (bidang XY).
   Satuan ≈ cm. Sumbu: x+ = arah wajah (depan), y+ = atas.
   (Saat ditampilkan, model dicerminkan agar wajah menghadap
   ke KIRI seperti ilustrasi ebook.)
   Semua bentuk = gambar ulang stilasi asli (lihat ADR-0001).
   ============================================================ */
export const geometry = (function () {
  'use strict';

  /* ---------- util kurva ---------- */
  function smooth(ctrl, n) {
    const c = new THREE.CatmullRomCurve3(ctrl.map(p => new THREE.Vector3(p[0], p[1], 0)), false, 'centripetal');
    return c.getPoints(n).map(v => [v.x, v.y]);
  }
  /* Pembangun kontur: potongan halus / lurus, tiap titik diberi tag
     jaringan: 'kulit' | 'mukosa' | 'potong' (tepi potongan blok). */
  function Kontur() { this.p = []; this.tag = []; }
  Kontur.prototype.push = function (pt, tag) {
    const n = this.p.length;
    if (n) {
      const q = this.p[n - 1];
      if (Math.abs(q[0] - pt[0]) < 1e-6 && Math.abs(q[1] - pt[1]) < 1e-6) { this.tag[n - 1] = tag; return this; }
    }
    this.p.push([pt[0], pt[1]]); this.tag.push(tag); return this;
  };
  Kontur.prototype.s = function (ctrl, tag, n) {
    const pts = smooth(ctrl, n || Math.max(8, ctrl.length * 7));
    pts.forEach(pt => this.push(pt, tag));
    return this;
  };
  Kontur.prototype.l = function (pts, tag) { pts.forEach(pt => this.push(pt, tag)); return this; };
  Kontur.prototype.done = function () {
    const a = this.p[0], b = this.p[this.p.length - 1];
    if (Math.abs(a[0] - b[0]) < 1e-6 && Math.abs(a[1] - b[1]) < 1e-6) { this.p.pop(); this.tag.pop(); }
    return this;
  };
  function luas(pts) {
    let s = 0;
    for (let i = 0, n = pts.length; i < n; i++) { const a = pts[i], b = pts[(i + 1) % n]; s += a[0] * b[1] - b[0] * a[1]; }
    return s / 2;
  }

  /* ---------- batas area gambar ---------- */
  const BATAS = { x0: -4.0, x1: 5.05, y0: -5.3, y1: 4.4 };

  /* ---------- Potongan A: kepala atas/belakang, hidung, rahang atas,
     langit-langit keras, dinding faring (satu poligon; rongga hidung &
     mulut adalah "teluk" yang bermuara di mulut). ---------- */
  const A = new Kontur()
    .l([[-3.75, 4.4], [2.98, 4.4]], 'potong')
    .s([[2.98, 4.4], [3.22, 3.92], [3.62, 3.28], [4.18, 2.62], [4.6, 2.2], [4.77, 1.97], [4.71, 1.78], [4.48, 1.65],
        [4.2, 1.55], [3.97, 1.47]], 'kulit', 60)
    .s([[3.97, 1.47], [3.8, 1.36], [3.62, 1.16], [3.57, 1.06]], 'kulit', 10)
    .s([[3.57, 1.06], [3.53, 0.95], [3.47, 0.79]], 'mukosa', 5)
    .l([[3.33, 0.74], [3.18, 0.73]], 'mukosa')
    .s([[3.18, 0.73], [3.13, 0.8], [3.03, 0.91], [2.88, 0.96], [2.55, 1.13], [2.0, 1.31], [1.3, 1.36], [0.5, 1.3], [-0.2, 1.21]], 'mukosa', 44)
    .s([[-0.2, 1.21], [-0.26, 1.3], [-0.24, 1.44]], 'mukosa', 6)
    .s([[-0.24, 1.44], [-0.1, 1.56], [0.6, 1.64], [1.8, 1.69], [3.0, 1.73], [3.6, 1.76], [3.95, 1.82], [4.14, 1.97],
        [4.1, 2.25], [3.85, 2.56], [3.3, 3.0], [2.3, 3.3], [1.0, 3.38], [-0.1, 3.2], [-0.8, 2.88],
        [-1.22, 2.42], [-1.42, 1.8], [-1.47, 0.6], [-1.47, -0.6], [-1.44, -1.8], [-1.4, -3.0], [-1.36, -3.85],
        [-1.3, -4.4], [-1.29, -5.3]], 'mukosa', 120)
    .l([[-1.29, -5.3], [-3.75, -5.3], [-3.93, -5.23], [-4.0, -5.05], [-4.0, 4.15], [-3.93, 4.33]], 'potong')
    .done();

  /* ---------- Potongan B: rahang bawah, dasar mulut, laring depan ---------- */
  const LANTAI_LIDAH = [[-0.36, -2.52], [0.4, -2.43], [1.3, -2.03], [2.1, -1.48], [2.7, -0.99]];
  const B = new Kontur()
    .l([[0.9, -5.3], [-0.62, -5.3]], 'potong')
    .s([[-0.62, -5.3], [-0.62, -5.0], [-0.6, -4.2], [-0.6, -3.5], [-0.6, -3.08]], 'mukosa', 24)
    .s([[-0.6, -3.08], [-0.5, -2.9], [-0.44, -2.68], [-0.52, -2.4], [-0.64, -2.24]], 'mukosa', 14)
    .s([[-0.64, -2.24], [-0.36, -2.5]].concat(LANTAI_LIDAH.slice(1)), 'mukosa', 40)
    .s([[2.7, -0.99], [2.95, -0.86], [3.12, -0.89], [3.2, -0.93]], 'mukosa', 10)
    .l([[3.33, -0.96], [3.44, -0.98]], 'mukosa')
    .s([[3.44, -0.98], [3.5, -1.1], [3.56, -1.18]], 'mukosa', 5)
    .s([[3.56, -1.18], [3.72, -1.3], [3.96, -1.36], [4.13, -1.75], [4.12, -2.3], [3.78, -2.72], [2.9, -2.95],
        [1.9, -3.1], [1.25, -3.5], [0.98, -4.4], [0.9, -5.3]], 'kulit', 70)
    .done();

  /* ---------- siluet luar (untuk pelat belakang) ---------- */
  const SILUET = new Kontur()
    .l([[-3.75, 4.4], [2.98, 4.4]], 'x')
    .s([[2.98, 4.4], [3.22, 3.92], [3.62, 3.28], [4.18, 2.62], [4.6, 2.2], [4.77, 1.97], [4.71, 1.78], [4.48, 1.65]], 'x')
    .s([[4.48, 1.65], [4.2, 1.55], [3.97, 1.47], [3.9, 0.6], [3.9, -0.8], [3.96, -1.36], [4.13, -1.75], [4.12, -2.3], [3.78, -2.72], [2.9, -2.95],
        [1.9, -3.1], [1.25, -3.5], [0.98, -4.4], [0.9, -5.3]], 'x', 60)
    .l([[-3.75, -5.3], [-3.93, -5.23], [-4.0, -5.05], [-4.0, 4.15], [-3.93, 4.33]], 'x')
    .done();

  /* ---------- gigi (profil sagital) ---------- */
  const GIGI_SERI_ATAS = [
    [3.47, 0.8], [3.54, 0.6], [3.57, 0.35], [3.56, 0.14], [3.52, 0.01], [3.47, -0.01], [3.43, 0.02],
    [3.37, 0.15], [3.3, 0.3], [3.24, 0.44], [3.19, 0.58], [3.18, 0.74]
  ];
  const GIGI_SERI_BAWAH = [
    [3.44, -0.98], [3.47, -0.75], [3.46, -0.52], [3.42, -0.36], [3.38, -0.31], [3.34, -0.33],
    [3.3, -0.44], [3.25, -0.6], [3.21, -0.78], [3.2, -0.93]
  ];

  /* ---------- batas atas rongga mulut (untuk tumbukan lidah) ----------
     urutan dari ujung gigi seri atas → gusi → langit-langit keras.
     Langit-langit lunak (velum) ditambahkan dinamis. */
  const BATAS_ATAS = [
    [3.44, 0.0], [3.36, 0.16], [3.27, 0.37], [3.2, 0.56], [3.16, 0.72], [3.1, 0.83], [3.0, 0.92],
    [2.8, 1.0], [2.55, 1.13], [2.2, 1.26], [1.8, 1.34], [1.3, 1.36], [0.8, 1.33], [0.3, 1.27], [-0.2, 1.21]
  ];
  const DINDING_FARING_X = -1.46;

  /* ---------- lidah: titik kendali ---------- */
  // atas (dorsum) dari pangkal (s=0) ke ujung (s=1); indeks 0..8
  const LIDAH_ISTIRAHAT = [
    [-0.64, -2.22], [-0.8, -1.3], [-0.72, -0.25], [-0.2, 0.36], [0.55, 0.68],
    [1.45, 0.72], [2.25, 0.5], [2.85, 0.05], [3.12, -0.42]
  ];
  // bawah dari pangkal ke dekat ujung (tetap, kecuali dekat ujung)
  const LIDAH_BAWAH = [[-0.38, -2.55]].concat(LANTAI_LIDAH.slice(1).map(p => [p[0], p[1] - 0.03]));

  /* ---------- bibir: pose (luar & dalam, pangkal → tepi) ---------- */
  const BIBIR = {
    atas: {
      istirahat: { luar: [[3.95, 1.45], [4.22, 1.2], [4.37, 0.78], [4.35, 0.42], [4.24, 0.14]],
                   dalam: [[3.53, 1.0], [3.63, 0.75], [3.66, 0.42], [3.82, 0.16], [4.24, 0.14]] },
      rapat:     { luar: [[3.95, 1.45], [4.22, 1.2], [4.38, 0.74], [4.38, 0.3], [4.27, -0.02]],
                   dalam: [[3.53, 1.0], [3.63, 0.75], [3.68, 0.38], [3.86, 0.02], [4.27, -0.02]] },
      fa:        { luar: [[3.95, 1.45], [4.22, 1.22], [4.36, 0.84], [4.33, 0.5], [4.22, 0.24]],
                   dalam: [[3.53, 1.0], [3.63, 0.78], [3.66, 0.5], [3.8, 0.26], [4.22, 0.24]] },
      maju:      { luar: [[3.95, 1.45], [4.3, 1.16], [4.58, 0.72], [4.7, 0.34], [4.66, 0.07]],
                   dalam: [[3.53, 1.0], [3.66, 0.72], [3.82, 0.4], [4.18, 0.1], [4.66, 0.07]] }
    },
    bawah: {
      istirahat: { luar: [[3.95, -1.34], [4.23, -1.05], [4.35, -0.66], [4.3, -0.4], [4.19, -0.24]],
                   dalam: [[3.53, -1.12], [3.57, -0.82], [3.63, -0.52], [3.84, -0.3], [4.19, -0.24]] },
      rapat:     { luar: [[3.95, -1.34], [4.24, -1.02], [4.37, -0.6], [4.35, -0.28], [4.26, -0.06]],
                   dalam: [[3.53, -1.12], [3.58, -0.78], [3.66, -0.45], [3.88, -0.12], [4.26, -0.06]] },
      fa:        { luar: [[3.95, -1.34], [4.18, -1.0], [4.15, -0.55], [4.0, -0.18], [3.78, 0.07]],
                   dalam: [[3.53, -1.12], [3.56, -0.82], [3.58, -0.5], [3.54, -0.18], [3.78, 0.07]] },
      maju:      { luar: [[3.95, -1.34], [4.3, -1.04], [4.55, -0.64], [4.64, -0.32], [4.6, -0.14]],
                   dalam: [[3.53, -1.12], [3.6, -0.8], [3.76, -0.48], [4.12, -0.2], [4.6, -0.14]] }
    }
  };

  /* ---------- langit-langit lunak (velum): terangkat / turun ---------- */
  const VELUM = {
    naik:  { atas: [[-0.1, 1.53], [-0.55, 1.55], [-0.95, 1.48], [-1.22, 1.34], [-1.35, 1.13]],
             bawah: [[-0.1, 1.22], [-0.55, 1.13], [-0.92, 1.02], [-1.18, 0.95], [-1.35, 1.13]] },
    turun: { atas: [[-0.1, 1.53], [-0.52, 1.42], [-0.82, 1.14], [-0.98, 0.78], [-1.02, 0.4]],
             bawah: [[-0.1, 1.22], [-0.42, 1.06], [-0.64, 0.8], [-0.8, 0.52], [-1.02, 0.4]] }
  };

  /* ---------- epiglotis (katup) — istirahat; berputar pada pangkal ---------- */
  const EPIGLOTIS = {
    pangkal: [-0.58, -2.98],
    atas:  [[-0.68, -3.08], [-0.9, -2.5], [-1.06, -1.98], [-1.16, -1.62], [-1.17, -1.5]],  // sisi laring (belakang)
    bawah: [[-0.48, -2.9], [-0.68, -2.42], [-0.86, -1.95], [-1.02, -1.6], [-1.17, -1.5]]    // sisi lidah (depan)
  };

  /* ---------- titik penting ---------- */
  const TITIK = {
    glotis: [-0.98, -3.75],
    trakeaBawah: [-0.96, -5.25],
    faringTengah: [-1.2, -1.6],
    uvula: [-1.35, 1.13],
    bibir: [4.25, -0.05],
    lubangHidung: [4.3, 1.5]
  };

  /* ---------- lengkung gigi (sisi jauh, z<0) ----------
     x = posisi sagital, z = kedalaman lateral, w = lebar mesio-distal */
  const LENGKUNG_ATAS = [
    { jenis: 'seri2', x: 3.22, z: -0.62, w: 0.46, h: 0.68, y: 0.78 },
    { jenis: 'taring', x: 2.9, z: -1.0, w: 0.52, h: 0.78, y: 0.82 },
    { jenis: 'geraham-kecil', x: 2.42, z: -1.3, w: 0.48, h: 0.56, y: 0.86 },
    { jenis: 'geraham-kecil', x: 1.94, z: -1.48, w: 0.48, h: 0.54, y: 0.88 },
    { jenis: 'geraham', x: 1.36, z: -1.63, w: 0.64, h: 0.55, y: 0.92 },
    { jenis: 'geraham', x: 0.72, z: -1.74, w: 0.6, h: 0.52, y: 0.95 }
  ];
  const LENGKUNG_BAWAH = [
    { jenis: 'seri2', x: 3.12, z: -0.55, w: 0.4, h: 0.62, y: -0.98 },
    { jenis: 'taring', x: 2.82, z: -0.92, w: 0.48, h: 0.72, y: -1.0 },
    { jenis: 'geraham-kecil', x: 2.36, z: -1.22, w: 0.46, h: 0.56, y: -0.72 },
    { jenis: 'geraham-kecil', x: 1.9, z: -1.4, w: 0.46, h: 0.54, y: -0.62 },
    { jenis: 'geraham', x: 1.3, z: -1.55, w: 0.68, h: 0.52, y: -0.54 },
    { jenis: 'geraham', x: 0.64, z: -1.66, w: 0.64, h: 0.5, y: -0.5 }
  ];

  /* sampel polyline → fungsi y(x) (untuk garis tengah aliran) */
  function yPada(poly, x) {
    for (let i = 0; i < poly.length - 1; i++) {
      const a = poly[i], b = poly[i + 1];
      if ((x - a[0]) * (x - b[0]) <= 0 && a[0] !== b[0]) {
        const t = (x - a[0]) / (b[0] - a[0]);
        return a[1] + (b[1] - a[1]) * t;
      }
    }
    return null;
  }

  return {
    smooth, Kontur, luas, yPada, BATAS, A, B, SILUET, GIGI_SERI_ATAS, GIGI_SERI_BAWAH,
    BATAS_ATAS, DINDING_FARING_X, LIDAH_ISTIRAHAT, LIDAH_BAWAH, LANTAI_LIDAH, BIBIR, VELUM,
    EPIGLOTIS, TITIK, LENGKUNG_ATAS, LENGKUNG_BAWAH
  };
})();
