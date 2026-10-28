# Wiejskie życie 🌾

Mobilna gra przeglądarkowa (PWA) o prowadzeniu gospodarstwa na wsi. Działa na iPhonie i Androidzie, można ją dodać do ekranu początkowego, działa offline, a postęp zapisuje się w pamięci telefonu.

## 🎨 Wersja 5 — wielka aktualizacja wizualna

- **Krajobraz:** pagórkowaty teren z cieniowaniem, pas lasu dookoła, łąki pełne trawy i kwiatów.
- **Staw z animowaną wodą** (zmarszczki, odblaski) i pływającymi kaczkami.
- **Życie na wsi:** motyle za dnia, świetliki nocą, jesienne liście, klucz ptaków, dym z komina, latarnie świecące po zmroku.
- **Rekwizyty:** bele siana, wóz z dyniami, stos drewna.
- **Rośliny falują na wietrze**, a zbiory, oranie, podlewanie i karczowanie sypią kolorowymi drobinkami.
- **Lepsze kolory i światło** (tone mapping), łagodniejsza noc.
- **Interfejs:** ekran powitalny, monety i plony lecące do liczników, animowany licznik monet, konfetti przy awansie, odświeżone paski, przyciski, karty, okna i pasek nasion.
- **Jakość grafiki** (⚙️ → Grafika): 3D pełne / 3D oszczędne / klasyczne 2D. Gdy telefon nie nadąża, gra sama zaproponuje tryb oszczędny.

## 🦉 Sowa Mądralińska — wbudowana pomocniczka

Sowa w prawym dolnym rogu pola (albo „Więcej → Sowa Mądralińska”):
- **💬 Zapytaj:** rozumie pytania po polsku („skąd wziąć gwoździe?”, „jak przetrwać zimę?”, „do czego jest mąka?”, „co mam teraz robić?”) i odpowiada z przyciskami prowadzącymi w odpowiednie miejsce gry.
- **Rady na żywo:** patrzy na Twoje gospodarstwo (wrony, przymrozki, dojrzałe plony, głodne zwierzęta, zamówienia, zadania) i sama odzywa się w dymku, gdy dzieje się coś ważnego.
- **📖 Encyklopedia:** każdy przedmiot z informacją skąd go wziąć i do czego służy oraz poradniki — z wyszukiwarką.

Działa bez internetu: odpowiedzi są budowane na bieżąco z danych gry (`agent.js`), więc zawsze pasują do aktualnej wersji.

## Sterowanie mapą

- **Jeden palec na polu** — sianie, podlewanie i zbiory (można przeciągać po wielu grządkach).
- **Jeden palec poza polem** (trawa, las, drzewa) — przesuwanie mapy, z płynnym wyhamowaniem.
- **Dwa palce** — przybliżanie i oddalanie (szczypanie), obracanie (skręt palcami) i przesuwanie.
- **Kółko myszy** — przybliżanie na komputerze. **⟳** obraca o 90°, **🎯** wraca do widoku pola.

## Nowości w wersji 4 — sad, przetwórnia i zima

- **🍎 Sad:** jabłonie, wiśnie, grusze i brzoskwinie sadzi się raz na grządce — owocują wiele razy. Wiosną kwitną, zimą śpią (chyba że stoją przy grzejniku). Dwa ule zapylają sad i dają dodatkowy owoc 🐝.
- **🏭 Przetwórnia** (zakładka Kuchnia → Przetwórnia): młyn zbożowy (mąka), tłocznia soków (sok jabłkowy, kompot wiśniowy, koktajl brzoskwiniowy), mleczarnia (masło), olejarnia (olej słonecznikowy) i wytwórnia nawozu (dżdżownice robią nawóz turbo do plecaka). Budynki pojawiają się w 3D, a wiatrak zaczyna się kręcić dopiero po naprawie młyna.
- **🥐 Nowe przepisy:** frytki, rogaliki maślane, pączki z dżemem, babeczki wiśniowe.
- **🥶 Przymrozki zimą:** rano prognoza, w nocy mróz ścina niezabezpieczone rośliny (kapusta jest odporna).
- **🔥 Grzejniki ogrodowe:** stawiane na grządce, zimą ogrzewają pole 3×3 (5×5 po ulepszeniu), przyspieszają wzrost i chronią przed mrozem. Palą drewno 🪵 — gdy go zabraknie, gasną. Do tego **🧣 agrowłóknina** u kupca.
- 5 nowych zadań w kronice i 3 nowe osiągnięcia (Sadownik, Przetwórca, Pogromca mrozu).

## Nowości w wersji 3 — „Wielka aktualizacja”

- **🔨 Warsztat:** 10 ulepszeń kupowanych poziomami (konewka podlewająca 5 lub 9 grządek i zraszacze, kompostownik, kosa, stragan, rozbudowa zagród, piec, wędka, wóz, szklarnia, pies Burek).
- **👥 Pomocnicy:** Parobek Józek zbiera i sieje, Gospodyni Basia karmi zwierzęta, Kucharz Mietek gotuje. Pracują także po zamknięciu gry i chodzą po scenie 3D.
- **🏘️ Odbudowa wsi:** 6 budynków (studnia, młyn wodny, świetlica, most, kapliczka, remiza OSP) budowanych z materiałów. Każdy daje stały bonus i pojawia się w 3D.
- **🌲 Wyprawy do lasu** po drewno 🪵, kamień 🪨, gwoździe 🔩 i grzyby. Materiały dają też karczowanie i zamówienia.
- **🍂 Pory roku** co 4 dni: ulubione pory upraw (+30%), wolniejsza zima, śnieg, jesienne i zimowe kolory drzew. Nowe uprawy: kapusta i ogórki.
- **🎣 Łowienie ryb** w stawie (minigra z zacięciem), **🐦 wrony** do przeganiania i **✨ złote plony**.
- **🌟 Złote kłosy:** druga waluta za zadania, osiągnięcia, złote plony i budowy. Przyspiesza potrawy i wyprawy.
- **📜 Kronika wsi:** 25 fabularnych zadań oraz **🏅 15 osiągnięć × 3 medale**.
- **🧳 Wędrowny kupiec** z codzienną ofertą, **🎒 wzmacniacze** (nawóz turbo, deszczownica, przysmak, kawa, złote nasiono) i **🔥 okazje dnia** w Stodole.
- Nowe przepisy: pierogi ruskie, bigos z grzybami, mizeria, ryba z ziemniakami.
- Nazwa gospodarstwa, muzyka w tle, kopia zapasowa (kod do przeniesienia gry na inny telefon).

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
- `data.js` – definicje treści: uprawy, przepisy, ulepszenia, zadania, osiągnięcia,
- `music.js` – generowana muzyka w tle,
- `agent.js` – Sowa Mądralińska: odpowiedzi na pytania, rady i encyklopedia,
- `farm3d.js` – scena 3D gospodarstwa,
- `scenery.js` – krajobraz i życie wokół gospodarstwa (teren, las, łąka, woda, zwierzęta, cząsteczki),
- `vendor/three.module.min.js` – biblioteka Three.js r169 (licencja MIT, `vendor/three-LICENSE.txt`),
- `fonts/` – czcionka Fredoka (licencja SIL Open Font License),
- `manifest.webmanifest`, `sw.js` – instalacja jako aplikacja i tryb offline,
- `icons/` – ikony aplikacji.
