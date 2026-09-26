# Quickstart: walidacja usunięcia wycofanych funkcji

Instrukcja implementacji i wydania. Wyniki prób lokalnych znajdują się w
[validation.md](validation.md); nie stanowią potwierdzenia wdrożenia produkcyjnego.
Kontrakt odpowiedzi: [contracts/retirement.md](contracts/retirement.md).
Zakres: [contracts/removal-inventory.md](contracts/removal-inventory.md).
Dane: [data-model.md](data-model.md).

## Warunki wstępne

- Git i gałąź robocza `cleanup` (HEAD przy zakończeniu planowania), ze specyfikacją
  `007-remove-retired-features`; zachowane wcześniejsze zmiany użytkownika.
- Docker Engine/Compose i dostęp do obrazów/pakietów. Frontend można testować w obrazie
  etapu builder; lokalna instalacja Node nie jest konieczna.
- Osobny host lub kontekst Docker do prób, z kopią repozytorium i wyłącznie testowym
  plikiem `.env`. Compose ma stałe container_name i port 8008: sam inny katalog/projekt
  Compose nie zapewnia izolacji od produkcji.
- Syntetyczne dane pomiarów, rozmów i darczyńców; bez kopiowania prywatnych danych do repo.
- Polecenia poniżej wykonywane z katalogu repozytorium w powłoce bash środowiska testowego.
  Do testów HTTP po zwykłym HTTP ustawić DJANGO_DEBUG=True wyłącznie w testowej konfiguracji.
  Produkcyjny smoke wykonać dodatkowo przez HTTPS.
- Przed zmianą zanotować identyfikatory obrazów, wersje pakietów i bazowe wyniki.
  Nie uruchamiać wycofanego chatbota przeciw rzeczywistemu dostawcy.

## 1. Baseline i testy red

Na izolowanym środowisku:

```bash
docker compose config --quiet
docker compose build web
docker compose up -d db
docker compose run --rm --no-deps --entrypoint python web -m django --version
docker compose run --rm --no-deps --entrypoint python web manage.py check
docker compose run --rm --no-deps --entrypoint python web manage.py test chart_app
docker build --target builder -t pooltracker-frontend-validation ./frontend
docker run --rm --entrypoint npm pooltracker-frontend-validation run test:run
```

Zanotować, że puste stare moduły Django nie stanowią dowodu testowania funkcji.
Dodać testy wycofania, uruchomić je i potwierdzić oczekiwane porażki przed usunięciami.
Testy backendu mają podmieniać zewnętrzne wywołania; nie używać prawdziwego klucza modelu.
GET dawnej trasy i kontrola rejestracji aplikacji pozwalają wykazać red bez wywołania LLM.

Test zachowania aktywnych sesji musi odróżniać brak nagłówka, niedopasowaną sesję
i poprawną sesję. Backendowe zapytania do surowych tabel wymagają przygotowanych fixture
lub kontrolowanych stubów; test integracyjny danych korzysta z oddzielnej testowej bazy.

## 2. Zabezpieczenie archiwum przed odtworzeniem kontenera

Ten krok dotyczy rzeczywistego wdrożenia dopiero po zatwierdzeniu implementacji,
a wcześniej należy przećwiczyć go z danymi syntetycznymi.

Sprawdzić obecność plików bez wyświetlania treści:

```bash
docker exec pooltracker-web test -f /app/logs/chat_history.csv
docker exec pooltracker-web test -f /logs/chat_history.csv
docker exec pooltracker-web test -f /app/donors.json
```

Kod wyjścia 1 oznacza brak danego pliku; nie jest błędem całej procedury.
Opiekun sprawdza również dawną skonfigurowaną ścieżkę darczyńców i historyczny katalog
uruchomienia, bez wklejania wartości konfiguracji do raportów.

Dla obecnego pliku w nietrwałej warstwie kontenera utworzyć prywatny katalog poza repo,
skopiować plik i porównać SHA-256. Przykład dla historii CSV:

```bash
archiveDir=/srv/pooltracker-private/retirement-007
install -d -m 700 "$archiveDir"
docker cp pooltracker-web:/app/logs/chat_history.csv "$archiveDir/chat_history.csv"
chmod 600 "$archiveDir/chat_history.csv"
docker exec pooltracker-web sha256sum /app/logs/chat_history.csv
sha256sum "$archiveDir/chat_history.csv"
```

Użyć nowego, pustego miejsca docelowego; nie nadpisywać istniejącego archiwum.
Przy aktywnych dawnych klientach zablokować przyjmowanie ich żądań przed końcową kopią
i kontrolą hashów, aby zapis nie trwał podczas porównania. Nie odtwarzać starego kontenera,
dopóki kopia i jej zgodność nie zostaną potwierdzone.
Odpowiednio zabezpieczyć inne wykryte pliki; nie kopiować ich do katalogów static/public.
Zachować wolumeny, obrazy potrzebne do odtworzenia i manifest kontroli.
Nie używać `down -v`, volume prune ani czyszczenia archiwum.

## 3. Testy green i build po zmianach

```bash
docker compose build web
docker compose run --rm --no-deps --entrypoint python web manage.py check
docker compose run --rm --no-deps --entrypoint python web manage.py migrate --plan
docker compose run --rm --no-deps --entrypoint python web manage.py test chart_app
docker build --target builder -t pooltracker-frontend-validation ./frontend
docker run --rm --entrypoint npm pooltracker-frontend-validation run test:run
docker run --rm --entrypoint npm pooltracker-frontend-validation run test:coverage
docker compose build frontend scrapper
docker compose run --rm --no-deps --entrypoint python scrapper -m unittest discover -s tests -v
docker compose config --quiet
```

Nie interpretować pominiętych testów transakcyjnych scrapera jako sukcesu.
Jeśli dotknięto wspólnych zależności bazy, uruchomić je z SCRAPPER_TEST_DATABASE_URL
wskazującym wyłącznie izolowaną bazę testową, bez ujawniania wartości.

Jeśli dodano nowy wykonywalny kod Python, w testowym środowisku użyć coverage.py,
zarejestrować zakres nowych linii i wymagać >=80%. Nie dodawać tego narzędzia do
produkcyjnych zależności tylko w celu wygenerowania raportu.
Gdy zmiana jedynie usuwa kod, zapisać „brak nowych wykonywalnych linii”, pozostawiając
obowiązek testów. Konfigurację Nginx sprawdzić także przez `nginx -t` w obrazie frontend.

## 4. HTTP oraz interfejs

Po uruchomieniu usług wyłącznie w izolowanym środowisku:

```bash
docker compose up -d web frontend
curl -i http://localhost:8008/chatbot
curl -i http://localhost:8008/chatbot/api/chat/
curl -i -X POST -H 'Content-Type: application/json' --data '{}' http://localhost:8008/chatbot/api/chat/
curl -I http://localhost:8008/chatbot/old.js
curl -i 'http://localhost:8008/chatbot/api/chat/?probe=1'
docker compose exec web python -c "import requests; r=requests.get('http://127.0.0.1:8000/chatbot/api/chat/'); print(r.status_code); assert r.status_code == 404"
```

Publiczne odpowiedzi: 410 według kontraktu, bez powłoki SPA. Przetestować również POST
bezpośrednio w Django poprzez test client oraz OPTIONS na ingress.
Przywrócić stare nazwy ustawień z pustymi lub fikcyjnymi wartościami w teście i potwierdzić,
że nie aktywują funkcji.

Tryb dev można uruchomić z Node zgodnym z bieżącym lockfile:

```bash
npm --prefix frontend ci --legacy-peer-deps
npm --prefix frontend run dev -- --host 127.0.0.1
```

Backend dla tego trybu musi nasłuchiwać na localhost:8000 w środowisku testowym,
zgodnie z istniejącym vite.config.js. Dawny adres przez localhost:5173 daje 404,
nie 200; zwykłe aktywne widoki i dane nadal działają.

Przejść dashboard, wybór daty, średnie, szczegóły obiektów, pogodę i informacje dodatkowe:
telefon + desktop, oba motywy, klawiatura. Potwierdzić pamiętanie motywu, brak widgetów,
prawdziwe zero, brak danych i błąd odświeżenia. W sieci przeglądarki brak żądań chatbota.
Porównać wartości na tym samym kontrolowanym zestawie pomiarów.

## 5. Dwa warianty danych i ponowne wdrożenie

**Czysty start**: nowa izolowana baza bez dawnych tabel, bez plików i wycofanych ustawień.
Zwykłe migrate nie tworzy tabel chatbota; aktywne dane i sesje działają.

**Aktualizacja**: bazę testową najpierw przygotować poprzednią wersją z syntetycznymi
rozmowami/wiadomościami, pomiarami i przykładowymi plikami. Zapisać liczby i kontrolne
skróty treści przy zatrzymanych zapisach. Następnie uruchomić nowe obrazy i zwykłe migrate.
Porównać zawartość, nie tylko liczby rekordów. Wykonać drugi start i ponowić porównanie.

W planie migracji nie może być operacji kasujących archiwum. Logi/testowe śledzenie zapytań
potwierdzają brak dostępu aktywnych widoków do tabel chatbota.
Test braku wycofanych zależności wykonuje się w świeżym obrazie, nie starym virtualenv.
Nie uruchamiać procedur tworzenia fixture na produkcji.

## 6. Rollback i dowody do PR

Przećwiczyć obraz naprawczy ze sprawdzonym kodem basenowym oraz zachowanym wycofaniem
chatbota; nie przywracać po prostu starego URLconf i sekretów modelu.
Blokada dawnych adresów musi działać także przy bezpośrednim dostępie do backendu.
Porównać dane po próbie rollbacku.

PR zawiera: testy red/green, wyniki buildów i checków, zakres coverage, macierz UI,
zamknięty wykaz pozostałości, potwierdzenie zachowania danych oraz wersje obrazów.
Nie dołączać treści rozmów, list darczyńców, haseł ani całego rozwiniętego docker compose config.
Niewykonane kroki oznaczyć jawnie; sam plan nie stanowi wyniku walidacji implementacji.

## 7. Powtarzalne testy wycofania

`tests/retirement/env.test` zawiera wyłącznie syntetyczne ustawienia. Pomocnik bazy
odmawia działania, jeśli jej nazwa nie zaczyna się od `retirement_`. Nie podawać mu
produkcyjnego połączenia. Testy archiwum wymagają `psycopg2`; uruchamiać je w obrazie web.

- `test_archive_upgrade.py seed` przygotowuje syntetyczne dane **po migracjach starej
  wersji**; `snapshot --manifest <plik>` zapisuje skróty, a `verify` porównuje dane.
- Na świeżej bazie nowej wersji użyć `clean`, następnie `seed-pools` i `test_live_pool.py`.
- `test_runtime_retirement.py` uruchamiać w świeżo zbudowanym obrazie web.
- `test_archive_packaging.py` uruchamiać na hoście z Pythonem i dostępem do Docker;
  sam tworzy tymczasowy kontekst z fikcyjnymi danymi.
- `test_http_retirement.py` wymaga `RETIREMENT_PUBLIC`, `RETIREMENT_BACKEND`,
  `RETIREMENT_DEV` wskazujących działające usługi testowe. Używa nagłówka Host localhost,
  aby nazwa kontenera nie uruchamiała ochrony hostów Vite. Testować także z fikcyjnymi
  czterema dawnymi zmiennymi środowiskowymi. Przy współdzieleniu namespace sieciowego
  restart backendu wymaga restartu kontenera Vite przed kontrolą.
- `Dockerfile.ui` w tym samym katalogu buduje testowy Chromium/Playwright. Uruchomić
  obraz w testowej sieci z `UI_BASE` wskazującym frontend. Montować aktualny `ui.mjs`
  jako `/validation/ui.mjs` i katalog wyników jako `/validation/results`. Skrypt
  przechodzi 390/1440 px i oba motywy; API otrzymuje syntetyczne odpowiedzi, pozostały
  ruch zewnętrzny jest blokowany. Wyniki API na rzeczywistej bazie sprawdza osobny test.

## 8. Lista kontrolna rzeczywistego wydania

Przeprowadzono lokalną próbę; poniższą listę opiekun powtarza dla produkcji.

1. Zapisać identyfikatory obecnych obrazów i przygotować obraz naprawczy z nadal
   wyłączonym chatbotem. Zachować kopię bazy i wolumeny.
2. Zablokować zapisy wycofanych funkcji, również bezpośrednią trasę backendu.
3. Sprawdzić obie lokalizacje historii CSV i faktyczną dawną ścieżkę darczyńców.
   Kopię nietrwałych plików umieścić w nowym prywatnym miejscu; porównać rozmiary
   i SHA-256, zapisać prywatny manifest. Dopiero wtedy odtwarzać kontenery.
4. Uruchomić świeże obrazy i zwykłe migracje. Bez usuwania tabel, rekordów migracji,
   content types, plików, backupów czy wolumenów.
5. Sprawdzić produkcyjny HTTPS, aktywne dane, daty, średnie, sesje, pogodę i motywy;
   potwierdzić publiczne 410 oraz backendowe 404 wycofanych tras.
6. Porównać zachowane dane i pliki z manifestem. Przy problemie użyć obrazu
   naprawczego, zachowując blokady zarówno na Nginx, jak i w Django, i ponowić smoke.

Codzienny harmonogram backupów i próg świeżości pozostają osobnymi zadaniami.

