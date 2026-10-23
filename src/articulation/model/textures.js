// Adapted from Makhraj 3D by ms@ebooksunnah.com, https://makhraj3d.ebooksunnah.com/
// Owner-supplied source, 23 October 2026. Reuse terms require confirmation before release.
// See MAKHRAJ_3D.md. Internal anatomical keys retain upstream names for pose fidelity.
import { geometry } from './geometry.js'
/* ============================================================
   tekstur.js — Melukis tekstur bidang potongan (kanvas 2D) dari
   definisi Geo: jaringan, tulang, tulang rawan, otot, mukosa.
   Semua digambar prosedural (bukan dari gambar ebook).
   ============================================================ */
export const textures = (function () {
  'use strict';
  const G = geometry;

  // generator acak deterministik agar tampilan konsisten
  function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

  const WARNA = {
    jaringan: '#f1cf80', jaringanGelap: '#e2b766',
    kulit: '#e9ae88', kulitGaris: '#b8744f',
    mukosa: '#e48c86', mukosaGelap: '#c4625e',
    tulang: '#f4ecd8', tulangGaris: '#cdb98c', sumsum: '#ead7ae',
    rawan: '#d7e4ea', rawanGaris: '#98b1bd',
    otot: '#c34b42', ototTerang: '#dc6d60', ototGelap: '#93322b',
    saraf: '#f3e6e2'
  };

  function jalur(ctx, pts, tutup) {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    if (tutup !== false) ctx.closePath();
  }
  function halus(pts, n) { return G.smooth(pts.concat([pts[0]]), n || 80); }
  function isi(ctx, pts, warna, garis, lebar) {
    jalur(ctx, pts);
    ctx.fillStyle = warna; ctx.fill();
    if (garis) { ctx.strokeStyle = garis; ctx.lineWidth = lebar || 0.025; ctx.stroke(); }
  }
  function elips(ctx, cx, cy, rx, ry, rot) {
    ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, rot || 0, 0, Math.PI * 2);
  }

  /* bintik/serat halus untuk kesan jaringan hidup */
  function bintik(ctx, pts, n, warna, rMin, rMax, alpha, r) {
    ctx.save(); jalur(ctx, pts); ctx.clip();
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    pts.forEach(p => { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); });
    ctx.globalAlpha = alpha; ctx.fillStyle = warna;
    for (let i = 0; i < n; i++) {
      const x = x0 + r() * (x1 - x0), y = y0 + r() * (y1 - y0), rr = rMin + r() * (rMax - rMin);
      elips(ctx, x, y, rr, rr * (0.6 + r() * 0.5), r() * 3); ctx.fill();
    }
    ctx.restore();
  }

  /* pita mengikuti polyline (untuk otot dinding faring, dsb.) */
  function pita(pts, dx, dy) {
    const b = pts.map(p => [p[0] + dx, p[1] + dy]).reverse();
    return pts.concat(b);
  }

  /* ---------- tekstur bidang potongan (koordinat dunia) ---------- */
  function lukisPotongan(pxPerUnit) {
    const B = G.BATAS, s = pxPerUnit;
    const W = Math.ceil((B.x1 - B.x0) * s), H = Math.ceil((B.y1 - B.y0) * s);
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    // willReadFrequently: kanvas dirender CPU (bukan GPU). Menyalin kanvas yang dipercepat GPU ke tekstur
    // WebGL membuat GPU Adreno 610/618 crash (konteks hilang di tahap unggah tekstur, data 29-09-2026).
    const ctx = cv.getContext('2d', { willReadFrequently: true });
    ctx.setTransform(s, 0, 0, -s, -B.x0 * s, B.y1 * s);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const r = rng(7);
    const potongan = [G.A.p, G.B.p];

    // 1. jaringan dasar + gradasi lembut
    potongan.forEach(p => {
      jalur(ctx, p);
      const g = ctx.createLinearGradient(0, 4.4, 0, -5.3);
      g.addColorStop(0, '#f3d38a'); g.addColorStop(0.5, WARNA.jaringan); g.addColorStop(1, '#eec577');
      ctx.fillStyle = g; ctx.fill();
      bintik(ctx, p, 1400, '#fff3c9', 0.025, 0.07, 0.35, r);
      bintik(ctx, p, 900, WARNA.jaringanGelap, 0.02, 0.05, 0.3, r);
    });

    // 2. dasar tengkorak (sfenoid) + sinus
    const sfenoid = halus([[-2.9, 4.4], [0.6, 4.4], [0.4, 3.62], [-0.3, 3.35], [-1.0, 3.08], [-1.55, 2.62], [-2.2, 2.35], [-2.9, 2.6]], 60);
    isi(ctx, sfenoid, WARNA.tulang, WARNA.tulangGaris, 0.03);
    bintik(ctx, sfenoid, 260, WARNA.sumsum, 0.02, 0.05, 0.6, r);
    const sinus = halus([[-1.9, 3.95], [-0.4, 4.0], [-0.2, 3.55], [-1.0, 3.3], [-1.8, 3.15]], 40);
    isi(ctx, sinus, '#7a4a44', '#b99a78', 0.04);
    // tulang tipis atap hidung + tulang hidung
    ctx.strokeStyle = WARNA.tulang; ctx.lineWidth = 0.11;
    jalur(ctx, G.smooth([[0.4, 3.52], [1.4, 3.5], [2.4, 3.42], [3.1, 3.18]], 30), false); ctx.stroke();
    ctx.strokeStyle = WARNA.tulangGaris; ctx.lineWidth = 0.02; ctx.stroke();
    const tlgHidung = halus([[2.8, 4.4], [3.06, 4.4], [3.24, 3.86], [3.55, 3.3], [3.42, 3.22], [3.08, 3.72], [2.84, 4.1]], 40);
    isi(ctx, tlgHidung, WARNA.tulang, WARNA.tulangGaris, 0.025);
    const rawanHidung = halus([[3.55, 3.3], [4.05, 2.72], [4.45, 2.28], [4.58, 2.02], [4.46, 1.9], [4.3, 2.12], [3.9, 2.62], [3.42, 3.22]], 40);
    isi(ctx, rawanHidung, WARNA.rawan, WARNA.rawanGaris, 0.02);

    // 3. tulang belakang leher (C1–T1) + diskus + sumsum
    const kanal = [[-3.52, 4.4], [-3.85, 4.4], [-3.85, -5.3], [-3.52, -5.3]];
    isi(ctx, kanal, '#e9d5cf');
    isi(ctx, [[-3.6, 4.4], [-3.78, 4.4], [-3.78, -5.3], [-3.6, -5.3]], WARNA.saraf, '#cdb3aa', 0.015);
    const ruas = [[0.95, -0.55, true], [-0.72, -1.52], [-1.72, -2.52], [-2.72, -3.52], [-3.72, -4.52], [-4.72, -5.52], [-5.72, -5.6]];
    ruas.forEach((rv, i) => {
      const yt = rv[0], yb = rv[1];
      const body = halus([[-2.12, yt - 0.06], [-2.2, yt], [-3.18, yt + 0.02], [-3.26, yt - 0.1], [-3.26, yb + 0.1], [-3.16, yb], [-2.2, yb - 0.02], [-2.1, yb + 0.08], [-2.08, (yt + yb) / 2]], 60);
      isi(ctx, body, WARNA.tulang, WARNA.tulangGaris, 0.03);
      bintik(ctx, body, 180, WARNA.sumsum, 0.02, 0.05, 0.75, r);
      if (i < ruas.length - 1) {
        const yn = ruas[i + 1][0];
        isi(ctx, [[-2.12, yb - 0.02], [-3.24, yb], [-3.24, yn + 0.02], [-2.12, yn]], '#c9d6dc', '#9fb2bb', 0.015);
      }
      // prosesus di belakang (terpotong kanal)
      isi(ctx, halus([[-3.3, yt - 0.15], [-3.5, yt - 0.2], [-3.5, yb + 0.2], [-3.3, yb + 0.2]], 20), '#efe3c8', WARNA.tulangGaris, 0.02);
    });
    // dens (C2) & arkus anterior C1
    isi(ctx, halus([[-2.35, 0.95], [-2.45, 1.55], [-2.75, 1.62], [-2.95, 1.2], [-2.9, 0.95]], 30), WARNA.tulang, WARNA.tulangGaris, 0.03);
    elips(ctx, -2.1, 1.45, 0.2, 0.27); ctx.fillStyle = WARNA.tulang; ctx.fill(); ctx.strokeStyle = WARNA.tulangGaris; ctx.lineWidth = 0.03; ctx.stroke();

    // 4. otot konstriktor faring mengikuti dinding belakang
    const dinding = G.A.p.filter((p, i) => G.A.tag[i] === 'mukosa' && p[0] < -1.2 && p[1] < 2.2 && p[1] > -3.9);
    const konstriktor = pita(dinding, -0.3, 0);
    isi(ctx, konstriktor, WARNA.otot);
    serat(ctx, konstriktor, r, 'miring');
    // otot prevertebra (longus)
    isi(ctx, pita(dinding.map(p => [p[0] - 0.3, p[1]]), -0.12, 0), '#b8584c');
    // esofagus (di belakang trakea)
    const eso = [[-1.31, -3.95], [-1.3, -5.3], [-2.02, -5.3], [-2.0, -3.9], [-1.62, -3.8]];
    isi(ctx, eso, '#c75a50');
    serat(ctx, eso, r, 'datar');
    ctx.strokeStyle = '#7d2a26'; ctx.lineWidth = 0.035;
    jalur(ctx, [[-1.66, -4.1], [-1.66, -5.3]], false); ctx.stroke();
    ctx.strokeStyle = '#e99a93'; ctx.lineWidth = 0.05;
    jalur(ctx, [[-1.6, -4.1], [-1.6, -5.3]], false); ctx.stroke();
    // rawan krikoid bagian belakang
    isi(ctx, halus([[-1.34, -3.95], [-1.33, -4.7], [-1.5, -4.75], [-1.56, -4.0]], 24), WARNA.rawan, WARNA.rawanGaris, 0.02);

    // 5. rahang atas + akar gigi seri
    const maksila = halus([[-0.16, 1.49], [0.6, 1.57], [1.8, 1.62], [3.0, 1.65], [3.52, 1.6], [3.66, 1.42], [3.54, 1.16], [3.47, 0.96],
      [3.22, 0.9], [2.95, 1.02], [2.5, 1.2], [2.0, 1.37], [1.3, 1.42], [0.5, 1.37], [-0.14, 1.29]], 80);
    isi(ctx, maksila, WARNA.tulang, WARNA.tulangGaris, 0.03);
    bintik(ctx, maksila, 300, WARNA.sumsum, 0.02, 0.05, 0.7, r);
    const akarAtas = halus([[3.2, 0.76], [3.46, 0.8], [3.5, 1.1], [3.45, 1.42], [3.37, 1.45], [3.28, 1.1]], 30);
    isi(ctx, akarAtas, '#fbf6ea', '#c9bc9a', 0.02);
    ctx.strokeStyle = '#e7a9a0'; ctx.lineWidth = 0.035;
    jalur(ctx, [[3.33, 0.82], [3.37, 1.1], [3.4, 1.38]], false); ctx.stroke();

    // 6. rahang bawah (simfisis) + akar gigi seri bawah
    const mandibula = halus([[3.2, -0.95], [3.46, -1.0], [3.56, -1.26], [3.72, -1.46], [3.92, -1.82], [3.95, -2.3], [3.72, -2.6],
      [3.2, -2.72], [2.86, -2.55], [2.8, -2.05], [2.95, -1.5], [3.08, -1.15]], 70);
    isi(ctx, mandibula, WARNA.tulang, WARNA.tulangGaris, 0.035);
    bintik(ctx, mandibula, 320, WARNA.sumsum, 0.02, 0.05, 0.75, r);
    const akarBawah = halus([[3.21, -0.94], [3.43, -0.98], [3.41, -1.45], [3.33, -1.78], [3.26, -1.5]], 30);
    isi(ctx, akarBawah, '#fbf6ea', '#c9bc9a', 0.02);
    ctx.strokeStyle = '#e7a9a0'; ctx.lineWidth = 0.03;
    jalur(ctx, [[3.32, -1.0], [3.33, -1.3], [3.33, -1.6]], false); ctx.stroke();

    // 7. otot dasar mulut (geniohioid) + tulang hioid
    const genio = halus([[2.85, -2.25], [1.8, -2.46], [0.9, -2.63], [0.28, -2.76], [0.24, -2.98], [0.9, -2.88], [1.8, -2.72], [2.85, -2.5]], 60);
    isi(ctx, genio, WARNA.otot);
    serat(ctx, genio, r, 'datar');
    ctx.strokeStyle = '#b24a41'; ctx.lineWidth = 0.05;
    jalur(ctx, G.smooth([[3.0, -2.62], [2.0, -2.86], [1.0, -2.98], [0.3, -3.08]], 30), false); ctx.stroke();
    elips(ctx, 0.05, -2.92, 0.22, 0.15, -0.2);
    ctx.fillStyle = WARNA.tulang; ctx.fill(); ctx.strokeStyle = WARNA.tulangGaris; ctx.lineWidth = 0.03; ctx.stroke();

    // 8. laring: tiroid, krikoid, cincin trakea, otot leher depan
    const tali = halus([[0.3, -3.05], [0.72, -3.42], [0.66, -4.5], [0.6, -5.3], [0.3, -5.3], [0.33, -4.5], [0.38, -3.6]], 50);
    isi(ctx, tali, '#c85a4e'); serat(ctx, tali, r, 'tegak');
    const tiroid = halus([[-0.54, -3.2], [-0.18, -3.26], [0.12, -3.52], [0.26, -3.92], [0.14, -4.26], [-0.34, -4.3], [-0.56, -4.08]], 50);
    isi(ctx, tiroid, WARNA.rawan, WARNA.rawanGaris, 0.025);
    elips(ctx, -0.4, -4.62, 0.2, 0.15); ctx.fillStyle = WARNA.rawan; ctx.fill(); ctx.strokeStyle = WARNA.rawanGaris; ctx.lineWidth = 0.02; ctx.stroke();
    for (let y = -4.98; y > -5.3; y -= 0.34) {
      isi(ctx, halus([[-0.6, y + 0.1], [-0.4, y + 0.1], [-0.36, y], [-0.4, y - 0.1], [-0.6, y - 0.1]], 20), WARNA.rawan, WARNA.rawanGaris, 0.015);
    }
    // lipatan pita suara (penanda di dinding depan)
    ctx.fillStyle = '#e8a19a';
    jalur(ctx, [[-0.6, -3.62], [-0.72, -3.75], [-0.6, -3.86]]); ctx.fill();

    // 9. lapisan mukosa & kulit mengikuti kontur
    potongan.forEach(K => {
      const src = K === G.A.p ? G.A : G.B;
      tepi(ctx, src, 'mukosa', WARNA.mukosa, 0.13);
      tepi(ctx, src, 'mukosa', WARNA.mukosaGelap, 0.025);
      tepi(ctx, src, 'kulit', WARNA.kulit, 0.2);
      tepi(ctx, src, 'kulit', WARNA.kulitGaris, 0.03);
    });
    return cv;
  }

  function tepi(ctx, K, tag, warna, lebar) {
    ctx.strokeStyle = warna; ctx.lineWidth = lebar;
    const n = K.p.length;
    ctx.beginPath();
    let aktif = false;
    for (let i = 0; i <= n; i++) {
      const j = i % n;
      if (K.tag[j] === tag) {
        if (!aktif) { const pj = K.p[(j - 1 + n) % n]; ctx.moveTo(pj[0], pj[1]); aktif = true; }
        ctx.lineTo(K.p[j][0], K.p[j][1]);
      } else if (aktif) { ctx.lineTo(K.p[j][0], K.p[j][1]); aktif = false; }
    }
    ctx.stroke();
  }

  function serat(ctx, pts, r, arah) {
    ctx.save(); jalur(ctx, pts); ctx.clip();
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    pts.forEach(p => { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); });
    const n = Math.round(((x1 - x0) + (y1 - y0)) * 30);
    for (let i = 0; i < n; i++) {
      const x = x0 + r() * (x1 - x0), y = y0 + r() * (y1 - y0), L = 0.15 + r() * 0.35;
      let dx = 1, dy = 0;
      if (arah === 'tegak') { dx = 0.08; dy = 1; } else if (arah === 'miring') { dx = 0.35; dy = 1; }
      const m = Math.hypot(dx, dy); dx /= m; dy /= m;
      ctx.strokeStyle = r() < 0.5 ? 'rgba(236,128,114,0.45)' : 'rgba(128,36,30,0.35)';
      ctx.lineWidth = 0.012 + r() * 0.015;
      ctx.beginPath(); ctx.moveTo(x - dx * L / 2, y - dy * L / 2); ctx.lineTo(x + dx * L / 2, y + dy * L / 2); ctx.stroke();
    }
    ctx.restore();
  }

  /* ---------- tekstur tutup organ lunak (ruang UV s,t) ---------- */
  function kanvasUV(w, h) {
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const ctx = cv.getContext('2d', { willReadFrequently: true }); // kanvas CPU (lihat lukisPotongan)
    ctx.setTransform(w, 0, 0, -h, 0, h); // (s,t) ∈ [0,1]², t ke atas
    ctx.lineCap = 'round';
    return { cv, ctx };
  }

  function lukisLidah() {
    const { cv, ctx } = kanvasUV(1024, 512);
    const r = rng(21);
    let g = ctx.createLinearGradient(0, 0, 0, 1);
    g.addColorStop(0, '#a93b33'); g.addColorStop(0.55, '#c24a41'); g.addColorStop(0.88, '#cd5449'); g.addColorStop(1, '#d4665d');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 1, 1);
    // serat genioglosus: kipas dari depan-bawah ke punggung lidah
    for (let k = 0; k < 150; k++) {
      const sEnd = 0.02 + (k / 150) * 0.95;
      const x0 = 0.7 + (r() - 0.5) * 0.08, y0 = 0.02;
      const cx = (x0 + sEnd) / 2 + (sEnd < 0.5 ? -0.05 : 0.02), cy = 0.35 + r() * 0.1;
      ctx.strokeStyle = r() < 0.55 ? 'rgba(232,120,104,0.42)' : 'rgba(120,30,26,0.28)';
      ctx.lineWidth = 0.0025 + r() * 0.0025;
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(cx, cy, sEnd, 0.9); ctx.stroke();
    }
    // serat longitudinal superior
    for (let k = 0; k < 26; k++) {
      const y = 0.8 + r() * 0.12;
      ctx.strokeStyle = k % 2 ? 'rgba(240,140,122,0.45)' : 'rgba(126,34,28,0.3)';
      ctx.lineWidth = 0.004;
      ctx.beginPath(); ctx.moveTo(0.02, y); ctx.bezierCurveTo(0.3, y + 0.02, 0.7, y - 0.02, 0.99, y); ctx.stroke();
    }
    // serat transversal (terpotong melintang) = bintik
    for (let k = 0; k < 900; k++) {
      const x = 0.05 + r() * 0.85, y = 0.25 + r() * 0.55;
      ctx.fillStyle = r() < 0.5 ? 'rgba(245,160,140,0.35)' : 'rgba(110,26,22,0.25)';
      elips(ctx, x, y, 0.0025, 0.005); ctx.fill();
    }
    // mukosa punggung lidah + papila
    ctx.fillStyle = '#e17f76'; ctx.fillRect(0, 0.94, 1, 0.06);
    for (let k = 0; k < 400; k++) {
      ctx.fillStyle = r() < 0.5 ? 'rgba(250,180,170,0.7)' : 'rgba(170,60,55,0.5)';
      elips(ctx, r(), 0.955 + r() * 0.045, 0.002, 0.006); ctx.fill();
    }
    // septum/jaringan di dasar
    g = ctx.createLinearGradient(0, 0, 0, 0.07);
    g.addColorStop(0, '#e9b86c'); g.addColorStop(1, 'rgba(233,184,108,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 1, 0.07);
    return cv;
  }

  function lukisBibir() {
    const { cv, ctx } = kanvasUV(512, 512);
    const r = rng(33);
    // t=0 sisi dalam (mukosa), t=1 sisi luar (kulit); s=1 tepi bebas
    let g = ctx.createLinearGradient(0, 0, 0, 1);
    g.addColorStop(0, '#e98f89'); g.addColorStop(0.12, '#d0685f'); g.addColorStop(0.2, '#c34d43');
    g.addColorStop(0.62, '#c14b42'); g.addColorStop(0.72, '#efc47a'); g.addColorStop(0.86, '#f0c880'); g.addColorStop(0.9, '#eab08a'); g.addColorStop(1, '#e6a882');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 1, 1);
    // otot orbikularis terpotong melintang = bintik
    for (let k = 0; k < 1300; k++) {
      const x = 0.05 + r() * 0.85, y = 0.18 + r() * 0.46;
      ctx.fillStyle = r() < 0.5 ? 'rgba(240,150,132,0.5)' : 'rgba(110,26,22,0.3)';
      elips(ctx, x, y, 0.004, 0.004); ctx.fill();
    }
    // merah bibir di dekat tepi bebas
    g = ctx.createLinearGradient(0.7, 0, 1, 0);
    g.addColorStop(0, 'rgba(214,96,92,0)'); g.addColorStop(0.45, 'rgba(214,96,92,0.9)'); g.addColorStop(1, 'rgba(206,86,84,1)');
    ctx.fillStyle = g; ctx.fillRect(0.7, 0, 0.3, 1);
    return cv;
  }

  function lukisVelum() {
    const { cv, ctx } = kanvasUV(512, 256);
    const r = rng(45);
    const g = ctx.createLinearGradient(0, 0, 0, 1);
    g.addColorStop(0, '#e48c86'); g.addColorStop(0.18, '#c4544b'); g.addColorStop(0.8, '#bd4a41'); g.addColorStop(1, '#e48c86');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 1, 1);
    for (let k = 0; k < 60; k++) {
      const y = 0.25 + r() * 0.5;
      ctx.strokeStyle = r() < 0.5 ? 'rgba(236,128,114,0.5)' : 'rgba(120,32,26,0.35)'; ctx.lineWidth = 0.006;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.bezierCurveTo(0.3, y + 0.05, 0.6, y - 0.05, 0.95, 0.5); ctx.stroke();
    }
    return cv;
  }

  function lukisEpiglotis() {
    const { cv, ctx } = kanvasUV(256, 128);
    const g = ctx.createLinearGradient(0, 0, 0, 1);
    g.addColorStop(0, '#e1847d'); g.addColorStop(0.3, '#e9a79c'); g.addColorStop(0.42, '#f1e2c6'); g.addColorStop(0.58, '#efdcbf'); g.addColorStop(0.7, '#e9a79c'); g.addColorStop(1, '#e1847d');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 1, 1);
    return cv;
  }

  return { lukisPotongan, lukisLidah, lukisBibir, lukisVelum, lukisEpiglotis, WARNA };
})();
