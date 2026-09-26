# Research: usunięcie wycofanych funkcji

**Date**: 2026-09-26
**Status**: Decyzje projektowe rozstrzygnięte; próby uruchomieniowe należą do implementacji.

## 1. Usunięcie aplikacji bez usuwania archiwalnych danych

**Decision**: Usunąć rejestrację i kod `chatbot_app`, włącznie z jego migracją początkową.
Nie wykonywać `DeleteModel`, `DROP TABLE`, `migrate chatbot_app zero`, czyszczenia
content types ani rekordów `django_migrations`. Istniejące tabele zostają nieaktywne.
Nowa instalacja nie tworzy tabel chatbota.

**Rationale**: Opiekun wybrał zachowanie danych. Lokalna migracja chatbota nie zależy od
innych aplikacji, a przegląd pozostałych migracji nie wykazał odwołań do niej.
Zgodnie z [dokumentacją migracji Django](https://docs.djangoproject.com/en/5.2/topics/migrations/)
zmiany schematu wynikają z operacji migracji; projekt celowo nie wprowadza operacji kasowania.
Zachowanie podczas aktualizacji należy potwierdzić na kopii bazy z faktyczną wersją Django.

**Alternatives considered**: Eksport i kasowanie tabel odrzucone jako szersza operacja na danych.
Pozostawienie zainstalowanej aplikacji z pustymi widokami zachowałoby zbędny kod i zależności.

## 2. Pliki archiwalne i kolejność wdrożenia

**Decision**: Zachować pliki darczyńców i historii, lecz wyłączyć ich użycie przez aplikację.
Przed odtworzeniem kontenera sprawdzić obecność plików i zabezpieczyć dane z jego
zapisywalnej warstwy w prywatnym katalogu opiekuna poza repozytorium i build context.

**Rationale**: `save_chat_history()` zapisuje `logs/chat_history.csv` względem bieżącego
katalogu; Docker ustawia `/app`, więc oczekiwana ścieżka to `/app/logs/chat_history.csv`.
Compose montuje `logs_data` pod `/logs`, a nie `/app/logs`. Nie ma dowodu, że historyczny
plik istnieje na produkcji; procedura musi sprawdzić oba miejsca i konfigurację darczyńców.
Odtworzenie kontenera przed zabezpieczeniem pliku może go utracić.

**Alternatives considered**: Automatyczne przeniesienie wszystkich danych do nowego magazynu
jest zbędne. Zachowanie wyłącznie wolumenu `logs_data` nie chroni plików w `/app/logs`.

## 3. Dawne adresy nie mogą zwracać powłoki SPA

**Decision**: Nginx zwraca 410 i polski komunikat dla dokładnego `/chatbot` i prefiksu
`/chatbot/`, bez przekazania do backendu. Reguła prefiksowa ma pierwszeństwo przed
regułą zasobów statycznych. Backend po usunięciu URLconf zwraca zwykłe 404.
W Vite zachować wąską regułę proxy dla dawnego prefiksu, opisaną jako zabezpieczenie
przed fallbackiem SPA; prowadzi wyłącznie do backendu zwracającego 404.
Nie dodawać nowego widoku ani klienta usług chatbota.

**Rationale**: Usunięcie samego proxy może zamienić dawny adres w 200 z index.html.
[Nginx dokumentuje pierwszeństwo lokalizacji](https://nginx.org/en/docs/http/ngx_http_core_module.html#location).
Wyjątek w Vite jest jawną, uzasadnioną pozostałością ochronną FR-004, a nie obsługą funkcji.
Backend pozostaje zależnością trybu dev także dla aktywnych danych.

**Alternatives considered**: Nowy plugin Vite lub widok Django 410 zwiększałby ilość kodu
wykonywalnego dla funkcji, którą usuwamy. Zwykły fallback SPA nie spełnia FR-003.
Brak działającego backendu w dev może dać 5xx; także wtedy niedopuszczalne jest 2xx.

## 4. Zależności wyłączne i współdzielone

**Decision**: Usunąć deklaracje `langchain`, `langchain-google-genai`, `pydantic`,
`bleach` i nieużywanego `qdrant-client`. Zachować `django-ratelimit`, `pandas`,
`requests`, `pytz` oraz ochronę sesji i CSRF; są częścią aktywnego backendu.
Ponownie sprawdzić importy podczas implementacji, bo repozytorium może się zmienić.

**Rationale**: Pydantic i bleach są użyte w kodzie chatbota; nie znaleziono importów Qdrant.
Chart API korzysta z ratelimit, pandas, requests i pytz. Nie dodajemy ani nie aktualizujemy
bibliotek w ramach porządkowania. Obecny frontend ma już inne wersje niż stare plany
(Vite 8, Vitest 5, Router 7); źródłem prawdy są aktualne manifesty i lockfile.

**Alternatives considered**: Usuwanie wszystkich dawnych bibliotek, np. Plotly, wykracza
poza wykazane powiązania z tą funkcją. Usunięcie wspólnej ochrony CSRF byłoby regresją.

## 5. Zakres materiałów i dokumentacji

**Decision**: Usunąć `rework/`, `darkmode/` i konkretne zasoby chatbota.
Zachować aktywne theme CSS/context/toggle, zasoby współdzielone i licencje. Uaktualnić README
i przykłady konfiguracji. Historyczne specyfikacje i historia Git pozostają zapisami historycznymi.
Zachować wpisy ignorowania archiwów i dodać wykluczenia archiwalnych plików z obrazu backendu.

**Rationale**: `darkmode/` to makiety, a aktywne motywy mieszkają w `frontend/src/`.
Dockerfile backendu używa `COPY . .`, dlatego samo ignorowanie Git nie chroni przed
włączeniem dawnych danych do obrazu. Nietypowy `tablechart/.env example` traktować
jako potencjalnie wrażliwy plik: ustalić status i usunąć wyłącznie wycofane nazwy ustawień,
bez wyświetlania wartości i bez kasowania całego pliku w ciemno.

**Alternatives considered**: Globalne kasowanie wystąpień słowa „donate” usunęłoby
niepowiązane ikony vendor. Ogólne sprzątanie legacy nie jest zakresem specyfikacji.

## 6. Weryfikacja, wersje i braki środowiska

**Decision**: Najpierw testy red dla usunięcia, potem usunięcia i testy green.
Użyć istniejących Vitest/RTL, Django i unittest, plus testów czystego startu i aktualizacji
kopii bazy. Nowe wykonywalne linie wymagają 80% coverage; czyste usunięcia dokumentują
brak nowego kodu zamiast deklarować sztuczne 100%.

**Rationale**: W obecnej powłoce Docker jest dostępny, Git/Node/npm nie są na PATH,
a poprzednia próba Python wykazała brak działającego interpretera. Nie sprawdzano demona
Docker ani produkcji i nie wykonywano buildów/testów aplikacji podczas planowania.
Backend ma nieprzypięte wymagania Django: zapisać faktyczne wersje w wynikach walidacji.
Nie zakładać wersji Django 4 na podstawie komentarza wygenerowanego przy utworzeniu projektu.

**Alternatives considered**: Wymiana narzędzi testowych lub naprawa wszystkich braków
historycznego kodu nie jest konieczna do zaprojektowania tej zmiany.

