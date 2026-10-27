'use strict';

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

const ITEMS = {
  wheat:      { name: 'Pszenica', icon: '🌾', price: 3 },
  carrot:     { name: 'Marchew', icon: '🥕', price: 7 },
  potato:     { name: 'Ziemniaki', icon: '🥔', price: 12 },
  corn:       { name: 'Kukurydza', icon: '🌽', price: 18 },
  tomato:     { name: 'Pomidory', icon: '🍅', price: 26 },
  sunflower:  { name: 'Słonecznik', icon: '🌻', price: 32 },
  strawberry: { name: 'Truskawki', icon: '🍓', price: 45 },
  pumpkin:    { name: 'Dynia', icon: '🎃', price: 70 },
  egg:        { name: 'Jajka', icon: '🥚', price: 14 },
  milk:       { name: 'Mleko', icon: '🥛', price: 40 },
  honey:      { name: 'Miód', icon: '🍯', price: 60 },
  wool:       { name: 'Wełna', icon: '🧶', price: 55 },
  bread:      { name: 'Chleb wiejski', icon: '🍞', price: 16 },
  popcorn:    { name: 'Popcorn', icon: '🍿', price: 50 },
  pancakes:   { name: 'Placki ziemniaczane', icon: '🥞', price: 75 },
  soup:       { name: 'Pomidorówka', icon: '🍲', price: 120 },
  cheese:     { name: 'Ser', icon: '🧀', price: 120 },
  honeycake:  { name: 'Miodownik', icon: '🍰', price: 115 },
  jam:        { name: 'Dżem truskawkowy', icon: '🫙', price: 190 },
  sweater:    { name: 'Sweter', icon: '🧥', price: 165 },
  pie:        { name: 'Placek dyniowy', icon: '🥧', price: 160 }
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
  'Zwierzęta trzeba karmić plonami z pola.'
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

/* ---------- State ---------- */

function newGame() {
  const tiles = [];
  for (let i = 0; i < COLS * ROWS; i++) {
    const r = Math.floor(i / COLS);
    const c = i % COLS;
    if (r < 2 || r > 4 || c < 1 || c > 4) tiles.push({ s: 'locked', deco: DECO[(i * 7 + 3) % DECO.length] });
    else if (r === 2) tiles.push({ s: 'crop', crop: 'wheat', p: CROPS.wheat.time * 1000, w: true });
    else if (r === 3) tiles.push({ s: 'soil' });
    else tiles.push({ s: 'grass' });
  }
  const game = {
    v: 1,
    coins: 40,
    xp: 0,
    level: 1,
    tiles,
    landBought: 0,
    inv: {},
    animals: [],
    kitchen: [null, null],
    orders: [],
    day: 1,
    dayTime: DAY_LENGTH * 0.08,
    weather: 'sunny',
    seed: 'wheat',
    sound: true,
    seenIntro: false,
    stats: { harvested: 0, orders: 0, earned: 0 },
    lastSave: Date.now()
  };
  game.orders = [
    { npc: 0, text: REQUESTS[0], items: { wheat: 4 }, coins: 25, xp: 4 },
    { npc: 3, text: REQUESTS[1], items: { wheat: 2, carrot: 2 }, coins: 30, xp: 5 },
    { wait: 20000, total: 20000 }
  ];
  return game;
}

function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || data.v !== 1 || !Array.isArray(data.tiles) || data.tiles.length !== COLS * ROWS) return null;
    return data;
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
  const deco = state.tiles[i].deco;
  showModal({
    hero: deco,
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
          const el = tileEls[i];
          el.classList.add('pop');
          floatAt(el, `-${price} 🪙`, 'minus');
          save();
        }
      },
      { label: 'Nie teraz', cls: 'ghost' }
    ]
  });
}

/* ---------- Field ---------- */

function cropReady(t) {
  return t.s === 'crop' && t.p >= CROPS[t.crop].time * 1000;
}

function isRaining() {
  return state.weather === 'rain';
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
  const el = tileEls[i];
  switch (action) {
    case 'plow':
      state.tiles[i] = { s: 'soil' };
      sfx('plow');
      break;
    case 'plant': {
      const crop = CROPS[state.seed];
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
      state.tiles[i] = { s: 'crop', crop: state.seed, p: 0, w: isRaining() };
      floatAt(el, `-${crop.cost} 🪙`, 'minus');
      sfx('plant');
      break;
    }
    case 'water':
      t.w = true;
      floatAt(el, '💧');
      sfx('water');
      break;
    case 'harvest': {
      const crop = CROPS[t.crop];
      addItem(t.crop, HARVEST_YIELD);
      state.stats.harvested += HARVEST_YIELD;
      floatAt(el, `+${HARVEST_YIELD} ${ITEMS[t.crop].icon}`, '', 8);
      floatAt(el, `+${crop.xp} ⭐`, 'xp', -12);
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
      floatAt(el, '+2 🪙');
      sfx('plow');
      break;
    default:
      return false;
  }
  el.classList.remove('pop');
  void el.offsetWidth;
  el.classList.add('pop');
  renderTile(i);
  renderHud();
  return true;
}

function showCropInfo(i) {
  const t = state.tiles[i];
  const left = (CROPS[t.crop].time * 1000 - t.p) / 1000 / (t.w ? 1 : DRY_SPEED);
  toast(`${itemLabel(t.crop)} — gotowe za ${fmtTime(left)}`);
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
  if (!quiet) toast(`${a.name}: ${ITEMS[a.product].name} za ${fmtTime(a.time - animal.p / 1000)}`);
  return false;
}

/* ---------- Kitchen ---------- */

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

/* ---------- Orders ---------- */

function canProduce(id) {
  if (CROPS[id]) return state.level >= CROPS[id].level;
  const animal = Object.values(ANIMALS).find(a => a.product === id);
  if (animal) return state.animals.some(a => ANIMALS[a.type].product === id);
  const r = RECIPES[id];
  if (r) return state.level >= r.level && Object.keys(r.input).every(canProduce);
  return false;
}

function makeOrder() {
  const pool = Object.keys(ITEMS).filter(canProduce);
  const count = 1 + rand(Math.min(3, pool.length));
  const items = {};
  let value = 0;
  for (let k = 0; k < count; k++) {
    const id = pick(pool);
    if (items[id]) continue;
    const price = ITEMS[id].price;
    const qty = Math.max(1, Math.min(8, Math.round(((18 + state.level * 8) / price) * (0.6 + Math.random() * 0.8))));
    items[id] = qty;
    value += qty * price;
  }
  return {
    npc: rand(NPCS.length),
    text: pick(REQUESTS),
    items,
    coins: Math.round(value * 1.4 + 5),
    xp: Math.max(2, Math.round(value / 6))
  };
}

function deliverOrder(idx, el) {
  const order = state.orders[idx];
  if (!order || order.wait !== undefined || !hasItems(order.items)) return;
  takeItems(order.items);
  addCoins(order.coins);
  addXp(order.xp);
  state.stats.orders++;
  state.orders[idx] = { wait: 15000, total: 15000 };
  floatAt(el, `+${order.coins} 🪙`, '', 10);
  floatAt(el, `+${order.xp} ⭐`, 'xp', -14);
  sfx('coin');
  buzz(15);
  toast(`${NPCS[order.npc][1]} dziękuje! 😊`);
  save();
}

function skipOrder(idx) {
  const order = state.orders[idx];
  if (!order || order.wait !== undefined) return;
  showModal({
    hero: NPCS[order.npc][0],
    title: 'Odrzucić zamówienie?',
    body: `<p>${NPCS[order.npc][1]} pójdzie gdzie indziej. Nowy klient przyjdzie za chwilę.</p>`,
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

function sellItem(id, n, el) {
  const qty = Math.min(n, inv(id));
  if (qty <= 0) return;
  const gain = qty * ITEMS[id].price;
  addItem(id, -qty);
  addCoins(gain);
  floatAt(el, `+${gain} 🪙`);
  sfx('coin');
  save();
}

/* ---------- Simulation ---------- */

function advanceWorld(dt) {
  const events = { crops: 0, animals: 0, kitchen: 0 };
  const raining = isRaining();
  state.tiles.forEach(t => {
    if (t.s !== 'crop') return;
    if (raining) t.w = true;
    const total = CROPS[t.crop].time * 1000;
    if (t.p >= total) return;
    t.p = Math.min(total, t.p + dt * (t.w ? 1 : DRY_SPEED));
    if (t.p >= total) events.crops++;
  });
  state.animals.forEach(animal => {
    if (animal.s !== 'busy') return;
    animal.p += dt;
    if (animal.p >= ANIMALS[animal.type].time * 1000) {
      animal.s = 'ready';
      events.animals++;
    }
  });
  state.kitchen.forEach(slot => {
    if (!slot) return;
    const total = RECIPES[slot.r].time * 1000;
    if (slot.p >= total) return;
    slot.p = Math.min(total, slot.p + dt);
    if (slot.p >= total) events.kitchen++;
  });
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

/* ---------- Rendering: HUD & sky ---------- */

function renderHud() {
  $('coins').textContent = state.coins.toLocaleString('pl-PL');
  $('level').textContent = state.level;
  $('xpFill').style.width = `${Math.min(100, (state.xp / xpNeeded(state.level)) * 100)}%`;
  $('dayNum').textContent = `Dzień ${state.day}`;
  const h = hourOfDay();
  const minutes = Math.floor(((h % 1) * 60) / 10) * 10;
  $('clock').textContent = `${String(Math.floor(h)).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  const night = h >= 21 || h < 5;
  $('weatherIcon').textContent = state.weather === 'rain' ? '🌧️' : state.weather === 'cloudy' ? '⛅' : night ? '🌙' : '☀️';

  const readyAnimals = state.animals.filter(a => a.s === 'ready').length;
  const readyKitchen = state.kitchen.filter(s => s && s.p >= RECIPES[s.r].time * 1000).length;
  const readyOrders = state.orders.filter(o => o.wait === undefined && hasItems(o.items)).length;
  $('badge-animals').textContent = readyAnimals || '';
  $('badge-kitchen').textContent = readyKitchen || '';
  $('badge-orders').textContent = readyOrders || '';
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

/* ---------- Rendering: field ---------- */

const tileEls = [];
const tileSigs = [];

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
  const stage = ready ? 2 : t.p / (CROPS[t.crop].time * 1000) < 0.5 ? 0 : 1;
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
    if (bar) bar.style.width = `${(t.p / (CROPS[t.crop].time * 1000)) * 100}%`;
  }
}

function renderField() {
  for (let i = 0; i < tileEls.length; i++) renderTile(i);
}

function renderSeedbar() {
  const html = Object.entries(CROPS).map(([id, c]) => {
    const locked = state.level < c.level;
    const cls = `seed${locked ? ' locked' : ''}${state.seed === id ? ' selected' : ''}`;
    return `<button class="${cls}" type="button" data-seed="${id}" role="option" aria-selected="${state.seed === id}">
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
  const crop = CROPS[state.seed];
  let text;
  if (state.coins < crop.cost && !state.tiles.some(cropReady)) text = '🪙 Brak monet na nasiona — sprzedaj plony w Stodole.';
  else if (state.tiles.some(t => t.s === 'crop' && !t.w && !cropReady(t)) && !isRaining()) text = '💧 Dotknij spragnionej rośliny, aby ją podlać — urośnie 2× szybciej.';
  else text = TIPS[tipIndex % TIPS.length];
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
    return { f: animal.p / total, text: fmtTime((total - animal.p) / 1000) };
  }
  if (kind === 'k') {
    const slot = state.kitchen[idx];
    if (!slot) return null;
    const total = RECIPES[slot.r].time * 1000;
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

function chipsFor(items, check = true) {
  return Object.entries(items).map(([id, n]) => {
    const have = inv(id);
    const cls = !check ? '' : have >= n ? 'ok' : 'miss';
    return `<span class="chip ${cls}">${ITEMS[id].icon} ${check ? `${Math.min(have, n)}/${n}` : `×${n}`}</span>`;
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
          <p>Je: ${Object.entries(a.feed).map(([id, n]) => `${ITEMS[id].icon}×${n}`).join(' ')} · Daje: ${ITEMS[a.product].icon} co ${fmtTime(a.time)}</p>
        </div>
        <button class="btn small gold" type="button" data-act="buyAnimal" data-arg="${type}" ${full || state.coins < price ? 'disabled' : ''}>${full ? 'Pełno' : `🪙 ${price}`}</button>
      </div>
      ${mine.length ? `<div class="pen">${pen}</div>` : '<p class="empty">Kup pierwsze zwierzę, aby zacząć hodowlę.</p>'}
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

function renderKitchen() {
  const box = $('kitchen');
  if (state.level < KITCHEN_LEVEL) {
    patch(box, `<div class="card locked"><div class="big-icon">🍳</div><b>Kuchnia jest zamknięta</b><p>🔒 Odblokujesz ją na poziomie ${KITCHEN_LEVEL}. Przerabiaj plony na droższe przysmaki!</p></div>`);
    return;
  }
  const slots = state.kitchen.map((slot, idx) => {
    if (!slot) return '<div class="slot kitchen-slot empty-slot">Wolny palnik</div>';
    const r = RECIPES[slot.r];
    if (slot.p >= r.time * 1000) {
      return `<button class="slot kitchen-slot ready" type="button" data-act="slot" data-arg="${idx}"><span class="main">${ITEMS[slot.r].icon}</span><span class="bubble">✅</span></button>`;
    }
    return `<button class="slot kitchen-slot" type="button" data-act="slot" data-arg="${idx}"><span class="main">${ITEMS[slot.r].icon}</span><span class="ptext"></span><span class="pbar" data-bar="k:${idx}"><i></i></span></button>`;
  });
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
        <div class="meta">⏱ ${fmtTime(r.time)} · wartość 🪙 ${ITEMS[id].price}</div>
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
    const [face, name] = NPCS[order.npc];
    const ok = hasItems(order.items);
    return `<div class="card order">
      <div class="card-head">
        <span class="npc">${face}</span>
        <div class="grow"><h3>${name}</h3><p>${order.text}</p></div>
      </div>
      <div class="chips">${chipsFor(order.items)}</div>
      <div class="reward"><span>🪙 ${order.coins}</span><span>⭐ ${order.xp}</span></div>
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
  const total = ids.reduce((sum, id) => sum + inv(id) * ITEMS[id].price, 0);
  $('barnValue').textContent = ids.length ? `Wartość: 🪙 ${total}` : '';
  const rows = ids.map(id => `<div class="barn-row">
      <span class="big-icon">${ITEMS[id].icon}</span>
      <div class="grow"><b>${ITEMS[id].name} ×${inv(id)}</b><p class="meta">🪙 ${ITEMS[id].price} / szt.</p></div>
      <button class="btn small ghost" type="button" data-act="sell1" data-arg="${id}">Sprzedaj 1</button>
      <button class="btn small gold" type="button" data-act="sellAll" data-arg="${id}">Wszystko</button>
    </div>`).join('');
  patch($('barn'), ids.length ? `<div class="card">${rows}</div>` : '<div class="card"><p class="empty">Stodoła jest pusta. Zbierz plony z pola! 🌾</p></div>');
}

let activeTab = 'farm';

function renderAll() {
  renderHud();
  if (activeTab === 'farm') {
    renderSky();
    renderField();
    renderSeedbar();
    renderHint();
  } else if (activeTab === 'animals') renderAnimals();
  else if (activeTab === 'kitchen') renderKitchen();
  else if (activeTab === 'orders') renderOrders();
  else if (activeTab === 'barn') renderBarn();
}

function fitField() {
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
      <li>🧺 <b>Zbiory:</b> dojrzałe rośliny błyszczą — dotknij, by zebrać.</li>
      <li>🐔 <b>Zagroda:</b> karm zwierzęta plonami i zbieraj jajka, mleko, miód i wełnę.</li>
      <li>🍳 <b>Kuchnia:</b> przerabiaj produkty na droższe przysmaki.</li>
      <li>📋 <b>Zamówienia:</b> sąsiedzi płacą najlepiej i dają dużo ⭐.</li>
      <li>🏚️ <b>Stodoła:</b> tu trzymasz zbiory i sprzedajesz je za monety.</li>
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
      </ul>
      <div class="toggle-row"><span>🔊 Dźwięki</span><button class="btn small ${state.sound ? '' : 'ghost'}" id="soundToggle" type="button">${state.sound ? 'Włączone' : 'Wyłączone'}</button></div>`,
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
    }
  });
}

function confirmReset() {
  showModal({
    hero: '⚠️',
    title: 'Zacząć od nowa?',
    body: '<p>Stracisz całe gospodarstwo, zwierzęta i monety. Tego nie da się cofnąć.</p>',
    buttons: [
      {
        label: 'Tak, nowa gra',
        cls: 'red',
        onClick: () => {
          state = newGame();
          state.seenIntro = true;
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
      <p>Potem siej, podlewaj, hoduj zwierzęta i pomagaj sąsiadom. Powodzenia, gospodarzu!</p>`,
    buttons: [
      { label: 'Zaczynamy! 🌾', cls: 'gold', onClick: () => { state.seenIntro = true; save(); } },
      { label: 'Jak grać?', cls: 'ghost', onClick: () => { state.seenIntro = true; save(); showHelp(); } }
    ]
  });
}

/* ---------- Input ---------- */

let drag = null;
const DRAG_ACTIONS = new Set(['plow', 'plant', 'water', 'harvest', 'weed']);

function tileFromPoint(x, y) {
  const el = document.elementFromPoint(x, y);
  const tile = el && el.closest('.tile');
  return tile ? Number(tile.dataset.i) : -1;
}

function bindInput() {
  const field = $('field');

  field.addEventListener('pointerdown', e => {
    unlockAudio();
    const i = tileFromPoint(e.clientX, e.clientY);
    if (i < 0) return;
    e.preventDefault();
    const action = tileAction(i);
    if (action === 'buy') return askBuyTile(i);
    if (action === 'info') return showCropInfo(i);
    if (!action || !doAction(i, action)) return;
    drag = { action, done: new Set([i]) };
    try { field.setPointerCapture(e.pointerId); } catch { /* starsze przeglądarki */ }
  });

  field.addEventListener('pointermove', e => {
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
  field.addEventListener('pointerup', endDrag);
  field.addEventListener('pointercancel', endDrag);
  field.addEventListener('lostpointercapture', endDrag);

  $('seedbar').addEventListener('click', e => {
    const btn = e.target.closest('[data-seed]');
    if (!btn) return;
    unlockAudio();
    const id = btn.dataset.seed;
    const c = CROPS[id];
    if (state.level < c.level) {
      toast(`${itemLabel(id)} — odblokujesz na poziomie ${c.level}.`);
      return;
    }
    state.seed = id;
    sfx('plant');
    toast(`${itemLabel(id)}: 🪙${c.cost}, rośnie ${fmtTime(c.time)}, plon ×${HARVEST_YIELD} (🪙${ITEMS[id].price}/szt.)`);
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
    deliver: (arg, el) => deliverOrder(Number(arg), el),
    skip: arg => skipOrder(Number(arg)),
    sell1: (arg, el) => sellItem(arg, 1, el),
    sellAll: (arg, el) => sellItem(arg, Infinity, el)
  };

  ['animals', 'kitchen', 'orders', 'barn'].forEach(id => {
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
  if ('ResizeObserver' in window) new ResizeObserver(fitField).observe($('fieldWrap'));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) save();
  });
  window.addEventListener('pagehide', save);
}

/* ---------- Main loop ---------- */

let lastTick = Date.now();
let saveTimer = 0;

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

function init() {
  buildField();
  bindInput();
  if (state.seenIntro) welcomeBack();
  else showIntro();
  while (state.orders.length < ORDER_SLOTS) state.orders.push(makeOrder());
  fitField();
  renderAll();
  lastTick = Date.now();
  setInterval(tick, 250);

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    });
  }
}

init();
