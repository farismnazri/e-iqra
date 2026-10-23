// Adapted from Makhraj 3D by ms@ebooksunnah.com, https://makhraj3d.ebooksunnah.com/
// Owner-supplied source, 23 October 2026. Reuse terms require confirmation before release.
// See MAKHRAJ_3D.md. Internal anatomical keys retain upstream names for pose fidelity.
import * as THREE from 'three'
import { geometry } from './geometry.js'
import { textures as Tekstur } from './textures.js'
/* ============================================================
   anatomi.js — Model 3D potongan sagital kepala (prosedural).
   - Blok potongan (A,B,C) dengan rongga yang benar-benar dalam
   - Organ lunak (lidah, bibir, velum, epiglotis) = mesh
     bertopologi tetap yang dideformasi tiap frame (pegas halus)
   - Gigi lengkap satu lengkung (sisi jauh), gusi, konka hidung
   Model dicerminkan (scale.x = -1) → wajah menghadap KIRI,
   sama seperti ilustrasi ebook.
   ============================================================ */
export const anatomy = (function () {
  'use strict';
  const G = geometry;
  const D = 2.6;          // kedalaman blok potongan
  const LENGKUNG = 0.085; // lengkung lateral: x -= k·z²
  const bend = z => -LENGKUNG * z * z;
  const clamp01 = v => v < 0 ? 0 : v > 1 ? 1 : v;
  const smoothstep = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
  const lerp = (a, b, t) => a + (b - a) * t;

  /* ---------- tambalan shader: atribut 'glow' → emisif ---------- */
  function pasangGlow(mat, amp) {
    amp = amp || { value: 1 }; // objek amp dipakai bersama bila material diganti (lihat materialMutu)
    mat.userData.glowAmp = amp;
    mat.onBeforeCompile = sh => {
      sh.uniforms.uGlowAmp = amp;
      sh.vertexShader = 'attribute vec3 glow;\nvarying vec3 vGlow;\n' +
        sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvGlow = glow;');
      sh.fragmentShader = 'uniform float uGlowAmp;\nvarying vec3 vGlow;\n' +
        sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += vGlow * uGlowAmp;');
    };
    mat.customProgramCacheKey = () => 'glow';
    return mat;
  }

  /* ---------- tingkat mutu material ----------
     'penuh'  : MeshPhysicalMaterial (lapisan clearcoat/sheen) — komputer.
     'hemat'  : MeshStandardMaterial — HP & tablet. Shader-nya jauh lebih kecil; GPU HP kelas
                menengah (driver Adreno/Mali tertentu) bisa crash saat mengompilasi shader Physical
                yang besar, sehingga konteks WebGL hilang dan kanvas 3D tampil putih.
     'ringan' : MeshLambertMaterial — cadangan paling aman bila GPU tetap bermasalah.
     Material hanya bisa diturunkan (penuh → hemat → ringan), tidak dinaikkan.            */
  const TINGKAT = { ringan: 0, hemat: 1, penuh: 2 };
  function salinDasar(asal) {
    const p = { color: asal.color.clone(), map: asal.map, vertexColors: asal.vertexColors, side: asal.side,
      transparent: asal.transparent, opacity: asal.opacity };
    if (asal.emissive) p.emissive = asal.emissive.clone();
    return p;
  }
  function materialMutu(asal, tingkat) {
    if (!asal || !asal.isMeshStandardMaterial) return asal; // Physical juga bertanda isMeshStandardMaterial
    let baru = null;
    if (tingkat === 'ringan') baru = new THREE.MeshLambertMaterial(salinDasar(asal));
    else if (tingkat === 'hemat' && asal.isMeshPhysicalMaterial)
      baru = new THREE.MeshStandardMaterial(Object.assign(salinDasar(asal), { roughness: asal.roughness, metalness: asal.metalness }));
    if (!baru) return asal;
    baru.name = asal.name;
    if (asal.defines && 'DECODE_VIDEO_TEXTURE' in asal.defines) baru.defines = Object.assign({}, baru.defines, { DECODE_VIDEO_TEXTURE: '' });
    if (asal.userData.glowAmp) pasangGlow(baru, asal.userData.glowAmp);
    return baru;
  }

  /* ---------- blok potongan: tutup bertekstur + dinding ---------- */
  const WARNA_DINDING = {
    kulit: new THREE.Color('#e2a47f'), mukosa: new THREE.Color('#d9766e'), potong: new THREE.Color('#e7bf78')
  };
  const Z_CINCIN = [0, -0.04, -0.14, -0.32, -0.58, -0.92, -1.32, -1.78, -2.22, -D];

  function blok(K, matTutup, matDinding) {
    let pts = K.p, tags = K.tag;
    if (G.luas(pts) < 0) { pts = pts.slice().reverse(); tags = tags.slice().reverse(); }
    const n = pts.length, B = G.BATAS;
    // tutup (bidang potong z=0)
    const tri = THREE.ShapeUtils.triangulateShape(pts.map(p => new THREE.Vector2(p[0], p[1])), []);
    const pos = [], uv = [], nor = [];
    pts.forEach(p => {
      pos.push(p[0], p[1], 0); nor.push(0, 0, 1);
      uv.push((p[0] - B.x0) / (B.x1 - B.x0), (p[1] - B.y0) / (B.y1 - B.y0));
    });
    const idx = [];
    tri.forEach(t => idx.push(t[0], t[1], t[2]));
    const gT = new THREE.BufferGeometry();
    gT.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    gT.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    gT.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    gT.setIndex(idx);
    const tutup = new THREE.Mesh(gT, matTutup);
    tutup.receiveShadow = true;

    // dinding (ekstrusi ke belakang, dengan lengkung & AO warna)
    const R = Z_CINCIN.length, wp = [], wc = [], wi = [];
    for (let i = 0; i < n; i++) {
      const c0 = WARNA_DINDING[tags[i]] || WARNA_DINDING.potong;
      for (let k = 0; k < R; k++) {
        const z = Z_CINCIN[k];
        wp.push(pts[i][0] + bend(z), pts[i][1], z);
        const d = -z / D;
        const ao = tags[i] === 'mukosa' ? 1 - 0.62 * Math.pow(d, 0.8) : tags[i] === 'kulit' ? 1 - 0.3 * d : 1 - 0.25 * d;
        const tepi = k === 0 ? 1.08 : 1;
        wc.push(c0.r * ao * tepi, c0.g * ao * tepi, c0.b * ao * tepi);
      }
    }
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      for (let k = 0; k < R - 1; k++) {
        const a = i * R + k, b = j * R + k, c = i * R + k + 1, d = j * R + k + 1;
        wi.push(a, c, b, b, c, d);
      }
    }
    const gW = new THREE.BufferGeometry();
    gW.setAttribute('position', new THREE.Float32BufferAttribute(wp, 3));
    gW.setAttribute('color', new THREE.Float32BufferAttribute(wc, 3));
    gW.setIndex(wi);
    gW.computeVertexNormals();
    const dinding = new THREE.Mesh(gW, matDinding);
    dinding.receiveShadow = true; dinding.castShadow = true;
    return [tutup, dinding];
  }

  /* ---------- organ lunak deformable ("pod") ----------
     Didefinisikan oleh kurva atas & bawah (N titik, s=0 pangkal → s=1 ujung,
     titik terakhir sama). Volume: penampang superelips ke arah -z.     */
  function Pod(o) {
    this.N = o.N; this.M = o.M; this.K = o.K;
    this.W = o.W; this.p = o.p || 3; this.bendK = o.bendK != null ? o.bendK : LENGKUNG;
    this.zDepan = o.zDepan || 0.004;
    const N = this.N, M = this.M, K = this.K;
    // kedalaman (w) dipadatkan di tepi lateral
    this.ws = []; for (let k = 0; k <= K; k++) this.ws.push(Math.sin((k / K) * Math.PI / 2));
    this.sh = this.ws.map(w => Math.pow(Math.max(0, 1 - Math.pow(w, this.p)), 1 / this.p));
    // --- tutup ---
    const nc = N * (M + 1);
    this.capPos = new Float32Array(nc * 3);
    const capUV = new Float32Array(nc * 2), capNor = new Float32Array(nc * 3);
    this.capPar = [];
    for (let i = 0; i < N; i++) for (let j = 0; j <= M; j++) {
      const v = i * (M + 1) + j;
      capUV[v * 2] = i / (N - 1); capUV[v * 2 + 1] = j / M; capNor[v * 3 + 2] = 1;
      this.capPar.push([i / (N - 1), j / M, 0]);
    }
    const capIdx = [];
    for (let i = 0; i < N - 1; i++) for (let j = 0; j < M; j++) {
      const a = i * (M + 1) + j, b = (i + 1) * (M + 1) + j, c = a + 1, d = b + 1;
      capIdx.push(a, b, c, c, b, d);
    }
    this.gCap = new THREE.BufferGeometry();
    this.gCap.setAttribute('position', new THREE.BufferAttribute(this.capPos, 3));
    this.gCap.setAttribute('normal', new THREE.BufferAttribute(capNor, 3));
    this.gCap.setAttribute('uv', new THREE.BufferAttribute(capUV, 2));
    this.capGlow = new Float32Array(nc * 3);
    this.gCap.setAttribute('glow', new THREE.BufferAttribute(this.capGlow, 3));
    this.gCap.setIndex(capIdx);
    this._capIdx = capIdx;
    // --- selubung: atas (N×(K+1)), bawah (N×(K+1)), pangkal ((M+1)×(K+1)) ---
    const nt = N * (K + 1), nr = (M + 1) * (K + 1), nh = nt * 2 + nr;
    this.hullPos = new Float32Array(nh * 3);
    this.hullCol = new Float32Array(nh * 3);
    this.hullGlow = new Float32Array(nh * 3);
    this.hullPar = [];
    this.offTop = 0; this.offBot = nt; this.offRoot = nt * 2;
    for (let i = 0; i < N; i++) for (let k = 0; k <= K; k++) this.hullPar.push([i / (N - 1), 1, this.ws[k]]);
    for (let i = 0; i < N; i++) for (let k = 0; k <= K; k++) this.hullPar.push([i / (N - 1), 0, this.ws[k]]);
    for (let j = 0; j <= M; j++) for (let k = 0; k <= K; k++) this.hullPar.push([0, j / M, this.ws[k]]);
    const hi = [];
    const quadGrid = (off, A_, B_) => {
      const out = [];
      for (let a = 0; a < A_ - 1; a++) for (let b = 0; b < B_ - 1; b++) {
        const p0 = off + a * B_ + b, p1 = off + (a + 1) * B_ + b, p2 = p0 + 1, p3 = p1 + 1;
        out.push(p0, p1, p2, p2, p1, p3);
      }
      return out;
    };
    this._triTop = quadGrid(this.offTop, N, K + 1);
    this._triBot = quadGrid(this.offBot, N, K + 1);
    this._triRoot = quadGrid(this.offRoot, M + 1, K + 1);
    this.gHull = new THREE.BufferGeometry();
    this.gHull.setAttribute('position', new THREE.BufferAttribute(this.hullPos, 3));
    this.gHull.setAttribute('color', new THREE.BufferAttribute(this.hullCol, 3));
    this.gHull.setAttribute('glow', new THREE.BufferAttribute(this.hullGlow, 3));
    this.capMesh = new THREE.Mesh(this.gCap, o.matCap);
    this.hullMesh = new THREE.Mesh(this.gHull, o.matHull);
    this.capMesh.frustumCulled = this.hullMesh.frustumCulled = false;
    this.hullMesh.castShadow = true; this.hullMesh.receiveShadow = true; this.capMesh.receiveShadow = true;
    this.warnaFn = o.warna;
    this.group = new THREE.Group();
    this.group.add(this.capMesh); this.group.add(this.hullMesh);
    this._orientasiSiap = false;
  }
  Pod.prototype.update = function (top, bot) {
    const N = this.N, M = this.M, K = this.K, cp = this.capPos, hp = this.hullPos;
    for (let i = 0; i < N; i++) {
      const t = top[i], b = bot[i];
      for (let j = 0; j <= M; j++) {
        const f = j / M, v = (i * (M + 1) + j) * 3;
        cp[v] = b[0] + (t[0] - b[0]) * f; cp[v + 1] = b[1] + (t[1] - b[1]) * f; cp[v + 2] = this.zDepan;
      }
      const mx = (t[0] + b[0]) / 2, my = (t[1] + b[1]) / 2, W = this.W(i / (N - 1));
      for (let k = 0; k <= K; k++) {
        const sh = this.sh[k], z = -W * this.ws[k], bx = -this.bendK * z * z;
        let v = (this.offTop + i * (K + 1) + k) * 3;
        hp[v] = mx + (t[0] - mx) * sh + bx; hp[v + 1] = my + (t[1] - my) * sh; hp[v + 2] = z;
        v = (this.offBot + i * (K + 1) + k) * 3;
        hp[v] = mx + (b[0] - mx) * sh + bx; hp[v + 1] = my + (b[1] - my) * sh; hp[v + 2] = z;
      }
    }
    const t0 = top[0], b0 = bot[0], mx = (t0[0] + b0[0]) / 2, my = (t0[1] + b0[1]) / 2, W0 = this.W(0);
    for (let j = 0; j <= M; j++) {
      const f = j / M, px = b0[0] + (t0[0] - b0[0]) * f, py = b0[1] + (t0[1] - b0[1]) * f;
      for (let k = 0; k <= K; k++) {
        const sh = this.sh[k], z = -W0 * this.ws[k];
        const v = (this.offRoot + j * (K + 1) + k) * 3;
        hp[v] = mx + (px - mx) * sh - this.bendK * z * z; hp[v + 1] = my + (py - my) * sh; hp[v + 2] = z;
      }
    }
    if (!this._orientasiSiap) this._siapkanOrientasi(top, bot);
    this.gCap.attributes.position.needsUpdate = true;
    this.gHull.attributes.position.needsUpdate = true;
    this.gHull.computeVertexNormals();
  };
  Pod.prototype._siapkanOrientasi = function (top, bot) {
    const N = this.N, M = this.M, K = this.K, cp = this.capPos, hp = this.hullPos;
    const V = (arr, i) => new THREE.Vector3(arr[i * 3], arr[i * 3 + 1], arr[i * 3 + 2]);
    const flipIf = (tri, ok) => { if (!ok) for (let q = 0; q < tri.length; q += 3) { const t = tri[q + 1]; tri[q + 1] = tri[q + 2]; tri[q + 2] = t; } return tri; };
    const nrm = (arr, tri, q) => {
      const a = V(arr, tri[q]), b = V(arr, tri[q + 1]), c = V(arr, tri[q + 2]);
      return b.sub(a).cross(c.sub(a));
    };
    // tutup: normal harus +z. Ambil segitiga di tengah.
    const qc = (Math.floor((N - 1) / 2) * M + Math.floor(M / 2)) * 6;
    flipIf(this._capIdx, nrm(cp, this._capIdx, qc).z > 0);
    this.gCap.setIndex(this._capIdx);
    const im = Math.floor(N / 2), km = Math.floor(K / 3);
    const mid = [(top[im][0] + bot[im][0]) / 2, (top[im][1] + bot[im][1]) / 2];
    const qT = (im * K + km) * 6;
    const nT = nrm(hp, this._triTop, qT);
    flipIf(this._triTop, nT.x * (top[im][0] - mid[0]) + nT.y * (top[im][1] - mid[1]) > 0);
    const nB = nrm(hp, this._triBot, qT);
    flipIf(this._triBot, nB.x * (bot[im][0] - mid[0]) + nB.y * (bot[im][1] - mid[1]) > 0);
    const mid0 = [(top[0][0] + bot[0][0]) / 2, (top[0][1] + bot[0][1]) / 2];
    const mid1 = [(top[2][0] + bot[2][0]) / 2, (top[2][1] + bot[2][1]) / 2];
    const nR = nrm(hp, this._triRoot, (Math.floor(M / 2) * K + km) * 6);
    flipIf(this._triRoot, nR.x * (mid0[0] - mid1[0]) + nR.y * (mid0[1] - mid1[1]) > 0);
    this.gHull.setIndex(this._triTop.concat(this._triBot, this._triRoot));
    // warna selubung (statis)
    const col = new THREE.Color();
    this.hullPar.forEach((pr, v) => {
      this.warnaFn(pr[0], pr[1], pr[2], col);
      this.hullCol[v * 3] = col.r; this.hullCol[v * 3 + 1] = col.g; this.hullCol[v * 3 + 2] = col.b;
    });
    this.gHull.attributes.color.needsUpdate = true;
    this._orientasiSiap = true;
  };
  /* sorotan: fn(s,t,w) → [r,g,b] atau null */
  Pod.prototype.setGlow = function (fn) {
    const put = (arr, par) => {
      for (let v = 0; v < par.length; v++) {
        const c = fn ? fn(par[v][0], par[v][1], par[v][2]) : null;
        arr[v * 3] = c ? c[0] : 0; arr[v * 3 + 1] = c ? c[1] : 0; arr[v * 3 + 2] = c ? c[2] : 0;
      }
    };
    put(this.capGlow, this.capPar); put(this.hullGlow, this.hullPar);
    this.gCap.attributes.glow.needsUpdate = true; this.gHull.attributes.glow.needsUpdate = true;
  };

  /* ---------- pegas titik kendali (redaman kritis) ---------- */
  function Pegas(awal, k) {
    this.x = awal.map(p => p.slice()); this.v = awal.map(() => [0, 0]);
    this.t = awal.map(p => p.slice()); this.k = k || 90;
  }
  Pegas.prototype.target = function (arr) { this.t = arr.map(p => p.slice()); };
  Pegas.prototype.step = function (dt) {
    const k = this.k, c = 2 * Math.sqrt(k);
    let gerak = 0;
    const h = Math.min(dt, 1 / 30);
    for (let i = 0; i < this.x.length; i++) for (let d = 0; d < 2; d++) {
      const a = k * (this.t[i][d] - this.x[i][d]) - c * this.v[i][d];
      this.v[i][d] += a * h; this.x[i][d] += this.v[i][d] * h;
      gerak += Math.abs(this.v[i][d]) + Math.abs(this.t[i][d] - this.x[i][d]);
    }
    return gerak;
  };
  Pegas.prototype.snap = function () { this.x = this.t.map(p => p.slice()); this.v = this.x.map(() => [0, 0]); };

  /* ---------- tumbukan: dorong titik keluar dari batas ---------- */
  function dorongKeluar(p, poly, gap) {
    // poly berurutan sehingga normal "ke rongga" = rotasi CCW arah segmen
    let best = null, bd = 1e9;
    for (let i = 0; i < poly.length - 1; i++) {
      const a = poly[i], b = poly[i + 1];
      const dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy;
      let u = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L2;
      if (u < 0 && i === 0) continue;
      if (u > 1 && i === poly.length - 2) continue;
      u = clamp01(u);
      const qx = a[0] + dx * u, qy = a[1] + dy * u, d = Math.hypot(p[0] - qx, p[1] - qy);
      if (d < bd) {
        const L = Math.sqrt(L2);
        bd = d; best = { qx, qy, nx: -dy / L, ny: dx / L };
      }
    }
    if (!best) return false;
    const s = (p[0] - best.qx) * best.nx + (p[1] - best.qy) * best.ny;
    if (s < gap && bd < 0.9) { p[0] = best.qx + best.nx * gap; p[1] = best.qy + best.ny * gap; return true; }
    return false;
  }

  /* ---------- pose lidah ---------- */
  const POSE_LIDAH = {
    istirahat: {},
    'ujung-pangkal': { 8: [3.16, 0.66], 7: [2.92, 0.74], 6: [2.35, 0.74], 5: [1.5, 0.72] },
    'ujung-ujung': { 8: [3.5, -0.14], 7: [3.18, -0.06], 6: [2.5, 0.34], 5: [1.5, 0.62] },
    'ujung-gusi-ra': { 8: [2.98, 0.9], 7: [2.7, 0.98], 6: [2.2, 0.76], 5: [1.45, 0.62] },
    'ujung-gusi-nun': { 8: [2.97, 0.9], 7: [2.68, 0.9], 6: [2.2, 0.7], 5: [1.45, 0.66] },
    lam: { 8: [3.08, 0.82], 7: [2.8, 0.98], 6: [2.3, 0.98], 5: [1.5, 0.72] },
    bawah: { 8: [3.22, -0.74], 7: [3.02, 0.14], 6: [2.62, 0.86], 5: [1.6, 0.72] },
    'tengah-sentuh': { 4: [0.6, 1.12], 5: [1.4, 1.5], 6: [2.2, 1.08], 7: [2.8, 0.32], 8: [3.1, -0.36] },
    'tengah-dekat': { 4: [0.6, 1.0], 5: [1.4, 1.2], 6: [2.2, 0.96], 7: [2.8, 0.22], 8: [3.1, -0.38] },
    'pangkal-qaf': { 2: [-0.82, 0.42], 3: [-0.42, 1.28], 4: [0.45, 0.96], 5: [1.4, 0.72] },
    'pangkal-kaf': { 2: [-0.74, 0.2], 3: [-0.3, 1.05], 4: [0.3, 1.4], 5: [1.3, 0.9] },
    'tenggorokan-atas': { 1: [-0.9, -1.2], 2: [-1.08, 0.66], 3: [-0.58, 1.08], 4: [0.4, 0.88], 5: [1.4, 0.7] },
    faring: { 1: [-0.92, -1.3], 2: [-0.84, -0.3] },
    dhad: { 3: [-0.22, 0.92], 4: [0.6, 1.22], 5: [1.5, 1.3], 6: [2.35, 1.06], 7: [2.9, 0.45], 8: [3.16, -0.26] },
    alif: { 3: [-0.25, 0.2], 4: [0.55, 0.42], 5: [1.45, 0.45], 6: [2.25, 0.3], 7: [2.85, -0.1], 8: [3.12, -0.44] },
    wawu: { 2: [-0.76, 0.2], 3: [-0.3, 0.86], 4: [0.5, 0.8], 5: [1.45, 0.66] }
  };

  /* batas atas dinamis: gigi seri → langit-langit keras → velum (bawah) */
  function batasAtas(velumBawah) {
    return G.BATAS_ATAS.concat(velumBawah.slice(1));
  }
  function yBatas(poly, x) {
    // y batas atas pada x (ambil y terendah jika ada beberapa perpotongan)
    let y = null;
    for (let i = 0; i < poly.length - 1; i++) {
      const a = poly[i], b = poly[i + 1];
      if ((x - a[0]) * (x - b[0]) <= 0 && a[0] !== b[0]) {
        const yy = a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0]);
        if (y === null || yy < y) y = yy;
      }
    }
    return y;
  }

  function hitungKendaliLidah(pr, velumBawah) {
    const P = G.LIDAH_ISTIRAHAT.map(p => p.slice());
    const base = POSE_LIDAH[pr.bentuk || 'istirahat'] || {};
    Object.keys(base).forEach(k => { P[k] = base[k].slice(); });
    const batas = batasAtas(velumBawah);
    const tebal = pr.tebal || 0, istila = pr.istila || 0, ithbaq = pr.ithbaq || 0;
    if (istila) {
      P[2][0] -= 0.06 * istila; P[2][1] += 0.3 * istila;
      P[3][1] += 0.38 * istila; P[4][1] += 0.18 * istila;
      P[1][0] -= 0.06 * istila;
    }
    if (ithbaq) {
      [4, 5, 6].forEach(i => {
        const yb = yBatas(batas, P[i][0]);
        if (yb !== null) P[i][1] = lerp(P[i][1], yb - 0.07, ithbaq);
      });
    }
    if (tebal) {
      P[4][1] -= 0.3 * tebal; P[5][1] -= 0.34 * tebal;
      P[3][1] += 0.32 * tebal; P[2][0] -= 0.16 * tebal; P[2][1] += 0.28 * tebal;
      P[1][0] -= 0.17 * tebal;
    }
    if (pr.getar) { P[8][1] += pr.getar; P[7][1] += pr.getar * 0.4; }
    if (pr.turun) { for (let i = 3; i <= 8; i++) P[i][1] -= pr.turun * (i >= 7 ? 0.5 : 1); }
    return P;
  }

  /* ---------- geometri gigi ---------- */
  function gigiBubut(w, h, d, runcing) {
    const prof = [[0.001, -0.02], [0.28, 0.0], [0.44, 0.1], [0.5, 0.34], [0.47, 0.62], [0.4, 0.82], [0.33, 0.95], [0.001, 0.97]];
    if (runcing) { prof[0] = [0.001, -0.12]; prof[1] = [0.2, -0.02]; }
    const g = new THREE.LatheGeometry(prof.map(p => new THREE.Vector2(p[0], p[1])), 28);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      let x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
      const r = Math.hypot(x, z), th = Math.atan2(z, x);
      if (!runcing && y < 0.12) y += 0.06 * (1 - Math.min(1, r / 0.45)) * 1.2 - 0.035 * Math.abs(Math.cos(2 * th)) * (r / 0.5);
      pos.setXYZ(i, x * w, y * h, z * d);
    }
    g.computeVertexNormals();
    return g;
  }

  function gigiEkstrusi(profil, tebal) {
    const sh = new THREE.Shape(profil.map(p => new THREE.Vector2(p[0], p[1])));
    const g = new THREE.ExtrudeGeometry(sh, { depth: tebal, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.035, bevelSegments: 4, curveSegments: 16 });
    g.translate(0, 0, -tebal - 0.07);
    g.computeVertexNormals();
    return g;
  }

  /* ---------- pita (ribbon) sepanjang lengkung ---------- */
  function pitaLengkung(titikAtas, titikBawah, warna) {
    const n = titikAtas.length, pos = [], idx = [];
    for (let i = 0; i < n; i++) { pos.push(...titikAtas[i], ...titikBawah[i]); }
    for (let i = 0; i < n - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 2, a + 1, a + 3); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: warna, roughness: 0.55, side: THREE.DoubleSide }));
    m.receiveShadow = true;
    return m;
  }

  /* ============================================================ */
  function build(scene, opsi) {
    opsi = opsi || {};
    const model = new THREE.Group();
    model.scale.x = -1; // wajah menghadap kiri (seperti ebook)
    scene.add(model);
    const maxAniso = opsi.aniso || 4;

    // --- tekstur ---
    /* Tekstur kanvas diunggah sebagai RGBA8 biasa (bukan SRGB8_ALPHA8) dan warna sRGB-nya didekode di
       shader (define DECODE_VIDEO_TEXTURE bawaan three.js, lihat akhir build()). Jalur "kanvas 2D →
       tekstur SRGB8_ALPHA8 + mipmap sRGB" bermasalah di GPU Adreno 610: sangat lambat sampai konteks
       WebGL hilang (Chrome + ANGLE) atau tekstur kosong/tak tergambar (Chrome lama). Hasil warna sama. */
    const mkTex = cv => {
      const t = new THREE.CanvasTexture(cv);
      t.colorSpace = THREE.NoColorSpace; t.userData.srgbDiShader = true; t.anisotropy = maxAniso;
      return t;
    };
    const texPot = mkTex(Tekstur.lukisPotongan(opsi.resolusi || 190));

    const matPotong = new THREE.MeshStandardMaterial({ map: texPot, roughness: 0.78, metalness: 0 });
    const matDinding = new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.5, clearcoat: 0.25, clearcoatRoughness: 0.5 });
    [G.A, G.B].forEach(K => blok(K, matPotong, matDinding).forEach(m => model.add(m)));

    // --- pelat belakang rongga ---
    (function () {
      const pts = G.luas(G.SILUET.p) < 0 ? G.SILUET.p.slice().reverse() : G.SILUET.p;
      const tri = THREE.ShapeUtils.triangulateShape(pts.map(p => new THREE.Vector2(p[0], p[1])), []);
      const cv = document.createElement('canvas'); cv.width = cv.height = 256;
      const c = cv.getContext('2d', { willReadFrequently: true }), Bt = G.BATAS; // kanvas CPU (lihat tekstur.js)
      const tx = x => (x - Bt.x0) / (Bt.x1 - Bt.x0) * 256, ty = y => (Bt.y1 - y) / (Bt.y1 - Bt.y0) * 256;
      c.fillStyle = '#3a1416'; c.fillRect(0, 0, 256, 256);
      [[1.4, 0.2, 3.2], [0.6, 2.4, 2.8], [-1.0, -1.5, 3.0]].forEach(r => {
        const g = c.createRadialGradient(tx(r[0]), ty(r[1]), 2, tx(r[0]), ty(r[1]), r[2] * 256 / 10);
        g.addColorStop(0, '#7c2f2c'); g.addColorStop(1, 'rgba(58,20,22,0)');
        c.fillStyle = g; c.fillRect(0, 0, 256, 256);
      });
      const pos = [], uv = [], idx = [];
      pts.forEach(p => { pos.push(p[0] + bend(-D), p[1], -D); uv.push((p[0] - Bt.x0) / (Bt.x1 - Bt.x0), (p[1] - Bt.y0) / (Bt.y1 - Bt.y0)); });
      tri.forEach(t => idx.push(t[0], t[1], t[2]));
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
      const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ map: mkTex(cv), roughness: 0.9, side: THREE.DoubleSide }));
      m.receiveShadow = true;
      model.add(m);
    })();

    // --- konka (turbinat) hidung ---
    const matMukosa = new THREE.MeshPhysicalMaterial({ color: 0xd97f78, roughness: 0.42, clearcoat: 0.4, clearcoatRoughness: 0.4 });
    [[[3.1, 1.95], [2.0, 2.02], [0.6, 2.0], [-0.3, 1.9], [0.2, 2.2], [1.8, 2.28], [3.0, 2.2]],
     [[2.4, 2.5], [1.2, 2.55], [0.0, 2.45], [-0.5, 2.35], [0.0, 2.7], [1.3, 2.78], [2.4, 2.72]],
     [[1.2, 3.0], [0.3, 3.0], [-0.4, 2.8], [0.1, 3.12], [1.0, 3.18]]].forEach((pts, i) => {
      const sh = new THREE.Shape(G.smooth(pts.concat([pts[0]]), 40).map(p => new THREE.Vector2(p[0], p[1])));
      const g = new THREE.ExtrudeGeometry(sh, { depth: 0.5, bevelEnabled: true, bevelThickness: 0.18, bevelSize: 0.08, bevelSegments: 4, curveSegments: 12 });
      g.translate(0, 0, -1.9 + i * 0.12);
      const pos = g.attributes.position;
      for (let v = 0; v < pos.count; v++) pos.setX(v, pos.getX(v) + bend(pos.getZ(v)));
      g.computeVertexNormals();
      const m = new THREE.Mesh(g, matMukosa); m.castShadow = true; m.receiveShadow = true;
      model.add(m);
    });

    // --- gigi ---
    const matGigi = new THREE.MeshPhysicalMaterial({ color: 0xfbf7ec, roughness: 0.28, clearcoat: 0.7, clearcoatRoughness: 0.25 });
    const seriAtas = new THREE.Mesh(gigiEkstrusi(G.GIGI_SERI_ATAS, 0.3), matGigi);
    const seriBawah = new THREE.Mesh(gigiEkstrusi(G.GIGI_SERI_BAWAH, 0.28), matGigi);
    [seriAtas, seriBawah].forEach(m => { m.castShadow = true; m.receiveShadow = true; model.add(m); });
    function lengkung(daftar, atas) {
      daftar.forEach((t, i) => {
        const runcing = t.jenis === 'taring' || t.jenis === 'seri2';
        const d = t.jenis === 'seri2' ? t.w * 0.45 : t.jenis === 'taring' ? t.w * 0.75 : t.w * 0.92;
        const g = gigiBubut(t.w, t.h, d, runcing);
        const m = new THREE.Mesh(g, matGigi);
        const a = daftar[Math.max(0, i - 1)], b = daftar[Math.min(daftar.length - 1, i + 1)];
        m.rotation.y = Math.atan2(-(b.z - a.z), b.x - a.x);
        if (atas) m.position.set(t.x, t.y - 0.97 * t.h, t.z);
        else { m.rotation.z = Math.PI; m.position.set(t.x, t.y + 0.97 * t.h, t.z); }
        m.castShadow = true; m.receiveShadow = true;
        model.add(m);
      });
    }
    // gigi atas: y = leher gigi, mahkota menggantung ke bawah
    lengkung(G.LENGKUNG_ATAS, true);
    lengkung(G.LENGKUNG_BAWAH, false);
    // gusi
    (function () {
      const LA = G.LENGKUNG_ATAS, LB = G.LENGKUNG_BAWAH;
      const ext = (L, dx) => [{ x: 3.45, z: -0.25, y: L[0].y }].concat(L, [{ x: L[L.length - 1].x - dx, z: L[L.length - 1].z - 0.05, y: L[L.length - 1].y }]);
      const la = ext(LA, 0.5), lb = ext(LB, 0.5);
      const cA = new THREE.CatmullRomCurve3(la.map(t => new THREE.Vector3(t.x, t.y - 0.04, t.z - 0.08)));
      const cB = new THREE.CatmullRomCurve3(lb.map(t => new THREE.Vector3(t.x, t.y + 0.04, t.z - 0.08)));
      const n = 40, pa = cA.getPoints(n), pb = cB.getPoints(n);
      const atasTop = [], atasBot = [], bwhTop = [], bwhBot = [];
      pa.forEach(p => {
        const yp = yBatas(G.BATAS_ATAS, p.x); const yTop = (yp !== null ? yp : 1.25) + 0.04;
        atasTop.push([p.x, yTop, p.z - 0.2]); atasBot.push([p.x, p.y - 0.08, p.z + 0.02]);
      });
      pb.forEach(p => {
        const yf = G.yPada(G.LANTAI_LIDAH, p.x); const yBot = (yf !== null ? yf : -1.0) - 0.05;
        bwhTop.push([p.x, p.y + 0.08, p.z + 0.02]); bwhBot.push([p.x, yBot, p.z - 0.2]);
      });
      model.add(pitaLengkung(atasTop, atasBot, 0xe38b83));
      model.add(pitaLengkung(bwhTop, bwhBot, 0xe38b83));
      const tube = (c) => {
        const m = new THREE.Mesh(new THREE.TubeGeometry(c, 64, 0.13, 10, false), new THREE.MeshPhysicalMaterial({ color: 0xe8958d, roughness: 0.45, clearcoat: 0.3 }));
        m.receiveShadow = true; m.castShadow = true; return m;
      };
      model.add(tube(cA)); model.add(tube(cB));
    })();

    // --- material organ lunak ---
    const matLidahCap = pasangGlow(new THREE.MeshStandardMaterial({ map: mkTex(Tekstur.lukisLidah()), roughness: 0.62 }));
    const matLidahHull = pasangGlow(new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.36, clearcoat: 0.55, clearcoatRoughness: 0.35, sheen: 0.4, sheenColor: new THREE.Color(0xffc0b0) }));
    const matBibirCap = pasangGlow(new THREE.MeshStandardMaterial({ map: mkTex(Tekstur.lukisBibir()), roughness: 0.66 }));
    const matBibirHull = pasangGlow(new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.42, clearcoat: 0.35, clearcoatRoughness: 0.4 }));
    const matVelumCap = pasangGlow(new THREE.MeshStandardMaterial({ map: mkTex(Tekstur.lukisVelum()), roughness: 0.64 }));
    const matVelumHull = pasangGlow(new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.4, clearcoat: 0.4 }));
    const matEpiCap = pasangGlow(new THREE.MeshStandardMaterial({ map: mkTex(Tekstur.lukisEpiglotis()), roughness: 0.6 }));
    const matEpiHull = pasangGlow(new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.4, clearcoat: 0.4 }));

    const cL1 = new THREE.Color('#dc6e66'), cL2 = new THREE.Color('#c05a5c'), cL3 = new THREE.Color('#b8544f');
    const lidahPod = new Pod({
      N: 60, M: 12, K: 12, p: 3.2,
      W: s => 1.55 * (0.8 + 0.2 * Math.sin(Math.PI * s)) * (1 - smoothstep(0.8, 1.0, s) * 0.72),
      matCap: matLidahCap, matHull: matLidahHull,
      warna: (s, t, w, out) => { if (t > 0.5) out.copy(cL1).lerp(cL3, 0.25 * w); else out.copy(cL2).lerp(cL3, 0.3); }
    });
    model.add(lidahPod.group);

    const cKulit = new THREE.Color('#e6a882'), cMerah = new THREE.Color('#d4605c'), cMuk = new THREE.Color('#e38a86');
    function bibirPod(atas) {
      return new Pod({
        N: 22, M: 8, K: 12, p: 2.2, bendK: 0.17,
        W: s => 2.05 * (1 - 0.1 * s),
        matCap: matBibirCap, matHull: matBibirHull,
        warna: (s, t, w, out) => {
          if (t > 0.5) { out.copy(cKulit).lerp(cMerah, smoothstep(0.66, 0.84, s)); }
          else { out.copy(cMuk).lerp(cMerah, smoothstep(0.75, 0.95, s) * 0.6); }
          out.multiplyScalar(1 - 0.18 * w);
        }
      });
    }
    const bibirAtasPod = bibirPod(true), bibirBawahPod = bibirPod(false);
    model.add(bibirAtasPod.group); model.add(bibirBawahPod.group);

    const cVel = new THREE.Color('#d8766f');
    const velumPod = new Pod({
      N: 18, M: 6, K: 10, p: 2.4, W: s => 1.25 * (1 - 0.55 * smoothstep(0.7, 1, s)),
      matCap: matVelumCap, matHull: matVelumHull,
      warna: (s, t, w, out) => out.copy(cVel).multiplyScalar(1 - 0.25 * w)
    });
    model.add(velumPod.group);
    const cEpi = new THREE.Color('#e7a39b');
    const epiPod = new Pod({
      N: 14, M: 4, K: 8, p: 2.2, W: s => 0.95 * (1 - 0.35 * s),
      matCap: matEpiCap, matHull: matEpiHull,
      warna: (s, t, w, out) => out.copy(cEpi).multiplyScalar(1 - 0.2 * w)
    });
    model.add(epiPod.group);

    /* ---------- keadaan artikulator ---------- */
    const S = {
      lidah: new Pegas(G.LIDAH_ISTIRAHAT, 95),
      bibirA: new Pegas(G.BIBIR.atas.istirahat.luar.concat(G.BIBIR.atas.istirahat.dalam), 110),
      bibirB: new Pegas(G.BIBIR.bawah.istirahat.luar.concat(G.BIBIR.bawah.istirahat.dalam), 110),
      velum: new Pegas([[0, 0]], 70),     // x = 0 naik … 1 turun
      epi: new Pegas([[0, 0]], 80),       // x = sudut rotasi (rad)
      poseLidah: {}, gapLidah: 0.014
    };
    S.velum.t = [[1, 0]]; S.velum.snap();
    let lidahTop = null, lidahBot = null, velumBawahNow = G.VELUM.naik.bawah;

    function sampel(ctrl, n) { return G.smooth(ctrl, n - 1); }

    function perbaruiVelum() {
      const f = S.velum.x[0][0];
      const mix = (a, b) => a.map((p, i) => [lerp(p[0], b[i][0], f), lerp(p[1], b[i][1], f)]);
      const atas = mix(G.VELUM.naik.atas, G.VELUM.turun.atas), bawah = mix(G.VELUM.naik.bawah, G.VELUM.turun.bawah);
      velumBawahNow = bawah;
      velumPod.update(sampel(atas, velumPod.N), sampel(bawah, velumPod.N));
    }
    function perbaruiEpi() {
      const a = S.epi.x[0][0], c = Math.cos(a), s = Math.sin(a), o = G.EPIGLOTIS.pangkal;
      const rot = p => [o[0] + (p[0] - o[0]) * c - (p[1] - o[1]) * s, o[1] + (p[0] - o[0]) * s + (p[1] - o[1]) * c];
      epiPod.update(sampel(G.EPIGLOTIS.atas.map(rot), epiPod.N), sampel(G.EPIGLOTIS.bawah.map(rot), epiPod.N));
    }
    function perbaruiBibir(pod, pg) {
      const n = pg.x.length / 2, luar = pg.x.slice(0, n), dalam = pg.x.slice(n);
      pod.update(sampel(luar, pod.N), sampel(dalam, pod.N));
    }
    function bawahLidah(tip) {
      return sampel(G.LIDAH_BAWAH.concat([[
        Math.min(tip[0] - 0.24, 2.95 + (tip[0] - 3.1) * 0.5), Math.max(-0.95, tip[1] - 0.26)
      ], tip]), lidahPod.N);
    }
    function atasTerkendala(P, velumBawah) {
      const top = sampel(P, lidahPod.N);
      // tumbukan dengan gigi/langit-langit/velum (tak menembus)
      const batas = batasAtas(velumBawah);
      for (let i = Math.floor(lidahPod.N * 0.18); i < lidahPod.N; i++) dorongKeluar(top[i], batas, S.gapLidah);
      // dinding faring
      for (let i = 0; i < Math.floor(lidahPod.N * 0.4); i++) {
        if (top[i][0] < G.DINDING_FARING_X + 0.1) top[i][0] = G.DINDING_FARING_X + 0.1;
      }
      return top;
    }
    function velumBawahDari(f) {
      return G.VELUM.naik.bawah.map((p, i) => [lerp(p[0], G.VELUM.turun.bawah[i][0], f), lerp(p[1], G.VELUM.turun.bawah[i][1], f)]);
    }
    function perbaruiLidah() {
      const P = S.lidah.x;
      const top = atasTerkendala(P, velumBawahNow);
      const bot = bawahLidah(P[8]);
      top[top.length - 1] = bot[bot.length - 1] = top[top.length - 1].slice();
      lidahTop = top; lidahBot = bot;
      lidahPod.update(top, bot);
    }

    // inisialisasi
    perbaruiVelum(); perbaruiEpi(); perbaruiLidah();
    perbaruiBibir(bibirAtasPod, S.bibirA); perbaruiBibir(bibirBawahPod, S.bibirB);

    /* turunkan mutu seluruh material model (dipanggil saat awal & bila GPU bermasalah) */
    let mutuAktif = 'penuh';
    function terapkanMutu(tingkat) {
      if (!(tingkat in TINGKAT) || TINGKAT[tingkat] >= TINGKAT[mutuAktif]) return false;
      const peta = new Map(), lama = new Set();
      model.traverse(o => {
        if (!o.isMesh || !o.material || Array.isArray(o.material)) return;
        const m = o.material;
        if (!peta.has(m)) peta.set(m, materialMutu(m, tingkat));
        const b = peta.get(m);
        if (b !== m) { o.material = b; lama.add(m); }
      });
      lama.forEach(m => m.dispose()); // tekstur tidak ikut dibuang: dipakai material baru
      mutuAktif = tingkat;
      return true;
    }
    // material bertekstur kanvas: dekode sRGB di shader (pasangan dari mkTex di atas)
    model.traverse(o => {
      const m = o.isMesh && o.material;
      if (m && m.map && m.map.userData.srgbDiShader) m.defines = Object.assign({}, m.defines, { DECODE_VIDEO_TEXTURE: '' });
    });
    terapkanMutu(opsi.mutu || 'penuh');

    const api = {
      model, D,
      setMutu: terapkanMutu,
      mutu: () => mutuAktif,
      pods: { lidah: lidahPod, bibirAtas: bibirAtasPod, bibirBawah: bibirBawahPod, velum: velumPod, epiglotis: epiPod },
      /* pose lengkap dari data huruf */
      setPose(p, segera) {
        p = p || {};
        S.poseLidah = p.lidah || {};
        S.lidah.target(hitungKendaliLidah(S.poseLidah, p.velum === 'turun' ? G.VELUM.turun.bawah : G.VELUM.naik.bawah));
        const bA = G.BIBIR.atas[p.bibir || 'istirahat'] || G.BIBIR.atas.istirahat;
        const bB = G.BIBIR.bawah[p.bibir || 'istirahat'] || G.BIBIR.bawah.istirahat;
        S.bibirA.target(bA.luar.concat(bA.dalam)); S.bibirB.target(bB.luar.concat(bB.dalam));
        S.velum.t = [[p.velum === 'turun' ? 1 : 0, 0]];
        S.epi.t = [[p.epiglotis === 'sentuh' ? 0.165 : p.epiglotis === 'dekat' ? 0.1 : 0, 0]];
        if (segera) { S.lidah.snap(); S.bibirA.snap(); S.bibirB.snap(); S.velum.snap(); S.epi.snap(); S.kotor = true; }
      },
      /* modifikasi lidah sementara (getaran takrir, pantulan qolqolah, tebal) */
      setLidahMod(mod) {
        const pr = Object.assign({}, S.poseLidah, mod || {});
        S.lidah.target(hitungKendaliLidah(pr, S.velum.t[0][0] > 0.5 ? G.VELUM.turun.bawah : G.VELUM.naik.bawah));
      },
      setBibirOffset(dy) { // untuk pelepasan (syiddah/qolqolah) bibir
        const geser = (arr, s) => arr.map((p, i) => [p[0], p[1] + s * (i % 5 >= 3 ? 1 : i % 5 === 2 ? 0.5 : 0)]);
        S.bibirA.t = geser(S.bibirA._base || (S.bibirA._base = S.bibirA.t), dy);
        S.bibirB.t = geser(S.bibirB._baseB || (S.bibirB._baseB = S.bibirB.t), -dy);
      },
      resetBibirOffset() {
        if (S.bibirA._base) { S.bibirA.t = S.bibirA._base; S.bibirA._base = null; }
        if (S.bibirB._baseB) { S.bibirB.t = S.bibirB._baseB; S.bibirB._baseB = null; }
      },
      setKekakuan(k) { S.lidah.k = k || 95; },
      update(dt) {
        const g1 = S.lidah.step(dt), g2 = S.velum.step(dt), g3 = S.epi.step(dt);
        const g4 = S.bibirA.step(dt), g5 = S.bibirB.step(dt), f = S.kotor;
        S.kotor = false;
        if (f || g2 > 1e-4) perbaruiVelum();
        if (f || g3 > 1e-4) perbaruiEpi();
        if (f || g1 > 1e-4 || g2 > 1e-4) perbaruiLidah();
        if (f || g4 > 1e-4) perbaruiBibir(bibirAtasPod, S.bibirA);
        if (f || g5 > 1e-4) perbaruiBibir(bibirBawahPod, S.bibirB);
        return g1 + g4 + g5;
      },
      /* kueri geometri terkini (koordinat lokal model) */
      lidahAtas: () => lidahTop,
      velumBawah: () => velumBawahNow,
      yLangit(x) { return yBatas(batasAtas(velumBawahNow), x); },
      yLidah(x) {
        const t = lidahTop; let y = null;
        for (let i = 0; i < t.length - 1; i++) {
          const a = t[i], b = t[i + 1];
          if ((x - a[0]) * (x - b[0]) <= 0 && a[0] !== b[0]) {
            const yy = a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0]);
            if (y === null || yy > y) y = yy;
          }
        }
        return y;
      },
      /* geometri TARGET (pose akhir, tanpa menunggu pegas) — untuk jalur aliran */
      velumTargetBawah: () => G.smooth(velumBawahDari(S.velum.t[0][0]), 12),
      targetAtas() { return atasTerkendala(S.lidah.t, velumBawahDari(S.velum.t[0][0])); },
      batasTarget() { return batasAtas(G.smooth(velumBawahDari(S.velum.t[0][0]), 12)); },
      bibirTepi() {
        const a = (S.bibirA._base || S.bibirA.t), b = (S.bibirB._baseB || S.bibirB.t);
        return { atas: a[4].slice(), bawah: b[4].slice() };
      },
      pose: () => S.poseLidah,
      lokalKeDunia(x, y, z, out) { return model.localToWorld((out || new THREE.Vector3()).set(x, y, z || 0)); }
    };
    return api;
  }

  return { build, D, bend, POSE_LIDAH };
})();
