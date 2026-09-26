# Automatyczne wdrażanie na mikr.us

GitHub Actions testuje kod i buduje trzy obrazy `linux/amd64`. Po poprawnym
zakończeniu publikuje wydanie `deploy-<pełne SHA>` z `manifest.json` wskazującym
obrazy przez digest. VPS o minucie 00 i 30 sprawdza aktualny `main`. Wdraża tylko
kompletne wydanie tego commita. Gdy CI nadal pracuje, czeka do następnego cyklu.
Po restarcie serwera systemd nadrabia pominięte wywołanie.

## Przygotowanie GitHub

1. Włącz Actions dla repozytorium. Workflow potrzebuje `packages: write` do
   publikacji obrazów i `contents: write` do tworzenia wydań; deklaruje je sam.
2. Wprowadź zmiany na `main` i poczekaj na sukces workflow **Test and publish**.
3. Po pierwszej publikacji w ustawieniach każdego pakietu GHCR ustaw widoczność
   **Public**: `pooltrackerweb-web`, `pooltrackerweb-frontend`,
   `pooltrackerweb-scrapper`. Nowo utworzone pakiety mogą być prywatne niezależnie
   od widoczności repozytorium. Sprawdź anonimowe pobranie przed instalacją timera.
4. W ochronie gałęzi `main` ustaw wymagane testy i review. Migracje wdrażane
   automatycznie muszą być zgodne z poprzednim kodem (np. dodanie nullable kolumny).
   Usuwanie/zmiana znaczenia kolumn wymaga osobnego planu utrzymaniowego.

Kod w publicznych obrazach jest dostępny dla każdego. `.dockerignore` wyklucza
pliki środowiskowe, klucze, backupy, dane darczyńców i logi. Nie umieszczaj sekretów
w kodzie ani build arguments. Produkcyjny `.env` jest odczytywany wyłącznie na VPS.

## Pierwsza instalacja na VPS

Poniższe polecenia wykonuj w Bash jako root (`sudo -i`, następnie `bash`, jeśli
domyślną powłoką jest fish). Docker Engine i Compose v2 muszą już działać.

```bash
apt-get update
apt-get install -y curl jq gzip util-linux ca-certificates

# Ustal istniejący katalog i projekt; nie twórz drugiego projektu z pustą bazą.
docker inspect -f '{{index .Config.Labels "com.docker.compose.project.working_dir"}}' pooltracker-db
docker inspect -f '{{index .Config.Labels "com.docker.compose.project"}}' pooltracker-db
docker inspect -f '{{range .Mounts}}{{println .Name .Source .Destination}}{{end}}' pooltracker-db
```

Umieść pliki `deploy/` i `docker-compose.prod.yml` z tego repo w istniejącym
katalogu aplikacji. Zachowaj tam `.env`, `backups/`, `tablechart/initdb/` i
`poolStats.csv`. Nie wykonuj `docker compose down`, nie usuwaj wolumenów.
Ścieżkę `/srv/PoolTrackerWeb` poniżej zastąp faktycznym istniejącym katalogiem.

```bash
cd /srv/PoolTrackerWeb
install -o root -g root -m 0755 deploy/pooltracker-deploy.sh /usr/local/sbin/pooltracker-deploy
install -o root -g root -m 0644 deploy/pooltracker-deploy.service /etc/systemd/system/
install -o root -g root -m 0644 deploy/pooltracker-deploy.timer /etc/systemd/system/
install -o root -g root -m 0600 /dev/null /etc/pooltracker-deploy.conf
cat > /etc/pooltracker-deploy.conf <<'EOF'
APP_DIR=/srv/PoolTrackerWeb
REPOSITORY=avrland/PoolTrackerWeb
STATE_DIR=/var/lib/pooltracker-deploy
HEALTH_URL=http://127.0.0.1:8008
EOF

pooltracker-deploy init
pooltracker-deploy deploy
pooltracker-deploy status
```

`init` sprawdza wspólną nazwę projektu pięciu usług i nazwę wolumenu PostgreSQL,
zachowuje obecne obrazy pod lokalnymi tagami `bootstrap` oraz robi pierwszy backup.
Nie wymienia kontenerów. Przy nietypowej nazwie wolumenu przerywa: najpierw trzeba
świadomie dostosować konfigurację produkcyjną do istniejącego wolumenu.

Po `deploy` sprawdź, że `current.sha` w `status` jest SHA wydania, a nie
`bootstrap`; komunikat o niedostępnym wydaniu oznacza, że wdrożenia jeszcze nie było.
Sprawdź stronę oraz:

```bash
curl --fail http://127.0.0.1:8008/api/health/
docker ps --filter name=pooltracker
systemctl daemon-reload
systemctl enable --now pooltracker-deploy.timer
systemctl list-timers pooltracker-deploy.timer
```

Wolumen PostgreSQL i usługa backupu pozostają istniejące. Skrypt nie wykonuje
`down`, nie aktualizuje obrazów bazy i nie uruchamia zależności usług aplikacji.
Nie wymaga SSH z GitHub do serwera ani tokena GHCR. Konfiguracja zakłada publiczne
repozytorium i publiczne wydania. Opcjonalny `GITHUB_TOKEN` w root-only konfiguracji
podnosi limit zapytań GitHub API; nie jest potrzebny przy dwóch sprawdzeniach/h.

## Przebieg aktualizacji i awarie

1. Blokada `flock`, odczyt `main`, porównanie SHA, walidacja manifestu.
2. Pobranie wszystkich obrazów przed przerwą w działaniu; lokalne tagi chronią
   obrazy przed zwykłym usuwaniem nieotagowanych obrazów.
3. Zapis `pending.json`, zatrzymanie frontendu, Django i scrapera.
4. `pg_dump` do `backups/predeploy-<czas>-<SHA>.sql.gz`; błąd przerywa aktualizację.
5. Jednorazowe `manage.py migrate --noinput` z nowego obrazu.
6. Uruchomienie Django i scrapera, następnie odtworzenie nginx; kontrola `/`,
   `/api/health/` i procesu scrapera przez około 120 sekund.
7. Atomowy zapis udanego SHA i poprzedniej wersji; usunięcie stanu oczekującego.

Przy błędzie po zatrzymaniu aplikacji skrypt wraca do ostatnich działających
obrazów i blokuje wadliwe SHA. Nie cofa bazy automatycznie. Gdy rollback też się
nie powiedzie, zachowuje `pending.json`, zwraca błąd i wymaga interwencji.
Po restarcie najpierw odzyskuje poprzednią wersję, zanim podejmie nową aktualizację.
Healthcheck scrapera potwierdza działanie kontenera, nie świeżość danych z basenów.

```bash
journalctl -u pooltracker-deploy.service -n 100 --no-pager
pooltracker-deploy status
systemctl start pooltracker-deploy.service    # sprawdzenie teraz
pooltracker-deploy deploy                    # aktualny main
pooltracker-deploy deploy <pełne-SHA>         # konkretne opublikowane wydanie
pooltracker-deploy retry                     # jawne ponowienie zablokowanego main
pooltracker-deploy retry <pełne-SHA>
pooltracker-deploy rollback                  # poprzednie obrazy, bez migracji
systemctl disable --now pooltracker-deploy.timer
```

Ręczny rollback blokuje właśnie wycofane SHA, aby timer nie przywrócił go po
30 minutach. Wyłączenie timera nie przerywa już trwającej usługi. Nie usuwaj plików
stanu podczas wdrożenia. Stan i konfigurację może edytować tylko root.

Backupy przed wdrożeniem i lokalne tagi obrazów nie są automatycznie kasowane.
Monitoruj `df -h`, `docker system df` oraz katalog backupów. Usuwaj wyłącznie stare
wydania, które nie są wskazane przez `current`, `previous` ani `pending`; zachowaj
backup sprzed ostatniej migracji. Nie używaj `docker system prune -a`, bo usuwa też
obrazy potrzebne do rollbacku. Zewnętrzne powiadomienia nie są skonfigurowane;
awarie są widoczne w statusie usługi i journald.

Przy niezgodnej migracji zatrzymaj timer i aplikację, wybierz sprawdzony backup,
odtwórz bazę zgodnie z procedurą administracyjną i uruchom pasujące obrazy.
Odtworzenie bazy usuwa późniejsze zapisy — wymaga świadomej decyzji operatora.
Zmiany Compose, PostgreSQL, systemd i skryptu aktualizuj osobno, po przeglądzie.

## Praca lokalna i testy

Start Django nie wykonuje już migracji. Przy lokalnym Compose uruchom je jawnie:

```bash
docker compose up -d db
docker compose run --rm --no-deps --entrypoint python web manage.py migrate --noinput
docker compose up -d --build
```

Testy skryptu używają izolowanych atrap GitHub i Dockera; obejmują brak zmian,
awarie pobierania, backupu, migracji i kontroli zdrowia, rollback, odzyskiwanie po
przerwaniu oraz blokadę równoległych wywołań. Nie dotykają produkcyjnej bazy.

```bash
docker build -f deploy/Dockerfile.test -t pooltracker-deploy-tests deploy
docker run --rm pooltracker-deploy-tests
```

Pełny workflow dodatkowo uruchamia testy frontendu, testy transakcyjne scrapera
z PostgreSQL 16, sprawdzenie Django i migracji oraz budowanie trzech obrazów.
Test integracyjny sprawdza HTTP przez nginx oraz zachowanie danych po wymianie
kontenerów aplikacji. Środowisko `compose.test.yml` nie publikuje portów hosta
ani nie odczytuje produkcyjnego `.env`.
