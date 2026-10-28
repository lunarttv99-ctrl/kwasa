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

## Pliki

- `index.html`, `styles.css` — interfejs (HUD, narzędzia, okna),
- `data.js` — cała zawartość gry (uprawy, zwierzęta, budynki, przepisy, zadania),
- `sprites.js` — grafika rysowana proceduralnie (bez plików z obrazkami),
- `world.js` — mapa izometryczna: kamera, rysowanie, dotyk, trafianie w obiekty,
- `game.js` — logika gry, zapis stanu i okna,
- `sound.js` — efekty dźwiękowe syntezowane w WebAudio,
- `sw.js`, `manifest.webmanifest`, `icons/` — instalacja jako aplikacja i tryb offline.
