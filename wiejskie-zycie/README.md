# Wiejskie życie 🌾

Mobilna gra przeglądarkowa (PWA) o prowadzeniu gospodarstwa na wsi. Działa na iPhonie i Androidzie, można ją dodać do ekranu początkowego, działa offline, a postęp zapisuje się w pamięci telefonu.

## Rozgrywka

- **🌱 Pole** – oraj trawę, siej nasiona, podlewaj (2× szybszy wzrost) i zbieraj plony. Przeciągnij palcem, by obsłużyć kilka grządek naraz. Karczuj drzewa i kamienie, by powiększyć pole.
- **🐔 Zagroda** – kury, krowy, pszczoły i owce. Karm je plonami, zbieraj jajka, mleko, miód i wełnę.
- **🍳 Kuchnia** (od poziomu 3) – chleb, popcorn, placki ziemniaczane, pomidorówka, ser, miodownik, dżem, sweter, placek dyniowy. Trzeci palnik można dokupić.
- **📋 Zamówienia** – sąsiedzi (Babcia Jadzia, Sołtys Zbyszek…) płacą więcej niż targ i dają dużo doświadczenia.
- **🏚️ Stodoła** – magazyn i sprzedaż za monety.
- **Dzień i noc, pogoda** – deszcz podlewa pole za darmo, rano na pustych grządkach rosną chwasty.
- **Poziomy** – doświadczenie (⭐) odblokowuje nowe nasiona, zwierzęta i przepisy.
- **Gra toczy się dalej po zamknięciu** – po powrocie zobaczysz, co dojrzało (do 12 godzin).

## Uruchomienie

To zwykłe pliki statyczne – nie trzeba niczego budować.

- Lokalnie: `python3 -m http.server` w tym folderze i otwórz `http://localhost:8000`.
- W internecie: wgraj zawartość folderu na hosting z HTTPS (GitHub Pages, Netlify, Vercel). Na GitHub Pages gra będzie pod adresem `…/wiejskie-zycie/`.
- Na iPhonie: otwórz link w Safari → Udostępnij → **Do ekranu początkowego**.

## Pliki

- `index.html` – układ ekranu,
- `styles.css` – wygląd,
- `game.js` – logika gry i zapis (localStorage, klucz `wiejskie_zycie_save_v1`),
- `manifest.webmanifest`, `sw.js` – instalacja jako aplikacja i tryb offline,
- `icons/` – ikony aplikacji.
