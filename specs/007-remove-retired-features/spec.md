# Feature Specification: Usunięcie wycofanych funkcji i materiałów projektowych

**Feature Branch**: Nie utworzono; proponowana nazwa: `007-remove-retired-features`
**Created**: 2026-09-26
**Status**: Ready for planning
**Input**: User description: "usunmy rzeczy oznaczaone do usuniecia"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Korzystanie z aktualnego produktu bez wycofanych funkcji (Priority: P1)

Jako odwiedzający chcę korzystać z informacji o zajętości obiektów i historii pomiarów,
bez nieobsługiwanych ofert rozmowy z chatbotem, darowizn ani wyłączania reklam.
Chcę zachować działające wykresy, szczegóły obiektów oraz wybór jasnego i ciemnego motywu.

**Why this priority**: Wycofanie funkcji musi być rzeczywiste, a główne zastosowanie strony
musi pozostać dostępne i prezentować te same dane.

**Independent Test**: Przejść scenariusze bieżącej zajętości, wyboru daty, średnich według
dnia tygodnia i szczegółów obiektu, a następnie spróbować użyć dawnych wejść do wycofanych
funkcji. Sprawdzić widoki na telefonie i komputerze, w obu motywach oraz z klawiaturą.

**Acceptance Scenarios**:

1. **Given** dostępne pomiary i działająca aplikacja, **When** odwiedzający sprawdza zajętość,
   wybiera datę lub dzień tygodnia i otwiera szczegóły obiektu, **Then** otrzymuje takie same
   wartości i możliwości jak przed porządkowaniem.
2. **Given** aktualna strona, **When** odwiedzający przegląda jej widoki, **Then** nie widzi
   chatbota, zachęt do darowizn, weryfikacji darczyńcy ani opcji wyłączenia reklam.
3. **Given** zapisany dawny adres lub otwarta wcześniej strona z wycofaną funkcją,
   **When** następuje próba jej wywołania, **Then** funkcja nie jest wykonywana, nie powstają
   nowe dane, nie następuje kontakt z jej dostawcą, a odpowiedź nie sugeruje sukcesu
   i nie ujawnia dawnych danych.
4. **Given** wybrany jasny lub ciemny motyw, **When** odwiedzający zmienia motyw i odświeża
   stronę, **Then** zachowane zostaje obecne działanie wyboru motywu.
5. **Given** brak pomiarów lub błąd odświeżenia, **When** odwiedzający otwiera dashboard,
   **Then** dotychczasowe rozróżnienie danych niedostępnych, błędu i rzeczywistego zera
   pozostaje zachowane.

---

### User Story 2 - Utrzymanie aplikacji bez zbędnych zależności (Priority: P1)

Jako jedyny opiekun chcę uruchamiać i utrzymywać projekt bez kodu, ustawień i usług
potrzebnych wyłącznie wycofanym funkcjom oraz bez zbędnych materiałów projektowych.

**Why this priority**: Samo ukrycie funkcji nie usuwa kosztu utrzymania ani zależności,
które mogą nadal uniemożliwiać uruchomienie aplikacji.

**Independent Test**: Przygotować aplikację bez konfiguracji wycofanych funkcji i bez
katalogów `rework/` oraz `darkmode/`; sprawdzić uruchomienie, aktywne funkcje,
zbieranie pomiarów i aktualność instrukcji.

**Acceptance Scenarios**:

1. **Given** konfiguracja zawierająca wyłącznie ustawienia wspieranych funkcji,
   **When** opiekun przygotowuje i uruchamia projekt, **Then** aplikacja działa bez klucza
   chatbota, listy darczyńców i konfiguracji darowizn lub wyłączania reklam.
2. **Given** usunięte materiały `rework/` i `darkmode/`, **When** opiekun przygotowuje
   aplikację, **Then** nie ma brakujących wymaganych zasobów ani utraty aktywnych motywów.
3. **Given** wykaz elementów związanych z wycofanymi funkcjami, **When** opiekun weryfikuje
   końcowy zakres, **Then** każdy element jest usunięty albo ma uzasadnienie zachowania
   jako współdzielony element aktywnego produktu, zabezpieczenie archiwum lub zapis historyczny.
4. **Given** aktualna instrukcja uruchomienia, **When** opiekun postępuje zgodnie z nią,
   **Then** nie jest proszony o konfigurację wycofanych funkcji.
5. **Given** działające zbieranie pomiarów, **When** usunięte zostają wycofane zależności,
   **Then** zbieranie danych i obliczanie średnich nadal działają według obecnych zasad.

---

### User Story 3 - Zachowanie dawnych danych bez ich dalszego używania (Priority: P1)

Jako opiekun chcę zachować istniejącą historię rozmów i ewentualne dane darczyńców
poza obsługą aktywnej aplikacji, aby osobno zdecydować o ich dalszym losie.

**Why this priority**: Użytkownik wybrał usunięcie kodu przy zachowaniu dotychczasowych danych.
Porządkowanie nie może spowodować ich niejawnego skasowania ani udostępnienia.

**Independent Test**: Przeprowadzić zmianę na kopii środowiska z przykładowymi dawnymi danymi
oraz w środowisku bez takich danych. Porównać stan danych przed i po, sprawdzić brak
dostępu ze strony aplikacji oraz kompletność informacji dla opiekuna.

**Acceptance Scenarios**:

1. **Given** istniejące rozmowy lub dane darczyńców, **When** funkcje zostają wycofane,
   **Then** dane są zachowane jako nieaktywne archiwum, aplikacja ich nie odczytuje,
   nie zmienia ani nie udostępnia, a opiekun zna miejsce ich przechowywania.
2. **Given** środowisko bez historii rozmów i danych darczyńców, **When** wykonywane jest
   porządkowanie, **Then** kończy się poprawnie i nie tworzy pustego archiwum użytkowników.
3. **Given** dane basenowe oraz istniejące kopie zapasowe, **When** wykonywane jest
   porządkowanie, **Then** dane te nie są usuwane ani modyfikowane przez tę zmianę.
4. **Given** powtórzenie procedury porządkowania, **When** elementy wycofane są już usunięte,
   **Then** zachowane archiwum oraz działający produkt nie doznają dodatkowych zmian ani utraty danych.

### Edge Cases

- Stare okno przeglądarki próbuje wysłać wiadomość po wdrożeniu zmiany.
- Dawny adres wycofanej funkcji jest wywoływany bez przechodzenia przez interfejs.
- Ustawienia wycofanych funkcji nadal znajdują się w lokalnym środowisku; nie mogą ich reaktywować.
- Środowisko nigdy nie używało chatbota lub nie zawiera listy darczyńców.
- Jedna biblioteka, funkcja pomocnicza, ochrona sesji lub zasób graficzny służy jednocześnie
  funkcji wycofanej i nadal wspieranej.
- Historyczna specyfikacja opisuje chatbota, a aktualna instrukcja uruchomienia już go nie wymaga.
- Archiwalne dane znajdują się w dotychczasowej bazie lub plikach; usunięcie kodu nie może
  automatycznie usuwać tych danych ani wystawiać ich jako zasobów publicznych.
- Nazwa `darkmode/` dotyczy materiałów projektowych, a nie aktywnego motywu ciemnego.
- Wycofana funkcja nie zawiera już pełnej implementacji, lecz pozostawiła konfigurację lub dokumentację.
- Usunięcie funkcji zmniejsza ilość kodu, ale nie dodaje nowych wykonywalnych linii.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Zakres MUSI objąć chatbot, darowizny, weryfikację darczyńców i wyłączanie
  reklam oraz materiały projektowe `rework/` i `darkmode/`, zgodnie z konstytucją v2.0.0.
- **FR-002**: Aplikacja MUSI przestać oferować i wykonywać wycofane funkcje, także przy
  bezpośrednim wywołaniu ich dawnych wejść. Samo ukrycie interfejsu nie spełnia wymagania.
- **FR-003**: Próba użycia wycofanej funkcji MUSI zakończyć się jednoznaczną informacją
  o niedostępności, bez wykonania operacji, pozornego sukcesu, ujawnienia dawnych danych
  ani kontaktu z zewnętrznym dostawcą tej funkcji.
- **FR-004**: Kod, zasoby, deklaracje zależności oraz przykładowa konfiguracja używane
  wyłącznie przez wycofane funkcje MUSZĄ zostać usunięte z utrzymywanej części projektu.
  Pozostałości pełniące rolę ochrony archiwum lub historii zmian MUSZĄ mieć jawne uzasadnienie.
- **FR-005**: Przed usunięciem współdzielonego elementu MUSI zostać sprawdzone jego użycie
  przez wspierany produkt; elementy nadal wymagane MUSZĄ pozostać.
- **FR-006**: Aplikację MUSI dać się przygotować i uruchomić bez ustawień, dostępu do usług
  i danych wymaganych wyłącznie przez wycofane funkcje. Pozostawione stare ustawienia
  nie mogą ponownie włączyć tych funkcji.
- **FR-007**: Katalogi `rework/` i `darkmode/` MUSZĄ zostać usunięte; aktywne motywy,
  ich wybór, niezbędne zasoby i informacje licencyjne MUSZĄ pozostać dostępne.
- **FR-008**: Bieżąca zajętość, wybór daty, średnie według dnia tygodnia, szczegóły obiektów,
  pogoda, informacje dodatkowe, nawigacja oraz zbieranie pomiarów MUSZĄ zachować
  dotychczasowe zachowanie.
- **FR-009**: Zachowane widoki MUSZĄ nadal działać po polsku, na telefonie i komputerze,
  w obu motywach i z klawiaturą, bez pogorszenia dostępności oraz ochrony aktywnych operacji.
- **FR-010**: Istniejąca historia rozmów i ewentualne dane darczyńców MUSZĄ zostać zachowane
  jako archiwum poza obsługą aktywnej aplikacji, do osobnej decyzji opiekuna. Ta funkcja
  NIE upoważnia do kasowania tych danych ani do tworzenia nowej funkcji ich przeglądania.
- **FR-011**: Wdrożenie MUSI określić, gdzie pozostały archiwalne dane i jak opiekun może
  rozpoznać ich obecność bez publikowania zawartości. Dotychczasowe nośniki danych mogą
  pozostać, jeśli aplikacja nie wykorzystuje ich już do odczytu lub zapisu wycofanych funkcji.
  Ewentualne przeniesienie wymaga sprawdzenia kompletności zachowania danych.
- **FR-012**: Procedura NIE MOŻE usuwać historii pomiarów, średnich, kopii zapasowych ani
  innych danych wspieranych funkcji. Musi działać również wtedy, gdy dawnych danych
  chatbota lub darczyńców nie ma.
- **FR-013**: Aktualne instrukcje uruchomienia i utrzymania MUSZĄ odzwierciedlać usunięcie
  funkcji oraz opisywać zachowane archiwum, ograniczenia i wycofanie wdrożenia.
  Historyczne specyfikacje i historia repozytorium nie podlegają przepisywaniu.
- **FR-014**: Zmiana MUSI zawierać regresyjne scenariusze sprawdzające niedostępność
  wycofanych funkcji i zachowanie aktywnego produktu, napisane i uruchomione przed
  zmianą zachowania zgodnie z TDD.
- **FR-015**: Jeżeli powstanie nowy kod produkcyjny, MUSI osiągnąć minimum 80% pokrycia
  wykonywalnych linii, z podanym zakresem pomiaru. Gdy zmiana jedynie usuwa kod,
  brak nowych linii należy udokumentować; testy regresji nadal są obowiązkowe.
- **FR-016**: Przed scaleniem PR MUSZĄ zostać zapisane wyniki odpowiednich lokalnych
  testów, przygotowania wersji produkcyjnej i kontroli scenariuszy użytkownika.
  Niewykonane kontrole MUSZĄ być jawnie wskazane, bez deklarowania ich powodzenia.
- **FR-017**: Zmiana MUSI zawierać zamknięty wykaz elementów wycofanych, zachowanych
  współdzielonych elementów i lokalizacji archiwum, bez kopiowania sekretów lub treści rozmów.
  Istotny wpływ porządkowania na wydajność wymaga porównania pomiarów przed i po zmianie.
- **FR-018**: Wdrożenie MUSI mieć procedurę wycofania i weryfikacji zachowania danych.
  Dopuszczalna jest krótka przerwa w działaniu; samo wycofanie wdrożenia nie może
  automatycznie reaktywować wycofanych usług zewnętrznych bez decyzji opiekuna.

### Key Entities *(include if feature involves data)*

- **Wycofana funkcja**: chatbot, darowizny, weryfikacja darczyńców lub wyłączanie reklam;
  obejmuje ofertę dla użytkownika, wykonanie operacji i elementy utrzymaniowe.
- **Materiały do usunięcia**: dawne projekty i podglądy w `rework/` i `darkmode/`;
  nie obejmują aktywnego motywu ciemnego.
- **Archiwum wycofanych funkcji**: istniejące rozmowy, ich metadane i ewentualne dane
  darczyńców; zachowane bez dalszego używania przez aplikację i bez publicznego dostępu.
- **Dane chronione przed zmianą**: pomiary zajętości, wyliczona historia, kopie zapasowe
  oraz dane potrzebne nadal wspieranym funkcjom.
- **Wykaz wycofania**: zapis zakresu usunięcia, uzasadnionych pozostałości i miejsc
  przechowywania archiwum, służący weryfikacji przez opiekuna.

### Assumptions and Dependencies

- Źródłem zakresu jest konstytucja v2.0.0 oraz decyzje opiekuna z tej rozmowy.
- Decyzja opiekuna: „Usunąć kod; istniejące dane zachować poza aplikacją do osobnej decyzji”.
  „Poza aplikacją” oznacza brak dalszego użycia i udostępniania przez aktywny produkt;
  nie oznacza automatycznego usunięcia dotychczasowych nośników danych.
- Stan danych produkcyjnych nie został sprawdzony. Procedura musi uwzględnić zarówno
  ich obecność, jak i brak; do opracowania specyfikacji nie jest potrzebna ich treść.
- To porządkowanie wycofanych funkcji, a nie ogólne usunięcie wszystkich dawnych zasobów.
  Ewentualne niezależne mechanizmy reklamowe nie są automatycznie objęte zakresem.
- Codzienny backup, czas odzyskiwania i próg nieaktualności pomiarów pozostają osobnymi
  funkcjami. W tej zmianie nie modyfikuje się polityki backupu ani obliczania średnich.
- Kontrole wykonuje lokalnie jedyny opiekun; projekt nie posiada obecnie CI ani stagingu.
- Plan wdrożenia musi rozróżnić czyste uruchomienie i aktualizację istniejącego środowiska,
  w tym zachowanie archiwalnych danych. Sposób realizacji należy do fazy planowania.
- Dokument opisuje wymagania usunięcia; nie stanowi potwierdzenia wykonania zmian w aplikacji.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Wszystkie wycofane funkcje z FR-001 są niedostępne zarówno z aktualnych widoków,
  jak i dawnych punktów wejścia; próby ich użycia nie tworzą nowych danych i nie wywołują
  związanych z nimi usług zewnętrznych.
- **SC-002**: 100% scenariuszy bieżącej zajętości, wyboru daty, średnich tygodniowych,
  szczegółów obiektu i wyboru motywu przechodzi na telefonie oraz komputerze,
  w obu motywach, wraz z kontrolą nawigacji klawiaturą.
- **SC-003**: Projekt daje się uruchomić bez jakichkolwiek ustawień wycofanych funkcji,
  a bieżące instrukcje nie zawierają kroków wymagających ich skonfigurowania.
- **SC-004**: Wykaz wycofania nie zawiera żadnego niewyjaśnionego pozostałego elementu
  wycofanych funkcji; materiały `rework/` i `darkmode/` są usunięte.
- **SC-005**: Porównanie przed i po na kopii środowiska wykazuje zero utraconych dawnych
  rozmów lub danych darczyńców i zero zmian danych zajętości wynikających z porządkowania.
  Archiwum nie jest dostępne przez aktywny produkt.
- **SC-006**: Zarówno aktualizacja środowiska z dawnymi danymi, jak i uruchomienie bez nich
  przechodzą odbiór; opiekun otrzymuje lokalizacje zachowanych danych i procedurę wycofania.
