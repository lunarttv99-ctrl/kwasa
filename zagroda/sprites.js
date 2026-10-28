// Grafika izometryczna rysowana proceduralnie (kreskówkowy styl z obwódką).
// Każdy obiekt rysuje się raz do bufora (canvas) i potem jest tylko kopiowany.
// Układ: pole (gx, gy) i wysokość z → ekran P(gx, gy, z).

import { CROPS, TREES } from './data.js';

export const HW = 32;   // połowa szerokości pola
export const HH = 16;   // połowa wysokości pola
export const P = (gx, gy, z = 0) => [(gx - gy) * HW, (gx + gy) * HH - z];

const INK = '#3d2615';
let CS = 2;             // rozdzielczość buforów (piksele na jednostkę świata)
const cache = new Map();

export function setSpriteQuality(scale) {
  if (Math.abs(scale - CS) < 0.01) return;
  CS = scale;
  cache.clear();
}

// ---------- kolory ----------
function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export function shade(hex, f) {
  const [r, g, b] = hexToRgb(hex);
  const t = f < 0 ? 0 : 255;
  const p = Math.abs(f);
  const mix = c => Math.round((t - c) * p + c);
  return `rgb(${mix(r)},${mix(g)},${mix(b)})`;
}

// Deterministyczny los (żeby obrazki były zawsze takie same).
export function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >> 17;
    s ^= s << 5; s >>>= 0;
    return (s % 100000) / 100000;
  };
}

// ---------- bufor ----------
function makeSprite(key, minX, minY, maxX, maxY, draw) {
  let s = cache.get(key);
  if (s) return s;
  const w = maxX - minX;
  const h = maxY - minY;
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.ceil(w * CS));
  c.height = Math.max(1, Math.ceil(h * CS));
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.scale(CS, CS);
  ctx.translate(-minX, -minY);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  const meta = draw(ctx) || {};
  s = { c, ox: minX, oy: minY, w, h, meta };
  cache.set(key, s);
  return s;
}

// Czy punkt (lokalny względem początku sprite'a) trafia w nieprzezroczysty piksel.
export function spriteHit(s, lx, ly) {
  const px = Math.floor((lx - s.ox) * CS);
  const py = Math.floor((ly - s.oy) * CS);
  if (px < 0 || py < 0 || px >= s.c.width || py >= s.c.height) return false;
  const a = s.c.getContext('2d', { willReadFrequently: true }).getImageData(px, py, 1, 1).data[3];
  return a > 40;
}

// ---------- prymitywy ----------
function poly(ctx, pts, fill, stroke = INK, lw = 1.3) {
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
}
function line(ctx, a, b, color, lw = 1) {
  ctx.beginPath();
  ctx.moveTo(a[0], a[1]);
  ctx.lineTo(b[0], b[1]);
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.stroke();
}
function circle(ctx, x, y, r, fill, stroke = INK, lw = 1.2) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
}
function ellipse(ctx, x, y, rx, ry, fill, stroke = INK, lw = 1.2, rot = 0) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
}
function shadow(ctx, cx, cy, rx, ry, a = 0.22) {
  ctx.save();
  ctx.fillStyle = `rgba(20,40,10,${a})`;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
// Cień w kształcie podstawy (romb), przesunięty w prawo-dół.
function footShadow(ctx, w, h, grow = 0.25) {
  ctx.save();
  ctx.fillStyle = 'rgba(25,45,10,0.2)';
  const pts = [P(-grow + 0.3, -grow, 0), P(w + grow + 0.3, -grow, 0), P(w + grow + 0.3, h + grow + 0.2, 0), P(-grow + 0.3, h + grow + 0.2, 0)];
  ctx.beginPath();
  ctx.moveTo(...pts[0]);
  pts.slice(1).forEach(p => ctx.lineTo(...p));
  ctx.closePath();
  ctx.filter = 'blur(2px)';
  ctx.fill();
  ctx.restore();
}

// Ściany prostopadłościanu (widoczne: przód-lewa gy=y1, przód-prawa gx=x1 i góra).
function box(ctx, x0, y0, x1, y1, z0, z1, color, opts = {}) {
  const left = opts.left || shade(color, 0.04);
  const right = opts.right || shade(color, -0.2);
  const top = opts.top || shade(color, 0.18);
  poly(ctx, [P(x0, y1, z0), P(x1, y1, z0), P(x1, y1, z1), P(x0, y1, z1)], left, INK, opts.lw || 1.3);
  poly(ctx, [P(x1, y1, z0), P(x1, y0, z0), P(x1, y0, z1), P(x1, y1, z1)], right, INK, opts.lw || 1.3);
  if (!opts.noTop) poly(ctx, [P(x0, y0, z1), P(x1, y0, z1), P(x1, y1, z1), P(x0, y1, z1)], top, INK, opts.lw || 1.3);
}

// Prostokąt na ścianie przód-lewa (gy = Y): u wzdłuż gx, z w górę.
const quadL = (Y, u0, u1, z0, z1) => [P(u0, Y, z0), P(u1, Y, z0), P(u1, Y, z1), P(u0, Y, z1)];
// Prostokąt na ścianie przód-prawa (gx = X): u wzdłuż gy.
const quadR = (X, u0, u1, z0, z1) => [P(X, u0, z0), P(X, u1, z0), P(X, u1, z1), P(X, u0, z1)];

function windowAt(ctx, face, F, u0, u1, z0, z1, frame = '#fdf8ee', shutters = null) {
  const q = face === 'L' ? quadL : quadR;
  if (shutters) {
    const sw = (u1 - u0) * 0.42;
    poly(ctx, q(F, u0 - sw, u0, z0, z1), shutters, INK, 1);
    poly(ctx, q(F, u1, u1 + sw, z0, z1), shutters, INK, 1);
  }
  poly(ctx, q(F, u0, u1, z0, z1), frame, INK, 1.2);
  const m = (u1 - u0) * 0.14;
  const mz = (z1 - z0) * 0.14;
  const glass = ctx.createLinearGradient(...P(face === 'L' ? u0 : F, face === 'L' ? F : u0, z1), ...P(face === 'L' ? u1 : F, face === 'L' ? F : u1, z0));
  glass.addColorStop(0, '#d9f1ff');
  glass.addColorStop(0.5, '#86c3e8');
  glass.addColorStop(1, '#4f8fbf');
  poly(ctx, q(F, u0 + m, u1 - m, z0 + mz, z1 - mz), glass, shade('#3d2615', 0.3), 0.8);
  const um = (u0 + u1) / 2;
  const zm = (z0 + z1) / 2;
  line(ctx, (face === 'L' ? P(um, F, z0 + mz) : P(F, um, z0 + mz)), (face === 'L' ? P(um, F, z1 - mz) : P(F, um, z1 - mz)), frame, 1.4);
  line(ctx, (face === 'L' ? P(u0 + m, F, zm) : P(F, u0 + m, zm)), (face === 'L' ? P(u1 - m, F, zm) : P(F, u1 - m, zm)), frame, 1.4);
}

function doorAt(ctx, face, F, u0, u1, z0, z1, color = '#8a5a32', arch = false) {
  const q = face === 'L' ? quadL : quadR;
  poly(ctx, q(F, u0 - 0.04, u1 + 0.04, z0, z1 + 1.5), shade(color, 0.35), INK, 1.1);
  poly(ctx, q(F, u0, u1, z0, z1), color, INK, 1.2);
  const n = 3;
  for (let i = 1; i < n; i++) {
    const u = u0 + (u1 - u0) * i / n;
    line(ctx, face === 'L' ? P(u, F, z0 + 1) : P(F, u, z0 + 1), face === 'L' ? P(u, F, z1 - 1) : P(F, u, z1 - 1), shade(color, -0.25), 0.9);
  }
  const k = face === 'L' ? P(u1 - (u1 - u0) * 0.2, F, (z0 + z1) / 2) : P(F, u1 - (u1 - u0) * 0.2, (z0 + z1) / 2);
  circle(ctx, k[0], k[1], 1.1, '#f2c84b', INK, 0.6);
  if (arch) { /* drzwi stodoły mają krzyż */ }
}

// Deski na ścianie (poziome linie).
function planks(ctx, face, F, u0, u1, z0, z1, step, color) {
  for (let z = z0 + step; z < z1 - 1; z += step) {
    line(ctx, face === 'L' ? P(u0, F, z) : P(F, u0, z), face === 'L' ? P(u1, F, z) : P(F, u1, z), color, 0.8);
  }
}

// Dach dwuspadowy. ridge 'x' — kalenica wzdłuż gx (szczyt widać z prawej),
// ridge 'y' — kalenica wzdłuż gy (szczyt z frontu, z lewej).
function gableRoof(ctx, x0, y0, x1, y1, zE, rise, color, ridge, wallColor, over = 0.22) {
  const dark = shade(color, -0.22);
  const light = shade(color, 0.08);
  const rows = 5;
  if (ridge === 'x') {
    const ym = (y0 + y1) / 2;
    const zr = zE + rise;
    const xa = x0 - over, xb = x1 + over;
    // tylna połać
    poly(ctx, [P(xa, y0 - over, zE - 2), P(xb, y0 - over, zE - 2), P(xb, ym, zr), P(xa, ym, zr)], dark);
    // szczyt (trójkąt na ścianie gx = x1)
    poly(ctx, [P(x1, y0, zE), P(x1, y1, zE), P(x1, ym, zr - 1)], shade(wallColor, -0.2));
    // deski czołowe szczytu
    poly(ctx, [P(xb, y0 - over, zE - 2), P(xb, ym, zr), P(xb, ym, zr + 2.5), P(xb, y0 - over, zE + 0.5)], shade(color, -0.35), INK, 1);
    poly(ctx, [P(xb, ym, zr), P(xb, y1 + over, zE - 2), P(xb, y1 + over, zE + 0.5), P(xb, ym, zr + 2.5)], shade(color, -0.35), INK, 1);
    // przednia połać
    poly(ctx, [P(xa, ym, zr), P(xb, ym, zr), P(xb, y1 + over, zE - 2), P(xa, y1 + over, zE - 2)], light);
    for (let i = 1; i < rows; i++) {
      const t = i / rows;
      const gy = ym + (y1 + over - ym) * t;
      const z = zr + (zE - 2 - zr) * t;
      line(ctx, P(xa + 0.05, gy, z), P(xb - 0.05, gy, z), shade(color, -0.15), 0.8);
    }
    // kalenica
    line(ctx, P(xa, ym, zr + 0.5), P(xb, ym, zr + 0.5), shade(color, -0.4), 2.4);
  } else {
    const xm = (x0 + x1) / 2;
    const zr = zE + rise;
    const ya = y0 - over, yb = y1 + over;
    poly(ctx, [P(x0 - over, ya, zE - 2), P(x0 - over, yb, zE - 2), P(xm, yb, zr), P(xm, ya, zr)], light);
    for (let i = 1; i < rows; i++) {
      const t = i / rows;
      const gx = xm + (x0 - over - xm) * t;
      const z = zr + (zE - 2 - zr) * t;
      line(ctx, P(gx, ya + 0.05, z), P(gx, yb - 0.05, z), shade(color, -0.12), 0.8);
    }
    poly(ctx, [P(x0, y1, zE), P(x1, y1, zE), P(xm, y1, zr - 1)], shade(wallColor, 0.05));
    poly(ctx, [P(x0 - over, yb, zE - 2), P(xm, yb, zr), P(xm, yb, zr + 2.5), P(x0 - over, yb, zE + 0.5)], shade(color, -0.3), INK, 1);
    poly(ctx, [P(xm, yb, zr), P(x1 + over, yb, zE - 2), P(x1 + over, yb, zE + 0.5), P(xm, yb, zr + 2.5)], shade(color, -0.3), INK, 1);
    poly(ctx, [P(xm, ya, zr), P(x1 + over, ya, zE - 2), P(x1 + over, yb, zE - 2), P(xm, yb, zr)], dark);
    for (let i = 1; i < rows; i++) {
      const t = i / rows;
      const gx = xm + (x1 + over - xm) * t;
      const z = zr + (zE - 2 - zr) * t;
      line(ctx, P(gx, ya + 0.05, z), P(gx, yb - 0.05, z), shade(color, -0.38), 0.8);
    }
    line(ctx, P(xm, ya, zr + 0.5), P(xm, yb, zr + 0.5), shade(color, -0.45), 2.4);
  }
}

function emojiAt(ctx, emoji, x, y, size) {
  ctx.save();
  ctx.font = `${size}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#000';
  ctx.fillText(emoji, x, y);
  ctx.restore();
}

// Szyld z ikonką zawieszony na ścianie przód-lewa.
function signL(ctx, F, u, z, emoji) {
  const pts = quadL(F, u - 0.32, u + 0.32, z - 6, z + 6);
  poly(ctx, pts, '#f3dfb2', INK, 1.2);
  const c = P(u, F, z);
  emojiAt(ctx, emoji, c[0], c[1] + 1, 10);
}

function chimney(ctx, gx, gy, z0, z1, color = '#b4553a') {
  box(ctx, gx, gy, gx + 0.3, gy + 0.3, z0, z1, color);
  box(ctx, gx - 0.04, gy - 0.04, gx + 0.34, gy + 0.34, z1, z1 + 2, '#5d5d5d');
  return P(gx + 0.15, gy + 0.15, z1 + 3);
}

function flowerBox(ctx, face, F, u0, u1, z) {
  const q = face === 'L' ? quadL : quadR;
  poly(ctx, q(F, u0, u1, z - 3, z), '#8b5a2b', INK, 0.9);
  const colors = ['#ff5a7a', '#ffd23f', '#ff8c42', '#f25cc1'];
  for (let i = 0; i < 4; i++) {
    const u = u0 + (u1 - u0) * (i + 0.5) / 4;
    const p = face === 'L' ? P(u, F, z + 1.5) : P(F, u, z + 1.5);
    circle(ctx, p[0] - 1.5, p[1] + 1, 1.6, '#4c9a3a', null);
    circle(ctx, p[0], p[1], 1.6, colors[i], null);
  }
}

// ---------- ziemia: pole uprawne ----------
export function soilSprite(state) {
  return makeSprite('soil:' + state, -HW, -6, HW, 2 * HH + 6, ctx => {
    const i = 0.05;
    const top = state === 'planted' ? '#6e4423' : '#8a5a2e';
    const side = '#5a3519';
    const z = 2.5;
    poly(ctx, [P(i, 1 - i, 0), P(1 - i, 1 - i, 0), P(1 - i, 1 - i, z), P(i, 1 - i, z)], side, null);
    poly(ctx, [P(1 - i, 1 - i, 0), P(1 - i, i, 0), P(1 - i, i, z), P(1 - i, 1 - i, z)], shade(side, -0.2), null);
    const g = ctx.createLinearGradient(...P(0, 0, z), ...P(1, 1, z));
    g.addColorStop(0, shade(top, 0.12));
    g.addColorStop(1, shade(top, -0.08));
    poly(ctx, [P(i, i, z), P(1 - i, i, z), P(1 - i, 1 - i, z), P(i, 1 - i, z)], g, shade(side, -0.3), 1);
    // bruzdy wzdłuż gx
    for (let k = 1; k <= 4; k++) {
      const gy = i + (1 - 2 * i) * k / 5;
      line(ctx, P(i + 0.06, gy + 0.03, z), P(1 - i - 0.06, gy + 0.03, z), shade(top, 0.16), 1.1);
      line(ctx, P(i + 0.06, gy - 0.02, z), P(1 - i - 0.06, gy - 0.02, z), shade(top, -0.28), 1.3);
    }
  });
}

// ---------- uprawy ----------
// stage 0 — kiełki, 1 — małe, 2 — prawie, 3 — dojrzałe
export function cropSprite(cropId, stage) {
  const crop = CROPS[cropId];
  return makeSprite(`crop:${cropId}:${stage}`, -HW, -60, HW, 2 * HH + 4, ctx => {
    const z = 2.5;
    let grid;
    if (crop.look === 'grain') grid = [0.18, 0.39, 0.61, 0.82];
    else if (['pumpkin', 'melon', 'cabbage'].includes(crop.look)) grid = [0.3, 0.7];
    else grid = [0.22, 0.5, 0.78];
    const spots = [];
    for (const u of grid) for (const v of grid) spots.push([u, v]);
    spots.sort((a, b) => (a[0] + a[1]) - (b[0] + b[1]));
    const r = rng(cropId.length * 97 + stage * 13);
    for (const [u, v] of spots) {
      const [x, y] = P(u + (r() - 0.5) * 0.05, v + (r() - 0.5) * 0.05, z);
      if (stage === 0) { sprout(ctx, x, y); continue; }
      const s = stage === 1 ? 0.55 : stage === 2 ? 0.82 : 1;
      plant(ctx, crop, x, y, s, stage === 3, r);
    }
  });
}

function sprout(ctx, x, y) {
  ctx.fillStyle = '#5a3519';
  ctx.beginPath(); ctx.ellipse(x, y + 0.5, 2.2, 1.1, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#3f8a2a'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - 3); ctx.stroke();
  ellipse(ctx, x - 1.6, y - 3.5, 1.8, 1, '#7cc84a', null, 0, -0.5);
  ellipse(ctx, x + 1.6, y - 3.5, 1.8, 1, '#6fbd40', null, 0, 0.5);
}

function leaf(ctx, x, y, len, ang, color, wid = 0.35) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(len * 0.5, -len * wid, len, 0);
  ctx.quadraticCurveTo(len * 0.5, len * wid, 0, 0);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = shade(color, -0.45);
  ctx.lineWidth = 0.7;
  ctx.stroke();
  ctx.restore();
}

function plant(ctx, crop, x, y, s, ripe, r) {
  const g = ripe ? crop.c2 : '#6cb544';
  switch (crop.look) {
    case 'grain': {
      const stalk = ripe ? '#d4a73a' : '#7fbf45';
      for (let k = -1; k <= 1; k++) {
        const tx = x + k * 2.6 * s;
        const ty = y - 16 * s;
        ctx.strokeStyle = shade(stalk, -0.2); ctx.lineWidth = 1.1;
        ctx.beginPath(); ctx.moveTo(x + k * 0.6, y); ctx.quadraticCurveTo(x + k * 1.5, y - 8 * s, tx, ty); ctx.stroke();
        if (s > 0.6) {
          ellipse(ctx, tx, ty - 2.5 * s, 1.7 * s, 4 * s, ripe ? crop.c1 : '#a6d65e', shade(ripe ? crop.c2 : '#5f9a33', -0.2), 0.7, k * 0.25);
          if (ripe) {
            line(ctx, [tx, ty - 6.5 * s], [tx + k * 1.2, ty - 10 * s], shade(crop.c1, -0.25), 0.6);
          }
        }
      }
      break;
    }
    case 'carrot': {
      if (ripe) ellipse(ctx, x, y - 1, 2.6, 2, crop.c1, INK, 0.8);
      for (let k = -2; k <= 2; k++) leaf(ctx, x, y - 1, 9 * s, -Math.PI / 2 + k * 0.38, k % 2 ? '#5fae3a' : '#79c64a', 0.25);
      break;
    }
    case 'corn': {
      const h = 30 * s;
      ctx.strokeStyle = '#4f8c2c'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - h); ctx.stroke();
      leaf(ctx, x, y - h * 0.3, 11 * s, -0.5, '#6bab3e', 0.22);
      leaf(ctx, x, y - h * 0.45, 11 * s, Math.PI + 0.5, '#5c9c35', 0.22);
      leaf(ctx, x, y - h * 0.7, 9 * s, -0.8, '#79bb48', 0.22);
      if (s > 0.6) {
        if (ripe) {
          ellipse(ctx, x + 2.6, y - h * 0.55, 2.2, 5.5, crop.c1, INK, 0.8, 0.3);
          ctx.fillStyle = shade(crop.c1, -0.2);
          for (let k = 0; k < 4; k++) circle(ctx, x + 2.2 + (k % 2), y - h * 0.55 - 3 + k * 1.8, 0.5, shade(crop.c1, -0.25), null);
          leaf(ctx, x + 1, y - h * 0.45, 7, -1.2, '#8fca5a', 0.3);
        }
        line(ctx, [x, y - h], [x - 2, y - h - 4], '#d9b55a', 1);
        line(ctx, [x, y - h], [x + 2, y - h - 4], '#d9b55a', 1);
      }
      break;
    }
    case 'berry': {
      for (const a of [-2.3, -1.6, -0.9, -2.0, -1.2]) leaf(ctx, x, y, 7 * s, a, a > -1.5 ? '#5aa83a' : '#4c9a33', 0.45);
      if (s > 0.6 && !ripe) circle(ctx, x + 1, y - 5, 1.4, '#ffffff', INK, 0.5);
      if (ripe) {
        for (const [dx, dy] of [[-3, -2], [2.5, -1.5], [0, -4.5]]) {
          ctx.beginPath();
          ctx.moveTo(x + dx - 1.8, y + dy - 1);
          ctx.quadraticCurveTo(x + dx, y + dy + 3.5, x + dx + 1.8, y + dy - 1);
          ctx.quadraticCurveTo(x + dx, y + dy - 2.4, x + dx - 1.8, y + dy - 1);
          ctx.fillStyle = crop.c1; ctx.fill();
          ctx.strokeStyle = INK; ctx.lineWidth = 0.6; ctx.stroke();
          circle(ctx, x + dx - 0.5, y + dy, 0.3, '#ffe9a8', null);
          circle(ctx, x + dx + 0.6, y + dy + 0.8, 0.3, '#ffe9a8', null);
        }
      }
      break;
    }
    case 'potato': {
      if (ripe) { ellipse(ctx, x - 2.5, y, 2.2, 1.5, '#c9975a', INK, 0.6); ellipse(ctx, x + 2, y + 0.5, 2, 1.4, '#b88545', INK, 0.6); }
      for (const [dx, dy, rr] of [[-3, -3, 3.2], [3, -3, 3], [0, -6, 3.4], [0, -2, 3]]) circle(ctx, x + dx * s, y + dy * s, rr * s, '#5c9e3a', shade('#5c9e3a', -0.45), 0.7);
      circle(ctx, x - 1, y - 7 * s, 1.6 * s, '#7cc152', null);
      if (ripe) { circle(ctx, x - 2, y - 7, 1, crop.c1, INK, 0.4); circle(ctx, x + 2.5, y - 5, 1, '#d9c2f0', INK, 0.4); }
      break;
    }
    case 'tomato': {
      const h = 20 * s;
      line(ctx, [x + 2.5, y], [x + 2.5, y - h - 2], '#9b6a3a', 1.4);
      for (let k = 0; k < 4; k++) leaf(ctx, x, y - h * (0.2 + k * 0.22), 6 * s, k % 2 ? -0.4 : Math.PI + 0.4, k % 2 ? '#4b9a35' : '#5aa83f', 0.4);
      ctx.strokeStyle = '#3f7f2a'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - h); ctx.stroke();
      if (s > 0.6) {
        const col = ripe ? crop.c1 : '#8fca5a';
        circle(ctx, x - 2.5, y - h * 0.45, 2.4, col, INK, 0.7);
        circle(ctx, x + 1.5, y - h * 0.7, 2.2, col, INK, 0.7);
        if (ripe) circle(ctx, x - 0.5, y - h * 0.25, 2.3, col, INK, 0.7);
        circle(ctx, x - 3.2, y - h * 0.45 - 1, 0.6, 'rgba(255,255,255,.7)', null);
      }
      break;
    }
    case 'cabbage': {
      const c = ripe ? crop.c1 : '#8ccc5c';
      for (const a of [-2.8, -0.3, -2.2, -0.9]) leaf(ctx, x, y - 2, 9 * s, a, crop.c2, 0.5);
      circle(ctx, x, y - 5 * s, 5.5 * s, c, shade(c, -0.5), 0.9);
      ctx.strokeStyle = shade(c, -0.3); ctx.lineWidth = 0.7;
      ctx.beginPath(); ctx.arc(x - 1, y - 5 * s, 3.5 * s, -0.5, 1.8); ctx.stroke();
      ctx.beginPath(); ctx.arc(x + 1.2, y - 5.5 * s, 2.5 * s, 2, 4); ctx.stroke();
      circle(ctx, x - 1.5 * s, y - 7.5 * s, 1.4 * s, 'rgba(255,255,255,.35)', null);
      break;
    }
    case 'sunflower': {
      const h = 32 * s;
      ctx.strokeStyle = '#4a8a2b'; ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x - 1, y - h / 2, x, y - h); ctx.stroke();
      leaf(ctx, x, y - h * 0.35, 8 * s, -0.4, '#5a9a33', 0.45);
      leaf(ctx, x, y - h * 0.55, 8 * s, Math.PI + 0.4, '#68aa3b', 0.45);
      if (s > 0.6) {
        if (ripe) {
          for (let k = 0; k < 12; k++) {
            const a = k / 12 * Math.PI * 2;
            ellipse(ctx, x + Math.cos(a) * 4.6, y - h + Math.sin(a) * 4.6, 2.6, 1.3, crop.c1, shade(crop.c1, -0.4), 0.5, a);
          }
          circle(ctx, x, y - h, 3.6, '#6b3e1e', INK, 0.8);
          circle(ctx, x - 1, y - h - 1, 1, '#8b5a2b', null);
        } else {
          circle(ctx, x, y - h, 3, '#7cb84a', INK, 0.8);
        }
      }
      break;
    }
    case 'pumpkin': {
      for (const a of [-2.9, -0.2, -1.9, -1.1]) leaf(ctx, x, y - 1, 11 * s, a, a < -1.5 ? '#4f9032' : '#5ea83b', 0.5);
      ctx.strokeStyle = '#5a8f2a'; ctx.lineWidth = 0.9;
      ctx.beginPath(); ctx.moveTo(x - 9 * s, y + 2); ctx.bezierCurveTo(x - 4, y - 4, x + 4, y + 4, x + 9 * s, y - 1); ctx.stroke();
      if (s > 0.6) {
        const c = ripe ? crop.c1 : '#9ccf5a';
        const rr = ripe ? 7.5 : 4.5;
        ellipse(ctx, x, y - rr * 0.7, rr * 1.15, rr * 0.85, c, INK, 1);
        ctx.strokeStyle = shade(c, -0.3); ctx.lineWidth = 0.9;
        for (const dx of [-0.45, 0, 0.45]) {
          ctx.beginPath(); ctx.ellipse(x + dx * rr, y - rr * 0.7, rr * 0.35, rr * 0.82, 0, -Math.PI / 2, Math.PI / 2, dx < 0); ctx.stroke();
        }
        line(ctx, [x, y - rr * 1.5], [x + 1, y - rr * 1.9], '#5b7a2a', 1.6);
        ellipse(ctx, x - rr * 0.5, y - rr, rr * 0.25, rr * 0.15, 'rgba(255,255,255,.4)', null);
      }
      break;
    }
    case 'melon': {
      for (const a of [-2.9, -0.2, -1.6]) leaf(ctx, x, y - 1, 10 * s, a, '#5ea83b', 0.5);
      if (s > 0.6) {
        const rr = ripe ? 7 : 4;
        ellipse(ctx, x, y - rr * 0.6, rr * 1.3, rr * 0.85, ripe ? '#4c9e37' : '#8ccc5c', INK, 1);
        ctx.strokeStyle = ripe ? '#24631c' : '#5f9e3a'; ctx.lineWidth = 1.3;
        for (const dx of [-0.6, -0.2, 0.2, 0.6]) {
          ctx.beginPath(); ctx.moveTo(x + dx * rr * 1.2, y - rr * 1.35); ctx.quadraticCurveTo(x + dx * rr * 1.6, y - rr * 0.6, x + dx * rr * 1.2, y + rr * 0.15); ctx.stroke();
        }
        ellipse(ctx, x - rr * 0.5, y - rr, rr * 0.3, rr * 0.15, 'rgba(255,255,255,.35)', null);
      }
      break;
    }
  }
}

// ---------- budynki ----------
function genericHouse(ctx, o) {
  const { w, h } = o;
  const m = o.m ?? 0.18;
  const x0 = m, y0 = m, x1 = w - m, y1 = h - m;
  const H = o.wallH;
  footShadow(ctx, w, h);
  box(ctx, x0 - 0.06, y0 - 0.06, x1 + 0.06, y1 + 0.06, 0, 3, '#a39a8c', { lw: 1.1 });
  box(ctx, x0, y0, x1, y1, 3, H, o.wall, { noTop: true, left: o.wall, right: shade(o.wall, -0.18) });
  if (o.wood) {
    planks(ctx, 'L', y1, x0, x1, 3, H, 4, shade(o.wall, -0.18));
    planks(ctx, 'R', x1, y0, y1, 3, H, 4, shade(o.wall, -0.35));
  }
  if (o.trim) {
    for (const u of [x0, x1]) line(ctx, P(u, y1, 3), P(u, y1, H), o.trim, 2.2);
    line(ctx, P(x1, y0, 3), P(x1, y0, H), o.trim, 2.2);
    line(ctx, P(x0, y1, H - 0.5), P(x1, y1, H - 0.5), o.trim, 2);
    line(ctx, P(x1, y1, H - 0.5), P(x1, y0, H - 0.5), o.trim, 2);
  }
  const meta = {};
  if (o.decorate) o.decorate(ctx, { x0, y0, x1, y1, H }, meta);
  gableRoof(ctx, x0, y0, x1, y1, H, o.rise, o.roof, o.ridge, o.wall);
  if (o.chimney) meta.smoke = chimney(ctx, ...o.chimney, o.chimneyColor);
  if (o.after) o.after(ctx, { x0, y0, x1, y1, H }, meta);
  return meta;
}

const BUILD_DRAW = {
  house: ctx => genericHouse(ctx, {
    w: 3, h: 3, wallH: 30, wall: '#f7e9cc', roof: '#d2553a', ridge: 'x', rise: 22, trim: '#b9854e',
    chimney: [1.9, 0.75, 44, 58],
    decorate(ctx, b) {
      doorAt(ctx, 'L', b.y1, 1.1, 1.65, 3, 20, '#9a5b2e');
      windowAt(ctx, 'L', b.y1, 0.4, 0.85, 12, 22, '#fffaf0', '#4f9a4a');
      windowAt(ctx, 'L', b.y1, 2.05, 2.5, 12, 22, '#fffaf0', '#4f9a4a');
      flowerBox(ctx, 'L', b.y1, 0.36, 0.9, 11);
      flowerBox(ctx, 'L', b.y1, 2.0, 2.55, 11);
      windowAt(ctx, 'R', b.x1, 0.6, 1.1, 12, 22, '#fffaf0', '#4f9a4a');
      windowAt(ctx, 'R', b.x1, 1.7, 2.2, 12, 22, '#fffaf0', '#4f9a4a');
      // daszek nad drzwiami
      poly(ctx, [P(1.0, b.y1, 22), P(1.75, b.y1, 22), P(1.75, b.y1 + 0.35, 19), P(1.0, b.y1 + 0.35, 19)], '#c24a32');
      // schodek
      box(ctx, 1.05, b.y1, 1.7, b.y1 + 0.25, 0, 3, '#b8b0a2', { lw: 0.9 });
    },
    after(ctx) {
      // okienko na szczycie
      windowAt(ctx, 'R', 2.82, 1.3, 1.7, 34, 40, '#fffaf0');
    }
  }),
  barn: ctx => genericHouse(ctx, {
    w: 3, h: 3, wallH: 32, wall: '#c23b2c', roof: '#6f7680', ridge: 'y', rise: 26, wood: true, trim: '#fbf3e4', m: 0.15,
    decorate(ctx, b) {
      // wielkie wrota z krzyżem
      const u0 = 0.95, u1 = 2.05;
      poly(ctx, quadL(b.y1, u0, u1, 3, 24), '#9c2d22', INK, 1.3);
      poly(ctx, quadL(b.y1, u0, u1, 3, 24), null, '#fbf3e4', 2);
      line(ctx, P(u0, b.y1, 3), P(u1, b.y1, 24), '#fbf3e4', 2);
      line(ctx, P(u1, b.y1, 3), P(u0, b.y1, 24), '#fbf3e4', 2);
      line(ctx, P((u0 + u1) / 2, b.y1, 3), P((u0 + u1) / 2, b.y1, 24), '#fbf3e4', 1.5);
      windowAt(ctx, 'R', b.x1, 0.7, 1.2, 14, 22, '#fbf3e4');
      windowAt(ctx, 'R', b.x1, 1.8, 2.3, 14, 22, '#fbf3e4');
      // siano wystające z boku
      for (let k = 0; k < 5; k++) {
        const p = P(0.3 + k * 0.12, b.y1 + 0.1, 1);
        ellipse(ctx, p[0], p[1], 3.5, 2, '#f2cd5c', '#b8902b', 0.7);
      }
    },
    after(ctx, b) {
      // okno strychu w szczycie
      const xm = (b.x0 + b.x1) / 2;
      poly(ctx, quadL(b.y1, xm - 0.28, xm + 0.28, 38, 46), '#fbf3e4', INK, 1.2);
      poly(ctx, quadL(b.y1, xm - 0.2, xm + 0.2, 39.5, 44.5), '#3b2a20', INK, 0.8);
      line(ctx, P(xm - 0.2, b.y1, 39.5), P(xm + 0.2, b.y1, 44.5), '#fbf3e4', 1);
      line(ctx, P(xm + 0.2, b.y1, 39.5), P(xm - 0.2, b.y1, 44.5), '#fbf3e4', 1);
    }
  }),
  bakery: ctx => genericHouse(ctx, {
    w: 2, h: 2, wallH: 24, wall: '#e5a46a', roof: '#8b4a2b', ridge: 'x', rise: 16, trim: '#fff1d6',
    chimney: [1.15, 0.45, 32, 46], chimneyColor: '#a24d33',
    decorate(ctx, b) {
      doorAt(ctx, 'L', b.y1, 0.75, 1.2, 3, 17, '#7b4a2a');
      windowAt(ctx, 'L', b.y1, 0.3, 0.6, 9, 17);
      windowAt(ctx, 'L', b.y1, 1.36, 1.66, 9, 17);
      windowAt(ctx, 'R', b.x1, 0.55, 1.05, 8, 17);
      // markiza w paski
      for (let k = 0; k < 6; k++) {
        const u = 0.25 + k * 0.25;
        poly(ctx, [P(u, b.y1, 21), P(u + 0.25, b.y1, 21), P(u + 0.25, b.y1 + 0.3, 17.5), P(u, b.y1 + 0.3, 17.5)], k % 2 ? '#fff6e8' : '#d9433a', INK, 0.8);
      }
    },
    after(ctx, b) { signL(ctx, b.y1 + 0.32, 0.98, 28, '🍞'); }
  }),
  dairy: ctx => genericHouse(ctx, {
    w: 2, h: 2, wallH: 24, wall: '#f4f1ea', roof: '#3f78b5', ridge: 'y', rise: 18, wood: true, trim: '#3f78b5',
    decorate(ctx, b) {
      doorAt(ctx, 'L', b.y1, 0.7, 1.3, 3, 18, '#5a8fc9');
      windowAt(ctx, 'R', b.x1, 0.45, 0.9, 9, 18);
      windowAt(ctx, 'R', b.x1, 1.1, 1.55, 9, 18);
      // bańki na mleko
      for (const u of [0.32, 1.55]) {
        const p = P(u, b.y1 + 0.25, 0);
        poly(ctx, [[p[0] - 3, p[1]], [p[0] + 3, p[1]], [p[0] + 3, p[1] - 8], [p[0] - 3, p[1] - 8]], '#cfd6dc', INK, 0.9);
        ellipse(ctx, p[0], p[1] - 8, 3, 1.2, '#e8eef2', INK, 0.8);
        poly(ctx, [[p[0] - 1.5, p[1] - 9], [p[0] + 1.5, p[1] - 9], [p[0] + 1.5, p[1] - 11], [p[0] - 1.5, p[1] - 11]], '#cfd6dc', INK, 0.8);
      }
    },
    after(ctx, b) { signL(ctx, b.y1, 1.0, 32, '🧀'); }
  }),
  jamhouse: ctx => genericHouse(ctx, {
    w: 2, h: 2, wallH: 24, wall: '#f2c6cf', roof: '#8a4a8c', ridge: 'x', rise: 16, trim: '#fff',
    chimney: [0.5, 0.5, 30, 42], chimneyColor: '#9a6a9a',
    decorate(ctx, b) {
      doorAt(ctx, 'L', b.y1, 1.0, 1.45, 3, 17, '#8a4a8c');
      windowAt(ctx, 'L', b.y1, 0.35, 0.75, 9, 17, '#fff', '#c5568b');
      windowAt(ctx, 'R', b.x1, 0.6, 1.1, 9, 17, '#fff', '#c5568b');
      // skrzynka truskawek
      const p = P(1.75, b.y1 + 0.2, 0);
      poly(ctx, [[p[0] - 5, p[1]], [p[0] + 5, p[1]], [p[0] + 5, p[1] - 5], [p[0] - 5, p[1] - 5]], '#b98a52', INK, 0.8);
      for (let k = 0; k < 4; k++) circle(ctx, p[0] - 3.6 + k * 2.4, p[1] - 6, 1.5, '#e23240', INK, 0.5);
    },
    after(ctx, b) { signL(ctx, b.y1 + 0.3, 0.98, 27, '🍓'); }
  }),
  oilmill: ctx => genericHouse(ctx, {
    w: 2, h: 2, wallH: 26, wall: '#eed27a', roof: '#4f8a3a', ridge: 'y', rise: 17, wood: true, trim: '#8b5a2b',
    chimney: [0.45, 0.4, 34, 46], chimneyColor: '#8b5a2b',
    decorate(ctx, b) {
      doorAt(ctx, 'L', b.y1, 0.7, 1.3, 3, 18, '#7b5a2a');
      windowAt(ctx, 'R', b.x1, 0.6, 1.2, 10, 19);
      // beczka oleju
      const p = P(1.7, b.y1 + 0.25, 0);
      ellipse(ctx, p[0], p[1] - 0.5, 4, 2, '#8b5a2b', INK, 0.8);
      poly(ctx, [[p[0] - 4, p[1] - 0.5], [p[0] + 4, p[1] - 0.5], [p[0] + 4, p[1] - 9], [p[0] - 4, p[1] - 9]], '#a86d38', INK, 0.9);
      ellipse(ctx, p[0], p[1] - 9, 4, 2, '#c58a4c', INK, 0.8);
      line(ctx, [p[0] - 4, p[1] - 3], [p[0] + 4, p[1] - 3], '#555', 1);
      line(ctx, [p[0] - 4, p[1] - 7], [p[0] + 4, p[1] - 7], '#555', 1);
    },
    after(ctx, b) { signL(ctx, b.y1, 1.0, 34, '🌻'); }
  }),
  loom: ctx => genericHouse(ctx, {
    w: 2, h: 2, wallH: 24, wall: '#bcd8e8', roof: '#2f7f7a', ridge: 'x', rise: 16, trim: '#fff',
    decorate(ctx, b) {
      doorAt(ctx, 'L', b.y1, 0.75, 1.2, 3, 17, '#2f7f7a');
      windowAt(ctx, 'L', b.y1, 1.36, 1.7, 9, 17);
      windowAt(ctx, 'R', b.x1, 0.4, 0.85, 9, 17);
      windowAt(ctx, 'R', b.x1, 1.15, 1.6, 9, 17);
      // kłębki
      const p = P(0.35, b.y1 + 0.25, 0);
      circle(ctx, p[0], p[1] - 3, 3, '#e86aa0', INK, 0.8);
      circle(ctx, p[0] + 5, p[1] - 2.5, 2.6, '#7aa6e8', INK, 0.8);
    },
    after(ctx, b) { signL(ctx, b.y1 + 0.3, 0.98, 27, '🧶'); }
  }),
  kitchen: ctx => genericHouse(ctx, {
    w: 2, h: 2, wallH: 25, wall: '#d7a56b', roof: '#c4492f', ridge: 'y', rise: 18, wood: true, trim: '#7a4a24',
    chimney: [0.4, 0.5, 34, 48], chimneyColor: '#9a9088',
    decorate(ctx, b) {
      doorAt(ctx, 'L', b.y1, 0.7, 1.25, 3, 18, '#7a4a24');
      windowAt(ctx, 'R', b.x1, 0.5, 1.0, 9, 18, '#fff', '#c4492f');
      windowAt(ctx, 'L', b.y1, 1.45, 1.75, 9, 17, '#fff');
    },
    after(ctx, b) { signL(ctx, b.y1, 1.0, 33, '🍲'); }
  }),
  mill: ctx => {
    footShadow(ctx, 2, 2);
    const H = 44;
    const a0 = 0.32, a1 = 1.68, t0 = 0.58, t1 = 1.42;
    const stone = '#efe4cf';
    box(ctx, a0 - 0.08, a0 - 0.08, a1 + 0.08, a1 + 0.08, 0, 3, '#a39a8c', { lw: 1.1 });
    poly(ctx, [P(a0, a1, 3), P(a1, a1, 3), P(t1, t1, H), P(t0, t1, H)], stone);
    poly(ctx, [P(a1, a1, 3), P(a1, a0, 3), P(t1, t0, H), P(t1, t1, H)], shade(stone, -0.2));
    for (let k = 1; k < 7; k++) {
      const t = k / 7;
      const lerp = (p, q) => p + (q - p) * t;
      const zz = lerp(3, H);
      line(ctx, P(lerp(a0, t0), lerp(a1, t1), zz), P(lerp(a1, t1), lerp(a1, t1), zz), shade(stone, -0.15), 0.7);
      line(ctx, P(lerp(a1, t1), lerp(a1, t1), zz), P(lerp(a1, t1), lerp(a0, t0), zz), shade(stone, -0.32), 0.7);
    }
    doorAt(ctx, 'L', a1, 0.8, 1.2, 3, 15, '#7b4a2a');
    windowAt(ctx, 'R', 1.6, 0.8, 1.1, 22, 29);
    // czapa
    const top = [P(t0 - 0.12, t0 - 0.12, H), P(t1 + 0.12, t0 - 0.12, H), P(t1 + 0.12, t1 + 0.12, H), P(t0 - 0.12, t1 + 0.12, H)];
    const apex = P(1, 1, H + 18);
    poly(ctx, [top[3], top[2], apex], '#8b4f2c');
    poly(ctx, [top[2], top[1], apex], shade('#8b4f2c', -0.25));
    const hub = P(1, t1 + 0.15, H - 6);
    circle(ctx, hub[0], hub[1], 3, '#6b3e1e', INK, 1);
    return { hub };
  },
  well: ctx => {
    const c = P(0.5, 0.5, 0);
    shadow(ctx, c[0] + 4, c[1] + 3, 22, 10);
    const rx = 15, ry = 7.5, hgt = 11;
    const g = ctx.createLinearGradient(c[0] - rx, 0, c[0] + rx, 0);
    g.addColorStop(0, '#c9c1b4'); g.addColorStop(1, '#8f877b');
    ctx.beginPath();
    ctx.ellipse(c[0], c[1], rx, ry, 0, 0, Math.PI);
    ctx.lineTo(c[0] - rx, c[1] - hgt);
    ctx.ellipse(c[0], c[1] - hgt, rx, ry, 0, Math.PI, 0, true);
    ctx.closePath();
    ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1.3; ctx.stroke();
    // kamienie
    const r = rng(7);
    for (let row = 0; row < 3; row++) for (let k = 0; k < 6; k++) {
      const a = Math.PI * (k + (row % 2) * 0.5 + 0.5) / 6.5;
      const x = c[0] - Math.cos(a) * rx * 0.95;
      const y = c[1] - row * 3.6 - 2 + Math.sin(a) * ry * 0.9;
      ellipse(ctx, x, y, 2.4, 1.4, shade('#b7aea0', (r() - 0.5) * 0.3), shade(INK, 0.3), 0.6);
    }
    ellipse(ctx, c[0], c[1] - hgt, rx, ry, '#a89f92', INK, 1.3);
    ellipse(ctx, c[0], c[1] - hgt, rx - 3, ry - 1.8, '#244a6b', INK, 1);
    ellipse(ctx, c[0] - 3, c[1] - hgt - 1, 4, 1.2, 'rgba(160,220,255,.6)', null);
    // słupki i daszek
    for (const dx of [-rx + 2, rx - 2]) poly(ctx, [[c[0] + dx - 1.4, c[1] - hgt + 2], [c[0] + dx + 1.4, c[1] - hgt + 2], [c[0] + dx + 1.4, c[1] - 36], [c[0] + dx - 1.4, c[1] - 36]], '#8b5a2b', INK, 1);
    line(ctx, [c[0] - rx + 2, c[1] - 30], [c[0] + rx - 2, c[1] - 30], '#6b4423', 2);
    line(ctx, [c[0] + 2, c[1] - 30], [c[0] + 2, c[1] - 20], '#d8c39a', 0.8);
    poly(ctx, [[c[0] - 1, c[1] - 20], [c[0] + 5, c[1] - 20], [c[0] + 4, c[1] - 15], [c[0], c[1] - 15]], '#9aa3ab', INK, 0.8);
    poly(ctx, [[c[0] - rx - 4, c[1] - 34], [c[0], c[1] - 46], [c[0] + rx + 4, c[1] - 34], [c[0] + rx + 4, c[1] - 31], [c[0], c[1] - 43], [c[0] - rx - 4, c[1] - 31]], '#c4492f');
    return {};
  },
  board: ctx => {
    footShadow(ctx, 2, 2, 0);
    const Y = 1.2;
    for (const u of [0.35, 1.65]) box(ctx, u - 0.07, Y - 0.07, u + 0.07, Y + 0.07, 0, 36, '#8b5a2b');
    poly(ctx, quadL(Y + 0.08, 0.2, 1.8, 14, 34), '#c08a4f', INK, 1.5);
    planks(ctx, 'L', Y + 0.08, 0.2, 1.8, 14, 34, 5, '#9c6a38');
    // kartki z zamówieniami
    const notes = [[0.35, 0.75, 20, 31, '#fffdf3'], [0.85, 1.2, 18, 30, '#fff1a8'], [1.3, 1.68, 21, 32, '#d9f0ff']];
    for (const [u0, u1, z0, z1, col] of notes) {
      poly(ctx, quadL(Y + 0.1, u0, u1, z0, z1), col, INK, 0.8);
      for (let z = z0 + 2.5; z < z1 - 1.5; z += 2.5) line(ctx, P(u0 + 0.06, Y + 0.1, z), P(u1 - 0.06, Y + 0.1, z), '#9aa', 0.5);
      const pin = P((u0 + u1) / 2, Y + 0.1, z1 - 1);
      circle(ctx, pin[0], pin[1], 1.1, '#e23b2e', INK, 0.5);
    }
    // daszek
    poly(ctx, [P(0.1, Y - 0.2, 36), P(1.9, Y - 0.2, 36), P(1.9, Y + 0.35, 33), P(0.1, Y + 0.35, 33)], '#4f8a3a');
    // skrzynki
    box(ctx, 1.3, 1.45, 1.8, 1.9, 0, 6, '#c9a26a');
    box(ctx, 1.4, 1.5, 1.75, 1.85, 6, 11, '#d9b47a');
    const lp = P(0.5, 1.7, 0);
    circle(ctx, lp[0], lp[1] - 4, 4, '#e23b2e', INK, 0.8);
    circle(ctx, lp[0] + 6, lp[1] - 2, 3.5, '#f08b1c', INK, 0.8);
    return {};
  },
  hive: ctx => {
    const c = P(0.5, 0.5, 0);
    shadow(ctx, c[0] + 3, c[1] + 2, 15, 7);
    const s = 0.22;
    for (const gx of [0.5 - s, 0.5 + s]) for (const gy of [0.5 - s, 0.5 + s]) {
      const p = P(gx, gy, 0); line(ctx, p, [p[0], p[1] - 5], '#6b4423', 1.6);
    }
    box(ctx, 0.5 - s - 0.06, 0.5 - s - 0.06, 0.5 + s + 0.06, 0.5 + s + 0.06, 5, 7, '#8b5a2b');
    box(ctx, 0.5 - s, 0.5 - s, 0.5 + s, 0.5 + s, 7, 15, '#f5e3a0');
    box(ctx, 0.5 - s, 0.5 - s, 0.5 + s, 0.5 + s, 15, 23, '#f2d36b');
    box(ctx, 0.5 - s - 0.05, 0.5 - s - 0.05, 0.5 + s + 0.05, 0.5 + s + 0.05, 23, 26, '#e8e2d4');
    const d = P(0.5, 0.5 + s, 9);
    poly(ctx, [[d[0] - 3, d[1]], [d[0] + 3, d[1]], [d[0] + 3, d[1] - 1.6], [d[0] - 3, d[1] - 1.6]], '#3d2615', null);
    return {};
  }
};

export function buildingSprite(kind, w, h) {
  return makeSprite('b:' + kind, -h * HW - 22, -100, w * HW + 32, (w + h) * HH + 26, BUILD_DRAW[kind]);
}

export function scaffoldSprite(w, h) {
  return makeSprite(`scaf:${w}x${h}`, -h * HW - 22, -60, w * HW + 32, (w + h) * HH + 26, ctx => {
    footShadow(ctx, w, h, 0);
    poly(ctx, [P(0.1, 0.1, 0), P(w - 0.1, 0.1, 0), P(w - 0.1, h - 0.1, 0), P(0.1, h - 0.1, 0)], '#c2a77a', '#8b6a3a', 1);
    const H = Math.min(34, 16 + w * 6);
    const posts = [[0.25, 0.25], [w - 0.25, 0.25], [w - 0.25, h - 0.25], [0.25, h - 0.25]];
    // tylne słupki i belki
    const wood = '#b07a44';
    for (const [x, y] of posts.slice(0, 2)) line(ctx, P(x, y, 0), P(x, y, H), wood, 2.4);
    box(ctx, 0.5, 0.5, w - 0.5, h - 0.5, 0, H * 0.5, '#d8c4a0', { lw: 1 });
    for (const z of [H * 0.45, H * 0.9]) {
      line(ctx, P(0.25, h - 0.25, z), P(w - 0.25, h - 0.25, z), shade(wood, -0.1), 2);
      line(ctx, P(w - 0.25, h - 0.25, z), P(w - 0.25, 0.25, z), shade(wood, -0.2), 2);
    }
    line(ctx, P(0.25, h - 0.25, 0), P(w - 0.25, h - 0.25, H * 0.9), shade(wood, -0.1), 1.4);
    for (const [x, y] of posts.slice(2)) line(ctx, P(x, y, 0), P(x, y, H), wood, 2.4);
    // deski i znak
    const p = P(w * 0.3, h - 0.05, 0);
    for (let k = 0; k < 3; k++) poly(ctx, [[p[0] - 8, p[1] - k * 2.2], [p[0] + 8, p[1] - k * 2.2 - 3], [p[0] + 8, p[1] - k * 2.2 - 5], [p[0] - 8, p[1] - k * 2.2 - 2]], '#d9a868', INK, 0.7);
    const sgn = P(w * 0.7, h - 0.2, 0);
    line(ctx, sgn, [sgn[0], sgn[1] - 14], '#6b4423', 1.6);
    poly(ctx, [[sgn[0] - 7, sgn[1] - 14], [sgn[0] + 7, sgn[1] - 14], [sgn[0] + 7, sgn[1] - 24], [sgn[0] - 7, sgn[1] - 24]], '#ffd23f', INK, 1);
    emojiAt(ctx, '🔨', sgn[0], sgn[1] - 19, 8);
  });
}

// ---------- zwierzęta (rysowane zwrócone w prawo) ----------
const ANIMAL_DRAW = {
  chicken(ctx) {
    shadow(ctx, 0, 0, 7, 2.5);
    line(ctx, [-1.5, -5], [-2, 0], '#e8962e', 1.2);
    line(ctx, [1.5, -5], [1.5, 0], '#e8962e', 1.2);
    // ogon
    ellipse(ctx, -6.5, -11, 3, 4.5, '#f3efe6', INK, 1, -0.6);
    ellipse(ctx, 0, -9, 7, 5.5, '#ffffff', INK, 1.2);
    ellipse(ctx, -1, -9, 3.5, 2.5, '#eae4d6', null, 0, 0.2);
    circle(ctx, 5.5, -14, 3.6, '#ffffff', INK, 1.1);
    ctx.fillStyle = '#e23b2e';
    circle(ctx, 4.8, -18, 1.4, '#e23b2e', INK, 0.7);
    circle(ctx, 6.6, -17.6, 1.3, '#e23b2e', INK, 0.7);
    poly(ctx, [[8.6, -14.5], [11.5, -13.4], [8.6, -12.4]], '#f5a623', INK, 0.7);
    ellipse(ctx, 8, -11.6, 1, 1.5, '#e23b2e', null);
    circle(ctx, 6.3, -14.6, 0.9, '#222', null);
  },
  cow(ctx) {
    shadow(ctx, 0, 0, 16, 4);
    const body = '#fbfaf6';
    for (const [x, d] of [[-10, 0.1], [-6, 0], [7, 0.1], [11, 0]]) poly(ctx, [[x - 1.6, -10], [x + 1.6, -10], [x + 1.6, 0], [x - 1.6, 0]], shade(body, -d), INK, 1);
    for (const x of [-10, -6, 7, 11]) poly(ctx, [[x - 1.6, -1.6], [x + 1.6, -1.6], [x + 1.6, 0], [x - 1.6, 0]], '#3a3a3a', null);
    // ogon
    ctx.strokeStyle = INK; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-14, -17); ctx.quadraticCurveTo(-18, -12, -16.5, -6); ctx.stroke();
    ellipse(ctx, -16.5, -5.5, 1.3, 2, '#3a3a3a', null);
    ellipse(ctx, 0, -15, 15, 8.5, body, INK, 1.3);
    ctx.save();
    ctx.beginPath(); ctx.ellipse(0, -15, 15, 8.5, 0, 0, Math.PI * 2); ctx.clip();
    ellipse(ctx, -6, -18, 5, 4, '#2f2f33', null);
    ellipse(ctx, 4, -11, 4.5, 3.4, '#2f2f33', null);
    ellipse(ctx, 9, -20, 3, 2.5, '#2f2f33', null);
    ctx.restore();
    ellipse(ctx, 3, -8, 3.5, 2, '#f6b8c4', INK, 0.8);
    // głowa
    ellipse(ctx, 15, -20, 6, 6.5, body, INK, 1.2);
    ellipse(ctx, 18.5, -16, 4.6, 3.6, '#f6b8c4', INK, 1);
    circle(ctx, 17.4, -16, 0.7, '#7a3a48', null);
    circle(ctx, 20, -16, 0.7, '#7a3a48', null);
    circle(ctx, 16.5, -21.5, 1, '#222', null);
    ellipse(ctx, 10.5, -24, 3, 1.6, '#2f2f33', INK, 0.8, -0.4);
    poly(ctx, [[13, -26], [14, -30], [15.5, -26]], '#e9dfc2', INK, 0.7);
    poly(ctx, [[17, -26], [18.5, -29.5], [19, -25.5]], '#e9dfc2', INK, 0.7);
    // dzwonek
    circle(ctx, 13.5, -13.5, 1.6, '#f2c84b', INK, 0.6);
  },
  pig(ctx) {
    shadow(ctx, 0, 0, 12, 3.5);
    const pink = '#f7a8b8';
    for (const x of [-7, -4, 5, 8]) poly(ctx, [[x - 1.6, -7], [x + 1.6, -7], [x + 1.6, 0], [x - 1.6, 0]], shade(pink, -0.08), INK, 1);
    ctx.strokeStyle = shade(pink, -0.4); ctx.lineWidth = 1.1;
    ctx.beginPath(); ctx.arc(-12.5, -12, 2, 0, Math.PI * 1.6); ctx.stroke();
    ellipse(ctx, 0, -11, 12, 7.5, pink, INK, 1.3);
    ellipse(ctx, -2, -14, 6, 2.5, shade(pink, 0.25), null);
    circle(ctx, 10, -14, 5.5, pink, INK, 1.2);
    poly(ctx, [[6.5, -18], [7.5, -23], [10.5, -19]], shade(pink, -0.1), INK, 0.9);
    ellipse(ctx, 14.5, -13, 2.5, 3, shade(pink, -0.12), INK, 1);
    circle(ctx, 14.2, -14, 0.6, '#8a4a5a', null);
    circle(ctx, 14.8, -12, 0.6, '#8a4a5a', null);
    circle(ctx, 11, -16, 0.9, '#222', null);
  },
  sheep(ctx) {
    shadow(ctx, 0, 0, 13, 3.5);
    for (const x of [-7, -4, 5, 8]) poly(ctx, [[x - 1.3, -8], [x + 1.3, -8], [x + 1.3, 0], [x - 1.3, 0]], '#3b3333', INK, 0.8);
    const wool = '#f8f4ea';
    const puffs = [[-9, -12, 5], [-4, -16, 5.5], [2, -17, 5.5], [7, -13, 5], [0, -10, 6], [-6, -9, 5], [5, -9, 5]];
    for (const [x, y, r] of puffs) circle(ctx, x, y, r, wool, INK, 1.1);
    for (const [x, y, r] of puffs) circle(ctx, x - r * 0.25, y - r * 0.3, r * 0.45, '#ffffff', null);
    ellipse(ctx, 12, -15, 4, 5, '#3b3333', INK, 1.1);
    ellipse(ctx, 9.5, -18.5, 2.5, 1.3, '#3b3333', INK, 0.8, -0.5);
    circle(ctx, 11.5, -20, 3, wool, INK, 0.9);
    circle(ctx, 13, -15.5, 0.9, '#fff', null);
    circle(ctx, 13.2, -15.5, 0.5, '#111', null);
  }
};

export function animalSprite(kind, flip) {
  return makeSprite(`a:${kind}:${flip ? 1 : 0}`, -26, -40, 26, 6, ctx => {
    if (flip) ctx.scale(-1, 1);
    ANIMAL_DRAW[kind](ctx);
  });
}

// ---------- drzewa ----------
function canopy(ctx, cx, cy, R, color, r) {
  const blobs = [[0, 0, 1], [-0.55, 0.25, 0.7], [0.55, 0.25, 0.7], [-0.3, -0.45, 0.68], [0.35, -0.42, 0.66], [0, 0.45, 0.65]];
  for (const [dx, dy, k] of blobs) circle(ctx, cx + dx * R, cy + dy * R, R * k, shade(color, -0.15), INK, 1.3);
  for (const [dx, dy, k] of blobs) circle(ctx, cx + dx * R - 1, cy + dy * R - 1.5, R * k * 0.8, color, null);
  for (let i = 0; i < 6; i++) circle(ctx, cx + (r() - 0.6) * R * 1.2, cy + (r() - 0.8) * R, R * 0.18, shade(color, 0.22), null);
}

export function treeSprite(kind, state) {
  // kind: id drzewa owocowego albo 'oak'/'spruce'/'birch'; state: 'ready'|'grow'|'young'|'deco'
  return makeSprite(`t:${kind}:${state}`, -40, -95, 40, 2 * HH + 6, ctx => {
    const base = P(0.5, 0.5, 0);
    const [x, y] = base;
    const r = rng(kind.length * 31 + 7);
    if (kind === 'spruce') {
      shadow(ctx, x + 6, y + 2, 14, 6);
      poly(ctx, [[x - 2, y], [x + 2, y], [x + 2, y - 10], [x - 2, y - 10]], '#6b4423', INK, 1);
      const layers = [[-10, 16], [-22, 13], [-33, 10], [-43, 7]];
      for (const [dy, wdt] of layers) {
        poly(ctx, [[x - wdt, y + dy + 2], [x, y + dy - 18], [x + wdt, y + dy + 2]], '#2f7a3a', INK, 1.2);
        poly(ctx, [[x - wdt + 3, y + dy], [x - 1, y + dy - 15], [x - 2, y + dy]], '#3f9a4a', null);
      }
      return;
    }
    if (kind === 'birch') {
      shadow(ctx, x + 6, y + 2, 14, 6);
      poly(ctx, [[x - 2.2, y], [x + 2.2, y], [x + 1.6, y - 30], [x - 1.6, y - 30]], '#f2efe8', INK, 1);
      for (let i = 0; i < 6; i++) line(ctx, [x - 2, y - 4 - i * 4.5], [x - 0.3, y - 4.5 - i * 4.5], '#333', 1);
      canopy(ctx, x, y - 38, 13, '#9ccf52', r);
      return;
    }
    if (kind === 'oak') {
      shadow(ctx, x + 8, y + 2, 20, 8);
      poly(ctx, [[x - 4, y], [x + 4, y], [x + 2.5, y - 22], [x - 2.5, y - 22]], '#7a4e2a', INK, 1.2);
      canopy(ctx, x, y - 38, 19, '#4f9a3a', r);
      return;
    }
    const t = TREES[kind];
    const young = state === 'young';
    const R = young ? 10 : 14;
    shadow(ctx, x + 6, y + 2, R + 2, 6);
    poly(ctx, [[x - 2.6, y], [x + 2.6, y], [x + 1.8, y - (young ? 14 : 18)], [x - 1.8, y - (young ? 14 : 18)]], '#7a4e2a', INK, 1.1);
    const leaf = kind === 'cherry' ? '#3f8f3a' : kind === 'pear' ? '#7cbf45' : kind === 'peach' ? '#5ea83b' : '#58a83c';
    const cy = y - (young ? 24 : 32);
    canopy(ctx, x, cy, R, leaf, r);
    if (state === 'ready') {
      const fr = rng(kind.length * 5 + 3);
      for (let i = 0; i < 9; i++) {
        const fx = x + (fr() - 0.5) * R * 1.7;
        const fy = cy + (fr() - 0.35) * R * 1.4;
        if (kind === 'cherry') {
          line(ctx, [fx, fy - 3], [fx + 1, fy - 5], '#3d5a1a', 0.6);
          circle(ctx, fx, fy, 1.8, t.color, INK, 0.6);
        } else if (kind === 'pear') {
          ellipse(ctx, fx, fy, 2, 2.7, t.color, INK, 0.6);
        } else {
          circle(ctx, fx, fy, 2.4, t.color, INK, 0.6);
        }
        circle(ctx, fx - 0.7, fy - 0.8, 0.6, 'rgba(255,255,255,.7)', null);
      }
    } else if (state === 'grow' && !young) {
      const fr = rng(kind.length * 9 + 1);
      for (let i = 0; i < 7; i++) circle(ctx, x + (fr() - 0.5) * R * 1.7, cy + (fr() - 0.4) * R * 1.3, 1.2, kind === 'cherry' ? '#ffd9e6' : '#fff7f0', null);
    }
  });
}

// ---------- dekoracje i przeszkody ----------
const DECOR_DRAW = {
  path(ctx) {
    const i = 0.02;
    poly(ctx, [P(i, i), P(1 - i, i), P(1 - i, 1 - i), P(i, 1 - i)], '#d9c8a2', null);
    const r = rng(11);
    for (let k = 0; k < 7; k++) {
      const p = P(0.15 + r() * 0.7, 0.15 + r() * 0.7, 0);
      ellipse(ctx, p[0], p[1], 5 + r() * 3, 2.5 + r() * 1.5, shade('#bfb3a0', (r() - 0.5) * 0.25), shade('#8a7f6e', 0), 0.8);
    }
  },
  fence_a(ctx) { fence(ctx, 'x'); },
  fence_b(ctx) { fence(ctx, 'y'); },
  flowers(ctx) {
    const pts = [P(0.15, 0.15), P(0.85, 0.15), P(0.85, 0.85), P(0.15, 0.85)];
    poly(ctx, pts, '#6e4423', '#4a2c17', 1);
    const cols = ['#ff5a7a', '#ffd23f', '#ff8c42', '#c46cff', '#ffffff', '#ff4d4d'];
    const r = rng(5);
    const spots = [];
    for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) spots.push([0.28 + a * 0.22, 0.28 + b * 0.22]);
    spots.sort((p, q) => p[0] + p[1] - q[0] - q[1]);
    for (const [u, v] of spots) {
      const [x, y] = P(u, v, 0);
      line(ctx, [x, y], [x, y - 6], '#3f8a2a', 1);
      leaf(ctx, x, y - 2, 4, -0.5, '#5aa83a', 0.4);
      const c = cols[Math.floor(r() * cols.length)];
      for (let k = 0; k < 5; k++) circle(ctx, x + Math.cos(k * 1.256) * 1.8, y - 7 + Math.sin(k * 1.256) * 1.8, 1.4, c, shade(c, -0.4), 0.4);
      circle(ctx, x, y - 7, 1, '#ffd23f', null);
    }
  },
  bush(ctx) {
    const [x, y] = P(0.5, 0.5);
    shadow(ctx, x + 4, y + 1, 14, 5);
    const r = rng(3);
    canopy(ctx, x, y - 8, 9, '#4f9a3a', r);
  },
  scarecrow(ctx) {
    const [x, y] = P(0.5, 0.5);
    shadow(ctx, x + 3, y, 8, 3);
    line(ctx, [x, y], [x, y - 34], '#7a4e2a', 2.2);
    line(ctx, [x - 12, y - 24], [x + 12, y - 24], '#7a4e2a', 2);
    poly(ctx, [[x - 9, y - 27], [x + 9, y - 27], [x + 7, y - 12], [x - 7, y - 12]], '#d9433a', INK, 1);
    line(ctx, [x - 7, y - 20], [x + 7, y - 20], '#f2c84b', 0.8);
    line(ctx, [x, y - 27], [x, y - 12], '#f2c84b', 0.8);
    for (const s of [-1, 1]) for (let k = 0; k < 3; k++) line(ctx, [x + s * 12, y - 24], [x + s * (14 + k), y - 21 + k * 1.5], '#e9c44a', 0.8);
    circle(ctx, x, y - 32, 5, '#f3ddb0', INK, 1);
    circle(ctx, x - 1.8, y - 33, 0.8, '#222', null);
    circle(ctx, x + 1.8, y - 33, 0.8, '#222', null);
    ctx.beginPath(); ctx.arc(x, y - 31.5, 2, 0.2, Math.PI - 0.2); ctx.strokeStyle = INK; ctx.lineWidth = 0.7; ctx.stroke();
    ellipse(ctx, x, y - 36, 9, 2.5, '#d4a73a', INK, 1);
    poly(ctx, [[x - 4.5, y - 36], [x + 4.5, y - 36], [x + 3, y - 42], [x - 3, y - 42]], '#e3b84a', INK, 1);
    line(ctx, [x - 4.3, y - 37.5], [x + 4.3, y - 37.5], '#c4492f', 1.4);
  },
  hay(ctx) {
    box(ctx, 0.2, 0.25, 0.8, 0.75, 0, 12, '#eac25a', { top: '#f4d77a', right: '#cfa13e' });
    for (let z = 3; z < 12; z += 3) line(ctx, P(0.2, 0.75, z), P(0.8, 0.75, z), '#c8982f', 0.6);
    line(ctx, P(0.4, 0.75, 0), P(0.4, 0.75, 12), '#8b5a2b', 1.2);
    line(ctx, P(0.8, 0.45, 0), P(0.8, 0.45, 12), '#8b5a2b', 1.2);
  },
  barrel(ctx) {
    const [x, y] = P(0.5, 0.5);
    shadow(ctx, x + 3, y + 1, 9, 4);
    ctx.beginPath();
    ctx.moveTo(x - 7, y - 1); ctx.quadraticCurveTo(x - 9, y - 9, x - 7, y - 17);
    ctx.lineTo(x + 7, y - 17); ctx.quadraticCurveTo(x + 9, y - 9, x + 7, y - 1);
    ctx.ellipse(x, y - 1, 7, 3, 0, 0, Math.PI);
    ctx.closePath();
    const g = ctx.createLinearGradient(x - 8, 0, x + 8, 0);
    g.addColorStop(0, '#b77a3d'); g.addColorStop(1, '#7a4e22');
    ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1.2; ctx.stroke();
    ellipse(ctx, x, y - 17, 7, 3, '#c78f50', INK, 1);
    for (const dy of [-4, -13]) { ctx.beginPath(); ctx.ellipse(x, y + dy, 8.3, 3.2, 0, 0, Math.PI); ctx.strokeStyle = '#555'; ctx.lineWidth = 1.4; ctx.stroke(); }
  },
  bench(ctx) {
    const wood = '#b77a3d';
    for (const u of [0.25, 0.75]) box(ctx, u - 0.04, 0.5, u + 0.04, 0.58, 0, 6, '#6b4423');
    box(ctx, 0.15, 0.4, 0.85, 0.62, 6, 8, wood);
    box(ctx, 0.15, 0.36, 0.85, 0.42, 8, 16, shade(wood, -0.05));
    line(ctx, P(0.15, 0.42, 12), P(0.85, 0.42, 12), shade(wood, -0.3), 0.7);
  },
  lamp(ctx) {
    const [x, y] = P(0.5, 0.5);
    shadow(ctx, x + 2, y, 6, 2.5);
    poly(ctx, [[x - 3, y], [x + 3, y], [x + 3, y - 3], [x - 3, y - 3]], '#3b3f47', INK, 0.8);
    line(ctx, [x, y - 3], [x, y - 34], '#3b3f47', 2);
    poly(ctx, [[x - 4, y - 34], [x + 4, y - 34], [x + 3, y - 42], [x - 3, y - 42]], '#ffe9a3', INK, 1);
    poly(ctx, [[x - 5, y - 42], [x + 5, y - 42], [x, y - 47]], '#3b3f47', INK, 1);
    return { glow: [x, y - 38] };
  },
  pond(ctx) {
    const [x, y] = P(1, 1);
    shadow(ctx, x + 3, y + 3, 52, 24, 0.15);
    const r = rng(9);
    for (let k = 0; k < 22; k++) {
      const a = k / 22 * Math.PI * 2;
      ellipse(ctx, x + Math.cos(a) * 46, y + Math.sin(a) * 22, 6, 4, shade('#b7aea0', (r() - 0.5) * 0.3), INK, 0.8);
    }
    const g = ctx.createLinearGradient(x, y - 22, x, y + 22);
    g.addColorStop(0, '#5fb4d9'); g.addColorStop(1, '#2a7fb0');
    ellipse(ctx, x, y, 43, 19.5, g, '#24617f', 1.2);
    ellipse(ctx, x - 10, y - 6, 14, 3, 'rgba(255,255,255,.35)', null);
    for (const [dx, dy] of [[14, 4], [-18, 6], [6, -8]]) {
      ctx.beginPath(); ctx.ellipse(x + dx, y + dy, 5, 2.6, 0, 0.4, Math.PI * 2 - 0.1); ctx.lineTo(x + dx, y + dy); ctx.closePath();
      ctx.fillStyle = '#5aa83a'; ctx.fill(); ctx.strokeStyle = '#2f6a22'; ctx.lineWidth = 0.6; ctx.stroke();
    }
    circle(ctx, x + 15, y + 2.5, 1.8, '#ff9ec7', INK, 0.5);
    for (const dx of [-36, -30, 34]) {
      line(ctx, [x + dx, y - 6], [x + dx + 1, y - 22], '#4f8a3a', 1.2);
      ellipse(ctx, x + dx + 1, y - 22, 1.4, 3.5, '#7a4e2a', null);
    }
  },
  cart(ctx) {
    footShadow(ctx, 2, 1, 0);
    box(ctx, 0.25, 0.25, 1.75, 0.8, 8, 16, '#b77a3d');
    planks(ctx, 'L', 0.8, 0.25, 1.75, 8, 16, 3, '#7a4e22');
    for (const [u, z] of [[0.55, 18], [0.95, 19], [1.35, 18], [0.75, 22], [1.15, 22]]) {
      const p = P(u, 0.5, z);
      ellipse(ctx, p[0], p[1], 5.5, 4.2, '#f08b1c', INK, 0.9);
      line(ctx, [p[0], p[1] - 4], [p[0] + 1, p[1] - 6], '#5b7a2a', 1.3);
    }
    for (const u of [0.5, 1.5]) {
      const p = P(u, 0.85, 7);
      ellipse(ctx, p[0], p[1], 6.5, 7.5, '#8b5a2b', INK, 1.2, 0.5);
      ellipse(ctx, p[0], p[1], 4.8, 5.8, null, '#5a3519', 0.8, 0.5);
      circle(ctx, p[0], p[1], 1.4, '#555', null);
    }
    line(ctx, P(1.75, 0.5, 10), P(2.3, 0.5, 4), '#7a4e22', 1.6);
  },
  fountain(ctx) {
    const [x, y] = P(1, 1);
    shadow(ctx, x + 3, y + 3, 40, 18, 0.18);
    ctx.beginPath(); ctx.ellipse(x, y, 34, 16, 0, 0, Math.PI); ctx.lineTo(x - 34, y - 8); ctx.ellipse(x, y - 8, 34, 16, 0, Math.PI, 0, true); ctx.closePath();
    ctx.fillStyle = '#cfc6b6'; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1.3; ctx.stroke();
    ellipse(ctx, x, y - 8, 34, 16, '#e3dbcc', INK, 1.3);
    ellipse(ctx, x, y - 8, 29, 13, '#4fa8d6', '#24617f', 1);
    poly(ctx, [[x - 3, y - 8], [x + 3, y - 8], [x + 2.5, y - 26], [x - 2.5, y - 26]], '#e3dbcc', INK, 1);
    ellipse(ctx, x, y - 26, 11, 4.5, '#e3dbcc', INK, 1.2);
    ellipse(ctx, x, y - 26.5, 8.5, 3.2, '#6cc0e6', null);
    return { spout: [x, y - 30] };
  },
  gnome(ctx) {
    const [x, y] = P(0.5, 0.5);
    shadow(ctx, x + 2, y, 6, 2.5);
    ellipse(ctx, x, y - 6, 5, 6, '#3f78b5', INK, 1);
    ellipse(ctx, x, y - 12, 4.5, 4, '#ffffff', INK, 1);
    circle(ctx, x, y - 15, 3, '#f6c9a8', INK, 0.9);
    poly(ctx, [[x - 4, y - 16], [x + 4, y - 16], [x + 1, y - 27]], '#d9433a', INK, 1);
    circle(ctx, x - 1, y - 15.5, 0.5, '#222', null);
    circle(ctx, x + 1.2, y - 15.5, 0.5, '#222', null);
  },
  sprinkler(ctx) {
    const [x, y] = P(0.5, 0.5);
    ellipse(ctx, x, y, 7, 3.5, '#7f8c95', INK, 1);
    line(ctx, [x, y], [x, y - 12], '#9aa6ae', 2.2);
    ellipse(ctx, x, y - 12, 3.2, 1.6, '#3f78b5', INK, 0.9);
    return { spout: [x, y - 13] };
  },
  sale(ctx) {
    const [x, y] = P(0.5, 0.5);
    shadow(ctx, x + 3, y + 1, 10, 3);
    for (const dx of [-9, 9]) line(ctx, [x + dx, y], [x + dx, y - 22], '#6b4423', 2.4);
    poly(ctx, [[x - 15, y - 34], [x + 15, y - 34], [x + 15, y - 18], [x - 15, y - 18]], '#f3dfb2', INK, 1.4);
    ctx.fillStyle = '#b5352a';
    ctx.font = '700 6.4px Fredoka, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('NA', x, y - 29.5);
    ctx.fillText('SPRZEDAŻ', x, y - 23);
  },
  // przeszkody
  weeds(ctx) {
    const r = rng(21);
    for (let k = 0; k < 7; k++) {
      const [x, y] = P(0.2 + r() * 0.6, 0.2 + r() * 0.6);
      for (let j = -2; j <= 2; j++) leaf(ctx, x, y, 7 + r() * 4, -Math.PI / 2 + j * 0.35, j % 2 ? '#4a7f2a' : '#6a9a35', 0.22);
    }
    const [x, y] = P(0.6, 0.4);
    circle(ctx, x, y - 8, 1.6, '#ffe14a', INK, 0.5);
  },
  stone(ctx) {
    const [x, y] = P(0.5, 0.5);
    shadow(ctx, x + 4, y + 2, 13, 5);
    poly(ctx, [[x - 12, y + 1], [x - 10, y - 8], [x - 3, y - 13], [x + 6, y - 11], [x + 12, y - 4], [x + 11, y + 2], [x, y + 4]], '#9a9a9a', INK, 1.3);
    poly(ctx, [[x - 10, y - 8], [x - 3, y - 13], [x + 6, y - 11], [x + 2, y - 6], [x - 6, y - 5]], '#bdbdbd', null);
    poly(ctx, [[x + 2, y - 6], [x + 6, y - 11], [x + 12, y - 4], [x + 11, y + 2]], '#7f7f7f', null);
    ellipse(ctx, x - 13, y + 2, 3.5, 2, '#a8a8a8', INK, 0.8);
    circle(ctx, x - 4, y - 9, 1.5, 'rgba(255,255,255,.45)', null);
  },
  stump(ctx) {
    const [x, y] = P(0.5, 0.5);
    shadow(ctx, x + 4, y + 2, 13, 5);
    for (const [dx, a] of [[-10, 0.3], [9, -0.3]]) ellipse(ctx, x + dx, y + 1, 5, 2, '#7a4e2a', INK, 0.8, a);
    ctx.beginPath(); ctx.moveTo(x - 9, y - 9); ctx.lineTo(x - 9, y); ctx.ellipse(x, y, 9, 4, 0, Math.PI, 0, true); ctx.lineTo(x + 9, y - 9); ctx.closePath();
    ctx.fillStyle = '#8b5a2b'; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1.2; ctx.stroke();
    for (const dx of [-5, 0, 5]) line(ctx, [x + dx, y - 8], [x + dx, y + 2], '#6b4423', 0.7);
    ellipse(ctx, x, y - 9, 9, 4, '#e3bc84', INK, 1.1);
    ellipse(ctx, x, y - 9, 6, 2.6, null, '#b88a52', 0.7);
    ellipse(ctx, x, y - 9, 3, 1.3, null, '#b88a52', 0.7);
    line(ctx, [x - 3, y - 18], [x - 2, y - 9], '#5f9e3a', 1);
    leaf(ctx, x - 3, y - 15, 5, -2.4, '#6fbd40', 0.4);
  }
};

function fence(ctx, axis) {
  const wood = '#c79253';
  const A = axis === 'x' ? [0, 0.5] : [0.5, 0];
  const B = axis === 'x' ? [1, 0.5] : [0.5, 1];
  const posts = [0.06, 0.5, 0.94].map(t => [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t]);
  const sh = shade('#2f4a17', 0);
  ctx.save(); ctx.globalAlpha = 0.25;
  line(ctx, P(A[0] + 0.1, A[1] + 0.1), P(B[0] + 0.1, B[1] + 0.1), sh, 3);
  ctx.restore();
  for (const z of [5, 10]) {
    const a = P(A[0], A[1], z), b = P(B[0], B[1], z);
    line(ctx, a, b, INK, 3.2);
    line(ctx, a, b, wood, 2);
  }
  for (const [u, v] of posts) {
    const p = P(u, v, 0);
    poly(ctx, [[p[0] - 1.6, p[1]], [p[0] + 1.6, p[1]], [p[0] + 1.6, p[1] - 12], [p[0], p[1] - 14], [p[0] - 1.6, p[1] - 12]], shade(wood, 0.05), INK, 1);
  }
}

export function decorSprite(kind, w = 1, h = 1) {
  if (kind === 'spruce' || kind === 'birch') return treeSprite(kind, 'deco');
  return makeSprite('d:' + kind, -h * HW - 22, -60, w * HW + 32, (w + h) * HH + 26, DECOR_DRAW[kind]);
}

// ---------- ikony przedmiotów (własne rysunki) ----------
const iconCache = new Map();
export function customIcon(code) {
  if (iconCache.has(code)) return iconCache.get(code);
  const [type, color] = code.slice(1).split(':');
  const c = document.createElement('canvas');
  c.width = c.height = 96;
  const ctx = c.getContext('2d');
  ctx.scale(3, 3);
  ctx.lineJoin = 'round';
  if (type === 'sack') {
    ctx.beginPath();
    ctx.moveTo(9, 28); ctx.quadraticCurveTo(5, 18, 11, 11); ctx.lineTo(21, 11); ctx.quadraticCurveTo(27, 18, 23, 28); ctx.closePath();
    ctx.fillStyle = color; ctx.fill(); ctx.strokeStyle = '#8a6a3a'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(11, 11); ctx.lineTo(9, 5); ctx.lineTo(16, 8); ctx.lineTo(23, 5); ctx.lineTo(21, 11); ctx.closePath();
    ctx.fillStyle = shade(color, -0.08); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#b5532f'; ctx.fillRect(10, 10, 12, 2.2);
    ctx.fillStyle = '#8a6a3a'; ctx.font = 'bold 8px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('M', 16, 23);
  } else if (type === 'jar') {
    ctx.fillStyle = 'rgba(220,240,255,.7)'; ctx.strokeStyle = '#5a6b78'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.roundRect(7, 9, 18, 20, 4); ctx.fill(); ctx.stroke();
    ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(8.5, 13, 15, 14.5, 3); ctx.fill();
    ctx.fillStyle = '#fff3d6'; ctx.fillRect(10, 17, 12, 6); ctx.strokeStyle = '#c9a26a'; ctx.lineWidth = 0.6; ctx.strokeRect(10, 17, 12, 6);
    ctx.fillStyle = '#d9433a'; ctx.beginPath(); ctx.roundRect(6, 4, 20, 6, 2); ctx.fill(); ctx.strokeStyle = '#7a2a20'; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.fillStyle = '#fff'; for (let i = 0; i < 4; i++) ctx.fillRect(8 + i * 4.5, 5, 2.2, 2.2);
    ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fillRect(9, 13, 2, 12);
  } else if (type === 'bottle') {
    ctx.beginPath();
    ctx.moveTo(13, 4); ctx.lineTo(19, 4); ctx.lineTo(19, 10); ctx.quadraticCurveTo(24, 13, 24, 18); ctx.lineTo(24, 28); ctx.lineTo(8, 28); ctx.lineTo(8, 18); ctx.quadraticCurveTo(8, 13, 13, 10); ctx.closePath();
    ctx.fillStyle = color; ctx.fill(); ctx.strokeStyle = shade(color, -0.5); ctx.lineWidth = 1.4; ctx.stroke();
    ctx.fillStyle = '#fff6df'; ctx.fillRect(9.5, 17, 13, 7);
    ctx.fillStyle = '#6b4423'; ctx.fillRect(12.5, 2, 7, 3.5);
    ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillRect(10, 13, 2, 14);
  }
  const url = c.toDataURL();
  iconCache.set(code, url);
  return url;
}
