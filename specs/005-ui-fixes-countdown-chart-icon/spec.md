# Feature Specification: Naprawa UI — Kafelek odliczania, legenda wykresu historycznego, ikona lodowiska

**Feature Branch**: `005-ui-fixes-countdown-chart-icon`  
**Created**: 2026-05-06  
**Status**: Draft  
**Input**: Licznik odliczający dni do otwarcia aquaparku nie został prawidłowo przepisany do implementacji w React. Usuń go z miejsc jakie są obecnie, wrzuć to w klocek taki jak jest pogoda lub bądź na bieżąco. Dodatkowo zauważyłem że w niektórych dniach statystyki historyczne zaczynają się od 23:00 zamiast 6:00. Legenda powinna wskazywać podglądaną godzinę, teraz podaje liczbę porządkową punktu na wykresie. Symbol przy kafelku lodowisko powinień być zmieniony na jakiegoś łyżwiarza.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Kafelek odliczania dni do otwarcia aquaparku (Priority: P1)

Użytkownik odwiedza dashboard i widzi w sekcji kart informacyjnych (obok pogody i Facebooka) dedykowany kafelek informujący, ile dni pozostało do otwarcia aquaparku. Licznik jest zawsze widoczny — niezależnie od tego, czy w danym dniu są dostępne bieżące dane basenowe, czy nie. Dotychczas licznik był wyświetlany wyłącznie w miejscu listy basenów, gdy brakowało danych (jako tekst awaryjny) — zachowanie to było niezamierzone i należy je zastąpić nowym kafelkiem.

**Why this priority**: Licznik jest kluczowym elementem budowania oczekiwania wśród użytkowników. Jego widoczność nie powinna zależeć od dostępności danych operacyjnych.

**Independent Test**: Można przetestować niezależnie, otwierając dashboard w dowolnym dniu i weryfikując, że kafelek odliczania jest widoczny w rzędzie kart (obok pogody i Facebooka), a nie w miejscu listy basenów.

**Acceptance Scenarios**:

1. **Given** użytkownik otwiera dashboard, **When** strona się załaduje, **Then** w sekcji kart informacyjnych widoczny jest kafelek z tytułem nawiązującym do aquaparku i liczbą dni pozostałych do otwarcia.
2. **Given** w danym dniu są dostępne bieżące dane basenowe, **When** użytkownik patrzy na sekcję kart, **Then** kafelek odliczania nadal jest widoczny (nie jest zastępowany innymi informacjami).
3. **Given** brak bieżących danych basenowych, **When** użytkownik patrzy na sekcję z basenami, **Then** w miejscu listy basenów NIE pojawia się już tekst „Lodowisko otwarte za X dni" — jest go tylko w dedykowanym kafelku.
4. **Given** data docelowa otwarcia aquaparku minęła, **When** użytkownik patrzy na kafelek, **Then** kafelek wyświetla komunikat potwierdzający, że aquapark jest już otwarty (licznik nie pokazuje liczby ujemnej).

---

### User Story 2 — Poprawka legendy (podpowiedzi) wykresu historycznego (Priority: P2)

Użytkownik przegląda wykres historyczny obłożenia basenów dla wybranego dnia tygodnia. Po najechaniu myszką na punkt danych (lub dotknięciu na urządzeniu mobilnym), podpowiedź (tooltip) wyświetla rzeczywistą godzinę pomiaru (np. „08:15"), a nie numer porządkowy punktu na wykresie (np. „3"). Jednocześnie dane dla niektórych dni zaczynają się od godziny 23:00 — jest to artefakt zapisu danych o północy w bazie; takie wpisy nie powinny pojawiać się na wykresie.

**Why this priority**: Błędna legenda dezorientuje użytkownika co do godziny pomiaru. Dane zaczynające się od 23:00 są mylące i fałszują obraz rozkładu obłożenia w ciągu dnia.

**Independent Test**: Można przetestować niezależnie, wybierając dzień tygodnia z dużą liczbą danych, najeżdżając na punkty wykresu i weryfikując, że podpowiedź pokazuje godzinę w formacie HH:MM. Następnie sprawdzić, że żaden punkt nie ma godziny wcześniejszej niż 06:00.

**Acceptance Scenarios**:

1. **Given** użytkownik wybiera dowolny dzień tygodnia na wykresie historycznym, **When** najedzie kursorem na punkt danych, **Then** podpowiedź wyświetla rzeczywistą godzinę pomiaru (format HH:MM), a nie numer indeksu.
2. **Given** w bazie danych istnieją wpisy historyczne z godzinami między 00:00 a 05:59 dla danego dnia tygodnia, **When** użytkownik wyświetla wykres dla tego dnia, **Then** te wpisy nie są wyświetlane — wykres zaczyna się najwcześniej od godziny 06:00.
3. **Given** wykres historyczny wyświetla dane dla dnia bez wpisów nocnych, **When** użytkownik przegląda wykres, **Then** zachowanie wykresu i osi X pozostaje bez zmian.

---

### User Story 3 — Zmiana ikony kafelka Lodowiska (Priority: P3)

Użytkownik patrzy na siatkę kafelków basenów. Kafelek „Lodowisko" wyświetla ikonę łyżwiarza zamiast dotychczasowej ikony pływaka (🏊), dzięki czemu wizualnie odróżnia się od pozostałych basenów i poprawnie reprezentuje charakter obiektu.

**Why this priority**: Zmiana kosmetyczna, nie wpływa na funkcjonalność. Poprawia czytelność i estetykę interfejsu.

**Independent Test**: Można przetestować niezależnie, otwierając dashboard i weryfikując, że kafelek „Lodowisko" ma inną ikonę niż pozostałe baseny (łyżwiarz zamiast pływaka).

**Acceptance Scenarios**:

1. **Given** użytkownik otwiera dashboard, **When** patrzy na siatkę kafelków, **Then** kafelek „Lodowisko" wyświetla ikonę łyżwiarza (⛸️ lub podobną), a nie ikonę pływaka (🏊).
2. **Given** pozostałe kafelki basenów (Sportowy, Rodzinny, Kameralny), **When** użytkownik porównuje ikony, **Then** kafelki basenów nadal wyświetlają ikonę pływaka — tylko Lodowisko ma zmienioną ikonę.

---

### Edge Cases

- Co wyświetla kafelek odliczania, gdy data otwarcia aquaparku minęła (delta ujemna)?
- Co wyświetla podpowiedź wykresu, gdy dany dzień ma zerowe dane historyczne?
- Czy filtrowanie godzin nocnych na wykresie historycznym usuwa wszystkie dane przed 06:00, czy tylko przycina do pierwszego wpisu ≥ 06:00?

## Requirements *(mandatory)*

### Functional Requirements

**[Kafelek odliczania]**

- **FR-001**: System MUSI wyświetlać dedykowany kafelek informacyjny w sekcji kart na dashboardzie (obok kart pogody i Facebooka), prezentujący liczbę dni pozostałych do otwarcia aquaparku.
- **FR-002**: Kafelek odliczania MUSI być widoczny zawsze — niezależnie od dostępności bieżących danych basenowych.
- **FR-003**: System MUSI usunąć wyświetlanie licznika dni z sekcji bieżącego obłożenia basenów (obszar awaryjny przy braku danych).
- **FR-004**: Gdy data docelowa otwarcia aquaparku minęła, kafelek MUSI wyświetlać komunikat o otwarciu (np. „Aquapark jest już otwarty!") zamiast liczby ujemnej.
- **FR-005**: Dane o liczbie dni do otwarcia MUSZĄ być pobierane z istniejącego pola `opening` zwracanego przez API bieżącego obłożenia — bez zmian po stronie serwera.

**[Legenda i filtrowanie wykresu historycznego]**

- **FR-006**: Podpowiedź (tooltip) wykresu historycznego MUSI wyświetlać rzeczywistą godzinę pomiaru (format HH:MM) zamiast numeru porządkowego punktu.
- **FR-007**: Dane historyczne z godzinami przed 06:00 MUSZĄ być odfiltrowywane przed wyrenderowaniem wykresu — na poziomie logiki prezentacji (frontend).
- **FR-008**: Oś X wykresu MUSI wyświetlać rzeczywiste godziny jako etykiety kategorii, tak jak jest to już skonfigurowane — wymagana jest jedynie naprawa formatowania w tooltipie.

**[Ikona lodowiska]**

- **FR-009**: Kafelek „Lodowisko" MUSI wyświetlać ikonę łyżwiarza (⛸️) zamiast ikony pływaka (🏊).
- **FR-010**: Ikony pozostałych kafelków (Sportowy, Rodzinny, Kameralny) MUSZĄ pozostać bez zmian.

## Assumptions

- Data otwarcia aquaparku (15 grudnia 2028) jest zakodowana po stronie serwera i zwracana w polu `opening` w odpowiedzi API `/api/current/` — specyfikacja nie wymaga zmiany tej wartości.
- Filtrowanie wpisów przed 06:00 odbywa się wyłącznie po stronie frontendu, na danych zwróconych przez API historyczne — nie zmienia się logiki backendu.
- Ikona łyżwiarza to emoji ⛸️ — jeżeli projekt używa biblioteki ikon (np. FontAwesome), można użyć odpowiedniego wariantu, ale emoji jest domyślnym założeniem spójnym z resztą interfejsu.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Kafelek odliczania jest widoczny na dashboardzie w 100% przypadków — niezależnie od dostępności danych basenowych (weryfikacja manualna w trybie z danymi i bez danych).
- **SC-002**: Podpowiedź wykresu historycznego poprawnie wyświetla godzinę (format HH:MM) dla każdego punktu danych — potwierdzone dla co najmniej 3 różnych dni tygodnia.
- **SC-003**: Żaden punkt na wykresie historycznym nie reprezentuje godziny przed 06:00 — weryfikacja dla dni tygodnia, dla których w bazie istnieją wpisy nocne.
- **SC-004**: Kafelek „Lodowisko" wyświetla ikonę łyżwiarza, a pozostałe 3 kafelki basenowe wyświetlają ikonę pływaka — weryfikacja wizualna na dashboardzie.
