import { createFarm3D } from './farm3d.js';
import { createMusic } from './music.js';
import {
  ITEMS, CROPS, ANIMALS, RECIPES, HALLOWEEN, UPGRADES, HELPERS, PROJECTS, TRIPS, FISH_TABLE, BOOSTERS,
  MERCHANT_POOL, QUESTS, ACHIEVEMENTS, ACHIEVEMENT_REWARDS, NPCS, REQUESTS, TIPS, HALLOWEEN_TIPS,
  DAILY_REWARDS, DECO, DECO_LOOT, SEASONS, SEASON_DAYS, TREES, HEATER, PROCESSORS
} from './data.js';

const SAVE_KEY = 'wiejskie_zycie_save_v1';
const COLS = 6;
const ROWS = 7;
const DAY_LENGTH = 8 * 60 * 1000;
const MAX_OFFLINE = 12 * 60 * 60 * 1000;
const DRY_SPEED = 0.5;
const HARVEST_YIELD = 2;
const KITCHEN_LEVEL = 3;
const FISHING_LEVEL = 3;
const MERCHANT_LEVEL = 4;
const MAX_KITCHEN_SLOTS = 3;
const KITCHEN_SLOT_PRICE = 400;
const CROW_LIFE = 40000;
const GOLDEN_CHANCE = 0.02;

const $ = id => document.getElementById(id);
const rand = n => Math.floor(Math.random() * n);
const randInt = (a, b) => a + rand(b - a + 1);
const pick = arr => arr[rand(arr.length)];
const xpNeeded = level => 10 * level * (level + 1);
const inv = id => state.inv[id] || 0;

function fmtTime(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return s % 60 ? `${m}m ${s % 60}s` : `${m}m`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

function itemLabel(id) {
  return `${ITEMS[id].icon} ${ITEMS[id].name}`;
}

function localDay(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);
}

/* ---------- Costs & rewards ---------- */

function have(key) {
  if (key === 'coins') return state.coins;
  if (key === 'gold') return state.gold;
  return inv(key);
}

function keyIcon(key) {
  if (key === 'coins') return '🪙';
  if (key === 'gold') return '🌟';
  return ITEMS[key].icon;
}

function canAfford(cost) {
  return Object.entries(cost).every(([key, n]) => have(key) >= n);
}

function pay(cost) {
  Object.entries(cost).forEach(([key, n]) => {
    if (key === 'coins') addCoins(-n);
    else if (key === 'gold') state.gold -= n;
    else addItem(key, -n);
  });
}

function grant(reward) {
  Object.entries(reward).forEach(([key, n]) => {
    if (!n) return;
    if (key === 'coins') addCoins(n);
    else if (key === 'gold') addGold(n);
    else addItem(key, n);
  });
}

function rewardText(reward) {
  return Object.entries(reward).filter(([, n]) => n).map(([key, n]) => `${keyIcon(key)} ${n}`).join('  ');
}

function costChips(cost, check = true) {
  return Object.entries(cost).map(([key, n]) => {
    const cls = !check ? '' : have(key) >= n ? 'ok' : 'miss';
    return `<span class="chip ${cls}">${keyIcon(key)} ${n}</span>`;
  }).join('');
}

/* ---------- Halloween ---------- */

const params = new URLSearchParams(location.search);
const FORCE_EVENT = params.has('halloween') ? params.get('halloween') !== '0' : null;

function halloweenActive(date = new Date()) {
  if (FORCE_EVENT !== null) return FORCE_EVENT;
  const m = date.getMonth();
  const d = date.getDate();
  return (m === 9 && d >= 15) || (m === 10 && d <= 7);
}

function eventDaysLeft() {
  const now = new Date();
  const end = new Date(now.getFullYear(), 10, 8);
  return Math.max(1, Math.ceil((end - now) / 86400000));
}

function hasDecor(id) {
  return state.decor.includes(id);
}

function ensureEventSeason() {
  if (!halloweenActive()) return;
  const year = new Date().getFullYear();
  if (state.event.year !== year) {
    state.event = { year, points: 0, claimed: [], cauldron: state.event.cauldron || [null, null] };
  }
}

/* ---------- State ---------- */

function newGame() {
  const tiles = [];
  for (let i = 0; i < COLS * ROWS; i++) {
    const r = Math.floor(i / COLS);
    const c = i % COLS;
    if (r < 2 || r > 4 || c < 1 || c > 4) tiles.push({ s: 'locked', deco: DECO[(i * 7 + 3) % DECO.length] });
    else if (r === 2) tiles.push({ s: 'crop', crop: 'wheat', p: CROPS.wheat.time * 1000, T: CROPS.wheat.time * 1000, w: true });
    else if (r === 3) tiles.push({ s: 'soil' });
    else tiles.push({ s: 'grass' });
  }
  return migrate({
    v: 1,
    coins: 40,
    xp: 0,
    level: 1,
    tiles,
    landBought: 0,
    inv: {},
    animals: [],
    kitchen: [null, null],
    orders: [
      { npc: 0, text: REQUESTS[0], items: { wheat: 4 }, coins: 25, xp: 4 },
      { npc: 3, text: REQUESTS[1], items: { wheat: 2, carrot: 2 }, coins: 30, xp: 5 },
      { wait: 20000, total: 20000 }
    ],
    day: 1,
    dayTime: DAY_LENGTH * 0.08,
    weather: 'sunny',
    seed: 'wheat',
    sound: true,
    seenIntro: false,
    lastSave: Date.now()
  });
}

function migrate(data) {
  data.event = data.event || { year: 0, points: 0, claimed: [], cauldron: [null, null] };
  data.event.cauldron = data.event.cauldron || [null, null];
  data.decor = data.decor || [];
  data.daily = data.daily || { last: '', streak: 0 };
  data.gfx = data.gfx || '3d';
  data.stats = { harvested: 0, orders: 0, earned: 0, ...(data.stats || {}) };
  data.gold = data.gold || 0;
  data.upgrades = data.upgrades || {};
  data.helpers = data.helpers || {};
  data.projects = data.projects || {};
  data.quest = data.quest || { idx: 0, base: data.stats.harvested };
  data.ach = data.ach || {};
  data.boosters = data.boosters || {};
  data.coffee = data.coffee || 0;
  data.trip = data.trip || null;
  data.merchant = data.merchant || { day: 0, offers: [] };
  data.deals = data.deals || { day: 0, items: {} };
  data.fishCd = data.fishCd || 0;
  data.farmName = data.farmName || '';
  data.music = data.music !== false;
  data.crowTimer = data.crowTimer || 45000;
  data.seasonSeen = data.seasonSeen ?? Math.floor((data.day - 1) / SEASON_DAYS) % 4;
  data.processors = data.processors || {};
  data.heatFuel = data.heatFuel || 0;
  if ((data.dataV || 3) < 4) {
    // v4 dodała 5 zadań przed ostatnim zadaniem kroniki
    if (data.quest.idx >= 24) data.quest.idx += 5;
    data.dataV = 4;
  }
  data.tiles.forEach(t => {
    if (t.s === 'crop' && !t.T) t.T = CROPS[t.crop].time * 1000;
  });
  return data;
}

function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    return parseSave(raw);
  } catch {
    return null;
  }
}

function parseSave(raw) {
  const data = JSON.parse(raw);
  if (!data || data.v !== 1 || !Array.isArray(data.tiles) || data.tiles.length !== COLS * ROWS) return null;
  return migrate(data);
}

function save() {
  state.lastSave = Date.now();
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch {
    // brak miejsca albo tryb prywatny — gra działa dalej bez zapisu
  }
}

let state = load() || newGame();

/* ---------- Sound & music ---------- */

let audio = null;
const music = createMusic(() => audio);

function unlockAudio() {
  if (!audio) {
    try {
      audio = new (window.AudioContext || window.webkitAudioContext)();
    } catch {
      audio = null;
    }
  }
  if (audio && audio.state === 'suspended') audio.resume();
  if (audio && state.music && !music.playing && !document.hidden) music.start();
}

function tone(freq, dur, type = 'sine', vol = 0.12, delay = 0, slide = 0) {
  const t = audio.currentTime + delay;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slide) osc.frequency.exponentialRampToValueAtTime(slide, t + dur);
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
  osc.connect(gain).connect(audio.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

const SOUNDS = {
  plow: () => tone(130, 0.09, 'triangle', 0.2),
  plant: () => tone(520, 0.07),
  water: () => { tone(900, 0.06, 'sine', 0.07); tone(1250, 0.06, 'sine', 0.05, 0.05); },
  harvest: () => { tone(660, 0.07); tone(880, 0.1, 'sine', 0.12, 0.06); },
  coin: () => { tone(988, 0.06, 'square', 0.05); tone(1319, 0.14, 'square', 0.05, 0.06); },
  error: () => tone(170, 0.16, 'sawtooth', 0.06),
  cluck: () => { tone(420, 0.05, 'square', 0.05); tone(380, 0.06, 'square', 0.05, 0.07); },
  crow: () => { tone(700, 0.12, 'sawtooth', 0.05, 0, 380); tone(650, 0.14, 'sawtooth', 0.05, 0.16, 350); },
  splash: () => { tone(300, 0.2, 'sine', 0.1, 0, 120); tone(900, 0.08, 'triangle', 0.04, 0.05); },
  golden: () => [784, 988, 1175, 1568].forEach((f, k) => tone(f, 0.18, 'triangle', 0.1, k * 0.07)),
  build: () => [196, 262, 330, 392, 523].forEach((f, k) => tone(f, 0.25, 'square', 0.05, k * 0.09)),
  spooky: () => [392, 370, 349, 330].forEach((f, k) => tone(f, 0.25, 'triangle', 0.08, k * 0.12)),
  level: () => [523, 659, 784, 1047].forEach((f, k) => tone(f, 0.2, 'triangle', 0.13, k * 0.11))
};

function sfx(name) {
  if (!state.sound || !audio) return;
  try { SOUNDS[name](); } catch { /* audio niedostępne */ }
}

function buzz(ms = 8) {
  if (navigator.vibrate) navigator.vibrate(ms);
}

/* ---------- UI helpers ---------- */

let toastTimer = null;

function toast(text) {
  const el = $('toast');
  el.textContent = text;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2400);
}

function floatText(x, y, text, cls = '') {
  const el = document.createElement('span');
  el.className = `float ${cls}`;
  el.textContent = text;
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  $('fx').appendChild(el);
  setTimeout(() => el.remove(), 1150);
}

function floatAt(el, text, cls, offset = 0) {
  if (!el || !el.isConnected) return;
  const r = el.getBoundingClientRect();
  floatText(r.left + r.width / 2, r.top + r.height / 2 - offset, text, cls);
}

function tilePoint(i) {
  if (farm3d) return farm3d.screenPos(i);
  const r = tileEls[i].getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

function floatAtTile(i, text, cls, offset = 0) {
  if (activeTab !== 'farm') return;
  const p = tilePoint(i);
  floatText(p.x, p.y - offset, text, cls);
}

function pulseTile(i) {
  if (farm3d) {
    farm3d.pulse(i);
    return;
  }
  const el = tileEls[i];
  el.classList.remove('pop');
  void el.offsetWidth;
  el.classList.add('pop');
}

function bumpCoins() {
  const el = document.querySelector('.hud-coins');
  el.classList.remove('bump');
  void el.offsetWidth;
  el.classList.add('bump');
}

const modalQueue = [];
let modalOpen = false;
let modalClose = null;

function showModal(opts) {
  modalQueue.push(opts);
  if (!modalOpen) nextModal();
}

function nextModal() {
  if (modalClose) {
    const fn = modalClose;
    modalClose = null;
    fn();
  }
  const opts = modalQueue.shift();
  if (!opts) {
    modalOpen = false;
    $('modal').classList.add('hidden');
    return;
  }
  modalOpen = true;
  const card = $('modalCard');
  card.className = `modal-card ${opts.cls || ''}`;
  card.innerHTML = `
    ${opts.hero ? `<div class="hero">${opts.hero}</div>` : ''}
    <h3>${opts.title}</h3>
    ${opts.body || ''}
    <div class="modal-actions"></div>`;
  const actions = card.querySelector('.modal-actions');
  const buttons = opts.buttons || [{ label: 'OK' }];
  buttons.forEach(b => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `btn ${b.cls || ''}`;
    btn.textContent = b.label;
    if (b.disabled) btn.disabled = true;
    btn.addEventListener('click', () => {
      unlockAudio();
      if (b.keepOpen) {
        b.onClick(card);
        return;
      }
      const fields = {};
      card.querySelectorAll('input, textarea').forEach(el => { fields[el.id] = el.value; });
      nextModal();
      if (b.onClick) b.onClick(fields);
    });
    actions.appendChild(btn);
  });
  modalClose = opts.onClose || null;
  if (opts.onOpen) opts.onOpen(card);
  $('modal').classList.remove('hidden');
}

/* ---------- Progression ---------- */

function bump(key, n = 1) {
  state.stats[key] = (state.stats[key] || 0) + n;
}

function statValue(key) {
  if (key === 'level') return state.level;
  if (key === 'days') return state.day;
  return state.stats[key] || 0;
}

function addCoins(n) {
  state.coins += n;
  if (n > 0) bump('earned', n);
  bumpCoins();
}

function addGold(n) {
  state.gold += n;
  bumpCoins();
}

function addItem(id, n) {
  state.inv[id] = inv(id) + n;
  if (state.inv[id] <= 0) delete state.inv[id];
}

function hasItems(items) {
  return Object.entries(items).every(([id, n]) => inv(id) >= n);
}

function takeItems(items) {
  Object.entries(items).forEach(([id, n]) => addItem(id, -n));
}

function addXp(n) {
  const gained = Math.max(n, Math.round(n * xpMult()));
  state.xp += gained;
  while (state.xp >= xpNeeded(state.level)) {
    state.xp -= xpNeeded(state.level);
    state.level++;
    onLevelUp(state.level);
  }
  return gained;
}

function addPoints(n) {
  const before = claimableMilestones();
  state.event.points += n;
  if (claimableMilestones() > before) {
    sfx('spooky');
    toast('🎃 Nowa nagroda Halloween czeka do odebrania!');
  }
}

function unlocksAt(level) {
  const list = [];
  Object.entries(CROPS).forEach(([id, c]) => { if (c.level === level) list.push(`${ITEMS[id].icon} Nasiona: ${ITEMS[id].name}`); });
  Object.values(ANIMALS).forEach(a => { if (a.level === level) list.push(`${a.icon} Zwierzę: ${a.name}`); });
  if (level === KITCHEN_LEVEL) list.push('🍳 Wiejska kuchnia');
  if (level === FISHING_LEVEL) list.push('🎣 Łowienie ryb w stawie');
  if (level === MERCHANT_LEVEL) list.push('🧳 Wędrowny kupiec');
  Object.entries(RECIPES).forEach(([id, r]) => { if (r.level === level) list.push(`${ITEMS[id].icon} Przepis: ${ITEMS[id].name}`); });
  Object.values(UPGRADES).forEach(u => { if (u.level === level) list.push(`${u.icon} Warsztat: ${u.name}`); });
  Object.values(HELPERS).forEach(h => { if (h.level === level) list.push(`${h.icon} Pomocnik: ${h.name}`); });
  Object.values(PROJECTS).forEach(p => { if (p.level === level) list.push(`${p.icon} Projekt wsi: ${p.name}`); });
  Object.values(TRIPS).forEach(t => { if (t.level === level) list.push(`${t.icon} Las: ${t.name}`); });
  Object.values(TREES).forEach(t => { if (t.level === level) list.push(`${t.icon} Sad: ${t.name}`); });
  Object.values(PROCESSORS).forEach(pr => { if (pr.level === level) list.push(`${pr.icon} Przetwórnia: ${pr.name}`); });
  if (level === HEATER.level) list.push('🔥 Grzejniki ogrodowe na zimę');
  return list;
}

function onLevelUp(level) {
  sfx('level');
  buzz(30);
  const bonus = 20 * level;
  addCoins(bonus);
  const gold = level % 5 === 0 ? 2 : 0;
  if (gold) addGold(gold);
  const unlocks = unlocksAt(level);
  showModal({
    hero: '🎉',
    title: `Poziom ${level}!`,
    body: `<p>Twoje gospodarstwo kwitnie. Premia: <b>🪙 ${bonus}</b>${gold ? ` i <b>🌟 ${gold}</b>` : ''}</p>` +
      (unlocks.length ? `<p><b>Nowości:</b></p><ul>${unlocks.map(u => `<li>${u}</li>`).join('')}</ul>` : ''),
    buttons: [{ label: 'Super!', cls: 'gold' }]
  });
}

/* ---------- Multipliers from upgrades, helpers and village ---------- */

const upg = id => state.upgrades[id] || 0;
const helperLvl = id => state.helpers[id] || 0;
const projectDone = id => !!(state.projects[id] && state.projects[id].done);

function seasonIndex() {
  return Math.floor((state.day - 1) / SEASON_DAYS) % 4;
}

function isWinter() {
  return seasonIndex() === 3;
}

function seasonMult(cropId, heated = false) {
  const s = seasonIndex();
  const fav = CROPS[cropId].seasons.includes(s);
  if (s === 3 && heated) return fav ? 1.4 : 1.1;
  if (fav) return 1.3;
  if (s === 3) return upg('greenhouse') ? 1 : 0.6;
  return 1;
}

function growthMult(t, heated = false) {
  return (t.w ? 1 : DRY_SPEED) * (hasDecor('lanterns') && isNight() ? 1.25 : 1) * (1 + 0.08 * upg('compost')) * seasonMult(t.crop, heated);
}

function treeMult(heated = false) {
  const s = seasonIndex();
  const season = s === 3 ? (heated ? 0.8 : 0) : s === 0 ? 1.25 : 1;
  return season * (1 + 0.08 * upg('compost'));
}

/* ---------- Heaters & frost ---------- */

let heatedTiles = new Set();

function heatersWarm() {
  return isWinter() && !state.heatCold;
}

function computeHeated() {
  heatedTiles = new Set();
  if (!heatersWarm()) return;
  const radius = upg('heaters') >= 1 ? 2 : 1;
  state.tiles.forEach((t, i) => {
    if (t.s !== 'heater') return;
    const r = Math.floor(i / COLS);
    const c = i % COLS;
    for (let dr = -radius; dr <= radius; dr++) {
      for (let dc = -radius; dc <= radius; dc++) {
        const rr = r + dr;
        const cc = c + dc;
        if (rr >= 0 && rr < ROWS && cc >= 0 && cc < COLS) heatedTiles.add(rr * COLS + cc);
      }
    }
  });
}

function burnFuel(dt) {
  const heaters = state.tiles.filter(t => t.s === 'heater').length;
  if (!heaters || !isWinter()) return;
  const per = HEATER.burn * 1000;
  state.heatFuel += dt * heaters * (upg('heaters') >= 2 ? 0.5 : 1);
  if (state.heatCold && inv('wood') > 0) state.heatCold = false;
  while (state.heatFuel >= per) {
    if (inv('wood') > 0) {
      addItem('wood', -1);
      state.heatFuel -= per;
    } else {
      if (!state.heatCold) toast('🔥 Grzejniki wygasły — skończyło się drewno 🪵!');
      state.heatCold = true;
      state.heatFuel = per;
      break;
    }
  }
}

function frostTonight() {
  return !!(state.frost && state.frost.day === state.day && !state.frost.hit);
}

function frostTick() {
  if (!frostTonight() || hourOfDay() < 22) return;
  state.frost.hit = true;
  let damaged = 0;
  let saved = 0;
  const fleece = state.fleece;
  state.tiles.forEach((t, i) => {
    if (t.s !== 'crop' || cropReady(t) || t.crop === 'cabbage') return;
    if (fleece || heatedTiles.has(i)) {
      saved++;
      return;
    }
    t.p = Math.max(0, t.p - cropTotal(t) * 0.3);
    t.frozen = true;
    damaged++;
  });
  state.fleece = false;
  bump('frostSaved', saved);
  sfx(damaged ? 'error' : 'golden');
  showModal({
    hero: '🥶',
    title: 'Przymrozek!',
    body: `<p>${damaged ? `Mróz ściął <b>${damaged}</b> ${damaged === 1 ? 'roślinę' : 'roślin'} — straciły 30% wzrostu.` : 'Żadna roślina nie zmarzła!'}</p>${saved ? `<p>${fleece ? '🧣 Agrowłóknina' : '🔥 Grzejniki'} uratowały: <b>${saved}</b>.</p>` : ''}<p class="meta">Kapusta lubi mróz i nic jej nie grozi.</p>`,
    buttons: [{ label: damaged ? 'Następnym razem się przygotuję' : 'Brawo!', cls: 'gold' }]
  });
  save();
}

function doubleChance() {
  return (hasDecor('scarecrow') ? 0.15 : 0) + 0.06 * upg('scythe');
}

function animalSpeed() {
  return (hasDecor('ghost') ? 1.2 : 1) * (1 + 0.1 * upg('pens'));
}

function animalMax(type) {
  return ANIMALS[type].max + upg('pens');
}

function kitchenSpeed() {
  return 1 + 0.15 * upg('oven');
}

function xpMult() {
  return projectDone('firehall') ? 1.2 : 1;
}

function orderSlots() {
  return projectDone('hall') ? 4 : 3;
}

function sellPrice(id) {
  const deal = state.deals.day === state.day ? state.deals.items[id] || 1 : 1;
  return Math.round(ITEMS[id].price * (hasDecor('goldpumpkin') ? 1.1 : 1) * (1 + 0.05 * upg('stall')) * deal);
}

function helperRate() {
  return state.coffee > 0 ? 2 : 1;
}

/* ---------- Land ---------- */

function landPrice() {
  return Math.round((30 * Math.pow(1.22, state.landBought)) / 5) * 5;
}

function canBuyTile(i) {
  if (state.tiles[i].s !== 'locked') return false;
  const r = Math.floor(i / COLS);
  const c = i % COLS;
  const near = [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]];
  return near.some(([rr, cc]) => rr >= 0 && rr < ROWS && cc >= 0 && cc < COLS && state.tiles[rr * COLS + cc].s !== 'locked');
}

function askBuyTile(i) {
  const price = landPrice();
  const deco = state.tiles[i].deco;
  const loot = DECO_LOOT[deco] || {};
  showModal({
    hero: deco,
    title: 'Wykarczować teren?',
    body: `<p>Koszt: <b>🪙 ${price}</b>. Przy karczowaniu zdobędziesz: <b>${rewardText(loot)}</b>.</p>`,
    buttons: [
      {
        label: `Karczuj za 🪙 ${price}`,
        cls: 'gold',
        onClick: () => {
          if (state.coins < price) {
            sfx('error');
            toast('Za mało monet. Sprzedaj plony w Stodole!');
            return;
          }
          addCoins(-price);
          state.landBought++;
          state.tiles[i] = { s: 'grass' };
          grant(loot);
          bump('cleared');
          addXp(2);
          sfx('plow');
          renderAll();
          pulseTile(i);
          floatAtTile(i, `-${price} 🪙`, 'minus');
          floatAtTile(i, rewardText(loot), '', 30);
          save();
        }
      },
      { label: 'Nie teraz', cls: 'ghost' }
    ]
  });
}

/* ---------- Field ---------- */

function cropInfo(id) {
  if (id === 'pumpkin' && halloweenActive()) return { ...CROPS.pumpkin, ...HALLOWEEN.pumpkin };
  return CROPS[id];
}

function cropTotal(t) {
  return t.T || CROPS[t.crop].time * 1000;
}

function cropReady(t) {
  return t.s === 'crop' && t.p >= cropTotal(t);
}

function isRaining() {
  return state.weather === 'rain' || state.weather === 'snow';
}

function isNight() {
  const h = hourOfDay();
  return h >= 21 || h < 5;
}

function tileAction(i) {
  const t = state.tiles[i];
  if (t.crow) return 'scare';
  switch (t.s) {
    case 'locked': return canBuyTile(i) ? 'buy' : null;
    case 'grass': return 'plow';
    case 'soil': return t.weed ? 'weed' : 'plant';
    case 'crop': return cropReady(t) ? 'harvest' : t.w ? 'info' : 'water';
    case 'tree': return treeReady(t) ? 'fruit' : 'treeinfo';
    case 'heater': return 'heaterinfo';
    default: return null;
  }
}

function waterPattern(i) {
  const r = Math.floor(i / COLS);
  const c = i % COLS;
  const lvl = upg('can');
  const offsets = lvl >= 2
    ? [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 0], [0, 1], [1, -1], [1, 0], [1, 1]]
    : lvl >= 1 ? [[0, 0], [-1, 0], [1, 0], [0, -1], [0, 1]] : [[0, 0]];
  return offsets
    .map(([dr, dc]) => [r + dr, c + dc])
    .filter(([rr, cc]) => rr >= 0 && rr < ROWS && cc >= 0 && cc < COLS)
    .map(([rr, cc]) => rr * COLS + cc);
}

function plantTile(i, cropId, quiet = false) {
  const crop = cropInfo(cropId);
  if (state.level < crop.level || state.coins < crop.cost) return false;
  addCoins(-crop.cost);
  let golden = Math.random() < GOLDEN_CHANCE;
  if (!quiet && (state.boosters.goldseed || 0) > 0 && state.goldNext) {
    golden = true;
    state.goldNext = false;
    state.boosters.goldseed--;
  }
  state.tiles[i] = { s: 'crop', crop: cropId, p: 0, T: crop.time * 1000, w: isRaining() || upg('can') >= 3, g: golden || undefined };
  bump('planted');
  return true;
}

function harvestTile(i, quiet = false) {
  const t = state.tiles[i];
  const crop = cropInfo(t.crop);
  const lucky = Math.random() < doubleChance();
  const amount = HARVEST_YIELD * (lucky ? 2 : 1) * (t.g ? 2 : 1);
  addItem(t.crop, amount);
  bump('harvested', amount);
  bump(`h_${t.crop}`, amount);
  const xp = addXp(crop.xp);
  if (!quiet) {
    floatAtTile(i, `+${amount} ${ITEMS[t.crop].icon}${lucky ? ' ✨' : ''}`, '', 8);
    floatAtTile(i, `+${xp} ⭐`, 'xp', -12);
  }
  if (t.g) {
    addGold(1);
    addCoins(ITEMS[t.crop].price * 3);
    bump('golden');
    if (!quiet) {
      sfx('golden');
      floatAtTile(i, `ZŁOTY PLON! +🌟1`, 'gold', 40);
      toast('✨ Złoty plon! Podwójne zbiory, monety i złoty kłos 🌟');
    }
  }
  if (t.crop === 'pumpkin' && halloweenActive()) {
    addPoints(HALLOWEEN.harvestPoints);
    if (!quiet) floatAtTile(i, `+${HALLOWEEN.harvestPoints} 👻`, 'spooky', 34);
  }
  state.tiles[i] = { s: 'soil' };
  return t.crop;
}

function doAction(i, action) {
  const t = state.tiles[i];
  switch (action) {
    case 'scare':
      delete t.crow;
      addCoins(2);
      addXp(1);
      bump('crows');
      floatAtTile(i, '🐦 Sio! +2 🪙');
      sfx('crow');
      break;
    case 'plow':
      state.tiles[i] = { s: 'soil' };
      sfx('plow');
      break;
    case 'plant': {
      if (TREES[state.seed]) return plantTree(i);
      if (state.seed === 'heater') return placeHeater(i);
      const crop = cropInfo(state.seed);
      if (state.level < crop.level) {
        toast(`Te nasiona odblokujesz na poziomie ${crop.level}.`);
        return false;
      }
      if (state.coins < crop.cost) {
        sfx('error');
        toast('Za mało monet na nasiona. Sprzedaj coś w Stodole!');
        return false;
      }
      plantTile(i, state.seed);
      floatAtTile(i, `-${crop.cost} 🪙`, 'minus');
      if (state.tiles[i].g) floatAtTile(i, '✨ złota sadzonka!', 'gold', 26);
      sfx('plant');
      break;
    }
    case 'water': {
      let n = 0;
      waterPattern(i).forEach(j => {
        const tj = state.tiles[j];
        if (tj.s === 'crop' && !tj.w && !cropReady(tj)) {
          tj.w = true;
          n++;
          if (j !== i) pulseTile(j);
        }
      });
      bump('watered', n);
      floatAtTile(i, n > 1 ? `💧×${n}` : '💧');
      sfx('water');
      break;
    }
    case 'harvest':
      harvestTile(i);
      sfx('harvest');
      buzz();
      break;
    case 'fruit':
      harvestTree(i);
      sfx('harvest');
      buzz();
      break;
    case 'weed':
      t.weed = false;
      addCoins(2);
      addXp(1);
      floatAtTile(i, '+2 🪙');
      sfx('plow');
      break;
    default:
      return false;
  }
  pulseTile(i);
  if (!farm3d) renderField();
  renderHud();
  return true;
}

function showCropInfo(i) {
  const t = state.tiles[i];
  const left = (cropTotal(t) - t.p) / 1000 / growthMult(t, heatedTiles.has(i));
  toast(`${t.g ? '✨ Złota ' : ''}${itemLabel(t.crop)} — gotowe za ok. ${fmtTime(left)}`);
}

/* ---------- Orchard & heaters on the field ---------- */

function treeReady(t) {
  return t.s === 'tree' && t.p >= t.T;
}

function seedCost(id) {
  if (TREES[id]) return TREES[id].cost.coins || 0;
  if (id === 'heater') return HEATER.cost.coins;
  return cropInfo(id).cost;
}

function plantTree(i) {
  const id = state.seed;
  const tr = TREES[id];
  if (state.level < tr.level) {
    toast(`${tr.name} — odblokujesz na poziomie ${tr.level}.`);
    return false;
  }
  if (!canAfford(tr.cost)) {
    sfx('error');
    toast(`Sadzonka kosztuje ${rewardText(tr.cost)}.`);
    return false;
  }
  pay(tr.cost);
  state.tiles[i] = { s: 'tree', tree: id, p: 0, T: tr.grow * 1000 };
  bump('trees');
  floatAtTile(i, `🌳 ${tr.name}!`, '', 10);
  sfx('plant');
  return true;
}

function placeHeater(i) {
  if (state.level < HEATER.level) {
    toast(`Grzejniki odblokujesz na poziomie ${HEATER.level}.`);
    return false;
  }
  if (!canAfford(HEATER.cost)) {
    sfx('error');
    toast(`Grzejnik kosztuje ${rewardText(HEATER.cost)}.`);
    return false;
  }
  pay(HEATER.cost);
  state.tiles[i] = { s: 'heater' };
  bump('heaters');
  computeHeated();
  sfx('build');
  toast(isWinter() ? '🔥 Grzejnik grzeje sąsiednie grządki (pali drewno 🪵).' : '🔥 Grzejnik zacznie grzać zimą — pali drewno 🪵.');
  return true;
}

function harvestTree(i, quiet = false) {
  const t = state.tiles[i];
  const tr = TREES[t.tree];
  const bees = state.animals.filter(a => a.type === 'bee').length >= 2;
  const lucky = Math.random() < doubleChance();
  const n = (tr.yield + (bees ? 1 : 0)) * (lucky ? 2 : 1);
  addItem(t.tree, n);
  bump('fruit', n);
  bump('harvested', n);
  const xp = addXp(tr.xp);
  t.p = 0;
  t.T = tr.regrow * 1000;
  t.fruited = true;
  if (!quiet) {
    floatAtTile(i, `+${n} ${tr.icon}${bees ? ' 🐝' : ''}${lucky ? ' ✨' : ''}`, '', 8);
    floatAtTile(i, `+${xp} ⭐`, 'xp', -12);
  }
  return t.tree;
}

function showTreeInfo(i) {
  const t = state.tiles[i];
  const tr = TREES[t.tree];
  const heated = heatedTiles.has(i);
  const mult = treeMult(heated);
  const status = mult === 0
    ? '❄️ Zimą drzewo śpi. Postaw obok grzejnik, a będzie owocować także zimą.'
    : `Owoce za ok. <b>${fmtTime((t.T - t.p) / 1000 / mult)}</b>${seasonIndex() === 0 ? ' (wiosną kwitnie i rośnie szybciej 🌸)' : ''}.`;
  showModal({
    hero: tr.icon,
    title: tr.name,
    body: `<p>${status}</p><p class="meta">Każdy zbiór: ${tr.icon} ×${tr.yield}${state.animals.filter(a => a.type === 'bee').length >= 2 ? ' +1 dzięki pszczołom 🐝' : ' (2 ule dają +1 owoc)'}.</p>`,
    buttons: [
      { label: 'OK', cls: 'gold' },
      {
        label: '🪓 Wytnij drzewo (+3 🪵)',
        cls: 'ghost',
        onClick: () => {
          state.tiles[i] = { s: 'soil' };
          addItem('wood', 3);
          sfx('plow');
          save();
          renderAll();
        }
      }
    ]
  });
}

function showHeaterInfo(i) {
  const warm = heatersWarm();
  const radius = upg('heaters') >= 1 ? '5×5' : '3×3';
  const burn = HEATER.burn * (upg('heaters') >= 2 ? 2 : 1);
  const status = !isWinter()
    ? 'Teraz odpoczywa — rozpali się sam, gdy przyjdzie zima.'
    : warm ? '🔥 Grzeje! Rośliny dookoła rosną zimą normalnie i nie boją się przymrozków.' : '🥶 Wygasł — brakuje drewna 🪵. Zdobądź je w lesie lub u kupca.';
  showModal({
    hero: warm ? '🔥' : '🧱',
    title: HEATER.name,
    body: `<p>${status}</p><p class="meta">Zasięg ${radius} · spala 1 🪵 co ${fmtTime(burn)} · masz ${inv('wood')} 🪵</p>`,
    buttons: [
      { label: 'OK', cls: 'gold' },
      {
        label: 'Rozbierz (+4 🪨)',
        cls: 'ghost',
        onClick: () => {
          state.tiles[i] = { s: 'soil' };
          addItem('stone', 4);
          computeHeated();
          save();
          renderAll();
        }
      }
    ]
  });
}

/* ---------- Crows ---------- */

function crowTick(dt) {
  state.crowTimer -= dt;
  if (state.crowTimer <= 0) {
    state.crowTimer = (50000 + Math.random() * 70000) * (hasDecor('scarecrow') ? 2 : 1);
    const targets = state.tiles.map((t, i) => ({ t, i })).filter(({ t }) => t.s === 'crop' && !cropReady(t) && !t.crow);
    if (targets.length && state.level >= 2) {
      const n = Math.min(targets.length, 1 + rand(2));
      for (let k = 0; k < n; k++) {
        const idx = rand(targets.length);
        targets.splice(idx, 1)[0].t.crow = CROW_LIFE;
      }
      sfx('crow');
      if (activeTab === 'farm') toast('🐦 Wrony na polu! Dotknij je, zanim wydziobią plony.');
    }
  }
  state.tiles.forEach((t, i) => {
    if (!t.crow) return;
    t.crow -= dt;
    if (upg('dog') && t.crow < CROW_LIFE - 3000) {
      delete t.crow;
      bump('crows');
      addCoins(1);
      floatAtTile(i, '🐕 Hau! +1 🪙');
      return;
    }
    if (t.crow <= 0) {
      delete t.crow;
      if (t.s === 'crop') {
        t.p = Math.max(0, t.p - cropTotal(t) * 0.25);
        floatAtTile(i, '🐦 -25% wzrostu', 'minus');
      }
    }
  });
}

/* ---------- Animals ---------- */

function animalPrice(type) {
  const owned = state.animals.filter(a => a.type === type).length;
  return Math.round(ANIMALS[type].cost * (1 + owned * 0.5));
}

function buyAnimal(type) {
  const a = ANIMALS[type];
  const owned = state.animals.filter(x => x.type === type).length;
  const price = animalPrice(type);
  if (state.level < a.level || owned >= animalMax(type)) return;
  if (state.coins < price) {
    sfx('error');
    toast('Za mało monet.');
    return;
  }
  addCoins(-price);
  state.animals.push({ type, s: 'hungry', p: 0 });
  bump('bought');
  bump(`bought_${type}`);
  sfx('cluck');
  toast(`${a.icon} Nowy mieszkaniec zagrody: ${a.name}!`);
  save();
}

function collectAnimal(animal) {
  const a = ANIMALS[animal.type];
  addItem(a.product, 1);
  bump('collected');
  animal.s = 'hungry';
  animal.p = 0;
  return addXp(a.xp);
}

function feedAnimal(animal) {
  const a = ANIMALS[animal.type];
  if (!hasItems(a.feed)) return false;
  takeItems(a.feed);
  animal.s = 'busy';
  animal.p = 0;
  return true;
}

function tapAnimal(idx, el, quiet = false) {
  const animal = state.animals[idx];
  if (!animal) return false;
  const a = ANIMALS[animal.type];
  if (animal.s === 'ready') {
    const xp = collectAnimal(animal);
    floatAt(el, `+1 ${ITEMS[a.product].icon}`, '', 8);
    floatAt(el, `+${xp} ⭐`, 'xp', -12);
    sfx('harvest');
    return true;
  }
  if (animal.s === 'hungry') {
    if (!feedAnimal(animal)) {
      if (!quiet) {
        sfx('error');
        const need = Object.entries(a.feed).map(([id, n]) => `${ITEMS[id].icon} ×${n}`).join(', ');
        toast(`${a.name} potrzebuje: ${need}. Wyhoduj to na polu!`);
      }
      return false;
    }
    floatAt(el, Object.keys(a.feed).map(id => ITEMS[id].icon).join(''));
    sfx('cluck');
    return true;
  }
  if (!quiet) toast(`${a.name}: ${ITEMS[a.product].name} za ${fmtTime((a.time * 1000 - animal.p) / 1000 / animalSpeed())}`);
  return false;
}

/* ---------- Kitchen & cauldron ---------- */

function recipeOut(id) {
  return projectDone('mill') && (id === 'bread' || id === 'popcorn') ? 2 : 1;
}

function recipeTime(id) {
  return (RECIPES[id].time * 1000) / kitchenSpeed();
}

function cook(id) {
  const r = RECIPES[id];
  const slot = state.kitchen.findIndex(s => s === null);
  if (state.level < r.level) return;
  if (slot < 0) {
    toast('Wszystkie palniki są zajęte.');
    return;
  }
  if (!hasItems(r.input)) {
    sfx('error');
    toast('Brakuje składników.');
    return;
  }
  takeItems(r.input);
  state.kitchen[slot] = { r: id, p: 0 };
  sfx('plant');
  toast(`Gotuje się: ${itemLabel(id)}`);
  save();
}

function collectSlot(idx) {
  const slot = state.kitchen[idx];
  const out = recipeOut(slot.r);
  addItem(slot.r, out);
  bump('cooked', out);
  bump(`c_${slot.r}`, out);
  state.kitchen[idx] = null;
  return { id: slot.r, out, xp: addXp(RECIPES[slot.r].xp) };
}

function speedUpCost(msLeft) {
  return Math.max(1, Math.ceil(msLeft / 180000));
}

function offerSpeedUp(label, msLeft, finish) {
  const cost = speedUpCost(msLeft);
  showModal({
    hero: '⚡',
    title: 'Przyspieszyć?',
    body: `<p>${label} — gotowe za ${fmtTime(msLeft / 1000)}.</p><p>Możesz dokończyć od razu za <b>🌟 ${cost}</b> (masz ${state.gold}).</p>`,
    buttons: [
      {
        label: `Przyspiesz za 🌟 ${cost}`,
        cls: 'gold',
        disabled: state.gold < cost,
        onClick: () => {
          state.gold -= cost;
          finish();
          sfx('golden');
          save();
          renderAll();
        }
      },
      { label: 'Poczekam', cls: 'ghost' }
    ]
  });
}

function tapSlot(idx, el) {
  const slot = state.kitchen[idx];
  if (!slot) return;
  const total = recipeTime(slot.r);
  if (slot.p >= total) {
    const res = collectSlot(idx);
    floatAt(el, `+${res.out} ${ITEMS[res.id].icon}`, '', 8);
    floatAt(el, `+${res.xp} ⭐`, 'xp', -12);
    sfx('harvest');
    save();
  } else {
    offerSpeedUp(itemLabel(slot.r), total - slot.p, () => { slot.p = total; });
  }
}

function buyKitchenSlot() {
  if (state.kitchen.length >= MAX_KITCHEN_SLOTS) return;
  if (state.coins < KITCHEN_SLOT_PRICE) {
    sfx('error');
    toast('Za mało monet.');
    return;
  }
  addCoins(-KITCHEN_SLOT_PRICE);
  state.kitchen.push(null);
  sfx('coin');
  save();
}

function brew(id) {
  const r = HALLOWEEN.recipes[id];
  const slot = state.event.cauldron.findIndex(s => s === null);
  if (!halloweenActive()) return;
  if (slot < 0) {
    toast('Kociołek jest pełny — poczekaj, aż coś się uwarzy.');
    return;
  }
  if (!hasItems(r.input)) {
    sfx('error');
    toast('Brakuje składników.');
    return;
  }
  takeItems(r.input);
  state.event.cauldron[slot] = { r: id, p: 0 };
  sfx('spooky');
  toast(`Bulgocze w kociołku: ${itemLabel(id)}`);
  save();
}

function tapCauldron(idx, el) {
  const slot = state.event.cauldron[idx];
  if (!slot) return;
  const r = HALLOWEEN.recipes[slot.r];
  const total = r.time * 1000;
  if (slot.p >= total) {
    addItem(slot.r, r.out);
    addXp(r.points);
    addPoints(r.points);
    bump('cooked', r.out);
    state.event.cauldron[idx] = null;
    floatAt(el, `+${r.out} ${ITEMS[slot.r].icon}`, '', 8);
    floatAt(el, `+${r.points} 👻`, 'spooky', -12);
    sfx('harvest');
    save();
  } else {
    offerSpeedUp(itemLabel(slot.r), total - slot.p, () => { slot.p = total; });
  }
}

function claimableMilestones() {
  return HALLOWEEN.milestones.filter((m, k) => state.event.points >= m.points && !state.event.claimed.includes(k)).length;
}

function claimMilestone(k) {
  const m = HALLOWEEN.milestones[k];
  if (!m || state.event.claimed.includes(k) || state.event.points < m.points) return;
  state.event.claimed.push(k);
  if (m.coins) addCoins(m.coins);
  if (m.decor && !hasDecor(m.decor)) state.decor.push(m.decor);
  sfx('level');
  buzz(30);
  showModal({
    hero: m.decor ? m.label.split(' ')[0] : '🎁',
    title: 'Nagroda Halloween!',
    body: `<p><b>${m.label}</b></p>${m.perk ? `<p>${m.perk} Ta ozdoba zostaje na zawsze — zobaczysz ją na polu!</p>` : ''}`,
    buttons: [{ label: 'Buuu-tiful!', cls: 'gold' }]
  });
  save();
}

/* ---------- Orders ---------- */

function canProduce(id) {
  if (CROPS[id]) return state.level >= cropInfo(id).level;
  const animal = Object.values(ANIMALS).find(a => a.product === id);
  if (animal) return state.animals.some(a => ANIMALS[a.type].product === id);
  if (id === 'fish') return state.level >= FISHING_LEVEL;
  if (id === 'mushroom') return state.level >= TRIPS.walk.level;
  const r = RECIPES[id];
  if (r) return state.level >= r.level && Object.keys(r.input).every(canProduce);
  const er = HALLOWEEN.recipes[id];
  if (er) return halloweenActive() && Object.keys(er.input).every(canProduce);
  if (TREES[id]) return state.tiles.some(t => t.s === 'tree' && t.tree === id);
  const proc = Object.entries(PROCESSORS).find(([, pr]) => pr.recipes[id]);
  if (proc) return !!state.processors[proc[0]] && Object.keys(proc[1].recipes[id].input).every(canProduce);
  return false;
}

function pickItems(pool, maxKinds, budget) {
  const count = 1 + rand(Math.min(maxKinds, pool.length));
  const items = {};
  let value = 0;
  for (let k = 0; k < count; k++) {
    const id = pick(pool);
    if (items[id]) continue;
    const price = ITEMS[id].price;
    const qty = Math.max(1, Math.min(8, Math.round((budget / price) * (0.6 + Math.random() * 0.8))));
    items[id] = qty;
    value += qty * price;
  }
  return { items, value };
}

function makeOrder() {
  const bonus = 1 + 0.1 * upg('cart');
  if (halloweenActive() && Math.random() < 0.4) {
    const pool = ['pumpkin', ...Object.keys(HALLOWEEN.recipes)].filter(canProduce);
    const { items, value } = pickItems(pool, 2, 60 + state.level * 10);
    const [face, name] = pick(HALLOWEEN.npcs);
    return {
      face,
      name,
      text: pick(HALLOWEEN.requests),
      items,
      coins: Math.round((value * 1.3 + 5) * bonus),
      xp: Math.max(2, Math.round(value / 8)),
      pts: Math.max(3, Math.round(value / 10)),
      ev: true
    };
  }
  const pool = Object.keys(ITEMS).filter(id => !HALLOWEEN.recipes[id] && !ITEMS[id].material && id !== 'mushroom' && id !== 'carp' && id !== 'crayfish' && canProduce(id));
  const { items, value } = pickItems(pool, 3, 18 + state.level * 8);
  const [face, name] = pick(NPCS);
  return {
    face,
    name,
    text: pick(REQUESTS),
    items,
    coins: Math.round((value * 1.4 + 5) * bonus),
    xp: Math.max(2, Math.round(value / 6)),
    nails: state.level >= 3 && Math.random() < 0.25 ? randInt(1, 3) : 0
  };
}

function npcOf(order) {
  return order.face ? [order.face, order.name] : NPCS[order.npc] || NPCS[0];
}

function deliverOrder(idx, el) {
  const order = state.orders[idx];
  if (!order || order.wait !== undefined || !hasItems(order.items)) return;
  takeItems(order.items);
  addCoins(order.coins);
  const xp = addXp(order.xp);
  if (order.pts) addPoints(order.pts);
  if (order.nails) addItem('nails', order.nails);
  bump('orders');
  state.orders[idx] = { wait: 15000, total: 15000 };
  floatAt(el, `+${order.coins} 🪙`, '', 10);
  floatAt(el, `+${xp} ⭐`, 'xp', -14);
  if (order.pts) floatAt(el, `+${order.pts} 👻`, 'spooky', 36);
  if (order.nails) floatAt(el, `+${order.nails} 🔩`, '', 36);
  sfx(order.ev ? 'spooky' : 'coin');
  buzz(15);
  toast(`${npcOf(order)[1]} dziękuje! ${order.ev ? '🎃' : '😊'}`);
  save();
}

function skipOrder(idx) {
  const order = state.orders[idx];
  if (!order || order.wait !== undefined) return;
  const [face, name] = npcOf(order);
  showModal({
    hero: face,
    title: 'Odrzucić zamówienie?',
    body: `<p>${name} pójdzie gdzie indziej. Nowy klient przyjdzie za chwilę.</p>`,
    buttons: [
      {
        label: 'Odrzuć',
        cls: 'red',
        onClick: () => {
          state.orders[idx] = { wait: 30000, total: 30000 };
          save();
          renderAll();
        }
      },
      { label: 'Zostaw', cls: 'ghost' }
    ]
  });
}

/* ---------- Barn & daily deals ---------- */

function ensureDeals() {
  if (state.deals.day === state.day) return;
  const pool = Object.keys(ITEMS).filter(id => !ITEMS[id].material && canProduce(id));
  const items = {};
  for (let k = 0; k < 3 && pool.length; k++) {
    const id = pool.splice(rand(pool.length), 1)[0];
    items[id] = k === 0 ? 2 : 1.5;
  }
  state.deals = { day: state.day, items };
}

function sellItem(id, n, el) {
  const qty = Math.min(n, inv(id));
  if (qty <= 0) return;
  const gain = qty * sellPrice(id);
  addItem(id, -qty);
  addCoins(gain);
  bump('sold', qty);
  floatAt(el, `+${gain} 🪙`);
  sfx('coin');
  save();
}

/* ---------- Processing plant ---------- */

function procSpeed() {
  return projectDone('mill') ? 1.25 : 1;
}

function procTime(pid, rid) {
  return (PROCESSORS[pid].recipes[rid].time * 1000) / procSpeed();
}

function buildProcessor(pid) {
  const pr = PROCESSORS[pid];
  if (state.processors[pid] || state.level < pr.level) return;
  if (!canAfford(pr.cost)) {
    sfx('error');
    toast('Brakuje materiałów lub monet. Zajrzyj do lasu i do kupca!');
    return;
  }
  pay(pr.cost);
  state.processors[pid] = { slots: Array(pr.slots).fill(null) };
  bump('upgrades');
  sfx('build');
  buzz(20);
  showModal({
    hero: pr.icon,
    title: `${pr.name} gotowa!`,
    body: `<p>${pr.text}</p>`,
    buttons: [{ label: 'Do pracy!', cls: 'gold' }]
  });
  save();
}

function startProcess(pid, rid) {
  const proc = state.processors[pid];
  const r = PROCESSORS[pid].recipes[rid];
  if (!proc) return;
  const k = proc.slots.findIndex(sl => sl === null);
  if (k < 0) {
    toast('Wszystkie stanowiska są zajęte.');
    return;
  }
  if (!hasItems(r.input)) {
    sfx('error');
    toast('Brakuje surowców.');
    return;
  }
  takeItems(r.input);
  proc.slots[k] = { r: rid, p: 0 };
  sfx('plant');
  save();
}

function collectProcess(pid, k) {
  const slot = state.processors[pid].slots[k];
  const r = PROCESSORS[pid].recipes[slot.r];
  if (r.booster) state.boosters[r.booster] = (state.boosters[r.booster] || 0) + r.out;
  else addItem(slot.r, r.out);
  bump('processed', r.out);
  bump(`p_${slot.r}`, r.out);
  state.processors[pid].slots[k] = null;
  return { id: slot.r, out: r.out, xp: addXp(r.xp), icon: r.booster ? BOOSTERS[r.booster].icon : ITEMS[slot.r].icon };
}

function tapProcess(pid, k, el) {
  const slot = state.processors[pid] && state.processors[pid].slots[k];
  if (!slot) return;
  const total = procTime(pid, slot.r);
  if (slot.p >= total) {
    const res = collectProcess(pid, k);
    floatAt(el, `+${res.out} ${res.icon}`, '', 8);
    floatAt(el, `+${res.xp} ⭐`, 'xp', -12);
    sfx('harvest');
    save();
  } else {
    const r = PROCESSORS[pid].recipes[slot.r];
    offerSpeedUp(r.booster ? BOOSTERS[r.booster].name : itemLabel(slot.r), total - slot.p, () => { slot.p = total; });
  }
}

function readyProcessSlots() {
  return Object.entries(state.processors).reduce((n, [pid, pr]) => n + pr.slots.filter(sl => sl && sl.p >= procTime(pid, sl.r)).length, 0);
}

/* ---------- Workshop: upgrades & helpers ---------- */

function buyUpgrade(id) {
  const u = UPGRADES[id];
  const lvl = upg(id);
  const next = u.levels[lvl];
  if (!next || state.level < u.level) return;
  if (!canAfford(next.cost)) {
    sfx('error');
    toast('Brakuje materiałów lub monet. Zajrzyj do lasu i do kupca!');
    return;
  }
  pay(next.cost);
  state.upgrades[id] = lvl + 1;
  bump('upgrades');
  sfx('build');
  buzz(20);
  showModal({
    hero: u.icon,
    title: `${u.name} — poziom ${lvl + 1}`,
    body: `<p>${next.text}</p>`,
    buttons: [{ label: 'Świetnie!', cls: 'gold' }]
  });
  save();
}

function hireHelper(id) {
  const h = HELPERS[id];
  const lvl = helperLvl(id);
  const next = h.levels[lvl];
  if (!next || state.level < h.level) return;
  if (!canAfford(next.cost)) {
    sfx('error');
    toast('Za mało monet lub złotych kłosów 🌟.');
    return;
  }
  pay(next.cost);
  state.helpers[id] = lvl + 1;
  if (lvl === 0) bump('helpers');
  bump('upgrades');
  sfx('build');
  showModal({
    hero: h.icon,
    title: lvl === 0 ? `${h.name} w zespole!` : `${h.name} — poziom ${lvl + 1}`,
    body: `<p>${next.text}</p><p>Pomocnicy pracują także wtedy, gdy gra jest zamknięta.</p>`,
    buttons: [{ label: 'Do roboty!', cls: 'gold' }]
  });
  save();
}

const helperTimers = {};
let helperTarget = -1;

function runHelpers(dt, quiet) {
  const rate = helperRate();
  const done = { harvested: 0, animals: 0, dishes: 0 };
  Object.entries(state.helpers).forEach(([id, lvl]) => {
    if (!lvl) return;
    const every = HELPERS[id].levels[lvl - 1].every * 1000;
    helperTimers[id] = (helperTimers[id] || 0) + dt * rate;
    let guard = 0;
    while (helperTimers[id] >= every && guard++ < 50) {
      helperTimers[id] -= every;
      if (id === 'jozek') done.harvested += jozekWork(lvl, quiet);
      if (id === 'basia') done.animals += basiaWork();
      if (id === 'mietek') done.dishes += mietekWork();
    }
    if (guard >= 50) helperTimers[id] = 0;
  });
  return done;
}

function jozekWork(lvl, quiet) {
  const ti = state.tiles.findIndex(treeReady);
  if (ti >= 0) {
    const fruit = harvestTree(ti, true);
    helperTarget = ti;
    if (!quiet) floatAtTile(ti, `👨‍🌾 +${ITEMS[fruit].icon}`);
    return 1;
  }
  const i = state.tiles.findIndex(cropReady);
  if (lvl >= 3) {
    const dry = state.tiles.find(t => t.s === 'crop' && !t.w && !cropReady(t));
    if (dry) dry.w = true;
  }
  if (i < 0) return 0;
  const crop = harvestTile(i, true);
  helperTarget = i;
  if (!quiet) floatAtTile(i, `👨‍🌾 +${ITEMS[crop].icon}`);
  if (lvl >= 2 && cropInfo(crop).level <= state.level) plantTile(i, crop, true);
  return 1;
}

function basiaWork() {
  const ready = state.animals.find(a => a.s === 'ready');
  if (ready) {
    collectAnimal(ready);
    return 1;
  }
  const hungry = state.animals.find(a => a.s === 'hungry' && hasItems(ANIMALS[a.type].feed));
  if (hungry) feedAnimal(hungry);
  return 0;
}

function mietekWork() {
  for (const [pid, pr] of Object.entries(state.processors)) {
    const k = pr.slots.findIndex(sl => sl && sl.p >= procTime(pid, sl.r));
    if (k < 0) continue;
    const { id } = collectProcess(pid, k);
    const r = PROCESSORS[pid].recipes[id];
    if (hasItems(r.input)) {
      takeItems(r.input);
      pr.slots[k] = { r: id, p: 0 };
    }
    return 1;
  }
  const idx = state.kitchen.findIndex(s => s && s.p >= recipeTime(s.r));
  if (idx < 0) return 0;
  const { id } = collectSlot(idx);
  if (hasItems(RECIPES[id].input)) {
    takeItems(RECIPES[id].input);
    state.kitchen[idx] = { r: id, p: 0 };
  }
  return 1;
}

/* ---------- Village projects ---------- */

function projectState(id) {
  if (!state.projects[id]) state.projects[id] = { donated: {}, done: false };
  return state.projects[id];
}

function donate(id, key) {
  const p = PROJECTS[id];
  const ps = projectState(id);
  if (ps.done || state.level < p.level) return;
  const need = p.needs[key] - (ps.donated[key] || 0);
  const give = Math.min(need, have(key));
  if (give <= 0) {
    sfx('error');
    toast(`Brakuje: ${keyIcon(key)}`);
    return;
  }
  pay({ [key]: give });
  ps.donated[key] = (ps.donated[key] || 0) + give;
  sfx('coin');
  if (Object.entries(p.needs).every(([k, n]) => (ps.donated[k] || 0) >= n)) {
    ps.done = true;
    addGold(p.gold);
    bump('projects');
    addXp(10 * p.level);
    sfx('build');
    buzz(40);
    showModal({
      hero: p.icon,
      title: `${p.name} gotowa!`,
      body: `<p>Cała wieś świętuje! Otrzymujesz <b>🌟 ${p.gold}</b>.</p><p><b>Bonus na zawsze:</b> ${p.perk}</p>`,
      buttons: [{ label: 'Hura!', cls: 'gold' }]
    });
    if (id === 'hall') while (state.orders.length < orderSlots()) state.orders.push(makeOrder());
  }
  save();
}

/* ---------- Forest trips ---------- */

function startTrip(id) {
  const t = TRIPS[id];
  if (state.trip || state.level < t.level) return;
  if (!canAfford(t.cost)) {
    sfx('error');
    toast('Brakuje prowiantu na wyprawę. Ugotuj go w Kuchni!');
    return;
  }
  pay(t.cost);
  state.trip = { id, left: t.time * 1000, total: t.time * 1000 };
  sfx('plant');
  toast(`${t.icon} Wyprawa wyruszyła do lasu!`);
  save();
}

function collectTrip() {
  const trip = state.trip;
  if (!trip) return;
  if (trip.left > 0) {
    offerSpeedUp(TRIPS[trip.id].name, trip.left, () => { trip.left = 0; });
    return;
  }
  const t = TRIPS[trip.id];
  const loot = {};
  Object.entries(t.loot).forEach(([key, [a, b]]) => {
    const n = randInt(a, b);
    if (n > 0) loot[key] = n;
  });
  if (Math.random() < t.goldChance) loot.gold = randInt(1, 2);
  grant(loot);
  bump('trips');
  state.trip = null;
  sfx('golden');
  showModal({
    hero: t.icon,
    title: 'Wyprawa wróciła!',
    body: `<p>Z lasu przyniesiono:</p><p class="loot">${rewardText(loot)}</p>`,
    buttons: [{ label: 'Super!', cls: 'gold' }]
  });
  save();
}

/* ---------- Merchant ---------- */

function ensureMerchant() {
  if (state.merchant.day === state.day) return;
  const pool = [...MERCHANT_POOL];
  const count = projectDone('bridge') ? 4 : 3;
  const discount = projectDone('bridge') ? 0.8 : 1;
  const offers = [];
  for (let k = 0; k < count && pool.length; k++) {
    const o = pool.splice(rand(pool.length), 1)[0];
    const price = {};
    Object.entries(o.price).forEach(([key, n]) => { price[key] = key === 'coins' ? Math.round(n * discount) : n; });
    offers.push({ ...o, price, bought: false });
  }
  state.merchant = { day: state.day, offers };
}

function buyOffer(k) {
  const o = state.merchant.offers[k];
  if (!o || o.bought || state.level < MERCHANT_LEVEL) return;
  if (!canAfford(o.price)) {
    sfx('error');
    toast('Za mało środków.');
    return;
  }
  pay(o.price);
  if (o.kind === 'booster') state.boosters[o.id] = (state.boosters[o.id] || 0) + o.qty;
  else if (o.kind === 'gold') addGold(o.qty);
  else addItem(o.id, o.qty);
  o.bought = true;
  sfx('coin');
  toast('🧳 Dziękuję za zakupy! Zapraszam jutro.');
  save();
}

/* ---------- Boosters ---------- */

function useBooster(id) {
  if (!(state.boosters[id] > 0)) return;
  if (id === 'goldseed') {
    if (state.goldNext) {
      toast('Złote nasiono już czeka na zasianie.');
      return;
    }
    state.goldNext = true;
    toast('🌟 Następna zasiana roślina będzie złota!');
    save();
    return;
  }
  state.boosters[id]--;
  if (id === 'fert') {
    state.tiles.forEach(t => {
      if (t.s === 'crop' && !cropReady(t)) t.p = Math.min(cropTotal(t), t.p + cropTotal(t) * 0.5);
    });
    toast('🧴 Rośliny wystrzeliły w górę!');
  } else if (id === 'rain') {
    state.tiles.forEach(t => { if (t.s === 'crop') t.w = true; });
    toast('🌧️ Całe pole podlane!');
  } else if (id === 'treat') {
    state.animals.forEach(a => { if (a.s === 'busy') a.s = 'ready'; });
    toast('🦴 Zwierzęta zadowolone — produkty gotowe!');
  } else if (id === 'coffee') {
    state.coffee = 10 * 60 * 1000;
    toast('☕ Pomocnicy pracują dwa razy szybciej!');
  } else if (id === 'fleece') {
    state.fleece = true;
    toast('🧣 Pole przykryte agrowłókniną — następny przymrozek nie zaszkodzi.');
  }
  sfx('golden');
  save();
  renderAll();
}

function showBackpack() {
  const rows = Object.entries(BOOSTERS).map(([id, b]) => {
    const n = state.boosters[id] || 0;
    return `<div class="pack-row"><span class="big-icon">${b.icon}</span><div class="grow"><b>${b.name} ×${n}</b><p class="meta">${b.text}</p></div>
      <button class="btn small" type="button" data-booster="${id}" ${n > 0 ? '' : 'disabled'}>Użyj</button></div>`;
  }).join('');
  showModal({
    hero: '🎒',
    title: 'Plecak',
    body: `<div class="pack">${rows}</div><p class="meta">Wzmacniacze kupisz u wędrownego kupca.</p>`,
    buttons: [{ label: 'Zamknij', cls: 'ghost' }],
    onOpen: card => {
      card.querySelectorAll('[data-booster]').forEach(btn => btn.addEventListener('click', () => {
        nextModal();
        useBooster(btn.dataset.booster);
      }));
    }
  });
}

/* ---------- Fishing ---------- */

function openFishing() {
  if (state.level < FISHING_LEVEL) {
    toast(`🎣 Łowienie ryb odblokujesz na poziomie ${FISHING_LEVEL}.`);
    return;
  }
  if (state.fishCd > 0) {
    toast(`🎣 Ryby się płoszą… spróbuj za ${fmtTime(state.fishCd / 1000)}.`);
    return;
  }
  const total = FISH_TABLE.reduce((s, f) => s + f.weight, 0);
  let roll = Math.random() * total;
  const catchItem = FISH_TABLE.find(f => (roll -= f.weight) < 0) || FISH_TABLE[0];
  const zone = 0.16 + 0.06 * upg('rod');
  const center = 0.25 + Math.random() * 0.5;
  let raf = 0;
  let pos = 0;
  let done = false;
  const start = performance.now();

  const finish = card => {
    if (done) return;
    done = true;
    cancelAnimationFrame(raf);
    const dist = Math.abs(pos - center);
    const hit = dist <= zone / 2;
    const perfect = dist <= zone / 6;
    const result = card.querySelector('.fish-result');
    const strike = card.querySelector('#strikeBtn');
    if (strike) strike.disabled = true;
    const closeBtn = card.querySelector('.modal-actions .btn');
    if (closeBtn) closeBtn.textContent = hit ? 'Super!' : 'Zamknij';
    if (!hit) {
      state.fishCd = 5000;
      sfx('error');
      result.innerHTML = '💨 Ryba zerwała się z haczyka! Spróbuj za chwilę.';
      return;
    }
    state.fishCd = (30 - 7 * upg('rod')) * 1000;
    sfx('splash');
    let text = '';
    if (catchItem.id === 'boot') {
      addCoins(3);
      text = '🥾 Stary but… W środku było 🪙 3!';
    } else if (catchItem.id === 'chest') {
      const loot = { nails: randInt(2, 4), wood: randInt(2, 5) };
      grant(loot);
      text = `📦 Skrzynka z dna! ${rewardText(loot)}`;
    } else if (catchItem.id === 'ring') {
      addGold(2);
      text = '💍 Złoty pierścionek! Sprzedajesz go za 🌟 2.';
    } else {
      const n = perfect ? 2 : 1;
      addItem(catchItem.id, n);
      text = `${ITEMS[catchItem.id].icon} ${ITEMS[catchItem.id].name} ×${n}${perfect ? ' — idealne zacięcie!' : ''}`;
    }
    bump('fish');
    addXp(3);
    result.innerHTML = `<b>${text}</b>`;
    save();
  };

  showModal({
    hero: '🎣',
    title: 'Łowienie ryb',
    cls: 'fishing',
    body: `<p>Gdy spławik będzie w zielonej strefie — zatnij!</p>
      <div class="fish-track"><span class="fish-zone" style="left:${(center - zone / 2) * 100}%;width:${zone * 100}%"></span><span class="fish-bobber"></span></div>
      <p class="fish-result">Coś skubie…</p>
      <button class="btn gold big" id="strikeBtn" type="button">Zatnij!</button>`,
    buttons: [{ label: 'Zwiń wędkę', cls: 'ghost' }],
    onOpen: card => {
      const bobber = card.querySelector('.fish-bobber');
      const loop = now => {
        const t = (now - start) / 1000;
        pos = 0.5 + 0.47 * Math.sin(t * 2.4 * catchItem.speed + Math.sin(t * 1.3) * 0.9);
        bobber.style.left = `${pos * 100}%`;
        if (t > 9) finish(card);
        else raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
      card.querySelector('#strikeBtn').addEventListener('click', () => finish(card));
    },
    onClose: () => {
      done = true;
      cancelAnimationFrame(raf);
      renderAll();
    }
  });
}

/* ---------- Quests ---------- */

function currentQuest() {
  return QUESTS[state.quest.idx] || null;
}

function questProgress(q = currentQuest()) {
  if (!q) return { n: 0, of: 0, done: false };
  const of = q.goal.level || q.goal.n;
  const n = q.goal.level ? state.level : statValue(q.goal.stat) - state.quest.base;
  return { n: Math.min(of, Math.max(0, n)), of, done: n >= of };
}

function startQuest(idx) {
  const q = QUESTS[idx];
  state.quest = { idx, base: q && q.goal.stat ? statValue(q.goal.stat) : 0 };
}

function showQuest() {
  const q = currentQuest();
  if (!q) {
    showModal({ hero: '📜', title: 'Kronika ukończona!', body: '<p>Wszystkie zadania wykonane. Jesteś prawdziwym gospodarzem!</p>' });
    return;
  }
  const pr = questProgress(q);
  showModal({
    hero: '🧔',
    title: q.title,
    body: `<p class="quest-text">„${q.text}”</p><p>Postęp: <b>${pr.n}/${pr.of}</b></p><p>Nagroda: <b>${rewardText(q.reward)}</b></p>`,
    buttons: pr.done
      ? [{ label: 'Odbierz nagrodę', cls: 'gold', onClick: claimQuest }]
      : [{ label: 'Zrobi się!', cls: 'ghost' }]
  });
}

function claimQuest() {
  const q = currentQuest();
  if (!q || !questProgress(q).done) return;
  grant(q.reward);
  bump('quests');
  sfx('level');
  toast(`📜 Zadanie „${q.title}” wykonane! ${rewardText(q.reward)}`);
  startQuest(state.quest.idx + 1);
  save();
  renderAll();
}

/* ---------- Achievements ---------- */

function achInfo(a) {
  const claimed = state.ach[a.id] || 0;
  const target = a.tiers[claimed];
  const value = statValue(a.stat);
  return { claimed, target, value, ready: target !== undefined && value >= target };
}

function claimableAchievements() {
  return ACHIEVEMENTS.filter(a => achInfo(a).ready).length;
}

function claimAchievement(id) {
  const a = ACHIEVEMENTS.find(x => x.id === id);
  const info = achInfo(a);
  if (!info.ready) return;
  const reward = ACHIEVEMENT_REWARDS[info.claimed];
  grant(reward);
  state.ach[id] = info.claimed + 1;
  sfx('golden');
  showModal({
    hero: ['🥉', '🥈', '🥇'][info.claimed],
    title: `${a.name}!`,
    body: `<p>${a.icon} ${info.target} ${a.unit}.</p><p>Nagroda: <b>${rewardText(reward)}</b></p>`,
    buttons: [{ label: 'Brawo!', cls: 'gold' }]
  });
  save();
}

/* ---------- Daily reward ---------- */

function checkDaily() {
  const today = localDay();
  if (state.daily.last === today || state.daily.pending === today) return;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const streak = state.daily.last === localDay(yesterday) ? state.daily.streak + 1 : 1;
  const idx = (streak - 1) % DAILY_REWARDS.length;
  const mult = projectDone('shrine') ? 2 : 1;
  const coins = DAILY_REWARDS[idx] * mult;
  const gold = idx === DAILY_REWARDS.length - 1 ? 2 * mult : 0;
  const candy = halloweenActive() ? 2 + idx : 0;
  state.daily.pending = today;
  const days = DAILY_REWARDS.map((c, k) =>
    `<span class="day-cell${k < idx ? ' done' : ''}${k === idx ? ' today' : ''}"><small>Dzień ${k + 1}</small>${k === DAILY_REWARDS.length - 1 ? '🎁' : '🪙'}<b>${c * mult}</b></span>`).join('');
  showModal({
    hero: '🎁',
    title: 'Codzienna nagroda',
    body: `<p>Wracaj codziennie — im dłuższa seria, tym lepsza nagroda!${mult > 1 ? ' Kapliczka podwaja nagrody ⛪.' : ''}</p><div class="daily-row">${days}</div>${candy ? `<p>🎃 Bonus Halloween: <b>🍬 ${candy} cukierków</b></p>` : ''}`,
    buttons: [{
      label: `Odbierz 🪙 ${coins}${gold ? ` + 🌟 ${gold}` : ''}${candy ? ` + 🍬 ${candy}` : ''}`,
      cls: 'gold',
      onClick: () => {
        state.daily = { last: today, streak };
        addCoins(coins);
        if (gold) addGold(gold);
        if (candy) addItem('candy', candy);
        sfx('coin');
        save();
        renderAll();
      }
    }]
  });
}

/* ---------- Simulation ---------- */

function advanceWorld(dt) {
  const events = { crops: 0, animals: 0, kitchen: 0 };
  const raining = isRaining();
  burnFuel(dt);
  computeHeated();
  state.tiles.forEach((t, i) => {
    if (t.s === 'tree') {
      if (t.p < t.T) {
        t.p = Math.min(t.T, t.p + dt * treeMult(heatedTiles.has(i)));
        if (t.p >= t.T) events.crops++;
      }
      return;
    }
    if (t.s !== 'crop') return;
    if (raining) t.w = true;
    const total = cropTotal(t);
    if (t.p >= total) return;
    t.p = Math.min(total, t.p + dt * growthMult(t, heatedTiles.has(i)));
    if (t.p >= total) events.crops++;
  });
  Object.values(state.processors).forEach(pr => pr.slots.forEach(slot => {
    if (slot) slot.p += dt;
  }));
  const aSpeed = animalSpeed();
  state.animals.forEach(animal => {
    if (animal.s !== 'busy') return;
    animal.p += dt * aSpeed;
    if (animal.p >= ANIMALS[animal.type].time * 1000) {
      animal.s = 'ready';
      events.animals++;
    }
  });
  state.kitchen.forEach(slot => {
    if (!slot) return;
    const total = recipeTime(slot.r);
    if (slot.p >= total) return;
    slot.p = Math.min(total, slot.p + dt);
    if (slot.p >= total) events.kitchen++;
  });
  state.event.cauldron.forEach(slot => {
    if (!slot) return;
    const total = HALLOWEEN.recipes[slot.r].time * 1000;
    if (slot.p >= total) return;
    slot.p = Math.min(total, slot.p + dt);
    if (slot.p >= total) events.kitchen++;
  });
  state.orders.forEach((order, idx) => {
    if (order.wait === undefined) return;
    order.wait -= dt;
    if (order.wait <= 0) state.orders[idx] = makeOrder();
  });
  while (state.orders.length < orderSlots()) state.orders.push(makeOrder());
  if (state.trip && state.trip.left > 0) state.trip.left = Math.max(0, state.trip.left - dt);
  if (state.coffee > 0) state.coffee = Math.max(0, state.coffee - dt);
  if (state.fishCd > 0) state.fishCd = Math.max(0, state.fishCd - dt);
  return events;
}

function simulate(ms) {
  const total = { crops: 0, animals: 0, kitchen: 0, harvested: 0, collected: 0, dishes: 0 };
  let left = ms;
  while (left > 0) {
    const step = Math.min(left, 2000);
    const ev = advanceWorld(step);
    const hw = runHelpers(step, true);
    total.crops += ev.crops;
    total.animals += ev.animals;
    total.kitchen += ev.kitchen;
    total.harvested += hw.harvested;
    total.collected += hw.animals;
    total.dishes += hw.dishes;
    left -= step;
  }
  return total;
}

function advanceClock(dt) {
  state.dayTime += dt;
  while (state.dayTime >= DAY_LENGTH) {
    state.dayTime -= DAY_LENGTH;
    newDay();
  }
}

function newDay() {
  state.day++;
  const season = seasonIndex();
  const roll = Math.random();
  state.weather = roll < 0.22 ? (season === 3 ? 'snow' : 'rain') : roll < 0.45 ? 'cloudy' : 'sunny';
  let weeds = 0;
  state.tiles.forEach(t => {
    if (season !== 3 && t.s === 'soil' && !t.weed && Math.random() < 0.15) {
      t.weed = true;
      weeds++;
    }
    if (projectDone('well') && t.s === 'crop') t.w = true;
    delete t.frozen;
  });
  if (season === 3 && Math.random() < 0.45) {
    state.frost = { day: state.day, hit: false };
    setTimeout(() => toast('❄️ Prognoza: dziś w nocy przymrozek! Rozpal grzejniki 🔥 albo przykryj pole 🧣.'), 2600);
  }
  ensureDeals();
  ensureMerchant();
  if (season !== state.seasonSeen) {
    state.seasonSeen = season;
    const s = SEASONS[season];
    const fav = Object.keys(CROPS).filter(id => CROPS[id].seasons.includes(season) && state.level >= CROPS[id].level).map(id => ITEMS[id].icon).join(' ');
    showModal({
      hero: s.icon,
      title: `Nadeszła ${s.name}!`,
      body: `<p>${season === 3 ? `Zimą rośliny rosną wolniej${upg('greenhouse') ? ', ale Twoja szklarnia temu zaradzi' : ' — chyba że masz szklarnię'}. Kapusta lubi mróz!` : 'Nowa pora roku, nowe możliwości.'}</p>${fav ? `<p>Teraz najszybciej rosną: <b>${fav}</b> (+30%).</p>` : ''}`,
      buttons: [{ label: 'Do pracy!', cls: 'gold' }]
    });
    return;
  }
  const weatherText = { rain: '🌧️ Pada deszcz — rośliny same się podlewają!', snow: '🌨️ Pada śnieg.', cloudy: '⛅ Pochmurno.', sunny: '☀️ Słoneczny dzień.' }[state.weather];
  toast(`Dzień ${state.day}. ${weatherText}${weeds ? ' Wyrosły chwasty.' : ''}`);
}

function hourOfDay() {
  return (6 + (state.dayTime / DAY_LENGTH) * 24) % 24;
}

/* ---------- Rendering: HUD & 2D sky ---------- */

function weatherIcon() {
  if (state.weather === 'rain') return '🌧️';
  if (state.weather === 'snow') return '🌨️';
  if (state.weather === 'cloudy') return '⛅';
  return isNight() ? '🌙' : '☀️';
}

function renderHud() {
  $('coins').textContent = state.coins.toLocaleString('pl-PL');
  $('gold').textContent = state.gold;
  $('level').textContent = state.level;
  $('xpFill').style.width = `${Math.min(100, (state.xp / xpNeeded(state.level)) * 100)}%`;
  const s = SEASONS[seasonIndex()];
  $('dayNum').textContent = `${s.icon} Dzień ${state.day}`;
  const h = hourOfDay();
  const minutes = Math.floor(((h % 1) * 60) / 10) * 10;
  $('clock').textContent = `${String(Math.floor(h)).padStart(2, '0')}:${String(minutes).padStart(2, '0')} · ${s.name}`;
  $('weatherIcon').textContent = weatherIcon();

  const readyAnimals = state.animals.filter(a => a.s === 'ready').length;
  const readyKitchen = state.kitchen.filter(s2 => s2 && s2.p >= recipeTime(s2.r)).length;
  const readyOrders = state.orders.filter(o => o.wait === undefined && hasItems(o.items)).length;
  $('badge-animals').textContent = readyAnimals || '';
  $('badge-kitchen').textContent = readyKitchen + readyProcessSlots() || '';
  $('badge-orders').textContent = readyOrders || '';
  $('badge-more').textContent = moreBadges().total || '';

  const event = halloweenActive();
  document.body.classList.toggle('halloween', event);
  $('eventPill').classList.toggle('hidden', !event);
  if (event) $('eventPillPts').textContent = state.event.points;
  $('fishBtn').classList.toggle('dim', state.level < FISHING_LEVEL || state.fishCd > 0);
  const packCount = Object.values(state.boosters).reduce((a, b) => a + b, 0);
  $('packCount').textContent = packCount || '';
  $('coffeeBadge').classList.toggle('hidden', !(state.coffee > 0));
}

function moreBadges() {
  const cauldron = state.event.cauldron.filter(s => s && s.p >= HALLOWEEN.recipes[s.r].time * 1000).length;
  const b = {
    workshop: Object.entries(UPGRADES).filter(([id, u]) => state.level >= u.level && u.levels[upg(id)] && canAfford(u.levels[upg(id)].cost)).length +
      Object.entries(HELPERS).filter(([id, h]) => state.level >= h.level && h.levels[helperLvl(id)] && canAfford(h.levels[helperLvl(id)].cost)).length,
    village: (state.trip && state.trip.left <= 0 ? 1 : 0) + Object.entries(PROJECTS).filter(([id, p]) => state.level >= p.level && !projectDone(id) &&
      Object.entries(p.needs).some(([k, n]) => (projectState(id).donated[k] || 0) < n && have(k) > 0)).length,
    trophies: claimableAchievements() + (questProgress().done ? 1 : 0),
    merchant: state.level >= MERCHANT_LEVEL && state.merchant.day === state.day && state.merchant.offers.some(o => !o.bought && canAfford(o.price)) ? 1 : 0,
    event: halloweenActive() ? claimableMilestones() + cauldron : 0
  };
  b.total = (b.trophies > 0) + (b.village > 0) + b.event;
  return b;
}

const SKY = [
  [0, '#0b1d3a', '#22356a'],
  [4.5, '#1d2f5c', '#3a3f74'],
  [6, '#f19c79', '#ffd6a5'],
  [8, '#7ec8f2', '#d9f1ff'],
  [17, '#6cb6ea', '#cfeaff'],
  [19.5, '#f08a5d', '#ffcf8b'],
  [21, '#2b2f63', '#5a4a7a'],
  [22.5, '#0b1d3a', '#22356a'],
  [24, '#0b1d3a', '#22356a']
];

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function mix(a, b, f) {
  return a.map((v, k) => Math.round(v + (b[k] - v) * f));
}

function skyColors(h) {
  let k = 0;
  while (k < SKY.length - 2 && SKY[k + 1][0] <= h) k++;
  const [h0, a0, b0] = SKY[k];
  const [h1, a1, b1] = SKY[k + 1];
  const f = (h - h0) / (h1 - h0);
  return [mix(hexToRgb(a0), hexToRgb(a1), f), mix(hexToRgb(b0), hexToRgb(b1), f)];
}

function darkness(h) {
  if (h >= 7 && h < 19) return 0;
  if (h >= 19 && h < 22) return ((h - 19) / 3) * 0.38;
  if (h >= 5 && h < 7) return ((7 - h) / 2) * 0.38;
  return 0.38;
}

function renderSky() {
  const h = hourOfDay();
  const sky = $('sky');
  const gray = isRaining() ? 0.5 : state.weather === 'cloudy' ? 0.28 : 0;
  const [c1, c2] = skyColors(h).map(c => `rgb(${mix(c, [130, 140, 150], gray).join(',')})`);
  sky.style.setProperty('--sky1', c1);
  sky.style.setProperty('--sky2', c2);
  sky.classList.toggle('overcast', state.weather !== 'sunny');

  const sun = $('sun');
  const isDay = h >= 5 && h < 21;
  const p = isDay ? (h - 5) / 16 : ((h - 21 + 24) % 24) / 8;
  sun.textContent = isDay ? '☀️' : '🌙';
  sun.classList.toggle('moon', !isDay);
  sun.style.left = `${8 + p * 84}%`;
  sun.style.top = `${75 - Math.sin(Math.PI * p) * 55}%`;
  sun.style.opacity = isRaining() ? 0.35 : 1;

  $('nightShade').style.opacity = darkness(h);
  $('view-farm').classList.toggle('raining', isRaining());
}

/* ---------- Rendering: field (3D or 2D) ---------- */

let farm3d = null;
const tileEls = [];
const tileSigs = [];

function tileInfo(i) {
  const t = state.tiles[i];
  const info = {
    s: t.s, deco: t.deco, buyable: false, price: 0, crop: t.crop, f: 0, ready: false, wet: !!t.w, weed: !!t.weed, crow: !!t.crow, golden: !!t.g,
    tree: t.tree, heated: heatedTiles.has(i), frozen: !!t.frozen
  };
  if (t.s === 'locked') {
    info.buyable = canBuyTile(i);
    info.price = info.buyable ? landPrice() : 0;
  } else if (t.s === 'crop') {
    info.f = Math.min(1, t.p / cropTotal(t));
    info.ready = info.f >= 1;
  } else if (t.s === 'tree') {
    info.f = Math.min(1, t.p / t.T);
    info.ready = info.f >= 1;
    info.dormant = isWinter() && !info.heated;
    info.blossom = seasonIndex() === 0 && !info.ready;
    info.young = !t.fruited;
  } else if (t.s === 'heater') {
    info.active = heatersWarm();
  }
  return info;
}

function buildField() {
  const field = $('field');
  field.innerHTML = '';
  for (let i = 0; i < COLS * ROWS; i++) {
    const el = document.createElement('div');
    el.dataset.i = i;
    field.appendChild(el);
    tileEls[i] = el;
    tileSigs[i] = '';
  }
}

function tileView(i) {
  const t = state.tiles[i];
  const crow = t.crow ? '<span class="crow">🐦</span>' : '';
  if (t.s === 'locked') {
    const buyable = canBuyTile(i);
    return {
      cls: `tile t-locked${buyable ? ' buyable' : ''}`,
      html: `<span class="deco">${t.deco}</span>${buyable ? `<span class="price">🪙${landPrice()}</span>` : ''}`
    };
  }
  if (t.s === 'grass') return { cls: 'tile t-grass', html: '' };
  if (t.s === 'soil') return { cls: 'tile t-soil', html: t.weed ? '<span class="plant weed">🌿</span>' : '' };
  if (t.s === 'heater') return { cls: `tile t-soil${heatersWarm() ? ' heater-on' : ''}`, html: `<span class="plant">${heatersWarm() ? '🔥' : '🧱'}</span>` };
  if (t.s === 'tree') {
    const ready = treeReady(t);
    return {
      cls: `tile t-grass${ready ? ' ready' : ''}${heatedTiles.has(i) ? ' heated' : ''}`,
      html: `<span class="plant">${ready ? TREES[t.tree].icon : isWinter() && !heatedTiles.has(i) ? '🪵' : '🌳'}</span>${ready ? '' : '<span class="pbar"><i></i></span>'}`
    };
  }
  const ready = cropReady(t);
  const stage = ready ? 2 : t.p / cropTotal(t) < 0.5 ? 0 : 1;
  const icon = stage === 0 ? '🌱' : ITEMS[t.crop].icon;
  return {
    cls: `tile t-soil stage${stage}${t.w ? ' wet' : ''}${ready ? ' ready' : ''}${t.g ? ' golden' : ''}${heatedTiles.has(i) ? ' heated' : ''}${t.frozen ? ' frozen' : ''}`,
    html: `<span class="plant">${icon}</span>${!t.w && !ready ? '<span class="drop">💧</span>' : ''}${ready ? '' : '<span class="pbar"><i></i></span>'}${crow}`
  };
}

function renderTile(i) {
  const el = tileEls[i];
  const view = tileView(i);
  const sig = view.cls + view.html;
  if (tileSigs[i] !== sig) {
    tileSigs[i] = sig;
    const popping = el.classList.contains('pop');
    el.className = view.cls + (popping ? ' pop' : '');
    el.innerHTML = view.html;
  }
  const t = state.tiles[i];
  const bar = el.querySelector('.pbar i');
  if (bar && t.s === 'crop') bar.style.width = `${(t.p / cropTotal(t)) * 100}%`;
  if (bar && t.s === 'tree') bar.style.width = `${(t.p / t.T) * 100}%`;
}

function renderField() {
  for (let i = 0; i < tileEls.length; i++) renderTile(i);
}

function renderSeedbar() {
  const event = halloweenActive();
  const season = seasonIndex();
  const html = Object.keys(CROPS).map(id => {
    const c = cropInfo(id);
    const locked = state.level < c.level;
    const special = event && id === 'pumpkin';
    const fav = CROPS[id].seasons.includes(season);
    const cls = `seed${locked ? ' locked' : ''}${state.seed === id ? ' selected' : ''}${special ? ' event' : ''}`;
    return `<button class="${cls}" type="button" data-seed="${id}" role="option" aria-selected="${state.seed === id}">
      ${special ? '<em class="seed-tag">Halloween</em>' : fav && !locked ? `<em class="seed-tag fav">${SEASONS[season].icon} +30%</em>` : ''}
      <span class="icon">${ITEMS[id].icon}</span>
      <span class="cost">${locked ? `🔒 ${c.level}` : `🪙${c.cost}`}</span>
      <span class="time">${fmtTime(c.time)}</span>
    </button>`;
  }).join('');
  const trees = Object.entries(TREES).map(([id, tr]) => {
    const locked = state.level < tr.level;
    return `<button class="seed tree${locked ? ' locked' : ''}${state.seed === id ? ' selected' : ''}" type="button" data-seed="${id}" role="option" aria-selected="${state.seed === id}">
      <em class="seed-tag tree-tag">Sad</em>
      <span class="icon">${tr.icon}</span>
      <span class="cost">${locked ? `🔒 ${tr.level}` : `🪙${tr.cost.coins}${tr.cost.wood ? `+🪵${tr.cost.wood}` : ''}`}</span>
      <span class="time">co ${fmtTime(tr.regrow)}</span>
    </button>`;
  }).join('');
  const heaterLocked = state.level < HEATER.level;
  const heater = `<button class="seed heater${heaterLocked ? ' locked' : ''}${state.seed === 'heater' ? ' selected' : ''}${isWinter() ? ' hot' : ''}" type="button" data-seed="heater" role="option" aria-selected="${state.seed === 'heater'}">
      <em class="seed-tag heat-tag">Zima</em>
      <span class="icon">${HEATER.icon}</span>
      <span class="cost">${heaterLocked ? `🔒 ${HEATER.level}` : `🪙${HEATER.cost.coins}`}</span>
      <span class="time">grzejnik</span>
    </button>`;
  patch($('seedbar'), `${html}<span class="seed-sep"></span>${trees}${heater}`);
}

let tipIndex = 0;
let tipTimer = 0;

function renderHint() {
  const tips = halloweenActive() ? [...HALLOWEEN_TIPS, ...TIPS] : TIPS;
  const hasHeaters = state.tiles.some(t => t.s === 'heater');
  let text;
  if (state.tiles.some(t => t.crow)) text = '🐦 Wrony na polu! Dotknij je, żeby przegonić.';
  else if (frostTonight()) text = state.fleece ? '🧣 Pole przykryte — przymrozek nie straszny.' : '❄️ Dziś w nocy przymrozek! Grzejniki 🔥 albo agrowłóknina 🧣 uratują rośliny.';
  else if (isWinter() && hasHeaters && state.heatCold) text = '🔥 Grzejniki wygasły — potrzebne drewno 🪵 z lasu.';
  else if (state.coins < seedCost(state.seed) && !state.tiles.some(cropReady)) text = '🪙 Brak monet na nasiona — sprzedaj plony w Stodole.';
  else if (state.tiles.some(t => t.s === 'crop' && !t.w && !cropReady(t)) && !isRaining()) text = '💧 Dotknij spragnionej rośliny, aby ją podlać — urośnie 2× szybciej.';
  else text = tips[tipIndex % tips.length];
  if ($('hint').textContent !== text) $('hint').textContent = text;
}

function renderQuestCard() {
  const q = currentQuest();
  const card = $('questCard');
  if (!q) {
    card.classList.add('hidden');
    return;
  }
  const pr = questProgress(q);
  card.classList.remove('hidden');
  card.classList.toggle('done', pr.done);
  patch(card, `<span class="q-title">📜 ${q.title}</span><span class="q-prog">${pr.done ? 'Odbierz nagrodę!' : `${pr.n}/${pr.of}`}</span><span class="q-bar"><i style="width:${(pr.n / pr.of) * 100}%"></i></span>`);
}

/* ---------- Rendering: panels ---------- */

function patch(el, html) {
  if (el._html === html) return false;
  el._html = html;
  el.innerHTML = html;
  return true;
}

function barValue(key) {
  const [kind, raw] = key.split(':');
  const idx = Number(raw);
  if (kind === 'a') {
    const animal = state.animals[idx];
    if (!animal) return null;
    const total = ANIMALS[animal.type].time * 1000;
    return { f: animal.p / total, text: fmtTime((total - animal.p) / 1000 / animalSpeed()) };
  }
  if (kind === 'k' || kind === 'c') {
    const slot = kind === 'k' ? state.kitchen[idx] : state.event.cauldron[idx];
    if (!slot) return null;
    const total = kind === 'k' ? recipeTime(slot.r) : HALLOWEEN.recipes[slot.r].time * 1000;
    return { f: slot.p / total, text: fmtTime((total - slot.p) / 1000) };
  }
  if (kind === 'o') {
    const order = state.orders[idx];
    if (!order || order.wait === undefined) return null;
    return { f: 1 - order.wait / order.total, text: fmtTime(order.wait / 1000) };
  }
  if (kind === 'p') {
    const [pid, k] = raw.split('.');
    const slot = state.processors[pid] && state.processors[pid].slots[Number(k)];
    if (!slot) return null;
    const total = procTime(pid, slot.r);
    return { f: slot.p / total, text: fmtTime((total - slot.p) / 1000) };
  }
  if (kind === 't') {
    if (!state.trip) return null;
    return { f: 1 - state.trip.left / state.trip.total, text: fmtTime(state.trip.left / 1000) };
  }
  return null;
}

function updateBars(container) {
  container.querySelectorAll('[data-bar]').forEach(el => {
    const v = barValue(el.dataset.bar);
    if (!v) return;
    const fill = el.querySelector('i');
    if (fill) fill.style.width = `${Math.min(100, v.f * 100)}%`;
    const label = el.parentElement.querySelector('.ptext');
    if (label) label.textContent = v.text;
  });
}

function chipsFor(items) {
  return Object.entries(items).map(([id, n]) => {
    const h = inv(id);
    return `<span class="chip ${h >= n ? 'ok' : 'miss'}">${ITEMS[id].icon} ${Math.min(h, n)}/${n}</span>`;
  }).join('');
}

function viewHead(title, sub = '') {
  return `<div class="view-head"><button class="back-btn" type="button" data-act="back">‹ Więcej</button><h2>${title}</h2>${sub ? `<p class="sub">${sub}</p>` : ''}</div>`;
}

function renderAnimals() {
  const html = Object.entries(ANIMALS).map(([type, a]) => {
    if (state.level < a.level) {
      return `<div class="card locked"><div class="big-icon">${a.icon}</div><b>${a.name}</b><p>🔒 Odblokujesz na poziomie ${a.level}</p></div>`;
    }
    const mine = state.animals.map((x, idx) => ({ x, idx })).filter(o => o.x.type === type);
    const price = animalPrice(type);
    const max = animalMax(type);
    const full = mine.length >= max;
    const pen = mine.map(({ x, idx }) => {
      if (x.s === 'ready') {
        return `<button class="slot ready" type="button" data-act="animal" data-arg="${idx}"><span class="main">${a.icon}</span><span class="bubble">${ITEMS[a.product].icon}</span></button>`;
      }
      if (x.s === 'hungry') {
        const want = Object.entries(a.feed).map(([id, n]) => `${ITEMS[id].icon}${n > 1 ? n : ''}`).join('');
        return `<button class="slot hungry" type="button" data-act="animal" data-arg="${idx}"><span class="main">${a.icon}</span><span class="bubble want">${want}</span></button>`;
      }
      return `<button class="slot" type="button" data-act="animal" data-arg="${idx}"><span class="main">${a.icon}</span><span class="ptext"></span><span class="pbar" data-bar="a:${idx}"><i></i></span></button>`;
    }).join('');
    return `<div class="card">
      <div class="card-head">
        <span class="big-icon">${a.icon}</span>
        <div class="grow">
          <h3>${a.name} <small>${mine.length}/${max}</small></h3>
          <p>Je: ${Object.entries(a.feed).map(([id, n]) => `${ITEMS[id].icon}×${n}`).join(' ')} · Daje: ${ITEMS[a.product].icon} co ${fmtTime(a.time / animalSpeed())}</p>
        </div>
        <button class="btn small gold" type="button" data-act="buyAnimal" data-arg="${type}" ${full || state.coins < price ? 'disabled' : ''}>${full ? 'Pełno' : `🪙 ${price}`}</button>
      </div>
      ${mine.length ? `<div class="pen">${pen}</div>` : '<p class="empty">Kup pierwsze zwierzę — zobaczysz je w zagrodzie za polem.</p>'}
    </div>`;
  }).join('');
  const helper = helperLvl('basia') ? '<div class="helper-note">👩‍🌾 Gospodyni Basia sama karmi zwierzęta i zbiera produkty.</div>' : '';
  const box = $('animals');
  patch(box, helper + html);
  updateBars(box);
  const any = state.animals.length > 0;
  $('feedAllBtn').disabled = !state.animals.some(a => a.s === 'hungry' && hasItems(ANIMALS[a.type].feed));
  $('collectAllBtn').disabled = !state.animals.some(a => a.s === 'ready');
  $('feedAllBtn').classList.toggle('hidden', !any);
  $('collectAllBtn').classList.toggle('hidden', !any);
}

function slotButton(kind, idx, slot, total, extraCls = '') {
  if (!slot) return `<div class="slot kitchen-slot empty-slot ${extraCls}">Wolne miejsce</div>`;
  const icon = ITEMS[slot.r].icon;
  const act = kind === 'k' ? 'slot' : 'cauldron';
  if (slot.p >= total) {
    return `<button class="slot kitchen-slot ready ${extraCls}" type="button" data-act="${act}" data-arg="${idx}"><span class="main">${icon}</span><span class="bubble">✅</span></button>`;
  }
  return `<button class="slot kitchen-slot ${extraCls}" type="button" data-act="${act}" data-arg="${idx}"><span class="main">${icon}</span><span class="ptext"></span><span class="pbar" data-bar="${kind}:${idx}"><i></i></span><span class="speed">⚡</span></button>`;
}

let kitchenTab = 'kitchen';

function renderProcessing() {
  const cards = Object.entries(PROCESSORS).map(([pid, pr]) => {
    if (state.level < pr.level) {
      return `<div class="card locked"><div class="big-icon">${pr.icon}</div><b>${pr.name}</b><p>🔒 Poziom ${pr.level} · ${pr.text}</p></div>`;
    }
    const built = state.processors[pid];
    if (!built) {
      return `<div class="card proc unbuilt">
        <div class="card-head"><span class="big-icon">${pr.icon}</span><div class="grow"><h3>${pr.name}</h3><p>${pr.text}</p></div></div>
        <div class="chips">${costChips(pr.cost)}</div>
        <button class="btn gold wide" type="button" data-act="buildProc" data-arg="${pid}" ${canAfford(pr.cost) ? '' : 'disabled'}>🔨 Zbuduj</button>
      </div>`;
    }
    const free = built.slots.some(sl => sl === null);
    const slots = built.slots.map((slot, k) => {
      if (!slot) return '<div class="slot kitchen-slot empty-slot">Wolne</div>';
      const r = pr.recipes[slot.r];
      const icon = r.booster ? BOOSTERS[r.booster].icon : ITEMS[slot.r].icon;
      if (slot.p >= procTime(pid, slot.r)) {
        return `<button class="slot kitchen-slot ready" type="button" data-act="procslot" data-arg="${pid}:${k}"><span class="main">${icon}</span><span class="bubble">✅</span></button>`;
      }
      return `<button class="slot kitchen-slot" type="button" data-act="procslot" data-arg="${pid}:${k}"><span class="main">${icon}</span><span class="ptext"></span><span class="pbar" data-bar="p:${pid}.${k}"><i></i></span><span class="speed">⚡</span></button>`;
    }).join('');
    const recipes = Object.entries(pr.recipes).map(([rid, r]) => {
      const out = r.booster ? BOOSTERS[r.booster] : ITEMS[rid];
      return `<div class="recipe">
        <span class="big-icon">${out.icon}</span>
        <div class="grow">
          <h4>${out.name} ×${r.out}</h4>
          <div class="chips">${chipsFor(r.input)}</div>
          <div class="meta">⏱ ${fmtTime(procTime(pid, rid) / 1000)}${r.booster ? ' · trafia do 🎒 plecaka' : ` · 🪙 ${sellPrice(rid)}/szt.`}</div>
        </div>
        <button class="btn small" type="button" data-act="proc" data-arg="${pid}:${rid}" ${hasItems(r.input) && free ? '' : 'disabled'}>Start</button>
      </div>`;
    }).join('');
    return `<div class="card proc">
      <div class="card-head"><span class="big-icon">${pr.icon}</span><div class="grow"><h3>${pr.name}</h3><p>${pr.text}</p></div></div>
      <div class="kitchen-slots${built.slots.length === 2 ? ' two' : built.slots.length === 1 ? ' one' : ''}">${slots}</div>
      ${recipes}
    </div>`;
  }).join('');
  return `<p class="meta center">Półprodukty z Przetwórni przydadzą się w nowych przepisach kuchni.${projectDone('mill') ? ' 🏞️ Młyn wodny przyspiesza pracę o 25%.' : ''}</p>${cards}`;
}

function renderKitchen() {
  const box = $('kitchen');
  const tabs = `<div class="segmented">
      <button class="${kitchenTab === 'kitchen' ? 'on' : ''}" type="button" data-act="ktab" data-arg="kitchen">🍳 Kuchnia</button>
      <button class="${kitchenTab === 'process' ? 'on' : ''}" type="button" data-act="ktab" data-arg="process">🏭 Przetwórnia${readyProcessSlots() ? ` <i class="dot">${readyProcessSlots()}</i>` : ''}</button>
    </div>`;
  if (kitchenTab === 'process') {
    patch(box, tabs + renderProcessing());
    updateBars(box);
    return;
  }
  if (state.level < KITCHEN_LEVEL) {
    patch(box, `${tabs}<div class="card locked"><div class="big-icon">🍳</div><b>Kuchnia jest zamknięta</b><p>🔒 Odblokujesz ją na poziomie ${KITCHEN_LEVEL}. Przerabiaj plony na droższe przysmaki!</p></div>`);
    return;
  }
  const slots = state.kitchen.map((slot, idx) => slotButton('k', idx, slot, slot ? recipeTime(slot.r) : 0));
  if (state.kitchen.length < MAX_KITCHEN_SLOTS) {
    slots.push(`<button class="slot kitchen-slot empty-slot" type="button" data-act="buySlot">➕ Palnik<br>🪙 ${KITCHEN_SLOT_PRICE}</button>`);
  }
  const free = state.kitchen.some(s => s === null);
  const recipes = Object.entries(RECIPES).map(([id, r]) => {
    if (state.level < r.level) {
      return `<div class="recipe locked"><span class="big-icon">${ITEMS[id].icon}</span><div class="grow"><h4>${ITEMS[id].name}</h4><div class="meta">🔒 Poziom ${r.level}</div></div></div>`;
    }
    const ok = hasItems(r.input);
    const out = recipeOut(id);
    return `<div class="recipe">
      <span class="big-icon">${ITEMS[id].icon}</span>
      <div class="grow">
        <h4>${ITEMS[id].name}${out > 1 ? ` ×${out}` : ''}</h4>
        <div class="chips">${chipsFor(r.input)}</div>
        <div class="meta">⏱ ${fmtTime(recipeTime(id) / 1000)} · wartość 🪙 ${sellPrice(id)}</div>
      </div>
      <button class="btn small" type="button" data-act="cook" data-arg="${id}" ${ok && free ? '' : 'disabled'}>Gotuj</button>
    </div>`;
  }).join('');
  const helper = helperLvl('mietek') ? '<div class="helper-note">👨‍🍳 Kucharz Mietek odbiera potrawy i gotuje je ponownie.</div>' : '';
  patch(box, `${tabs}${helper}<div class="card"><div class="kitchen-slots">${slots.join('')}</div><p class="meta center">Dotknij gotującej się potrawy, aby ją przyspieszyć za 🌟.</p></div><div class="card">${recipes}</div>`);
  updateBars(box);
}

function renderOrders() {
  const html = state.orders.map((order, idx) => {
    if (order.wait !== undefined) {
      return `<div class="card order waiting"><span class="walker">🚶</span><b>Ktoś idzie przez wieś…</b><span class="ptext"></span><span class="pbar" data-bar="o:${idx}"><i></i></span></div>`;
    }
    const [face, name] = npcOf(order);
    const ok = hasItems(order.items);
    return `<div class="card order${order.ev ? ' spooky' : ''}">
      <div class="card-head">
        <span class="npc">${face}</span>
        <div class="grow"><h3>${name}</h3><p>${order.text}</p></div>
      </div>
      <div class="chips">${chipsFor(order.items)}</div>
      <div class="reward"><span>🪙 ${order.coins}</span><span>⭐ ${order.xp}</span>${order.pts ? `<span>👻 ${order.pts}</span>` : ''}${order.nails ? `<span>🔩 ${order.nails}</span>` : ''}</div>
      <div class="actions">
        <button class="btn" type="button" data-act="deliver" data-arg="${idx}" ${ok ? '' : 'disabled'}>Oddaj</button>
        <button class="btn ghost" type="button" data-act="skip" data-arg="${idx}" aria-label="Odrzuć">🗑️</button>
      </div>
    </div>`;
  }).join('');
  const box = $('orders');
  patch(box, html);
  updateBars(box);
}

function renderBarn() {
  ensureDeals();
  const ids = Object.keys(ITEMS).filter(id => inv(id) > 0);
  const total = ids.reduce((sum, id) => sum + inv(id) * sellPrice(id), 0);
  $('barnValue').textContent = ids.length ? `Wartość: 🪙 ${total}` : '';
  const deals = Object.entries(state.deals.items).map(([id, m]) =>
    `<span class="deal${m >= 2 ? ' hot' : ''}">${ITEMS[id].icon} ${ITEMS[id].name} <b>×${m}</b></span>`).join('');
  const rows = ids.map(id => {
    const deal = state.deals.items[id];
    return `<div class="barn-row">
      <span class="big-icon">${ITEMS[id].icon}</span>
      <div class="grow"><b>${ITEMS[id].name} ×${inv(id)}</b><p class="meta">🪙 ${sellPrice(id)} / szt.${deal ? ` <span class="deal-tag">okazja ×${deal}</span>` : ''}${ITEMS[id].material ? ' · materiał budowlany' : ''}</p></div>
      <button class="btn small ghost" type="button" data-act="sell1" data-arg="${id}">Sprzedaj 1</button>
      <button class="btn small gold" type="button" data-act="sellAll" data-arg="${id}">Wszystko</button>
    </div>`;
  }).join('');
  patch($('barn'), `<div class="card deals-card"><h3 class="card-title">🔥 Okazje dnia na targu</h3><div class="deals">${deals}</div><p class="meta">Zmieniają się każdego ranka.</p></div>` +
    (ids.length ? `<div class="card">${rows}</div>` : '<div class="card"><p class="empty">Stodoła jest pusta. Zbierz plony z pola! 🌾</p></div>'));
}

function renderEvent() {
  const box = $('event');
  const head = viewHead('🎃 Halloween');
  if (!halloweenActive()) {
    patch(box, `${head}<div class="card locked"><div class="big-icon">🎃</div><b>Halloween się skończył</b><p>Zdobyte ozdoby zostają w gospodarstwie na zawsze. Do zobaczenia za rok!</p></div>`);
    return;
  }
  const ev = state.event;
  const ms = HALLOWEEN.milestones;
  const next = ms.find(m => ev.points < m.points);
  const prevPts = next ? (ms[ms.indexOf(next) - 1] || { points: 0 }).points : 0;
  const progress = next ? (ev.points - prevPts) / (next.points - prevPts) : 1;
  const rows = ms.map((m, k) => {
    const claimed = ev.claimed.includes(k);
    const reached = ev.points >= m.points;
    const action = claimed
      ? '<span class="chip ok">✔ Odebrane</span>'
      : reached
        ? `<button class="btn small gold" type="button" data-act="claim" data-arg="${k}">Odbierz</button>`
        : `<span class="chip">👻 ${m.points}</span>`;
    return `<div class="milestone${claimed ? ' claimed' : ''}${reached && !claimed ? ' reachable' : ''}">
      <div class="grow"><b>${m.label}</b>${m.perk ? `<p class="meta">${m.perk}</p>` : ''}</div>${action}
    </div>`;
  }).join('');
  const free = ev.cauldron.some(s => s === null);
  const slots = ev.cauldron.map((slot, idx) => slotButton('c', idx, slot, slot ? HALLOWEEN.recipes[slot.r].time * 1000 : 0, 'cauldron-slot')).join('');
  const recipes = Object.entries(HALLOWEEN.recipes).map(([id, r]) => {
    const ok = hasItems(r.input);
    return `<div class="recipe">
      <span class="big-icon">${ITEMS[id].icon}</span>
      <div class="grow">
        <h4>${ITEMS[id].name}${r.out > 1 ? ` ×${r.out}` : ''}</h4>
        <div class="chips">${chipsFor(r.input)}</div>
        <div class="meta">⏱ ${fmtTime(r.time)} · 👻 +${r.points} · 🪙 ${sellPrice(id)}/szt.</div>
      </div>
      <button class="btn small purple" type="button" data-act="brew" data-arg="${id}" ${ok && free ? '' : 'disabled'}>Warz</button>
    </div>`;
  }).join('');
  patch(box, `${head}
    <div class="card event-hero">
      <div class="card-head">
        <span class="big-icon">🎃</span>
        <div class="grow"><h3>Halloween na wsi</h3><p>Zostało ${eventDaysLeft()} dni · nagrody zostają na zawsze</p></div>
      </div>
      <div class="event-points"><b>👻 ${ev.points}</b><span>${next ? `do nagrody: ${next.points - ev.points}` : 'wszystko zdobyte!'}</span></div>
      <div class="event-bar"><i style="width:${Math.min(100, progress * 100)}%"></i></div>
    </div>
    <div class="card"><h3 class="card-title">🏆 Nagrody</h3>${rows}</div>
    <div class="card cauldron-card"><h3 class="card-title">🧪 Kociołek czarownicy</h3><div class="kitchen-slots two">${slots}</div>${recipes}</div>
    <div class="card"><h3 class="card-title">Jak zdobywać 👻?</h3>
      <ul class="howto">
        <li>🎃 Zbieraj dynie z pola: +${HALLOWEEN.harvestPoints} 👻 (w Halloween rosną od 1. poziomu).</li>
        <li>🧪 Warz przysmaki w kociołku.</li>
        <li>🧛 Spełniaj zamówienia potworów z wioski.</li>
      </ul>
    </div>`);
  updateBars(box);
}

function renderMore() {
  const b = moreBadges();
  const tile = (view, icon, name, sub, badge = 0, locked = '') =>
    `<button class="hub-tile${locked ? ' locked' : ''}" type="button" data-act="open" data-arg="${view}">
      <span class="hub-icon">${icon}</span><b>${name}</b><small>${locked || sub}</small>${badge ? `<i class="badge">${badge}</i>` : ''}
    </button>`;
  const name = state.farmName ? escapeHtml(state.farmName) : 'Twoje gospodarstwo';
  patch($('more'), `
    <div class="farm-banner">
      <span class="big-icon">🏡</span>
      <div class="grow"><h2>${name}</h2><p>⭐ Poziom ${state.level} · 🪙 ${state.coins.toLocaleString('pl-PL')} · 🌟 ${state.gold} · ${SEASONS[seasonIndex()].icon} ${SEASONS[seasonIndex()].name}</p></div>
    </div>
    <div class="hub">
      ${tile('workshop', '🔨', 'Warsztat', 'Ulepszenia i pomocnicy', b.workshop)}
      ${tile('village', '🏘️', 'Wieś i las', 'Odbudowa i wyprawy', b.village)}
      ${tile('merchant', '🧳', 'Kupiec', 'Rzadkie towary', b.merchant, state.level < MERCHANT_LEVEL ? `🔒 Poziom ${MERCHANT_LEVEL}` : '')}
      ${tile('trophies', '🏆', 'Trofea', 'Kronika i osiągnięcia', b.trophies)}
      ${halloweenActive() ? tile('event', '🎃', 'Halloween', 'Wydarzenie', b.event) : ''}
      <button class="hub-tile" type="button" data-act="backpack"><span class="hub-icon">🎒</span><b>Plecak</b><small>Wzmacniacze</small></button>
      <button class="hub-tile" type="button" data-act="settings"><span class="hub-icon">⚙️</span><b>Ustawienia</b><small>Dźwięk, grafika, kopia</small></button>
      <button class="hub-tile" type="button" data-act="help"><span class="hub-icon">❓</span><b>Pomoc</b><small>Jak grać</small></button>
    </div>`);
}

function renderWorkshop() {
  const upgrades = Object.entries(UPGRADES).map(([id, u]) => {
    const lvl = upg(id);
    const max = u.levels.length;
    const next = u.levels[lvl];
    const pips = Array.from({ length: max }, (_, k) => `<i class="${k < lvl ? 'on' : ''}"></i>`).join('');
    if (state.level < u.level) {
      return `<div class="upgrade locked"><span class="big-icon">${u.icon}</span><div class="grow"><h4>${u.name}</h4><p class="meta">🔒 Poziom ${u.level}</p></div></div>`;
    }
    return `<div class="upgrade">
      <span class="big-icon">${u.icon}</span>
      <div class="grow">
        <h4>${u.name} <span class="pips">${pips}</span></h4>
        <p class="meta">${lvl ? `Teraz: ${u.levels[lvl - 1].text}` : 'Jeszcze nie kupione.'}</p>
        ${next ? `<p class="next">Następny: ${next.text}</p><div class="chips">${costChips(next.cost)}</div>` : '<p class="next done">✔ Maksymalny poziom</p>'}
      </div>
      ${next ? `<button class="btn small" type="button" data-act="upgrade" data-arg="${id}" ${canAfford(next.cost) ? '' : 'disabled'}>Kup</button>` : ''}
    </div>`;
  }).join('');
  const helpers = Object.entries(HELPERS).map(([id, h]) => {
    const lvl = helperLvl(id);
    const next = h.levels[lvl];
    if (state.level < h.level) {
      return `<div class="upgrade locked"><span class="big-icon">${h.icon}</span><div class="grow"><h4>${h.name}</h4><p class="meta">🔒 Poziom ${h.level}</p></div></div>`;
    }
    return `<div class="upgrade helper">
      <span class="big-icon">${h.icon}</span>
      <div class="grow">
        <h4>${h.name}${lvl ? ` <span class="chip ok">poz. ${lvl}</span>` : ''}</h4>
        <p class="meta">${lvl ? h.levels[lvl - 1].text : 'Czeka na zatrudnienie.'}</p>
        ${next ? `<p class="next">${lvl ? 'Awans' : 'Zatrudnij'}: ${next.text}</p><div class="chips">${costChips(next.cost)}</div>` : '<p class="next done">✔ Najlepszy w okolicy</p>'}
      </div>
      ${next ? `<button class="btn small gold" type="button" data-act="hire" data-arg="${id}" ${canAfford(next.cost) ? '' : 'disabled'}>${lvl ? 'Awans' : 'Zatrudnij'}</button>` : ''}
    </div>`;
  }).join('');
  patch($('workshop'), `${viewHead('🔨 Warsztat', 'Materiały 🪵🪨🔩 zdobędziesz z karczowania, wypraw do lasu, zamówień i od kupca.')}
    <div class="card materials">${['wood', 'stone', 'nails'].map(id => `<span>${ITEMS[id].icon} <b>${inv(id)}</b> ${ITEMS[id].name}</span>`).join('')}<span>🌟 <b>${state.gold}</b> Złote kłosy</span></div>
    <div class="card"><h3 class="card-title">👥 Pomocnicy</h3>${helpers}${state.coffee > 0 ? `<p class="meta">☕ Kawa działa jeszcze ${fmtTime(state.coffee / 1000)}.</p>` : ''}</div>
    <div class="card"><h3 class="card-title">🛠️ Ulepszenia</h3>${upgrades}</div>`);
}

function renderVillage() {
  const projects = Object.entries(PROJECTS).map(([id, p]) => {
    const ps = projectState(id);
    if (state.level < p.level) {
      return `<div class="project locked"><span class="big-icon">${p.icon}</span><div class="grow"><h4>${p.name}</h4><p class="meta">🔒 Poziom ${p.level} · ${p.perk}</p></div></div>`;
    }
    if (ps.done) {
      return `<div class="project done"><span class="big-icon">${p.icon}</span><div class="grow"><h4>${p.name} ✔</h4><p class="meta">${p.perk}</p></div></div>`;
    }
    const needs = Object.entries(p.needs).map(([key, n]) => {
      const got = ps.donated[key] || 0;
      const full = got >= n;
      return `<div class="need${full ? ' full' : ''}">
        <span>${keyIcon(key)} ${got}/${n}</span>
        <span class="need-bar"><i style="width:${(got / n) * 100}%"></i></span>
        ${full ? '<span class="chip ok">✔</span>' : `<button class="btn small ghost" type="button" data-act="donate" data-arg="${id}:${key}" ${have(key) > 0 ? '' : 'disabled'}>Oddaj</button>`}
      </div>`;
    }).join('');
    return `<div class="project">
      <div class="card-head"><span class="big-icon">${p.icon}</span><div class="grow"><h4>${p.name}</h4><p class="meta">Bonus: ${p.perk} · Nagroda 🌟 ${p.gold}</p></div></div>
      ${needs}
    </div>`;
  }).join('');
  let trip = '';
  if (state.trip) {
    const t = TRIPS[state.trip.id];
    trip = state.trip.left > 0
      ? `<div class="trip active"><span class="big-icon walker">${t.icon}</span><div class="grow"><b>${t.name}</b><span class="ptext"></span><span class="pbar static" data-bar="t:0"><i></i></span></div><button class="btn small ghost" type="button" data-act="trip-collect">⚡</button></div>`
      : `<div class="trip ready"><span class="big-icon">${t.icon}</span><div class="grow"><b>Wyprawa wróciła!</b><p class="meta">Odbierz łupy z lasu.</p></div><button class="btn small gold" type="button" data-act="trip-collect">Odbierz</button></div>`;
  }
  const trips = Object.entries(TRIPS).map(([id, t]) => {
    const locked = state.level < t.level;
    const loot = Object.entries(t.loot).map(([k, [a, b]]) => `${ITEMS[k].icon}${a}–${b}`).join(' ');
    return `<div class="trip-option${locked ? ' locked' : ''}">
      <span class="big-icon">${t.icon}</span>
      <div class="grow"><h4>${t.name}</h4><p class="meta">⏱ ${fmtTime(t.time)} · ${loot}${t.goldChance ? ` · ${Math.round(t.goldChance * 100)}% 🌟` : ''}</p>
        ${Object.keys(t.cost).length ? `<div class="chips">${chipsFor(t.cost)}</div>` : '<p class="meta">Bez prowiantu</p>'}</div>
      ${locked ? `<span class="chip">🔒 ${t.level}</span>` : `<button class="btn small" type="button" data-act="trip" data-arg="${id}" ${state.trip || !canAfford(t.cost) ? 'disabled' : ''}>Wyślij</button>`}
    </div>`;
  }).join('');
  const box = $('village');
  patch(box, `${viewHead('🏘️ Wieś i las', 'Odbuduj wieś, a każdy budynek da Ci stały bonus. W lesie zbierzesz materiały.')}
    <div class="card"><h3 class="card-title">🌲 Las</h3>${trip}${trips}</div>
    <div class="card"><h3 class="card-title">🏗️ Odbudowa wsi</h3>${projects}</div>`);
  updateBars(box);
}

function renderMerchant() {
  if (state.level < MERCHANT_LEVEL) {
    patch($('merchant'), `${viewHead('🧳 Wędrowny kupiec')}<div class="card locked"><div class="big-icon">🧳</div><b>Kupiec jeszcze nie zagląda do wsi</b><p>🔒 Odblokujesz go na poziomie ${MERCHANT_LEVEL}.</p></div>`);
    return;
  }
  ensureMerchant();
  const offers = state.merchant.offers.map((o, k) => {
    const def = o.kind === 'booster' ? BOOSTERS[o.id] : o.kind === 'gold' ? { name: 'Złoty kłos', icon: '🌟', text: 'Rzadka waluta na ulepszenia i pomocników.' } : { ...ITEMS[o.id], text: 'Materiał do budowy i ulepszeń.' };
    return `<div class="offer${o.bought ? ' sold' : ''}">
      <span class="big-icon">${def.icon}</span>
      <div class="grow"><h4>${def.name} ×${o.qty}</h4><p class="meta">${def.text || ''}</p><div class="chips">${costChips(o.price)}</div></div>
      ${o.bought ? '<span class="chip ok">Kupione</span>' : `<button class="btn small gold" type="button" data-act="buyOffer" data-arg="${k}" ${canAfford(o.price) ? '' : 'disabled'}>Kup</button>`}
    </div>`;
  }).join('');
  patch($('merchant'), `${viewHead('🧳 Wędrowny kupiec', 'Nowe towary każdego ranka.')}
    <div class="card merchant-hero"><span class="big-icon">🧔‍♂️</span><p>„Witam, gospodarzu! Mam dziś coś specjalnego…”${projectDone('bridge') ? ' <b>(rabat 20% za most!)</b>' : ''}</p></div>
    <div class="card">${offers}</div>`);
}

function renderTrophies() {
  const q = currentQuest();
  const pr = questProgress(q);
  const quest = q
    ? `<div class="card quest-card-big${pr.done ? ' done' : ''}">
        <span class="big-icon">🧔</span>
        <div class="grow"><h4>Zadanie ${state.quest.idx + 1}/${QUESTS.length}: ${q.title}</h4><p class="meta">„${q.text}”</p>
          <div class="need"><span>${pr.n}/${pr.of}</span><span class="need-bar"><i style="width:${(pr.n / pr.of) * 100}%"></i></span></div>
          <p class="meta">Nagroda: ${rewardText(q.reward)}</p></div>
        ${pr.done ? '<button class="btn small gold" type="button" data-act="quest">Odbierz</button>' : ''}
      </div>`
    : '<div class="card"><p class="empty">📜 Kronika wsi ukończona!</p></div>';
  const ach = ACHIEVEMENTS.map(a => {
    const info = achInfo(a);
    const medals = a.tiers.map((t, k) => `<span class="medal${k < info.claimed ? ' on' : ''}">${['🥉', '🥈', '🥇'][k]}</span>`).join('');
    const maxed = info.target === undefined;
    return `<div class="achievement${maxed ? ' maxed' : ''}">
      <span class="big-icon">${a.icon}</span>
      <div class="grow"><h4>${a.name} ${medals}</h4>
        ${maxed ? '<p class="meta">Wszystkie medale zdobyte!</p>' : `<div class="need"><span>${Math.min(info.value, info.target)}/${info.target} ${a.unit}</span><span class="need-bar"><i style="width:${Math.min(100, (info.value / info.target) * 100)}%"></i></span></div>`}
      </div>
      ${info.ready ? `<button class="btn small gold" type="button" data-act="ach" data-arg="${a.id}">Odbierz</button>` : ''}
    </div>`;
  }).join('');
  patch($('trophies'), `${viewHead('🏆 Trofea')}<h3 class="section-title">📜 Kronika wsi</h3>${quest}<h3 class="section-title">🏅 Osiągnięcia</h3><div class="card">${ach}</div>`);
}

let activeTab = 'farm';
let activeView = 'farm';

function renderAll() {
  renderHud();
  switch (activeView) {
    case 'farm':
      if (!farm3d) {
        renderSky();
        renderField();
      }
      renderSeedbar();
      renderHint();
      renderQuestCard();
      break;
    case 'animals': renderAnimals(); break;
    case 'kitchen': renderKitchen(); break;
    case 'orders': renderOrders(); break;
    case 'barn': renderBarn(); break;
    case 'more': renderMore(); break;
    case 'workshop': renderWorkshop(); break;
    case 'village': renderVillage(); break;
    case 'merchant': renderMerchant(); break;
    case 'trophies': renderTrophies(); break;
    case 'event': renderEvent(); break;
    default: break;
  }
}

function fitField() {
  if (farm3d) {
    farm3d.resize();
    return;
  }
  const wrap = $('fieldWrap');
  const gap = 4;
  const chrome = 2 * 7 + 2 * 5 + 6;
  const w = wrap.clientWidth - 12 - chrome - gap * (COLS - 1);
  const h = wrap.clientHeight - 12 - chrome - gap * (ROWS - 1);
  if (w <= 0 || h <= 0) return;
  const size = Math.floor(Math.min(w / COLS, h / ROWS));
  document.documentElement.style.setProperty('--tile', `${Math.max(22, Math.min(76, size))}px`);
}

const SUB_VIEWS = ['workshop', 'village', 'merchant', 'trophies', 'event'];

function showView(view) {
  activeView = view;
  activeTab = SUB_VIEWS.includes(view) ? 'more' : view;
  document.querySelectorAll('.tabs button').forEach(b => b.classList.toggle('active', b.dataset.tab === activeTab));
  document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.id === `view-${view}`));
  const el = $(`view-${view}`);
  if (el) el.scrollTop = 0;
  if (farm3d) farm3d.setActive(view === 'farm' && !document.hidden);
  if (view === 'farm') fitField();
  renderAll();
}

/* ---------- Menus ---------- */

function showHelp() {
  showModal({
    hero: '👨‍🌾',
    title: 'Jak grać?',
    body: `<ul>
      <li>🌱 <b>Pole:</b> dotknij trawy, by zaorać, wybierz nasiona i dotknij grządki. Możesz przeciągać palcem po wielu grządkach!</li>
      <li>💧 <b>Podlewanie:</b> podlana roślina rośnie 2× szybciej. Lepsza konewka podlewa kilka grządek naraz.</li>
      <li>🤏 <b>Mapa:</b> dwoma palcami przybliżasz, oddalasz i obracasz widok. Jednym palcem przesuwasz mapę, gdy zaczniesz poza polem uprawnym. ⟳ obraca o 90°, 🎯 wraca do widoku pola.</li>
      <li>🍂 <b>Pory roku:</b> co ${SEASON_DAYS} dni zmienia się pora roku. Ulubione rośliny rosną o 30% szybciej, a zimą wszystko zwalnia.</li>
      <li>🐦 <b>Wrony:</b> dotknij wrony, zanim wydziobie plony. Pies Burek zrobi to za Ciebie.</li>
      <li>✨ <b>Złote rośliny:</b> rzadko wyrastają same — dają podwójny plon i 🌟.</li>
      <li>🎣 <b>Staw:</b> dotknij wody i zatnij rybę we właściwym momencie.</li>
      <li>🔨 <b>Warsztat:</b> ulepszenia narzędzi i pomocnicy, którzy pracują za Ciebie — nawet gdy gra jest zamknięta.</li>
      <li>🍎 <b>Sad:</b> drzewka z paska nasion sadzisz raz, a owoce zbierasz co kilka minut. Zimą śpią, chyba że je ogrzejesz.</li>
      <li>🏭 <b>Przetwórnia:</b> w zakładce Kuchnia zbudujesz młyn, tłocznię, mleczarnię, olejarnię i wytwórnię nawozu.</li>
      <li>🔥 <b>Zima:</b> przymrozki niszczą rośliny. Grzejniki palą drewno i ogrzewają grządki dookoła.</li>
      <li>🏘️ <b>Wieś i las:</b> wysyłaj wyprawy po drewno 🪵, kamień 🪨 i gwoździe 🔩, a potem odbuduj wieś dla stałych bonusów.</li>
      <li>🧳 <b>Kupiec:</b> codziennie inne towary i wzmacniacze do 🎒 plecaka.</li>
      <li>🌟 <b>Złote kłosy:</b> zdobywasz za zadania, osiągnięcia i złote plony. Przyspieszają potrawy i opłacają najlepsze ulepszenia.</li>
      <li>📜 <b>Kronika:</b> zadania od sołtysa prowadzą przez całą grę.</li>
    </ul>`,
    buttons: [{ label: 'Do roboty!', cls: 'gold' }]
  });
}

function showMenu() {
  const s = state.stats;
  showModal({
    hero: '⚙️',
    title: state.farmName ? escapeHtml(state.farmName) : 'Gospodarstwo',
    body: `<ul>
        <li>📅 Dni na wsi: <b>${state.day}</b></li>
        <li>🧺 Zebrane plony: <b>${s.harvested}</b></li>
        <li>📋 Spełnione zamówienia: <b>${s.orders}</b></li>
        <li>🪙 Zarobione monety: <b>${s.earned}</b></li>
        <li>🔥 Seria codziennych nagród: <b>${state.daily.streak}</b></li>
      </ul>
      <div class="toggle-row"><span>🔊 Dźwięki</span><button class="btn small ${state.sound ? '' : 'ghost'}" id="soundToggle" type="button">${state.sound ? 'Włączone' : 'Wyłączone'}</button></div>
      <div class="toggle-row"><span>🎵 Muzyka</span><button class="btn small ${state.music ? '' : 'ghost'}" id="musicToggle" type="button">${state.music ? 'Włączona' : 'Wyłączona'}</button></div>
      <div class="toggle-row"><span>🎨 Grafika</span><button class="btn small" id="gfxToggle" type="button">${state.gfx === '2d' ? 'Klasyczna 2D' : 'Pełne 3D'}</button></div>
      <div class="toggle-row"><span>🏷️ Nazwa</span><button class="btn small ghost" id="renameBtn" type="button">Zmień</button></div>`,
    buttons: [
      { label: '💾 Kopia zapasowa', cls: 'ghost', onClick: showBackup },
      { label: 'Zacznij od nowa', cls: 'red', onClick: confirmReset },
      { label: 'Zamknij' }
    ],
    onOpen: card => {
      card.querySelector('#soundToggle').addEventListener('click', e => {
        state.sound = !state.sound;
        e.target.textContent = state.sound ? 'Włączone' : 'Wyłączone';
        e.target.classList.toggle('ghost', !state.sound);
        sfx('coin');
        save();
      });
      card.querySelector('#musicToggle').addEventListener('click', e => {
        state.music = !state.music;
        e.target.textContent = state.music ? 'Włączona' : 'Wyłączona';
        e.target.classList.toggle('ghost', !state.music);
        if (state.music) unlockAudio();
        else music.stop();
        save();
      });
      card.querySelector('#gfxToggle').addEventListener('click', () => {
        state.gfx = state.gfx === '2d' ? '3d' : '2d';
        save();
        location.reload();
      });
      card.querySelector('#renameBtn').addEventListener('click', () => {
        nextModal();
        askFarmName();
      });
    }
  });
}

function askFarmName(after) {
  showModal({
    hero: '🏷️',
    title: 'Nazwij gospodarstwo',
    body: `<input class="text-input" id="farmNameInput" maxlength="28" placeholder="np. Złota Dolina" value="${escapeHtml(state.farmName)}" />`,
    buttons: [{
      label: 'Zapisz',
      cls: 'gold',
      onClick: fields => {
        const value = (fields.farmNameInput || '').trim();
        state.farmName = value || 'Złota Dolina';
        save();
        renderAll();
        if (after) after();
      }
    }]
  });
}

function showBackup() {
  let code = '';
  try {
    code = btoa(unescape(encodeURIComponent(JSON.stringify(state))));
  } catch {
    code = '';
  }
  showModal({
    hero: '💾',
    title: 'Kopia zapasowa',
    body: `<p>Skopiuj kod i zachowaj go, aby przenieść gospodarstwo na inny telefon.</p>
      <textarea class="text-input code" id="backupCode" rows="4" readonly>${code}</textarea>
      <p>Albo wklej kod z innego urządzenia:</p>
      <textarea class="text-input code" id="restoreCode" rows="3" placeholder="Wklej kod tutaj"></textarea>`,
    buttons: [
      {
        label: '📋 Kopiuj kod',
        cls: 'ghost',
        keepOpen: true,
        onClick: card => {
          const area = card.querySelector('#backupCode');
          area.select();
          (navigator.clipboard ? navigator.clipboard.writeText(area.value) : Promise.reject())
            .then(() => toast('Skopiowano kod gospodarstwa!'))
            .catch(() => { document.execCommand('copy'); toast('Skopiowano kod gospodarstwa!'); });
        }
      },
      {
        label: 'Wczytaj wklejony kod',
        cls: 'gold',
        onClick: fields => {
          const raw = (fields.restoreCode || '').trim();
          try {
            const restored = parseSave(decodeURIComponent(escape(atob(raw))));
            if (!restored) throw new Error('zły kod');
            localStorage.setItem(SAVE_KEY, JSON.stringify(restored));
            state = restored;
            location.reload();
          } catch {
            sfx('error');
            toast('Ten kod nie wygląda na kopię gospodarstwa.');
          }
        }
      },
      { label: 'Zamknij' }
    ]
  });
}

function confirmReset() {
  showModal({
    hero: '⚠️',
    title: 'Zacząć od nowa?',
    body: '<p>Stracisz całe gospodarstwo, zwierzęta, monety, ulepszenia i ozdoby. Tego nie da się cofnąć.</p>',
    buttons: [
      {
        label: 'Tak, nowa gra',
        cls: 'red',
        onClick: () => {
          const keep = { gfx: state.gfx, sound: state.sound, music: state.music };
          state = Object.assign(newGame(), keep, { seenIntro: true });
          ensureEventSeason();
          save();
          tileSigs.fill('');
          renderAll();
          toast('Nowe gospodarstwo czeka! 🌾');
        }
      },
      { label: 'Anuluj', cls: 'ghost' }
    ]
  });
}

function showIntro() {
  showModal({
    hero: '🏡',
    title: 'Witaj na wsi!',
    body: `<p>Dziadek zostawił Ci małe gospodarstwo. Pszenica już dojrzała — <b>dotknij złotych kłosów</b>, aby je zebrać.</p>
      <p>Jak nazwiesz swoje gospodarstwo?</p>
      <input class="text-input" id="farmNameInput" maxlength="28" placeholder="np. Złota Dolina" />
      ${halloweenActive() ? '<p>A na wsi właśnie trwa <b>Halloween</b> 🎃!</p>' : ''}`,
    buttons: [
      {
        label: 'Zaczynamy! 🌾',
        cls: 'gold',
        onClick: fields => {
          state.farmName = (fields.farmNameInput || '').trim() || 'Złota Dolina';
          state.seenIntro = true;
          save();
          renderAll();
        }
      }
    ]
  });
}

function showWhatsNew() {
  if (state.seenV3 || !state.seenIntro) {
    state.seenV3 = true;
    return;
  }
  state.seenV3 = true;
  showModal({
    hero: '🎉',
    title: 'Wielka aktualizacja!',
    body: `<ul>
      <li>🔨 <b>Warsztat:</b> 10 ulepszeń i pomocnicy, którzy pracują za Ciebie.</li>
      <li>🏘️ <b>Odbudowa wsi:</b> 6 budynków ze stałymi bonusami.</li>
      <li>🌲 <b>Wyprawy do lasu</b> po drewno, kamień i gwoździe.</li>
      <li>🍂 <b>Pory roku</b>, śnieg zimą i nowe uprawy: kapusta i ogórki.</li>
      <li>🎣 <b>Łowienie ryb</b>, 🐦 <b>wrony</b> i ✨ <b>złote plony</b>.</li>
      <li>📜 <b>Kronika</b> z 25 zadaniami i 🏅 <b>45 medali</b> do zdobycia.</li>
      <li>🧳 <b>Wędrowny kupiec</b>, 🎒 wzmacniacze i 🎵 muzyka.</li>
    </ul><p>Na dobry początek: <b>🌟 3 złote kłosy</b> i <b>🪵 10 drewna</b>!</p>`,
    buttons: [{
      label: 'Pokaż mi!',
      cls: 'gold',
      onClick: () => {
        addGold(3);
        addItem('wood', 10);
        save();
        renderAll();
        if (!state.farmName) askFarmName();
      }
    }]
  });
}

function showWhatsNewV4() {
  if (state.seenV4 || !state.seenIntro) {
    state.seenV4 = true;
    return;
  }
  state.seenV4 = true;
  showModal({
    hero: '🍎',
    title: 'Sad, przetwórnia i zima!',
    body: `<ul>
      <li>🍎 <b>Sad:</b> jabłonie, wiśnie, grusze i brzoskwinie sadzisz raz — owocują w kółko. Dwa ule zapylają sad 🐝.</li>
      <li>🏭 <b>Przetwórnia</b> (zakładka Kuchnia): młyn zbożowy, tłocznia soków, mleczarnia, olejarnia i wytwórnia nawozu.</li>
      <li>🥐 <b>Nowe przepisy:</b> frytki, rogaliki maślane, pączki z dżemem, babeczki wiśniowe.</li>
      <li>🥶 <b>Przymrozki zimą</b> — stawiaj 🔥 grzejniki, które palą drewno i ogrzewają grządki dookoła, albo przykryj pole 🧣 agrowłókniną.</li>
      <li>📜 5 nowych zadań i 3 nowe osiągnięcia.</li>
    </ul><p>Na start: <b>🍎 sadzonka jabłoni za darmo</b> (🪙 120 na koncie)!</p>`,
    buttons: [{ label: 'Super!', cls: 'gold', onClick: () => { addCoins(120); save(); renderAll(); } }]
  });
}

function showEventIntro() {
  if (!halloweenActive() || state.event.seenIntro === state.event.year) return;
  state.event.seenIntro = state.event.year;
  showModal({
    hero: '🎃',
    title: 'Halloween na wsi!',
    body: `<p>Po wsi krążą wampirki i duszki, a nad polem latają nietoperze.</p>
      <ul>
        <li>🎃 Dynie rosną już od 1. poziomu.</li>
        <li>🧪 Kociołek czarownicy warzy cukierki i eliksiry.</li>
        <li>👻 Zbieraj punkty i odbieraj ozdoby z bonusami, które zostaną na zawsze.</li>
      </ul>
      <p>Zostało <b>${eventDaysLeft()} dni</b>!</p>`,
    buttons: [{ label: 'Buuu! Gramy 🎃', cls: 'gold', onClick: () => showView('event') }, { label: 'Później', cls: 'ghost' }]
  });
}

/* ---------- Input ---------- */

let drag = null;
const DRAG_ACTIONS = new Set(['plow', 'plant', 'water', 'harvest', 'weed', 'scare', 'fruit']);

function tileFromPoint(x, y) {
  if (farm3d) return farm3d.pick(x, y);
  const el = document.elementFromPoint(x, y);
  const tile = el && el.closest('.tile');
  return tile ? Number(tile.dataset.i) : -1;
}

function bindInput() {
  const surface = farm3d ? $('scene3d') : $('field');

  // One finger works the field (swipe to sow/harvest); on anything else it pans
  // the map. Two fingers pinch-zoom, twist-rotate and pan the 3D camera.
  const pointers = new Map();
  let pending = null;
  let gesture = null;

  const gestureInfo = () => {
    const [a, b] = [...pointers.values()];
    return {
      x: (a.x + b.x) / 2,
      y: (a.y + b.y) / 2,
      dist: Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)),
      angle: Math.atan2(b.y - a.y, b.x - a.x)
    };
  };

  const placesObject = () => TREES[state.seed] || state.seed === 'heater';

  const tapTile = (i, action) => {
    if (i === -2) return openFishing();
    if (i < 0 || !action) return;
    if (action === 'buy') return askBuyTile(i);
    if (action === 'info') return showCropInfo(i);
    if (action === 'treeinfo') return showTreeInfo(i);
    if (action === 'heaterinfo') return showHeaterInfo(i);
    if (doAction(i, action)) save();
  };

  surface.addEventListener('pointerdown', e => {
    unlockAudio();
    e.preventDefault();
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    try { surface.setPointerCapture(e.pointerId); } catch { /* starsze przeglądarki */ }
    if (farm3d) farm3d.stopInertia();
    if (pointers.size === 2 && farm3d) {
      if (drag) save();
      drag = null;
      pending = null;
      gesture = gestureInfo();
      return;
    }
    if (pointers.size > 1) return;
    const i = tileFromPoint(e.clientX, e.clientY);
    const action = i >= 0 ? tileAction(i) : null;
    if (action && DRAG_ACTIONS.has(action) && !(action === 'plant' && placesObject())) {
      if (doAction(i, action)) drag = { action, done: new Set([i]) };
      return;
    }
    pending = { i, action, x: e.clientX, y: e.clientY, lastX: e.clientX, lastY: e.clientY, panning: false };
  });

  surface.addEventListener('pointermove', e => {
    const p = pointers.get(e.pointerId);
    if (!p) return;
    p.x = e.clientX;
    p.y = e.clientY;
    if (gesture && pointers.size >= 2) {
      const g = gestureInfo();
      let turn = g.angle - gesture.angle;
      turn = Math.atan2(Math.sin(turn), Math.cos(turn));
      farm3d.zoomAt(g.dist / gesture.dist, g.x, g.y);
      farm3d.rotateBy(turn);
      farm3d.panBy(g.x - gesture.x, g.y - gesture.y);
      gesture = g;
      return;
    }
    if (drag) {
      if (!DRAG_ACTIONS.has(drag.action)) return;
      const i = tileFromPoint(e.clientX, e.clientY);
      if (i < 0 || drag.done.has(i)) return;
      drag.done.add(i);
      if (tileAction(i) !== drag.action) return;
      if (!doAction(i, drag.action)) drag = null;
      return;
    }
    if (pending) {
      if (!pending.panning && farm3d && Math.hypot(e.clientX - pending.x, e.clientY - pending.y) > 10) pending.panning = true;
      if (pending.panning) farm3d.panBy(e.clientX - pending.lastX, e.clientY - pending.lastY);
      pending.lastX = e.clientX;
      pending.lastY = e.clientY;
    }
  });

  const endPointer = e => {
    if (!pointers.delete(e.pointerId)) return;
    if (gesture) {
      if (pointers.size < 2) gesture = null;
      pending = null;
      return;
    }
    if (drag) {
      save();
      drag = null;
      return;
    }
    if (pending) {
      const pd = pending;
      pending = null;
      if (pd.panning) {
        farm3d.release();
        return;
      }
      if (e.type === 'pointerup') tapTile(pd.i, pd.action);
    }
  };
  surface.addEventListener('pointerup', endPointer);
  surface.addEventListener('pointercancel', endPointer);
  surface.addEventListener('wheel', e => {
    if (!farm3d) return;
    e.preventDefault();
    farm3d.zoomAt(Math.exp(-e.deltaY * 0.0015), e.clientX, e.clientY);
  }, { passive: false });
  $('resetViewBtn').addEventListener('click', () => {
    unlockAudio();
    if (farm3d) farm3d.resetView();
    sfx('plant');
  });

  $('rotateBtn').addEventListener('click', () => {
    unlockAudio();
    if (farm3d) farm3d.rotate(1);
    sfx('plant');
  });
  $('fishBtn').addEventListener('click', () => { unlockAudio(); openFishing(); });
  $('packBtn').addEventListener('click', () => { unlockAudio(); showBackpack(); });
  $('questCard').addEventListener('click', () => { unlockAudio(); showQuest(); });
  $('eventPill').addEventListener('click', () => {
    unlockAudio();
    showView('event');
  });

  $('seedbar').addEventListener('click', e => {
    const btn = e.target.closest('[data-seed]');
    if (!btn) return;
    unlockAudio();
    const id = btn.dataset.seed;
    if (TREES[id] || id === 'heater') {
      const def = TREES[id] || HEATER;
      if (state.level < def.level) {
        toast(`${def.icon} ${def.name} — odblokujesz na poziomie ${def.level}.`);
        return;
      }
      state.seed = id;
      sfx('plant');
      toast(TREES[id]
        ? `${def.icon} ${def.name}: ${rewardText(def.cost)}. Pierwsze owoce po ${fmtTime(def.grow)}, potem co ${fmtTime(def.regrow)}. Dotknij grządki, by posadzić.`
        : `🔥 Grzejnik: ${rewardText(def.cost)}. Zimą ogrzewa grządki dookoła i chroni przed przymrozkiem. Pali drewno 🪵.`);
      renderSeedbar();
      renderHint();
      return;
    }
    const c = cropInfo(id);
    if (state.level < c.level) {
      toast(`${itemLabel(id)} — odblokujesz na poziomie ${c.level}.`);
      return;
    }
    state.seed = id;
    sfx('plant');
    const fav = CROPS[id].seasons.map(s => SEASONS[s].name.toLowerCase()).join(', ');
    toast(`${itemLabel(id)}: 🪙${c.cost}, rośnie ${fmtTime(c.time)}, plon ×${HARVEST_YIELD} (🪙${sellPrice(id)}/szt.). Lubi: ${fav}.`);
    renderSeedbar();
    renderHint();
  });

  document.querySelectorAll('.tabs button').forEach(btn => {
    btn.addEventListener('click', () => {
      unlockAudio();
      showView(btn.dataset.tab);
    });
  });

  const handlers = {
    animal: (arg, el) => tapAnimal(Number(arg), el),
    buyAnimal: arg => buyAnimal(arg),
    slot: (arg, el) => tapSlot(Number(arg), el),
    buySlot: () => buyKitchenSlot(),
    cook: arg => cook(arg),
    cauldron: (arg, el) => tapCauldron(Number(arg), el),
    brew: arg => brew(arg),
    claim: arg => claimMilestone(Number(arg)),
    deliver: (arg, el) => deliverOrder(Number(arg), el),
    skip: arg => skipOrder(Number(arg)),
    sell1: (arg, el) => sellItem(arg, 1, el),
    sellAll: (arg, el) => sellItem(arg, Infinity, el),
    open: arg => showView(arg),
    back: () => showView('more'),
    backpack: () => showBackpack(),
    settings: () => showMenu(),
    help: () => showHelp(),
    upgrade: arg => buyUpgrade(arg),
    hire: arg => hireHelper(arg),
    donate: arg => { const [id, key] = arg.split(':'); donate(id, key); },
    trip: arg => startTrip(arg),
    'trip-collect': () => collectTrip(),
    buyOffer: arg => buyOffer(Number(arg)),
    quest: () => claimQuest(),
    ach: arg => claimAchievement(arg),
    ktab: arg => { kitchenTab = arg; },
    buildProc: arg => buildProcessor(arg),
    proc: arg => { const [pid, rid] = arg.split(':'); startProcess(pid, rid); },
    procslot: (arg, el) => { const [pid, k] = arg.split(':'); tapProcess(pid, Number(k), el); }
  };

  ['animals', 'kitchen', 'orders', 'barn', 'event', 'more', 'workshop', 'village', 'merchant', 'trophies'].forEach(id => {
    $(id).addEventListener('click', e => {
      const el = e.target.closest('[data-act]');
      if (!el || el.disabled) return;
      unlockAudio();
      handlers[el.dataset.act](el.dataset.arg, el);
      renderAll();
    });
  });

  $('feedAllBtn').addEventListener('click', () => {
    unlockAudio();
    let fed = 0;
    state.animals.forEach((a, idx) => {
      if (a.s === 'hungry' && tapAnimal(idx, $('feedAllBtn'), true)) fed++;
    });
    if (!fed) toast('Brakuje paszy. Wyhoduj ją na polu!');
    save();
    renderAll();
  });

  $('collectAllBtn').addEventListener('click', () => {
    unlockAudio();
    state.animals.forEach((a, idx) => {
      if (a.s === 'ready') tapAnimal(idx, $('collectAllBtn'), true);
    });
    save();
    renderAll();
  });

  $('menuBtn').addEventListener('click', () => { unlockAudio(); showMenu(); });
  $('levelBtn').addEventListener('click', () => {
    toast(`⭐ Poziom ${state.level}: ${state.xp}/${xpNeeded(state.level)} XP do następnego.`);
  });

  window.addEventListener('resize', fitField);
  if ('ResizeObserver' in window) new ResizeObserver(fitField).observe(farm3d ? $('scene') : $('fieldWrap'));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      save();
      music.stop();
    } else if (state.music && audio) {
      music.start();
    }
    if (farm3d) farm3d.setActive(activeView === 'farm' && !document.hidden);
  });
  window.addEventListener('pagehide', save);
}

/* ---------- Main loop ---------- */

let lastTick = Date.now();
let saveTimer = 0;
let dailyTimer = 0;
let lastClaimables = 0;

function tick() {
  const now = Date.now();
  const dt = Math.min(now - lastTick, MAX_OFFLINE);
  lastTick = now;
  if (dt <= 0) return;
  let events;
  if (dt > 10000) {
    events = simulate(dt);
  } else {
    events = advanceWorld(dt);
    runHelpers(dt, false);
    crowTick(dt);
    frostTick();
  }
  advanceClock(Math.min(dt, 10000));
  if (events.crops && activeView !== 'farm' && !helperLvl('jozek')) toast(`🌾 Plony dojrzały (${events.crops})!`);
  tipTimer += dt;
  if (tipTimer > 9000) {
    tipTimer = 0;
    tipIndex++;
  }
  saveTimer += dt;
  if (saveTimer > 5000) {
    saveTimer = 0;
    save();
  }
  dailyTimer += dt;
  if (dailyTimer > 30000) {
    dailyTimer = 0;
    ensureEventSeason();
    if (!modalOpen && state.seenIntro) checkDaily();
  }
  const claimables = claimableAchievements() + (questProgress().done ? 1 : 0);
  if (claimables > lastClaimables) {
    sfx('golden');
    toast(questProgress().done ? '📜 Zadanie wykonane! Odbierz nagrodę.' : '🏅 Nowe osiągnięcie do odebrania w Trofeach!');
  }
  lastClaimables = claimables;
  renderAll();
}

function welcomeBack() {
  const away = Math.min(Date.now() - (state.lastSave || Date.now()), MAX_OFFLINE);
  if (away < 60000) return;
  const ev = simulate(away);
  const lines = [];
  if (ev.crops) lines.push(`<li>🌾 Dojrzało upraw: <b>${ev.crops}</b></li>`);
  if (ev.harvested) lines.push(`<li>👨‍🌾 Józek zebrał plony: <b>${ev.harvested}</b> razy</li>`);
  if (ev.animals) lines.push(`<li>🐔 Zwierzęta przygotowały produkty: <b>${ev.animals}</b></li>`);
  if (ev.collected) lines.push(`<li>👩‍🌾 Basia zebrała produkty: <b>${ev.collected}</b></li>`);
  if (ev.kitchen) lines.push(`<li>🍳 Gotowe potrawy: <b>${ev.kitchen}</b></li>`);
  if (state.trip && state.trip.left <= 0) lines.push('<li>🌲 Wyprawa wróciła z lasu!</li>');
  showModal({
    hero: '👋',
    title: 'Witaj z powrotem!',
    body: `<p>Nie było Cię ${fmtTime(away / 1000)}.</p>${lines.length ? `<ul>${lines.join('')}</ul>` : '<p>Na wsi panował spokój.</p>'}`,
    buttons: [{ label: 'Do roboty!', cls: 'gold' }]
  });
}

function initGraphics() {
  if (state.gfx !== '2d') {
    try {
      farm3d = createFarm3D($('scene3d'), {
        cols: COLS,
        rows: ROWS,
        tile: tileInfo,
        hour: hourOfDay,
        weather: () => state.weather,
        season: seasonIndex,
        halloween: halloweenActive,
        decor: () => state.decor,
        animals: () => state.animals,
        animalProduct: type => ITEMS[ANIMALS[type].product].icon,
        helpers: () => state.helpers,
        helperTarget: () => helperTarget,
        dog: () => upg('dog') > 0,
        greenhouse: () => upg('greenhouse') > 0,
        projects: () => Object.keys(state.projects).filter(projectDone),
        processors: () => Object.keys(state.processors),
        frostNight: () => frostTonight() && hourOfDay() >= 20,
        fishingReady: () => state.level >= FISHING_LEVEL && state.fishCd <= 0
      });
    } catch (err) {
      console.warn('3D niedostępne, używam grafiki 2D', err);
      farm3d = null;
    }
  }
  document.body.classList.toggle('gfx-3d', !!farm3d);
  document.body.classList.toggle('gfx-2d', !farm3d);
  if (!farm3d) buildField();
}

function init() {
  initGraphics();
  bindInput();
  ensureEventSeason();
  ensureDeals();
  delete state.daily.pending;
  if (state.seenIntro) welcomeBack();
  else showIntro();
  showWhatsNew();
  showWhatsNewV4();
  showEventIntro();
  checkDaily();
  while (state.orders.length < orderSlots()) state.orders.push(makeOrder());
  lastClaimables = claimableAchievements() + (questProgress().done ? 1 : 0);
  fitField();
  renderAll();
  if (farm3d) farm3d.setActive(!document.hidden);
  lastTick = Date.now();
  setInterval(tick, 250);

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    });
  }
}

// Uchwyt do debugowania z konsoli przeglądarki.
window.wz = {
  get state() { return state; },
  set state(v) { state = v; },
  addXp, save, nextModal, modalQueue, cropReady, claimMilestone, showView, simulate, openFishing, DAY_LENGTH, SAVE_KEY,
  get farm3d() { return farm3d; }
};

init();
