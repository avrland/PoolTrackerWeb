# Feature Specification: Integracja modułu Scrapper z Docker Compose i wspólną bazą PostgreSQL

**Feature Branch**: `002-scrapper-docker-integration`  
**Created**: 2026-04-27  
**Status**: Draft  
**Input**: User description: "W projekcie mam folder scrapper który pochodzi z innego repo. Dokonaj integracji tego modułu z pozostałymi w obecnym docker compose (swoją drogą przerzuć docker compose do głównego katalogu). Scrapper ma korzystać z bazy postregsql z którego korzysta aplikacja w django."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Uruchomienie całego systemu jednym poleceniem (Priority: P1)

Deweloper lub administrator systemu chce uruchomić całą aplikację (bazę danych, aplikację webową Django oraz scrapper) za pomocą jednego polecenia wydanego z katalogu głównego projektu. Wszystkie usługi startują we właściwej kolejności — baza danych jako pierwsza, następnie scrapper i aplikacja webowa, które na nią czekają.

**Why this priority**: To jest fundamentalne wymaganie integracji — bez możliwości jednoczesnego uruchomienia wszystkich usług nie ma sensu mówić o integracji. Dostarcza natychmiastową wartość: jeden punkt wejścia do całego projektu.

**Independent Test**: Można przetestować przez wydanie jednego polecenia uruchomienia środowiska z katalogu głównego i sprawdzenie, czy wszystkie trzy usługi (baza danych, scrapper, aplikacja webowa) są aktywne.

**Acceptance Scenarios**:

1. **Given** projekt jest sklonowany i plik konfiguracyjny środowiska jest uzupełniony, **When** wydajemy polecenie uruchomienia usług z katalogu głównego projektu, **Then** wszystkie trzy usługi (baza danych, scrapper, aplikacja webowa) uruchamiają się bez błędów i działają.
2. **Given** baza danych nie jest jeszcze gotowa, **When** scrapper lub aplikacja webowa próbuje się połączyć, **Then** obie usługi czekają na gotowość bazy danych i łączą się dopiero po jej starcie.
3. **Given** system działa, **When** sprawdzamy logi scrapera, **Then** widać potwierdzenie uruchomienia harmonogramu zbierania danych.

---

### User Story 2 - Automatyczne zbieranie danych o obłożeniu basenów (Priority: P1)

Scrapper działa jako trwale działająca usługa w tle, która co 15 minut odpytuje zewnętrzne API dostawcy danych o aktualną liczbę osób na każdym z czterech torów basenowych (sportowy, rodzinny, kameralny, lodowisko) i zapisuje wyniki do wspólnej bazy danych.

**Why this priority**: To jest główna logika biznesowa scrapera — bez tego dane historyczne o obłożeniu nie są zbierane, co pozbawia sensowności cały system śledzenia statystyk basenowych.

**Independent Test**: Po uruchomieniu systemu można sprawdzić bazę danych po upływie 15 minut — powinien pojawić się nowy rekord z aktualną datą i liczbami obłożenia dla czterech stref.

**Acceptance Scenarios**:

1. **Given** scrapper działa i zewnętrzne API jest dostępne, **When** nadchodzi zaplanowana pora pomiaru (co 15 minut: :00, :15, :30, :45), **Then** nowy rekord z danymi obłożenia wszystkich czterech stref pojawia się w bazie danych.
2. **Given** zewnętrzne API jest chwilowo niedostępne, **When** scrapper próbuje pobrać dane, **Then** błąd jest rejestrowany w logu, a następny pomiar odbywa się zgodnie z harmonogramem (system nie przerywa pracy).
3. **Given** scrapper działa, **When** dane są zapisywane do bazy, **Then** każdy rekord zawiera znacznik czasu uwzględniający aktualną polską strefę czasową (czas letni/zimowy).

---

### User Story 3 - Dostęp aplikacji Django do danych zbieranych przez scrapera (Priority: P2)

Aplikacja webowa Django odczytuje dane zapisywane przez scrapper z tej samej bazy danych, dzięki czemu wykresy i statystyki na stronie odzwierciedlają najnowsze pomiary bez dodatkowej konfiguracji po stronie bazy.

**Why this priority**: Wspólna baza danych to główny cel integracji ze strony użytkownika końcowego — dane zebrane przez scrapper mają być widoczne w aplikacji webowej.

**Independent Test**: Po zebraniu co najmniej jednego rekordu przez scrapper, odświeżenie strony z wykresem w aplikacji webowej powinno wyświetlić nowe dane.

**Acceptance Scenarios**:

1. **Given** scrapper zapisał nowe dane do bazy, **When** użytkownik przegląda wykresy w aplikacji webowej, **Then** najnowsze pomiary są widoczne.
2. **Given** oba serwisy korzystają z tej samej bazy danych, **When** konfiguracja środowiska zmienia dane dostępowe do bazy, **Then** obie usługi automatycznie używają nowych danych (z jednego miejsca konfiguracji).

---

### User Story 4 - Cykliczny backup bazy danych na folder hosta (Priority: P2)

Administrator systemu chce, aby baza danych była automatycznie archiwizowana raz w tygodniu do wyznaczonego folderu na maszynie hostującej kontenery. Dzięki temu możliwe jest przywrócenie danych po awarii lub pomyłce bez utraty historii pomiarów.

**Why this priority**: Dane historyczne zbierane przez scrapper są trudne do odtworzenia — raz utracone pomiary są bezpowrotnie stracone. Backup tygodniowy stanowi minimalne zabezpieczenie przy niskim koszcie konfiguracji.

**Independent Test**: Można przetestować przez sprawdzenie folderu backupów na hoście po tygodniu działania systemu — powinien zawierać co najmniej jeden plik archiwum bazy danych.

**Acceptance Scenarios**:

1. **Given** system działa od co najmniej tygodnia, **When** nadchodzi zaplanowana pora backupu, **Then** w wyznaczonym folderze na hoście pojawia się nowy plik archiwum bazy danych z datą w nazwie.
2. **Given** folder docelowy backupów jest dostępny i ma wystarczające miejsce, **When** backup zostaje wykonany, **Then** plik archiwum można użyć do samodzielnego przywrócenia bazy bez dodatkowych narzędzi poza standardowymi.
3. **Given** w folderze backupów jest kilka plików z poprzednich tygodni, **When** wykonywany jest nowy backup, **Then** stare pliki (starsze niż konfigurowalny próg) są usuwane, by nie zapełniać dysku hosta.

---

### Edge Cases

- Co się dzieje, gdy zewnętrzne API zwróci niepełne dane (brak którejś ze stref basenowych)?
- Co się stanie, gdy baza danych uruchomi się z opóźnieniem — czy scrapper ponowi próbę połączenia podczas zapisu?
- Co się dzieje, gdy zmienne środowiskowe dla bazy danych nie są ustawione?
- Co się stanie, gdy folder backupów na hoście nie istnieje lub nie ma uprawnień do zapisu?
- Co się stanie, gdy dysk hosta jest pełny w trakcie tworzenia backupu?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUSI umożliwiać uruchomienie wszystkich usług (baza danych, aplikacja webowa, scrapper) za pomocą jednego polecenia z katalogu głównego projektu.
- **FR-002**: Plik orkiestracji usług MUSI znajdować się w katalogu głównym projektu, nie w podkatalogu konkretnego modułu.
- **FR-003**: Scrapper MUSI korzystać z tej samej bazy danych, co aplikacja webowa Django — współdzieląc dane dostępowe z jednego źródła konfiguracji.
- **FR-004**: Dane dostępowe do bazy danych (adres hosta, nazwa bazy, użytkownik, hasło) MUSZĄ być konfigurowane w jednym miejscu i używane zarówno przez scrapper, jak i aplikację webową.
- **FR-005**: Scrapper MUSI uruchamiać się dopiero po potwierdzeniu gotowości bazy danych do przyjmowania połączeń.
- **FR-006**: Scrapper MUSI zbierać dane o obłożeniu wszystkich czterech stref basenowych (sportowa, rodzinna, kameralna, lodowisko) co 15 minut.
- **FR-007**: W przypadku błędu połączenia z zewnętrznym API, scrapper MUSI zarejestrować błąd w logu i kontynuować pracę według harmonogramu bez przerywania działania.
- **FR-008**: Każdy zapisany pomiar MUSI zawierać znacznik czasu w polskiej strefie czasowej (z uwzględnieniem czasu letniego i zimowego).
- **FR-009**: Aplikacja webowa Django MUSI mieć dostęp do danych zapisywanych przez scrapper bez dodatkowej konfiguracji po stronie schematu bazy.
- **FR-010**: System MUSI wykonywać automatyczny backup bazy danych raz w tygodniu.
- **FR-011**: Pliki backupu MUSZĄ być zapisywane do wyznaczonego folderu na maszynie hostującej kontenery (montowany wolumen hosta).
- **FR-012**: Nazwa pliku backupu MUSI zawierać datę i czas jego wykonania, umożliwiając identyfikację bez otwierania pliku.
- **FR-013**: System MUSI automatycznie usuwać pliki backupu starsze niż konfigurowalny próg (domyślnie: 30 dni), zapobiegając niekontrolowanemu wzrostowi zajętości dysku.
- **FR-014**: Backup MUSI być wykonywany w formacie umożliwiającym przywrócenie bazy standardowymi narzędziami PostgreSQL, bez dodatkowego oprogramowania.

### Key Entities

- **Pomiar obłożenia**: Dane zebrane jednorazowo, zawierające czas pomiaru oraz liczbę osób na każdym z czterech torów basenowych. Każdy pomiar jest unikalnie identyfikowany.
- **Konfiguracja środowiska**: Zestaw parametrów określających dane dostępowe do bazy danych (adres hosta, nazwa bazy, użytkownik, hasło), współdzielony przez wszystkie usługi w systemie.
- **Archiwum backupu**: Plik zawierający pełny zrzut bazy danych w danym momencie, przechowywany na hoście z unikalną nazwą zawierającą znacznik czasu.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Wszystkie usługi systemu uruchamiają się i osiągają stan gotowości w mniej niż 60 sekund od wydania polecenia uruchomienia (przy dostępnym połączeniu sieciowym).
- **SC-002**: W ciągu pierwszej godziny działania systemu w bazie danych pojawia się co najmniej 4 rekordy pomiarów (jeden co 15 minut), pod warunkiem dostępności zewnętrznego API.
- **SC-003**: W przypadku 5 następujących po sobie błędów odpytywania zewnętrznego API, scrapper nadal kontynuuje pracę i podejmuje kolejną próbę o zaplanowanej porze.
- **SC-004**: Zmiana danych dostępowych do bazy danych w jednym pliku konfiguracyjnym jest wystarczająca do działania obu usług (scrapper i aplikacja webowa) bez modyfikacji kodu.
- **SC-005**: Logi scrapera są dostępne i czytelne z poziomu systemu orkiestracji bez konieczności wchodzenia do kontenera.
- **SC-006**: Po tygodniu działania systemu w folderze backupów na hoście znajduje się co najmniej jeden plik archiwum, a jego zawartość pozwala na odtworzenie bazy danych.
- **SC-007**: Folder backupów nie przekracza rozmiaru odpowiadającego wartości progu retencji × rozmiar pojedynczego backupu (nie rośnie w nieskończoność).

## Assumptions

- Zewnętrzne API dostawcy danych (`miejskoaktywni.pl`) pozostaje dostępne i nie zmienia formatu odpowiedzi.
- Schemat tabeli do przechowywania pomiarów w bazie danych (kolumny: unikalny identyfikator, czas, sport, rodzinna, kameralna, lodowisko) jest już zdefiniowany i nie wymaga zmiany.
- Środowisko docelowe obsługuje konteneryzację.
- Strefa czasowa odniesienia dla pomiarów to Europa/Warszawa (UTC+1/UTC+2).
- Scrapper nie wymaga mechanizmu deduplicji — wielokrotne pomiary w tym samym oknie czasowym są akceptowalne.
- Folder docelowy backupów na hoście jest podawany przez administratora w konfiguracji środowiska (zmienna lub ścieżka w docker-compose.yml).
- Pojedynczy backup nie przekroczy kilkudziesięciu MB (baza zawiera wyłącznie dane pomiarowe o niskim wolumenie).
- Retencja backupów domyślnie 30 dni — administrator może zmienić tę wartość przez zmienną środowiskową.
