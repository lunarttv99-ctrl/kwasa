// Wiejska Zagroda — logika gry, zapis i interfejs.

import {
  MAP, PLOW_COST, START, LAND, STORAGE, WELL, SPRINKLER_BOOST, xpForLevel, MAX_LEVEL,
  ITEMS, CROPS, ANIMALS, TREES, BUILDINGS, DECOR, OBSTACLES, NEIGHBORS, CUSTOMERS, DAILY, QUESTS,
  UPGRADE_SPEED
} from './data.js';
import * as More from './more.js';
import { createWorld } from './world.js';
import { customIcon, rng } from './sprites.js';
import { sfx, unlockAudio, setSound } from './sound.js';

const SAVE_KEY = 'wiejska-zagroda-v1';
const ORDER_SLOTS = 6;
const $ = s => document.querySelector(s);
const now = () => Date.now();

// ---------- pomocnicze ----------
const fmt = n => Math.floor(n).toLocaleString('pl-PL');
function fmtTime(sec) {
  sec = Math.max(0, Math.ceil(sec));
  if (sec < 60) return `${sec} s`;
  if (sec < 3600) { const m = Math.floor(sec / 60), s = sec % 60; return s ? `${m}:${String(s).padStart(2, '0')}` : `${m} min`; }
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60);
  return m ? `${h} h ${m} min` : `${h} h`;
}
function icon(id) {
  const ic = ITEMS[id]?.icon ?? id;
  if (ic.startsWith('@')) return `<img class="ico-img" src="${customIcon(ic)}" alt="">`;
  return `<span class="emo">${ic}</span>`;
}
const iconRaw = id => ITEMS[id]?.icon ?? id;
const dayStr = (t = now()) => { const d = new Date(t); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];

// ---------- stan ----------
const G = {
  state: null,
  tool: 'hand',
  seed: 'wheat',
  ghost: null,
  occ: null,
  world: null,
  painted: 0
};
window.__zagroda = G;

function newGame() {
  const t = now();
  const S = {
    v: 1, coins: START.coins, ducats: START.ducats, xp: 0, level: 1,
    land: 0, storageLvl: 0, nextId: 1,
    fields: {}, objects: [], inv: { wheat: 6 },
    orders: [], quests: { done: [], prog: {} },
    nb: {}, daily: { last: '', streak: 0 },
    stats: { orders: 0 },
    settings: { sound: true, quality: 'high' },
    created: t, lastSeen: t
  };
  G.state = S;
  const add = (t, k, x, y, extra = {}) => S.objects.push({ id: S.nextId++, t, k, x, y, ...extra });
  // Startowe gospodarstwo w środku mapy (ziemia 8..21).
  add('b', 'house', 9, 9);
  add('b', 'barn', 13, 9);
  add('b', 'board', 17, 9);
  for (const [x, y] of [[9, 13], [10, 13]]) add('d', 'flowers', x, y);
  for (let x = 12; x <= 15; x++) add('d', 'path', x, 12);
  for (let y = 13; y <= 15; y++) add('d', 'path', 12, y);
  // pola: 3 z pszenicą prawie gotową, reszta zaorana
  for (let y = 14; y <= 15; y++) for (let x = 13; x <= 16; x++) S.fields[`${x},${y}`] = { c: null };
  for (const x of [13, 14, 15]) S.fields[`${x},14`] = { c: 'wheat', p: t - 40000, d: 45000 };
  rebuildOcc();
  // przeszkody
  const r = rng(4242);
  const kinds = ['weeds', 'weeds', 'stone', 'stump'];
  let n = 0;
  for (let i = 0; i < 400 && n < 11; i++) {
    const x = 8 + Math.floor(r() * 14), y = 8 + Math.floor(r() * 14);
    if (isFree(x, y, 1, 1) && !(x >= 12 && x <= 17 && y >= 12 && y <= 16)) { add('o', kinds[Math.floor(r() * kinds.length)], x, y); rebuildOcc(); n++; }
  }
  for (let i = 0; i < ORDER_SLOTS; i++) S.orders.push(i < 3 ? genOrder() : { ready: t + (i - 2) * 20000 });
  More.initState(S);
  return S;
}

function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const S = JSON.parse(raw);
    if (!S || S.v !== 1) return null;
    S.settings = { sound: true, quality: 'high', ...S.settings };
    More.initState(S);
    return S;
  } catch { return null; }
}
let saveTimer = 0;
function save() {
  G.state.lastSeen = now();
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(G.state)); } catch { /* brak miejsca lub tryb prywatny */ }
}
function saveSoon() { clearTimeout(saveTimer); saveTimer = setTimeout(save, 600); }

// ---------- ziemia i zajętość ----------
G.landRect = () => {
  const size = LAND[G.state.land].size;
  const o = (MAP - size) / 2;
  return { x0: o, y0: o, x1: o + size, y1: o + size };
};
G.saleTile = () => {
  if (G.state.land >= LAND.length - 1) return null;
  const r = G.landRect();
  return [r.x1, r.y1 - 2];
};
const isOwned = (x, y) => { const r = G.landRect(); return x >= r.x0 && y >= r.y0 && x < r.x1 && y < r.y1; };

function objSize(o) {
  if (o.t === 'b') return [BUILDINGS[o.k].w, BUILDINGS[o.k].h];
  if (o.t === 'd') return [DECOR[o.k].w || 1, DECOR[o.k].h || 1];
  return [1, 1];
}
function rebuildOcc() {
  const occ = new Array(MAP * MAP).fill(null);
  for (const key in G.state.fields) {
    const [x, y] = key.split(',').map(Number);
    occ[y * MAP + x] = 'f';
  }
  for (const o of G.state.objects) {
    const [w, h] = objSize(o);
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const x = o.x + i, y = o.y + j;
      if (x >= 0 && y >= 0 && x < MAP && y < MAP) occ[y * MAP + x] = o;
    }
  }
  G.occ = occ;
}
function isFree(x, y, w, h, ignore = null) {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const gx = x + i, gy = y + j;
    if (!isOwned(gx, gy)) return false;
    const v = G.occ[gy * MAP + gx];
    if (v && v !== ignore) return false;
  }
  return true;
}
G.walkable = (x, y, animal) => {
  if (!isOwned(x, y)) return false;
  const v = G.occ[y * MAP + x];
  return !v || v === animal || (v.t === 'd' && DECOR[v.k].flat);
};

// ---------- waluty, doświadczenie ----------
// Koszt to mapa {waluta albo przedmiot: ilość}. Waluty trzymane są w stanie gry,
// przedmioty (deski, gwoździe, sadzonki…) w stodole.
const WALLET = {
  coins: ['🪙', 'talarów'], ducats: ['💎', 'dukatów'], shells: ['🐚', 'muszelek'], medals: ['🏅', 'medali'],
  auto: ['⚙️', 'punktów automatyzacji'], tickets: ['🎟️', 'biletów'], tokens: [null, 'żetonów wydarzenia']
};
function balance(k) {
  const S = G.state;
  if (k === 'tokens') return S.event.tokens;
  if (k in WALLET) return S[k] || 0;
  return S.inv[k] || 0;
}
function currencyIcon(k) { return k === 'tokens' ? More.tokenIcon() : WALLET[k]?.[0]; }
function canPay(cost) {
  for (const k in cost) {
    if (balance(k) >= cost[k]) continue;
    toast(k in WALLET ? `Za mało ${WALLET[k][1]} ${currencyIcon(k)}` : `Brakuje: ${ITEMS[k].name} (${balance(k)}/${cost[k]})`);
    sfx.error();
    return false;
  }
  return true;
}
function pay(cost) {
  const S = G.state;
  for (const k in cost) {
    if (k === 'tokens') S.event.tokens -= cost[k];
    else if (k in WALLET) S[k] -= cost[k];
    else { S.inv[k] -= cost[k]; if (!S.inv[k]) delete S.inv[k]; }
  }
  updateHUD();
}
function costText(cost) {
  return Object.entries(cost).map(([k, n]) => `${fmt(n)} ${k in WALLET ? currencyIcon(k) : iconRaw(k).startsWith('@') ? ITEMS[k].name : iconRaw(k)}`).join(' + ');
}
function costHTML(cost) {
  return Object.entries(cost).map(([k, n]) => `<span class="need ${balance(k) >= n ? 'have' : ''}">${k in WALLET ? `<span class="emo">${currencyIcon(k)}</span>` : icon(k)}${fmt(n)}</span>`).join('');
}
function addCoins(n, from) {
  G.state.coins += n;
  if (from) fly('🪙', from, '#coinsPill');
  updateHUD();
}
function addXP(n) {
  if (!n) return;
  const S = G.state;
  S.xp += n;
  while (S.level < MAX_LEVEL && S.xp >= xpForLevel(S.level)) {
    S.xp -= xpForLevel(S.level);
    S.level++;
    levelUpQueue.push(S.level);
  }
  updateHUD();
  if (levelUpQueue.length && !$('#modal').classList.contains('open')) showLevelUp();
}
const levelUpQueue = [];

function invTotal() { return Object.values(G.state.inv).reduce((a, b) => a + b, 0); }
const capacity = () => STORAGE[G.state.storageLvl].cap;
function hasRoom(n) {
  if (invTotal() + n <= capacity()) return true;
  toast('Stodoła jest pełna! Sprzedaj coś albo ją rozbuduj 📦');
  sfx.error();
  return false;
}
function addItem(id, n, from) {
  G.state.inv[id] = (G.state.inv[id] || 0) + n;
  if (from) fly(iconRaw(id), from, '#barnBtn');
}
function takeItems(req) {
  for (const k in req) if ((G.state.inv[k] || 0) < req[k]) return false;
  for (const k in req) { G.state.inv[k] -= req[k]; if (!G.state.inv[k]) delete G.state.inv[k]; }
  return true;
}
const has = req => Object.keys(req).every(k => (G.state.inv[k] || 0) >= req[k]);

// ---------- uprawy ----------
G.cropStage = (f, t) => {
  if (!f.c) return -1;
  const p = (t - f.p) / f.d;
  return p < 0.12 ? 0 : p < 0.5 ? 1 : p < 1 ? 2 : 3;
};
function sprinkled(x, y) {
  for (const o of G.state.objects) if (o.t === 'd' && o.k === 'sprinkler' && Math.abs(o.x - x) <= 1 && Math.abs(o.y - y) <= 1) return true;
  return false;
}
function plow(x, y, quiet) {
  if (!isOwned(x, y) || !isFree(x, y, 1, 1)) return false;
  if (G.state.coins < PLOW_COST) { if (!quiet) { toast('Za mało talarów na oranie'); sfx.error(); } return false; }
  G.state.coins -= PLOW_COST;
  G.state.fields[`${x},${y}`] = { c: null };
  rebuildOcc();
  addXP(1);
  emit('plow');
  sfx.plow();
  G.world.addFloat(x + 0.5, y + 0.5, `-${PLOW_COST} 🪙`, '#ffe08a', 8);
  updateHUD();
  return true;
}
function plant(x, y, cropId, quiet) {
  const f = G.state.fields[`${x},${y}`];
  if (!f || f.c) return false;
  const c = CROPS[cropId];
  if (c.lvl > G.state.level) { if (!quiet) toast(`${ITEMS[cropId].name}: od poziomu ${c.lvl}`); return false; }
  if (c.exotic) {
    if (!G.state.inv[c.exotic]) { if (!quiet) { toast(`Potrzebne: ${ITEMS[c.exotic].name} (Egzotyczny sklep, port)`); sfx.error(); } return false; }
    takeItems({ [c.exotic]: 1 });
  } else {
    if (G.state.coins < c.seed) { if (!quiet) { toast('Za mało talarów na nasiona'); sfx.error(); } return false; }
    G.state.coins -= c.seed;
  }
  f.c = cropId;
  f.p = now();
  f.d = c.time * 1000 * (sprinkled(x, y) ? 1 - SPRINKLER_BOOST : 1);
  emit('plant', cropId);
  sfx.plant();
  updateHUD();
  return true;
}
function harvest(key, quiet) {
  const f = G.state.fields[key];
  if (!f || !f.c || G.cropStage(f, now()) < 3) return false;
  const c = CROPS[f.c];
  if (!hasRoom(c.yield)) return 'full';
  const [x, y] = key.split(',').map(Number);
  addItem(f.c, c.yield, G.world.gridToScreen(x + 0.5, y + 0.5, 10));
  addXP(c.xp);
  emit('harvest', f.c, c.yield);
  G.world.addFloat(x + 0.5, y + 0.5, `+${c.yield} ${iconRaw(f.c).startsWith('@') ? '' : iconRaw(f.c)}`, '#fff', 20);
  f.c = null;
  if (!quiet) sfx.pop(); else if (G.painted % 2 === 0) sfx.pop();
  updateHUD();
  return true;
}

// ---------- drzewa ----------
G.treeState = (o, t) => (t >= o.at ? 'ready' : o.first ? 'young' : 'grow');
function harvestTree(o) {
  const d = TREES[o.k];
  if (!hasRoom(d.n)) return;
  addItem(d.fruit, d.n, G.world.gridToScreen(o.x + 0.5, o.y + 0.5, 40));
  addXP(d.xp);
  emit('harvest', d.fruit, d.n);
  emit('collect', d.fruit, d.n);
  G.world.addFloat(o.x + 0.5, o.y + 0.5, `+${d.n} ${iconRaw(d.fruit)}`, '#fff', 50);
  o.at = now() + d.time * 1000;
  o.first = false;
  sfx.pop();
  saveSoon();
}

// ---------- zwierzęta ----------
const animalDur = o => o.dur || ANIMALS[o.k].time * 1000;
function animalReady(o, t) { return o.fed && t >= o.fed + animalDur(o); }
function tapAnimal(o) {
  const d = ANIMALS[o.k];
  const t = now();
  const [px, py] = G.world.animalPos(o);
  if (o.baby && o.baby > t) {
    tip(px, py, 22, `<b>${d.name}</b> (maluch) dorośnie za <span data-end="${o.baby}"></span>`);
    return;
  }
  if (!o.fed) {
    const req = { [d.food]: d.foodN };
    if (!has(req)) {
      tip(px, py, 26, `<b>${d.name}</b> jest głodna. Potrzebuje: ${d.foodN}× ${icon(d.food)} ${ITEMS[d.food].name}`);
      sfx.error();
      return;
    }
    takeItems(req);
    o.fed = t;
    o.dur = d.time * 1000 * More.ranchFactor(o);
    emit('feed', o.k);
    G.world.addFloat(px, py, `-${d.foodN} ${iconRaw(d.food)}`, '#ffe9b0', 26);
    o.k === 'cow' ? sfx.moo() : o.k === 'chicken' ? sfx.cluck() : sfx.pop();
  } else if (animalReady(o, t)) {
    if (!hasRoom(1)) return;
    addItem(d.product, 1, G.world.gridToScreen(px, py, 20));
    addXP(d.xp);
    emit('collect', d.product);
    G.world.addFloat(px, py, `+1 ${iconRaw(d.product)}`, '#fff', 30);
    o.fed = 0;
    sfx.pop();
  } else {
    tip(px, py, 26, `<b>${d.name}</b> — ${ITEMS[d.product].name} za <span data-end="${o.fed + animalDur(o)}"></span>`);
  }
  updateHUD();
  saveSoon();
}

// ---------- budynki ----------
const isBuilt = (o, t = now()) => !o.done || o.done <= t;
G.isWorking = (o, t) => {
  const d = BUILDINGS[o.k];
  if (d.kind === 'prod') return (o.q || []).some(j => j.s <= t && j.e > t);
  return false;
};
function readyJobs(o, t = now()) { return (o.q || []).filter(j => j.e <= t); }
function collectJobs(o) {
  const d = BUILDINGS[o.k];
  const t = now();
  const ready = readyJobs(o, t);
  let got = 0;
  for (const j of ready) {
    const r = d.recipes[j.r];
    if (!hasRoom(1)) break;
    addItem(r.out, 1, G.world.gridToScreen(o.x + d.w / 2, o.y + d.h / 2, 40));
    addXP(r.xp);
    emit('produce', r.out);
    G.world.addFloat(o.x + d.w / 2, o.y + d.h / 2, `+1 ${iconRaw(r.out).startsWith('@') ? ITEMS[r.out].name : iconRaw(r.out)}`, '#fff', 50 + got * 12);
    o.q.splice(o.q.indexOf(j), 1);
    got++;
  }
  if (got) { sfx.pop(); updateHUD(); saveSoon(); }
  return got;
}
const slotsOf = o => (o.slots || 2) + ((o.lvl || 1) - 1);
const jobTime = (o, r) => r.time * 1000 * (1 - UPGRADE_SPEED * ((o.lvl || 1) - 1));
function enqueue(o, ri) {
  const d = BUILDINGS[o.k];
  const r = d.recipes[ri];
  o.q = o.q || [];
  const slots = slotsOf(o);
  if (o.q.length >= slots) { toast('Kolejka jest pełna'); sfx.error(); return; }
  if (!has(r.in)) { toast('Brakuje składników'); sfx.error(); return; }
  takeItems(r.in);
  const t = now();
  const last = o.q.reduce((m, j) => Math.max(m, j.e), t);
  o.q.push({ r: ri, s: last, e: last + jobTime(o, r) });
  sfx.click();
  saveSoon();
}
function hiveReady(o, t) { return isBuilt(o, t) && t >= (o.last || 0) + BUILDINGS.hive.time * 1000; }

G.bubbleFor = (it, t) => {
  if (it.kind === 'animal') {
    const o = it.o;
    if (o.baby && o.baby > t) return null;
    if (!o.fed) return { icon: iconRaw(ANIMALS[o.k].food), color: '#fff2c2' };
    if (animalReady(o, t)) return { icon: iconRaw(ANIMALS[o.k].product) };
    return null;
  }
  if (it.kind !== 'obj') return null;
  const o = it.o;
  if (o.t === 'tree') return t >= o.at ? { icon: iconRaw(TREES[o.k].fruit) } : null;
  if (o.t === 'b') {
    if (!isBuilt(o, t)) return null;
    if (o.done && !o.built) return { icon: '✨', color: '#fff2c2' };
    const d = BUILDINGS[o.k];
    if (d.kind === 'prod') {
      const r = readyJobs(o, t);
      return r.length ? { icon: iconRaw(d.recipes[r[0].r].out) } : null;
    }
    if (d.kind === 'hive') return hiveReady(o, t) ? { icon: '🍯' } : null;
    if (d.kind === 'orders') return G.state.orders.some(or => or.items && has(or.items)) ? { icon: '✅', color: '#e9ffd9' } : null;
    return More.bubble(o, t);
  }
  return null;
};

// Zakończenie budowy — potwierdza się dotknięciem budynku.
function finishBuild(o) {
  const d = BUILDINGS[o.k];
  o.built = true;
  addXP(d.xp || 0);
  emit('build', o.k);
  sfx.build();
  G.world.addFloat(o.x + d.w / 2, o.y + d.h / 2, `${d.name} gotowa! +${d.xp} XP`, '#ffe14a', 60);
  saveSoon();
}

// ---------- zamówienia ----------
function orderPool() {
  const S = G.state;
  const pool = [];
  for (const id in CROPS) if (CROPS[id].lvl <= S.level) pool.push({ id, tier: 0 });
  const kinds = new Set(S.objects.map(o => o.k));
  for (const k in ANIMALS) if (kinds.has(k)) pool.push({ id: ANIMALS[k].product, tier: 1 });
  for (const k in TREES) if (kinds.has(k)) pool.push({ id: TREES[k].fruit, tier: 0 });
  for (const o of S.objects) {
    if (o.t !== 'b') continue;
    const d = BUILDINGS[o.k];
    if (d.kind === 'hive') pool.push({ id: 'honey', tier: 1 });
    if (d.recipes) for (const r of d.recipes) if ((r.lvl || 0) <= S.level) pool.push({ id: r.out, tier: 2 });
  }
  return pool;
}
function genOrder() {
  const pool = orderPool();
  const S = G.state;
  const count = Math.min(pool.length, 1 + (S.level >= 3 ? Math.floor(Math.random() * 2) : 0) + (S.level >= 8 && Math.random() < 0.35 ? 1 : 0));
  const items = {};
  let value = 0;
  const used = new Set();
  for (let i = 0; i < count; i++) {
    let p;
    for (let k = 0; k < 8; k++) { p = pick(pool); if (!used.has(p.id)) break; }
    if (used.has(p.id)) continue;
    used.add(p.id);
    const base = p.tier === 0 ? 3 + Math.floor(Math.random() * (3 + S.level / 2)) : p.tier === 1 ? 1 + Math.floor(Math.random() * 3) : 1 + Math.floor(Math.random() * 2);
    items[p.id] = base;
    value += ITEMS[p.id].price * base;
  }
  const c = pick(CUSTOMERS);
  return {
    id: Math.random().toString(36).slice(2, 8),
    cust: c.name, av: c.avatar, items,
    coins: Math.round(value * (1.25 + Math.random() * 0.35)),
    xp: Math.max(2, Math.round(value / 9)),
    ducats: Math.random() < 0.06 ? 1 : 0,
    ready: 0
  };
}
function refreshOrders() {
  const t = now();
  let changed = false;
  G.state.orders.forEach((o, i) => {
    if (!o.items && o.ready <= t) { G.state.orders[i] = genOrder(); changed = true; }
  });
  return changed;
}
function deliver(i) {
  const o = G.state.orders[i];
  if (!o.items || !takeItems(o.items)) { toast('Brakuje towaru do tego zamówienia'); sfx.error(); return; }
  addCoins(o.coins, centerOf('#sheet .sheet-card'));
  addXP(o.xp);
  if (o.ducats) G.state.ducats += o.ducats;
  G.state.stats.orders++;
  emit('order');
  sfx.coin();
  toast(`${o.av} ${o.cust}: dziękuję! +${fmt(o.coins)} 🪙  +${o.xp} XP${o.ducats ? '  +1 💎' : ''}`);
  G.state.orders[i] = { ready: now() + 30000 };
  updateHUD();
  saveSoon();
  openOrders();
}

// ---------- zadania ----------
function activeQuests() {
  const done = new Set(G.state.quests.done);
  const out = [];
  for (let i = 0; i < QUESTS.length && out.length < 3; i++) if (!done.has(i)) out.push(i);
  return out;
}
function questProgress(i) {
  const q = QUESTS[i];
  const S = G.state;
  let p = S.quests.prog[i] || 0;
  if (q.t === 'level') p = S.level;
  if (q.t === 'build') p = S.objects.filter(o => o.t === 'b' && o.k === q.k && o.built).length;
  if (q.t === 'buy') p = Math.max(p, S.objects.filter(o => o.k === q.k).length);
  if (q.t === 'expand') p = S.land;
  return Math.min(q.n, p);
}
function emit(type, k, n = 1) {
  for (const i of activeQuests()) {
    const q = QUESTS[i];
    if (q.t === type && (!q.k || q.k === k)) G.state.quests.prog[i] = (G.state.quests.prog[i] || 0) + n;
  }
  More.onEmit(type, k, n);
  renderQuests();
}
function claimQuest(i) {
  const q = QUESTS[i];
  if (questProgress(i) < q.n) return;
  G.state.quests.done.push(i);
  delete G.state.quests.prog[i];
  const r = q.reward;
  if (r.coins) addCoins(r.coins, centerOf('#modal .modal-card'));
  if (r.ducats) G.state.ducats += r.ducats;
  if (r.auto) G.state.auto += r.auto;
  sfx.coin();
  closeModal();
  addXP(r.xp || 0);
  updateHUD();
  renderQuests();
  saveSoon();
}

// ---------- interakcje z mapą ----------
G.onUserGesture = () => { unlockAudio(); hideTip(); };

const MACHINES = ['fert', 'combine', 'seeder'];
G.paintStart = (gx, gy, hit) => {
  if (G.ghost || MACHINES.includes(G.tool)) return null;
  const key = `${gx},${gy}`;
  const f = G.state.fields[key];
  const fieldHit = hit.type === 'field' ? G.state.fields[hit.key] : (hit.type === 'tile' ? f : null);
  const fkey = hit.type === 'field' ? hit.key : key;
  G.painted = 0;
  if ((G.tool === 'hand' || G.tool === 'plant') && fieldHit && fieldHit.c && G.cropStage(fieldHit, now()) === 3) {
    G.paintMode = 'harvest';
    if (harvest(fkey) === true) G.painted++;
    return 'harvest';
  }
  if (G.tool === 'plow' && hit.type === 'tile' && isOwned(gx, gy) && isFree(gx, gy, 1, 1)) {
    G.paintMode = 'plow';
    if (plow(gx, gy)) G.painted++;
    return 'plow';
  }
  if (G.tool === 'plant' && fieldHit && !fieldHit.c) {
    G.paintMode = 'plant';
    if (plant(...fkey.split(',').map(Number), G.seed)) G.painted++;
    return 'plant';
  }
  return null;
};
G.paint = (gx, gy) => {
  const key = `${gx},${gy}`;
  let ok = false;
  if (G.paintMode === 'harvest') {
    const r = harvest(key, true);
    if (r === 'full') { G.paintMode = 'stop'; return; }
    ok = r === true;
  } else if (G.paintMode === 'plow') ok = plow(gx, gy, true);
  else if (G.paintMode === 'plant') ok = plant(gx, gy, G.seed, true);
  if (ok) G.painted++;
};
G.paintEnd = () => { G.paintMode = null; saveSoon(); };

G.tap = (hit) => {
  if (G.ghost) return;
  if (hit.type === 'bubble') return interact(hit.it.o || null, hit.it);
  if (MACHINES.includes(G.tool)) return More.useMachine(hit);
  if (hit.type === 'sale') return openShop('land');
  if (G.tool === 'sell') return sellAt(hit);
  if (G.tool === 'move') return moveAt(hit);
  if (hit.type === 'field') return tapField(hit.key);
  if (hit.type === 'obj') return interact(hit.o);
  const { gx, gy } = hit;
  const key = `${gx},${gy}`;
  if (G.state.fields[key]) return tapField(key);
  const o = G.occ[gy * MAP + gx];
  if (o && o !== 'f') return interact(o);
  if (!isOwned(gx, gy)) {
    if (gx >= 0 && gy >= 0 && gx < MAP && gy < MAP) { toast('Ta ziemia nie należy jeszcze do Ciebie — kup rozszerzenie 🗺️'); }
    return;
  }
  if (G.tool === 'hand') toast('Wybierz pług 🚜, żeby zaorać pole');
};

function tapField(key) {
  const f = G.state.fields[key];
  const [x, y] = key.split(',').map(Number);
  if (!f.c) {
    if (G.tool === 'plant') { plant(x, y, G.seed); return; }
    openSeedPicker(x, y);
    return;
  }
  const stage = G.cropStage(f, now());
  if (stage === 3) { harvest(key); saveSoon(); return; }
  tip(x + 0.5, y + 0.5, 20, `<b>${ITEMS[f.c].name}</b> — gotowe za <span data-end="${f.p + f.d}"></span>`);
}

function interact(o, item) {
  if (!o) return;
  if (o.t === 'a') return tapAnimal(o);
  if (o.t === 'tree') {
    if (now() >= o.at) return harvestTree(o);
    return tip(o.x + 0.5, o.y + 0.5, 60, `<b>${TREES[o.k].name}</b> — owoce za <span data-end="${o.at}"></span>`);
  }
  if (o.t === 'o') return clearObstacle(o);
  if (o.t === 'd') {
    const d = DECOR[o.k];
    if (d.special === 'sprinkler') return tip(o.x + 0.5, o.y + 0.5, 20, '<b>Spryskiwacz</b> — rośliny obok rosną 15% szybciej');
    return tip(o.x + 0.5, o.y + 0.5, 20, `<b>${d.name}</b>`);
  }
  if (o.t === 'b') {
    const d = BUILDINGS[o.k];
    if (!isBuilt(o)) return openConstruction(o);
    if (o.done && !o.built) return finishBuild(o);
    if (d.kind === 'prod') { if (collectJobs(o)) return; return openBuilding(o); }
    if (d.kind === 'hive') {
      if (hiveReady(o, now())) {
        if (!hasRoom(1)) return;
        addItem('honey', 1, G.world.gridToScreen(o.x + 0.5, o.y + 0.5, 30));
        addXP(d.hiveXp);
        emit('collect', 'honey');
        G.world.addFloat(o.x + 0.5, o.y + 0.5, '+1 🍯', '#fff', 36);
        o.last = now();
        sfx.pop(); updateHUD(); saveSoon();
        return;
      }
      return tip(o.x + 0.5, o.y + 0.5, 36, `<b>Ul</b> — miód za <span data-end="${(o.last || 0) + d.time * 1000}"></span>`);
    }
    if (d.kind === 'storage') return openBarn();
    if (d.kind === 'orders') return openOrders();
    if (d.kind === 'well') return openWell(o);
    if (d.kind === 'house') return More.openHome();
    return More.interact(o);
  }
}

function clearObstacle(o) {
  const d = OBSTACLES[o.k];
  if (!canPay({ coins: d.clear })) return;
  pay({ coins: d.clear });
  removeObject(o);
  addXP(d.xp);
  emit('clear');
  sfx.build();
  G.world.addFloat(o.x + 0.5, o.y + 0.5, `-${d.clear} 🪙  +${d.xp} XP`, '#ffe08a', 20);
  if (Math.random() < 0.08) { G.state.ducats++; toast('Znalazłeś dukata! 💎'); }
  updateHUD();
  saveSoon();
}
function removeObject(o) {
  const i = G.state.objects.indexOf(o);
  if (i >= 0) G.state.objects.splice(i, 1);
  rebuildOcc();
}

// ---------- sprzedaż i przesuwanie obiektów ----------
function objName(o) {
  if (o.t === 'b') return BUILDINGS[o.k].name;
  if (o.t === 'a') return ANIMALS[o.k].name;
  if (o.t === 'tree') return TREES[o.k].name;
  if (o.t === 'd') return DECOR[o.k].name;
  return OBSTACLES[o.k]?.name || '';
}
function refundOf(o) {
  if (o.t === 'b') return Math.round((BUILDINGS[o.k].cost || 0) * 0.25);
  if (o.t === 'a') return Math.round(ANIMALS[o.k].cost * 0.4);
  if (o.t === 'tree') return Math.round(TREES[o.k].cost * 0.3);
  if (o.t === 'd') return Math.round((DECOR[o.k].cost || (DECOR[o.k].ducats || 4) * 40) * 0.25);
  return 0;
}
function sellAt(hit) {
  let o = hit.type === 'obj' ? hit.o : null;
  if (hit.type === 'field') {
    const key = hit.key;
    return confirmBox('Usunąć pole?', 'Pole wróci do trawy. Rosnąca roślina przepadnie.', 'Usuń', () => { delete G.state.fields[key]; rebuildOcc(); saveSoon(); });
  }
  if (hit.type === 'tile') {
    const key = `${hit.gx},${hit.gy}`;
    if (G.state.fields[key]) return sellAt({ type: 'field', key });
    const v = G.occ[hit.gy * MAP + hit.gx];
    if (v && v !== 'f') o = v;
  }
  if (!o) return;
  if (o.t === 'b' && BUILDINGS[o.k].fixed) { toast('Tego budynku nie można sprzedać — ale możesz go przesunąć'); return; }
  if (o.t === 'o') return clearObstacle(o);
  const refund = refundOf(o);
  confirmBox(`Sprzedać: ${objName(o)}?`, `Otrzymasz ${fmt(refund)} 🪙.`, 'Sprzedaj', () => {
    removeObject(o);
    addCoins(refund);
    sfx.coin();
    saveSoon();
  });
}
function moveAt(hit) {
  let o = hit.type === 'obj' ? hit.o : null;
  if (hit.type === 'tile') { const v = G.occ[hit.gy * MAP + hit.gx]; if (v && v !== 'f') o = v; }
  if (!o) { if (hit.type === 'field') toast('Pól nie można przesuwać — możesz je usunąć 💰 i zaorać gdzie indziej'); return; }
  if (o.t === 'o') { toast('Przeszkody trzeba usunąć'); return; }
  const [w, h] = objSize(o);
  G.ghost = { mode: 'move', obj: o, type: o.t, k: o.k, x: o.x, y: o.y, w, h, valid: true };
  showGhostBar(`Przesuwasz: ${objName(o)}`, !(o.t === 'b' && BUILDINGS[o.k].fixed));
}
function stashGhost() {
  const g = G.ghost;
  if (!g || g.mode !== 'move') return;
  const o = g.obj;
  removeObject(o);
  const copy = { ...o };
  delete copy.x; delete copy.y;
  G.state.stash.push(copy);
  G.ghost = null;
  hideGhostBar();
  toast(`${objName(o)} w schowku (Stodoła → Schowek)`);
  sfx.click();
  saveSoon();
}
function placeFromStash(i) {
  const o = G.state.stash[i];
  if (!o) return;
  closeSheet();
  const [w, h] = objSize(o);
  const [cx, cy] = screenCenterTile();
  G.ghost = { mode: 'stash', obj: o, idx: i, type: o.t, k: o.k, w, h, x: cx, y: cy, valid: false };
  const spot = findFree(cx, cy, w, h);
  if (spot) G.moveGhost(spot[0], spot[1]); else G.moveGhost(cx, cy);
  showGhostBar(`Ze schowka: ${objName(o)}`);
}

// ---------- stawianie (duch obiektu) ----------
function startPlace(type, k) {
  const S = G.state;
  let w = 1, h = 1, cost, name, lvl;
  if (type === 'b') { const d = BUILDINGS[k]; w = d.w; h = d.h; cost = { coins: d.cost }; name = d.name; lvl = d.lvl; }
  if (type === 'a') { cost = { coins: animalCost(k) }; name = ANIMALS[k].name; lvl = ANIMALS[k].lvl; }
  if (type === 'tree') { cost = treeFullCost(k); name = TREES[k].name; lvl = TREES[k].lvl; }
  if (type === 'd') { const d = DECOR[k]; w = d.w || 1; h = d.h || 1; cost = decorCost(k); name = d.name; lvl = d.lvl; }
  if (lvl > S.level) { toast(`Odblokujesz na poziomie ${lvl}`); return; }
  if (type === 'b' && BUILDINGS[k].max && S.objects.filter(o => o.k === k).length >= BUILDINGS[k].max) { toast('Masz już ten budynek'); return; }
  if (type === 'd' && k === 'sprinkler') {
    const well = S.objects.find(o => o.k === 'well' && o.built);
    if (!well) { toast('Najpierw wybuduj studnię ⛲ (Budynki)'); return; }
    const limit = WELL[well.lvl || 0].sprinklers;
    if (S.objects.filter(o => o.k === 'sprinkler').length >= limit) { toast(`Limit spryskiwaczy: ${limit}. Rozbuduj studnię`); return; }
  }
  if (!canPay(cost)) return;
  closeSheet();
  const [cx, cy] = G.ghost ? [G.ghost.x, G.ghost.y] : screenCenterTile();
  G.ghost = { mode: 'buy', type, k, w, h, x: cx, y: cy, cost, valid: false };
  const spot = findFree(cx, cy, w, h);
  if (spot) { G.ghost.x = spot[0]; G.ghost.y = spot[1]; }
  G.moveGhost(G.ghost.x, G.ghost.y);
  showGhostBar(`${name} · ${costText(cost)}`);
}
const decorCost = k => { const d = DECOR[k]; return d.price ? { ...d.price } : d.ducats ? { ducats: d.ducats } : { coins: d.cost }; };
function treeFullCost(k) {
  const c = { coins: treeCost(k) };
  if (TREES[k].sapling) c[TREES[k].sapling] = 1;
  return c;
}
function screenCenterTile() {
  const [wx, wy] = G.world.toWorld(window.innerWidth / 2, window.innerHeight * 0.45);
  return [Math.floor((wx / 32 + wy / 16) / 2), Math.floor((wy / 16 - wx / 32) / 2)];
}
function findFree(cx, cy, w, h) {
  for (let r = 0; r < 14; r++) {
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
      if (isFree(cx + dx, cy + dy, w, h)) return [cx + dx, cy + dy];
    }
  }
  return null;
}
G.moveGhost = (x, y) => {
  const g = G.ghost;
  if (!g) return;
  g.x = x; g.y = y;
  g.valid = isFree(x, y, g.w, g.h, g.mode === 'move' ? g.obj : null);
  $('#ghostOk').disabled = !g.valid;
};
function confirmGhost() {
  const g = G.ghost;
  if (!g || !g.valid) return;
  const S = G.state;
  if (g.mode === 'stash') {
    const o = g.obj;
    o.x = g.x; o.y = g.y;
    S.stash.splice(S.stash.indexOf(o), 1);
    S.objects.push(o);
    G.ghost = null;
    rebuildOcc();
    hideGhostBar();
    sfx.build();
    saveSoon();
    return;
  }
  if (g.mode === 'move') {
    g.obj.x = g.x; g.obj.y = g.y;
    G.ghost = null;
    rebuildOcc();
    hideGhostBar();
    sfx.click();
    saveSoon();
    return;
  }
  if (!canPay(g.cost)) return;
  pay(g.cost);
  const o = { id: S.nextId++, t: g.type, k: g.k, x: g.x, y: g.y };
  const t = now();
  if (g.type === 'b') {
    const d = BUILDINGS[g.k];
    o.start = t; o.done = t + (d.build || 0) * 1000;
    if (d.kind === 'prod') { o.q = []; o.slots = 2; }
    if (d.kind === 'hive') o.last = o.done;
    if (d.kind === 'well') o.lvl = 0;
  }
  if (g.type === 'a') o.fed = 0;
  if (g.type === 'tree') { o.at = t + TREES[g.k].time * 1500; o.first = true; }
  S.objects.push(o);
  rebuildOcc();
  emit('buy', g.k);
  if (g.type === 'd') emit('decor');
  sfx.build();
  G.world.addFloat(g.x + g.w / 2, g.y + g.h / 2, `-${costText(g.cost)}`, '#ffe08a', 30);
  saveSoon();
  // dekoracje i zwierzęta można stawiać seriami
  const again = (g.type === 'd' && g.w === 1) || g.type === 'a' || g.type === 'tree';
  if (again) {
    const cost = g.type === 'a' ? { coins: animalCost(g.k) } : g.type === 'tree' ? treeFullCost(g.k) : g.cost;
    const enough = Object.keys(cost).every(k => balance(k) >= cost[k]);
    const spr = g.k === 'sprinkler';
    if (enough && !spr) {
      g.cost = cost;
      const spot = findFree(g.x + 1, g.y, g.w, g.h);
      if (spot) { G.moveGhost(spot[0], spot[1]); showGhostBar(`${objName(o)} · ${costText(cost)} (kolejny?)`); return; }
    }
  }
  G.ghost = null;
  hideGhostBar();
}
function cancelGhost() { G.ghost = null; hideGhostBar(); }
const animalCost = k => Math.round(ANIMALS[k].cost * (1 + 0.2 * G.state.objects.filter(o => o.k === k).length) / 10) * 10;
const treeCost = k => Math.round(TREES[k].cost * (1 + 0.1 * G.state.objects.filter(o => o.k === k).length) / 10) * 10;

function showGhostBar(text, canStash = false) {
  $('#ghostLabel').textContent = text;
  $('#ghostStash').hidden = !canStash;
  $('#ghostBar').classList.add('open');
  document.body.classList.add('placing');
}
function hideGhostBar() {
  $('#ghostBar').classList.remove('open');
  document.body.classList.remove('placing');
}

// ---------- interfejs: HUD ----------
let shownCoins = 0;
function updateHUD() {
  const S = G.state;
  $('#lvl').textContent = S.level;
  const need = xpForLevel(S.level);
  $('#xpFill').style.width = `${Math.min(100, S.xp / need * 100)}%`;
  $('#xpText').textContent = S.level >= MAX_LEVEL ? 'MAX' : `${fmt(S.xp)} / ${fmt(need)}`;
  $('#ducats').textContent = fmt(S.ducats);
  animateCoins();
  $('#barnCount').textContent = `${invTotal()}/${capacity()}`;
}
function animateCoins() {
  const target = G.state.coins;
  const el = $('#coins');
  const start = shownCoins, t0 = performance.now();
  if (start === target) { el.textContent = fmt(target); return; }
  const step = t => {
    const p = Math.min(1, (t - t0) / 450);
    shownCoins = Math.round(start + (target - start) * p);
    el.textContent = fmt(shownCoins);
    if (p < 1 && G.state.coins === target) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function fly(ic, from, target) {
  if (!from) return;
  const el = document.createElement('div');
  el.className = 'fly';
  el.innerHTML = ic.startsWith('@') ? `<img class="ico-img" src="${customIcon(ic)}" alt="">` : ic;
  document.body.appendChild(el);
  const tr = $(target).getBoundingClientRect();
  const [x0, y0] = from;
  const x1 = tr.left + tr.width / 2, y1 = tr.top + tr.height / 2;
  el.style.left = `${x0}px`; el.style.top = `${y0}px`;
  const mx = (x0 + x1) / 2 + (Math.random() - 0.5) * 80, my = Math.min(y0, y1) - 60;
  const a = el.animate([
    { transform: 'translate(-50%,-50%) scale(1)', offset: 0 },
    { transform: `translate(calc(${mx - x0}px - 50%), calc(${my - y0}px - 50%)) scale(1.25)`, offset: 0.45 },
    { transform: `translate(calc(${x1 - x0}px - 50%), calc(${y1 - y0}px - 50%)) scale(.6)`, offset: 1 }
  ], { duration: 750, easing: 'ease-in-out' });
  a.onfinish = () => {
    el.remove();
    const t = $(target);
    t.classList.remove('bump'); void t.offsetWidth; t.classList.add('bump');
  };
}
function centerOf(sel) {
  const el = $(sel);
  if (!el) return [window.innerWidth / 2, window.innerHeight / 2];
  const r = el.getBoundingClientRect();
  return [r.left + r.width / 2, r.top + r.height / 3];
}

let toastTimer = 0;
function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
}

let tipState = null;
function tip(gx, gy, z, html) {
  tipState = { gx, gy, z, until: performance.now() + 2600 };
  const el = $('#tip');
  el.innerHTML = html;
  el.classList.add('show');
  updateTimers();
  positionTip();
}
function hideTip() { tipState = null; $('#tip').classList.remove('show'); }
function positionTip() {
  if (!tipState) return;
  if (performance.now() > tipState.until) { hideTip(); return; }
  const [sx, sy] = G.world.gridToScreen(tipState.gx, tipState.gy, tipState.z);
  const el = $('#tip');
  el.style.left = `${Math.max(90, Math.min(window.innerWidth - 90, sx))}px`;
  el.style.top = `${Math.max(70, sy)}px`;
  requestAnimationFrame(positionTip);
}

// ---------- zadania (prawa kolumna) ----------
function renderQuests() {
  const box = $('#quests');
  const html = activeQuests().map(i => {
    const q = QUESTS[i];
    const p = questProgress(i);
    const done = p >= q.n;
    return `<button class="quest ${done ? 'done' : ''}" data-q="${i}" aria-label="${esc(q.title)}">
      <span class="q-ico">${q.icon}</span>
      <span class="q-prog">${done ? '!' : `${p}/${q.n}`}</span>
    </button>`;
  }).join('');
  if (box.innerHTML !== html) box.innerHTML = html;
}
function openQuest(i) {
  const q = QUESTS[i];
  const p = questProgress(i);
  const r = q.reward;
  const rewards = [r.coins && `${fmt(r.coins)} 🪙`, r.xp && `${r.xp} XP`, r.ducats && `${r.ducats} 💎`, r.auto && `${r.auto} ⚙️`].filter(Boolean).join(' · ');
  const done = p >= q.n;
  openModal(`
    <div class="modal-ico">${q.icon}</div>
    <h3>${esc(q.title)}</h3>
    <p>${esc(q.text)}</p>
    <div class="progress"><i style="width:${p / q.n * 100}%"></i><span>${p} / ${q.n}</span></div>
    <p class="reward">Nagroda: <b>${rewards}</b></p>
    <div class="modal-actions">${done ? '<button class="btn green" id="claimBtn">Odbierz nagrodę</button>' : '<button class="btn" data-close>OK</button>'}</div>
  `);
  if (done) $('#claimBtn').onclick = () => claimQuest(i);
}

// ---------- okna (arkusze) ----------
let sheetRender = null;
function openSheet(title, tabs, activeTab, render) {
  const sheet = $('#sheet');
  sheet.querySelector('h2').textContent = title;
  const tabsEl = sheet.querySelector('.tabs');
  tabsEl.innerHTML = tabs ? tabs.map(([id, label]) => `<button class="tab ${id === activeTab ? 'active' : ''}" data-tab="${id}">${label}</button>`).join('') : '';
  tabsEl.style.display = tabs ? '' : 'none';
  sheetRender = render;
  sheet.classList.add('open');
  render(sheet.querySelector('.sheet-body'), activeTab);
  updateTimers();
}
function rerenderSheet() {
  const sheet = $('#sheet');
  if (!sheet.classList.contains('open') || !sheetRender) return;
  const body = sheet.querySelector('.sheet-body');
  const scroll = body.scrollTop;
  const active = sheet.querySelector('.tab.active')?.dataset.tab;
  sheetRender(body, active);
  body.scrollTop = scroll;
  updateTimers();
}
function closeSheet() { $('#sheet').classList.remove('open'); sheetRender = null; }

const previews = new Map();
function preview(type, k) {
  const key = type + ':' + k;
  if (!previews.has(key)) previews.set(key, G.world.preview(type, k));
  return previews.get(key);
}
function card({ img, emoji, name, lines = [], price, locked, lockText, action, cls = '' }) {
  return `<button class="card ${locked ? 'locked' : ''} ${cls}" ${action ? `data-act="${action}"` : ''} ${locked ? 'aria-disabled="true"' : ''}>
    <span class="card-img">${img ? `<img src="${img}" alt="">` : `<span class="big-emo">${emoji}</span>`}</span>
    <span class="card-name">${esc(name)}</span>
    ${lines.map(l => `<span class="card-line">${l}</span>`).join('')}
    ${locked ? `<span class="lock">🔒 ${lockText}</span>` : price ? `<span class="price">${price}</span>` : ''}
  </button>`;
}

function openShop(tab = 'seeds') {
  const tabs = [['seeds', '🌱 Nasiona'], ['animals', '🐄 Zwierzęta'], ['trees', '🌳 Drzewa'], ['buildings', '🏠 Budynki'], ['decor', '🌷 Ozdoby'], ['land', '🗺️ Ziemia']];
  openSheet('Sklep', tabs, tab, (body, tab) => {
    const L = G.state.level;
    let html = '<div class="grid">';
    if (tab === 'seeds') {
      for (const id in CROPS) {
        const c = CROPS[id];
        html += card({
          img: preview('crop', id), name: ITEMS[id].name,
          lines: [`⏱ ${fmtTime(c.time)}`, `zbiór: ${c.yield}× ${icon(id)}`],
          price: c.exotic ? `1× ${icon(c.exotic)} (${G.state.inv[c.exotic] || 0})` : `${c.seed} 🪙`, locked: c.lvl > L, lockText: `poziom ${c.lvl}`, action: `seed:${id}`,
          cls: G.tool === 'plant' && G.seed === id ? 'selected' : ''
        });
      }
    } else if (tab === 'animals') {
      for (const k in ANIMALS) {
        const a = ANIMALS[k];
        const n = G.state.objects.filter(o => o.k === k).length;
        html += card({
          img: preview('a', k), name: a.name,
          lines: [`je: ${a.foodN}× ${icon(a.food)} · daje ${icon(a.product)}`, `co ${fmtTime(a.time)}${n ? ` · masz ${n}` : ''}`],
          price: `${fmt(animalCost(k))} 🪙`, locked: a.lvl > L, lockText: `poziom ${a.lvl}`, action: `place:a:${k}`
        });
      }
    } else if (tab === 'trees') {
      for (const k in TREES) {
        const t = TREES[k];
        html += card({
          img: preview('tree', k), name: t.name,
          lines: [`${t.n}× ${icon(t.fruit)} co ${fmtTime(t.time)}`, t.sapling ? `+ ${icon(t.sapling)} sadzonka (${G.state.inv[t.sapling] || 0})` : 'sadzi się raz'],
          price: `${fmt(treeCost(k))} 🪙`, locked: t.lvl > L, lockText: `poziom ${t.lvl}`, action: `place:tree:${k}`
        });
      }
    } else if (tab === 'buildings') {
      for (const k in BUILDINGS) {
        const b = BUILDINGS[k];
        if (b.fixed) continue;
        const owned = G.state.objects.some(o => o.k === k);
        const lines = b.recipes ? [b.recipes.map(r => icon(r.out)).join('')] : b.kind === 'hive' ? [`${icon('honey')} co ${fmtTime(b.time)}`] : b.kind === 'well' ? ['💧 pozwala stawiać spryskiwacze'] : [];
        lines.push(`🔨 ${fmtTime(b.build)} · ${b.w}×${b.h}`);
        html += card({
          img: preview('b', k), name: b.name, lines,
          price: owned && b.max ? '✔ masz' : `${fmt(b.cost)} 🪙`, locked: b.lvl > L, lockText: `poziom ${b.lvl}`,
          action: owned && b.max ? '' : `place:b:${k}`, cls: owned && b.max ? 'owned' : ''
        });
      }
    } else if (tab === 'decor') {
      for (const k in DECOR) {
        const d = DECOR[k];
        if (d.shop) continue;
        const lines = d.special === 'sprinkler' ? ['+15% szybciej pola obok'] : [`${d.w || 1}×${d.h || 1}`];
        html += card({
          img: preview('d', k), name: d.name, lines,
          price: d.ducats ? `${d.ducats} 💎` : `${fmt(d.cost)} 🪙`, locked: d.lvl > L, lockText: `poziom ${d.lvl}`, action: `place:d:${k}`
        });
      }
    } else if (tab === 'land') {
      html = landHTML();
    }
    body.innerHTML = html + (tab === 'land' ? '' : '</div>');
  });
}
function landHTML() {
  const S = G.state;
  const cur = LAND[S.land];
  const next = LAND[S.land + 1];
  let html = `<div class="panel-box"><div class="big-emo">🗺️</div><p>Twoja ziemia: <b>${cur.size} × ${cur.size}</b> pól.</p>`;
  if (!next) return html + '<p>Masz już całą dolinę! 🎉</p></div>';
  const locked = next.lvl > S.level;
  html += `<p>Rozszerzenie do <b>${next.size} × ${next.size}</b> pól (+${next.size * next.size - cur.size * cur.size} pól).</p>
    <button class="btn green" data-act="expand" ${locked ? 'disabled' : ''}>${locked ? `🔒 od poziomu ${next.lvl}` : `Kup za ${fmt(next.cost)} 🪙`}</button></div>`;
  return html;
}
function expandLand() {
  const S = G.state;
  const next = LAND[S.land + 1];
  if (!next || next.lvl > S.level || !canPay({ coins: next.cost })) return;
  const before = G.landRect();
  pay({ coins: next.cost });
  S.land++;
  // na nowej ziemi pojawiają się przeszkody
  const after = G.landRect();
  const r = rng(S.land * 991);
  const kinds = ['weeds', 'stone', 'stump', 'weeds'];
  for (let y = after.y0; y < after.y1; y++) for (let x = after.x0; x < after.x1; x++) {
    const inside = x >= before.x0 && y >= before.y0 && x < before.x1 && y < before.y1;
    if (!inside && r() < 0.09 && isFree(x, y, 1, 1)) { S.objects.push({ id: S.nextId++, t: 'o', k: kinds[Math.floor(r() * 4)], x, y }); rebuildOcc(); }
  }
  rebuildOcc();
  G.world.rebuildGround();
  emit('expand');
  sfx.level();
  toast('Gospodarstwo powiększone! 🗺️');
  updateHUD();
  saveSoon();
  closeSheet();
}

function openSeedPicker(x, y) {
  const L = G.state.level;
  openModal(`<h3>Co posiać?</h3><div class="seed-grid">${Object.keys(CROPS).map(id => {
    const c = CROPS[id];
    const lock = c.lvl > L;
    return `<button class="seed ${lock ? 'locked' : ''}" data-seed="${id}" ${lock ? 'disabled' : ''}>
      <img src="${preview('crop', id)}" alt=""><b>${ITEMS[id].name}</b><small>${lock ? `🔒 poz. ${c.lvl}` : `${c.exotic ? `1× ${icon(c.exotic)}` : `${c.seed} 🪙`} · ${fmtTime(c.time)}`}</small></button>`;
  }).join('')}</div><div class="modal-actions"><button class="btn" data-close>Anuluj</button></div>`, 'wide');
  $('#modal').querySelectorAll('[data-seed]').forEach(b => b.onclick = () => {
    selectSeed(b.dataset.seed);
    closeModal();
    plant(x, y, G.seed);
    saveSoon();
  });
}
function selectSeed(id) {
  G.seed = id;
  setTool('plant');
}

function openBarn(selected, startTab = 'goods') {
  openSheet('Stodoła', [['goods', '📦 Towary'], ['stash', `🗃️ Schowek (${G.state.stash.length})`]], startTab, (body, tab) => {
    const S = G.state;
    if (tab === 'stash') {
      body.innerHTML = S.stash.length
        ? '<p class="muted center">Obiekty schowane narzędziem „Przesuń”. Dotknij, żeby postawić.</p><div class="grid">' + S.stash.map((o, i) => card({
          img: preview(o.t, o.k), name: objName(o), lines: [], price: 'Postaw', action: `unstash:${i}`
        })).join('') + '</div>'
        : '<p class="empty">Schowek jest pusty. Wybierz „Przesuń” ✥, dotknij obiektu i naciśnij „Do schowka”.</p>';
      return;
    }
    const total = invTotal(), cap = capacity();
    const next = STORAGE[S.storageLvl + 1];
    const items = Object.keys(S.inv).filter(k => S.inv[k] > 0);
    let html = `<div class="barn-head">
      <div class="progress big"><i style="width:${Math.min(100, total / cap * 100)}%"></i><span>📦 ${total} / ${cap}</span></div>
      ${next ? `<button class="btn small" data-act="upgradeBarn">Rozbuduj → ${next.cap} (${fmt(next.cost)} 🪙)</button>` : '<span class="muted">Największa stodoła!</span>'}
    </div>`;
    if (!items.length) html += '<p class="empty">Stodoła jest pusta. Zbierz plony z pól! 🌾</p>';
    html += '<div class="grid inv">';
    for (const k of items) {
      html += `<button class="inv-item ${k === selected ? 'selected' : ''}" data-act="inv:${k}">${icon(k)}<b>${S.inv[k]}</b><small>${esc(ITEMS[k].name)}</small></button>`;
    }
    html += '</div>';
    if (selected && S.inv[selected]) {
      const it = ITEMS[selected];
      const n = S.inv[selected];
      html += `<div class="sell-bar">${icon(selected)} <span><b>${esc(it.name)}</b><br><small>${it.price} 🪙 / szt.</small></span>
        <button class="btn small" data-act="sell1:${selected}">Sprzedaj 1</button>
        <button class="btn small green" data-act="sellall:${selected}">Wszystko (+${fmt(it.price * n)} 🪙)</button></div>`;
    }
    body.innerHTML = html;
  });
}
function sellItem(k, n) {
  const S = G.state;
  n = Math.min(n, S.inv[k] || 0);
  if (!n) return;
  S.inv[k] -= n;
  if (!S.inv[k]) delete S.inv[k];
  addCoins(ITEMS[k].price * n, centerOf('#sheet .sell-bar'));
  sfx.coin();
  updateHUD();
  saveSoon();
  openBarn(S.inv[k] ? k : null);
}
function upgradeBarn() {
  const next = STORAGE[G.state.storageLvl + 1];
  if (!next || !canPay({ coins: next.cost })) return;
  pay({ coins: next.cost });
  G.state.storageLvl++;
  sfx.build();
  toast(`Stodoła mieści teraz ${next.cap} rzeczy 📦`);
  updateHUD();
  saveSoon();
  openBarn();
}

function openOrders() {
  refreshOrders();
  openSheet('Tablica zamówień', null, null, body => {
    body.innerHTML = '<div class="grid orders">' + G.state.orders.map((o, i) => {
      if (!o.items) return `<div class="order empty"><span class="big-emo">🚚</span><small>Nowy klient za<br><b data-end="${o.ready}"></b></small></div>`;
      const ok = has(o.items);
      return `<div class="order ${ok ? 'ok' : ''}">
        <button class="order-x" data-act="reject:${i}" aria-label="Odrzuć">✕</button>
        <div class="order-who"><span class="av">${o.av}</span><small>${esc(o.cust)}</small></div>
        <div class="order-items">${Object.entries(o.items).map(([k, n]) => {
          const have = G.state.inv[k] || 0;
          return `<span class="need ${have >= n ? 'have' : ''}">${icon(k)}<b>${Math.min(have, n)}/${n}</b></span>`;
        }).join('')}</div>
        <div class="order-reward">+${fmt(o.coins)} 🪙 · +${o.xp} XP${o.ducats ? ' · +1 💎' : ''}</div>
        <button class="btn small ${ok ? 'green' : ''}" data-act="deliver:${i}" ${ok ? '' : 'disabled'}>Dostarcz</button>
      </div>`;
    }).join('') + '</div>';
  });
}

function openBuilding(o) {
  const d = BUILDINGS[o.k];
  openSheet(d.name, null, null, body => {
    const t = now();
    const slots = slotsOf(o);
    const cells = Math.max(4, slots + ((o.slots || 2) < 4 ? 1 : 0));
    let html = '<div class="queue">';
    for (let i = 0; i < cells; i++) {
      const j = o.q[i];
      if (j) {
        const r = d.recipes[j.r];
        const ready = j.e <= t;
        const active = j.s <= t && !ready;
        const p = active ? (t - j.s) / (j.e - j.s) : ready ? 1 : 0;
        html += `<div class="slot ${ready ? 'ready' : active ? 'active' : 'wait'}">${icon(r.out)}
          <div class="progress thin"><i style="width:${p * 100}%"></i></div>
          <small>${ready ? 'Gotowe!' : active ? `<span data-end="${j.e}"></span>` : 'w kolejce'}</small>
          ${active ? `<button class="mini" data-act="speed:${i}">⏩ ${speedCost(j.e - t)}💎</button>` : ''}
        </div>`;
      } else if (i < slots) {
        html += '<div class="slot empty"><span>+</span><small>wolne</small></div>';
      } else {
        const c = (o.slots || 2) === 2 ? 5 : 10;
        html += `<button class="slot locked" data-act="slot:${c}" ${i > slots ? 'disabled' : ''}><span>🔒</span><small>${c} 💎</small></button>`;
      }
    }
    html += '</div>';
    html += More.buildingExtrasHTML(o);
    if (readyJobs(o, t).length) html += '<button class="btn green wide" data-act="collect">Odbierz gotowe</button>';
    html += '<div class="recipes">';
    d.recipes.forEach((r, ri) => {
      const lock = (r.lvl || 0) > G.state.level;
      const ok = has(r.in);
      html += `<div class="recipe ${lock ? 'locked' : ''}">
        <span class="r-out">${icon(r.out)}</span>
        <span class="r-mid"><b>${esc(ITEMS[r.out].name)}</b>
          <span class="r-in">${Object.entries(r.in).map(([k, n]) => `<span class="need ${(G.state.inv[k] || 0) >= n ? 'have' : ''}">${icon(k)}${G.state.inv[k] || 0}/${n}</span>`).join('')}</span>
          <small>⏱ ${fmtTime(jobTime(o, r) / 1000)} · +${r.xp} XP · ${ITEMS[r.out].price} 🪙</small></span>
        ${lock ? `<span class="lock">🔒 poz. ${r.lvl}</span>` : `<span class="r-btns"><button class="btn small ${ok ? 'green' : ''}" data-act="make:${ri}" ${ok && o.q.length < slots ? '' : 'disabled'}>Produkuj</button>${More.serialButton(o, ri)}</span>`}
      </div>`;
    });
    html += '</div>';
    body.innerHTML = html;
    body.dataset.obj = o.id;
  });
}
const speedCost = ms => Math.max(1, Math.ceil(ms / 600000));
function speedJob(o, i) {
  const t = now();
  const j = o.q[i];
  if (!j) return;
  const c = speedCost(j.e - t);
  if (!canPay({ ducats: c })) return;
  pay({ ducats: c });
  const shift = j.e - t;
  for (const k of o.q) if (k.e >= j.e) { k.e -= shift; k.s = Math.max(t, k.s - shift); }
  j.e = t;
  sfx.coin();
  saveSoon();
}

function openConstruction(o) {
  const d = BUILDINGS[o.k];
  const left = o.done - now();
  const c = speedCost(left);
  openModal(`<div class="modal-ico">🔨</div><h3>Budowa: ${esc(d.name)}</h3>
    <p>Robotnicy pracują. Koniec za <b data-end="${o.done}"></b>.</p>
    <div class="modal-actions"><button class="btn" data-close>OK</button><button class="btn green" id="speedBuild">Przyspiesz (${c} 💎)</button></div>`);
  $('#speedBuild').onclick = () => {
    if (!canPay({ ducats: c })) return;
    pay({ ducats: c });
    o.done = now();
    closeModal();
    finishBuild(o);
  };
}

function openWell(o) {
  const lvl = o.lvl || 0;
  const next = WELL[lvl + 1];
  const used = G.state.objects.filter(x => x.k === 'sprinkler').length;
  openModal(`<div class="modal-ico">⛲</div><h3>Studnia (poziom ${lvl + 1})</h3>
    <p>Spryskiwacze: <b>${used} / ${WELL[lvl].sprinklers}</b>. Każdy przyspiesza wzrost roślin na 8 polach dookoła o 15%.</p>
    <div class="modal-actions"><button class="btn" data-close>OK</button>
    ${next ? `<button class="btn green" id="wellUp">Rozbuduj → ${next.sprinklers} (${fmt(next.cost)} 🪙)</button>` : ''}</div>`);
  if (next) $('#wellUp').onclick = () => {
    if (!canPay({ coins: next.cost })) return;
    pay({ coins: next.cost });
    o.lvl = lvl + 1;
    sfx.build();
    closeModal();
    saveSoon();
  };
}

function openHouse() {
  const S = G.state;
  const days = Math.max(1, Math.round((now() - S.created) / 86400000));
  openModal(`<div class="modal-ico">🏡</div><h3>Twój dom</h3>
    <p>Gospodarujesz od <b>${days}</b> ${days === 1 ? 'dnia' : 'dni'}. Zrealizowane zamówienia: <b>${S.stats.orders}</b>.</p>
    <p>Pola: <b>${Object.keys(S.fields).length}</b> · Zwierzęta: <b>${S.objects.filter(o => o.t === 'a').length}</b> · Drzewa: <b>${S.objects.filter(o => o.t === 'tree').length}</b></p>
    <div class="modal-actions"><button class="btn" data-close>OK</button></div>`);
}

function openNeighbors() {
  openSheet('Sąsiedzi', null, null, body => {
    const today = dayStr();
    body.innerHTML = '<p class="muted center">Pomagaj sąsiadom raz dziennie — oni też coś Ci podarują!</p><div class="nb-list">' + NEIGHBORS.map(n => {
      const s = G.state.nb[n.id] || {};
      return `<div class="nb">
        <span class="nb-av">${n.avatar}</span>
        <span class="nb-name"><b>${esc(n.name)}</b><small>⭐ poziom ${n.lvl}</small></span>
        <button class="btn small ${s.help === today ? '' : 'green'}" data-act="help:${n.id}" ${s.help === today ? 'disabled' : ''}>${s.help === today ? '✔ pomogłeś' : '🤝 Pomóż'}</button>
        <button class="btn small ${s.gift === today ? '' : 'gold'}" data-act="gift:${n.id}" ${s.gift === today ? 'disabled' : ''}>${s.gift === today ? '✔' : '🎁 Prezent'}</button>
      </div>`;
    }).join('') + '</div>';
  });
}
function helpNeighbor(id) {
  const S = G.state;
  const s = S.nb[id] = S.nb[id] || {};
  if (s.help === dayStr()) return;
  s.help = dayStr();
  const coins = 20 + 5 * S.level;
  addCoins(coins, centerOf('#sheet .sheet-card'));
  addXP(5);
  S.tickets++;
  emit('help');
  sfx.coin();
  const n = NEIGHBORS.find(x => x.id === id);
  toast(`${n.avatar} ${n.name} dziękuje za pomoc w polu! +${coins} 🪙 +5 XP +1 🎟️`);
  saveSoon();
  rerenderSheet();
}
function giftNeighbor(id) {
  const S = G.state;
  const s = S.nb[id] = S.nb[id] || {};
  if (s.gift === dayStr()) return;
  const pool = orderPool().map(p => p.id).filter(k => ITEMS[k].price < 60);
  const k = pick(pool.length ? pool : ['wheat']);
  const n = 2 + Math.floor(Math.random() * 3);
  if (!hasRoom(n)) return;
  s.gift = dayStr();
  addItem(k, n, centerOf('#sheet .sheet-card'));
  sfx.pop();
  const nb = NEIGHBORS.find(x => x.id === id);
  toast(`${nb.avatar} ${nb.name} podarował(a) Ci ${n}× ${ITEMS[k].name}`);
  updateHUD();
  saveSoon();
  rerenderSheet();
}

function openMenu() {
  const S = G.state;
  openSheet('Menu', null, null, body => {
    body.innerHTML = `<div class="menu">
      <button class="menu-row" data-act="toggleSound"><span>${S.settings.sound ? '🔊' : '🔇'}</span><b>Dźwięk</b><em>${S.settings.sound ? 'włączony' : 'wyłączony'}</em></button>
      <button class="menu-row" data-act="toggleQuality"><span>🎨</span><b>Jakość grafiki</b><em>${S.settings.quality === 'low' ? 'oszczędna' : 'wysoka'}</em></button>
      <button class="menu-row" data-act="howto"><span>❓</span><b>Jak grać</b><em></em></button>
      <button class="menu-row" data-act="daily"><span>📅</span><b>Nagroda dnia</b><em>seria: ${S.daily.streak} ${S.daily.streak === 1 ? 'dzień' : 'dni'}</em></button>
      <button class="menu-row danger" data-act="reset"><span>♻️</span><b>Zacznij od nowa</b><em></em></button>
    </div><p class="muted center">Wiejska Zagroda · gra działa offline, postęp zapisuje się w telefonie.</p>`;
  });
}
function openHelp() {
  openModal(`<h3>Jak grać</h3><div class="help">
    <p>🚜 <b>Pług</b> — dotknij trawy (albo przeciągnij palcem), żeby zaorać pola.</p>
    <p>🌱 <b>Siew</b> — wybierz nasiona i dotykaj pustych pól. Dojrzałe plony zbierasz dotykiem albo przeciągnięciem.</p>
    <p>🐔 <b>Zwierzęta</b> — gdy nad głową widać dymek z jedzeniem, dotknij, żeby nakarmić. Potem odbierz jajka, mleko, wełnę…</p>
    <p>🏭 <b>Budynki</b> — młyn, piekarnia, mleczarnia i inne zamieniają plony w droższe przetwory.</p>
    <p>📋 <b>Zamówienia</b> — na tablicy klienci płacą więcej niż skup w stodole.</p>
    <p>💧 <b>Studnia i spryskiwacze</b> — rośliny obok spryskiwacza rosną o 15% szybciej.</p>
    <p>✥ <b>Przesuń</b> i 💰 <b>Sprzedaj</b> — urządzaj zagrodę po swojemu. Niepotrzebne obiekty schowasz w schowku.</p>
    <p>🧰 <b>Maszyny</b> — nawóz przyspiesza roślinę, kombajn i siewnik pracują na 3×3 polach (paliwo ⛽).</p>
    <p>🧭 <b>Okolica</b> — sąsiedzi, zadania dnia, wydarzenia, plan podróży, wycieczki i kurort nad morzem.</p>
    <p>🎣 <b>Pomost</b>, ⛏️ <b>kopalnia</b>, ☕ <b>kawiarnia</b>, 🏡 <b>dom do urządzenia</b>, 🍼 <b>pokój malucha</b> i ⚙️ <b>automatyzacja</b> odblokowują się z poziomami.</p>
    <p>☝️ Jeden palec przesuwa mapę, dwa palce przybliżają.</p>
  </div><div class="modal-actions"><button class="btn green" data-close>Do roboty!</button></div>`, 'wide');
}

// ---------- okna modalne ----------
function openModal(html, cls = '') {
  const m = $('#modal');
  m.querySelector('.modal-card').className = `modal-card ${cls}`;
  m.querySelector('.modal-card').innerHTML = html;
  m.classList.add('open');
  m.querySelectorAll('[data-close]').forEach(b => b.onclick = closeModal);
  updateTimers();
}
function closeModal() {
  $('#modal').classList.remove('open');
  setTimeout(() => {
    if (levelUpQueue.length) showLevelUp();
  }, 250);
}
function confirmBox(title, text, okLabel, onOk) {
  openModal(`<h3>${esc(title)}</h3><p>${esc(text)}</p><div class="modal-actions"><button class="btn" data-close>Anuluj</button><button class="btn red" id="okBtn">${esc(okLabel)}</button></div>`);
  $('#okBtn').onclick = () => { closeModal(); onOk(); };
}

function unlocksAt(level) {
  const out = [];
  for (const id in CROPS) if (CROPS[id].lvl === level) out.push(icon(id) + ' ' + ITEMS[id].name);
  for (const k in ANIMALS) if (ANIMALS[k].lvl === level) out.push(ANIMALS[k].name);
  for (const k in TREES) if (TREES[k].lvl === level) out.push(TREES[k].name);
  for (const k in BUILDINGS) if (BUILDINGS[k].lvl === level) out.push(BUILDINGS[k].name);
  for (const k in BUILDINGS) for (const r of BUILDINGS[k].recipes || []) if (r.lvl === level) out.push(icon(r.out) + ' ' + ITEMS[r.out].name);
  for (const k in DECOR) if (DECOR[k].lvl === level) out.push(DECOR[k].name);
  for (const l of LAND) if (l.lvl === level) out.push('🗺️ rozszerzenie ziemi');
  return out.concat(More.unlocksAt(level));
}
function showLevelUp() {
  const level = levelUpQueue.shift();
  if (!level) return;
  const coins = 50 * level;
  const ducats = level % 5 === 0 ? 2 : 1;
  const auto = level >= 10 ? 1 : 0;
  G.state.coins += coins;
  G.state.ducats += ducats;
  G.state.auto += auto;
  updateHUD();
  sfx.level();
  confetti();
  const un = unlocksAt(level);
  openModal(`<div class="lvl-burst"><span>${level}</span></div><h3>Nowy poziom!</h3>
    <p class="reward">Nagroda: <b>${fmt(coins)} 🪙 · ${ducats} 💎${auto ? ` · ${auto} ⚙️` : ''}</b></p>
    ${un.length ? `<p class="muted">Odblokowano:</p><div class="unlocks">${un.map(u => `<span>${u}</span>`).join('')}</div>` : ''}
    <div class="modal-actions"><button class="btn green" data-close>Super!</button></div>`);
  saveSoon();
}
function confetti() {
  const box = document.createElement('div');
  box.className = 'confetti';
  const cols = ['#ffd23f', '#ff5a7a', '#5ac8fa', '#7cd34a', '#ff8c42', '#c46cff'];
  for (let i = 0; i < 60; i++) {
    const s = document.createElement('i');
    s.style.left = `${Math.random() * 100}%`;
    s.style.background = cols[i % cols.length];
    s.style.animationDelay = `${Math.random() * 0.4}s`;
    s.style.animationDuration = `${1.6 + Math.random() * 1.2}s`;
    s.style.transform = `rotate(${Math.random() * 360}deg)`;
    box.appendChild(s);
  }
  document.body.appendChild(box);
  setTimeout(() => box.remove(), 3200);
}

function checkDaily(force) {
  const S = G.state;
  const today = dayStr();
  if (S.daily.last === today && !force) return;
  if (S.daily.last === today) {
    openModal(`<div class="modal-ico">📅</div><h3>Nagroda dnia</h3><p>Dzisiejsza nagroda już odebrana. Wróć jutro — seria: <b>${S.daily.streak}</b>.</p>${dailyRow(S.daily.streak)}<div class="modal-actions"><button class="btn" data-close>OK</button></div>`, 'wide');
    return;
  }
  const yesterday = dayStr(now() - 86400000);
  const streak = S.daily.last === yesterday ? S.daily.streak + 1 : 1;
  const r = DAILY[(streak - 1) % DAILY.length];
  openModal(`<div class="modal-ico">🎁</div><h3>Witaj w zagrodzie!</h3><p>Nagroda za ${streak}. dzień z rzędu:</p>${dailyRow(streak)}
    <p class="muted">Do tego codziennie: 1 🧪 nawóz i 1 ⛽ paliwo do maszyn.</p>
    <div class="modal-actions"><button class="btn green" id="dailyBtn">Odbierz ${fmt(r.coins)} 🪙${r.ducats ? ` + ${r.ducats} 💎` : ''}</button></div>`, 'wide');
  $('#dailyBtn').onclick = () => {
    S.daily = { last: today, streak };
    addCoins(r.coins, centerOf('#modal .modal-card'));
    S.ducats += r.ducats || 0;
    S.boost.fert++; S.boost.fuel++;
    sfx.coin();
    updateHUD();
    saveSoon();
    closeModal();
  };
}
function dailyRow(streak) {
  const cur = ((streak - 1) % DAILY.length);
  return `<div class="daily">${DAILY.map((d, i) => `<span class="day ${i < cur ? 'past' : i === cur ? 'now' : ''}"><small>dzień ${i + 1}</small><b>${d.ducats ? '💎' : '🪙'}</b><em>${fmt(d.coins)}${d.ducats ? `+${d.ducats}💎` : ''}</em></span>`).join('')}</div>`;
}

// ---------- narzędzia ----------
function setTool(t) {
  G.tool = t;
  document.querySelectorAll('.tool').forEach(b => b.classList.toggle('active', b.dataset.tool === t || (b.dataset.tool === 'machine' && MACHINES.includes(t))));
  More.updateMachineButton();
  const chip = $('#seedChip');
  if (t === 'plant') {
    const c = CROPS[G.seed];
    chip.innerHTML = `Siejesz: ${icon(G.seed)} <b>${ITEMS[G.seed].name}</b> <small>${c.exotic ? `1× ${icon(c.exotic)}` : `${c.seed} 🪙`}</small> <button data-act="pickseed">zmień</button>`;
    chip.classList.add('show');
    $('#seedTool').innerHTML = iconRaw(G.seed).startsWith('@') ? '🌱' : iconRaw(G.seed);
  } else chip.classList.remove('show');
  const hints = {
    plow: 'Pług: dotknij trawy albo przeciągnij palcem 🚜', move: 'Przesuwanie: dotknij obiektu, który chcesz przestawić', sell: 'Sprzedaż: dotknij obiektu lub pola',
    fert: 'Nawóz 🧪: dotknij rosnącej rośliny — dojrzeje od razu', combine: 'Kombajn ⚙️: dotknij pola — zbierze 3×3 (1 ⛽)', seeder: 'Siewnik 🌱: dotknij pola — obsieje 3×3 (1 ⛽)'
  };
  if (hints[t]) toast(hints[t]);
  document.body.dataset.tool = t;
}

// ---------- odliczanie czasu ----------
function updateTimers() {
  const t = now();
  let expired = false;
  document.querySelectorAll('[data-end]').forEach(el => {
    const left = (+el.dataset.end - t) / 1000;
    if (left <= 0) { el.textContent = 'gotowe!'; expired = true; } else el.textContent = fmtTime(left);
  });
  return expired;
}

function tick() {
  More.tick();
  const changed = refreshOrders();
  const expired = updateTimers();
  const sheet = $('#sheet');
  if (sheet.classList.contains('open') && (expired || changed)) rerenderSheet();
  renderQuests();
}

// ---------- start ----------
function bindUI() {
  document.querySelectorAll('.tool').forEach(b => b.addEventListener('click', () => {
    sfx.click();
    if (b.dataset.tool === 'plant' && G.tool === 'plant') { openShop('seeds'); return; }
    if (b.dataset.tool === 'machine') { More.openMachines(); return; }
    setTool(b.dataset.tool);
  }));
  $('#shopBtn').onclick = () => { sfx.click(); openShop(); };
  $('#barnBtn').onclick = () => { sfx.click(); openBarn(); };
  $('#ordersBtn').onclick = () => { sfx.click(); openOrders(); };
  $('#nbBtn').onclick = () => { sfx.click(); More.openHub(); };
  $('#ghostStash').onclick = stashGhost;
  $('#menuBtn').onclick = () => { sfx.click(); openMenu(); };
  $('#ducatBtn').onclick = () => toast('Dukaty 💎 zdobywasz za awanse, zadania, nagrody dnia i niektóre zamówienia');
  $('#levelBtn').onclick = () => toast(`Poziom ${G.state.level} — do następnego brakuje ${fmt(xpForLevel(G.state.level) - G.state.xp)} XP`);
  $('#ghostOk').onclick = confirmGhost;
  $('#ghostCancel').onclick = cancelGhost;
  $('#zoomIn').onclick = () => G.world.zoomBy(1.25);
  $('#zoomOut').onclick = () => G.world.zoomBy(0.8);
  $('#sheet').addEventListener('click', e => {
    if (e.target.id === 'sheet' || e.target.closest('.x')) { closeSheet(); return; }
    const tab = e.target.closest('.tab');
    if (tab) {
      $('#sheet').querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t === tab));
      rerenderSheet();
      sfx.click();
      return;
    }
    const a = e.target.closest('[data-act]');
    if (!a || a.disabled || a.getAttribute('aria-disabled') === 'true') {
      if (a?.classList.contains('locked')) { toast('Jeszcze zablokowane — zdobywaj doświadczenie ⭐'); sfx.error(); }
      return;
    }
    handleAction(a.dataset.act);
  });
  $('#modal').addEventListener('click', e => { if (e.target.id === 'modal') closeModal(); });
  $('#seedChip').addEventListener('click', e => { if (e.target.closest('[data-act]')) openShop('seeds'); });
  $('#quests').addEventListener('click', e => {
    const q = e.target.closest('[data-q]');
    if (q) { sfx.click(); openQuest(+q.dataset.q); }
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });
  window.addEventListener('pagehide', save);
  window.addEventListener('keydown', e => {
    if (e.key === 'Escape') { if (G.ghost) cancelGhost(); else if ($('#modal').classList.contains('open')) closeModal(); else closeSheet(); }
  });
}

function handleAction(act) {
  const [a, b, c] = act.split(':');
  sfx.click();
  const objId = +$('#sheet .sheet-body').dataset.obj;
  const obj = G.state.objects.find(o => o.id === objId);
  switch (a) {
    case 'seed': selectSeed(b); closeSheet(); break;
    case 'place': startPlace(b, c); break;
    case 'expand': expandLand(); break;
    case 'inv': openBarn(b); break;
    case 'sell1': sellItem(b, 1); break;
    case 'sellall': sellItem(b, Infinity); break;
    case 'upgradeBarn': upgradeBarn(); break;
    case 'deliver': deliver(+b); break;
    case 'reject':
      confirmBox('Odrzucić zamówienie?', 'Nowy klient przyjdzie za 2 minuty.', 'Odrzuć', () => { G.state.orders[+b] = { ready: now() + 120000 }; saveSoon(); openOrders(); });
      break;
    case 'make': if (obj) { enqueue(obj, +b); rerenderSheet(); } break;
    case 'collect': if (obj) { collectJobs(obj); rerenderSheet(); } break;
    case 'speed': if (obj) { speedJob(obj, +b); rerenderSheet(); } break;
    case 'slot':
      if (obj && canPay({ ducats: +b })) { pay({ ducats: +b }); obj.slots = (obj.slots || 2) + 1; saveSoon(); rerenderSheet(); }
      break;
    case 'help': helpNeighbor(b); break;
    case 'gift': giftNeighbor(b); break;
    case 'toggleSound':
      G.state.settings.sound = !G.state.settings.sound;
      setSound(G.state.settings.sound);
      saveSoon(); rerenderSheet();
      break;
    case 'toggleQuality':
      G.state.settings.quality = G.state.settings.quality === 'low' ? 'high' : 'low';
      G.world.applyQuality();
      previews.clear();
      saveSoon(); rerenderSheet();
      break;
    case 'howto': closeSheet(); openHelp(); break;
    case 'daily': closeSheet(); checkDaily(true); break;
    case 'unstash': placeFromStash(+b); break;
    case 'reset':
      confirmBox('Zacząć od nowa?', 'Cały postęp zostanie usunięty.', 'Tak, od nowa', () => {
        try { localStorage.removeItem(SAVE_KEY); } catch { /* ignore */ }
        location.reload();
      });
      break;
    default: More.handleAction(a, b, c, obj);
  }
}

function boot() {
  const loaded = load();
  if (loaded) { G.state = loaded; rebuildOcc(); } else newGame();
  setSound(G.state.settings.sound);
  shownCoins = G.state.coins;
  G.world = createWorld($('#map'), G);
  G.world.centerOnTile(14.5, 13.5, Math.max(0.85, Math.min(1.3, window.innerWidth / 420)));
  G.world.start();
  bindUI();
  setTool('hand');
  updateHUD();
  renderQuests();
  refreshOrders();
  More.onBoot();
  setInterval(tick, 1000);
  setInterval(save, 15000);
  setTimeout(() => {
    $('#splash').classList.add('hide');
    setTimeout(() => {
      if (!loaded) openHelp();
      else checkDaily();
      if (!loaded) { G.state.daily = { last: dayStr(), streak: 1 }; saveSoon(); }
    }, 300);
  }, 700);
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
}

boot();

export {
  G, $, now, fmt, fmtTime, icon, iconRaw, esc, pick, dayStr, toast, tip, addXP, addCoins, addItem, takeItems, has, hasRoom,
  invTotal, balance, canPay, pay, costText, costHTML, openSheet, rerenderSheet, closeSheet, openModal, closeModal, confirmBox,
  emit, updateHUD, saveSoon, centerOf, fly, findFree, isFree, rebuildOcc, removeObject, objName, openNeighbors, startPlace,
  preview, card, isBuilt, plant, harvest, readyJobs, jobTime, slotsOf, orderPool, setTool, openBarn, animalCost, collectJobs
};
