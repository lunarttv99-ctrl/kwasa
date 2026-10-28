import { createFarm3D } from './farm3d.js';

const SAVE_KEY = 'wiejskie_zycie_save_v1';
const COLS = 6;
const ROWS = 7;
const DAY_LENGTH = 8 * 60 * 1000;
const MAX_OFFLINE = 12 * 60 * 60 * 1000;
const DRY_SPEED = 0.5;
const HARVEST_YIELD = 2;
const KITCHEN_LEVEL = 3;
const MAX_KITCHEN_SLOTS = 3;
const KITCHEN_SLOT_PRICE = 400;
const DAILY_REWARDS = [20, 30, 45, 60, 80, 100, 150];

const ITEMS = {
  wheat:       { name: 'Pszenica', icon: '🌾', price: 3 },
  carrot:      { name: 'Marchew', icon: '🥕', price: 7 },
  potato:      { name: 'Ziemniaki', icon: '🥔', price: 12 },
  corn:        { name: 'Kukurydza', icon: '🌽', price: 18 },
  tomato:      { name: 'Pomidory', icon: '🍅', price: 26 },
  sunflower:   { name: 'Słonecznik', icon: '🌻', price: 32 },
  strawberry:  { name: 'Truskawki', icon: '🍓', price: 45 },
  pumpkin:     { name: 'Dynia', icon: '🎃', price: 70 },
  egg:         { name: 'Jajka', icon: '🥚', price: 14 },
  milk:        { name: 'Mleko', icon: '🥛', price: 40 },
  honey:       { name: 'Miód', icon: '🍯', price: 60 },
  wool:        { name: 'Wełna', icon: '🧶', price: 55 },
  bread:       { name: 'Chleb wiejski', icon: '🍞', price: 16 },
  popcorn:     { name: 'Popcorn', icon: '🍿', price: 50 },
  pancakes:    { name: 'Placki ziemniaczane', icon: '🥞', price: 75 },
  soup:        { name: 'Pomidorówka', icon: '🍲', price: 120 },
  cheese:      { name: 'Ser', icon: '🧀', price: 120 },
  honeycake:   { name: 'Miodownik', icon: '🍰', price: 115 },
  jam:         { name: 'Dżem truskawkowy', icon: '🫙', price: 190 },
  sweater:     { name: 'Sweter', icon: '🧥', price: 165 },
  pie:         { name: 'Placek dyniowy', icon: '🥧', price: 160 },
  candy:       { name: 'Cukierki', icon: '🍬', price: 30 },
  pumpkinsoup: { name: 'Zupa dyniowa', icon: '🥣', price: 110 },
  ghostcookie: { name: 'Ciastka-duszki', icon: '🍪', price: 150 },
  potion:      { name: 'Eliksir czarownicy', icon: '🧪', price: 230 }
};

const CROPS = {
  wheat:      { level: 1, cost: 1,  time: 20,  xp: 1 },
  carrot:     { level: 1, cost: 3,  time: 45,  xp: 2 },
  potato:     { level: 2, cost: 6,  time: 90,  xp: 3 },
  corn:       { level: 3, cost: 10, time: 150, xp: 4 },
  tomato:     { level: 4, cost: 15, time: 240, xp: 5 },
  sunflower:  { level: 5, cost: 20, time: 300, xp: 6 },
  strawberry: { level: 6, cost: 28, time: 420, xp: 8 },
  pumpkin:    { level: 8, cost: 45, time: 600, xp: 12 }
};

const ANIMALS = {
  chicken: { name: 'Kura', icon: '🐔', level: 2, cost: 40,  feed: { wheat: 1 },     time: 60,  product: 'egg',   xp: 2, max: 6 },
  cow:     { name: 'Krowa', icon: '🐄', level: 4, cost: 150, feed: { corn: 1 },      time: 150, product: 'milk',  xp: 4, max: 4 },
  bee:     { name: 'Ul z pszczołami', icon: '🐝', level: 5, cost: 200, feed: { sunflower: 1 }, time: 200, product: 'honey', xp: 5, max: 4 },
  sheep:   { name: 'Owca', icon: '🐑', level: 7, cost: 320, feed: { carrot: 2 },    time: 240, product: 'wool',  xp: 6, max: 4 }
};

const RECIPES = {
  bread:     { level: 3, time: 45,  input: { wheat: 3 }, xp: 3 },
  popcorn:   { level: 3, time: 60,  input: { corn: 2 }, xp: 4 },
  pancakes:  { level: 4, time: 90,  input: { potato: 3, egg: 1 }, xp: 6 },
  soup:      { level: 5, time: 120, input: { tomato: 3, carrot: 1 }, xp: 7 },
  cheese:    { level: 5, time: 150, input: { milk: 2 }, xp: 8 },
  honeycake: { level: 6, time: 150, input: { honey: 1, wheat: 2, egg: 1 }, xp: 8 },
  jam:       { level: 7, time: 180, input: { strawberry: 3 }, xp: 10 },
  sweater:   { level: 7, time: 210, input: { wool: 2 }, xp: 10 },
  pie:       { level: 8, time: 240, input: { pumpkin: 1, egg: 2, wheat: 2 }, xp: 12 }
};

const HALLOWEEN = {
  pumpkin: { level: 1, cost: 30, time: 240, xp: 6 },
  harvestPoints: 2,
  recipes: {
    candy:       { time: 45,  input: { pumpkin: 1, wheat: 2 }, out: 3, points: 3 },
    pumpkinsoup: { time: 90,  input: { pumpkin: 1, carrot: 2 }, out: 1, points: 5 },
    ghostcookie: { time: 120, input: { candy: 2, wheat: 2, egg: 1 }, out: 1, points: 8 },
    potion:      { time: 180, input: { pumpkin: 1, honey: 1, candy: 1 }, out: 1, points: 12 }
  },
  npcs: [
    ['🧛', 'Wampirek Staś'],
    ['🧙‍♀️', 'Czarownica Wiesia'],
    ['👻', 'Duszek Kacperek'],
    ['🧟', 'Zombie Zenek'],
    ['💀', 'Kościotrup Kazio']
  ],
  requests: ['Cukierek albo psikus!', 'Na bal przebierańców:', 'Do mojego kociołka:', 'Buuu! Poproszę:'],
  milestones: [
    { points: 20, coins: 150, label: '🪙 150 monet' },
    { points: 50, decor: 'lanterns', label: '🎃 Lampiony na płocie', perk: 'Nocą rośliny rosną o 25% szybciej.' },
    { points: 100, decor: 'scarecrow', label: '🧙 Strach na wróble czarownicy', perk: '15% szans na podwójny plon.' },
    { points: 170, coins: 600, label: '🪙 600 monet' },
    { points: 260, decor: 'ghost', label: '👻 Przyjazny duszek', perk: 'Zwierzęta produkują o 20% szybciej.' },
    { points: 380, decor: 'goldpumpkin', coins: 1000, label: '🌟 Złota dynia + 🪙 1000', perk: 'Stodoła płaci o 10% więcej.' }
  ]
};

const NPCS = [
  ['👵', 'Babcia Jadzia'],
  ['👴', 'Dziadek Stefan'],
  ['🧔', 'Sołtys Zbyszek'],
  ['👩‍🌾', 'Pani Halinka'],
  ['👨‍🍳', 'Kucharz Mietek'],
  ['👩‍🦰', 'Ciocia Krysia'],
  ['👨‍🔧', 'Kowal Heniek'],
  ['👧', 'Mała Zosia'],
  ['🧑‍🏫', 'Pan Leszek ze szkoły'],
  ['👮', 'Dzielnicowy Waldek']
];

const REQUESTS = [
  'Poproszę o:',
  'Potrzebuję na obiad:',
  'Na festyn we wsi:',
  'Do sklepiku pod lipą:',
  'Na imieniny szwagra:',
  'Na niedzielne śniadanie:'
];

const TIPS = [
  'Przeciągnij palcem po polu, aby siać lub zbierać kilka grządek naraz.',
  '💧 Podlane rośliny rosną dwa razy szybciej. Deszcz podlewa za darmo!',
  'Zamówienia sąsiadów płacą więcej niż sprzedaż na targu.',
  'Dotknij drzewa z ceną, aby powiększyć gospodarstwo.',
  'Gospodarstwo rośnie także, gdy gra jest zamknięta.',
  'Chwasty pojawiają się rano na pustych grządkach — wyrwij je!',
  '⟳ Obróć kamerę, aby zobaczyć gospodarstwo z innej strony.'
];

const HALLOWEEN_TIPS = [
  '🎃 Halloween! Dynie rosną już od 1. poziomu — zbieraj je dla punktów 👻.',
  '🧪 W kociołku czarownicy zrobisz cukierki i eliksiry.',
  '🧛 Potwory z wioski płacą punktami 👻 za słodycze.'
];

const DECO = ['🌳', '🌲', '🪨', '🌳', '🌲', '🍄', '🌳', '🌿'];
const ORDER_SLOTS = 3;

const $ = id => document.getElementById(id);
const rand = n => Math.floor(Math.random() * n);
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
    stats: { harvested: 0, orders: 0, earned: 0 },
    lastSave: Date.now()
  });
}

function migrate(data) {
  data.event = data.event || { year: 0, points: 0, claimed: [], cauldron: [null, null] };
  data.event.cauldron = data.event.cauldron || [null, null];
  data.decor = data.decor || [];
  data.daily = data.daily || { last: '', streak: 0 };
  data.gfx = data.gfx || '3d';
  data.tiles.forEach(t => {
    if (t.s === 'crop' && !t.T) t.T = CROPS[t.crop].time * 1000;
  });
  return data;
}

function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || data.v !== 1 || !Array.isArray(data.tiles) || data.tiles.length !== COLS * ROWS) return null;
    return migrate(data);
  } catch {
    return null;
  }
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

/* ---------- Sound ---------- */

let audio = null;

function unlockAudio() {
  if (!audio) {
    try {
      audio = new (window.AudioContext || window.webkitAudioContext)();
    } catch {
      audio = null;
    }
  }
  if (audio && audio.state === 'suspended') audio.resume();
}

function tone(freq, dur, type = 'sine', vol = 0.12, delay = 0) {
  const t = audio.currentTime + delay;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
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
  toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
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
  if (!el) return;
  const r = el.getBoundingClientRect();
  floatText(r.left + r.width / 2, r.top + r.height / 2 - offset, text, cls);
}

function tilePoint(i) {
  if (farm3d) return farm3d.screenPos(i);
  const r = tileEls[i].getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

function floatAtTile(i, text, cls, offset = 0) {
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

function showModal(opts) {
  modalQueue.push(opts);
  if (!modalOpen) nextModal();
}

function nextModal() {
  const opts = modalQueue.shift();
  if (!opts) {
    modalOpen = false;
    $('modal').classList.add('hidden');
    return;
  }
  modalOpen = true;
  const card = $('modalCard');
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
    btn.addEventListener('click', () => {
      unlockAudio();
      nextModal();
      if (b.onClick) b.onClick();
    });
    actions.appendChild(btn);
  });
  if (opts.onOpen) opts.onOpen(card);
  $('modal').classList.remove('hidden');
}

/* ---------- Progression ---------- */

function addCoins(n) {
  state.coins += n;
  if (n > 0) state.stats.earned += n;
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
  state.xp += n;
  while (state.xp >= xpNeeded(state.level)) {
    state.xp -= xpNeeded(state.level);
    state.level++;
    onLevelUp(state.level);
  }
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
  Object.entries(RECIPES).forEach(([id, r]) => { if (r.level === level) list.push(`${ITEMS[id].icon} Przepis: ${ITEMS[id].name}`); });
  return list;
}

function onLevelUp(level) {
  sfx('level');
  buzz(30);
  const bonus = 20 * level;
  addCoins(bonus);
  const unlocks = unlocksAt(level);
  showModal({
    hero: '🎉',
    title: `Poziom ${level}!`,
    body: `<p>Twoje gospodarstwo kwitnie. Premia: <b>🪙 ${bonus}</b></p>` +
      (unlocks.length ? `<p><b>Nowości:</b></p><ul>${unlocks.map(u => `<li>${u}</li>`).join('')}</ul>` : ''),
    buttons: [{ label: 'Super!', cls: 'gold' }]
  });
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
  showModal({
    hero: state.tiles[i].deco,
    title: 'Powiększyć pole?',
    body: `<p>Wykarczowanie tego kawałka ziemi kosztuje <b>🪙 ${price}</b>.</p>`,
    buttons: [
      {
        label: `Kup za 🪙 ${price}`,
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
          addXp(2);
          sfx('plow');
          renderAll();
          pulseTile(i);
          floatAtTile(i, `-${price} 🪙`, 'minus');
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
  return state.weather === 'rain';
}

function isNight() {
  const h = hourOfDay();
  return h >= 21 || h < 5;
}

function tileAction(i) {
  const t = state.tiles[i];
  switch (t.s) {
    case 'locked': return canBuyTile(i) ? 'buy' : null;
    case 'grass': return 'plow';
    case 'soil': return t.weed ? 'weed' : 'plant';
    case 'crop': return cropReady(t) ? 'harvest' : t.w ? 'info' : 'water';
    default: return null;
  }
}

function doAction(i, action) {
  const t = state.tiles[i];
  switch (action) {
    case 'plow':
      state.tiles[i] = { s: 'soil' };
      sfx('plow');
      break;
    case 'plant': {
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
      addCoins(-crop.cost);
      state.tiles[i] = { s: 'crop', crop: state.seed, p: 0, T: crop.time * 1000, w: isRaining() };
      floatAtTile(i, `-${crop.cost} 🪙`, 'minus');
      sfx('plant');
      break;
    }
    case 'water':
      t.w = true;
      floatAtTile(i, '💧');
      sfx('water');
      break;
    case 'harvest': {
      const crop = cropInfo(t.crop);
      const lucky = hasDecor('scarecrow') && Math.random() < 0.15;
      const amount = HARVEST_YIELD * (lucky ? 2 : 1);
      addItem(t.crop, amount);
      state.stats.harvested += amount;
      floatAtTile(i, `+${amount} ${ITEMS[t.crop].icon}${lucky ? ' ✨' : ''}`, '', 8);
      floatAtTile(i, `+${crop.xp} ⭐`, 'xp', -12);
      if (t.crop === 'pumpkin' && halloweenActive()) {
        addPoints(HALLOWEEN.harvestPoints);
        floatAtTile(i, `+${HALLOWEEN.harvestPoints} 👻`, 'spooky', 34);
      }
      state.tiles[i] = { s: 'soil' };
      addXp(crop.xp);
      sfx('harvest');
      buzz();
      break;
    }
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
  if (!farm3d) renderTile(i);
  renderHud();
  return true;
}

function showCropInfo(i) {
  const t = state.tiles[i];
  const left = (cropTotal(t) - t.p) / 1000 / (t.w ? 1 : DRY_SPEED);
  toast(`${itemLabel(t.crop)} — gotowe za ok. ${fmtTime(left)}`);
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
  if (state.level < a.level || owned >= a.max) return;
  if (state.coins < price) {
    sfx('error');
    toast('Za mało monet.');
    return;
  }
  addCoins(-price);
  state.animals.push({ type, s: 'hungry', p: 0 });
  sfx('cluck');
  toast(`${a.icon} Nowy mieszkaniec zagrody: ${a.name}!`);
  save();
}

function tapAnimal(idx, el, quiet = false) {
  const animal = state.animals[idx];
  if (!animal) return false;
  const a = ANIMALS[animal.type];
  if (animal.s === 'ready') {
    addItem(a.product, 1);
    addXp(a.xp);
    animal.s = 'hungry';
    animal.p = 0;
    floatAt(el, `+1 ${ITEMS[a.product].icon}`, '', 8);
    floatAt(el, `+${a.xp} ⭐`, 'xp', -12);
    sfx('harvest');
    return true;
  }
  if (animal.s === 'hungry') {
    if (!hasItems(a.feed)) {
      if (!quiet) {
        sfx('error');
        const need = Object.entries(a.feed).map(([id, n]) => `${ITEMS[id].icon} ×${n}`).join(', ');
        toast(`${a.name} potrzebuje: ${need}. Wyhoduj to na polu!`);
      }
      return false;
    }
    takeItems(a.feed);
    animal.s = 'busy';
    animal.p = 0;
    floatAt(el, Object.keys(a.feed).map(id => ITEMS[id].icon).join(''));
    sfx('cluck');
    return true;
  }
  if (!quiet) toast(`${a.name}: ${ITEMS[a.product].name} za ${fmtTime((a.time * 1000 - animal.p) / 1000 / animalSpeed())}`);
  return false;
}

function animalSpeed() {
  return hasDecor('ghost') ? 1.2 : 1;
}

/* ---------- Kitchen & cauldron ---------- */

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

function tapSlot(idx, el) {
  const slot = state.kitchen[idx];
  if (!slot) return;
  const r = RECIPES[slot.r];
  if (slot.p >= r.time * 1000) {
    addItem(slot.r, 1);
    addXp(r.xp);
    state.kitchen[idx] = null;
    floatAt(el, `+1 ${ITEMS[slot.r].icon}`, '', 8);
    floatAt(el, `+${r.xp} ⭐`, 'xp', -12);
    sfx('harvest');
    save();
  } else {
    toast(`${itemLabel(slot.r)} — gotowe za ${fmtTime(r.time - slot.p / 1000)}`);
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
  if (slot.p >= r.time * 1000) {
    addItem(slot.r, r.out);
    addXp(r.points);
    addPoints(r.points);
    state.event.cauldron[idx] = null;
    floatAt(el, `+${r.out} ${ITEMS[slot.r].icon}`, '', 8);
    floatAt(el, `+${r.points} 👻`, 'spooky', -12);
    sfx('harvest');
    save();
  } else {
    toast(`${itemLabel(slot.r)} — gotowe za ${fmtTime(r.time - slot.p / 1000)}`);
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
  const r = RECIPES[id];
  if (r) return state.level >= r.level && Object.keys(r.input).every(canProduce);
  const er = HALLOWEEN.recipes[id];
  if (er) return halloweenActive() && Object.keys(er.input).every(canProduce);
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
  if (halloweenActive() && Math.random() < 0.4) {
    const pool = ['pumpkin', ...Object.keys(HALLOWEEN.recipes)].filter(canProduce);
    const { items, value } = pickItems(pool, 2, 60 + state.level * 10);
    const [face, name] = pick(HALLOWEEN.npcs);
    return {
      face,
      name,
      text: pick(HALLOWEEN.requests),
      items,
      coins: Math.round(value * 1.3 + 5),
      xp: Math.max(2, Math.round(value / 8)),
      pts: Math.max(3, Math.round(value / 10)),
      ev: true
    };
  }
  const pool = Object.keys(ITEMS).filter(id => !HALLOWEEN.recipes[id] && canProduce(id));
  const { items, value } = pickItems(pool, 3, 18 + state.level * 8);
  const [face, name] = pick(NPCS);
  return {
    face,
    name,
    text: pick(REQUESTS),
    items,
    coins: Math.round(value * 1.4 + 5),
    xp: Math.max(2, Math.round(value / 6))
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
  addXp(order.xp);
  if (order.pts) addPoints(order.pts);
  state.stats.orders++;
  state.orders[idx] = { wait: 15000, total: 15000 };
  floatAt(el, `+${order.coins} 🪙`, '', 10);
  floatAt(el, `+${order.xp} ⭐`, 'xp', -14);
  if (order.pts) floatAt(el, `+${order.pts} 👻`, 'spooky', 36);
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

/* ---------- Barn ---------- */

function sellPrice(id) {
  return Math.round(ITEMS[id].price * (hasDecor('goldpumpkin') ? 1.1 : 1));
}

function sellItem(id, n, el) {
  const qty = Math.min(n, inv(id));
  if (qty <= 0) return;
  const gain = qty * sellPrice(id);
  addItem(id, -qty);
  addCoins(gain);
  floatAt(el, `+${gain} 🪙`);
  sfx('coin');
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
  const coins = DAILY_REWARDS[idx];
  const candy = halloweenActive() ? 2 + idx : 0;
  state.daily.pending = today;
  const days = DAILY_REWARDS.map((c, k) =>
    `<span class="day-cell${k < idx ? ' done' : ''}${k === idx ? ' today' : ''}"><small>Dzień ${k + 1}</small>${k === DAILY_REWARDS.length - 1 ? '🎁' : '🪙'}<b>${c}</b></span>`).join('');
  showModal({
    hero: '🎁',
    title: 'Codzienna nagroda',
    body: `<p>Wracaj codziennie — im dłuższa seria, tym lepsza nagroda!</p><div class="daily-row">${days}</div>${candy ? `<p>🎃 Bonus Halloween: <b>🍬 ${candy} cukierków</b></p>` : ''}`,
    buttons: [{
      label: `Odbierz 🪙 ${coins}${candy ? ` + 🍬 ${candy}` : ''}`,
      cls: 'gold',
      onClick: () => {
        state.daily = { last: today, streak };
        addCoins(coins);
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
  const nightBoost = hasDecor('lanterns') && isNight() ? 1.25 : 1;
  state.tiles.forEach(t => {
    if (t.s !== 'crop') return;
    if (raining) t.w = true;
    const total = cropTotal(t);
    if (t.p >= total) return;
    t.p = Math.min(total, t.p + dt * (t.w ? 1 : DRY_SPEED) * nightBoost);
    if (t.p >= total) events.crops++;
  });
  const aSpeed = animalSpeed();
  state.animals.forEach(animal => {
    if (animal.s !== 'busy') return;
    animal.p += dt * aSpeed;
    if (animal.p >= ANIMALS[animal.type].time * 1000) {
      animal.s = 'ready';
      events.animals++;
    }
  });
  const cooking = (slot, total) => {
    if (!slot || slot.p >= total) return;
    slot.p = Math.min(total, slot.p + dt);
    if (slot.p >= total) events.kitchen++;
  };
  state.kitchen.forEach(slot => slot && cooking(slot, RECIPES[slot.r].time * 1000));
  state.event.cauldron.forEach(slot => slot && cooking(slot, HALLOWEEN.recipes[slot.r].time * 1000));
  state.orders.forEach((order, idx) => {
    if (order.wait === undefined) return;
    order.wait -= dt;
    if (order.wait <= 0) state.orders[idx] = makeOrder();
  });
  while (state.orders.length < ORDER_SLOTS) state.orders.push(makeOrder());
  return events;
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
  const roll = Math.random();
  state.weather = roll < 0.22 ? 'rain' : roll < 0.45 ? 'cloudy' : 'sunny';
  let weeds = 0;
  state.tiles.forEach(t => {
    if (t.s === 'soil' && !t.weed && Math.random() < 0.15) {
      t.weed = true;
      weeds++;
    }
  });
  const weatherText = { rain: '🌧️ Pada deszcz — rośliny same się podlewają!', cloudy: '⛅ Pochmurno.', sunny: '☀️ Słoneczny dzień.' }[state.weather];
  toast(`Dzień ${state.day}. ${weatherText}${weeds ? ' Wyrosły chwasty.' : ''}`);
}

function hourOfDay() {
  return (6 + (state.dayTime / DAY_LENGTH) * 24) % 24;
}

/* ---------- Rendering: HUD & 2D sky ---------- */

function renderHud() {
  $('coins').textContent = state.coins.toLocaleString('pl-PL');
  $('level').textContent = state.level;
  $('xpFill').style.width = `${Math.min(100, (state.xp / xpNeeded(state.level)) * 100)}%`;
  $('dayNum').textContent = `Dzień ${state.day}`;
  const h = hourOfDay();
  const minutes = Math.floor(((h % 1) * 60) / 10) * 10;
  $('clock').textContent = `${String(Math.floor(h)).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  $('weatherIcon').textContent = state.weather === 'rain' ? '🌧️' : state.weather === 'cloudy' ? '⛅' : isNight() ? '🌙' : '☀️';

  const readyAnimals = state.animals.filter(a => a.s === 'ready').length;
  const readyKitchen = state.kitchen.filter(s => s && s.p >= RECIPES[s.r].time * 1000).length;
  const readyOrders = state.orders.filter(o => o.wait === undefined && hasItems(o.items)).length;
  const readyCauldron = state.event.cauldron.filter(s => s && s.p >= HALLOWEEN.recipes[s.r].time * 1000).length;
  $('badge-animals').textContent = readyAnimals || '';
  $('badge-kitchen').textContent = readyKitchen || '';
  $('badge-orders').textContent = readyOrders || '';
  $('badge-event').textContent = claimableMilestones() + readyCauldron || '';

  const event = halloweenActive();
  document.body.classList.toggle('halloween', event);
  $('eventTab').classList.toggle('hidden', !event);
  $('eventPill').classList.toggle('hidden', !event);
  if (event) $('eventPillPts').textContent = state.event.points;
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
  const gray = state.weather === 'rain' ? 0.5 : state.weather === 'cloudy' ? 0.28 : 0;
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
  sun.style.opacity = state.weather === 'rain' ? 0.35 : 1;

  $('nightShade').style.opacity = darkness(h);
  $('view-farm').classList.toggle('raining', isRaining());
}

/* ---------- Rendering: field (3D or 2D) ---------- */

let farm3d = null;
const tileEls = [];
const tileSigs = [];

function tileInfo(i) {
  const t = state.tiles[i];
  const info = { s: t.s, deco: t.deco, buyable: false, price: 0, crop: t.crop, f: 0, ready: false, wet: !!t.w, weed: !!t.weed };
  if (t.s === 'locked') {
    info.buyable = canBuyTile(i);
    info.price = info.buyable ? landPrice() : 0;
  } else if (t.s === 'crop') {
    info.f = Math.min(1, t.p / cropTotal(t));
    info.ready = info.f >= 1;
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
  if (t.s === 'locked') {
    const buyable = canBuyTile(i);
    return {
      cls: `tile t-locked${buyable ? ' buyable' : ''}`,
      html: `<span class="deco">${t.deco}</span>${buyable ? `<span class="price">🪙${landPrice()}</span>` : ''}`
    };
  }
  if (t.s === 'grass') return { cls: 'tile t-grass', html: '' };
  if (t.s === 'soil') return { cls: 'tile t-soil', html: t.weed ? '<span class="plant weed">🌿</span>' : '' };
  const ready = cropReady(t);
  const stage = ready ? 2 : t.p / cropTotal(t) < 0.5 ? 0 : 1;
  const icon = stage === 0 ? '🌱' : ITEMS[t.crop].icon;
  return {
    cls: `tile t-soil stage${stage}${t.w ? ' wet' : ''}${ready ? ' ready' : ''}`,
    html: `<span class="plant">${icon}</span>${!t.w && !ready ? '<span class="drop">💧</span>' : ''}${ready ? '' : '<span class="pbar"><i></i></span>'}`
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
  if (t.s === 'crop' && !cropReady(t)) {
    const bar = el.querySelector('.pbar i');
    if (bar) bar.style.width = `${(t.p / cropTotal(t)) * 100}%`;
  }
}

function renderField() {
  for (let i = 0; i < tileEls.length; i++) renderTile(i);
}

function renderSeedbar() {
  const event = halloweenActive();
  const html = Object.keys(CROPS).map(id => {
    const c = cropInfo(id);
    const locked = state.level < c.level;
    const special = event && id === 'pumpkin';
    const cls = `seed${locked ? ' locked' : ''}${state.seed === id ? ' selected' : ''}${special ? ' event' : ''}`;
    return `<button class="${cls}" type="button" data-seed="${id}" role="option" aria-selected="${state.seed === id}">
      ${special ? '<em class="seed-tag">Halloween</em>' : ''}
      <span class="icon">${ITEMS[id].icon}</span>
      <span class="cost">${locked ? `🔒 ${c.level}` : `🪙${c.cost}`}</span>
      <span class="time">${fmtTime(c.time)}</span>
    </button>`;
  }).join('');
  patch($('seedbar'), html);
}

let tipIndex = 0;
let tipTimer = 0;

function renderHint() {
  const crop = cropInfo(state.seed);
  const tips = halloweenActive() ? [...HALLOWEEN_TIPS, ...TIPS] : TIPS;
  let text;
  if (state.coins < crop.cost && !state.tiles.some(cropReady)) text = '🪙 Brak monet na nasiona — sprzedaj plony w Stodole.';
  else if (state.tiles.some(t => t.s === 'crop' && !t.w && !cropReady(t)) && !isRaining()) text = '💧 Dotknij spragnionej rośliny, aby ją podlać — urośnie 2× szybciej.';
  else text = tips[tipIndex % tips.length];
  if ($('hint').textContent !== text) $('hint').textContent = text;
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
    const total = (kind === 'k' ? RECIPES[slot.r] : HALLOWEEN.recipes[slot.r]).time * 1000;
    return { f: slot.p / total, text: fmtTime((total - slot.p) / 1000) };
  }
  if (kind === 'o') {
    const order = state.orders[idx];
    if (!order || order.wait === undefined) return null;
    return { f: 1 - order.wait / order.total, text: fmtTime(order.wait / 1000) };
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
    const have = inv(id);
    return `<span class="chip ${have >= n ? 'ok' : 'miss'}">${ITEMS[id].icon} ${Math.min(have, n)}/${n}</span>`;
  }).join('');
}

function renderAnimals() {
  const html = Object.entries(ANIMALS).map(([type, a]) => {
    if (state.level < a.level) {
      return `<div class="card locked"><div class="big-icon">${a.icon}</div><b>${a.name}</b><p>🔒 Odblokujesz na poziomie ${a.level}</p></div>`;
    }
    const mine = state.animals.map((x, idx) => ({ x, idx })).filter(o => o.x.type === type);
    const price = animalPrice(type);
    const full = mine.length >= a.max;
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
          <h3>${a.name} <small>${mine.length}/${a.max}</small></h3>
          <p>Je: ${Object.entries(a.feed).map(([id, n]) => `${ITEMS[id].icon}×${n}`).join(' ')} · Daje: ${ITEMS[a.product].icon} co ${fmtTime(a.time / animalSpeed())}</p>
        </div>
        <button class="btn small gold" type="button" data-act="buyAnimal" data-arg="${type}" ${full || state.coins < price ? 'disabled' : ''}>${full ? 'Pełno' : `🪙 ${price}`}</button>
      </div>
      ${mine.length ? `<div class="pen">${pen}</div>` : '<p class="empty">Kup pierwsze zwierzę — zobaczysz je w zagrodzie za polem.</p>'}
    </div>`;
  }).join('');
  const box = $('animals');
  patch(box, html);
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
  return `<button class="slot kitchen-slot ${extraCls}" type="button" data-act="${act}" data-arg="${idx}"><span class="main">${icon}</span><span class="ptext"></span><span class="pbar" data-bar="${kind}:${idx}"><i></i></span></button>`;
}

function renderKitchen() {
  const box = $('kitchen');
  if (state.level < KITCHEN_LEVEL) {
    patch(box, `<div class="card locked"><div class="big-icon">🍳</div><b>Kuchnia jest zamknięta</b><p>🔒 Odblokujesz ją na poziomie ${KITCHEN_LEVEL}. Przerabiaj plony na droższe przysmaki!</p></div>`);
    return;
  }
  const slots = state.kitchen.map((slot, idx) => slotButton('k', idx, slot, slot ? RECIPES[slot.r].time * 1000 : 0));
  if (state.kitchen.length < MAX_KITCHEN_SLOTS) {
    slots.push(`<button class="slot kitchen-slot empty-slot" type="button" data-act="buySlot">➕ Palnik<br>🪙 ${KITCHEN_SLOT_PRICE}</button>`);
  }
  const free = state.kitchen.some(s => s === null);
  const recipes = Object.entries(RECIPES).map(([id, r]) => {
    if (state.level < r.level) {
      return `<div class="recipe locked"><span class="big-icon">${ITEMS[id].icon}</span><div class="grow"><h4>${ITEMS[id].name}</h4><div class="meta">🔒 Poziom ${r.level}</div></div></div>`;
    }
    const ok = hasItems(r.input);
    return `<div class="recipe">
      <span class="big-icon">${ITEMS[id].icon}</span>
      <div class="grow">
        <h4>${ITEMS[id].name}</h4>
        <div class="chips">${chipsFor(r.input)}</div>
        <div class="meta">⏱ ${fmtTime(r.time)} · wartość 🪙 ${sellPrice(id)}</div>
      </div>
      <button class="btn small" type="button" data-act="cook" data-arg="${id}" ${ok && free ? '' : 'disabled'}>Gotuj</button>
    </div>`;
  }).join('');
  patch(box, `<div class="card"><div class="kitchen-slots">${slots.join('')}</div></div><div class="card">${recipes}</div>`);
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
      <div class="reward"><span>🪙 ${order.coins}</span><span>⭐ ${order.xp}</span>${order.pts ? `<span>👻 ${order.pts}</span>` : ''}</div>
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
  const ids = Object.keys(ITEMS).filter(id => inv(id) > 0);
  const total = ids.reduce((sum, id) => sum + inv(id) * sellPrice(id), 0);
  $('barnValue').textContent = ids.length ? `Wartość: 🪙 ${total}` : '';
  const rows = ids.map(id => `<div class="barn-row">
      <span class="big-icon">${ITEMS[id].icon}</span>
      <div class="grow"><b>${ITEMS[id].name} ×${inv(id)}</b><p class="meta">🪙 ${sellPrice(id)} / szt.</p></div>
      <button class="btn small ghost" type="button" data-act="sell1" data-arg="${id}">Sprzedaj 1</button>
      <button class="btn small gold" type="button" data-act="sellAll" data-arg="${id}">Wszystko</button>
    </div>`).join('');
  patch($('barn'), ids.length ? `<div class="card">${rows}</div>` : '<div class="card"><p class="empty">Stodoła jest pusta. Zbierz plony z pola! 🌾</p></div>');
}

function renderEvent() {
  const box = $('event');
  if (!halloweenActive()) {
    patch(box, '<div class="card locked"><div class="big-icon">🎃</div><b>Halloween się skończył</b><p>Zdobyte ozdoby zostają w gospodarstwie na zawsze. Do zobaczenia za rok!</p></div>');
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
  patch(box, `
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

let activeTab = 'farm';

function renderAll() {
  renderHud();
  if (activeTab === 'farm') {
    if (!farm3d) {
      renderSky();
      renderField();
    }
    renderSeedbar();
    renderHint();
  } else if (activeTab === 'animals') renderAnimals();
  else if (activeTab === 'kitchen') renderKitchen();
  else if (activeTab === 'orders') renderOrders();
  else if (activeTab === 'barn') renderBarn();
  else if (activeTab === 'event') renderEvent();
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

function switchTab(tab) {
  activeTab = tab;
  document.querySelectorAll('.tabs button').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.id === `view-${tab}`));
  if (farm3d) farm3d.setActive(tab === 'farm' && !document.hidden);
  if (tab === 'farm') fitField();
  renderAll();
}

/* ---------- Menus ---------- */

function showHelp() {
  showModal({
    hero: '👨‍🌾',
    title: 'Jak grać?',
    body: `<ul>
      <li>🌱 <b>Pole:</b> dotknij trawy, by zaorać. Wybierz nasiona na dole i dotknij grządki, by zasiać. Możesz przeciągać palcem!</li>
      <li>💧 <b>Podlewanie:</b> podlana roślina rośnie 2× szybciej.</li>
      <li>🧺 <b>Zbiory:</b> dojrzałe rośliny mają złotą obwódkę — dotknij, by zebrać.</li>
      <li>⟳ <b>Kamera:</b> przycisk w rogu obraca widok gospodarstwa.</li>
      <li>🐔 <b>Zagroda:</b> karm zwierzęta plonami i zbieraj jajka, mleko, miód i wełnę.</li>
      <li>🍳 <b>Kuchnia:</b> przerabiaj produkty na droższe przysmaki.</li>
      <li>📋 <b>Zamówienia:</b> sąsiedzi płacą najlepiej i dają dużo ⭐.</li>
      <li>🏚️ <b>Stodoła:</b> tu trzymasz zbiory i sprzedajesz je za monety.</li>
      <li>🎁 <b>Codzienna nagroda:</b> wracaj każdego dnia, aby zwiększać serię.</li>
      <li>🎃 <b>Wydarzenia:</b> w Halloween zbieraj 👻 i zdobywaj ozdoby z bonusami.</li>
    </ul>`,
    buttons: [{ label: 'Do roboty!', cls: 'gold' }]
  });
}

function showMenu() {
  const s = state.stats;
  showModal({
    hero: '⚙️',
    title: 'Gospodarstwo',
    body: `<ul>
        <li>📅 Dni na wsi: <b>${state.day}</b></li>
        <li>🧺 Zebrane plony: <b>${s.harvested}</b></li>
        <li>📋 Spełnione zamówienia: <b>${s.orders}</b></li>
        <li>🪙 Zarobione monety: <b>${s.earned}</b></li>
        <li>🔥 Seria codziennych nagród: <b>${state.daily.streak}</b></li>
      </ul>
      <div class="toggle-row"><span>🔊 Dźwięki</span><button class="btn small ${state.sound ? '' : 'ghost'}" id="soundToggle" type="button">${state.sound ? 'Włączone' : 'Wyłączone'}</button></div>
      <div class="toggle-row"><span>🎨 Grafika</span><button class="btn small" id="gfxToggle" type="button">${state.gfx === '2d' ? 'Klasyczna 2D' : 'Pełne 3D'}</button></div>`,
    buttons: [
      { label: 'Jak grać?', cls: 'ghost', onClick: showHelp },
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
      card.querySelector('#gfxToggle').addEventListener('click', () => {
        state.gfx = state.gfx === '2d' ? '3d' : '2d';
        save();
        location.reload();
      });
    }
  });
}

function confirmReset() {
  showModal({
    hero: '⚠️',
    title: 'Zacząć od nowa?',
    body: '<p>Stracisz całe gospodarstwo, zwierzęta, monety i ozdoby. Tego nie da się cofnąć.</p>',
    buttons: [
      {
        label: 'Tak, nowa gra',
        cls: 'red',
        onClick: () => {
          const gfx = state.gfx;
          state = newGame();
          state.seenIntro = true;
          state.gfx = gfx;
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
      <p>Potem siej, podlewaj, hoduj zwierzęta i pomagaj sąsiadom.${halloweenActive() ? ' A na wsi właśnie trwa <b>Halloween</b> 🎃!' : ''}</p>`,
    buttons: [
      { label: 'Zaczynamy! 🌾', cls: 'gold', onClick: () => { state.seenIntro = true; save(); } },
      { label: 'Jak grać?', cls: 'ghost', onClick: () => { state.seenIntro = true; save(); showHelp(); } }
    ]
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
    buttons: [{ label: 'Buuu! Gramy 🎃', cls: 'gold', onClick: () => switchTab('event') }, { label: 'Później', cls: 'ghost' }]
  });
}

/* ---------- Input ---------- */

let drag = null;
const DRAG_ACTIONS = new Set(['plow', 'plant', 'water', 'harvest', 'weed']);

function tileFromPoint(x, y) {
  if (farm3d) return farm3d.pick(x, y);
  const el = document.elementFromPoint(x, y);
  const tile = el && el.closest('.tile');
  return tile ? Number(tile.dataset.i) : -1;
}

function bindInput() {
  const surface = farm3d ? $('scene3d') : $('field');

  surface.addEventListener('pointerdown', e => {
    unlockAudio();
    const i = tileFromPoint(e.clientX, e.clientY);
    if (i < 0) return;
    e.preventDefault();
    const action = tileAction(i);
    if (action === 'buy') return askBuyTile(i);
    if (action === 'info') return showCropInfo(i);
    if (!action || !doAction(i, action)) return;
    drag = { action, done: new Set([i]) };
    try { surface.setPointerCapture(e.pointerId); } catch { /* starsze przeglądarki */ }
  });

  surface.addEventListener('pointermove', e => {
    if (!drag || !DRAG_ACTIONS.has(drag.action)) return;
    const i = tileFromPoint(e.clientX, e.clientY);
    if (i < 0 || drag.done.has(i)) return;
    drag.done.add(i);
    if (tileAction(i) !== drag.action) return;
    if (!doAction(i, drag.action)) drag = null;
  });

  const endDrag = () => {
    if (drag) save();
    drag = null;
  };
  surface.addEventListener('pointerup', endDrag);
  surface.addEventListener('pointercancel', endDrag);
  surface.addEventListener('lostpointercapture', endDrag);

  $('rotateBtn').addEventListener('click', () => {
    unlockAudio();
    if (farm3d) farm3d.rotate(1);
    sfx('plant');
  });
  $('eventPill').addEventListener('click', () => {
    unlockAudio();
    switchTab('event');
  });

  $('seedbar').addEventListener('click', e => {
    const btn = e.target.closest('[data-seed]');
    if (!btn) return;
    unlockAudio();
    const id = btn.dataset.seed;
    const c = cropInfo(id);
    if (state.level < c.level) {
      toast(`${itemLabel(id)} — odblokujesz na poziomie ${c.level}.`);
      return;
    }
    state.seed = id;
    sfx('plant');
    toast(`${itemLabel(id)}: 🪙${c.cost}, rośnie ${fmtTime(c.time)}, plon ×${HARVEST_YIELD} (🪙${sellPrice(id)}/szt.)`);
    renderSeedbar();
    renderHint();
  });

  document.querySelectorAll('.tabs button').forEach(btn => {
    btn.addEventListener('click', () => {
      unlockAudio();
      switchTab(btn.dataset.tab);
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
    sellAll: (arg, el) => sellItem(arg, Infinity, el)
  };

  ['animals', 'kitchen', 'orders', 'barn', 'event'].forEach(id => {
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
    if (document.hidden) save();
    if (farm3d) farm3d.setActive(activeTab === 'farm' && !document.hidden);
  });
  window.addEventListener('pagehide', save);
}

/* ---------- Main loop ---------- */

let lastTick = Date.now();
let saveTimer = 0;
let dailyTimer = 0;

function tick() {
  const now = Date.now();
  const dt = Math.min(now - lastTick, MAX_OFFLINE);
  lastTick = now;
  if (dt <= 0) return;
  const events = advanceWorld(dt);
  advanceClock(dt);
  if (events.crops && activeTab !== 'farm') toast(`🌾 Plony dojrzały (${events.crops})!`);
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
  renderAll();
}

function welcomeBack() {
  const away = Math.min(Date.now() - (state.lastSave || Date.now()), MAX_OFFLINE);
  if (away < 60000) return;
  const events = advanceWorld(away);
  const lines = [];
  if (events.crops) lines.push(`<li>🌾 Dojrzało upraw: <b>${events.crops}</b></li>`);
  if (events.animals) lines.push(`<li>🐔 Zwierzęta czekają z produktami: <b>${events.animals}</b></li>`);
  if (events.kitchen) lines.push(`<li>🍳 Gotowe potrawy: <b>${events.kitchen}</b></li>`);
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
        halloween: halloweenActive,
        decor: () => state.decor,
        animals: () => state.animals,
        animalProduct: type => ITEMS[ANIMALS[type].product].icon
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
  delete state.daily.pending;
  if (state.seenIntro) welcomeBack();
  else showIntro();
  showEventIntro();
  checkDaily();
  while (state.orders.length < ORDER_SLOTS) state.orders.push(makeOrder());
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
  addXp, save, nextModal, modalQueue, cropReady, claimMilestone, DAY_LENGTH, SAVE_KEY,
  get farm3d() { return farm3d; }
};

init();
