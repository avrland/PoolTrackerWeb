# Implementation Plan: Usunięcie wycofanych funkcji i materiałów projektowych

**Branch**: `cleanup` według HEAD podczas końcowej walidacji; identyfikator funkcji: `007-remove-retired-features`
**Date**: 2026-09-26
**Spec**: [spec.md](spec.md)
**Input**: Feature specification from `specs/007-remove-retired-features/spec.md`

## Summary

Usunąć kod chatbota, pozostałości darowizn i wyłączania reklam oraz katalogi makiet
`rework/` i `darkmode/`. Zachować aktywny frontend, motywy, ochronę sesji, dane basenowe
i istniejące archiwalne dane wycofanych funkcji. Stare wejścia muszą jednoznacznie
odrzucać żądania, zamiast zwracać działający widget lub powłokę SPA.

Zmiana nie kasuje tabel chatbota ani prywatnych plików. Przed odtworzeniem starego
kontenera wymagane jest zabezpieczenie historii CSV, która może znajdować się poza wolumenem.
Szczegóły decyzji: [research.md](research.md); zakres plików:
[contracts/removal-inventory.md](contracts/removal-inventory.md).

Ten dokument opisuje projekt implementacji. Żadne usunięcia ani testy aplikacji nie zostały
wykonane w fazie planowania.

## Technical Context

**Language/Version**: JavaScript/JSX; Node 20-alpine w buildzie; Python 3.14.2-slim backend,
Python 3.11-slim scraper, według obecnych Dockerfiles.
**Primary Dependencies**: React 18, React Router 7, Vite 8, Vitest 5, TanStack Query 5,
ApexCharts, Django/Gunicorn, Nginx 1.25-alpine. Dokładne wersje z lockfile i wyników builda;
Django w requirements nie jest przypięte.
**Storage**: PostgreSQL 16, tabele poolStats/poolstats_history, nieaktywne tabele rozmów
i wiadomości, ewentualne pliki CSV/darczyńców, wolumeny postgres_data/logs_data.
**Testing**: Vitest + React Testing Library; Django test framework; unittest scrapera;
testy HTTP Nginx/dev/backend; walidacja aktualizacji i czystego startu na izolowanych danych.
**Target Platform**: Linux Docker Compose; polski interfejs desktop/mobile, oba motywy.
**Project Type**: React SPA + Django API + scraper, pięć usług Compose.
**Performance Goals**: Zero żądań do dostawcy chatbota, zero nowych żądań i obliczeń
w aktywnych przepływach basenowych. Porównać rozmiar builda i obrazu przed/po.
Nie obiecywać poprawy czasu odpowiedzi bez pomiaru; zmiana aktywnej ścieżki krytycznej
wymaga najpierw rozszerzenia specyfikacji o warunki i budżet pomiaru.
**Constraints**: TDD; 80% pokrycia nowych linii, jeśli powstaną; bez kasowania danych;
bez rozbudowy archiwum; bez zmian zasad backupu i świeżości; krótki przestój dozwolony.
**Scale/Scope**: Jedna aplikacja, cztery kategorie pomiarów, trzy grupy wycofanych funkcji
(chatbot, darowizny, ad-free) i dwa katalogi makiet; bez założenia liczby użytkowników.

## Constitution Check

Ocena dotyczy zgodności projektu z konstytucją v2.0.0, nie wyników nieuruchomionych testów.

| Zasada | Przed research | Po design | Dowód / warunek implementacji |
|---|---|---|---|
| I. Granice i jakość kodu | Zgodny zakres | Zgodny projekt | Brak nowej architektury; usuwane tylko funkcje z wykazu; współdzielone zależności zachowane |
| II. TDD i 80% linii | Wymagane w spec | Zaplanowane, wykonanie oczekuje | Testy red niedostępności przed zmianami; istniejące regresje; raport nowych linii lub jawne zero |
| III. Polski UX i dostępność | Zachowanie wymagane | Zaplanowane, wykonanie oczekuje | Polska odpowiedź wycofania; macierz mobile/desktop × motyw × klawiatura |
| IV. Pomiar wydajności | Brak zmiany obliczeń | Zgodny projekt | Brak nowego pollingu/wywołań; porównanie buildów; budżet przed rozszerzeniem zakresu wydajności |
| V. Dane i odzyskiwanie | Zachowanie potwierdzone przez opiekuna | Zgodny projekt | Brak operacji kasujących; preflight plików kontenera; kopia bazy i porównanie zawartości |
| Bezpieczeństwo i archiwum | Wymagane | Zgodny projekt | Sesje/CSRF pozostają; archiwa poza obrazem/public root; brak wrażliwych danych w PR |
| PR i weryfikacja lokalna | Gałąź wymagana do implementacji | Gałąź cleanup istnieje; status/PR do sprawdzenia | Git niedostępny na PATH; HEAD odczytano z pliku; setup nie tworzył gałęzi |
| Codzienny backup / freshness | Istniejące braki jawne | Poza zakresem tej funkcji | Nie przedstawiać ich jako naprawionych; osobne funkcje wskazane w konstytucji |

Brak wyjątków od zasad wymaganych przez proponowane rozwiązanie. Podczas pracy HEAD zmienił
się z main na cleanup poza poleceniami tego planowania. Nie przełączano ani nie tworzono gałęzi.
Git nie jest dostępny na PATH, więc status i PR nie zostały zweryfikowane. Przed zmianą kodu
zapewnić Git i sprawdzić status gałęzi cleanup bez resetowania pracy użytkownika.
Nazwa katalogu specyfikacji jest niezależna od nazwy gałęzi. Nie commitować na main.

## Project Structure

### Documentation (this feature)

```text
specs/007-remove-retired-features/
  spec.md
  plan.md
  research.md
  data-model.md
  quickstart.md
  checklists/requirements.md
  contracts/
    retirement.md
    removal-inventory.md
  tasks.md                    # dopiero w kolejnym kroku speckit-tasks
```

### Source Code (repository root)

```text
frontend/
  nginx.conf                  # jawne 410 na dawnym prefiksie
  vite.config.js              # wyjaśniona reguła dev zapobiegająca sukcesowi SPA
  src/components/ChatbotWidget.jsx  # usunąć
  src/services/api.js         # usunąć klienta chatbota i prywatny helper
  src/tests/                  # dodać testy wycofania, zachować regresje
tablechart/
  chatbot_app/                # usunąć kod i rejestrację, nie dane
  tablechart/settings.py
  tablechart/urls.py
  chart_app/tests.py           # testy braku trasy i zachowania aktywnych wejść
  static/assets/js/chatbot-widget.js   # usunąć
  static/assets/css/chatbot-widget.css # usunąć
  requirements.txt
  .dockerignore
rework/                       # usunąć po sprawdzeniu granic ścieżki
darkmode/                     # usunąć makiety; frontendowe motywy pozostają
README.md
.env.example
```

**Structure Decision**: Zachować istniejące katalogi i narzędzia. Nie dodawać nowej
aplikacji Django, usługi archiwalnej ani modułu zarządzania rozmowami.

## Phase 0: Research

Zakończono analizę kodu i dokumentacji. [research.md](research.md) rozstrzyga:
zachowanie tabel bez migracji kasujących, pliki w warstwie kontenera,
odrzucanie dawnych żądań, zależności współdzielone, zakres i środowisko testowe.
Obecność danych produkcyjnych pozostaje kontrolą wdrożeniową, nie otwartą decyzją projektową.

## Phase 1: Design

### Kolejność implementacji

1. Zweryfikować gałąź cleanup i status pracy; zapisać bazowy build, wersje i wyniki testów.
   Wykaz plików w kontrakcie zweryfikować ponownie względem aktualnego drzewa.
2. Napisać testy braku rejestracji chatbota, odrzucania dawnych adresów i braku zależności
   od wycofanych ustawień. Uzyskać oczekiwane czerwone wyniki bez kontaktu z dostawcą modelu.
   Dodać regresje aktywnych endpointów i syntetyczny scenariusz zachowania danych.
3. Usunąć aplikację chatbota, widgety i wyłączne konfiguracje/zależności.
   Nie tworzyć migracji usuwających tabele. Zabezpieczyć dawne adresy według kontraktu.
4. Usunąć makiety i powiązane wyłączne odwołania; zachować aktywne motywy i licencje.
   Rozwiązać absolutne ścieżki i sprawdzić granice repozytorium przed rekursywnym usuwaniem.
5. Zaktualizować README, przykłady środowiska, ignorowanie archiwów oraz wykaz pozostawionych
   wyjątków. Nie odczytywać ani przepisywać prywatnych .env i plików z danymi.
6. Wykonać testy, buildy, przegląd pozostałości, kontrole UI i próby clean/upgrade.
   Zapisać rzeczywiste wyniki oraz coverage lub brak nowych linii.
7. Przed rzeczywistym wydaniem zinwentaryzować i zabezpieczyć archiwa starego środowiska;
   dopiero potem odtworzyć kontenery. Zweryfikować aktywny produkt i kontrakt wycofania.

### Zachowanie danych i wdrożenie

Szczegóły: [data-model.md](data-model.md). Zachować tabele, rekordy migracji, oba wolumeny,
backupy i pliki darczyńców. Dla plików nietrwałych kopia i zgodność hashów są warunkiem
odtworzenia kontenera. Nie wykonywać kasujących migracji ani czyszczenia wolumenów.

Plan rollbacku obejmuje obraz naprawczy przywracający poprzedni kod basenowy przy utrzymaniu
usuniętej rejestracji chatbota oraz blokad ingress. Samo przywrócenie całej starej wersji
reaktywowałoby funkcję i nie spełnia FR-018.

### Testy i odbiór

| Obszar | Dowód wymagany do zakończenia implementacji |
|---|---|
| Wycofane wejścia | Nginx 410, dev/backend 404, GET/POST/HEAD, slashless/prefix/query/static suffix; brak 200 SPA |
| Backend | Start bez pakietów/ustawień chatbota; testy sesji, cookies, dat, aktualnych i historycznych danych |
| Frontend | Vitest oraz build; brak widgetu/klienta; istniejące Theme i LoadingStates nadal green |
| Archiwum | Syntetyczne rozmowy, wiadomości i pliki identyczne po zmianie; ponowny start bez zmian |
| Czysta instalacja | Brak obowiązku tworzenia dawnych tabel/plików, działające aktywne funkcje |
| Aktualizacja | Brak operacji kasujących; brak żądań i zapytań aktywnej aplikacji do archiwum |
| Scraper | Istniejące unittest, transakcje jeśli dotknięto wspólnych zależności DB; brak zmian danych wejściowych |
| UI | Telefon/desktop, oba motywy, klawiatura; dashboard, data, średnie, szczegóły, pogoda i informacje |
| Coverage | Minimum 80% nowych wykonywalnych linii; jeżeli ich nie ma, jawna informacja, nadal testy regresji |
| PR | Zamknięty wykaz usunięć/wyjątków, wyniki poleceń, ograniczenia, instrukcja wdrożenia/rollbacku |

Procedury i polecenia: [quickstart.md](quickstart.md).
Brak wyników wykonania nie jest oznaczany jako PASS. Dokumentacja jest gotowa do rozpisania
zadań; kod aplikacji nie został zmieniony.

## Complexity Tracking

Nie zidentyfikowano naruszeń wymagających wyjątku. Zachowane stare tabele/metadane,
reguła dev odrzucania oraz wpisy ignorowania są celowymi zabezpieczeniami danych
i dawnych żądań, opisanymi w kontraktach.
