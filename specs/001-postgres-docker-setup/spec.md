# Feature Specification: PostgreSQL Docker Setup & Django Infrastructure Cleanup

**Feature Branch**: `001-postgres-docker-setup`  
**Created**: 2026-04-23  
**Status**: Draft  
**Input**: User description: "Dodajmy do django serwer postgresql który będzie wrzucony jako drugi kontener w docker-compose. Przejrzyj niepotrzebne paczki w requirments.txt Dostosuj serwowanie assetów zgodne z flow django teraz jest bałagan, potrzebuje normalnej obsługi z migrate i collect static, dodaj potrzebne komendy przy starcie dockera."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Jednokomendowe uruchomienie środowiska (Priority: P1)

Deweloper lub administrator uruchamia całe środowisko aplikacji jedną komendą. System sam uruchamia bazę danych, czeka aż będzie dostępna, przeprowadza migracje schematu, zbiera statyczne pliki, a następnie uruchamia serwer webowy. Nie ma potrzeby ręcznej interwencji.

**Why this priority**: Jest to fundament całej zmiany — bez działającej bazy danych i poprawnego startu pozostałe scenariusze nie mają sensu. Dostarcza natychmiastową wartość: działające środowisko od zera.

**Independent Test**: Uruchomienie `docker compose up --build` na świeżej maszynie i weryfikacja, że aplikacja jest dostępna pod przypisanym portem bez żadnych błędów w logach.

**Acceptance Scenarios**:

1. **Given** świeże środowisko bez danych, **When** deweloper uruchamia skład kontenerów, **Then** baza danych startuje jako pierwsza i jest gotowa przed uruchomieniem aplikacji webowej
2. **Given** skład kontenerów uruchamia się, **When** aplikacja webowa rusza, **Then** automatycznie przeprowadzone są migracje schematu bazy danych bez interwencji użytkownika
3. **Given** migracje przebiegły pomyślnie, **When** serwer webowy rusza, **Then** wszystkie pliki statyczne są zebrane i dostępne

---

### User Story 2 - Poprawne serwowanie assetów w kontenerze (Priority: P2)

Przeglądarka użytkownika odwiedza stronę i wszystkie zasoby statyczne (CSS, JavaScript, obrazki) są poprawnie dostarczane w środowisku produkcyjnym (kontener z `DEBUG=False`). Nie ma brakujących assetów ani błędów dla plików statycznych.

**Why this priority**: Bałagan w konfiguracji plików statycznych powoduje, że w trybie produkcyjnym (kontener) assety nie są serwowane. Bezpośrednio psuje to interfejs dla każdego użytkownika końcowego.

**Independent Test**: Odwiedzenie strony w działającym kontenerze i sprawdzenie w narzędziach deweloperskich przeglądarki, że żaden zasób statyczny nie zwraca błędu.

**Acceptance Scenarios**:

1. **Given** aplikacja działa w kontenerze (tryb produkcyjny), **When** użytkownik odwiedza stronę, **Then** wszystkie pliki CSS i JavaScript ładują się bez błędów
2. **Given** plik statyczny istnieje w źródle, **When** zostaje zebrany, **Then** trafia do katalogu wyjściowego odrębnego od źródłowego (brak konfliktu ścieżek)
3. **Given** deweloper pracuje lokalnie (tryb developerski), **When** uruchamia serwer deweloperski, **Then** pliki statyczne są serwowane z katalogów źródłowych bez komendy zbierania

---

### User Story 3 - Oczyszczenie zależności projektu (Priority: P3)

Administrator projektu może zweryfikować, że lista wymaganych paczek zawiera tylko te faktycznie używane przez kod. Paczki powiązane z poprzednią bazą danych (MySQL) są usunięte i zastąpione właściwymi dla PostgreSQL.

**Why this priority**: Redukcja zależności skraca czas budowania obrazu, zmniejsza powierzchnię ataku i eliminuje ryzyko konfliktów. Jest to praca porządkowa — istotna, ale nie blokująca uruchomienie.

**Independent Test**: Zbudowanie obrazu Docker i uruchomienie aplikacji — brak błędów importu potwierdza, że wszystkie potrzebne paczki są obecne i żadne zbędne nie są dołączone.

**Acceptance Scenarios**:

1. **Given** lista zależności po oczyszczeniu, **When** aplikacja uruchamia się w kontenerze, **Then** żaden moduł nie zgłasza błędu importu z powodu brakującej paczki
2. **Given** poprzednia baza danych była MySQL, **When** zostaje zakończona migracja do PostgreSQL, **Then** paczki MySQL są usunięte z listy zależności
3. **Given** lista zależności jest oczyszczona, **When** budowany jest obraz Docker, **Then** systemowe biblioteki instalowane dla MySQL nie są już wymagane

---

### Edge Cases

- Co się stanie, jeśli baza danych nie uruchomi się w oczekiwanym czasie? Aplikacja webowa nie startuje i wypisuje czytelny błąd w logach.
- Co się stanie, jeśli katalog wyjściowy plików statycznych nie istnieje przy pierwszym uruchomieniu? Komenda zbierania plików tworzy go automatycznie.
- Co się stanie przy ponownym uruchomieniu środowiska (dane już istnieją w bazie)? Migracje działają idempotentnie — nie powodują błędów, gdy schemat jest już aktualny.
- Co się stanie, jeśli zmienne środowiskowe dla bazy danych nie są ustawione? Aplikacja odmawia startu z jasnym komunikatem o błędzie konfiguracji.
- Co się stanie przy przebudowaniu obrazu? Dane w bazie są zachowane dzięki trwałemu wolumenowi.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUSI dostarczać relacyjną bazę danych jako oddzielny, zarządzany kontener uruchamiany i zatrzymywany razem z aplikacją webową
- **FR-002**: Aplikacja webowa MUSI poczekać na gotowość bazy danych przed próbą nawiązania połączenia i przeprowadzenia migracji
- **FR-003**: System MUSI automatycznie przeprowadzać migracje schematu bazy danych przy każdym uruchomieniu kontenera aplikacji
- **FR-004**: System MUSI automatycznie zbierać pliki statyczne do scentralizowanego katalogu wyjściowego przy każdym uruchomieniu kontenera aplikacji, przed startem serwera webowego
- **FR-005**: Katalog wyjściowy plików statycznych MUSI być odrębny od katalogów źródłowych, aby uniknąć konfliktów przy komendzie zbierania plików
- **FR-006**: Konfiguracja plików statycznych MUSI działać poprawnie zarówno w trybie developerskim (lokalnie), jak i produkcyjnym (kontener z `DEBUG=False`)
- **FR-007**: Lista zależności MUSI zawierać wyłącznie paczki faktycznie używane przez kod aplikacji
- **FR-008**: Paczki powiązane z MySQL MUSZĄ być usunięte i zastąpione odpowiednikami dla PostgreSQL
- **FR-009**: Obraz Dockera MUSI instalować systemowe biblioteki wymagane przez sterownik PostgreSQL zamiast bibliotek MySQL
- **FR-010**: Dane bazy danych MUSZĄ być przechowywane w nazwanym wolumenie Dockera, aby przetrwały ponowne uruchomienia i przebudowania obrazów
- **FR-011**: Dane dostępowe do bazy danych MUSZĄ być konfigurowane przez zmienne środowiskowe, nie zakodowane na sztywno
- **FR-012**: Sekwencja startowa kontenera aplikacji MUSI być: oczekiwanie na bazę → migracje → zbieranie plików statycznych → start serwera webowego

### Key Entities

- **Kontener aplikacji webowej**: Serwis Django z Gunicorn; zależy od kontenera bazy danych; wykonuje pełną sekwencję startową
- **Kontener bazy danych**: Serwis PostgreSQL; uruchamiany jako pierwszy; dane przechowywane w trwałym wolumenie
- **Wolumin danych bazy**: Nazwany zasób Dockera przechowujący pliki bazy danych poza cyklem życia kontenerów
- **Katalog wyjściowy plików statycznych**: Scentralizowane miejsce docelowe dla wszystkich assetów po zebraniu; odrębne od katalogów źródłowych

## Assumptions

- Aplikacja docelowo działa za reverse proxy (Cloudflare), który obsługuje HTTPS; pliki statyczne serwuje WhiteNoise bezpośrednio z Gunicorn w bieżącym zakresie
- Dane logowania do bazy danych zarządzane są przez plik `.env`, który nie jest wersjonowany w repozytorium
- Migracje bazy danych są bezpieczne do wielokrotnego uruchamiania (standardowe zachowanie Django)
- Paczka `pydantic` pozostaje na liście, ponieważ jest bezpośrednio importowana w kodzie, nawet jeśli jest też zależnością tranzytywną `langchain`
- Wszystkie pozostałe paczki (`plotly`, `pandas`, `bleach`, `requests`, `django-ratelimit`, `langchain`, `langchain-google-genai`, `qdrant-client`, `whitenoise`, `gunicorn`) są aktywnie używane w kodzie i pozostają

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Całe środowisko uruchamia się od zera (`docker compose up --build`) bez żadnej ręcznej interwencji i jest gotowe do obsługi żądań
- **SC-002**: Żaden zasób statyczny (CSS, JS, obrazki) nie zwraca błędu HTTP w działającym kontenerze produkcyjnym
- **SC-003**: Lista zależności jest skrócona o co najmniej 2 paczki (usunięte `mysqlclient` i `pymysql`), a obraz Docker nie instaluje bibliotek systemowych dla MySQL
- **SC-004**: Ponowne uruchomienie środowiska zachowuje wszystkie dane aplikacji bez utraty
- **SC-005**: Sekwencja startowa (oczekiwanie na bazę, migracje, zbieranie assetów, start serwera) jest czytelnie widoczna w logach kontenera aplikacji
