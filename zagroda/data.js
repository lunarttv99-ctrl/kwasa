// Zawartość gry „Wiejska Zagroda”. Czasy w sekundach, ceny w talarach (🪙),
// waluta premium to dukaty (💎). Ikony: emoji albo własne rysunki „@typ:kolor”.

export const MAP = 30;          // mapa MAP×MAP pól
export const PLOW_COST = 5;
export const START = { coins: 500, ducats: 6 };

// Kolejne rozszerzenia ziemi (kwadrat na środku mapy).
export const LAND = [
  { size: 14 },
  { size: 18, cost: 4000, lvl: 5 },
  { size: 22, cost: 15000, lvl: 10 },
  { size: 26, cost: 45000, lvl: 16 },
  { size: 30, cost: 120000, lvl: 22 }
];

// Pojemność stodoły (magazynu) na kolejnych poziomach.
export const STORAGE = [
  { cap: 60 },
  { cap: 90, cost: 800 },
  { cap: 130, cost: 2000 },
  { cap: 180, cost: 5000 },
  { cap: 250, cost: 12000 },
  { cap: 350, cost: 25000 },
  { cap: 500, cost: 50000 }
];

// Studnia ustala limit spryskiwaczy. Spryskiwacz przyspiesza wzrost pól obok o 15%.
export const WELL = [
  { sprinklers: 4 },
  { sprinklers: 8, cost: 6000 },
  { sprinklers: 12, cost: 15000 }
];
export const SPRINKLER_BOOST = 0.15;

export const xpForLevel = level => Math.round(20 + 15 * level + 6 * level * level);
export const MAX_LEVEL = 40;

export const ITEMS = {
  wheat:      { name: 'Pszenica', icon: '🌾', price: 4 },
  carrot:     { name: 'Marchew', icon: '🥕', price: 8 },
  corn:       { name: 'Kukurydza', icon: '🌽', price: 12 },
  strawberry: { name: 'Truskawki', icon: '🍓', price: 20 },
  potato:     { name: 'Ziemniaki', icon: '🥔', price: 13 },
  tomato:     { name: 'Pomidory', icon: '🍅', price: 21 },
  cabbage:    { name: 'Kapusta', icon: '🥬', price: 38 },
  sunflower:  { name: 'Słonecznik', icon: '🌻', price: 30 },
  pumpkin:    { name: 'Dynia', icon: '🎃', price: 85 },
  watermelon: { name: 'Arbuz', icon: '🍉', price: 150 },

  egg:        { name: 'Jajka', icon: '🥚', price: 16 },
  milk:       { name: 'Mleko', icon: '🥛', price: 38 },
  truffle:    { name: 'Trufle', icon: '🍄', price: 80 },
  wool:       { name: 'Wełna', icon: '🧶', price: 100 },
  honey:      { name: 'Miód', icon: '🍯', price: 70 },

  apple:      { name: 'Jabłka', icon: '🍎', price: 11 },
  cherry:     { name: 'Wiśnie', icon: '🍒', price: 14 },
  pear:       { name: 'Gruszki', icon: '🍐', price: 18 },
  peach:      { name: 'Brzoskwinie', icon: '🍑', price: 26 },

  flour:      { name: 'Mąka', icon: '@sack:#f4ead2', price: 16 },
  cornmeal:   { name: 'Mąka kukurydziana', icon: '@sack:#f5d36b', price: 42 },
  bread:      { name: 'Chleb wiejski', icon: '🍞', price: 60 },
  carrotcake: { name: 'Ciasto marchewkowe', icon: '🍰', price: 110 },
  applepie:   { name: 'Szarlotka', icon: '🥧', price: 100 },
  cornbread:  { name: 'Bułki kukurydziane', icon: '🥖', price: 130 },
  pizza:      { name: 'Pizza wiejska', icon: '🍕', price: 260 },
  butter:     { name: 'Masło', icon: '🧈', price: 90 },
  cheese:     { name: 'Ser', icon: '🧀', price: 130 },
  yogurt:     { name: 'Jogurt truskawkowy', icon: '🍨', price: 120 },
  jam:        { name: 'Dżem truskawkowy', icon: '@jar:#d8283a', price: 125 },
  cherryjam:  { name: 'Konfitura wiśniowa', icon: '@jar:#7d1028', price: 105 },
  ketchup:    { name: 'Keczup', icon: '@bottle:#d42a1d', price: 135 },
  juice:      { name: 'Sok jabłkowy', icon: '🧃', price: 64 },
  oil:        { name: 'Olej słonecznikowy', icon: '@bottle:#f2c230', price: 190 },
  fries:      { name: 'Frytki', icon: '🍟', price: 260 },
  scarf:      { name: 'Szalik', icon: '🧣', price: 230 },
  sweater:    { name: 'Sweter', icon: '🧥', price: 360 },
  soup:       { name: 'Zupa dyniowa', icon: '🍲', price: 290 },
  pierogi:    { name: 'Pierogi ruskie', icon: '🥟', price: 280 },
  bigos:      { name: 'Bigos', icon: '🥘', price: 340 },
  honeycake:  { name: 'Miodownik', icon: '🎂', price: 250 }
};

// look: sposób rysowania rośliny; c1/c2 — kolory owocu/kłosa.
export const CROPS = {
  wheat:      { lvl: 1, seed: 5, time: 45, yield: 2, xp: 1, look: 'grain', c1: '#ecc94b', c2: '#c9962c' },
  carrot:     { lvl: 2, seed: 9, time: 120, yield: 2, xp: 2, look: 'carrot', c1: '#f08a24', c2: '#5fae3a' },
  corn:       { lvl: 3, seed: 14, time: 240, yield: 2, xp: 3, look: 'corn', c1: '#f5d33d', c2: '#6bab3e' },
  strawberry: { lvl: 4, seed: 24, time: 360, yield: 2, xp: 4, look: 'berry', c1: '#e23240', c2: '#4f9f35' },
  potato:     { lvl: 5, seed: 20, time: 600, yield: 3, xp: 5, look: 'potato', c1: '#f7f2e4', c2: '#5c9e3a' },
  tomato:     { lvl: 7, seed: 34, time: 900, yield: 3, xp: 6, look: 'tomato', c1: '#e8382a', c2: '#4b9a35' },
  cabbage:    { lvl: 8, seed: 40, time: 1500, yield: 2, xp: 8, look: 'cabbage', c1: '#9fd166', c2: '#6aa83f' },
  sunflower:  { lvl: 10, seed: 50, time: 1800, yield: 3, xp: 9, look: 'sunflower', c1: '#f7c51d', c2: '#5a9a33' },
  pumpkin:    { lvl: 12, seed: 80, time: 3600, yield: 2, xp: 14, look: 'pumpkin', c1: '#f08b1c', c2: '#5b9b36' },
  watermelon: { lvl: 14, seed: 120, time: 7200, yield: 2, xp: 20, look: 'melon', c1: '#3f8f2f', c2: '#5fae3a' }
};

export const ANIMALS = {
  chicken: { name: 'Kura', lvl: 2, cost: 150, food: 'wheat', foodN: 1, time: 180, product: 'egg', xp: 2 },
  cow:     { name: 'Krowa', lvl: 4, cost: 800, food: 'corn', foodN: 1, time: 480, product: 'milk', xp: 4 },
  pig:     { name: 'Świnka', lvl: 6, cost: 1300, food: 'carrot', foodN: 2, time: 900, product: 'truffle', xp: 6 },
  sheep:   { name: 'Owca', lvl: 9, cost: 2200, food: 'cabbage', foodN: 1, time: 1500, product: 'wool', xp: 9 }
};

// Drzewa sadzi się raz, owocują wiele razy. Pierwsze owoce po 1,5× czasu.
export const TREES = {
  apple:  { name: 'Jabłoń', lvl: 3, cost: 250, time: 480, fruit: 'apple', n: 3, xp: 3, color: '#e23b2e' },
  cherry: { name: 'Wiśnia', lvl: 6, cost: 400, time: 720, fruit: 'cherry', n: 4, xp: 4, color: '#a3122a' },
  pear:   { name: 'Grusza', lvl: 8, cost: 550, time: 900, fruit: 'pear', n: 3, xp: 5, color: '#c9d34a' },
  peach:  { name: 'Brzoskwinia', lvl: 12, cost: 800, time: 1500, fruit: 'peach', n: 3, xp: 7, color: '#f59a5b' }
};

// kind: house | storage | orders | well | prod | hive
export const BUILDINGS = {
  house:   { name: 'Dom', w: 3, h: 3, kind: 'house', fixed: true },
  barn:    { name: 'Stodoła', w: 3, h: 3, kind: 'storage', fixed: true },
  board:   { name: 'Tablica zamówień', w: 2, h: 2, kind: 'orders', fixed: true },
  well:    { name: 'Studnia', w: 1, h: 1, kind: 'well', lvl: 4, cost: 2500, build: 60, xp: 20, max: 1 },
  mill:    {
    name: 'Młyn', w: 2, h: 2, kind: 'prod', lvl: 3, cost: 600, build: 30, xp: 10, max: 1,
    recipes: [
      { out: 'flour', in: { wheat: 3 }, time: 120, xp: 2 },
      { out: 'cornmeal', in: { corn: 3 }, time: 300, xp: 4, lvl: 6 }
    ]
  },
  bakery:  {
    name: 'Piekarnia', w: 2, h: 2, kind: 'prod', lvl: 5, cost: 1500, build: 60, xp: 15, max: 1,
    recipes: [
      { out: 'bread', in: { flour: 2, egg: 1 }, time: 300, xp: 4 },
      { out: 'carrotcake', in: { flour: 2, carrot: 3, egg: 1 }, time: 600, xp: 6, lvl: 6 },
      { out: 'applepie', in: { flour: 2, apple: 3, egg: 1 }, time: 720, xp: 7, lvl: 7 },
      { out: 'cornbread', in: { cornmeal: 2, milk: 1 }, time: 900, xp: 8, lvl: 9 },
      { out: 'pizza', in: { flour: 2, cheese: 1, tomato: 3 }, time: 1500, xp: 14, lvl: 15 },
      { out: 'honeycake', in: { flour: 2, honey: 1, egg: 2 }, time: 1200, xp: 12, lvl: 12 }
    ]
  },
  dairy:   {
    name: 'Mleczarnia', w: 2, h: 2, kind: 'prod', lvl: 7, cost: 2500, build: 90, xp: 20, max: 1,
    recipes: [
      { out: 'butter', in: { milk: 2 }, time: 360, xp: 4 },
      { out: 'cheese', in: { milk: 3 }, time: 720, xp: 6 },
      { out: 'yogurt', in: { milk: 1, strawberry: 3 }, time: 600, xp: 6, lvl: 8 }
    ]
  },
  jamhouse: {
    name: 'Przetwórnia owoców', w: 2, h: 2, kind: 'prod', lvl: 9, cost: 3500, build: 120, xp: 25, max: 1,
    recipes: [
      { out: 'juice', in: { apple: 4 }, time: 480, xp: 4 },
      { out: 'jam', in: { strawberry: 5 }, time: 600, xp: 6 },
      { out: 'cherryjam', in: { cherry: 5 }, time: 720, xp: 7 },
      { out: 'ketchup', in: { tomato: 5 }, time: 900, xp: 8, lvl: 10 }
    ]
  },
  oilmill: {
    name: 'Olejarnia', w: 2, h: 2, kind: 'prod', lvl: 11, cost: 5000, build: 150, xp: 30, max: 1,
    recipes: [
      { out: 'oil', in: { sunflower: 5 }, time: 1200, xp: 10 },
      { out: 'fries', in: { potato: 4, oil: 1 }, time: 600, xp: 10 }
    ]
  },
  loom:    {
    name: 'Tkalnia', w: 2, h: 2, kind: 'prod', lvl: 13, cost: 7000, build: 180, xp: 35, max: 1,
    recipes: [
      { out: 'scarf', in: { wool: 2 }, time: 1200, xp: 12 },
      { out: 'sweater', in: { wool: 3 }, time: 1800, xp: 18 }
    ]
  },
  kitchen: {
    name: 'Wiejska kuchnia', w: 2, h: 2, kind: 'prod', lvl: 16, cost: 10000, build: 240, xp: 40, max: 1,
    recipes: [
      { out: 'soup', in: { pumpkin: 2, butter: 1 }, time: 1500, xp: 14 },
      { out: 'pierogi', in: { flour: 2, potato: 3, cheese: 1 }, time: 1800, xp: 16 },
      { out: 'bigos', in: { cabbage: 3, truffle: 1, tomato: 2 }, time: 2400, xp: 20 }
    ]
  },
  hive:    { name: 'Ul', w: 1, h: 1, kind: 'hive', lvl: 10, cost: 1800, build: 20, xp: 8, product: 'honey', time: 1200, hiveXp: 5 }
};

// Dekoracje. flat: rysowane płasko na ziemi (ścieżki). ducats: cena w dukatach.
export const DECOR = {
  path:      { name: 'Ścieżka', cost: 10, lvl: 1, flat: true },
  fence_a:   { name: 'Płotek ↘', cost: 20, lvl: 1 },
  fence_b:   { name: 'Płotek ↙', cost: 20, lvl: 1 },
  flowers:   { name: 'Rabatka kwiatów', cost: 40, lvl: 1 },
  bush:      { name: 'Krzew', cost: 30, lvl: 2 },
  scarecrow: { name: 'Strach na wróble', cost: 200, lvl: 2 },
  hay:       { name: 'Snopek siana', cost: 80, lvl: 3 },
  barrel:    { name: 'Beczka', cost: 60, lvl: 3 },
  bench:     { name: 'Ławka', cost: 120, lvl: 3 },
  sprinkler: { name: 'Spryskiwacz', cost: 150, lvl: 4, special: 'sprinkler' },
  lamp:      { name: 'Latarnia', cost: 150, lvl: 5 },
  spruce:    { name: 'Świerk', cost: 100, lvl: 5 },
  birch:     { name: 'Brzoza', cost: 120, lvl: 7 },
  pond:      { name: 'Oczko wodne', cost: 900, lvl: 6, w: 2, h: 2 },
  cart:      { name: 'Wóz z dyniami', cost: 600, lvl: 12, w: 2, h: 1 },
  fountain:  { name: 'Fontanna', ducats: 8, lvl: 8, w: 2, h: 2 },
  gnome:     { name: 'Krasnal ogrodowy', ducats: 2, lvl: 2 }
};

export const OBSTACLES = {
  weeds: { name: 'Chwasty', clear: 10, xp: 2 },
  stone: { name: 'Kamień', clear: 25, xp: 3 },
  stump: { name: 'Pień', clear: 40, xp: 4 }
};

export const NEIGHBORS = [
  { id: 'ania', name: 'Ania', avatar: '👩‍🌾', lvl: 14 },
  { id: 'zenon', name: 'Sołtys Zenon', avatar: '👨‍🦳', lvl: 27 },
  { id: 'halina', name: 'Babcia Halina', avatar: '👵', lvl: 33 },
  { id: 'krzys', name: 'Krzysiek', avatar: '🧑‍🌾', lvl: 9 },
  { id: 'ola', name: 'Ola z miasta', avatar: '👩', lvl: 5 }
];

export const CUSTOMERS = [
  { name: 'Pani Halinka', avatar: '👵' },
  { name: 'Sołtys Zenon', avatar: '👨‍🦳' },
  { name: 'Kucharz Mietek', avatar: '👨‍🍳' },
  { name: 'Listonosz Józek', avatar: '👨‍🦰' },
  { name: 'Pani z cukierni', avatar: '👩‍🍳' },
  { name: 'Turyści', avatar: '🧳' },
  { name: 'Sklepik u Basi', avatar: '👩‍🦰' },
  { name: 'Szkoła', avatar: '🧒' }
];

// Nagrody za kolejne dni logowania (powtarzają się co 7 dni).
export const DAILY = [
  { coins: 100 },
  { coins: 200 },
  { coins: 200, ducats: 1 },
  { coins: 350 },
  { coins: 400, ducats: 1 },
  { coins: 500 },
  { coins: 800, ducats: 3 }
];

// Zadania fabularne — po kolei, aktywne są zawsze 3 pierwsze niewykonane.
// t: typ zdarzenia, k: klucz (np. id uprawy), n: ile razy.
export const QUESTS = [
  { title: 'Zaoraj ziemię', text: 'Zaoraj 4 pola pługiem 🚜.', t: 'plow', n: 4, icon: '🚜', reward: { coins: 50, xp: 10 } },
  { title: 'Pierwszy siew', text: 'Posiej pszenicę na 4 polach.', t: 'plant', k: 'wheat', n: 4, icon: '🌱', reward: { coins: 50, xp: 10 } },
  { title: 'Złote kłosy', text: 'Zbierz 8 sztuk pszenicy.', t: 'harvest', k: 'wheat', n: 8, icon: '🌾', reward: { coins: 80, xp: 15 } },
  { title: 'Porządki', text: 'Usuń 3 przeszkody (chwasty, kamienie, pnie).', t: 'clear', n: 3, icon: '🪨', reward: { coins: 60, xp: 10 } },
  { title: 'Pierwsza kura', text: 'Kup kurę w sklepie (zakładka Zwierzęta).', t: 'buy', k: 'chicken', n: 1, icon: '🐔', reward: { coins: 60, xp: 10 } },
  { title: 'Głodna kura', text: 'Nakarm kury pszenicą 3 razy.', t: 'feed', k: 'chicken', n: 3, icon: '🐔', reward: { coins: 80, xp: 15 } },
  { title: 'Świeże jajka', text: 'Zbierz 3 jajka.', t: 'collect', k: 'egg', n: 3, icon: '🥚', reward: { coins: 100, xp: 20 } },
  { title: 'Pierwszy klient', text: 'Zrealizuj 2 zamówienia z tablicy.', t: 'order', n: 2, icon: '📋', reward: { coins: 150, xp: 20, ducats: 1 } },
  { title: 'Wiatrak', text: 'Postaw młyn (Sklep → Budynki).', t: 'build', k: 'mill', n: 1, icon: '🌬️', reward: { coins: 150, xp: 25 } },
  { title: 'Mąka z młyna', text: 'Zmiel 3 worki mąki.', t: 'produce', k: 'flour', n: 3, icon: '🌾', reward: { coins: 150, xp: 25 } },
  { title: 'Sad', text: 'Posadź jabłoń.', t: 'buy', k: 'apple', n: 1, icon: '🍎', reward: { coins: 120, xp: 20 } },
  { title: 'Kukurydza', text: 'Zbierz 10 kolb kukurydzy.', t: 'harvest', k: 'corn', n: 10, icon: '🌽', reward: { coins: 150, xp: 25 } },
  { title: 'Mućka', text: 'Kup krowę.', t: 'buy', k: 'cow', n: 1, icon: '🐄', reward: { coins: 200, xp: 30 } },
  { title: 'Piekarz', text: 'Postaw piekarnię.', t: 'build', k: 'bakery', n: 1, icon: '🥖', reward: { coins: 250, xp: 30, ducats: 1 } },
  { title: 'Wiejski chleb', text: 'Upiecz 3 bochenki chleba.', t: 'produce', k: 'bread', n: 3, icon: '🍞', reward: { coins: 250, xp: 35 } },
  { title: 'Dobry sąsiad', text: 'Pomóż 3 sąsiadom.', t: 'help', n: 3, icon: '🤝', reward: { coins: 200, xp: 30 } },
  { title: 'Ładna zagroda', text: 'Postaw 5 dekoracji.', t: 'decor', n: 5, icon: '🌷', reward: { coins: 200, xp: 30 } },
  { title: 'Mleczarz', text: 'Postaw mleczarnię i zrób 2 sery.', t: 'produce', k: 'cheese', n: 2, icon: '🧀', reward: { coins: 400, xp: 50 } },
  { title: 'Studnia', text: 'Wybuduj studnię — pozwala stawiać spryskiwacze.', t: 'build', k: 'well', n: 1, icon: '⛲', reward: { coins: 300, xp: 40 } },
  { title: 'Deszczyk', text: 'Postaw 2 spryskiwacze przy polach.', t: 'buy', k: 'sprinkler', n: 2, icon: '💧', reward: { coins: 300, xp: 40, ducats: 1 } },
  { title: 'Handlarz', text: 'Zrealizuj 15 zamówień.', t: 'order', n: 15, icon: '🚚', reward: { coins: 800, xp: 80, ducats: 2 } },
  { title: 'Więcej ziemi', text: 'Kup rozszerzenie gospodarstwa.', t: 'expand', n: 1, icon: '🗺️', reward: { coins: 500, xp: 60 } },
  { title: 'Pszczelarz', text: 'Postaw ul i zbierz 3 słoiki miodu.', t: 'collect', k: 'honey', n: 3, icon: '🐝', reward: { coins: 600, xp: 70 } },
  { title: 'Owieczki', text: 'Zbierz 5 kłębków wełny.', t: 'collect', k: 'wool', n: 5, icon: '🐑', reward: { coins: 900, xp: 90, ducats: 2 } },
  { title: 'Gospodarz roku', text: 'Osiągnij 20. poziom.', t: 'level', n: 20, icon: '🏆', reward: { coins: 3000, xp: 0, ducats: 5 } }
];

// =====================================================================
// Rozszerzenie: mechaniki z oryginału (wędkowanie, kopalnia, kawiarnia,
// kurort nad morzem, dom do urządzania, rozmnażanie, automatyzacja…).
// =====================================================================

Object.assign(ITEMS, {
  tulip:      { name: 'Tulipany', icon: '🌷', price: 26 },
  rose:       { name: 'Róże', icon: '🌹', price: 40 },
  blueberry:  { name: 'Borówki', icon: '🫐', price: 30 },
  onion:      { name: 'Cebula', icon: '🧅', price: 22 },
  pepper:     { name: 'Papryka', icon: '🫑', price: 34 },
  eggplant:   { name: 'Bakłażan', icon: '🍆', price: 48 },
  pineapple:  { name: 'Ananas', icon: '🍍', price: 130 },
  plum:       { name: 'Śliwki', icon: '@fruit:#6a3d8f', price: 24 },
  lemon:      { name: 'Cytryny', icon: '🍋', price: 28 },
  orange:     { name: 'Pomarańcze', icon: '🍊', price: 32 },
  redegg:     { name: 'Czerwone jajka', icon: '@egg:#c8342b', price: 45 },
  macadamia:  { name: 'Orzechy makadamia', icon: '🌰', price: 120 },
  nectar:     { name: 'Nektar', icon: '@jar:#f2a630', price: 160 },

  carp:       { name: 'Karp', icon: '@fish:#c99a3a', price: 30 },
  perch:      { name: 'Okoń', icon: '@fish:#7aa24a', price: 40 },
  trout:      { name: 'Pstrąg', icon: '@fish:#d98a8a', price: 55 },
  pike:       { name: 'Szczupak', icon: '@fish:#5f7f4a', price: 80 },
  catfish:    { name: 'Sum', icon: '@fish:#4a4a55', price: 120 },
  goldfish:   { name: 'Złota rybka', icon: '@fish:#ffb21a', price: 300 },
  boot:       { name: 'Stary but', icon: '👢', price: 1 },

  stone:      { name: 'Kamień', icon: '🪨', price: 8 },
  coal:       { name: 'Węgiel', icon: '@ore:#2e2e33', price: 20 },
  iron:       { name: 'Ruda żelaza', icon: '@ore:#a5694a', price: 35 },
  gold:       { name: 'Bryłka złota', icon: '@ore:#f2c230', price: 120 },
  crystal:    { name: 'Kryształ', icon: '🔮', price: 250 },
  wood:       { name: 'Drewno', icon: '🪵', price: 10 },
  plank:      { name: 'Deski', icon: '@plank:#c9925a', price: 30 },
  nail:       { name: 'Gwoździe', icon: '@nail:#8d96a0', price: 45 },
  brick:      { name: 'Cegły', icon: '@brick:#b5533a', price: 40 },
  ring:       { name: 'Złoty pierścionek', icon: '💍', price: 600 },

  friedfish:  { name: 'Karp smażony', icon: '🍽️', price: 110 },
  fishsoup:   { name: 'Zupa rybna', icon: '🥣', price: 210 },
  smokedtrout:{ name: 'Wędzony pstrąg', icon: '@fish:#8a4a22', price: 170 },
  bouquet:    { name: 'Bukiet róż', icon: '💐', price: 180 },
  wreath:     { name: 'Wianek', icon: '🌼', price: 160 },
  pisanka:    { name: 'Pisanki', icon: '@pisanka:#3f7fd6', price: 150 },
  muffin:     { name: 'Babeczki jagodowe', icon: '🧁', price: 150 },
  salad:      { name: 'Sałatka warzywna', icon: '🥗', price: 170 },
  lecho:      { name: 'Leczo', icon: '🍛', price: 230 },
  cookies:    { name: 'Ciastka z makadamią', icon: '🍪', price: 420 },
  lemonade:   { name: 'Lemoniada', icon: '🍹', price: 130 },
  icecream:   { name: 'Lody truskawkowe', icon: '🍦', price: 110 },
  orangejuice:{ name: 'Sok pomarańczowy', icon: '@bottle:#f39c1f', price: 160 },
  plumjam:    { name: 'Powidła śliwkowe', icon: '@jar:#5a2d7a', price: 140 },
  sapling_plum:   { name: 'Sadzonka śliwy', icon: '@sapling:#6a3d8f', price: 90 },
  sapling_lemon:  { name: 'Sadzonka cytryny', icon: '@sapling:#f2d22e', price: 130 },
  sapling_orange: { name: 'Sadzonka pomarańczy', icon: '@sapling:#f39c1f', price: 160 },
  exoticseeds:    { name: 'Nasiona egzotyczne', icon: '@seedbag:#f0b400', price: 60 }
});

Object.assign(CROPS, {
  tulip:     { lvl: 6, seed: 22, time: 600, yield: 2, xp: 4, look: 'flower', c1: '#ff4d6d', c2: '#5aa83a' },
  rose:      { lvl: 9, seed: 34, time: 1200, yield: 2, xp: 6, look: 'flower', c1: '#c8102e', c2: '#3f8a2a', petals: 'rose' },
  blueberry: { lvl: 11, seed: 28, time: 900, yield: 3, xp: 6, look: 'bush', c1: '#3b4fa8', c2: '#4f9032' },
  onion:     { lvl: 13, seed: 18, time: 1200, yield: 3, xp: 6, look: 'carrot', c1: '#e8d2a6', c2: '#5fae3a' },
  pepper:    { lvl: 15, seed: 30, time: 1500, yield: 3, xp: 8, look: 'tomato', c1: '#3fae3a', c2: '#4b9a35' },
  eggplant:  { lvl: 17, seed: 44, time: 2400, yield: 3, xp: 11, look: 'tomato', c1: '#5b2a6e', c2: '#4b9a35' },
  pineapple: { lvl: 18, seed: 0, exotic: 'exoticseeds', time: 5400, yield: 2, xp: 22, look: 'pineapple', c1: '#f2b632', c2: '#4f8a3a' }
});

Object.assign(ANIMALS, {
  redhen: { name: 'Czerwona kura', lvl: 11, cost: 1600, food: 'corn', foodN: 2, time: 600, product: 'redegg', xp: 6 }
});

// Drzewa z szkółki: do posadzenia potrzebna jest sadzonka.
Object.assign(TREES, {
  plum:   { name: 'Śliwa', lvl: 12, cost: 500, time: 1200, fruit: 'plum', n: 3, xp: 6, color: '#6a3d8f', sapling: 'sapling_plum' },
  lemon:  { name: 'Cytryna', lvl: 16, cost: 900, time: 1800, fruit: 'lemon', n: 3, xp: 8, color: '#f2d22e', sapling: 'sapling_lemon' },
  orange: { name: 'Pomarańcza', lvl: 19, cost: 1200, time: 2400, fruit: 'orange', n: 3, xp: 10, color: '#f39c1f', sapling: 'sapling_orange' }
});

BUILDINGS.bakery.recipes.push(
  { out: 'muffin', in: { flour: 2, blueberry: 3, egg: 1 }, time: 900, xp: 9, lvl: 11 },
  { out: 'cookies', in: { flour: 2, macadamia: 1, butter: 1 }, time: 1800, xp: 18, lvl: 17 }
);
BUILDINGS.dairy.recipes.push({ out: 'icecream', in: { milk: 1, strawberry: 2 }, time: 600, xp: 6, lvl: 15 });
BUILDINGS.jamhouse.recipes.push(
  { out: 'plumjam', in: { plum: 5 }, time: 900, xp: 8, lvl: 13 },
  { out: 'lemonade', in: { lemon: 3, honey: 1 }, time: 900, xp: 9, lvl: 16 },
  { out: 'orangejuice', in: { orange: 4 }, time: 1200, xp: 11, lvl: 19 }
);
BUILDINGS.kitchen.recipes.push(
  { out: 'salad', in: { pepper: 2, tomato: 2, onion: 1 }, time: 1200, xp: 12, lvl: 16 },
  { out: 'lecho', in: { pepper: 3, tomato: 2, eggplant: 1 }, time: 2100, xp: 16, lvl: 18 }
);

Object.assign(BUILDINGS, {
  fishfry: {
    name: 'Smażalnia ryb', w: 2, h: 2, kind: 'prod', lvl: 8, cost: 2800, build: 90, xp: 20, max: 1,
    recipes: [
      { out: 'friedfish', in: { carp: 2, flour: 1 }, time: 600, xp: 6 },
      { out: 'smokedtrout', in: { trout: 2, wood: 1 }, time: 1800, xp: 12, lvl: 10 },
      { out: 'fishsoup', in: { perch: 2, potato: 2, onion: 1 }, time: 1200, xp: 12, lvl: 13 }
    ]
  },
  sawmill: {
    name: 'Tartak', w: 2, h: 2, kind: 'prod', lvl: 9, cost: 3200, build: 120, xp: 22, max: 1,
    recipes: [{ out: 'plank', in: { wood: 3 }, time: 480, xp: 4 }]
  },
  forge: {
    name: 'Kuźnia', w: 2, h: 2, kind: 'prod', lvl: 10, cost: 4500, build: 150, xp: 28, max: 1,
    recipes: [
      { out: 'nail', in: { iron: 1, coal: 1 }, time: 600, xp: 5 },
      { out: 'brick', in: { stone: 3, coal: 1 }, time: 720, xp: 5 },
      { out: 'ring', in: { gold: 2, crystal: 1 }, time: 3600, xp: 30, lvl: 18 }
    ]
  },
  butterfly: {
    name: 'Dom motyli', w: 2, h: 2, kind: 'prod', lvl: 11, cost: 6000, build: 180, xp: 30, max: 1,
    recipes: [
      { out: 'nectar', in: { tulip: 3 }, time: 1500, xp: 10 },
      { out: 'nectar', in: { rose: 3 }, time: 1200, xp: 10 }
    ]
  },
  treenursery: {
    name: 'Szkółka drzew', w: 2, h: 2, kind: 'prod', lvl: 12, cost: 6500, build: 180, xp: 30, max: 1,
    recipes: [
      { out: 'sapling_plum', in: { apple: 2, honey: 1 }, time: 1800, xp: 10 },
      { out: 'sapling_lemon', in: { peach: 2, honey: 1 }, time: 2700, xp: 14, lvl: 16 },
      { out: 'sapling_orange', in: { peach: 3, nectar: 1 }, time: 3600, xp: 18, lvl: 19 }
    ]
  },
  craft: {
    name: 'Pracownia rękodzieła', w: 2, h: 2, kind: 'prod', lvl: 13, cost: 7500, build: 200, xp: 35, max: 1,
    recipes: [
      { out: 'bouquet', in: { rose: 4 }, time: 720, xp: 9 },
      { out: 'wreath', in: { tulip: 3, rose: 2 }, time: 900, xp: 10 },
      { out: 'pisanka', in: { redegg: 2, nectar: 1 }, time: 1500, xp: 14 }
    ]
  },
  kangaroo: {
    name: 'Wybieg kangurów', w: 3, h: 3, kind: 'prod', lvl: 17, cost: 15000, build: 300, xp: 50, max: 1,
    recipes: [{ out: 'macadamia', in: { apple: 4 }, time: 1800, xp: 14 }]
  },
  pier:     { name: 'Pomost rybacki', w: 2, h: 2, kind: 'fishing', lvl: 6, cost: 1200, build: 60, xp: 15, max: 1 },
  mine:     { name: 'Kopalnia', w: 2, h: 2, kind: 'mine', lvl: 8, cost: 3000, build: 120, xp: 25, max: 1 },
  cafe:     { name: 'Kawiarnia', w: 2, h: 2, kind: 'cafe', lvl: 7, cost: 2000, build: 90, xp: 20, max: 1 },
  exotic:   { name: 'Egzotyczny sklep', w: 2, h: 2, kind: 'exotic', lvl: 10, cost: 2500, build: 90, xp: 20, max: 1 },
  harvester:{ name: 'Dom Zbiorów', w: 2, h: 2, kind: 'harvester', lvl: 12, cost: 8000, build: 240, xp: 40, max: 1 },
  nursery:  { name: 'Pokój malucha', w: 2, h: 2, kind: 'breed', lvl: 14, cost: 9000, build: 240, xp: 40, max: 1 },
  ranch:    { name: 'Ranczo ogrodowe', w: 3, h: 3, kind: 'ranch', lvl: 22, cost: 60000, build: 600, xp: 80, max: 1 }
});

// Ulepszenia budynków produkcyjnych: poziom 2 i 3 (szybciej + dodatkowe miejsce w kolejce).
export const UPGRADES = [
  null,
  { coins: 0.5, plank: 4, nail: 2, brick: 2 },
  { coins: 1, plank: 8, nail: 5, brick: 5 }
];
export const UPGRADE_SPEED = 0.15;

// Dekoracje za inne waluty: shells (muszelki), medals (medale), tokens (żetony wydarzenia).
Object.assign(DECOR, {
  deckchair:  { name: 'Leżak', price: { shells: 20 }, lvl: 15, shop: 'resort' },
  parasol:    { name: 'Parasol plażowy', price: { shells: 30 }, lvl: 15, shop: 'resort' },
  lighthouse: { name: 'Latarnia morska', price: { shells: 150 }, lvl: 15, shop: 'resort' },
  swing:      { name: 'Huśtawka', price: { medals: 15 }, lvl: 7, shop: 'cafe' },
  statue:     { name: 'Figura krówki', price: { medals: 30 }, lvl: 7, shop: 'cafe' },
  gazebo:     { name: 'Altana', price: { medals: 60 }, lvl: 7, w: 2, h: 2, shop: 'cafe' },
  eggtree:    { name: 'Drzewko z pisankami', price: { tokens: 40 }, lvl: 1, shop: 'event', season: 'spring' },
  sandcastle: { name: 'Zamek z piasku', price: { tokens: 40 }, lvl: 1, shop: 'event', season: 'summer' },
  pumpkins:   { name: 'Dyniowe lampiony', price: { tokens: 40 }, lvl: 1, shop: 'event', season: 'autumn' },
  snowman:    { name: 'Bałwan', price: { tokens: 40 }, lvl: 1, shop: 'event', season: 'winter' }
});

// Wędkowanie: rzuty odnawiają się z czasem, ryba zależy od losu i poziomu.
export const FISHING = {
  maxCasts: 8, regen: 150,
  table: [
    { id: 'carp', w: 40, lvl: 1 }, { id: 'perch', w: 28, lvl: 1 }, { id: 'boot', w: 8, lvl: 1 },
    { id: 'trout', w: 18, lvl: 8 }, { id: 'pike', w: 10, lvl: 10 }, { id: 'catfish', w: 5, lvl: 14 },
    { id: 'goldfish', w: 1.2, lvl: 6 }
  ]
};

// Kopalnia: wyprawy górników o różnej głębokości.
export const MINE = [
  { id: 'shallow', name: 'Płytki chodnik', lvl: 8, food: { bread: 1 }, time: 300, loot: [['stone', 2, 4, 1], ['coal', 0, 2, 0.8], ['iron', 0, 1, 0.3]] },
  { id: 'medium', name: 'Średni szyb', lvl: 11, food: { bread: 2, cheese: 1 }, time: 1200, loot: [['coal', 2, 4, 1], ['iron', 1, 3, 1], ['gold', 0, 1, 0.35], ['stone', 1, 3, 0.6]] },
  { id: 'deep', name: 'Głęboka sztolnia', lvl: 15, food: { pizza: 1, bread: 2 }, time: 3600, loot: [['iron', 2, 4, 1], ['gold', 1, 2, 0.8], ['crystal', 0, 1, 0.45], ['coal', 2, 4, 0.7]] }
];

// Dom do urządzenia: lepszy mebel zastępuje słabszy w tej samej kategorii.
export const FURNITURE = {
  cats: [
    { id: 'bed', name: 'Łóżko', icon: '🛏️' }, { id: 'table', name: 'Stół', icon: '🍽️' },
    { id: 'wardrobe', name: 'Szafa', icon: '🚪' }, { id: 'lamp', name: 'Lampa', icon: '🪔' },
    { id: 'rug', name: 'Dywan', icon: '🧶' }, { id: 'picture', name: 'Obraz', icon: '🖼️' },
    { id: 'stove', name: 'Piec kaflowy', icon: '🔥' }, { id: 'armchair', name: 'Fotel', icon: '🪑' }
  ],
  tiers: [
    { name: 'proste', pts: 5, cost: { coins: 300 } },
    { name: 'solidne', pts: 15, cost: { coins: 2500, plank: 2 } },
    { name: 'eleganckie', pts: 40, cost: { coins: 9000, plank: 4, nail: 2 } },
    { name: 'luksusowe', pts: 90, cost: { ducats: 6 } }
  ],
  lvl: 4
};

// Kurort nad morzem: goście płacą muszelkami, budynki rozbudowuje się muszelkami i materiałami.
export const RESORT = {
  lvl: 15, unlock: { coins: 20000, plank: 10, brick: 5 },
  buildings: [
    { id: 'inn', name: 'Pensjonat', icon: '🏨', desc: '+1 miejsce dla gości na poziom', max: 5 },
    { id: 'beach', name: 'Plaża', icon: '🏖️', desc: 'goście przychodzą częściej i dają napiwki', max: 5 },
    { id: 'pier', name: 'Molo', icon: '⚓', desc: '+1 rzut wędką i lepsze ryby', max: 3 },
    { id: 'kiosk', name: 'Kiosk z pamiątkami', icon: '🐚', desc: 'muszelki co godzinę', max: 3 }
  ],
  cost: lvl => ({ shells: 25 * lvl, plank: 3 * lvl, brick: 2 * lvl }),
  guests: ['🧑‍🦰', '👱‍♀️', '👨‍👩‍👧', '🧔', '👵', '🧑‍🎤', '👨‍🦯', '👩‍🦱', '🏄']
};

// Plan podróży: wóz zabiera towar i wraca z nagrodą.
export const TRIPS = [
  { id: 'forest', name: 'Wyprawa do lasu', icon: '🌲', lvl: 5, need: { bread: 2 }, time: 900, reward: { wood: [4, 8], coins: [50, 120] } },
  { id: 'fair', name: 'Jarmark w miasteczku', icon: '🎪', lvl: 8, need: { bread: 2, cheese: 1, jam: 1 }, time: 2700, reward: { coins: [1400, 2200], ducats: [0, 1], medals: [2, 4] } },
  { id: 'port', name: 'Port rybacki', icon: '⚓', lvl: 12, need: { carp: 3, trout: 1 }, time: 3600, reward: { exoticseeds: [2, 3], shells: [8, 14], coins: [600, 900] } },
  { id: 'city', name: 'Targ w mieście', icon: '🏙️', lvl: 18, need: { sweater: 1, cookies: 1, honeycake: 1 }, time: 7200, reward: { coins: [6000, 8000], auto: [3, 4], ducats: [1, 2] } }
];

// Wydarzenia sezonowe — żetony wypadają przy zbiorach, zamówieniach i wędkowaniu.
export const EVENTS = {
  spring: { name: 'Wiosenne pisanki', token: '🐣', months: [2, 3, 4], decor: 'eggtree' },
  summer: { name: 'Letni festyn', token: '🌞', months: [5, 6, 7], decor: 'sandcastle' },
  autumn: { name: 'Święto dyni', token: '🍂', months: [8, 9, 10], decor: 'pumpkins' },
  winter: { name: 'Zimowa kraina', token: '❄️', months: [11, 0, 1], decor: 'snowman' }
};

// Zadania dnia (codzienna lista do zrobienia).
export const DAILY_TASKS = [
  { t: 'harvest', name: 'Zbierz plony', icon: '🌾', n: [20, 40] },
  { t: 'collect', name: 'Odbierz produkty od zwierząt', icon: '🥚', n: [5, 10], lvl: 2 },
  { t: 'produce', name: 'Wyprodukuj przetwory', icon: '🏭', n: [3, 6], lvl: 3 },
  { t: 'order', name: 'Zrealizuj zamówienia', icon: '📋', n: [2, 4] },
  { t: 'fish', name: 'Złów ryby', icon: '🎣', n: [3, 5], lvl: 6 },
  { t: 'help', name: 'Pomóż sąsiadom', icon: '🤝', n: [2, 3] },
  { t: 'plant', name: 'Posiej rośliny', icon: '🌱', n: [15, 30] }
];

// Pomoc społeczności w kawiarni — za medale reputacji.
export const CAFE = { lvl: 7, perDay: 4 };

// Egzotyczny sklep: półki odświeżane co 4 h albo za dukaty.
export const EXOTIC = {
  refresh: 4 * 3600, cost: { ducats: 2 },
  pool: [
    { id: 'exoticseeds', n: [2, 4], price: { coins: 400 } },
    { id: 'exoticseeds', n: [5, 6], price: { ducats: 2 } },
    { boost: 'fert', n: [3, 5], price: { coins: 500 } },
    { boost: 'fuel', n: [3, 5], price: { coins: 600 } },
    { boost: 'auto', n: [2, 3], price: { ducats: 2 } },
    { id: 'plank', n: [4, 8], price: { coins: 350 } },
    { id: 'nail', n: [3, 6], price: { coins: 400 } },
    { id: 'brick', n: [3, 6], price: { coins: 400 } },
    { id: 'sapling_plum', n: [1, 1], price: { coins: 700 } },
    { id: 'sapling_lemon', n: [1, 1], price: { ducats: 2 } },
    { id: 'crystal', n: [1, 1], price: { ducats: 3 } },
    { id: 'macadamia', n: [2, 3], price: { coins: 600 } },
    { decor: 'fountain', n: [1, 1], price: { ducats: 6 } },
    { decor: 'gazebo', n: [1, 1], price: { ducats: 5 } }
  ]
};

QUESTS.splice(QUESTS.length - 1, 0,
  { title: 'Wędkarz', text: 'Postaw pomost rybacki i złów 3 ryby.', t: 'fish', n: 3, icon: '🎣', reward: { coins: 300, xp: 40 } },
  { title: 'Przytulny dom', text: 'Kup 2 meble do domu (dotknij domu).', t: 'furnish', n: 2, icon: '🛋️', reward: { coins: 300, xp: 40, ducats: 1 } },
  { title: 'Kawka', text: 'Postaw kawiarnię i pomóż społeczności 2 razy.', t: 'cafe', n: 2, icon: '☕', reward: { coins: 400, xp: 50 } },
  { title: 'Górnik', text: 'Wyślij górników do kopalni 2 razy.', t: 'mine', n: 2, icon: '⛏️', reward: { coins: 500, xp: 60, auto: 2 } },
  { title: 'Lista na dziś', text: 'Wykonaj 3 zadania dnia (Okolica → Zadania dnia).', t: 'dtask', n: 3, icon: '📝', reward: { coins: 500, xp: 50, ducats: 1 } },
  { title: 'W drogę', text: 'Wyślij wóz na 2 wyprawy (Okolica → Plan podróży).', t: 'trip', n: 2, icon: '🛒', reward: { coins: 600, xp: 60 } },
  { title: 'Cieśla', text: 'Zrób 6 desek w tartaku.', t: 'produce', k: 'plank', n: 6, icon: '🪚', reward: { coins: 700, xp: 70 } },
  { title: 'Lepszy budynek', text: 'Ulepsz dowolny budynek produkcyjny.', t: 'upgrade', n: 1, icon: '⬆️', reward: { coins: 800, xp: 80, auto: 2 } },
  { title: 'Rodzinka', text: 'Doczekaj się malucha w Pokoju malucha.', t: 'breed', n: 1, icon: '🍼', reward: { coins: 900, xp: 90, ducats: 2 } },
  { title: 'Nad morze!', text: 'Otwórz kurort nad morzem i obsłuż 3 gości.', t: 'guest', n: 3, icon: '🏖️', reward: { coins: 1500, xp: 120, ducats: 2 } }
);
