# Feature Specification: Integracja React z aplikacją webową PoolTracker

**Feature Branch**: `003-react-frontend`  
**Created**: 2026-05-05  
**Status**: Draft  
**Input**: User description: "wdróżmy reacta do mojej aplikacji webowej"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Przeglądanie bieżących danych basenowych w interfejsie React (Priority: P1)

Użytkownik otwiera stronę główną PoolTracker i widzi aktualne dane o obłożeniu basenów (sport, rodzinny, mały, lodowy) prezentowane przez komponenty React. Odświeżanie danych odbywa się bez przeładowania strony.

**Why this priority**: To jest rdzeń aplikacji — wyświetlanie aktualnych danych basenowych. Migracja tego widoku do React stanowi fundament całej integracji.

**Independent Test**: Można przetestować niezależnie, wchodząc na stronę główną i sprawdzając, czy dane o obłożeniu basenów są poprawnie wyświetlane bez widocznych szablonów Django w interfejsie.

**Acceptance Scenarios**:

1. **Given** użytkownik wchodzi na stronę główną, **When** strona się ładuje, **Then** widzi aktualne dane o obłożeniu basenów sport, rodzinnego, małego i lodowego wyświetlone przez interfejs React
2. **Given** dane są dostępne, **When** aplikacja pobiera nowe dane, **Then** interfejs aktualizuje się bez pełnego przeładowania strony
3. **Given** brak danych z bieżącego dnia, **When** użytkownik wchodzi na stronę, **Then** wyświetlany jest czytelny komunikat o braku danych

---

### User Story 2 - Interaktywne wykresy historyczne sterowane przez React (Priority: P2)

Użytkownik może przeglądać wykresy historycznego obłożenia basenów według dnia tygodnia. Zmiana dnia następuje przez interaktywne elementy sterowane przez React, a wykres aktualizuje się natychmiast.

**Why this priority**: Wykresy historyczne są ważną częścią wartości aplikacji, ale mogą być dostarczone po widoku bieżących danych.

**Independent Test**: Można przetestować niezależnie, zmieniając zakładkę dnia tygodnia i sprawdzając, czy wykres aktualizuje się poprawnie bez przeładowania strony.

**Acceptance Scenarios**:

1. **Given** użytkownik jest na stronie głównej, **When** wybiera inny dzień tygodnia, **Then** wykres historyczny aktualizuje się bez przeładowania strony
2. **Given** wykres jest widoczny, **When** użytkownik najedzie na punkt danych, **Then** wyświetlana jest interaktywna etykieta z wartościami obłożenia

---

### User Story 3 - Chatbot zintegrowany z interfejsem React (Priority: P3)

Użytkownik może otworzyć widget chatbota dostępny na każdej podstronie. Widget jest komponentem React, który komunikuje się z istniejącym backendem chatbota.

**Why this priority**: Chatbot jest funkcją dodatkową. Integracja z React powinna nastąpić po migracji kluczowych widoków danych.

**Independent Test**: Można przetestować niezależnie, otwierając widget chatbota i wysyłając wiadomość testową.

**Acceptance Scenarios**:

1. **Given** użytkownik jest na dowolnej podstronie, **When** klika ikonę chatbota, **Then** widget otwiera się i jest gotowy do rozmowy
2. **Given** widget jest otwarty, **When** użytkownik wysyła wiadomość, **Then** chatbot odpowiada w tym samym oknie bez przeładowania strony

---

### Edge Cases

- Co się dzieje, gdy serwer danych jest niedostępny i interfejs React nie może pobrać danych?
- Jak interfejs zachowuje się przy wolnym połączeniu internetowym (stany ładowania)?
- Co wyświetla się użytkownikowi podczas pierwszego ładowania (stan pustego ekranu vs. szkielet widoku)?
- Jak zachowują się wykresy przy bardzo dużej ilości punktów danych historycznych?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Interfejs użytkownika MUSI wyświetlać aktualne dane o obłożeniu basenów (sport, rodzinny, mały, lodowy) pobierane z backendu poprzez dedykowane punkty dostępu do danych w formacie strukturyzowanym
- **FR-002**: Aplikacja frontendowa MUSI automatycznie aktualizować wyświetlane dane bez wymagania ręcznego przeładowania strony przez użytkownika
- **FR-003**: Wszystkie widoki aplikacji MUSZĄ być renderowane przez komponenty React zamiast szablonów Django
- **FR-004**: Backend Django MUSI dostarczać dane w formacie strukturyzowanym odpowiednim do konsumpcji przez frontend React (wszystkie istniejące widoki zwracające HTML muszą mieć odpowiedniki zwracające dane)
- **FR-005**: Interfejs MUSI wyświetlać stany ładowania podczas pobierania danych, aby użytkownik wiedział, że aplikacja przetwarza żądanie
- **FR-006**: Interfejs MUSI wyświetlać czytelne komunikaty błędów gdy dane są niedostępne lub serwer nie odpowiada
- **FR-007**: Wykresy historyczne MUSZĄ być interaktywne — użytkownik może wybierać dzień tygodnia i widzieć zaktualizowany wykres bez przeładowania strony
- **FR-008**: Widget chatbota MUSI być dostępny na każdej podstronie aplikacji
- **FR-009**: Aplikacja MUSI zachować dotychczasową nawigację i strukturę stron (strona główna z bieżącymi danymi, wykresy historyczne, chatbot)
- **FR-010**: Wszystkie szablony Django MUSZĄ zostać zastąpione przez React jako Single Page Application (SPA). Django pełni wyłącznie rolę API dostarczającego dane — nie serwuje żadnych widoków HTML poza pojedynczym punktem wejścia ładującym aplikację React

### Key Entities

- **Dane basenowe (bieżące)**: Aktualne wartości obłożenia dla basenów sport, rodzinnego, małego i lodowego wraz ze znacznikiem czasu
- **Dane basenowe (historyczne)**: Statystyki obłożenia zagregowane według dnia tygodnia i godziny dla każdego basenu
- **Sesja użytkownika**: Identyfikator sesji powiązany z aktywnością w aplikacji
- **Wiadomość chatbota**: Treść wiadomości wysyłanej przez użytkownika oraz odpowiedź systemu

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Strona główna ładuje się i wyświetla dane basenowe w czasie poniżej 3 sekund przy standardowym połączeniu internetowym
- **SC-002**: Aktualizacja danych na stronie następuje bez widocznego przeładowania — użytkownik nie traci kontekstu (przewinięcia, aktywnego elementu)
- **SC-003**: Zmiana dnia tygodnia w wykresie historycznym i wyświetlenie zaktualizowanego wykresu trwa poniżej 1 sekundy
- **SC-004**: Wszystkie dotychczasowe funkcje aplikacji (dane bieżące, wykresy, chatbot) pozostają dostępne i działają poprawnie po migracji do React
- **SC-005**: Interfejs poprawnie wyświetla stan błędu lub braku danych w 100% przypadków, gdy dane są niedostępne

## Assumptions

- Backend Django pozostaje niezmieniony jako serwer — dodawane są jedynie nowe punkty dostępu do danych lub rozszerzane istniejące (np. `get_date_data/`, `update_chart/`) aby zwracały dane w formacie strukturyzowanym
- Istniejące biblioteki wizualizacji (ApexCharts) mogą być opakowane w komponenty React zamiast zastępowane
- Nie zakłada się żadnych zmian w bazie danych ani modelu danych
- Responsywność interfejsu zachowuje co najmniej obecny poziom dostosowania do urządzeń mobilnych
