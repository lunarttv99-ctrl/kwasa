# Wiejskie życie 🌾

Mobilna gra przeglądarkowa (PWA) o prowadzeniu gospodarstwa na wsi. Działa na iPhonie i Androidzie, można ją dodać do ekranu początkowego, działa offline, a postęp zapisuje się w pamięci telefonu.

## Nowości w wersji 2

- **Grafika 3D** – pole, uprawy, płot, stodoła, dom, wiatrak i zwierzęta jako trójwymiarowa scena (Three.js) z cieniami, cyklem dnia i nocy, deszczem i przesuwającymi się cieniami chmur. Przycisk ⟳ obraca kamerę. Na słabszych telefonach można przełączyć grafikę na klasyczną 2D (⚙️ → Grafika).
- **Wydarzenie Halloween** (15 października – 7 listopada) – dynie od 1. poziomu, kociołek czarownicy (cukierki, zupa dyniowa, ciastka-duszki, eliksir), zamówienia od potworów, nietoperze i lampiony nocą, punkty 👻 i nagrody: lampiony, strach na wróble, przyjazny duszek i złota dynia. Każda ozdoba daje stały bonus i zostaje na zawsze.
- **Codzienna nagroda** z 7-dniową serią.
- Nowa czcionka Fredoka, dotychczasowe zapisy gry są zachowane.

Wydarzenie można wymusić do testów parametrem `?halloween=1` (lub wyłączyć `?halloween=0`).

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
- `farm3d.js` – scena 3D gospodarstwa,
- `vendor/three.module.min.js` – biblioteka Three.js r169 (licencja MIT, `vendor/three-LICENSE.txt`),
- `fonts/` – czcionka Fredoka (licencja SIL Open Font License),
- `manifest.webmanifest`, `sw.js` – instalacja jako aplikacja i tryb offline,
- `icons/` – ikony aplikacji.
