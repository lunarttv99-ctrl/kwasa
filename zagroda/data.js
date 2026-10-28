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
