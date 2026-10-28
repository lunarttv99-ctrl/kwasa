// "Sowa Mądralińska" — the in-game assistant. It answers Polish questions
// offline, straight from the game data (data.js) and the player's state,
// so every answer matches the current version of the game.

import {
  ITEMS, CROPS, ANIMALS, RECIPES, HALLOWEEN, UPGRADES, HELPERS, PROJECTS, TRIPS, FISH_TABLE, BOOSTERS,
  MERCHANT_POOL, SEASONS, SEASON_DAYS, TREES, HEATER, PROCESSORS, DECO_LOOT, DAILY_REWARDS
} from './data.js';

const KITCHEN_LEVEL = 3;
const FISHING_LEVEL = 3;
const MERCHANT_LEVEL = 4;

/* ---------- Text helpers ---------- */

export function normalize(text) {
  return String(text)
    .toLowerCase()
    .replace(/ł/g, 'l')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 🌟🪙👻]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const STOP = new Set(('jak gdzie skad co to zdobyc wziac dostac zrobic mam sie w na z do czy ile kiedy dlaczego po o i a mi moge mozna jest sa ' +
  'ten ta te tego tej by bym zeby jaki jaka jakie jakis cos coz dla od przez przy ze sa ma mnie moj moja moje twoj prosze powiedz wiesz ' +
  'najlepiej szybko duzo malo bardzo juz jeszcze teraz tu tam tutaj gra grze gry').split(' '));

const words = text => normalize(text).split(' ').filter(Boolean);
const fmtTime = seconds => {
  const s = Math.max(0, Math.round(seconds));
  if (s < 60) return `${s} s`;
  const m = Math.floor(s / 60);
  if (m < 60) return s % 60 ? `${m} min ${s % 60} s` : `${m} min`;
  return `${Math.floor(m / 60)} h ${m % 60 ? `${m % 60} min` : ''}`.trim();
};
const icon = key => (key === 'coins' ? '🪙' : key === 'gold' ? '🌟' : ITEMS[key] ? ITEMS[key].icon : '');
const list = obj => Object.entries(obj).map(([k, n]) => `${icon(k)}×${n}`).join(' + ');
const label = id => `${ITEMS[id].icon} <b>${ITEMS[id].name}</b>`;
const seasonNames = idx => idx.map(i => `${SEASONS[i].icon} ${SEASONS[i].name.toLowerCase()}`).join(', ');

/* ---------- Entity index (items + special currencies) ---------- */

const EXTRA_ALIASES = {
  candy: ['cukierek', 'cukierkow', 'slodycze', 'cukier'],
  pumpkin: ['dyni', 'dynie'],
  egg: ['jajko', 'jajek', 'jaja'],
  milk: ['mleka'],
  wood: ['deski', 'drewna', 'opal', 'paliwo'],
  stone: ['kamienie', 'kamieni', 'skaly'],
  nails: ['gwozdz', 'gwozdzi', 'srubki', 'sruby'],
  mushroom: ['grzyb', 'grzybow'],
  fish: ['ryba', 'ryby', 'rybe', 'plotki'],
  apple: ['jablko', 'jablek', 'jablon'],
  cherry: ['wisnia', 'wisni', 'wisnie'],
  pear: ['gruszka', 'grusza', 'gruszek'],
  peach: ['brzoskwinia', 'brzoskwin'],
  flour: ['maki'],
  wheat: ['zboze', 'zboza', 'pszenicy'],
  potato: ['ziemniak', 'kartofle', 'kartofel'],
  honey: ['miodu'],
  wool: ['welny'],
  cheese: ['sera'],
  bread: ['chleba'],
  oil: ['oleju'],
  butter: ['masla'],
  juice: ['soku', 'soki'],
  fert: ['nawoz', 'nawozu'],
  gold: ['zloty klos', 'zlote klosy', 'klosy', 'klos', 'gwiazdki', 'gwiazdka', '🌟'],
  coins: ['monety', 'monet', 'pieniadze', 'pieniedzy', 'kasa', 'kasy', 'zloto', '🪙'],
  points: ['punkty', 'punktow', 'duszki', '👻']
};

function buildIndex() {
  const index = [];
  const add = (id, phrase) => {
    const ws = words(phrase).filter(w => !STOP.has(w));
    if (ws.length) index.push({ id, ws });
  };
  Object.entries(ITEMS).forEach(([id, it]) => {
    add(id, it.name);
    add(id, id);
  });
  Object.entries(BOOSTERS).forEach(([id, b]) => add(`booster:${id}`, b.name));
  Object.entries(EXTRA_ALIASES).forEach(([id, aliases]) => aliases.forEach(a => add(id === 'fert' ? 'booster:fert' : id, a)));
  return index;
}

const INDEX = buildIndex();

function stemMatch(queryWord, nameWord) {
  if (nameWord.length <= 3 || queryWord.length <= 3) return queryWord === nameWord;
  const stem = nameWord.slice(0, Math.max(4, nameWord.length - 2));
  return queryWord.startsWith(stem) || nameWord.startsWith(queryWord.slice(0, Math.max(4, queryWord.length - 2)));
}

export function findEntity(text) {
  const qs = words(text).filter(w => !STOP.has(w));
  let best = null;
  INDEX.forEach(entry => {
    const hits = entry.ws.filter(nw => qs.some(q => stemMatch(q, nw))).length;
    if (!hits) return;
    const score = hits / entry.ws.length + hits * 0.01;
    if (!best || score > best.score) best = { id: entry.id, score };
  });
  return best && best.score >= 0.5 ? best.id : null;
}

/* ---------- Where does an item come from, what is it for ---------- */

export function itemSources(id) {
  const out = [];
  const crop = CROPS[id];
  if (crop) {
    out.push(`🌱 Posiej na polu (od poz. ${crop.level}): nasiono 🪙${crop.cost}, rośnie ${fmtTime(crop.time)}, plon ×2. Najszybciej rośnie: ${seasonNames(crop.seasons)} (+30%).`);
    if (id === 'pumpkin') out.push(`🎃 W Halloween (15.10–7.11) dynie sadzisz już od 1. poziomu za 🪙${HALLOWEEN.pumpkin.cost}.`);
  }
  if (TREES[id]) {
    const t = TREES[id];
    out.push(`🌳 Posadź drzewko „${t.name}” z paska nasion (od poz. ${t.level}, ${list(t.cost)}). Owocuje co ${fmtTime(t.regrow)}, ${t.yield} owoce na zbiór (+1 z dwoma ulami 🐝).`);
  }
  Object.values(ANIMALS).forEach(a => {
    if (a.product === id) out.push(`${a.icon} ${a.name} w Zagrodzie (od poz. ${a.level}) daje to co ${fmtTime(a.time)}, gdy ją nakarmisz: ${list(a.feed)}.`);
  });
  if (RECIPES[id]) {
    const r = RECIPES[id];
    out.push(`🍳 Kuchnia (od poz. ${r.level}): ${list(r.input)} → ${ITEMS[id].icon}, ${fmtTime(r.time)}.`);
  }
  Object.values(PROCESSORS).forEach(pr => {
    const r = pr.recipes[id];
    if (r) out.push(`🏭 ${pr.name} w Przetwórni (od poz. ${pr.level}): ${list(r.input)} → ${ITEMS[id].icon}×${r.out}, ${fmtTime(r.time)}.`);
  });
  if (HALLOWEEN.recipes[id]) {
    const r = HALLOWEEN.recipes[id];
    out.push(`🧪 Kociołek czarownicy (tylko w Halloween): ${list(r.input)} → ${ITEMS[id].icon}×${r.out}, ${fmtTime(r.time)}.`);
  }
  if (id === 'candy') out.push('🎁 W Halloween codzienna nagroda daje też od 2 do 8 cukierków.');
  const fish = FISH_TABLE.find(f => f.id === id);
  if (fish) {
    const total = FISH_TABLE.reduce((s, f) => s + f.weight, 0);
    out.push(`🎣 Łowienie w stawie (od poz. ${FISHING_LEVEL}) — ok. ${Math.round((fish.weight / total) * 100)}% szans przy każdym zarzuceniu.`);
  }
  if (ITEMS[id] && (ITEMS[id].material || id === 'mushroom')) {
    const decos = Object.entries(DECO_LOOT).filter(([, loot]) => loot[id]).map(([d, loot]) => `${d} +${loot[id]}`);
    if (decos.length) out.push(`🪓 Karczowanie działek wokół pola: ${decos.join(', ')}.`);
    const trips = Object.values(TRIPS).filter(t => t.loot[id]).map(t => `${t.icon} ${t.name} (${t.loot[id][0]}–${t.loot[id][1]})`);
    if (trips.length) out.push(`🌲 Wyprawy do lasu (Więcej → Wieś i las): ${trips.join(', ')}.`);
  }
  if (id === 'wood') out.push('🪓 Wycięcie drzewa owocowego daje +3 🪵.');
  if (id === 'stone') out.push('🧱 Rozebranie grzejnika zwraca +4 🪨.');
  if (id === 'nails') out.push('📋 Zamówienia sąsiadów (od poz. 3) czasem płacą dodatkowo 1–3 🔩.');
  if (id === 'nails' || id === 'wood') out.push('📦 Skrzynka wyłowiona ze stawu: 2–4 🔩 i 2–5 🪵.');
  const offers = MERCHANT_POOL.filter(o => o.kind === 'item' && o.id === id);
  if (offers.length) out.push(`🧳 Wędrowny kupiec (od poz. ${MERCHANT_LEVEL}) czasem sprzedaje: ${offers.map(o => `×${o.qty} za ${list(o.price)}`).join(' lub ')}.`);
  return out;
}

export function itemUses(id) {
  const out = [];
  Object.values(ANIMALS).forEach(a => { if (a.feed[id]) out.push(`${a.icon} Karma dla: ${a.name} (${a.feed[id]} szt.).`); });
  Object.entries(RECIPES).forEach(([rid, r]) => { if (r.input[id]) out.push(`🍳 Kuchnia: ${label(rid)} (${list(r.input)}).`); });
  Object.values(PROCESSORS).forEach(pr => Object.entries(pr.recipes).forEach(([rid, r]) => {
    if (r.input[id]) out.push(`🏭 ${pr.name}: ${r.booster ? `${BOOSTERS[r.booster].icon} <b>${BOOSTERS[r.booster].name}</b>` : label(rid)} (${list(r.input)}).`);
  }));
  Object.entries(HALLOWEEN.recipes).forEach(([rid, r]) => { if (r.input[id]) out.push(`🧪 Kociołek: ${label(rid)} (${list(r.input)}).`); });
  Object.values(TRIPS).forEach(t => { if (t.cost[id]) out.push(`${t.icon} Prowiant na: ${t.name} (${t.cost[id]} szt.).`); });
  Object.values(PROJECTS).forEach(p => { if (p.needs[id]) out.push(`${p.icon} Budowa: ${p.name} (${p.needs[id]} szt.).`); });
  const ups = Object.values(UPGRADES).filter(u => u.levels.some(l => l.cost[id])).map(u => `${u.icon} ${u.name}`);
  if (ups.length) out.push(`🔨 Ulepszenia w Warsztacie: ${ups.join(', ')}.`);
  const procs = Object.values(PROCESSORS).filter(pr => pr.cost[id]).map(pr => `${pr.icon} ${pr.name}`);
  if (procs.length) out.push(`🏗️ Budowa w Przetwórni: ${procs.join(', ')}.`);
  if (HEATER.cost[id]) out.push(`🔥 Budowa grzejnika (${HEATER.cost[id]} szt.).`);
  if (id === 'wood') out.push(`🔥 Paliwo dla grzejników zimą: 1 🪵 co ${fmtTime(HEATER.burn)} na grzejnik.`);
  const trees = Object.values(TREES).filter(t => t.cost[id]).map(t => `${t.icon} ${t.name}`);
  if (trees.length) out.push(`🌳 Sadzonki: ${trees.join(', ')}.`);
  if (ITEMS[id] && !ITEMS[id].material && !['mushroom', 'carp', 'crayfish'].includes(id)) out.push('📋 Sąsiedzi zamawiają to w zakładce Zamówienia (płacą ok. 40% więcej niż targ).');
  if (ITEMS[id]) out.push(`🏚️ Sprzedaż w Stodole: 🪙${ITEMS[id].price} za sztukę (więcej w „okazje dnia”).`);
  return out;
}

/* ---------- Topic guides ---------- */

const TOPICS = [
  {
    id: 'start', icon: '🌱', title: 'Pierwsze kroki', keys: ['zaczac', 'poczat', 'start', 'pierwsz', 'nowy gracz', 'podstaw'],
    view: 'farm',
    body: () => `<ol>
      <li>Dotknij trawy, żeby ją zaorać.</li>
      <li>Wybierz nasiona na dole ekranu i dotknij grządki. Możesz przeciągać palcem po wielu grządkach.</li>
      <li>Podlej rośliny 💧 — rosną 2× szybciej.</li>
      <li>Dojrzałe rośliny mają złotą obwódkę — dotknij, by zebrać.</li>
      <li>Sprzedawaj w 🏚️ Stodole albo oddawaj w 📋 Zamówieniach (płacą lepiej!).</li>
      <li>Wykonuj zadania z 📜 Kroniki (karteczka w rogu pola) — prowadzą przez całą grę.</li>
    </ol>`
  },
  {
    id: 'money', icon: '🪙', title: 'Jak szybko zarabiać', keys: ['zarob', 'monet', 'pieniad', 'kasa', 'bogat', 'zysk', 'oplaca', 'biedny'],
    view: 'orders',
    body: ctx => `<ul>
      <li>📋 <b>Zamówienia</b> płacą ok. 40% więcej niż sprzedaż w Stodole.</li>
      <li>🔥 <b>Okazje dnia</b> w Stodole: wybrane towary schodzą ×1,5 lub ×2.</li>
      <li>🍳 <b>Przetwarzaj</b> — potrawy i przetwory są warte więcej niż surowce.</li>
      <li>🌱 Teraz najbardziej opłaca się: ${bestCropText(ctx)}.</li>
      <li>⛺ Ulepszenie <b>Stragan</b> podnosi ceny w Stodole, a <b>Wóz</b> nagrody za zamówienia.</li>
    </ul>`
  },
  {
    id: 'water', icon: '💧', title: 'Podlewanie i deszcz', keys: ['podlew', 'woda', 'wody', 'konewk', 'deszcz', 'susza', 'zraszacz'],
    body: () => `<p>Podlana roślina rośnie <b>2× szybciej</b>. Kropla 💧 nad rośliną oznacza, że jest spragniona — dotknij jej.</p>
      <p>W deszczowe dni całe pole podlewa się samo. ${UPGRADES.can.icon} <b>Konewka</b> w Warsztacie podlewa krzyżyk 5 grządek, potem 3×3, a na końcu zraszacze podlewają każdą nową sadzonkę. Projekt wsi 🪣 <b>Studnia</b> podlewa całe pole co rano.</p>`
  },
  {
    id: 'seasons', icon: '🍂', title: 'Pory roku', keys: ['pora', 'pory', 'wiosn', 'lato', 'lecie', 'jesien', 'sezon', 'kalendarz'],
    body: ctx => `<p>Pora roku zmienia się co <b>${SEASON_DAYS} dni</b> gry. Teraz: <b>${SEASONS[ctx.seasonIndex()].icon} ${SEASONS[ctx.seasonIndex()].name}</b>.</p>
      <ul>${SEASONS.map((s, i) => `<li>${s.icon} <b>${s.name}:</b> ${Object.keys(CROPS).filter(c => CROPS[c].seasons.includes(i)).map(c => ITEMS[c].icon).join(' ') || '—'} rosną o 30% szybciej${i === 0 ? ', drzewa kwitną' : ''}${i === 3 ? '; reszta zwalnia do 60%, drzewa śpią' : ''}.</li>`).join('')}</ul>
      <p>Na seed-pasku zielona etykieta „+30%” pokazuje, co teraz najlepiej siać.</p>`
  },
  {
    id: 'winter', icon: '🥶', title: 'Zima, przymrozki i grzejniki', keys: ['zim', 'mroz', 'przymroz', 'grzej', 'ogrzew', 'snieg', 'zamarz', 'agrowlok', 'szklarn', 'cieplo', 'zimno'],
    view: 'farm',
    body: ctx => `<p>Zimą rośliny rosną wolniej (60%), a drzewa śpią. Rano możesz dostać prognozę <b>„dziś w nocy przymrozek”</b> — o 22:00 mróz zabiera 30% wzrostu niezabezpieczonym roślinom. 🥬 Kapusta jest odporna.</p>
      <ul>
        <li>🔥 <b>Grzejnik ogrodowy</b> (od poz. ${HEATER.level}, ${list(HEATER.cost)}) — wybierz go na końcu paska nasion i postaw na grządce. Ogrzewa pole 3×3 (5×5 po ulepszeniu), chroni przed mrozem, rośliny rosną normalnie, a drzewa owocują.</li>
        <li>🪵 Grzejnik pali 1 drewno co ${fmtTime(HEATER.burn)}. Bez drewna gaśnie! Masz teraz: <b>${ctx.inv('wood')} 🪵</b>.</li>
        <li>🧣 <b>Agrowłóknina</b> od kupca chroni całe pole przez jedną mroźną noc.</li>
        <li>🏡 <b>Szklarnia</b> w Warsztacie usuwa zimowe spowolnienie na całym polu.</li>
      </ul>`
  },
  {
    id: 'crows', icon: '🐦', title: 'Wrony', keys: ['wron', 'ptak', 'ptaki', 'kruk'],
    body: () => '<p>Od 2. poziomu wrony siadają na rosnących roślinach. Dotknij wrony, żeby ją przegonić (+2 🪙). Jeśli zostanie 40 sekund, wydziobie 25% wzrostu.</p><p>🧙 Strach na wróble (nagroda Halloween) o połowę zmniejsza liczbę wron, a 🐕 <b>Pies Burek</b> z Warsztatu przegania je sam.</p>'
  },
  {
    id: 'golden', icon: '✨', title: 'Złote plony', keys: ['zloty plon', 'zlote plon', 'zlota rosl', 'zlote rosl', 'zlote nasion', 'zlota sadzon', 'magiczn', 'blyszcz'],
    body: () => '<p>Każda zasiana roślina ma 2% szans, by wyrosnąć <b>złota</b>. Złoty plon daje podwójne zbiory, sporo monet i 🌟 złoty kłos. 🌟 <b>Złote nasiono</b> od kupca gwarantuje złotą roślinę.</p>'
  },
  {
    id: 'goldears', icon: '🌟', title: 'Złote kłosy 🌟', keys: ['zloty klos', 'klos', 'klosy', 'gwiazd', 'waluta', 'premium'],
    view: 'trophies',
    body: () => '<p><b>Skąd:</b> zadania z Kroniki, osiągnięcia (medale), złote plony, ukończone projekty wsi, co 5. poziom, wyprawy do lasu, złoty pierścionek ze stawu, 7. dzień codziennej nagrody, kupiec (za monety).</p><p><b>Na co:</b> pomocnicy, szklarnia, pies, lepsze grzejniki, przyspieszanie gotowania i wypraw ⚡, wzmacniacze u kupca.</p>'
  },
  {
    id: 'fishing', icon: '🎣', title: 'Łowienie ryb', keys: ['ryb', 'wedk', 'staw', 'lowi', 'zlow', 'zacin', 'splaw'],
    body: () => `<p>Od ${FISHING_LEVEL}. poziomu dotknij stawu albo przycisku 🎣. Gdy czerwono-biały spławik jest w <b>zielonej strefie</b> — naciśnij „Zatnij!”. Idealnie w środku = podwójna ryba.</p><p>Możesz złowić: 🐟 płotkę, 🦞 raka, 🐠 karpia, 📦 skrzynkę z gwoździami i drewnem, 💍 pierścionek (🌟 2) albo… 🥾 stary but. 🎣 Ulepszona wędka poszerza strefę i skraca przerwy.</p>`
  },
  {
    id: 'helpers', icon: '👥', title: 'Pomocnicy', keys: ['pomocn', 'jozek', 'basia', 'mietek', 'parob', 'gospodyn', 'automat', 'sam', 'offline'],
    view: 'workshop',
    body: () => `<ul>${Object.values(HELPERS).map(h => `<li>${h.icon} <b>${h.name}</b> (od poz. ${h.level}): ${h.levels.map(l => l.text).join(' → ')}</li>`).join('')}</ul><p>Pomocnicy pracują także, gdy gra jest zamknięta (do 12 h). ☕ Kawa zbożowa przyspiesza ich 2×. Zatrudnisz ich w 🔨 Warsztacie.</p>`
  },
  {
    id: 'workshop', icon: '🔨', title: 'Warsztat i ulepszenia', keys: ['ulepsz', 'warsztat', 'upgrade', 'narzedz', 'kosa', 'kompost', 'stragan', 'piec', 'wedka', 'woz', 'pies', 'burek'],
    view: 'workshop',
    body: () => `<ul>${Object.values(UPGRADES).map(u => `<li>${u.icon} <b>${u.name}</b> (od poz. ${u.level}, ${u.levels.length} poz.): ${u.levels[u.levels.length - 1].text}</li>`).join('')}</ul><p>Ulepszenia kosztują monety i materiały 🪵🪨🔩 — zdobędziesz je z karczowania, lasu, zamówień i od kupca.</p>`
  },
  {
    id: 'village', icon: '🏘️', title: 'Odbudowa wsi', keys: ['wies', 'wsi', 'projekt', 'studni', 'most', 'swietlic', 'kapliczk', 'remiz', 'odbud', 'buduj', 'budow'],
    view: 'village',
    body: () => `<p>W „Więcej → Wieś i las” oddajesz materiały i plony na wspólne budowy. Każda daje 🌟 i <b>stały bonus</b>:</p><ul>${Object.values(PROJECTS).map(p => `<li>${p.icon} <b>${p.name}</b> (poz. ${p.level}): ${p.perk}</li>`).join('')}</ul>`
  },
  {
    id: 'forest', icon: '🌲', title: 'Wyprawy do lasu', keys: ['las', 'lasu', 'wypraw', 'ekspedy', 'spacer', 'biwak', 'material'],
    view: 'village',
    body: () => `<ul>${Object.values(TRIPS).map(t => `<li>${t.icon} <b>${t.name}</b> (poz. ${t.level}, ${fmtTime(t.time)}${Object.keys(t.cost).length ? `, prowiant: ${list(t.cost)}` : ', bez prowiantu'}): ${Object.entries(t.loot).map(([k, [a, b]]) => `${icon(k)}${a}–${b}`).join(' ')}${t.goldChance ? `, ${Math.round(t.goldChance * 100)}% na 🌟` : ''}</li>`).join('')}</ul><p>Naraz może trwać jedna wyprawa. Wraca nawet przy zamkniętej grze.</p>`
  },
  {
    id: 'merchant', icon: '🧳', title: 'Wędrowny kupiec i wzmacniacze', keys: ['kupiec', 'kupc', 'handlarz', 'sklep', 'kupic', 'wzmacn', 'plecak', 'booster'],
    view: 'merchant',
    body: () => `<p>Od ${MERCHANT_LEVEL}. poziomu co rano przyjeżdża z nowymi ofertami (most daje rabat 20%). Wzmacniacze trafiają do 🎒 plecaka:</p><ul>${Object.values(BOOSTERS).map(b => `<li>${b.icon} <b>${b.name}:</b> ${b.text}</li>`).join('')}</ul><p>🧴 Nawóz turbo zrobisz też sam w 🪱 Wytwórni nawozu.</p>`
  },
  {
    id: 'orchard', icon: '🍎', title: 'Sad i drzewa owocowe', keys: ['sad', 'drzew', 'owoc', 'jablon', 'wisni', 'grusz', 'brzoskw', 'sadzon'],
    view: 'farm',
    body: () => `<p>Drzewka znajdziesz na końcu paska nasion. Sadzisz je raz, owoce zbierasz wiele razy.</p><ul>${Object.values(TREES).map(t => `<li>${t.icon} <b>${t.name}</b> (poz. ${t.level}, ${list(t.cost)}): pierwsze owoce po ${fmtTime(t.grow)}, potem co ${fmtTime(t.regrow)}, ×${t.yield}</li>`).join('')}</ul><p>🌸 Wiosną kwitną i rosną szybciej, ❄️ zimą śpią (chyba że stoi obok grzejnik). 🐝 Dwa ule = +1 owoc. Dotknij rosnącego drzewa, by je wyciąć (+3 🪵).</p>`
  },
  {
    id: 'processing', icon: '🏭', title: 'Przetwórnia', keys: ['przetw', 'mlyn', 'tlocz', 'mleczar', 'olejar', 'wytworni', 'mak', 'maki'],
    view: 'kitchen',
    body: () => `<p>Zakładka 🍳 Kuchnia → 🏭 Przetwórnia. Najpierw budujesz budynek, potem przerabiasz:</p><ul>${Object.values(PROCESSORS).map(pr => `<li>${pr.icon} <b>${pr.name}</b> (poz. ${pr.level}, ${list(pr.cost)}): ${Object.entries(pr.recipes).map(([rid, r]) => `${list(r.input)} → ${r.booster ? BOOSTERS[r.booster].icon : ITEMS[rid].icon}×${r.out}`).join('; ')}</li>`).join('')}</ul><p>🏞️ Młyn wodny (projekt wsi) przyspiesza przetwórnię o 25%. Kucharz Mietek obsługuje ją sam.</p>`
  },
  {
    id: 'kitchen', icon: '🍳', title: 'Kuchnia i przepisy', keys: ['kuchn', 'gotow', 'przepis', 'palnik', 'potraw', 'upiec', 'piec'],
    view: 'kitchen',
    body: () => `<p>Od ${KITCHEN_LEVEL}. poziomu. Masz 2 palniki (trzeci za 🪙400). 🔥 Piec kaflowy w Warsztacie przyspiesza gotowanie. Dotknij gotującej się potrawy, by ją dokończyć za 🌟.</p><ul>${Object.entries(RECIPES).map(([id, r]) => `<li>${ITEMS[id].icon} ${ITEMS[id].name} (poz. ${r.level}): ${list(r.input)}</li>`).join('')}</ul>`
  },
  {
    id: 'animals', icon: '🐔', title: 'Zwierzęta', keys: ['zwierz', 'kura', 'kury', 'krow', 'owc', 'pszczol', 'ul', 'zagrod', 'karm', 'pasz', 'glodn'],
    view: 'animals',
    body: () => `<ul>${Object.values(ANIMALS).map(a => `<li>${a.icon} <b>${a.name}</b> (poz. ${a.level}): je ${list(a.feed)}, daje ${ITEMS[a.product].icon} co ${fmtTime(a.time)}, max ${a.max}</li>`).join('')}</ul><p>Głodne zwierzę ma dymek z karmą — dotknij, by nakarmić, potem znów, by zebrać. Przyciski „Nakarm” i „Zbierz” obsługują całą zagrodę. 🏗️ Rozbudowa zagród daje więcej miejsc.</p>`
  },
  {
    id: 'orders', icon: '📋', title: 'Zamówienia sąsiadów', keys: ['zamow', 'klient', 'sasiad', 'oddaj'],
    view: 'orders',
    body: () => '<p>Sąsiedzi proszą o towary i płacą więcej niż targ, dając dużo ⭐ doświadczenia. Niechciane zamówienie wyrzuć 🗑️ — za chwilę przyjdzie nowe. 🏛️ Świetlica dodaje czwarte miejsce, a 🛒 Wóz drabiniasty podnosi nagrody.</p>'
  },
  {
    id: 'land', icon: '🪓', title: 'Powiększanie pola', keys: ['ziemi', 'pole', 'karcz', 'dzialk', 'powieksz', 'wiecej miejsca', 'drzewa wokol'],
    view: 'farm',
    body: () => `<p>Dotknij drzewa lub kamienia z ceną 🪙 obok pola, aby je wykarczować. Każde kolejne jest trochę droższe, ale daje materiały: ${Object.entries(DECO_LOOT).map(([d, l]) => `${d} ${list(l)}`).join(', ')}.</p>`
  },
  {
    id: 'level', icon: '⭐', title: 'Poziomy i doświadczenie', keys: ['poziom', 'xp', 'doswiad', 'level', 'awans', 'odblok'],
    body: ctx => `<p>Doświadczenie ⭐ dostajesz za zbiory, zwierzęta, potrawy i zamówienia (najwięcej!). Każdy poziom daje premię monet, a co 5. poziom także 🌟. Teraz masz poziom <b>${ctx.state().level}</b>.</p>`
  },
  {
    id: 'quests', icon: '📜', title: 'Kronika i osiągnięcia', keys: ['zadan', 'kronik', 'quest', 'misj', 'osiagn', 'medal', 'trofe'],
    view: 'trophies',
    body: () => '<p>Karteczka 📜 w rogu pola pokazuje zadanie od sołtysa — po wykonaniu dotknij jej, by odebrać nagrodę. W „Więcej → Trofea” są też osiągnięcia z medalami 🥉🥈🥇 nagradzanymi 🌟.</p>'
  },
  {
    id: 'halloween', icon: '🎃', title: 'Halloween', keys: ['halloween', 'potwor', 'kociol', 'czarown', 'punkty', 'duch', 'duszk', 'wampir'],
    view: 'event',
    body: () => `<p>Od 15 października do 7 listopada. Dynie rosną od 1. poziomu (+${HALLOWEEN.harvestPoints} 👻 za zbiór), w kociołku warzysz cukierki i eliksiry, a potwory płacą punktami 👻.</p><ul>${HALLOWEEN.milestones.map(m => `<li>👻 ${m.points}: ${m.label}${m.perk ? ` — ${m.perk}` : ''}</li>`).join('')}</ul><p>Ozdoby zostają na zawsze.</p>`
  },
  {
    id: 'daily', icon: '🎁', title: 'Codzienna nagroda', keys: ['codzien', 'dzienna', 'seria', 'logowan'],
    body: () => `<p>Wchodź codziennie: ${DAILY_REWARDS.map(c => `🪙${c}`).join(' → ')} (7. dzień +🌟2). Opuszczony dzień zeruje serię. ⛪ Kapliczka podwaja nagrody.</p>`
  },
  {
    id: 'camera', icon: '🤏', title: 'Sterowanie mapą', keys: ['kamer', 'obrac', 'obrot', 'przybliz', 'oddal', 'mapa', 'mape', 'zoom', 'przesun', 'widok', 'sterowan'],
    view: 'farm',
    body: () => '<p>Dwa palce: szczypanie przybliża i oddala, skręt obraca, przesuwanie przesuwa mapę. Jeden palec zaczęty poza polem też przesuwa mapę. ⟳ obraca o 90°, 🎯 wraca do widoku pola.</p>'
  },
  {
    id: 'backup', icon: '💾', title: 'Zapis i przenoszenie gry', keys: ['kopia', 'zapis', 'telefon', 'przenies', 'backup', 'stracic', 'urzadzen'],
    body: () => '<p>Gra zapisuje się sama w pamięci telefonu. Aby przenieść ją na inny telefon: ⚙️ → 💾 Kopia zapasowa → skopiuj kod i wklej go na drugim urządzeniu.</p>'
  }
];

/* ---------- Advice from the current state ---------- */

function bestCrop(ctx) {
  const st = ctx.state();
  const season = ctx.seasonIndex();
  let best = null;
  Object.keys(CROPS).forEach(id => {
    const c = ctx.cropInfo(id);
    if (st.level < c.level) return;
    const fav = CROPS[id].seasons.includes(season);
    const speed = fav ? 1.3 : season === 3 ? 0.6 : 1;
    const perMin = (ctx.sellPrice(id) * 2 - c.cost) / (c.time / 60 / speed);
    if (!best || perMin > best.perMin) best = { id, perMin, fav };
  });
  return best;
}

function bestCropText(ctx) {
  const b = bestCrop(ctx);
  return b ? `${label(b.id)} (ok. 🪙${Math.round(b.perMin)}/min z grządki${b.fav ? ', teraz w sezonie' : ''})` : 'pszenica';
}

export function advice(ctx) {
  const st = ctx.state();
  const tips = [];
  const push = (priority, iconText, text, view) => tips.push({ priority, icon: iconText, text, view });
  const crops = st.tiles.filter(t => t.s === 'crop');
  const unprotected = crops.filter((t, i) => !ctx.cropReady(t) && t.crop !== 'cabbage').length;
  if (ctx.frostTonight() && !st.fleece && unprotected) push(100, '🥶', 'Dziś w nocy przymrozek! Postaw 🔥 grzejniki (z drewnem 🪵) albo użyj 🧣 agrowłókniny z plecaka.', 'farm');
  if (st.tiles.some(t => t.crow)) push(95, '🐦', 'Wrony na polu! Dotknij je, zanim wydziobią plony.', 'farm');
  if (ctx.isWinter() && st.heatCold && st.tiles.some(t => t.s === 'heater')) push(90, '🔥', 'Grzejniki zgasły — brakuje drewna 🪵. Wyślij wyprawę do lasu albo kup drewno u kupca.', 'village');
  if (ctx.questProgress().done) push(85, '📜', `Zadanie „${ctx.currentQuest().title}” wykonane — dotknij karteczki na polu i odbierz nagrodę!`, 'farm');
  if (ctx.claimableAchievements()) push(80, '🏅', 'Masz medal do odebrania w Trofeach.', 'trophies');
  const ready = st.tiles.filter(t => ctx.cropReady(t) || ctx.treeReady(t)).length;
  if (ready) push(75, '🧺', `Do zebrania: ${ready} ${ready === 1 ? 'grządka' : 'grządek'}. Przeciągnij po nich palcem!`, 'farm');
  const deliverable = st.orders.filter(o => o.wait === undefined && ctx.hasItems(o.items)).length;
  if (deliverable) push(70, '📋', `Możesz już oddać ${deliverable} ${deliverable === 1 ? 'zamówienie' : 'zamówienia'} — to najlepszy zarobek.`, 'orders');
  const readyAnimals = st.animals.filter(a => a.s === 'ready').length;
  const hungry = st.animals.filter(a => a.s === 'hungry' && ctx.hasItems(ANIMALS[a.type].feed)).length;
  if (readyAnimals || hungry) push(65, '🐔', `W zagrodzie: ${readyAnimals ? `${readyAnimals} gotowych produktów` : ''}${readyAnimals && hungry ? ', ' : ''}${hungry ? `${hungry} głodnych zwierząt (masz karmę)` : ''}.`, 'animals');
  const kitchenReady = st.kitchen.filter(s => s && s.p >= ctx.recipeTime(s.r)).length + ctx.readyProcessSlots();
  if (kitchenReady) push(60, '🍳', `Gotowe w kuchni i przetwórni: ${kitchenReady}. Odbierz i wstaw kolejne!`, 'kitchen');
  if (st.trip && st.trip.left <= 0) push(58, '🌲', 'Wyprawa wróciła z lasu — odbierz łupy!', 'village');
  else if (!st.trip && st.level >= TRIPS.walk.level) push(30, '🌲', 'Nikt nie jest w lesie — wyślij wyprawę po materiały (Więcej → Wieś i las).', 'village');
  const dry = crops.filter(t => !t.w && !ctx.cropReady(t)).length;
  if (dry && !['rain', 'snow'].includes(st.weather)) push(50, '💧', `${dry} roślin czeka na wodę — podlane rosną 2× szybciej.`, 'farm');
  const empty = st.tiles.filter(t => t.s === 'soil' && !t.weed).length + st.tiles.filter(t => t.s === 'grass').length;
  const best = bestCrop(ctx);
  if (empty && best) push(45, '🌱', `Masz ${empty} wolnych grządek. Najbardziej opłaca się teraz: ${label(best.id)}.`, 'farm');
  if (ctx.isWinter() && st.level >= HEATER.level && !st.tiles.some(t => t.s === 'heater')) push(55, '🔥', 'Jest zima — postaw grzejnik (koniec paska nasion), żeby rośliny rosły normalnie.', 'farm');
  if (st.level >= TREES.apple.level && !st.tiles.some(t => t.s === 'tree')) push(40, '🍎', 'Nie masz jeszcze sadu — jabłoń kosztuje 🪙120 i owocuje bez końca.', 'farm');
  const affordable = Object.entries(UPGRADES).filter(([id, u]) => st.level >= u.level && u.levels[ctx.upg(id)] && ctx.canAfford(u.levels[ctx.upg(id)].cost)).length;
  if (affordable) push(35, '🔨', `Stać Cię na ${affordable} ${affordable === 1 ? 'ulepszenie' : 'ulepszeń'} w Warsztacie.`, 'workshop');
  if (st.coins < 30) {
    const value = Object.keys(st.inv).reduce((sum, id) => sum + (ITEMS[id] ? ITEMS[id].price * st.inv[id] : 0), 0);
    if (value > 0) push(88, '🪙', `Kończą się monety. W Stodole masz towar za ok. 🪙${value} — sprzedaj część.`, 'barn');
  }
  if (!tips.length) push(1, '🌾', 'Wszystko gra! Posiej coś nowego albo sprawdź zadanie w Kronice.', 'farm');
  return tips.sort((a, b) => b.priority - a.priority).slice(0, 5);
}

/* ---------- Answering questions ---------- */

const has = (text, keys) => keys.some(k => text.includes(k));

function itemAnswer(id, ctx) {
  if (id === 'gold') return topicAnswer(TOPICS.find(t => t.id === 'goldears'), ctx);
  if (id === 'coins') return topicAnswer(TOPICS.find(t => t.id === 'money'), ctx);
  if (id === 'points') return topicAnswer(TOPICS.find(t => t.id === 'halloween'), ctx);
  if (id.startsWith('booster:')) {
    const b = BOOSTERS[id.slice(8)];
    const src = id === 'booster:fert' ? ' Zrobisz go też w 🪱 Wytwórni nawozu (6 🌾 + 3 🥕).' : '';
    return { html: `<p>${b.icon} <b>${b.name}</b>: ${b.text}</p><p>Kupisz u 🧳 wędrownego kupca, a użyjesz z 🎒 plecaka.${src} Masz: <b>${ctx.state().boosters[id.slice(8)] || 0}</b>.</p>`, actions: [{ label: '🎒 Plecak', act: 'backpack' }, { label: '🧳 Kupiec', view: 'merchant' }] };
  }
  const it = ITEMS[id];
  const src = itemSources(id);
  const uses = itemUses(id);
  const n = ctx.inv(id);
  const actions = [];
  if (CROPS[id] || TREES[id]) actions.push({ label: '🌱 Na pole', view: 'farm' });
  if (Object.values(ANIMALS).some(a => a.product === id)) actions.push({ label: '🐔 Zagroda', view: 'animals' });
  if (RECIPES[id] || Object.values(PROCESSORS).some(p => p.recipes[id])) actions.push({ label: '🍳 Kuchnia', view: 'kitchen' });
  if (HALLOWEEN.recipes[id]) actions.push({ label: '🧪 Kociołek', view: 'event' });
  if (it.material) actions.push({ label: '🌲 Las', view: 'village' });
  if (FISH_TABLE.some(f => f.id === id)) actions.push({ label: '🎣 Łów', act: 'fish' });
  return {
    html: `<p>${it.icon} <b>${it.name}</b> — masz <b>${n}</b> szt., wartość 🪙${it.price}.</p>
      <p class="agent-sub">Skąd wziąć:</p><ul>${src.length ? src.map(s => `<li>${s}</li>`).join('') : '<li>Zdobędziesz to w trakcie gry.</li>'}</ul>
      ${uses.length ? `<p class="agent-sub">Do czego się przyda:</p><ul>${uses.slice(0, 7).map(s => `<li>${s}</li>`).join('')}</ul>` : ''}`,
    actions
  };
}

function topicAnswer(topic, ctx) {
  return {
    html: `<p><b>${topic.icon} ${topic.title}</b></p>${topic.body(ctx)}`,
    actions: topic.view ? [{ label: 'Pokaż', view: topic.view }] : []
  };
}

function adviceAnswer(ctx) {
  const tips = advice(ctx);
  return {
    html: `<p>Oto co bym teraz zrobiła:</p><ul class="advice">${tips.map(t => `<li>${t.icon} ${t.text}</li>`).join('')}</ul>`,
    actions: [...new Set(tips.map(t => t.view))].slice(0, 3).map(v => ({ label: VIEW_NAMES[v] || 'Pokaż', view: v }))
  };
}

const VIEW_NAMES = {
  farm: '🌱 Pole', animals: '🐔 Zagroda', kitchen: '🍳 Kuchnia', orders: '📋 Zamówienia', barn: '🏚️ Stodoła',
  workshop: '🔨 Warsztat', village: '🏘️ Wieś i las', merchant: '🧳 Kupiec', trophies: '🏆 Trofea', event: '🎃 Halloween'
};

export const SUGGESTIONS = [
  'Co mam teraz zrobić?',
  'Jak szybko zarabiać?',
  'Skąd wziąć gwoździe?',
  'Jak przetrwać zimę?',
  'Jak zdobyć cukierki?',
  'Do czego jest mąka?',
  'Jak działają pomocnicy?',
  'Skąd złote kłosy?'
];

export function answer(question, ctx) {
  const q = normalize(question);
  const st = ctx.state();
  if (!q) return { html: '<p>Zapytaj mnie o cokolwiek z gry — np. „skąd wziąć drewno?” albo „co mam teraz robić?”.</p>', actions: [] };
  if (has(q, ['czesc', 'hej', 'siema', 'dzien dobry', 'witaj', 'elo', 'hejka'])) {
    return { html: `<p>Huhu! Dzień dobry, gospodarzu${st.farmName ? ` z ${st.farmName}` : ''}! 🦉 Znam każdy zakątek tej wsi. O co chcesz zapytać?</p>`, actions: [] };
  }
  if (has(q, ['dzieki', 'dziekuje', 'dzieks', 'super', 'fajnie'])) return { html: '<p>Huhu, cała przyjemność po mojej stronie! 🦉</p>', actions: [] };
  if (has(q, ['kim jestes', 'kto ty', 'co umiesz', 'jestes ai', 'sztuczn'])) {
    return { html: '<p>Jestem <b>Sowa Mądralińska</b> 🦉 — wiejska mądrala. Znam wszystkie rośliny, zwierzęta, przepisy, budynki i sztuczki tej gry, a do tego patrzę na Twoje gospodarstwo i podpowiadam, co robić. Działam bez internetu, prosto z danych gry.</p>', actions: [] };
  }
  const asksWhatNow = /\bco\b/.test(q) && /(robic|zrobic|dalej|teraz|polecasz)/.test(q) && !findEntity(q);
  if (asksWhatNow || has(q, ['rada', 'rade', 'porad', 'podpowiedz', 'pomoz', 'pomocy', 'nudz'])) return adviceAnswer(ctx);
  if (has(q, ['ile mam', 'moj stan', 'statystyk', 'podsumow'])) {
    return { html: `<p>Masz <b>🪙 ${st.coins}</b>, <b>🌟 ${st.gold}</b>, poziom <b>⭐ ${st.level}</b>, dzień ${st.day} (${SEASONS[ctx.seasonIndex()].icon} ${SEASONS[ctx.seasonIndex()].name}). Materiały: 🪵${ctx.inv('wood')} 🪨${ctx.inv('stone')} 🔩${ctx.inv('nails')}.</p>`, actions: [{ label: '🏚️ Stodoła', view: 'barn' }] };
  }
  if (has(q, ['zarob', 'pieniad', 'monet', 'bogat', 'oplaca', 'najlepsz upraw', 'co siac', 'co posiac', 'co sadzic'])) {
    if (!findEntity(q) || has(q, ['zarob', 'oplaca', 'co siac', 'co posiac', 'co sadzic'])) return topicAnswer(TOPICS.find(t => t.id === 'money'), ctx);
  }
  const entity = findEntity(q);
  const topic = TOPICS.map(t => ({ t, hits: t.keys.filter(k => q.includes(k)).length })).filter(x => x.hits).sort((a, b) => b.hits - a.hits)[0];
  if (entity) {
    const res = itemAnswer(entity, ctx);
    if (topic && !['gold', 'coins', 'points'].includes(entity)) res.actions.push({ label: `${topic.t.icon} ${topic.t.title}`, ask: topic.t.title });
    return res;
  }
  if (topic) return topicAnswer(topic.t, ctx);
  const loose = TOPICS.filter(t => words(t.title).some(w => w.length > 3 && q.includes(w.slice(0, 4))));
  return {
    html: `<p>Huhu… nie jestem pewna, o co pytasz. 🦉 ${loose.length ? 'Może chodzi o:' : 'Spróbuj zapytać o konkretną rzecz, np. „skąd wziąć masło?”, albo wybierz temat:'}</p>`,
    actions: (loose.length ? loose : TOPICS.slice(0, 4)).slice(0, 4).map(t => ({ label: `${t.icon} ${t.title}`, ask: t.title }))
  };
}

/* ---------- Encyclopedia ---------- */

export function wikiEntries() {
  const entries = [];
  const cat = (name, icon, ids) => ids.forEach(id => entries.push({ cat: `${icon} ${name}`, id, kind: 'item', icon: ITEMS[id].icon, title: ITEMS[id].name }));
  TOPICS.forEach(t => entries.push({ cat: '📘 Poradniki', id: t.id, kind: 'topic', icon: t.icon, title: t.title }));
  cat('Uprawy', '🌱', Object.keys(CROPS));
  cat('Sad', '🍎', Object.keys(TREES));
  cat('Od zwierząt', '🐔', Object.values(ANIMALS).map(a => a.product));
  cat('Kuchnia', '🍳', Object.keys(RECIPES));
  cat('Przetwórnia', '🏭', Object.values(PROCESSORS).flatMap(pr => Object.keys(pr.recipes)).filter(id => ITEMS[id]));
  cat('Staw i las', '🎣', ['fish', 'carp', 'crayfish', 'mushroom']);
  cat('Materiały', '🪵', ['wood', 'stone', 'nails']);
  cat('Halloween', '🎃', Object.keys(HALLOWEEN.recipes));
  Object.keys(BOOSTERS).forEach(id => entries.push({ cat: '🎒 Wzmacniacze', id: `booster:${id}`, kind: 'item', icon: BOOSTERS[id].icon, title: BOOSTERS[id].name }));
  return entries;
}

export function wikiBody(entry, ctx) {
  if (entry.kind === 'topic') {
    const t = TOPICS.find(x => x.id === entry.id);
    return { html: t.body(ctx), actions: t.view ? [{ label: 'Pokaż', view: t.view }] : [] };
  }
  return itemAnswer(entry.id, ctx);
}

export function bubbleTip(ctx) {
  const top = advice(ctx)[0];
  return top && top.priority >= 85 ? top : null;
}
