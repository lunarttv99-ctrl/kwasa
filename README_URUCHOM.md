# Kasa dla osób

To jest prosta aplikacja WWW/PWA pod iPhone. Po wrzuceniu na hosting z HTTPS działa jako link WWW i można ją dodać do ekranu początkowego.

## Co potrafi

- dodawanie osoby, kwoty, opisu, daty i notatki,
- oznaczanie wpisu jako „do oddania” albo „rozliczone”,
- podsumowanie ile dana osoba ma jeszcze oddać,
- wyszukiwanie i filtrowanie,
- zapis danych lokalnie w pamięci telefonu przez localStorage,
- eksport JSON i CSV,
- import kopii JSON.

## Ważne o zapisie danych

Dane zapisują się lokalnie w przeglądarce telefonu dla konkretnego adresu strony. Nie trafiają na serwer.

Zrób czasem eksport JSON jako kopię. Dane mogą zniknąć, jeśli wyczyścisz dane Safari/przeglądarki albo zmienisz adres strony.

## Jak zrobić z tego link WWW

1. Wgraj całą zawartość folderu `kasa-pwa` na hosting obsługujący HTTPS.
2. Możesz użyć np. GitHub Pages, Netlify, Vercel albo zwykłego hostingu WWW.
3. Plikiem startowym jest `index.html`.
4. Po publikacji otwórz link na iPhonie.
5. W Safari wybierz: Udostępnij -> Do ekranu początkowego.

## Pliki

- `index.html` – widok aplikacji,
- `styles.css` – wygląd,
- `app.js` – logika i zapis danych,
- `manifest.webmanifest` – instalacja jako PWA,
- `sw.js` – działanie offline po pierwszym otwarciu,
- `icons/` – ikony aplikacji.
