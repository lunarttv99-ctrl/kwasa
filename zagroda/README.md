# Wiejska Zagroda 🌻

Farmerska gra przeglądarkowa (PWA) wzorowana na klasycznym „Wiejskim Życiu”: kreskówkowa grafika
w rzucie izometrycznym, pola, zwierzęta, sad, budynki produkcyjne, zamówienia i sąsiedzi.
Działa na telefonie i komputerze, offline, a postęp zapisuje się w pamięci przeglądarki.

## Jak uruchomić

Gra używa modułów ES, więc potrzebuje serwera WWW (nie działa z `file://`):

```bash
cd kwasa
python3 -m http.server 8000
# otwórz http://localhost:8000/zagroda/
```

Na telefonie: wgraj repozytorium na hosting z HTTPS (np. GitHub Pages), otwórz `…/zagroda/`
i w Safari wybierz „Udostępnij → Do ekranu początkowego”.

## Co jest w grze

- **Pola:** pług 🚜 (dotknięcie albo przeciągnięcie palcem), 10 upraw od pszenicy po arbuzy,
  zbieranie przeciągnięciem, rośliny kołyszą się na wietrze.
- **Zwierzęta:** kury, krowy, świnki i owce chodzą po zagrodzie; dymek z jedzeniem = głodne,
  dymek z produktem = do odebrania.
- **Sad:** jabłonie, wiśnie, grusze i brzoskwinie owocują wiele razy.
- **Budynki:** młyn (kręcący się wiatrak), piekarnia, mleczarnia, przetwórnia owoców, olejarnia,
  tkalnia, wiejska kuchnia i ul. Każdy ma kolejkę produkcji (dodatkowe miejsca za dukaty).
- **Studnia i spryskiwacze:** studnia ustala limit spryskiwaczy, a spryskiwacz przyspiesza
  wzrost roślin na polach dookoła o 15%.
- **Stodoła:** magazyn z limitem miejsca, sprzedaż towarów, rozbudowa.
- **Tablica zamówień:** klienci płacą więcej niż skup, czasem dorzucają dukata.
- **Zadania, poziomy i odblokowania**, nagroda za codzienne logowanie, sąsiedzi
  (pomoc i prezenty raz dziennie), rozszerzanie ziemi, przeszkody do usunięcia.
- **Ozdoby:** płotki, ścieżki, rabatki, ławki, latarnie, oczko wodne, fontanna, krasnal…
- **Waluty:** talary 🪙 i dukaty 💎.

## Mechaniki z oryginału (wersja 2)

- **Wędkowanie** na pomoście (minigra: zatnij, gdy spławik zanurkuje), 7 rodzajów połowu.
- **Kopalnia** z trzema szybami (węgiel, ruda żelaza, złoto, kryształy), **tartak** i **kuźnia**
  (deski, gwoździe, cegły) — materiały do ulepszeń.
- **Ulepszenia budynków** (poziom 2 i 3: szybciej i dodatkowe miejsce) oraz **produkcja seryjna**
  za punkty automatyzacji — działa też, gdy gra jest zamknięta.
- **Dom do urządzenia** (8 kategorii mebli, punkty domu, codzienna nagroda).
- **Kawiarnia** z pomocą społeczności i sklepem za medale reputacji.
- **Egzotyczny sklep** z półkami odświeżanymi co 4 h albo za dukaty.
- **Kurort nad morzem**: goście płacą muszelkami, rozbudowa pensjonatu, plaży, mola i kiosku.
- **Plan podróży** (wyprawy wozem), **wycieczki grupowe** za bilety, **zadania dnia**,
  **wydarzenia sezonowe** z żetonami i wyjątkowymi ozdobami.
- **Dom Zbiorów** (sam zbiera i sieje), **Pokój malucha** (rozmnażanie zwierząt),
  **Ranczo ogrodowe** (+20% szybciej dla zwierząt obok), **czerwone kury**, **wybieg kangurów**
  (orzechy makadamia), **dom motyli** (nektar), **szkółka drzew** (sadzonki śliw, cytryn, pomarańczy),
  **pracownia rękodzieła** (bukiety, wianki, pisanki), **smażalnia ryb**.
- **Maszyny**: nawóz, kombajn i siewnik 3×3 na paliwo; **schowek** na obiekty.
- Nowe uprawy: tulipany, róże, borówki, cebula, papryka, bakłażan i ananasy z egzotycznych nasion.

## Pliki

- `index.html`, `styles.css` — interfejs (HUD, narzędzia, okna),
- `data.js` — cała zawartość gry (uprawy, zwierzęta, budynki, przepisy, zadania),
- `sprites.js` — grafika rysowana proceduralnie (bez plików z obrazkami),
- `world.js` — mapa izometryczna: kamera, rysowanie, dotyk, trafianie w obiekty,
- `game.js` — logika gry, zapis stanu i okna,
- `more.js` — mechaniki z wersji 2 (wędkowanie, kopalnia, kurort, dom, kawiarnia…),
- `sound.js` — efekty dźwiękowe syntezowane w WebAudio,
- `sw.js`, `manifest.webmanifest`, `icons/` — instalacja jako aplikacja i tryb offline.
