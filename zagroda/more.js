// Mechaniki z oryginału: wędkowanie, kopalnia, kawiarnia, egzotyczny sklep, dom do urządzenia,
// kurort nad morzem, plan podróży, wydarzenia, zadania dnia, wycieczki, Dom Zbiorów,
// pokój malucha, ranczo, maszyny, ulepszenia budynków i automatyzacja.

import {
  ITEMS, CROPS, ANIMALS, BUILDINGS, DECOR, STORAGE, UPGRADES, FISHING, MINE, FURNITURE, RESORT, TRIPS,
  EVENTS, DAILY_TASKS, CAFE, EXOTIC, CUSTOMERS
} from './data.js';
import {
  G, $, now, fmt, fmtTime, icon, iconRaw, esc, pick, dayStr, toast, tip, addXP, addCoins, addItem, takeItems, has, hasRoom,
  balance, canPay, pay, costText, costHTML, openSheet, rerenderSheet, closeSheet, openModal, closeModal, emit, updateHUD,
  saveSoon, centerOf, findFree, rebuildOcc, openNeighbors, startPlace, preview, card, isBuilt, plant, harvest, readyJobs,
  jobTime, slotsOf, orderPool, setTool, collectJobs
} from './game.js';
import { sfx } from './sound.js';

const rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const findB = kind => G.state.objects.find(o => o.t === 'b' && BUILDINGS[o.k].kind === kind && o.built);
const built = k => G.state.objects.some(o => o.t === 'b' && o.k === k && o.built);

// ---------- stan ----------
export function initState(S) {
  S.shells ??= 0; S.medals ??= 0; S.auto ??= 0; S.tickets ??= 0;
  S.boost ??= { fert: 3, fuel: 2 };
  S.stash ??= [];
  S.home ??= { f: {}, claim: '' };
  S.cafe ??= { day: '', reqs: [] };
  S.exotic ??= { next: 0, offers: [] };
  S.resort ??= { open: false, b: { inn: 1, beach: 1, pier: 0, kiosk: 0 }, guests: [], next: 0, kiosk: 0 };
  S.trip ??= null;
  S.dtasks ??= { day: '', list: [], bonus: false };
  S.event ??= { id: '', tokens: 0 };
  S.rod ??= { n: FISHING.maxCasts, t: Date.now() };
  S.stats ??= { orders: 0 };
  S.stats.fish ??= 0;
}

// ---------- wydarzenia sezonowe ----------
function season() {
  const m = new Date().getMonth();
  return Object.keys(EVENTS).find(id => EVENTS[id].months.includes(m));
}
export function tokenIcon() { return EVENTS[season()].token; }
function syncEvent() {
  const id = season();
  if (G.state.event.id !== id) G.state.event = { id, tokens: 0 };
}

// Zdarzenia z gry: postęp zadań dnia i żetony wydarzenia.
export function onEmit(type, k, n) {
  const S = G.state;
  if (!S.dtasks) return;
  for (const t of S.dtasks.list) {
    if (t.t === type && !t.done) { t.p = Math.min(t.n, t.p + n); if (t.p >= t.n) { t.done = true; toast(`✅ Zadanie dnia: ${t.name}!`); } }
  }
  if (S.level >= 3) {
    let tokens = 0;
    if (type === 'order') tokens = 2;
    else if (['harvest', 'collect', 'fish', 'produce'].includes(type) && Math.random() < 0.1) tokens = 1;
    if (tokens) { syncEvent(); S.event.tokens += tokens; toast(`+${tokens} ${tokenIcon()} (${EVENTS[S.event.id].name})`); }
  }
}

// ---------- zadania dnia ----------
function ensureDaily() {
  const S = G.state;
  const today = dayStr();
  if (S.dtasks.day === today) return;
  const pool = DAILY_TASKS.filter(t => (t.lvl || 0) <= S.level && (t.t !== 'fish' || built('pier')));
  const list = [];
  while (list.length < 3 && pool.length) {
    const t = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
    const n = Math.round(t.n[0] + (t.n[1] - t.n[0]) * Math.min(1, S.level / 25));
    list.push({ t: t.t, name: t.name, icon: t.icon, n, p: 0, done: false, claimed: false });
  }
  S.dtasks = { day: today, list, bonus: false };
}
function dailyReward() {
  const L = G.state.level;
  return { coins: 80 + 30 * L, tickets: 1, auto: L >= 10 ? 1 : 0 };
}
function openDailyTasks() {
  ensureDaily();
  openSheet('Zadania dnia', null, null, body => {
    const S = G.state;
    const r = dailyReward();
    const all = S.dtasks.list.every(t => t.claimed);
    body.innerHTML = `<p class="muted center">Nowa lista codziennie o północy. Za każde zadanie: ${fmt(r.coins)} 🪙 · 1 🎟️${r.auto ? ' · 1 ⚙️' : ''}</p>
      <div class="rows">${S.dtasks.list.map((t, i) => `<div class="row-card ${t.claimed ? 'muted-card' : ''}">
        <span class="row-ico">${t.icon}</span>
        <span class="row-mid"><b>${esc(t.name)}</b><span class="progress thin"><i style="width:${t.p / t.n * 100}%"></i></span><small>${t.p} / ${t.n}</small></span>
        ${t.claimed ? '<span class="pill-done">✔</span>' : `<button class="btn small ${t.done ? 'green' : ''}" data-act="dclaim:${i}" ${t.done ? '' : 'disabled'}>Odbierz</button>`}
      </div>`).join('')}</div>
      <div class="panel-box"><div class="big-emo">🎁</div><p>Skrzynka za wszystkie trzy: <b>1 💎 · 2 🧪 · 2 ⛽</b></p>
      <button class="btn gold" data-act="dbonus" ${all && !S.dtasks.bonus ? '' : 'disabled'}>${S.dtasks.bonus ? '✔ odebrana' : 'Otwórz skrzynkę'}</button></div>`;
  });
}

// ---------- maszyny ----------
export function updateMachineButton() {
  const b = document.querySelector('.tool[data-tool="machine"] span');
  if (!b) return;
  const S = G.state;
  b.textContent = G.tool === 'fert' ? '🧪' : G.tool === 'combine' ? '⚙️' : G.tool === 'seeder' ? '🌱' : '🧰';
  const n = document.querySelector('#machineCount');
  if (n) n.textContent = `🧪${S.boost.fert} ⛽${S.boost.fuel}`;
}
export function openMachines() {
  const S = G.state;
  const fuelLock = S.level < 6;
  openModal(`<h3>Maszyny i nawóz</h3>
    <p class="muted">Nawóz i paliwo dostajesz codziennie, w zadaniach dnia, w egzotycznym sklepie i za medale.</p>
    <div class="rows">
      <button class="row-card" data-m="fert"><span class="row-ico">🧪</span><span class="row-mid"><b>Nawóz</b><small>Rosnąca roślina dojrzewa od razu · masz ${S.boost.fert}</small></span></button>
      <button class="row-card" data-m="combine" ${fuelLock ? 'disabled' : ''}><span class="row-ico">⚙️</span><span class="row-mid"><b>Kombajn</b><small>${fuelLock ? '🔒 od poziomu 6' : `Zbiera plony z 3×3 pól · 1 ⛽ (masz ${S.boost.fuel})`}</small></span></button>
      <button class="row-card" data-m="seeder" ${fuelLock ? 'disabled' : ''}><span class="row-ico">🌱</span><span class="row-mid"><b>Siewnik</b><small>${fuelLock ? '🔒 od poziomu 6' : `Obsiewa 3×3 pól (${ITEMS[G.seed].name}) · 1 ⛽`}</small></span></button>
    </div>
    <div class="modal-actions"><button class="btn" data-close>Zamknij</button></div>`, 'wide');
  document.querySelectorAll('#modal [data-m]').forEach(b => b.onclick = () => { closeModal(); setTool(b.dataset.m); });
}
export function useMachine(hit) {
  const S = G.state;
  const key = hit.type === 'field' ? hit.key : hit.type === 'tile' ? `${hit.gx},${hit.gy}` : null;
  if (!key) { toast('Dotknij pola uprawnego'); return; }
  const [x, y] = key.split(',').map(Number);
  const t = now();
  if (G.tool === 'fert') {
    const f = S.fields[key];
    if (!f || !f.c || G.cropStage(f, t) === 3) { toast('Nawóz działa na rosnące rośliny'); return; }
    if (S.boost.fert < 1) { toast('Brak nawozu 🧪'); sfx.error(); return; }
    S.boost.fert--;
    f.p = t - f.d;
    G.world.addFloat(x + 0.5, y + 0.5, '🧪 gotowe!', '#c9ffb0', 20);
    sfx.plant();
  } else {
    if (S.boost.fuel < 1) { toast('Brak paliwa ⛽'); sfx.error(); return; }
    let n = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const k = `${x + dx},${y + dy}`;
      if (!S.fields[k]) continue;
      if (G.tool === 'combine') { const r = harvest(k, true); if (r === 'full') break; if (r === true) n++; }
      else if (plant(x + dx, y + dy, G.seed, true)) n++;
    }
    if (!n) { toast(G.tool === 'combine' ? 'Nic tu nie dojrzało' : 'Brak pustych pól (albo talarów)'); return; }
    S.boost.fuel--;
    sfx.build();
    G.world.addFloat(x + 0.5, y + 0.5, `${G.tool === 'combine' ? '⚙️' : '🌱'} ×${n}  -1 ⛽`, '#fff', 24);
  }
  updateMachineButton();
  updateHUD();
  saveSoon();
}

// ---------- ulepszenia budynków i automatyzacja ----------
function upgradeCost(o) {
  const lvl = o.lvl || 1;
  const u = UPGRADES[lvl];
  if (!u) return null;
  const c = { coins: Math.round(BUILDINGS[o.k].cost * u.coins) };
  for (const k of ['plank', 'nail', 'brick']) if (u[k]) c[k] = u[k];
  return c;
}
export function buildingExtrasHTML(o) {
  const S = G.state;
  const lvl = o.lvl || 1;
  const c = upgradeCost(o);
  let html = `<div class="extras"><div class="ex-row"><span>⭐ Poziom budynku: <b>${lvl}/3</b>${lvl > 1 ? ` · ${Math.round((lvl - 1) * 15)}% szybciej` : ''}</span>
    ${c ? `<span class="ex-cost">${costHTML(c)}</span><button class="btn small" data-act="upg">Ulepsz</button>` : '<span class="muted">maksymalny</span>'}</div>`;
  if (S.level >= 10) {
    html += o.serial
      ? `<div class="ex-row"><span>⚙️ Produkcja seryjna: <b>${icon(BUILDINGS[o.k].recipes[o.serial.r].out)} × ${o.serial.left}</b> — działa też, gdy gra jest zamknięta</span><button class="btn small red" data-act="serialStop">Zatrzymaj</button></div>`
      : `<div class="ex-row"><span>⚙️ Punkty automatyzacji: <b>${S.auto}</b>. Przycisk 🔁 przy przepisie uruchamia serię (1 punkt = 1 sztuka).</span></div>`;
  }
  return html + '</div>';
}
export function serialButton(o, ri) {
  if (G.state.level < 10 || o.serial) return '';
  return `<button class="btn small" data-act="serial:${ri}" title="Produkcja seryjna">🔁</button>`;
}
function upgradeBuilding(o) {
  const c = upgradeCost(o);
  if (!c || !canPay(c)) return;
  pay(c);
  o.lvl = (o.lvl || 1) + 1;
  emit('upgrade');
  sfx.level();
  toast(`${BUILDINGS[o.k].name}: poziom ${o.lvl}! Szybsza produkcja i dodatkowe miejsce w kolejce`);
  saveSoon();
  rerenderSheet();
}
// Seria: budynek sam odbiera gotowe i zaczyna kolejne sztuki, także offline
// (zadania układają się jedno po drugim od chwili zakończenia poprzedniego).
function runSerial(o, t) {
  const s = o.serial;
  if (!s) return false;
  const d = BUILDINGS[o.k];
  const r = d.recipes[s.r];
  let changed = false;
  for (let guard = 0; guard < 40; guard++) {
    let moved = false;
    for (const j of readyJobs(o, t)) {
      const out = d.recipes[j.r].out;
      if (!hasRoomQuiet(1)) break;
      addItem(out, 1);
      addXP(d.recipes[j.r].xp);
      emit('produce', out);
      o.sc = Math.max(o.sc || 0, j.e);
      o.q.splice(o.q.indexOf(j), 1);
      moved = changed = true;
    }
    while (s.left > 0 && o.q.length < slotsOf(o) && has(r.in) && G.state.auto > 0) {
      takeItems(r.in);
      G.state.auto--;
      s.left--;
      const start = o.q.length ? Math.max(...o.q.map(j => j.e)) : Math.max(o.sc || t, t - 7 * 86400000);
      o.q.push({ r: s.r, s: start, e: start + jobTime(o, r) });
      moved = changed = true;
    }
    if (!moved) break;
  }
  if (s.left <= 0 || G.state.auto <= 0 || !has(r.in)) {
    if (!o.q.length || s.left <= 0) { delete o.serial; changed = true; }
  }
  return changed;
}
function hasRoomQuiet(n) {
  const S = G.state;
  const total = Object.values(S.inv).reduce((a, b) => a + b, 0);
  return total + n <= STORAGE[S.storageLvl].cap;
}

// ---------- dymki i dotknięcia nowych budynków ----------
export function bubble(o, t) {
  const d = BUILDINGS[o.k];
  const S = G.state;
  switch (d.kind) {
    case 'house': return homePoints() > 0 && S.home.claim !== dayStr() ? { icon: '🎁', color: '#fff2c2' } : null;
    case 'mine': return o.mine && o.mine.end <= t ? { icon: '⛏️' } : null;
    case 'breed': return o.breed && o.breed.end <= t ? { icon: '🍼' } : null;
    case 'cafe': ensureCafe(); return S.cafe.reqs.some(r => !r.done && has(r.items)) ? { icon: '☕', color: '#e9ffd9' } : null;
    case 'fishing': return casts() > 0 ? { icon: '🎣' } : null;
    case 'exotic': return null;
    default: return null;
  }
}
export function interact(o) {
  const d = BUILDINGS[o.k];
  switch (d.kind) {
    case 'fishing': return openFishing();
    case 'mine': return openMine(o);
    case 'cafe': return openCafe();
    case 'exotic': return openExotic();
    case 'harvester': return openHarvester(o);
    case 'breed': return openNursery(o);
    case 'ranch': return tip(o.x + 1.5, o.y + 1.5, 30, '<b>Ranczo ogrodowe</b> — zwierzęta do 4 pól od rancza produkują o 20% szybciej');
  }
}
export function ranchFactor(a) {
  const r = G.state.objects.find(o => o.k === 'ranch' && o.built);
  if (!r) return 1;
  const dx = Math.max(r.x - a.x, 0, a.x - (r.x + 2));
  const dy = Math.max(r.y - a.y, 0, a.y - (r.y + 2));
  return Math.max(dx, dy) <= 4 ? 0.8 : 1;
}

// ---------- wędkowanie ----------
function maxCasts() { return FISHING.maxCasts + (G.state.resort.open ? G.state.resort.b.pier : 0); }
function casts() {
  const S = G.state;
  const t = now();
  const max = maxCasts();
  if (S.rod.n >= max) { S.rod.t = t; return S.rod.n; }
  const gained = Math.floor((t - S.rod.t) / (FISHING.regen * 1000));
  if (gained > 0) { S.rod.n = Math.min(max, S.rod.n + gained); S.rod.t += gained * FISHING.regen * 1000; }
  return S.rod.n;
}
function rollFish() {
  const S = G.state;
  const bonus = S.resort.open ? S.resort.b.pier : 0;
  const table = FISHING.table.filter(f => f.lvl <= S.level).map(f => ({ ...f, w: f.w * (ITEMS[f.id].price >= 80 ? 1 + 0.4 * bonus : 1) }));
  let r = Math.random() * table.reduce((a, f) => a + f.w, 0);
  for (const f of table) { r -= f.w; if (r <= 0) return f.id; }
  return 'carp';
}
let fishState = null;
function openFishing() {
  casts();
  openModal(`<h3>Pomost rybacki</h3>
    <div class="pond" id="pond"><i class="ripple r1"></i><i class="ripple r2"></i><span class="bobber" id="bobber"></span><span class="fish-msg" id="fishMsg">Zarzuć wędkę i czekaj na branie</span></div>
    <p>Rzuty: <b id="castN"></b> / ${maxCasts()} <span class="muted" id="castNext"></span></p>
    <div class="modal-actions"><button class="btn" data-close>Zamknij</button><button class="btn green" id="castBtn">🎣 Zarzuć</button></div>`, 'wide');
  fishState = { phase: 'idle' };
  renderCasts();
  $('#castBtn').onclick = fishClick;
}
function renderCasts() {
  const S = G.state;
  if (!$('#castN')) return;
  $('#castN').textContent = casts();
  $('#castNext').innerHTML = S.rod.n < maxCasts() ? `· kolejny za <span data-end="${S.rod.t + FISHING.regen * 1000}"></span>` : '';
}
function fishClick() {
  const S = G.state;
  const btn = $('#castBtn'), msg = $('#fishMsg'), bob = $('#bobber');
  if (!btn) return;
  if (fishState.phase === 'idle') {
    if (casts() < 1) { toast('Brak rzutów — odnowią się z czasem'); sfx.error(); return; }
    S.rod.n--; if (S.rod.n === maxCasts() - 1) S.rod.t = now();
    renderCasts();
    fishState = { phase: 'wait' };
    bob.className = 'bobber in';
    msg.textContent = 'Cisza… czekaj, aż spławik zanurkuje';
    btn.textContent = '❗ Zatnij!';
    btn.className = 'btn red';
    const id = Symbol('cast');
    fishState.id = id;
    setTimeout(() => {
      if (fishState.id !== id || fishState.phase !== 'wait') return;
      fishState.phase = 'bite';
      bob.className = 'bobber in bite';
      msg.textContent = 'Bierze! Zatnij!';
      sfx.click();
      setTimeout(() => {
        if (fishState.id !== id || fishState.phase !== 'bite') return;
        fishEnd('Ryba zerwała się z haczyka… Spróbuj jeszcze raz.');
      }, 950);
    }, 1400 + Math.random() * 3200);
    return;
  }
  if (fishState.phase === 'wait') { fishEnd('Za wcześnie! Ryba się spłoszyła.'); sfx.error(); return; }
  if (fishState.phase === 'bite') {
    const id = rollFish();
    if (!hasRoom(1)) { fishEnd('Stodoła jest pełna — ryba wróciła do wody.'); return; }
    addItem(id, 1, centerOf('#pond'));
    addXP(id === 'boot' ? 1 : Math.max(2, Math.round(ITEMS[id].price / 12)));
    if (id === 'goldfish') { S.ducats++; toast('Złota rybka spełnia życzenie: +1 💎'); }
    S.stats.fish++;
    emit('fish', id);
    sfx.coin();
    fishEnd(`Złowione: ${ITEMS[id].name}!`, id);
    updateHUD();
    saveSoon();
  }
}
function fishEnd(text, id) {
  fishState = { phase: 'idle' };
  const msg = $('#fishMsg'), btn = $('#castBtn'), bob = $('#bobber');
  if (!msg) return;
  msg.innerHTML = id ? `${icon(id)} ${esc(text)}` : esc(text);
  bob.className = 'bobber';
  btn.textContent = '🎣 Zarzuć';
  btn.className = 'btn green';
  renderCasts();
}

// ---------- kopalnia ----------
function openMine(o) {
  openSheet('Kopalnia', null, null, body => {
    const S = G.state;
    const t = now();
    let html = '<p class="muted center">Górnicy pracują za jedzenie. Im głębiej, tym cenniejszy urobek — węgiel, ruda żelaza, złoto, kryształy.</p>';
    if (o.mine) {
      const sh = MINE.find(m => m.id === o.mine.s);
      const done = o.mine.end <= t;
      html += `<div class="panel-box"><div class="big-emo">⛏️</div><p><b>${sh.name}</b> — ${done ? 'górnicy wrócili!' : 'górnicy kopią, wrócą za <b data-end="' + o.mine.end + '"></b>'}</p>
        ${done ? '<button class="btn green" data-act="mineCollect">Odbierz urobek</button>' : `<button class="btn small" data-act="mineSpeed">⏩ Przyspiesz (${Math.max(1, Math.ceil((o.mine.end - t) / 600000))} 💎)</button>`}</div>`;
    }
    html += '<div class="rows">' + MINE.map(m => {
      const lock = m.lvl > S.level;
      return `<div class="row-card ${lock ? 'locked' : ''}"><span class="row-ico">🕳️</span>
        <span class="row-mid"><b>${m.name}</b><span class="r-in">${costHTML(m.food)}</span>
        <small>⏱ ${fmtTime(m.time)} · urobek: ${m.loot.map(l => icon(l[0])).join('')}</small></span>
        ${lock ? `<span class="lock">🔒 poz. ${m.lvl}</span>` : `<button class="btn small green" data-act="mineGo:${m.id}" ${o.mine ? 'disabled' : ''}>Wyślij</button>`}</div>`;
    }).join('') + '</div>';
    body.innerHTML = html;
    body.dataset.obj = o.id;
  });
}
function mineGo(o, id) {
  const m = MINE.find(x => x.id === id);
  if (o.mine || !canPay(m.food)) return;
  pay(m.food);
  o.mine = { s: id, end: now() + m.time * 1000 };
  emit('mine');
  sfx.build();
  saveSoon();
  rerenderSheet();
}
function mineCollect(o) {
  const m = MINE.find(x => x.id === o.mine.s);
  const got = {};
  for (const [id, a, b, ch] of m.loot) if (Math.random() < ch) { const n = rand(a, b); if (n) got[id] = n; }
  if (!Object.keys(got).length) got.stone = 2;
  const total = Object.values(got).reduce((x, y) => x + y, 0);
  if (!hasRoom(total)) return;
  for (const k in got) addItem(k, got[k], centerOf('#sheet .panel-box'));
  addXP(5 + total * 2);
  o.mine = null;
  sfx.coin();
  toast('Urobek: ' + Object.entries(got).map(([k, n]) => `${n}× ${ITEMS[k].name}`).join(', '));
  updateHUD();
  saveSoon();
  rerenderSheet();
}

// ---------- kawiarnia: pomoc społeczności ----------
function ensureCafe() {
  const S = G.state;
  if (S.cafe.day === dayStr()) return;
  const pool = orderPool();
  const reqs = [];
  for (let i = 0; i < CAFE.perDay && pool.length; i++) {
    const p = pick(pool);
    const n = p.tier === 0 ? rand(6, 12) : p.tier === 1 ? rand(2, 5) : rand(1, 3);
    const value = ITEMS[p.id].price * n;
    reqs.push({ items: { [p.id]: n }, medals: 1 + Math.floor(value / 250), coins: Math.round(value * 0.9), who: pick(CUSTOMERS).avatar, done: false });
  }
  S.cafe = { day: dayStr(), reqs };
}
const MEDAL_SHOP = [
  { id: 'auto', name: '2 punkty automatyzacji', icon: '⚙️', price: 8, give: S => { S.auto += 2; } },
  { id: 'fuel', name: '3 × paliwo', icon: '⛽', price: 5, give: S => { S.boost.fuel += 3; } },
  { id: 'fert', name: '4 × nawóz', icon: '🧪', price: 5, give: S => { S.boost.fert += 4; } },
  { id: 'casts', name: 'Pełna puszka robaków (rzuty)', icon: '🪱', price: 4, give: S => { S.rod.n = maxCasts(); } }
];
function openCafe(tab = 'help') {
  ensureCafe();
  openSheet('Kawiarnia', [['help', '☕ Pomoc społeczności'], ['shop', '🏅 Sklep za medale']], tab, (body, tab) => {
    const S = G.state;
    let html = `<div class="chips"><span class="chip">🏅 ${S.medals} medali reputacji</span></div>`;
    if (tab === 'shop') {
      html += '<div class="grid">';
      for (const k in DECOR) if (DECOR[k].shop === 'cafe') html += card({ img: preview('d', k), name: DECOR[k].name, lines: ['ozdoba'], price: `${DECOR[k].price.medals} 🏅`, action: `place:d:${k}` });
      for (const m of MEDAL_SHOP) html += card({ emoji: m.icon, name: m.name, lines: [], price: `${m.price} 🏅`, action: `medal:${m.id}` });
      body.innerHTML = html + '</div>';
      return;
    }
    html += '<p class="muted center">Mieszkańcy zbierają dary na wiejski festyn. Pomóż, a kawiarnia odwdzięczy się medalami reputacji.</p><div class="grid orders">';
    html += S.cafe.reqs.map((r, i) => {
      if (r.done) return `<div class="order empty"><span class="big-emo">💚</span><small>Dziękujemy!<br>Nowe prośby jutro</small></div>`;
      const ok = has(r.items);
      return `<div class="order ${ok ? 'ok' : ''}"><div class="order-who"><span class="av">${r.who}</span><small>Społeczność</small></div>
        <div class="order-items">${costHTML(r.items)}</div>
        <div class="order-reward">+${r.medals} 🏅 · +${fmt(r.coins)} 🪙</div>
        <button class="btn small ${ok ? 'green' : ''}" data-act="cafeGive:${i}" ${ok ? '' : 'disabled'}>Pomóż</button></div>`;
    }).join('');
    body.innerHTML = html + '</div>';
  });
}
function cafeGive(i) {
  const S = G.state;
  const r = S.cafe.reqs[i];
  if (!r || r.done || !takeItems(r.items)) return;
  r.done = true;
  S.medals += r.medals;
  addCoins(r.coins, centerOf('#sheet .sheet-card'));
  addXP(5);
  emit('cafe');
  sfx.coin();
  saveSoon();
  rerenderSheet();
}

// ---------- egzotyczny sklep ----------
function ensureExotic(force) {
  const S = G.state;
  if (!force && now() < S.exotic.next && S.exotic.offers.length) return;
  const pool = [...EXOTIC.pool];
  const offers = [];
  while (offers.length < 6 && pool.length) {
    const o = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
    offers.push({ ...o, n: rand(o.n[0], o.n[1]), sold: false });
  }
  S.exotic = { next: now() + EXOTIC.refresh * 1000, offers };
}
function offerInfo(o) {
  if (o.id) return { name: ITEMS[o.id].name, icon: icon(o.id) };
  if (o.boost) return { name: { fert: 'Nawóz', fuel: 'Paliwo', auto: 'Punkty automatyzacji' }[o.boost], icon: `<span class="emo">${{ fert: '🧪', fuel: '⛽', auto: '⚙️' }[o.boost]}</span>` };
  return { name: DECOR[o.decor].name, img: preview('d', o.decor) };
}
function openExotic() {
  ensureExotic();
  openSheet('Egzotyczny sklep', null, null, body => {
    const S = G.state;
    body.innerHTML = `<p class="muted center">Kupiec z dalekich krajów. Półki zmieniają się za <b data-end="${S.exotic.next}"></b>.</p>
      <div class="grid">${S.exotic.offers.map((o, i) => {
        const inf = offerInfo(o);
        return card({ img: inf.img, emoji: inf.icon, name: `${o.n > 1 ? o.n + '× ' : ''}${inf.name}`, lines: [],
          price: o.sold ? '✔ kupione' : costText(o.price), action: o.sold ? '' : `exBuy:${i}`, cls: o.sold ? 'owned' : '' });
      }).join('')}</div>
      <div class="panel-box"><button class="btn gold" data-act="exRefresh">🔄 Odśwież półki (${costText(EXOTIC.cost)})</button></div>`;
  });
}
function exBuy(i) {
  const S = G.state;
  const o = S.exotic.offers[i];
  if (!o || o.sold || !canPay(o.price)) return;
  if (o.id && !hasRoom(o.n)) return;
  pay(o.price);
  o.sold = true;
  if (o.id) addItem(o.id, o.n, centerOf('#sheet .sheet-card'));
  else if (o.boost === 'auto') S.auto += o.n;
  else if (o.boost) S.boost[o.boost] += o.n;
  else { S.stash.push({ id: S.nextId++, t: 'd', k: o.decor }); toast(`${DECOR[o.decor].name} czeka w schowku (Stodoła → Schowek)`); }
  sfx.coin();
  updateHUD(); updateMachineButton();
  saveSoon();
  rerenderSheet();
}

// ---------- dom do urządzenia ----------
function homePoints() {
  const f = G.state.home.f;
  return Object.values(f).reduce((a, t) => a + (t ? FURNITURE.tiers[t - 1].pts : 0), 0);
}
function homeReward() {
  const p = homePoints();
  return { coins: p * 12, xp: Math.ceil(p / 10), fert: p >= 60 ? 1 : 0, ducats: p >= 250 ? 1 : 0 };
}
export function openHome() {
  const S = G.state;
  if (S.level < FURNITURE.lvl) {
    openModal(`<div class="modal-ico">🏡</div><h3>Twój dom</h3><p>Urządzanie domu odblokujesz na poziomie ${FURNITURE.lvl}. Za ładne wnętrze dostaniesz codzienną nagrodę.</p><div class="modal-actions"><button class="btn" data-close>OK</button></div>`);
    return;
  }
  openSheet('Twój dom', null, null, body => {
    const pts = homePoints();
    const r = homeReward();
    const claimed = S.home.claim === dayStr();
    body.innerHTML = `<div class="home-head"><div><b>🏠 Punkty domu: ${pts}</b><small>Lepszy mebel zastępuje słabszy w tej samej kategorii — opłaca się urządzać różne kąty.</small></div>
      <button class="btn ${claimed || !pts ? '' : 'gold'}" data-act="homeClaim" ${claimed || !pts ? 'disabled' : ''}>${claimed ? '✔ nagroda odebrana' : `🎁 Nagroda dnia: ${fmt(r.coins)} 🪙${r.fert ? ' · 🧪' : ''}${r.ducats ? ' · 💎' : ''}`}</button></div>
      <div class="grid">${FURNITURE.cats.map(c => {
        const t = S.home.f[c.id] || 0;
        const next = FURNITURE.tiers[t];
        return card({ emoji: c.icon, name: c.name, lines: [t ? `${FURNITURE.tiers[t - 1].name} · ${FURNITURE.tiers[t - 1].pts} pkt` : 'brak', next ? `→ ${next.name} (${next.pts} pkt)` : 'najlepsze!'],
          price: next ? costText(next.cost) : '✔', action: next ? `furn:${c.id}` : '', cls: next ? '' : 'owned' });
      }).join('')}</div>`;
  });
}
function furnish(cat) {
  const S = G.state;
  const t = S.home.f[cat] || 0;
  const next = FURNITURE.tiers[t];
  if (!next || !canPay(next.cost)) return;
  pay(next.cost);
  S.home.f[cat] = t + 1;
  emit('furnish');
  sfx.build();
  saveSoon();
  rerenderSheet();
}
function homeClaim() {
  const S = G.state;
  if (S.home.claim === dayStr() || !homePoints()) return;
  const r = homeReward();
  S.home.claim = dayStr();
  addCoins(r.coins, centerOf('#sheet .home-head'));
  addXP(r.xp);
  S.boost.fert += r.fert;
  S.ducats += r.ducats;
  sfx.coin();
  saveSoon();
  rerenderSheet();
}

// ---------- kurort nad morzem ----------
function resortGuestPool() {
  return orderPool().filter(p => p.tier >= 1).map(p => p.id);
}
function newGuest() {
  const pool = resortGuestPool();
  if (!pool.length) return null;
  const items = {};
  const n = Math.random() < 0.35 ? 2 : 1;
  let value = 0;
  for (let i = 0; i < n; i++) { const id = pick(pool); items[id] = (items[id] || 0) + 1; value += ITEMS[id].price; }
  const b = G.state.resort.b;
  return { av: pick(RESORT.guests), items, shells: 2 + rand(0, 3) + b.beach, coins: Math.round(value * 1.3), tip: Math.random() < 0.15 * b.beach ? 1 : 0 };
}
function tickResort(t) {
  const R = G.state.resort;
  if (!R.open) return false;
  const cap = 1 + R.b.inn;
  const every = Math.max(120, 480 - 60 * R.b.beach) * 1000;
  let changed = false;
  if (!R.next) R.next = t + every;
  while (R.next <= t && R.guests.length < cap) {
    const g = newGuest();
    if (!g) break;
    R.guests.push(g);
    R.next += every;
    changed = true;
  }
  if (R.guests.length >= cap && R.next < t) R.next = t + every;
  return changed;
}
function kioskShells() {
  const R = G.state.resort;
  if (!R.b.kiosk) return 0;
  return Math.min(24 * R.b.kiosk, Math.floor((now() - R.kiosk) / 3600000) * 2 * R.b.kiosk);
}
function openResort(tab = 'guests') {
  const S = G.state;
  if (!S.resort.open) {
    const lock = S.level < RESORT.lvl;
    openSheet('Kurort nad morzem', null, null, body => {
      body.innerHTML = `<div class="seaside"><span>🌊</span><span>⛱️</span><span>🏨</span><span>🐚</span></div>
        <div class="panel-box"><p>Nad morzem czeka stary pensjonat. Odnów go, a letnicy zaczną zamawiać Twoje przetwory i płacić <b>muszelkami 🐚</b>.</p>
        <p>Koszt otwarcia: ${costHTML(RESORT.unlock)}</p>
        <button class="btn green" data-act="resortOpen" ${lock ? 'disabled' : ''}>${lock ? `🔒 od poziomu ${RESORT.lvl}` : 'Otwórz kurort'}</button></div>`;
    });
    return;
  }
  tickResort(now());
  openSheet('Kurort nad morzem', [['guests', '🧳 Goście'], ['build', '🏗️ Rozbudowa'], ['shop', '🐚 Sklepik']], tab, (body, tab) => {
    const R = S.resort;
    let html = `<div class="seaside small"><span>🌊</span><span>⛱️</span><span>🏨</span><span>🐚</span></div><div class="chips"><span class="chip">🐚 ${S.shells} muszelek</span><span class="chip">🏨 miejsca: ${R.guests.length}/${1 + R.b.inn}</span></div>`;
    if (tab === 'guests') {
      html += '<div class="grid orders">' + R.guests.map((g, i) => {
        const ok = has(g.items);
        return `<div class="order ${ok ? 'ok' : ''}"><div class="order-who"><span class="av">${g.av}</span><small>Letnik</small></div>
          <div class="order-items">${costHTML(g.items)}</div>
          <div class="order-reward">+${g.shells} 🐚 · +${fmt(g.coins)} 🪙${g.tip ? ' · +1 💎' : ''}</div>
          <button class="btn small ${ok ? 'green' : ''}" data-act="serve:${i}" ${ok ? '' : 'disabled'}>Obsłuż</button></div>`;
      }).join('') + (R.guests.length < 1 + R.b.inn ? `<div class="order empty"><span class="big-emo">🚌</span><small>Kolejny gość za<br><b data-end="${R.next}"></b></small></div>` : '') + '</div>';
    } else if (tab === 'build') {
      html += '<div class="rows">' + RESORT.buildings.map(b => {
        const lvl = R.b[b.id];
        const maxed = lvl >= b.max;
        const c = RESORT.cost(lvl + 1);
        return `<div class="row-card"><span class="row-ico">${b.icon}</span><span class="row-mid"><b>${b.name} · poz. ${lvl}/${b.max}</b><small>${b.desc}</small>${maxed ? '' : `<span class="r-in">${costHTML(c)}</span>`}</span>
          ${maxed ? '<span class="pill-done">MAX</span>' : `<button class="btn small" data-act="rUp:${b.id}">${lvl ? 'Rozbuduj' : 'Zbuduj'}</button>`}</div>`;
      }).join('') + '</div>';
      if (R.b.kiosk) html += `<div class="panel-box"><p>Kiosk z pamiątkami uzbierał <b>${kioskShells()} 🐚</b></p><button class="btn small green" data-act="kiosk" ${kioskShells() ? '' : 'disabled'}>Odbierz</button></div>`;
    } else {
      html += '<div class="grid">';
      for (const k in DECOR) if (DECOR[k].shop === 'resort') html += card({ img: preview('d', k), name: DECOR[k].name, lines: ['ozdoba nadmorska'], price: `${DECOR[k].price.shells} 🐚`, action: `place:d:${k}` });
      html += card({ emoji: '🍹', name: '3× egzotyczne nasiona', lines: [], price: '25 🐚', action: 'shellBuy:seeds' });
      html += card({ emoji: '⛽', name: '4× paliwo', lines: [], price: '15 🐚', action: 'shellBuy:fuel' });
      body.innerHTML = html + '</div>';
      return;
    }
    body.innerHTML = html;
  });
}
function serveGuest(i) {
  const S = G.state;
  const g = S.resort.guests[i];
  if (!g || !takeItems(g.items)) return;
  S.resort.guests.splice(i, 1);
  S.shells += g.shells;
  S.ducats += g.tip;
  addCoins(g.coins, centerOf('#sheet .sheet-card'));
  addXP(Math.round(g.coins / 20));
  emit('guest');
  sfx.coin();
  toast(`${g.av} Dziękuję! +${g.shells} 🐚${g.tip ? ' · napiwek 💎' : ''}`);
  saveSoon();
  rerenderSheet();
}

// ---------- plan podróży (wyprawy wozem) ----------
function openTrips() {
  openSheet('Plan podróży', null, null, body => {
    const S = G.state;
    const t = now();
    let html = '<p class="muted center">Załaduj wóz towarem i wyślij go w drogę. Wraca z zapłatą i rzadkimi rzeczami.</p>';
    if (S.trip) {
      const d = TRIPS.find(x => x.id === S.trip.id);
      const done = S.trip.end <= t;
      html += `<div class="panel-box"><div class="big-emo">🐴</div><p><b>${d.name}</b> — ${done ? 'wóz wrócił!' : `wróci za <b data-end="${S.trip.end}"></b>`}</p>
        ${done ? '<button class="btn green" data-act="tripCollect">Rozładuj wóz</button>' : ''}</div>`;
    }
    html += '<div class="rows">' + TRIPS.map(d => {
      const lock = d.lvl > S.level;
      const rew = Object.entries(d.reward).map(([k, [a, b]]) => `${a === b ? a : `${a}–${b}`} ${rewardIcon(k)}`).join(' · ');
      return `<div class="row-card ${lock ? 'locked' : ''}"><span class="row-ico">${d.icon}</span>
        <span class="row-mid"><b>${d.name}</b><span class="r-in">${costHTML(d.need)}</span><small>⏱ ${fmtTime(d.time)} · nagroda: ${rew}</small></span>
        ${lock ? `<span class="lock">🔒 poz. ${d.lvl}</span>` : `<button class="btn small green" data-act="trip:${d.id}" ${S.trip ? 'disabled' : ''}>Wyślij</button>`}</div>`;
    }).join('') + '</div>';
    body.innerHTML = html;
  });
}
function rewardIcon(k) {
  return { coins: '🪙', ducats: '💎', medals: '🏅', shells: '🐚', auto: '⚙️' }[k] || iconRaw(k).replace(/^@.*/, ITEMS[k]?.name || k);
}
function giveReward(rew, from) {
  const S = G.state;
  const got = [];
  for (const [k, [a, b]] of Object.entries(rew)) {
    const n = rand(a, b);
    if (!n) continue;
    if (k === 'coins') addCoins(n, from);
    else if (['ducats', 'medals', 'shells', 'auto', 'tickets'].includes(k)) S[k] += n;
    else addItem(k, n, from);
    got.push(`${n} ${rewardIcon(k)}`);
  }
  return got.join(' · ');
}
function tripCollect() {
  const S = G.state;
  if (!S.trip || S.trip.end > now()) return;
  const d = TRIPS.find(x => x.id === S.trip.id);
  const items = Object.entries(d.reward).filter(([k]) => ITEMS[k]).reduce((a, [, [, b]]) => a + b, 0);
  if (items && !hasRoom(items)) return;
  const text = giveReward(d.reward, centerOf('#sheet .panel-box'));
  addXP(Math.round(d.time / 120));
  S.trip = null;
  sfx.coin();
  toast(`Wóz wrócił: ${text}`);
  updateHUD();
  saveSoon();
  rerenderSheet();
}

// ---------- Dom Zbiorów ----------
const HARVEST_EVERY = 5 * 60000;
function runHarvester(o, force) {
  const t = now();
  if (!force && (o.on === false || t - (o.last || 0) < HARVEST_EVERY)) return false;
  o.last = t;
  const S = G.state;
  let n = 0, re = 0;
  for (const key in S.fields) {
    const f = S.fields[key];
    if (!f.c || G.cropStage(f, t) < 3) continue;
    const crop = f.c;
    if (!hasRoomQuiet(CROPS[crop].yield)) break;
    const yieldN = CROPS[crop].yield;
    S.inv[crop] = (S.inv[crop] || 0) + yieldN;
    addXP(CROPS[crop].xp);
    emit('harvest', crop, yieldN);
    f.c = null;
    n++;
    if (!CROPS[crop].exotic && S.coins >= CROPS[crop].seed) {
      const [x, y] = key.split(',').map(Number);
      if (plant(x, y, crop, true)) re++;
    }
  }
  if (n) G.world.addFloat(o.x + 1, o.y + 1, `🌾 ×${n}${re ? ` · 🌱 ×${re}` : ''}`, '#fff', 50);
  return n > 0;
}
function openHarvester(o) {
  const on = o.on !== false;
  openModal(`<div class="modal-ico">🌾</div><h3>Dom Zbiorów</h3>
    <p>Co 5 minut zbiera dojrzałe plony ze wszystkich pól i od razu sieje to samo (za talary). Działa, gdy gra jest otwarta, a po powrocie nadrabia jeden przejazd.</p>
    <p>Następny przejazd: <b data-end="${(o.last || 0) + HARVEST_EVERY}"></b></p>
    <div class="modal-actions"><button class="btn ${on ? 'red' : 'green'}" id="hvToggle">${on ? 'Wyłącz' : 'Włącz'}</button><button class="btn green" id="hvNow">Zbierz teraz</button><button class="btn" data-close>OK</button></div>`);
  $('#hvToggle').onclick = () => { o.on = !on; saveSoon(); closeModal(); };
  $('#hvNow').onclick = () => {
    if (now() - (o.last || 0) < HARVEST_EVERY) { toast('Robotnicy odpoczywają — poczekaj na następny przejazd'); return; }
    if (!runHarvester(o, true)) toast('Nie ma nic do zebrania');
    sfx.pop(); updateHUD(); saveSoon(); closeModal();
  };
}

// ---------- pokój malucha ----------
function openNursery(o) {
  openSheet('Pokój malucha', null, null, body => {
    const S = G.state;
    const t = now();
    let html = '<p class="muted center">Dwa dorosłe zwierzęta tego samego gatunku doczekają się malucha. Maluch dorasta 30 minut, potem daje produkty jak dorosły.</p>';
    if (o.breed) {
      const done = o.breed.end <= t;
      html += `<div class="panel-box"><img class="pv" src="${preview('a', o.breed.k)}" alt=""><p><b>${ANIMALS[o.breed.k].name}</b> — ${done ? 'maluch już jest!' : `maluch za <b data-end="${o.breed.end}"></b>`}</p>
        ${done ? '<button class="btn green" data-act="breedTake">Zabierz malucha</button>' : ''}</div>`;
    }
    html += '<div class="grid">' + Object.keys(ANIMALS).map(k => {
      const a = ANIMALS[k];
      const n = S.objects.filter(x => x.t === 'a' && x.k === k && !(x.baby > t)).length;
      const cost = breedCost(k);
      return card({ img: preview('a', k), name: a.name, lines: [`dorosłe: ${n}`, costHTML(cost), `⏱ ${fmtTime(a.time * 4)}`],
        price: n >= 2 ? 'Rozmnażaj' : 'potrzeba 2', locked: n < 2 || !!o.breed, lockText: n < 2 ? 'potrzeba 2 dorosłych' : 'pokój zajęty', action: `breed:${k}` });
    }).join('') + '</div>';
    body.innerHTML = html;
    body.dataset.obj = o.id;
  });
}
const breedCost = k => ({ [ANIMALS[k].food]: ANIMALS[k].foodN * 5, coins: Math.round(ANIMALS[k].cost * 0.15) });
function breedStart(o, k) {
  if (o.breed || !canPay(breedCost(k))) return;
  pay(breedCost(k));
  o.breed = { k, end: now() + ANIMALS[k].time * 4000 };
  sfx.build();
  saveSoon();
  rerenderSheet();
}
function breedTake(o) {
  const S = G.state;
  if (!o.breed || o.breed.end > now()) return;
  const k = o.breed.k;
  const a = { id: S.nextId++, t: 'a', k, fed: 0, baby: now() + 30 * 60000 };
  const spot = findFree(o.x + 1, o.y + 2, 1, 1);
  if (spot) { a.x = spot[0]; a.y = spot[1]; S.objects.push(a); rebuildOcc(); }
  else { S.stash.push(a); toast('Brak miejsca — maluch czeka w schowku'); }
  o.breed = null;
  emit('breed');
  addXP(15);
  sfx.level();
  toast(`Nowy maluch: ${ANIMALS[k].name}! 🍼`);
  saveSoon();
  closeSheet();
}

// ---------- okolica (centrum dodatkowych miejsc) ----------
export function openHub() {
  syncEvent();
  ensureDaily();
  openSheet('Okolica', null, null, body => {
    const S = G.state;
    const ev = EVENTS[S.event.id];
    const doneTasks = S.dtasks.list.filter(t => t.done && !t.claimed).length;
    const tiles = [
      { act: 'hub:neighbors', icon: '👥', name: 'Sąsiedzi', line: 'pomoc i prezenty raz dziennie' },
      { act: 'hub:daily', icon: '📝', name: 'Zadania dnia', line: `${S.dtasks.list.filter(t => t.done).length}/3 wykonane`, badge: doneTasks },
      { act: 'hub:event', icon: ev.token, name: ev.name, line: `wydarzenie sezonowe · ${S.event.tokens} ${ev.token}`, lvl: 3 },
      { act: 'hub:trips', icon: '🐴', name: 'Plan podróży', line: S.trip ? (S.trip.end <= now() ? 'wóz wrócił!' : 'wóz w drodze') : 'wyślij wóz z towarem', lvl: 5, badge: S.trip && S.trip.end <= now() ? 1 : 0 },
      { act: 'hub:group', icon: '🎟️', name: 'Wycieczka grupowa', line: `bilety: ${S.tickets}/5`, lvl: 6 },
      { act: 'hub:resort', icon: '🏖️', name: 'Kurort nad morzem', line: S.resort.open ? `goście: ${S.resort.guests.length}` : 'do odnowienia', lvl: RESORT.lvl, badge: S.resort.open ? S.resort.guests.filter(g => has(g.items)).length : 0 },
      { act: 'hub:exotic', icon: '🌴', name: 'Egzotyczny sklep', line: built('exotic') ? 'półki z rzadkimi towarami' : 'postaw go (Sklep → Budynki)', lvl: 10, need: 'exotic' },
      { act: 'hub:cafe', icon: '☕', name: 'Kawiarnia', line: built('cafe') ? `medale: ${S.medals}` : 'postaw ją (Sklep → Budynki)', lvl: 7, need: 'cafe' }
    ];
    body.innerHTML = `<div class="chips">
        <span class="chip">🐚 ${S.shells}</span><span class="chip">🏅 ${S.medals}</span><span class="chip">⚙️ ${S.auto}</span>
        <span class="chip">🎟️ ${S.tickets}</span><span class="chip">🧪 ${S.boost.fert}</span><span class="chip">⛽ ${S.boost.fuel}</span><span class="chip">${ev.token} ${S.event.tokens}</span>
      </div><div class="grid hub">${tiles.map(t => {
        const lock = (t.lvl || 0) > S.level || (t.need && !built(t.need));
        return `<button class="card hub-card ${lock ? 'locked' : ''}" data-act="${t.act}" ${lock ? 'aria-disabled="true"' : ''}>
          <span class="big-emo">${t.icon}</span><span class="card-name">${esc(t.name)}</span><span class="card-line">${lock && (t.lvl || 0) > S.level ? `🔒 poziom ${t.lvl}` : esc(t.line)}</span>
          ${t.badge ? `<span class="badge">${t.badge}</span>` : ''}</button>`;
      }).join('')}</div>`;
  });
}
function openEvent() {
  syncEvent();
  openSheet(EVENTS[G.state.event.id].name, null, null, body => {
    const S = G.state;
    const ev = EVENTS[S.event.id];
    const shop = [
      { id: 'ducats', name: '2 dukaty', icon: '💎', price: 25 },
      { id: 'fert', name: '3 × nawóz', icon: '🧪', price: 12 },
      { id: 'auto', name: '2 punkty automatyzacji', icon: '⚙️', price: 18 },
      { id: 'mats', name: 'Skrzynka materiałów', icon: '📦', price: 15 }
    ];
    body.innerHTML = `<div class="panel-box"><div class="big-emo">${ev.token}</div>
      <p>Trwa wydarzenie <b>${ev.name}</b>! Żetony ${ev.token} wypadają przy zbiorach, z produkcji, z wędkowania, a za każde zamówienie dostajesz dwa.</p>
      <p>Masz: <b>${S.event.tokens} ${ev.token}</b>. Żetony przepadają, gdy skończy się pora roku.</p></div>
      <div class="grid">${card({ img: preview('d', ev.decor), name: DECOR[ev.decor].name, lines: ['wyjątkowa ozdoba sezonu'], price: `${DECOR[ev.decor].price.tokens} ${ev.token}`, action: `place:d:${ev.decor}` })}
      ${shop.map(s => card({ emoji: s.icon, name: s.name, lines: [], price: `${s.price} ${ev.token}`, action: `evBuy:${s.id}:${s.price}` })).join('')}</div>`;
  });
}
function evBuy(id, price) {
  const S = G.state;
  if (!canPay({ tokens: price })) return;
  pay({ tokens: price });
  if (id === 'ducats') S.ducats += 2;
  if (id === 'fert') S.boost.fert += 3;
  if (id === 'auto') S.auto += 2;
  if (id === 'mats') { S.inv.plank = (S.inv.plank || 0) + 3; S.inv.nail = (S.inv.nail || 0) + 2; S.inv.brick = (S.inv.brick || 0) + 2; }
  sfx.coin();
  updateHUD(); updateMachineButton();
  saveSoon();
  rerenderSheet();
}
function openGroup() {
  const S = G.state;
  openModal(`<div class="modal-ico">🚌</div><h3>Wycieczka grupowa</h3>
    <p>Zbierz 5 biletów 🎟️ (za pomoc sąsiadom i zadania dnia), a cała wieś odwiedzi gospodarstwa znajomych. Każdy gospodarz coś Ci podaruje.</p>
    <p>Masz: <b>${S.tickets} / 5 🎟️</b></p>
    <p class="muted">Nagroda: ${fmt(80 * S.level)} 🪙 · 20 XP · materiały · 1 💎</p>
    <div class="modal-actions"><button class="btn" data-close>Zamknij</button><button class="btn green" id="groupGo" ${S.tickets >= 5 ? '' : 'disabled'}>Ruszamy!</button></div>`);
  $('#groupGo').onclick = () => {
    if (S.tickets < 5) return;
    S.tickets -= 5;
    addCoins(80 * S.level, centerOf('#modal .modal-card'));
    addXP(20);
    S.ducats++;
    for (const k of ['plank', 'nail', 'brick']) S.inv[k] = (S.inv[k] || 0) + 2;
    sfx.level();
    toast('Udana wycieczka! +materiały, +1 💎');
    updateHUD();
    saveSoon();
    closeModal();
  };
}

// ---------- akcje z okien ----------
export function handleAction(a, b, c, obj) {
  const S = G.state;
  switch (a) {
    case 'upg': if (obj) upgradeBuilding(obj); break;
    case 'serial': if (obj) {
      if (S.auto < 1) { toast('Brak punktów automatyzacji ⚙️ — zdobywasz je za awanse, zadania i medale'); sfx.error(); return; }
      obj.serial = { r: +b, left: Math.min(10, S.auto) };
      runSerial(obj, now());
      toast(`Seria uruchomiona: do ${obj.serial?.left ?? 0} kolejnych sztuk`);
      saveSoon(); rerenderSheet();
    } break;
    case 'serialStop': if (obj) { delete obj.serial; saveSoon(); rerenderSheet(); } break;
    case 'mineGo': if (obj) mineGo(obj, b); break;
    case 'mineCollect': if (obj) mineCollect(obj); break;
    case 'mineSpeed': if (obj?.mine) {
      const cst = { ducats: Math.max(1, Math.ceil((obj.mine.end - now()) / 600000)) };
      if (canPay(cst)) { pay(cst); obj.mine.end = now(); saveSoon(); rerenderSheet(); }
    } break;
    case 'cafeGive': cafeGive(+b); break;
    case 'medal': {
      const m = MEDAL_SHOP.find(x => x.id === b);
      if (m && canPay({ medals: m.price })) { pay({ medals: m.price }); m.give(S); sfx.coin(); updateMachineButton(); saveSoon(); rerenderSheet(); }
    } break;
    case 'exBuy': exBuy(+b); break;
    case 'exRefresh': if (canPay(EXOTIC.cost)) { pay(EXOTIC.cost); ensureExotic(true); sfx.coin(); saveSoon(); rerenderSheet(); } break;
    case 'furn': furnish(b); break;
    case 'homeClaim': homeClaim(); break;
    case 'resortOpen':
      if (S.level >= RESORT.lvl && canPay(RESORT.unlock)) { pay(RESORT.unlock); S.resort.open = true; S.resort.kiosk = now(); S.resort.next = now() + 5000; sfx.level(); toast('Kurort otwarty! Pierwsi letnicy już jadą 🏖️'); saveSoon(); openResort(); }
      break;
    case 'serve': serveGuest(+b); break;
    case 'rUp': {
      const lvl = S.resort.b[b];
      const def = RESORT.buildings.find(x => x.id === b);
      if (lvl >= def.max) return;
      const cst = RESORT.cost(lvl + 1);
      if (!canPay(cst)) return;
      if (b === 'kiosk' && !lvl) S.resort.kiosk = now();
      pay(cst); S.resort.b[b] = lvl + 1; sfx.build(); saveSoon(); rerenderSheet();
    } break;
    case 'kiosk': { const n = kioskShells(); if (n) { S.shells += n; S.resort.kiosk = now(); sfx.coin(); saveSoon(); rerenderSheet(); } } break;
    case 'shellBuy':
      if (b === 'seeds' && canPay({ shells: 25 })) { if (!hasRoom(3)) return; pay({ shells: 25 }); addItem('exoticseeds', 3); }
      else if (b === 'fuel' && canPay({ shells: 15 })) { pay({ shells: 15 }); S.boost.fuel += 4; }
      else return;
      sfx.coin(); updateMachineButton(); saveSoon(); rerenderSheet();
      break;
    case 'trip': {
      const d = TRIPS.find(x => x.id === b);
      if (S.trip || !canPay(d.need)) return;
      pay(d.need); S.trip = { id: b, end: now() + d.time * 1000 }; emit('trip'); sfx.build(); saveSoon(); rerenderSheet();
    } break;
    case 'tripCollect': tripCollect(); break;
    case 'breed': if (obj) breedStart(obj, b); break;
    case 'breedTake': if (obj) breedTake(obj); break;
    case 'dclaim': {
      const t = S.dtasks.list[+b];
      if (!t || !t.done || t.claimed) return;
      t.claimed = true;
      const r = dailyReward();
      addCoins(r.coins, centerOf('#sheet .sheet-card'));
      S.tickets += r.tickets; S.auto += r.auto;
      emit('dtask');
      sfx.coin(); saveSoon(); rerenderSheet();
    } break;
    case 'dbonus':
      if (S.dtasks.bonus || !S.dtasks.list.every(t => t.claimed)) return;
      S.dtasks.bonus = true; S.ducats++; S.boost.fert += 2; S.boost.fuel += 2;
      sfx.level(); updateHUD(); updateMachineButton(); saveSoon(); rerenderSheet();
      break;
    case 'evBuy': evBuy(b, +c); break;
    case 'hub':
      if (b === 'neighbors') openNeighbors();
      if (b === 'daily') openDailyTasks();
      if (b === 'event') openEvent();
      if (b === 'trips') openTrips();
      if (b === 'group') { closeSheet(); openGroup(); }
      if (b === 'resort') openResort();
      if (b === 'exotic') openExotic();
      if (b === 'cafe') openCafe();
      break;
  }
}

// ---------- co sekundę i na starcie ----------
export function tick() {
  const S = G.state;
  const t = now();
  let changed = false;
  for (const o of S.objects) {
    if (o.t !== 'b' || !o.built) continue;
    const kind = BUILDINGS[o.k].kind;
    if (kind === 'prod' && o.serial && runSerial(o, t)) changed = true;
    if (kind === 'harvester' && runHarvester(o)) changed = true;
  }
  if (tickResort(t)) changed = true;
  if (changed) { updateHUD(); saveSoon(); }
}
export function onBoot() {
  syncEvent();
  ensureDaily();
  // Seria w budynkach nadrabia czas, gdy gra była zamknięta.
  const t = now();
  for (const o of G.state.objects) if (o.t === 'b' && o.serial && o.built) runSerial(o, t);
  tickResort(t);
  updateMachineButton();
  void collectJobs; void isBuilt;
}
export function unlocksAt(level) {
  const out = [];
  if (level === 2) out.push('📝 zadania dnia');
  if (level === 3) out.push('🎉 wydarzenia sezonowe');
  if (level === FURNITURE.lvl) out.push('🛋️ urządzanie domu');
  if (level === 5) out.push('🐴 plan podróży');
  if (level === 6) out.push('⚙️ kombajn i siewnik', '🎟️ wycieczki grupowe');
  if (level === 10) out.push('🔁 produkcja seryjna');
  if (level === RESORT.lvl) out.push('🏖️ kurort nad morzem');
  for (const m of MINE) if (m.lvl === level) out.push(`⛏️ ${m.name}`);
  for (const t of TRIPS) if (t.lvl === level) out.push(`${t.icon} ${t.name}`);
  return out;
}
