// Content definitions for "Wiejskie życie". Costs and rewards use item ids
// plus two special keys: `coins` (🪙) and `gold` (🌟 złote kłosy).

export const ITEMS = {
  wheat:       { name: 'Pszenica', icon: '🌾', price: 3 },
  carrot:      { name: 'Marchew', icon: '🥕', price: 7 },
  potato:      { name: 'Ziemniaki', icon: '🥔', price: 12 },
  corn:        { name: 'Kukurydza', icon: '🌽', price: 18 },
  tomato:      { name: 'Pomidory', icon: '🍅', price: 26 },
  sunflower:   { name: 'Słonecznik', icon: '🌻', price: 32 },
  strawberry:  { name: 'Truskawki', icon: '🍓', price: 45 },
  pumpkin:     { name: 'Dynia', icon: '🎃', price: 70 },
  cabbage:     { name: 'Kapusta', icon: '🥬', price: 85 },
  cucumber:    { name: 'Ogórki', icon: '🥒', price: 100 },
  egg:         { name: 'Jajka', icon: '🥚', price: 14 },
  milk:        { name: 'Mleko', icon: '🥛', price: 40 },
  honey:       { name: 'Miód', icon: '🍯', price: 60 },
  wool:        { name: 'Wełna', icon: '🧶', price: 55 },
  bread:       { name: 'Chleb wiejski', icon: '🍞', price: 16 },
  popcorn:     { name: 'Popcorn', icon: '🍿', price: 50 },
  pancakes:    { name: 'Placki ziemniaczane', icon: '🥞', price: 75 },
  fishdish:    { name: 'Ryba z ziemniakami', icon: '🍽️', price: 120 },
  soup:        { name: 'Pomidorówka', icon: '🍲', price: 120 },
  cheese:      { name: 'Ser', icon: '🧀', price: 120 },
  honeycake:   { name: 'Miodownik', icon: '🍰', price: 115 },
  jam:         { name: 'Dżem truskawkowy', icon: '🫙', price: 190 },
  sweater:     { name: 'Sweter', icon: '🧥', price: 165 },
  pie:         { name: 'Placek dyniowy', icon: '🥧', price: 160 },
  pierogi:     { name: 'Pierogi ruskie', icon: '🥟', price: 330 },
  bigos:       { name: 'Bigos z grzybami', icon: '🥘', price: 380 },
  mizeria:     { name: 'Mizeria', icon: '🥗', price: 260 },
  apple:       { name: 'Jabłka', icon: '🍎', price: 20 },
  cherry:      { name: 'Wiśnie', icon: '🍒', price: 18 },
  pear:        { name: 'Gruszki', icon: '🍐', price: 32 },
  peach:       { name: 'Brzoskwinie', icon: '🍑', price: 45 },
  flour:       { name: 'Mąka', icon: '🍚', price: 14 },
  juice:       { name: 'Sok jabłkowy', icon: '🧃', price: 85 },
  kompot:      { name: 'Kompot wiśniowy', icon: '🍹', price: 75 },
  smoothie:    { name: 'Koktajl brzoskwiniowy', icon: '🥤', price: 160 },
  butter:      { name: 'Masło', icon: '🧈', price: 95 },
  oil:         { name: 'Olej słonecznikowy', icon: '🛢️', price: 115 },
  fries:       { name: 'Frytki', icon: '🍟', price: 190 },
  donut:       { name: 'Pączki z dżemem', icon: '🍩', price: 290 },
  croissant:   { name: 'Rogaliki maślane', icon: '🥐', price: 170 },
  cupcake:     { name: 'Babeczki wiśniowe', icon: '🧁', price: 115 },
  candy:       { name: 'Cukierki', icon: '🍬', price: 30 },
  pumpkinsoup: { name: 'Zupa dyniowa', icon: '🥣', price: 110 },
  ghostcookie: { name: 'Ciastka-duszki', icon: '🍪', price: 150 },
  potion:      { name: 'Eliksir czarownicy', icon: '🧪', price: 230 },
  fish:        { name: 'Płotka', icon: '🐟', price: 18 },
  carp:        { name: 'Karp', icon: '🐠', price: 60 },
  crayfish:    { name: 'Rak', icon: '🦞', price: 45 },
  mushroom:    { name: 'Grzyby', icon: '🍄', price: 15 },
  wood:        { name: 'Drewno', icon: '🪵', price: 4, material: true },
  stone:       { name: 'Kamień', icon: '🪨', price: 5, material: true },
  nails:       { name: 'Gwoździe', icon: '🔩', price: 12, material: true }
};

export const SEASON_DAYS = 4;
export const SEASONS = [
  { name: 'Wiosna', icon: '🌸' },
  { name: 'Lato', icon: '☀️' },
  { name: 'Jesień', icon: '🍂' },
  { name: 'Zima', icon: '❄️' }
];

// `seasons` = pory roku, w których roślina rośnie o 30% szybciej.
export const CROPS = {
  wheat:      { level: 1,  cost: 1,  time: 20,  xp: 1,  seasons: [1] },
  carrot:     { level: 1,  cost: 3,  time: 45,  xp: 2,  seasons: [0, 2] },
  potato:     { level: 2,  cost: 6,  time: 90,  xp: 3,  seasons: [2] },
  corn:       { level: 3,  cost: 10, time: 150, xp: 4,  seasons: [1] },
  tomato:     { level: 4,  cost: 15, time: 240, xp: 5,  seasons: [1] },
  sunflower:  { level: 5,  cost: 20, time: 300, xp: 6,  seasons: [1] },
  strawberry: { level: 6,  cost: 28, time: 420, xp: 8,  seasons: [0] },
  pumpkin:    { level: 8,  cost: 45, time: 600, xp: 12, seasons: [2] },
  cabbage:    { level: 9,  cost: 55, time: 720, xp: 14, seasons: [2, 3] },
  cucumber:   { level: 10, cost: 65, time: 840, xp: 16, seasons: [0, 1] }
};

export const ANIMALS = {
  chicken: { name: 'Kura', icon: '🐔', level: 2, cost: 40,  feed: { wheat: 1 },     time: 60,  product: 'egg',   xp: 2, max: 6 },
  cow:     { name: 'Krowa', icon: '🐄', level: 4, cost: 150, feed: { corn: 1 },      time: 150, product: 'milk',  xp: 4, max: 4 },
  bee:     { name: 'Ul z pszczołami', icon: '🐝', level: 5, cost: 200, feed: { sunflower: 1 }, time: 200, product: 'honey', xp: 5, max: 4 },
  sheep:   { name: 'Owca', icon: '🐑', level: 7, cost: 320, feed: { carrot: 2 },    time: 240, product: 'wool',  xp: 6, max: 4 }
};

export const RECIPES = {
  bread:     { level: 3,  time: 45,  input: { wheat: 3 }, xp: 3 },
  popcorn:   { level: 3,  time: 60,  input: { corn: 2 }, xp: 4 },
  pancakes:  { level: 4,  time: 90,  input: { potato: 3, egg: 1 }, xp: 6 },
  fishdish:  { level: 4,  time: 90,  input: { fish: 2, potato: 2 }, xp: 6 },
  soup:      { level: 5,  time: 120, input: { tomato: 3, carrot: 1 }, xp: 7 },
  cheese:    { level: 5,  time: 150, input: { milk: 2 }, xp: 8 },
  honeycake: { level: 6,  time: 150, input: { honey: 1, wheat: 2, egg: 1 }, xp: 8 },
  jam:       { level: 7,  time: 180, input: { strawberry: 3 }, xp: 10 },
  sweater:   { level: 7,  time: 210, input: { wool: 2 }, xp: 10 },
  pie:       { level: 8,  time: 240, input: { pumpkin: 1, egg: 2, wheat: 2 }, xp: 12 },
  pierogi:   { level: 8,  time: 240, input: { potato: 3, cheese: 1, wheat: 2 }, xp: 14 },
  bigos:     { level: 9,  time: 300, input: { cabbage: 3, mushroom: 2, tomato: 1 }, xp: 16 },
  mizeria:   { level: 10, time: 240, input: { cucumber: 2, milk: 1 }, xp: 16 },
  cupcake:   { level: 5,  time: 90,  input: { flour: 1, cherry: 3, egg: 1 }, xp: 6 },
  fries:     { level: 6,  time: 60,  input: { potato: 3, oil: 1 }, xp: 8 },
  croissant: { level: 6,  time: 120, input: { flour: 2, butter: 1, egg: 1 }, xp: 9 },
  donut:     { level: 7,  time: 150, input: { flour: 2, egg: 1, jam: 1 }, xp: 12 }
};

// Sad: drzewa sadzi się raz, a owocują wielokrotnie.
export const TREES = {
  apple:  { name: 'Jabłoń', icon: '🍎', level: 3, cost: { coins: 120 }, grow: 240, regrow: 180, yield: 3, xp: 4 },
  cherry: { name: 'Wiśnia', icon: '🍒', level: 5, cost: { coins: 250 }, grow: 300, regrow: 240, yield: 4, xp: 5 },
  pear:   { name: 'Grusza', icon: '🍐', level: 7, cost: { coins: 400, wood: 4 }, grow: 420, regrow: 300, yield: 3, xp: 7 },
  peach:  { name: 'Brzoskwinia', icon: '🍑', level: 9, cost: { coins: 650, wood: 6 }, grow: 540, regrow: 360, yield: 3, xp: 9 }
};

export const HEATER = {
  name: 'Grzejnik ogrodowy', icon: '🔥', level: 4,
  cost: { coins: 300, stone: 6, nails: 2 },
  burn: 90
};

// Przetwórnia: budynki przerabiające plony na półprodukty.
export const PROCESSORS = {
  grainmill: {
    name: 'Młyn zbożowy', icon: '🌾', level: 3, slots: 2,
    cost: { coins: 300, wood: 10, stone: 6 },
    text: 'Mieli zboże na mąkę do wypieków.',
    recipes: { flour: { input: { wheat: 3 }, out: 2, time: 40, xp: 2 } }
  },
  fertworks: {
    name: 'Wytwórnia nawozu', icon: '🪱', level: 3, slots: 1,
    cost: { coins: 250, wood: 8 },
    text: 'Dżdżownice zamieniają resztki plonów w nawóz turbo.',
    recipes: { fert: { input: { wheat: 6, carrot: 3 }, booster: 'fert', out: 1, time: 300, xp: 3 } }
  },
  press: {
    name: 'Tłocznia soków', icon: '🧃', level: 4, slots: 2,
    cost: { coins: 500, wood: 14, nails: 4 },
    text: 'Wyciska soki i kompoty z owoców z sadu.',
    recipes: {
      juice: { input: { apple: 3 }, out: 1, time: 60, xp: 4 },
      kompot: { input: { cherry: 4, honey: 1 }, out: 2, time: 90, xp: 6 },
      smoothie: { input: { peach: 2, milk: 1 }, out: 1, time: 90, xp: 8 }
    }
  },
  dairy: {
    name: 'Mleczarnia', icon: '🧈', level: 5, slots: 2,
    cost: { coins: 700, wood: 12, stone: 10 },
    text: 'Ubija masło ze świeżego mleka.',
    recipes: { butter: { input: { milk: 2 }, out: 1, time: 80, xp: 5 } }
  },
  oilmill: {
    name: 'Olejarnia', icon: '🛢️', level: 6, slots: 1,
    cost: { coins: 900, wood: 15, stone: 12, nails: 6 },
    text: 'Tłoczy olej z nasion słonecznika.',
    recipes: { oil: { input: { sunflower: 3 }, out: 1, time: 100, xp: 6 } }
  }
};

export const HALLOWEEN = {
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
    { points: 100, decor: 'scarecrow', label: '🧙 Strach na wróble czarownicy', perk: '15% szans na podwójny plon i o połowę mniej wron.' },
    { points: 170, coins: 600, label: '🪙 600 monet' },
    { points: 260, decor: 'ghost', label: '👻 Przyjazny duszek', perk: 'Zwierzęta produkują o 20% szybciej.' },
    { points: 380, decor: 'goldpumpkin', coins: 1000, label: '🌟 Złota dynia + 🪙 1000', perk: 'Stodoła płaci o 10% więcej.' }
  ]
};

// Warsztat: ulepszenia kupowane poziomami.
export const UPGRADES = {
  can: {
    name: 'Konewka', icon: '🚿', level: 2,
    levels: [
      { cost: { coins: 150, wood: 4 }, text: 'Podlewa krzyżyk 5 grządek naraz.' },
      { cost: { coins: 600, wood: 10, stone: 6 }, text: 'Podlewa kwadrat 3×3.' },
      { cost: { coins: 2000, wood: 20, stone: 15, nails: 8 }, text: 'Zraszacze: każda nowa sadzonka jest od razu podlana.' }
    ]
  },
  compost: {
    name: 'Kompostownik', icon: '♻️', level: 3,
    levels: [1, 2, 3, 4, 5].map(l => ({
      cost: { coins: 150 * 2 ** l, wood: 4 * l, stone: 2 * l, ...(l > 2 ? { nails: 2 * l } : {}) },
      text: `Rośliny rosną o ${l * 8}% szybciej.`
    }))
  },
  scythe: {
    name: 'Ostra kosa', icon: '🗡️', level: 3,
    levels: [1, 2, 3].map(l => ({ cost: { coins: 300 * 2 ** l, wood: 5 * l, nails: 2 * l }, text: `${l * 6}% szans na podwójny plon.` }))
  },
  stall: {
    name: 'Stragan na targu', icon: '⛺', level: 4,
    levels: [1, 2, 3, 4].map(l => ({ cost: { coins: 400 * 2 ** l, wood: 8 * l, nails: 2 * l }, text: `Sprzedaż w Stodole o ${l * 5}% droższa.` }))
  },
  pens: {
    name: 'Rozbudowa zagród', icon: '🏗️', level: 4,
    levels: [1, 2, 3].map(l => ({ cost: { coins: 500 * 2 ** l, wood: 12 * l, stone: 8 * l, nails: 3 * l }, text: `+${l} miejsce na każdy gatunek, zwierzęta o ${l * 10}% szybsze.` }))
  },
  oven: {
    name: 'Piec kaflowy', icon: '🔥', level: 4,
    levels: [1, 2, 3].map(l => ({ cost: { coins: 450 * 2 ** l, stone: 10 * l, nails: 2 * l }, text: `Kuchnia gotuje o ${l * 15}% szybciej.` }))
  },
  rod: {
    name: 'Wędka z kołowrotkiem', icon: '🎣', level: 3,
    levels: [1, 2, 3].map(l => ({ cost: { coins: 250 * 2 ** l, wood: 4 * l, nails: l }, text: `Większa strefa zacięcia, ryby biorą co ${30 - l * 7}s.` }))
  },
  cart: {
    name: 'Wóz drabiniasty', icon: '🛒', level: 5,
    levels: [1, 2, 3].map(l => ({ cost: { coins: 600 * 2 ** l, wood: 15 * l, nails: 3 * l }, text: `Zamówienia płacą o ${l * 10}% więcej.` }))
  },
  greenhouse: {
    name: 'Szklarnia', icon: '🏡', level: 7,
    levels: [{ cost: { coins: 5000, wood: 30, stone: 30, nails: 15, gold: 5 }, text: 'Zimą rośliny rosną normalnie.' }]
  },
  heaters: {
    name: 'Lepsze grzejniki', icon: '♨️', level: 6,
    levels: [
      { cost: { coins: 1500, stone: 15, nails: 6 }, text: 'Grzejniki ogrzewają kwadrat 5×5 zamiast 3×3.' },
      { cost: { coins: 4000, stone: 25, nails: 12, gold: 3 }, text: 'Grzejniki zużywają połowę drewna.' }
    ]
  },
  dog: {
    name: 'Pies Burek', icon: '🐕', level: 5,
    levels: [{ cost: { coins: 800, gold: 4 }, text: 'Sam przegania wrony z pola i biega po gospodarstwie.' }]
  }
};

// Pomocnicy — automatyzacja gospodarstwa.
export const HELPERS = {
  jozek: {
    name: 'Parobek Józek', icon: '👨‍🌾', level: 4,
    levels: [
      { cost: { coins: 1200, gold: 2 }, every: 5, text: 'Zbiera dojrzałe plony co 5 s.' },
      { cost: { coins: 3000, gold: 4 }, every: 4, text: 'Zbiera i od razu sieje to samo ponownie.' },
      { cost: { coins: 6000, gold: 6 }, every: 2, text: 'Pracuje co 2 s i podlewa sadzonki.' }
    ]
  },
  basia: {
    name: 'Gospodyni Basia', icon: '👩‍🌾', level: 5,
    levels: [
      { cost: { coins: 1500, gold: 3 }, every: 6, text: 'Zbiera produkty i karmi zwierzęta co 6 s.' },
      { cost: { coins: 4000, gold: 5 }, every: 3, text: 'Pracuje dwa razy szybciej.' }
    ]
  },
  mietek: {
    name: 'Kucharz Mietek', icon: '👨‍🍳', level: 6,
    levels: [
      { cost: { coins: 2500, gold: 4 }, every: 5, text: 'Odbiera potrawy i gotuje je ponownie, jeśli są składniki.' }
    ]
  }
};

// Odbudowa wsi — wspólne projekty z trwałymi bonusami.
export const PROJECTS = {
  well: {
    name: 'Studnia', icon: '🪣', level: 3, gold: 2,
    needs: { coins: 150, stone: 8, wood: 4 },
    perk: 'Każdego ranka studnia podlewa całe pole.'
  },
  mill: {
    name: 'Młyn wodny', icon: '⚙️', level: 4, gold: 3,
    needs: { coins: 400, wood: 15, stone: 10, wheat: 20 },
    perk: 'Chleb i popcorn wychodzą z kuchni podwójnie, a Przetwórnia pracuje o 25% szybciej.'
  },
  hall: {
    name: 'Świetlica', icon: '🏛️', level: 5, gold: 4,
    needs: { coins: 800, wood: 25, nails: 8, bread: 5 },
    perk: 'Czwarte miejsce na zamówienia sąsiadów.'
  },
  bridge: {
    name: 'Most na rzece', icon: '🌉', level: 6, gold: 4,
    needs: { stone: 25, wood: 20, nails: 10 },
    perk: 'Wędrowny kupiec daje 20% rabatu i dodatkową ofertę.'
  },
  shrine: {
    name: 'Kapliczka', icon: '⛪', level: 7, gold: 5,
    needs: { stone: 30, sunflower: 10, honey: 4 },
    perk: 'Codzienna nagroda jest podwójna.'
  },
  firehall: {
    name: 'Remiza OSP', icon: '🚒', level: 9, gold: 8,
    needs: { coins: 3000, wood: 40, stone: 35, nails: 25, cheese: 4 },
    perk: '+20% doświadczenia za wszystko.'
  }
};

// Wyprawy do lasu po materiały.
export const TRIPS = {
  walk: {
    name: 'Spacer po lesie', icon: '🚶', level: 2, time: 5 * 60, cost: {},
    loot: { wood: [3, 6], stone: [1, 3], mushroom: [0, 2] }, goldChance: 0
  },
  hike: {
    name: 'Wyprawa z prowiantem', icon: '🎒', level: 3, time: 30 * 60, cost: { bread: 2 },
    loot: { wood: [8, 14], stone: [6, 10], nails: [1, 3], mushroom: [2, 4] }, goldChance: 0.15
  },
  camp: {
    name: 'Ekspedycja z biwakiem', icon: '⛺', level: 6, time: 2 * 60 * 60, cost: { pancakes: 2, cheese: 1 },
    loot: { wood: [25, 35], stone: [20, 30], nails: [5, 9], mushroom: [5, 8] }, goldChance: 0.5
  }
};

export const FISH_TABLE = [
  { id: 'fish', weight: 52, speed: 1 },
  { id: 'crayfish', weight: 15, speed: 1.25 },
  { id: 'carp', weight: 8, speed: 1.5 },
  { id: 'boot', weight: 12, speed: 0.8 },
  { id: 'chest', weight: 10, speed: 1.1 },
  { id: 'ring', weight: 3, speed: 1.8 }
];

export const BOOSTERS = {
  fert:     { name: 'Nawóz turbo', icon: '🧴', text: 'Wszystkie rosnące rośliny +50% wzrostu.' },
  rain:     { name: 'Deszczownica', icon: '🌧️', text: 'Podlewa całe pole.' },
  treat:    { name: 'Przysmak dla zwierząt', icon: '🦴', text: 'Wszystkie najedzone zwierzęta od razu dają produkty.' },
  coffee:   { name: 'Kawa zbożowa', icon: '☕', text: 'Pomocnicy pracują 2× szybciej przez 10 minut.' },
  goldseed: { name: 'Złote nasiono', icon: '🌟', text: 'Następna zasiana roślina będzie złota.' },
  fleece:   { name: 'Agrowłóknina', icon: '🧣', text: 'Przykrywa pole — następny przymrozek nic nie zniszczy.' }
};

export const MERCHANT_POOL = [
  { kind: 'item', id: 'wood', qty: 10, price: { coins: 90 } },
  { kind: 'item', id: 'stone', qty: 10, price: { coins: 110 } },
  { kind: 'item', id: 'nails', qty: 5, price: { coins: 160 } },
  { kind: 'item', id: 'mushroom', qty: 4, price: { coins: 80 } },
  { kind: 'item', id: 'nails', qty: 12, price: { gold: 1 } },
  { kind: 'booster', id: 'fert', qty: 1, price: { coins: 450 } },
  { kind: 'booster', id: 'fert', qty: 2, price: { gold: 2 } },
  { kind: 'booster', id: 'rain', qty: 1, price: { coins: 200 } },
  { kind: 'booster', id: 'treat', qty: 1, price: { coins: 350 } },
  { kind: 'booster', id: 'coffee', qty: 1, price: { gold: 1 } },
  { kind: 'booster', id: 'goldseed', qty: 1, price: { gold: 2 } },
  { kind: 'gold', id: 'gold', qty: 1, price: { coins: 1500 } },
  { kind: 'booster', id: 'fleece', qty: 1, price: { coins: 250 } },
  { kind: 'booster', id: 'fleece', qty: 3, price: { gold: 1 } }
];

// Kronika wsi — fabularne zadania prowadzące przez całą grę.
export const QUESTS = [
  { title: 'Pierwsze żniwa', text: 'Dzień dobry, gospodarzu! Zbierz pierwsze plony, a wieś od razu zrobi się weselsza.', goal: { stat: 'harvested', n: 6 }, reward: { coins: 20 } },
  { title: 'Siewca', text: 'Pusta ziemia to smutna ziemia. Posiej coś na grządkach!', goal: { stat: 'planted', n: 6 }, reward: { coins: 30 } },
  { title: 'Woda to życie', text: 'Podlane rośliny rosną dwa razy szybciej. Spróbuj!', goal: { stat: 'watered', n: 5 }, reward: { coins: 20, wood: 2 } },
  { title: 'Pierwszy klient', text: 'Babcia Jadzia czeka na zamówienie. Nie każ jej długo czekać.', goal: { stat: 'orders', n: 1 }, reward: { coins: 40 } },
  { title: 'Więcej ziemi', text: 'Wykarczuj kawałek lasu. Z drzew będzie drewno, z kamieni — kamień do budowy!', goal: { stat: 'cleared', n: 1 }, reward: { coins: 30, stone: 2 } },
  { title: 'Marchewkowe pole', text: 'Zbierz marchew. Konie z sąsiedniej wsi już się oblizują.', goal: { stat: 'h_carrot', n: 10 }, reward: { coins: 50 } },
  { title: 'Pnij się w górę', text: 'Zdobądź 2. poziom gospodarza.', goal: { level: 2 }, reward: { coins: 60 } },
  { title: 'Kurze sprawy', text: 'Każde gospodarstwo potrzebuje kur. Kup pierwszą w Zagrodzie.', goal: { stat: 'bought', n: 1 }, reward: { coins: 50 } },
  { title: 'Spacer do lasu', text: 'W lesie leży drewno i kamienie. Wyślij kogoś na spacer (Więcej → Las).', goal: { stat: 'trips', n: 1 }, reward: { gold: 1 } },
  { title: 'Jajecznica', text: 'Zbierz produkty od zwierząt.', goal: { stat: 'collected', n: 5 }, reward: { gold: 1 } },
  { title: 'Na targu', text: 'Sprzedaj trochę towaru w Stodole. Sprawdź okazje dnia!', goal: { stat: 'sold', n: 20 }, reward: { coins: 80 } },
  { title: 'Kuchnia gotowa', text: 'Zdobądź 3. poziom — dostaniesz klucze do wiejskiej kuchni.', goal: { level: 3 }, reward: { coins: 100 } },
  { title: 'Chleb powszedni', text: 'Upiecz chleb. Pachnie w całej wsi!', goal: { stat: 'c_bread', n: 3 }, reward: { coins: 120 } },
  { title: 'Majsterkowicz', text: 'W Warsztacie ulepszysz narzędzia. Kup pierwsze ulepszenie.', goal: { stat: 'upgrades', n: 1 }, reward: { gold: 1 } },
  { title: 'Ryby biorą', text: 'Weź wędkę i idź nad staw. Dotknij wody albo przycisku 🎣.', goal: { stat: 'fish', n: 3 }, reward: { coins: 100 } },
  { title: 'Wrony precz!', text: 'Wrony wyjadają nam plony! Dotknij wrony na polu, żeby ją przegonić.', goal: { stat: 'crows', n: 3 }, reward: { coins: 80 } },
  { title: 'Studnia', text: 'Wieś potrzebuje studni. Zbierz kamień i drewno (Więcej → Wieś).', goal: { stat: 'projects', n: 1 }, reward: { gold: 2 } },
  { title: 'Krowa żywicielka', text: 'Mleko to podstawa sera. Zdobądź 4. poziom i kup krowę.', goal: { stat: 'bought_cow', n: 1 }, reward: { coins: 150 } },
  { title: 'Dobry sąsiad', text: 'Pomóż sąsiadom — spełnij 10 zamówień.', goal: { stat: 'orders', n: 10 }, reward: { coins: 300 } },
  { title: 'Pomocna dłoń', text: 'Sam nie dasz rady wszystkiemu. Zatrudnij pomocnika w Warsztacie.', goal: { stat: 'helpers', n: 1 }, reward: { gold: 2 } },
  { title: 'Ser jak z bajki', text: 'Zrób ser z mleka od swoich krów.', goal: { stat: 'c_cheese', n: 2 }, reward: { coins: 300 } },
  { title: 'Wieś odżywa', text: 'Ukończ jeszcze dwa projekty odbudowy wsi.', goal: { stat: 'projects', n: 2 }, reward: { gold: 3 } },
  { title: 'Złoty plon', text: 'Mówią, że czasem na polu wyrasta złota roślina. Znajdź ją!', goal: { stat: 'golden', n: 1 }, reward: { gold: 3 } },
  { title: 'Mistrz pierogów', text: 'Ulep pierogi ruskie jak u babci.', goal: { stat: 'c_pierogi', n: 3 }, reward: { coins: 1000, gold: 5 } },
  { title: 'Pierwsza jabłoń', text: 'Sad to duma każdej wsi. Wybierz drzewko na dole ekranu i posadź je na grządce.', goal: { stat: 'trees', n: 1 }, reward: { coins: 150 } },
  { title: 'Mąka z młyna', text: 'Zbuduj młyn zbożowy w Przetwórni (zakładka Kuchnia) i zmiel mąkę.', goal: { stat: 'p_flour', n: 4 }, reward: { gold: 2 } },
  { title: 'Soczysty sad', text: 'Zbierz owoce z drzew. Pszczoły w ulach pomagają w zapylaniu!', goal: { stat: 'fruit', n: 15 }, reward: { coins: 300 } },
  { title: 'Ciepło w zimie', text: 'Zimą przychodzą przymrozki. Postaw grzejnik na polu — ogrzeje rośliny dookoła.', goal: { stat: 'heaters', n: 1 }, reward: { gold: 2 } },
  { title: 'Mistrz przetwórstwa', text: 'Przerób w Przetwórni 20 produktów.', goal: { stat: 'processed', n: 20 }, reward: { gold: 4 } },
  { title: 'Gospodarz roku', text: 'Zdobądź 12. poziom. Cała wieś będzie o Tobie mówić!', goal: { level: 12 }, reward: { gold: 10 } }
];

export const ACHIEVEMENTS = [
  { id: 'harvest', name: 'Zbieracz', icon: '🧺', stat: 'harvested', tiers: [50, 250, 1000], unit: 'plonów' },
  { id: 'earn', name: 'Bogacz', icon: '💰', stat: 'earned', tiers: [1000, 10000, 50000], unit: 'monet' },
  { id: 'orders', name: 'Dobry sąsiad', icon: '🤝', stat: 'orders', tiers: [10, 50, 200], unit: 'zamówień' },
  { id: 'fish', name: 'Wędkarz', icon: '🎣', stat: 'fish', tiers: [5, 25, 100], unit: 'połowów' },
  { id: 'cook', name: 'Kucharz', icon: '👨‍🍳', stat: 'cooked', tiers: [10, 50, 200], unit: 'potraw' },
  { id: 'farm', name: 'Hodowca', icon: '🐄', stat: 'collected', tiers: [20, 100, 500], unit: 'produktów' },
  { id: 'land', name: 'Karczownik', icon: '🪓', stat: 'cleared', tiers: [3, 10, 20], unit: 'pól' },
  { id: 'golden', name: 'Złota rączka', icon: '✨', stat: 'golden', tiers: [1, 5, 20], unit: 'złotych plonów' },
  { id: 'crows', name: 'Postrach wron', icon: '🐦', stat: 'crows', tiers: [5, 25, 100], unit: 'wron' },
  { id: 'village', name: 'Sołtys', icon: '🏘️', stat: 'projects', tiers: [1, 3, 6], unit: 'projektów' },
  { id: 'level', name: 'Doświadczony', icon: '⭐', stat: 'level', tiers: [5, 10, 15], unit: 'poziom' },
  { id: 'days', name: 'Weteran wsi', icon: '📅', stat: 'days', tiers: [10, 30, 100], unit: 'dni' },
  { id: 'quests', name: 'Kronikarz', icon: '📜', stat: 'quests', tiers: [5, 15, 25], unit: 'zadań' },
  { id: 'tinker', name: 'Majsterkowicz', icon: '🔨', stat: 'upgrades', tiers: [3, 10, 20], unit: 'ulepszeń' },
  { id: 'forest', name: 'Leśnik', icon: '🌲', stat: 'trips', tiers: [3, 15, 50], unit: 'wypraw' },
  { id: 'orchard', name: 'Sadownik', icon: '🍎', stat: 'fruit', tiers: [20, 100, 400], unit: 'owoców' },
  { id: 'process', name: 'Przetwórca', icon: '🏭', stat: 'processed', tiers: [10, 50, 200], unit: 'przetworów' },
  { id: 'frost', name: 'Pogromca mrozu', icon: '❄️', stat: 'frostSaved', tiers: [5, 25, 100], unit: 'uratowanych roślin' }
];

export const ACHIEVEMENT_REWARDS = [
  { gold: 1, coins: 100 },
  { gold: 3, coins: 500 },
  { gold: 8, coins: 2000 }
];

export const NPCS = [
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

export const REQUESTS = [
  'Poproszę o:',
  'Potrzebuję na obiad:',
  'Na festyn we wsi:',
  'Do sklepiku pod lipą:',
  'Na imieniny szwagra:',
  'Na niedzielne śniadanie:'
];

export const TIPS = [
  'Przeciągnij palcem po polu, aby siać lub zbierać kilka grządek naraz.',
  '💧 Podlane rośliny rosną dwa razy szybciej. Deszcz podlewa za darmo!',
  'Zamówienia sąsiadów płacą więcej niż sprzedaż na targu.',
  'Karczowanie lasu daje drewno i kamień na ulepszenia.',
  'Gospodarstwo rośnie także, gdy gra jest zamknięta.',
  '🐦 Dotknij wrony, zanim wydziobie plony!',
  '🎣 Dotknij stawu albo przycisku z wędką, żeby łowić ryby.',
  '🍂 Każda roślina ma swoją ulubioną porę roku — wtedy rośnie szybciej.',
  '✨ Złote rośliny dają podwójny plon i złote kłosy 🌟.',
  '⟳ Obróć kamerę, aby zobaczyć gospodarstwo z innej strony.',
  '🍎 Drzewka owocowe sadzisz raz — owocują wiele razy. Zimą śpią, chyba że je ogrzejesz.',
  '🐝 Dwa ule lub więcej zapylają sad: każdy zbiór owoców daje dodatkowy owoc.',
  '🔥 Grzejniki palą drewno 🪵 i chronią rośliny przed przymrozkiem.',
  '🏭 Przetwórnia jest w zakładce Kuchnia — mąka, soki, masło i olej.'
];

export const HALLOWEEN_TIPS = [
  '🎃 Halloween! Dynie rosną już od 1. poziomu — zbieraj je dla punktów 👻.',
  '🧪 W kociołku czarownicy zrobisz cukierki i eliksiry.',
  '🧛 Potwory z wioski płacą punktami 👻 za słodycze.'
];

export const DAILY_REWARDS = [20, 30, 45, 60, 80, 100, 150];
export const DECO = ['🌳', '🌲', '🪨', '🌳', '🌲', '🍄', '🌳', '🌿'];
export const DECO_LOOT = {
  '🌳': { wood: 4 },
  '🌲': { wood: 5 },
  '🪨': { stone: 5 },
  '🍄': { mushroom: 3, wood: 1 },
  '🌿': { wood: 2, stone: 1 }
};
