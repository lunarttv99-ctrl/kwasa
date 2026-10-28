// Mapa: kamera, rysowanie sceny izometrycznej, dotyk/mysz i trafianie w obiekty.

import { MAP, BUILDINGS, DECOR } from './data.js';
import {
  P, HW, HH, rng, shade, setSpriteQuality, spriteHit, soilSprite, cropSprite, buildingSprite,
  scaffoldSprite, animalSprite, treeSprite, decorSprite, customIcon, ringFrontSprite
} from './sprites.js';

// Starsze Safari (< 16) nie ma roundRect na canvasie.
if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
    r = Math.min(typeof r === 'number' ? r : 0, w / 2, h / 2);
    this.moveTo(x + r, y);
    this.arcTo(x + w, y, x + w, y + h, r);
    this.arcTo(x + w, y + h, x, y + h, r);
    this.arcTo(x, y + h, x, y, r);
    this.arcTo(x, y, x + w, y, r);
    this.closePath();
  };
}

const MARGIN = 5;                 // pas lasu dookoła mapy
const MIN_Z = 0.45, MAX_Z = 2.4;
const DRAG_PX = 8;

export function createWorld(canvas, G) {
  const ctx = canvas.getContext('2d');
  const cam = { x: 0, y: 0, z: 1 };
  let W = 0, H = 0, dpr = 1;
  let ground = null;              // { c, ox, oy, scale }
  let wild = [];                  // drzewa i krzaki poza ziemią gracza
  let renderList = [];
  let lastT = performance.now();
  const floats = [];
  const anim = new Map();         // id zwierzęcia → stan chodzenia
  const clouds = [];
  const r0 = rng(99);
  for (let i = 0; i < 5; i++) clouds.push({ x: (r0() - 0.5) * 2200, y: r0() * 900, rx: 160 + r0() * 140, ry: 70 + r0() * 50, v: 6 + r0() * 6 });

  // ---------- rozmiar i jakość ----------
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 3);
    const rect = canvas.getBoundingClientRect();
    W = rect.width; H = rect.height;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    applyQuality();
  }
  function applyQuality() {
    const low = G.state.settings.quality === 'low';
    setSpriteQuality(low ? Math.min(2, dpr) : Math.min(3, dpr * 1.25));
  }

  // ---------- współrzędne ----------
  const toScreen = (wx, wy) => [(wx - cam.x) * cam.z + W / 2, (wy - cam.y) * cam.z + H / 2];
  const toWorld = (sx, sy) => [(sx - W / 2) / cam.z + cam.x, (sy - H / 2) / cam.z + cam.y];
  const worldToGrid = (wx, wy) => [(wx / HW + wy / HH) / 2, (wy / HH - wx / HW) / 2];

  function clampCam() {
    const c = P(MAP / 2, MAP / 2);
    const rx = MAP * HW * 0.85, ry = MAP * HH * 0.95;
    cam.x = Math.max(c[0] - rx, Math.min(c[0] + rx, cam.x));
    cam.y = Math.max(c[1] - ry, Math.min(c[1] + ry, cam.y));
    cam.z = Math.max(MIN_Z, Math.min(MAX_Z, cam.z));
  }
  function centerOnTile(gx, gy, z) {
    const [x, y] = P(gx, gy);
    cam.x = x; cam.y = y;
    if (z) cam.z = z;
    clampCam();
  }

  // ---------- trawa (rysowana raz do dużego bufora) ----------
  function buildGround() {
    const scale = G.state.settings.quality === 'low' ? 1 : 1.5;
    const minX = -(MAP + MARGIN) * HW - HW, maxX = (MAP + MARGIN) * HW + HW;
    const minY = -MARGIN * 2 * HH - HH, maxY = (MAP + MARGIN) * 2 * HH + HH;
    const c = ground?.c || document.createElement('canvas');
    c.width = Math.ceil((maxX - minX) * scale);
    c.height = Math.ceil((maxY - minY) * scale);
    const g = c.getContext('2d');
    g.setTransform(scale, 0, 0, scale, -minX * scale, -minY * scale);
    g.fillStyle = '#3f7a2c';
    g.fillRect(minX, minY, maxX - minX, maxY - minY);
    const r = rng(1234);
    const own = G.landRect();
    for (let gy = -MARGIN; gy < MAP + MARGIN; gy++) {
      for (let gx = -MARGIN; gx < MAP + MARGIN; gx++) {
        const inMap = gx >= 0 && gy >= 0 && gx < MAP && gy < MAP;
        const owned = gx >= own.x0 && gy >= own.y0 && gx < own.x1 && gy < own.y1;
        let base = owned ? '#88c84a' : inMap ? '#5f9c37' : '#4a8530';
        const checker = (gx + gy) % 2 === 0;
        const v = (r() - 0.5) * 0.06 + (checker && owned ? 0.035 : 0);
        const col = shade(base, v);
        const pts = [P(gx, gy), P(gx + 1, gy), P(gx + 1, gy + 1), P(gx, gy + 1)];
        g.beginPath();
        g.moveTo(...pts[0]); pts.slice(1).forEach(p => g.lineTo(...p)); g.closePath();
        g.fillStyle = col; g.fill();
        g.strokeStyle = col; g.lineWidth = 0.8; g.stroke();
      }
    }
    // kępki trawy i kwiatki
    for (let gy = -MARGIN; gy < MAP + MARGIN; gy++) {
      for (let gx = -MARGIN; gx < MAP + MARGIN; gx++) {
        const owned = gx >= own.x0 && gy >= own.y0 && gx < own.x1 && gy < own.y1;
        const n = owned ? 3 : 4;
        for (let k = 0; k < n; k++) {
          const [x, y] = P(gx + r(), gy + r());
          const dark = r() < 0.5;
          g.strokeStyle = owned ? (dark ? 'rgba(60,120,30,.55)' : 'rgba(190,235,120,.55)') : (dark ? 'rgba(40,90,25,.5)' : 'rgba(150,205,95,.4)');
          g.lineWidth = 1;
          g.beginPath();
          g.moveTo(x - 2, y - 3); g.lineTo(x, y); g.lineTo(x + 0.5, y - 4); g.moveTo(x, y); g.lineTo(x + 2.5, y - 2.5);
          g.stroke();
        }
        if (r() < (owned ? 0.06 : 0.1)) {
          const [x, y] = P(gx + r(), gy + r());
          const cols = ['#ffffff', '#ffe14a', '#ff9ec7', '#c9b6ff'];
          g.fillStyle = cols[Math.floor(r() * cols.length)];
          for (let k = 0; k < 4; k++) { g.beginPath(); g.arc(x + Math.cos(k * 1.57) * 1.3, y + Math.sin(k * 1.57) * 0.8, 1, 0, 7); g.fill(); }
          g.fillStyle = '#f5b82e'; g.beginPath(); g.arc(x, y, 0.7, 0, 7); g.fill();
        }
      }
    }
    // obrzeże ziemi gracza
    g.save();
    const corners = [P(own.x0, own.y0), P(own.x1, own.y0), P(own.x1, own.y1), P(own.x0, own.y1)];
    g.beginPath(); g.moveTo(...corners[0]); corners.slice(1).forEach(p => g.lineTo(...p)); g.closePath();
    g.strokeStyle = 'rgba(255,250,210,.55)'; g.lineWidth = 2.2; g.setLineDash([7, 6]); g.stroke();
    g.restore();
    // krawędź mapy
    const mc = [P(0, 0), P(MAP, 0), P(MAP, MAP), P(0, MAP)];
    g.beginPath(); g.moveTo(...mc[0]); mc.slice(1).forEach(p => g.lineTo(...p)); g.closePath();
    g.strokeStyle = 'rgba(30,60,20,.35)'; g.lineWidth = 3; g.stroke();
    ground = { c, ox: minX, oy: minY, w: maxX - minX, h: maxY - minY };
    buildWild(own);
  }

  function buildWild(own) {
    wild = [];
    const r = rng(777);
    for (let gy = -MARGIN; gy < MAP + MARGIN; gy++) {
      for (let gx = -MARGIN; gx < MAP + MARGIN; gx++) {
        const roll = r(), roll2 = r(), roll3 = r();
        const inMap = gx >= 0 && gy >= 0 && gx < MAP && gy < MAP;
        if (gx >= own.x0 && gy >= own.y0 && gx < own.x1 && gy < own.y1) continue;
        // nie zasłaniaj tabliczki „na sprzedaż”
        const sale = G.saleTile();
        if (sale && Math.abs(gx - sale[0]) <= 1 && Math.abs(gy - sale[1]) <= 1) continue;
        const density = inMap ? 0.09 : 0.5;
        if (roll > density) continue;
        let kind = roll2 < 0.45 ? 'oak' : roll2 < 0.8 ? 'spruce' : roll2 < 0.92 ? 'birch' : 'bush';
        if (inMap && roll3 < 0.35) kind = 'bush';
        wild.push({ gx, gy, kind });
      }
    }
  }

  // ---------- zwierzęta: chodzenie ----------
  function animalState(o) {
    let a = anim.get(o.id);
    if (!a || a.home !== `${o.x},${o.y}`) {
      a = { home: `${o.x},${o.y}`, px: o.x + 0.5, py: o.y + 0.5, tx: o.x + 0.5, ty: o.y + 0.5, wait: Math.random() * 2, flip: Math.random() < 0.5, step: 0 };
      anim.set(o.id, a);
    }
    return a;
  }
  function stepAnimals(dt) {
    for (const o of G.state.objects) {
      if (o.t !== 'a') continue;
      const a = animalState(o);
      const speed = o.k === 'chicken' ? 0.55 : o.k === 'cow' ? 0.3 : 0.38;
      const dx = a.tx - a.px, dy = a.ty - a.py;
      const d = Math.hypot(dx, dy);
      if (d < 0.02) {
        a.wait -= dt;
        a.moving = false;
        if (a.wait <= 0) {
          // nowy cel w okolicy domu, na wolnym polu
          for (let tries = 0; tries < 6; tries++) {
            const tx = o.x + 0.5 + (Math.random() - 0.5) * 3.2;
            const ty = o.y + 0.5 + (Math.random() - 0.5) * 3.2;
            if (G.walkable(Math.floor(tx), Math.floor(ty), o)) { a.tx = tx; a.ty = ty; break; }
          }
          a.wait = 1.5 + Math.random() * 4;
        }
      } else {
        const s = Math.min(d, speed * dt);
        a.px += dx / d * s; a.py += dy / d * s;
        const sx = (dx - dy);
        if (Math.abs(sx) > 0.01) a.flip = sx < 0;
        a.step += dt * 10;
        a.moving = true;
      }
    }
  }

  // ---------- lista rysowania ----------
  function buildRenderList(now) {
    const list = [];
    const flat = [];
    const S = G.state;
    for (const key in S.fields) {
      const f = S.fields[key];
      const [x, y] = key.split(',').map(Number);
      flat.push({ s: soilSprite(f.c ? 'planted' : 'plowed'), gx: x, gy: y });
      if (f.c) {
        const stage = G.cropStage(f, now);
        list.push({ kind: 'crop', s: cropSprite(f.c, stage), gx: x, gy: y, depth: x + y + 1, ripe: stage === 3, field: key });
      }
    }
    for (const o of S.objects) {
      if (G.ghost && G.ghost.obj === o) continue;
      const it = objectItem(o, now);
      if (!it) continue;
      if (it.flat) flat.push(it); else list.push(it);
    }
    for (const w of wild) {
      const s = w.kind === 'bush' ? decorSprite('bush') : treeSprite(w.kind, 'deco');
      list.push({ kind: 'wild', s, gx: w.gx, gy: w.gy, depth: w.gx + w.gy + 1 });
    }
    const sale = G.saleTile();
    if (sale) list.push({ kind: 'sale', s: decorSprite('sale'), gx: sale[0], gy: sale[1], depth: sale[0] + sale[1] + 1 });
    list.sort((a, b) => a.depth - b.depth || a.gy - b.gy);
    return { flat, list };
  }

  function objectItem(o, now) {
    if (o.t === 'b') {
      const def = BUILDINGS[o.k];
      const building = o.done && o.done > now;
      const s = building ? scaffoldSprite(def.w, def.h) : buildingSprite(o.k, def.w, def.h);
      return { kind: 'obj', o, s, gx: o.x, gy: o.y, depth: o.x + o.y + (def.w + def.h) / 2, building };
    }
    if (o.t === 'd') {
      const def = DECOR[o.k];
      const w = def.w || 1, h = def.h || 1;
      return { kind: 'obj', o, s: decorSprite(o.k, w, h), gx: o.x, gy: o.y, depth: o.x + o.y + (w + h) / 2, flat: !!def.flat };
    }
    if (o.t === 'o') return { kind: 'obj', o, s: decorSprite(o.k), gx: o.x, gy: o.y, depth: o.x + o.y + 1 };
    if (o.t === 'tree') {
      const st = G.treeState(o, now);
      return { kind: 'obj', o, s: treeSprite(o.k, st), gx: o.x, gy: o.y, depth: o.x + o.y + 1 };
    }
    if (o.t === 'a') {
      const a = animalState(o);
      return { kind: 'animal', o, a, s: animalSprite(o.k, a.flip), px: a.px, py: a.py, depth: a.px + a.py, gy: a.py };
    }
    return null;
  }

  function itemOrigin(it) {
    if (it.kind === 'animal') {
      const [x, y] = P(it.px, it.py);
      const bob = it.a.moving ? -Math.abs(Math.sin(it.a.step)) * 1.5 : 0;
      return [x, y + bob];
    }
    return P(it.gx, it.gy);
  }

  // ---------- rysowanie ----------
  function drawSprite(s, x, y, alpha = 1) {
    if (alpha !== 1) ctx.globalAlpha = alpha;
    ctx.drawImage(s.c, x + s.ox, y + s.oy, s.w, s.h);
    if (alpha !== 1) ctx.globalAlpha = 1;
  }

  function frame() {
    const now = Date.now();
    const t = performance.now();
    const dt = Math.min(0.1, (t - lastT) / 1000);
    lastT = t;
    stepAnimals(dt);
    for (const c of clouds) { c.x += c.v * dt; if (c.x > 1500) c.x = -1500; }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#3a7229';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const k = dpr * cam.z;
    ctx.setTransform(k, 0, 0, k, dpr * (W / 2 - cam.x * cam.z), dpr * (H / 2 - cam.y * cam.z));
    ctx.imageSmoothingEnabled = true;
    if (ground) ctx.drawImage(ground.c, ground.ox, ground.oy, ground.w, ground.h);

    const view = {
      x0: cam.x - W / 2 / cam.z - 60, x1: cam.x + W / 2 / cam.z + 60,
      y0: cam.y - H / 2 / cam.z - 40, y1: cam.y + H / 2 / cam.z + 120
    };
    const { flat, list } = buildRenderList(now);
    renderList = list;
    const visible = (s, x, y) => x + s.ox < view.x1 && x + s.ox + s.w > view.x0 && y + s.oy < view.y1 && y + s.oy + s.h > view.y0;

    for (const it of flat) {
      const [x, y] = P(it.gx, it.gy);
      if (visible(it.s, x, y)) drawSprite(it.s, x, y);
    }
    // podświetlenie pól w zasięgu spryskiwacza podczas stawiania
    if (G.ghost) drawGhostFootprint();

    const ts = t / 1000;
    for (const it of list) {
      const [x, y] = itemOrigin(it);
      if (!visible(it.s, x, y)) continue;
      it.sx = x; it.sy = y;
      if (it.kind === 'crop' && it.ripe) {
        const bx = x, by = y + HH;
        const sk = Math.sin(ts * 1.8 + it.gx * 0.9 + it.gy * 0.6) * 0.045;
        ctx.save();
        ctx.translate(bx, by); ctx.transform(1, 0, sk, 1, 0, 0); ctx.translate(-bx, -by);
        drawSprite(it.s, x, y);
        ctx.restore();
      } else if (it.kind === 'obj' && it.o.t === 'tree') {
        const bx = x, by = y + HH;
        const sk = Math.sin(ts * 0.9 + it.gx) * 0.015;
        ctx.save();
        ctx.translate(bx, by); ctx.transform(1, 0, sk, 1, 0, 0); ctx.translate(-bx, -by);
        drawSprite(it.s, x, y);
        ctx.restore();
      } else if (it.kind === 'wild') {
        drawSprite(it.s, x, y);
      } else if (it.kind === 'animal' && it.o.baby > now) {
        ctx.save();
        ctx.translate(x, y); ctx.scale(0.62, 0.62); ctx.translate(-x, -y);
        drawSprite(it.s, x, y);
        ctx.restore();
      } else {
        drawSprite(it.s, x, y);
        if (it.kind === 'obj') drawLive(it, x, y, ts, now);
      }
    }
    if (G.ghost) drawGhost(ts);

    // cienie chmur
    ctx.fillStyle = 'rgba(20,40,20,0.07)';
    const mc = P(MAP / 2, MAP / 2);
    for (const c of clouds) {
      ctx.beginPath();
      ctx.ellipse(mc[0] + c.x, c.y - 100, c.rx, c.ry, 0, 0, Math.PI * 2);
      ctx.ellipse(mc[0] + c.x + c.rx * 0.6, c.y - 100 + c.ry * 0.3, c.rx * 0.6, c.ry * 0.7, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // dymki z ikonami (gotowe produkty)
    for (const it of list) {
      if (it.sx === undefined) continue;
      const b = G.bubbleFor(it, now);
      it.bubble = null;
      if (!b) continue;
      const [bx, by] = bubblePos(it);
      it.bubble = [bx, by];
      drawBubble(bx, by + Math.sin(ts * 3 + it.gy) * 1.5, b);
    }
    for (const it of list) {
      if (it.sx === undefined || it.kind !== 'obj' || it.o.t !== 'b' || !it.building) continue;
      drawProgress(it, now);
    }
    drawFloats(t);
    requestAnimationFrame(frame);
  }

  function bubblePos(it) {
    if (it.kind === 'animal') return [it.sx, it.sy - (it.o.k === 'cow' ? 36 : it.o.k === 'chicken' ? 24 : 30)];
    if (it.o.t === 'tree') { const p = P(it.gx + 0.5, it.gy + 0.5, 62); return p; }
    if (it.o.t === 'b') {
      const d = BUILDINGS[it.o.k];
      if (d.kind === 'hive') return P(it.gx + 0.5, it.gy + 0.5, 36);
      return P(it.gx + d.w / 2, it.gy + d.h / 2, d.w >= 3 ? 64 : 52);
    }
    return P(it.gx + 0.5, it.gy + 0.5, 40);
  }

  function drawBubble(x, y, b) {
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,.25)';
    ctx.shadowBlur = 4; ctx.shadowOffsetY = 2;
    ctx.fillStyle = b.color || '#ffffff';
    ctx.beginPath();
    ctx.roundRect(x - 13, y - 26, 26, 24, 9);
    ctx.moveTo(x - 4, y - 3); ctx.lineTo(x, y + 4); ctx.lineTo(x + 4, y - 3);
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = 'rgba(61,38,21,.55)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.roundRect(x - 13, y - 26, 26, 24, 9); ctx.stroke();
    drawIcon(b.icon, x, y - 14, 16);
  }

  const imgCache = new Map();
  function drawIcon(icon, x, y, size) {
    if (icon.startsWith('@')) {
      let img = imgCache.get(icon);
      if (!img) { img = new Image(); img.src = customIcon(icon); imgCache.set(icon, img); }
      if (img.complete) ctx.drawImage(img, x - size / 2 - 1, y - size / 2 - 1, size + 2, size + 2);
      return;
    }
    ctx.font = `${size}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#000';
    ctx.fillText(icon, x, y + 1);
  }

  function drawProgress(it, now) {
    const o = it.o;
    const d = BUILDINGS[o.k];
    const total = o.done - o.start;
    const p = Math.max(0, Math.min(1, 1 - (o.done - now) / total));
    const [x, y] = P(o.x + d.w / 2, o.y + d.h / 2, 44);
    ctx.fillStyle = 'rgba(40,25,10,.75)';
    ctx.beginPath(); ctx.roundRect(x - 22, y - 5, 44, 9, 4.5); ctx.fill();
    ctx.fillStyle = '#ffd23f';
    ctx.beginPath(); ctx.roundRect(x - 20.5, y - 3.5, 41 * p, 6, 3); ctx.fill();
  }

  // Animacje na żywo: łopaty wiatraka, dym, pszczoły, woda.
  function drawLive(it, x, y, ts, now) {
    const o = it.o;
    if (o.t === 'b' && !it.building) {
      const meta = it.s.meta;
      const working = G.isWorking(o, now);
      if (meta.hub) drawBlades(ctx, x + meta.hub[0], y + meta.hub[1], ts * (working ? 2.2 : 0.5));
      if (meta.smoke && (working || o.k === 'house')) {
        for (let i = 0; i < 4; i++) {
          const p = ((ts * 0.35 + i / 4) % 1);
          const sx = x + meta.smoke[0] + Math.sin(p * 5 + i) * 3 + p * 8;
          const sy = y + meta.smoke[1] - p * 30;
          ctx.fillStyle = `rgba(235,235,235,${0.55 * (1 - p)})`;
          ctx.beginPath(); ctx.arc(sx, sy, 2.5 + p * 5, 0, 7); ctx.fill();
        }
      }
      if (meta.float) {
        // spławik kołysze się na wodzie, żyłka od wędki
        const fx = x + meta.float[0], fy = y + meta.float[1] + Math.sin(ts * 2.4) * 1.2;
        ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 0.5;
        ctx.beginPath(); ctx.moveTo(x + meta.rodTip[0], y + meta.rodTip[1]); ctx.quadraticCurveTo(fx - 4, fy - 14, fx, fy - 2); ctx.stroke();
        ctx.fillStyle = '#e0533d'; ctx.beginPath(); ctx.arc(fx, fy - 2, 2, Math.PI, 0); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(fx, fy - 2, 2, 0, Math.PI); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 0.6;
        ctx.beginPath(); ctx.ellipse(fx, fy, 4 + (ts * 3 % 3), 1.6 + (ts * 3 % 3) * 0.4, 0, 0, Math.PI * 2); ctx.stroke();
        const jump = (ts * 0.25) % 1;
        if (jump < 0.12) {
          const p = jump / 0.12;
          const jx = x - 20 + p * 16, jy = y + 18 - Math.sin(p * Math.PI) * 12;
          ctx.fillStyle = '#c99a3a'; ctx.beginPath(); ctx.ellipse(jx, jy, 3.2, 1.6, -0.6 + p * 1.2, 0, 7); ctx.fill();
        }
      }
      if (meta.butterflies) {
        const cols = ['#ff7aa8', '#ffd23f', '#7ac8ff', '#c46cff'];
        for (let i = 0; i < 4; i++) {
          const a = ts * (0.9 + i * 0.2) + i * 1.7;
          const bx = x + meta.butterflies[0] + Math.cos(a) * (14 + i * 3), by = y + meta.butterflies[1] + Math.sin(a * 1.4) * 7 - 4;
          const f = Math.abs(Math.sin(ts * 14 + i)) * 2.2 + 0.6;
          ctx.fillStyle = cols[i];
          ctx.beginPath(); ctx.ellipse(bx - f / 2, by, f, 1.8, 0.4, 0, 7); ctx.ellipse(bx + f / 2, by, f, 1.8, -0.4, 0, 7); ctx.fill();
        }
      }
      if (meta.kangaroos) {
        for (let i = 0; i < 2; i++) {
          const ph = ts * 0.35 + i * 0.5;
          const u = 0.9 + Math.abs(((ph % 2) + 2) % 2 - 1) * 1.3;
          const v = 1.2 + i * 0.8;
          const hop = Math.abs(Math.sin(ts * 3.2 + i)) * 5;
          const [kx, ky] = P(o.x + u, o.y + v);
          const flip = Math.floor(((ph % 2) + 2) % 2) === 1;
          drawSprite(animalSprite('kangaroo', flip), kx, ky - hop);
        }
      }
      if (meta.front) drawSprite(ringFrontSprite(o.k, BUILDINGS[o.k].w, BUILDINGS[o.k].h), x, y);
      if (BUILDINGS[o.k].kind === 'hive') {
        for (let i = 0; i < 3; i++) {
          const a = ts * (2 + i * 0.4) + i * 2;
          const bx = x + Math.cos(a) * (9 + i * 2), by = y + HH - 18 + Math.sin(a * 1.3) * 5;
          ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.arc(bx, by, 1.4, 0, 7); ctx.fill();
          ctx.fillStyle = '#222'; ctx.fillRect(bx - 0.3, by - 1.4, 0.6, 2.8);
        }
      }
    }
    if (o.t === 'd') {
      const meta = it.s.meta;
      if (o.k === 'sprinkler' && meta.spout) {
        const [sx, sy] = [x + meta.spout[0], y + meta.spout[1]];
        for (let i = 0; i < 10; i++) {
          const a = ts * 2 + i * Math.PI / 5;
          const p = (ts * 1.4 + i * 0.1) % 1;
          const dx = Math.cos(a) * 18 * p, dy = Math.sin(a) * 9 * p - Math.sin(p * Math.PI) * 8;
          ctx.fillStyle = `rgba(150,215,255,${0.8 * (1 - p)})`;
          ctx.beginPath(); ctx.arc(sx + dx, sy + dy, 1.3, 0, 7); ctx.fill();
        }
      }
      if (o.k === 'lighthouse' && meta.glow) {
        const a = 0.35 + Math.sin(ts * 2) * 0.25;
        const g = ctx.createRadialGradient(x + meta.glow[0], y + meta.glow[1], 1, x + meta.glow[0], y + meta.glow[1], 18);
        g.addColorStop(0, `rgba(255,240,160,${a})`); g.addColorStop(1, 'rgba(255,240,160,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x + meta.glow[0], y + meta.glow[1], 18, 0, 7); ctx.fill();
      }
      if (o.k === 'fountain' && meta.spout) {
        const [sx, sy] = [x + meta.spout[0], y + meta.spout[1]];
        for (let i = 0; i < 14; i++) {
          const p = (ts * 0.9 + i / 14) % 1;
          const a = i * 0.45;
          const dx = Math.cos(a) * 14 * p, dy = -Math.sin(p * Math.PI) * 14 + p * 10 + Math.sin(a) * 5 * p;
          ctx.fillStyle = `rgba(170,225,255,${0.85 * (1 - p * 0.6)})`;
          ctx.beginPath(); ctx.arc(sx + dx, sy + dy, 1.4, 0, 7); ctx.fill();
        }
      }
    }
  }

  function drawBlades(c, hx, hy, ang) {
    for (let i = 0; i < 4; i++) {
      const a = ang + i * Math.PI / 2;
      c.save();
      c.translate(hx, hy); c.scale(0.75, 1); c.rotate(a);
      c.fillStyle = '#f5ecd8'; c.strokeStyle = '#3d2615'; c.lineWidth = 1;
      c.beginPath(); c.rect(3, -3.5, 26, 7); c.fill(); c.stroke();
      c.strokeStyle = '#a07a50'; c.lineWidth = 0.6;
      for (let k = 8; k < 29; k += 5) { c.beginPath(); c.moveTo(k, -3.5); c.lineTo(k, 3.5); c.stroke(); }
      c.strokeStyle = '#6b4423'; c.lineWidth = 1.6;
      c.beginPath(); c.moveTo(0, 0); c.lineTo(29, 0); c.stroke();
      c.restore();
    }
    c.fillStyle = '#6b3e1e';
    c.beginPath(); c.arc(hx, hy, 2.6, 0, 7); c.fill();
  }

  function footprintPts(x, y, w, h) {
    return [P(x, y), P(x + w, y), P(x + w, y + h), P(x, y + h)];
  }
  function fillPts(pts, fill, stroke) {
    ctx.beginPath(); ctx.moveTo(...pts[0]); pts.slice(1).forEach(p => ctx.lineTo(...p)); ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1.6; ctx.stroke(); }
  }
  function drawGhostFootprint() {
    const g = G.ghost;
    if (g.type === 'd' && g.k === 'sprinkler') fillPts(footprintPts(g.x - 1, g.y - 1, 3, 3), 'rgba(120,200,255,.22)', 'rgba(120,200,255,.6)');
    fillPts(footprintPts(g.x, g.y, g.w, g.h), g.valid ? 'rgba(120,255,120,.35)' : 'rgba(255,80,80,.4)', g.valid ? '#e9ffe0' : '#ffd0d0');
  }
  function drawGhost(ts) {
    const g = G.ghost;
    const s = ghostSprite(g);
    const [x, y] = P(g.x, g.y);
    const lift = Math.sin(ts * 4) * 1.5 - 3;
    if (g.type === 'a') drawSprite(s, ...P(g.x + 0.5, g.y + 0.5).map((v, i) => i ? v + lift : v), 0.85);
    else drawSprite(s, x, y + lift, 0.8);
  }
  function ghostSprite(g) {
    if (g.type === 'b') return buildingSprite(g.k, g.w, g.h);
    if (g.type === 'd') return decorSprite(g.k, g.w, g.h);
    if (g.type === 'tree') return treeSprite(g.k, 'young');
    if (g.type === 'a') return animalSprite(g.k, false);
    return decorSprite('bush');
  }

  // ---------- napisy „+5 🌾” ----------
  function addFloat(wx, wy, text, color = '#fff') {
    floats.push({ wx, wy, text, color, t0: performance.now() });
  }
  function drawFloats(t) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (let i = floats.length - 1; i >= 0; i--) {
      const f = floats[i];
      const p = (t - f.t0) / 1400;
      if (p >= 1) { floats.splice(i, 1); continue; }
      const [sx, sy] = toScreen(f.wx, f.wy);
      const y = sy - p * 42;
      ctx.globalAlpha = p < 0.7 ? 1 : 1 - (p - 0.7) / 0.3;
      ctx.font = '700 16px Fredoka, "Noto Color Emoji", sans-serif';
      ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(50,30,10,.85)';
      ctx.strokeText(f.text, sx, y);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, sx, y);
    }
    ctx.globalAlpha = 1;
  }

  // ---------- trafianie ----------
  function hitTest(sx, sy) {
    const [wx, wy] = toWorld(sx, sy);
    for (let i = renderList.length - 1; i >= 0; i--) {
      const it = renderList[i];
      if (it.bubble && Math.abs(wx - it.bubble[0]) < 15 && wy > it.bubble[1] - 28 && wy < it.bubble[1] + 4) return { type: 'bubble', it };
    }
    for (let i = renderList.length - 1; i >= 0; i--) {
      const it = renderList[i];
      if (it.sx === undefined || it.kind === 'wild') continue;
      const lx = wx - it.sx, ly = wy - it.sy;
      if (lx < it.s.ox || ly < it.s.oy || lx > it.s.ox + it.s.w || ly > it.s.oy + it.s.h) continue;
      if (!spriteHit(it.s, lx, ly)) continue;
      if (it.kind === 'crop') return { type: 'field', key: it.field };
      if (it.kind === 'sale') return { type: 'sale' };
      return { type: 'obj', o: it.o };
    }
    const [gx, gy] = worldToGrid(wx, wy).map(Math.floor);
    return { type: 'tile', gx, gy };
  }
  function tileAt(sx, sy) {
    const [wx, wy] = toWorld(sx, sy);
    return worldToGrid(wx, wy).map(Math.floor);
  }

  // ---------- dotyk ----------
  const pointers = new Map();
  let gesture = null;

  canvas.addEventListener('pointerdown', e => {
    canvas.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    G.onUserGesture();
    if (pointers.size === 2) {
      if (gesture && gesture.type === 'paint') G.paintEnd();
      const [a, b] = [...pointers.values()];
      gesture = { type: 'pinch', d: Math.hypot(a.x - b.x, a.y - b.y), cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2, z: cam.z, camx: cam.x, camy: cam.y };
      return;
    }
    if (pointers.size > 2) return;
    const [sx, sy] = local(e);
    const base = { sx, sy, moved: false, camx: cam.x, camy: cam.y };
    if (G.ghost) {
      const [gx, gy] = tileAt(sx, sy);
      const g = G.ghost;
      if (gx >= g.x - 1 && gx <= g.x + g.w && gy >= g.y - 1 && gy <= g.y + g.h) {
        gesture = { ...base, type: 'ghost', offx: gx - g.x, offy: gy - g.y };
        return;
      }
    }
    const [gx, gy] = tileAt(sx, sy);
    const hit = hitTest(sx, sy);
    const action = G.paintStart(gx, gy, hit);
    if (action) { gesture = { ...base, type: 'paint', last: `${gx},${gy}` }; return; }
    gesture = { ...base, type: 'pan' };
  });

  canvas.addEventListener('pointermove', e => {
    if (!pointers.has(e.pointerId)) {
      if (e.pointerType === 'mouse') G.hover?.(...tileAt(...local(e)));
      return;
    }
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (!gesture) return;
    if (gesture.type === 'pinch' && pointers.size >= 2) {
      const [a, b] = [...pointers.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      const cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2;
      const rect = canvas.getBoundingClientRect();
      const lcx = gesture.cx - rect.left, lcy = gesture.cy - rect.top;
      cam.z = Math.max(MIN_Z, Math.min(MAX_Z, gesture.z * d / gesture.d));
      // punkt pod palcami zostaje w miejscu
      const wx = (lcx - W / 2) / gesture.z + gesture.camx;
      const wy = (lcy - H / 2) / gesture.z + gesture.camy;
      cam.x = wx - (cx - rect.left - W / 2) / cam.z;
      cam.y = wy - (cy - rect.top - H / 2) / cam.z;
      clampCam();
      return;
    }
    const [sx, sy] = local(e);
    const dist = Math.hypot(sx - gesture.sx, sy - gesture.sy);
    if (dist > DRAG_PX) gesture.moved = true;
    if (gesture.type === 'pan' && gesture.moved) {
      cam.x = gesture.camx - (sx - gesture.sx) / cam.z;
      cam.y = gesture.camy - (sy - gesture.sy) / cam.z;
      clampCam();
    } else if (gesture.type === 'paint') {
      const [gx, gy] = tileAt(sx, sy);
      const key = `${gx},${gy}`;
      if (key !== gesture.last) { gesture.last = key; G.paint(gx, gy); }
    } else if (gesture.type === 'ghost') {
      const [gx, gy] = tileAt(sx, sy);
      G.moveGhost(gx - gesture.offx, gy - gesture.offy);
    }
  });

  function endPointer(e) {
    if (!pointers.has(e.pointerId)) return;
    pointers.delete(e.pointerId);
    if (!gesture) return;
    if (gesture.type === 'pinch') {
      if (pointers.size === 0) gesture = null;
      else gesture = { type: 'idle' };
      return;
    }
    if (gesture.type === 'paint') G.paintEnd();
    else if (gesture.type === 'pan' && !gesture.moved && e.type === 'pointerup') {
      const hit = hitTest(gesture.sx, gesture.sy);
      G.tap(hit, toWorld(gesture.sx, gesture.sy));
    }
    gesture = null;
  }
  canvas.addEventListener('pointerup', endPointer);
  canvas.addEventListener('pointercancel', endPointer);
  canvas.addEventListener('wheel', e => {
    e.preventDefault();
    const [sx, sy] = local(e);
    const [wx, wy] = toWorld(sx, sy);
    cam.z = Math.max(MIN_Z, Math.min(MAX_Z, cam.z * Math.exp(-e.deltaY * 0.0015)));
    cam.x = wx - (sx - W / 2) / cam.z;
    cam.y = wy - (sy - H / 2) / cam.z;
    clampCam();
  }, { passive: false });

  function local(e) {
    const r = canvas.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  }

  // Podgląd obiektu (do sklepu): sprite narysowany na małym obrazku.
  function preview(type, k, size = 84) {
    let s;
    if (type === 'b') s = buildingSprite(k, BUILDINGS[k].w, BUILDINGS[k].h);
    else if (type === 'd') s = decorSprite(k, DECOR[k].w || 1, DECOR[k].h || 1);
    else if (type === 'tree') s = treeSprite(k, 'ready');
    else if (type === 'a') s = animalSprite(k, false);
    else if (type === 'crop') s = cropSprite(k, 3);
    let src = s.c;
    if (s.meta.hub) {
      // wiatrak: dorysuj łopaty na kopii
      src = document.createElement('canvas');
      src.width = s.c.width; src.height = s.c.height;
      const k = s.c.width / s.w;
      const sc = src.getContext('2d');
      sc.drawImage(s.c, 0, 0);
      sc.setTransform(k, 0, 0, k, -s.ox * k, -s.oy * k);
      drawBlades(sc, s.meta.hub[0], s.meta.hub[1], 0.6);
    }
    const c = document.createElement('canvas');
    c.width = c.height = size * 2;
    const g = c.getContext('2d');
    // przytnij do faktycznie zamalowanego obszaru
    const data = src.getContext('2d').getImageData(0, 0, src.width, src.height).data;
    let x0 = src.width, y0 = src.height, x1 = 0, y1 = 0;
    for (let y = 0; y < src.height; y += 2) for (let x = 0; x < src.width; x += 2) {
      if (data[(y * src.width + x) * 4 + 3] > 20) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    }
    if (x1 <= x0) return c.toDataURL();
    const bw = x1 - x0 + 2, bh = y1 - y0 + 2;
    const sc = Math.min(c.width / bw, c.height / bh) * 0.92;
    g.drawImage(src, x0, y0, bw, bh, (c.width - bw * sc) / 2, (c.height - bh * sc) / 2, bw * sc, bh * sc);
    return c.toDataURL();
  }

  window.addEventListener('resize', resize);
  resize();

  return {
    start() { buildGround(); requestAnimationFrame(frame); },
    rebuildGround: buildGround,
    applyQuality() { applyQuality(); buildGround(); },
    centerOnTile,
    cam,
    toScreen, toWorld,
    gridToScreen(gx, gy, z = 0) { const [x, y] = P(gx, gy, z); return toScreen(x, y); },
    addFloat(gx, gy, text, color, z = 30) { const [x, y] = P(gx, gy, z); addFloat(x, y, text, color); },
    preview,
    hitTest,
    animalPos(o) { const a = anim.get(o.id); return a ? [a.px, a.py] : [o.x + 0.5, o.y + 0.5]; },
    zoomBy(f) { cam.z = Math.max(MIN_Z, Math.min(MAX_Z, cam.z * f)); clampCam(); }
  };
}
