# Feature Specification: Przywrócenie brakujących funkcjonalności frontendu React

**Feature Branch**: `004-restore-frontend-features`  
**Created**: 2026-05-05  
**Status**: Draft  
**Input**: User description: "Przywróć brakujące funkcjonalności frontendu React: popup z godzinami otwarcia pływalni, adresy z linkami do Google Maps, moduł pogody OpenWeatherMap, karta Facebook, wykres obłożenia bieżącego dnia, tryb nocny, poprawka strefy czasowej na statystykach historycznych"

## Kontekst

Serwis PoolTracker wyświetla aktualne i historyczne obłożenie basenów oraz lodowiska w Białymstoku. W trakcie migracji ze starszego szablonu Django do interfejsu opartego na React zniknęło kilka funkcjonalności, które użytkownicy znali z poprzedniej wersji. Celem tego feature'u jest pełne przywrócenie parytetu funkcjonalnego z wersją poprzednią, bez zmiany logiki biznesowej.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Sprawdzenie godzin otwarcia pływalni (Priority: P1)

Odwiedzający stronę chce sprawdzić godziny otwarcia konkretnej pływalni bez opuszczania strony głównej. Klika na ikonę pływalni (karta z numerem aktualnych pływaków), a w odpowiedzi pojawia się okno z harmonogramem godzin otwarcia na każdy dzień tygodnia oraz zdjęciem obiektu.

**Why this priority**: To kluczowa informacja operacyjna — bez niej użytkownik nie wie, kiedy może przyjść na basen. Był to jeden z najważniejszych elementów poprzedniej wersji.

**Independent Test**: Można przetestować niezależnie: kliknięcie w każdą kartę pływalni powinno otwierać własne okno z harmonogramem danego obiektu.

**Acceptance Scenarios**:

1. **Given** użytkownik widzi dashboard z kartami pływalni, **When** kliknie ikonę pływalni sportowej, **Then** pojawia się okno z tabelą godzin otwarcia na każdy dzień tygodnia dla pływalni sportowej
2. **Given** użytkownik widzi dashboard, **When** kliknie ikonę lodowiska, **Then** pojawia się okno z godzinami otwarcia lodowiska (które różnią się od godzin pływalni)
3. **Given** okno z godzinami jest otwarte, **When** użytkownik kliknie „Zamknij" lub klawisz Escape, **Then** okno znika bez przeładowania strony
4. **Given** użytkownik jest na urządzeniu mobilnym, **When** otworzy okno z godzinami, **Then** okno jest czytelne i nie wychodzi poza ekran

---

### User Story 2 - Nawigacja do pływalni przez Google Maps (Priority: P1)

Użytkownik chce dotrzeć fizycznie do wybranej pływalni. Pod każdą kartą pływalni widzi jej adres jako klikalny link otwierający Google Maps ze wskazówkami dojazdu.

**Why this priority**: Podstawowy element użyteczności — użytkownik musi wiedzieć, gdzie jest basen. Było dostępne w poprzedniej wersji i jest oczekiwane przez użytkowników powracających.

**Independent Test**: Kliknięcie adresu pod każdą kartą pływalni powinno otwierać właściwy obiekt w Google Maps w nowej karcie przeglądarki.

**Acceptance Scenarios**:

1. **Given** użytkownik widzi kartę pływalni, **When** kliknie adres pod kartą, **Then** otwiera się nowa karta przeglądarki z Google Maps wskazującym konkretny adres danej pływalni
2. **Given** są 4 obiekty (Basen Sportowy, Basen Rodzinny, Basen Mały, Lodowisko), **Then** każdy z nich ma własny, poprawny adres prowadzący do właściwej lokalizacji na mapie
3. **Given** strona jest renderowana na urządzeniu mobilnym, **Then** kliknięcie adresu otwiera aplikację Map (Google Maps lub Apple Maps) jeśli jest zainstalowana

---

### User Story 3 - Podgląd aktualnej pogody w Białymstoku (Priority: P2)

Odwiedzający planuje wizytę na basenie i chce wiedzieć, jaka jest aktualna pogoda w mieście — przydatne szczególnie przy decyzji o wizycie na lodowisku lub basenie odkrytym. Na dashboardzie widzi kartę z aktualną temperaturą, opisem pogody (np. „Zachmurzenie duże"), temperaturą odczuwalną i wilgotnością, wraz z ikoną pogody.

**Why this priority**: Wartościowy kontekst dla decyzji użytkownika, szczególnie przy planowaniu wyjścia na lodowisko. Wymagany jest osobny punkt danych pobieranych z serwisu pogodowego.

**Independent Test**: Karta pogody powinna być widoczna jako niezależny element dashboardu. Można ją przetestować sprawdzając, czy wyświetlane dane zmieniają się wraz ze zmianą pogody i czy poprawnie obsługuje błąd połączenia z serwisem pogodowym.

**Acceptance Scenarios**:

1. **Given** serwis pogodowy jest dostępny, **When** użytkownik odwiedza stronę, **Then** widzi kartę z aktualną temperaturą w °C, opisem pogody po polsku, temperaturą odczuwalną, wilgotnością i ikoną pogody
2. **Given** serwis pogodowy jest niedostępny lub klucz API jest nieważny, **When** użytkownik odwiedza stronę, **Then** karta pogody wyświetla informację zastępczą (np. „Brak danych pogodowych") bez zerwania reszty strony
3. **Given** serwis pogodowy jest dostępny, **Then** dane dotyczą miasta Białystok i są aktualne (maksymalnie 10 minut stare)

---

### User Story 4 - Link do strony Facebook pływalni (Priority: P3)

Użytkownik chce śledzić aktualności, harmonogramy i komunikaty pływalni na Facebooku. Na dashboardzie widzi kartę zachęcającą do polubienia strony na FB, z klikalnymi elementami prowadzącymi bezpośrednio do profilu.

**Why this priority**: Element budowania społeczności i kanał komunikacji z użytkownikami. Był obecny w poprzedniej wersji i utrzymuje pełen parytet funkcjonalny.

**Independent Test**: Kliknięcie w kartę FB lub jej elementy powinno otwierać profil basenbialystok.pl na Facebooku w nowej karcie.

**Acceptance Scenarios**:

1. **Given** użytkownik widzi dashboard, **When** kliknie kartę Facebooka lub ikonę FB, **Then** otwiera się strona `facebook.com/basenbialystok` w nowej karcie przeglądarki
2. **Given** użytkownik jest na urządzeniu mobilnym, **Then** kliknięcie linku próbuje otworzyć aplikację Facebook lub przeglądarkę mobilną

---

### User Story 5 - Wykres obłożenia z bieżącego dnia (Priority: P1)

Użytkownik chce zobaczyć, jak zmieniało się obłożenie basenów w ciągu dzisiejszego dnia — od rana do teraz. Poniżej kart z aktualnym obłożeniem pojawia się wykres liniowy z danymi z bieżącego dnia dla wszystkich basenów.

**Why this priority**: Kluczowy element informacyjny — użytkownik widzi trendy dnia, może ocenić najlepszą godzinę na wizytę. Było centralnym elementem poprzedniej wersji.

**Independent Test**: Wykres powinien być widoczny po załadowaniu strony, z danymi od godziny 6:00 do aktualnego momentu. Można przetestować niezależnie w dowolnym momencie dnia.

**Acceptance Scenarios**:

1. **Given** są dane z bieżącego dnia, **When** użytkownik odwiedza stronę, **Then** wyświetla się wykres liniowy pokazujący obłożenie Basenu Sportowego, Rodzinnego i Małego od godziny 6:00 do ostatniego pomiaru
2. **Given** nie ma jeszcze danych z bieżącego dnia (np. przed godziną 6:00), **Then** zamiast wykresu pojawia się czytelna informacja zastępcza
3. **Given** dane z dnia są dostępne, **Then** oś czasu wykresu pokazuje godziny w formacie HH:MM w strefie czasowej Warszawy (nie UTC)
4. **Given** użytkownik jest na urządzeniu mobilnym, **Then** wykres jest czytelny i responsywny

---

### User Story 6 - Tryb nocny (ciemny motyw) (Priority: P2)

Użytkownik korzysta ze strony wieczorem i chce przełączyć interfejs na ciemne tło, aby nie męczyć oczu. W nagłówku strony widzi przycisk/przełącznik trybu nocnego. Po kliknięciu cały interfejs zmienia się na ciemny motyw. Preferencja jest zapamiętywana przy ponownym odwiedzeniu strony.

**Why this priority**: Komfort użytkowania, szczególnie wieczorami. Był dostępny w poprzedniej wersji.

**Independent Test**: Kliknięcie przełącznika powinno natychmiast zmieniać wygląd całej strony. Preferencja powinna być zachowana po przeładowaniu strony.

**Acceptance Scenarios**:

1. **Given** strona jest w trybie jasnym (domyślnym), **When** użytkownik kliknie przełącznik trybu nocnego, **Then** tło, karty i tekst zmieniają się na ciemne kolory bez przeładowania strony
2. **Given** użytkownik przełączył na tryb nocny, **When** odświeży stronę lub wróci do niej, **Then** strona nadal wyświetla się w trybie nocnym
3. **Given** użytkownik jest w trybie nocnym, **When** kliknie przełącznik ponownie, **Then** strona wraca do trybu jasnego
4. **Given** urządzenie systemowo ustawione jest na tryb ciemny (prefers-color-scheme: dark), **Then** strona automatycznie startuje w trybie nocnym przy pierwszym odwiedzeniu

---

### User Story 7 - Poprawna godzina na statystykach historycznych (Priority: P1)

Użytkownik porównuje historyczne godziny szczytu (np. „17:00 – dużo osób w środy") z rzeczywistością. Godziny na wykresie historycznym powinny odpowiadać rzeczywistym godzinom po polsku (strefa czasowa Warszawa), a nie godzinom w UTC, co powodowało przesunięcie o +1h.

**Why this priority**: Błąd wprowadzający w błąd użytkownika — wyświetlana godzina szczytu nie zgadza się z rzeczywistą godziną. Krytyczna poprawna interpretacja danych.

**Independent Test**: Niezależny test polega na porównaniu godziny na wykresie historycznym z wiedzą o tym, kiedy faktycznie basen jest oblegany (np. środa 17:00 = popołudniowy szczyt, nie 18:00).

**Acceptance Scenarios**:

1. **Given** dane historyczne zawierają pomiary z godziny 16:00 czasu warszawskiego, **When** użytkownik wyświetla wykres historyczny, **Then** na osi X widnieje „16:00", a nie „17:00"
2. **Given** zmiana czasu letniego/zimowego, **Then** godziny na wykresie historycznym są spójne z lokalnym czasem Warszawy przez cały rok

---

### Edge Cases

- Co się dzieje, gdy serwis pogodowy nie odpowiada lub klucz API wygasł? → Karta pogody pokazuje komunikat zastępczy, reszta dashboardu działa normalnie
- Co się dzieje, gdy nie ma danych z bieżącego dnia (lodowisko zamknięte poza sezonem)? → Wykres bieżącego dnia jest zastąpiony informacją o braku danych lub licznikiem do otwarcia
- Co się dzieje, gdy użytkownik kliknie kolejno kilka ikon pływalni przed zamknięciem okna? → Każde kliknięcie otwiera odpowiednie okno (poprzednie jest zamykane lub nowe nakłada się na poprzednie)
- Co się dzieje, gdy preferencja trybu nocnego jest zapisana, ale localStorage jest niedostępny (tryb prywatny)? → Strona działa w trybie domyślnym (jasnym), bez błędu

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Każda karta pływalni MUSI zawierać klikalny element (ikonę), który otwiera okno modalne z harmonogramem godzin otwarcia na każdy dzień tygodnia dla danego obiektu
- **FR-002**: Każda karta pływalni MUSI wyświetlać adres fizyczny obiektu jako klikalny link otwierający Google Maps z lokalizacją danej pływalni w nowej karcie przeglądarki
- **FR-003**: Dashboard MUSI wyświetlać kartę informacyjną z aktualną pogodą w Białymstoku, pobieraną z serwisu OpenWeatherMap; karta musi zawierać temperaturę, opis pogody po polsku, temperaturę odczuwalną, wilgotność i ikonę pogody
- **FR-004**: W przypadku niedostępności danych pogodowych, karta pogody MUSI wyświetlać komunikat zastępczy bez naruszania działania reszty strony
- **FR-005**: Dashboard MUSI zawierać kartę z linkiem do profilu Facebook pływalni (`facebook.com/basenbialystok`), otwierającym profil w nowej karcie przeglądarki
- **FR-006**: Poniżej kart z aktualnym obłożeniem MUSI pojawić się wykres liniowy przedstawiający dane obłożenia z bieżącego dnia (Basen Sportowy, Rodzinny, Mały) od godziny 6:00 do ostatniego pomiaru, z osią czasu w strefie czasowej Warszawy
- **FR-007**: Gdy brak danych z bieżącego dnia, zamiast wykresu MUSI pojawić się informacja zastępcza (komunikat lub licznik do otwarcia sezonu)
- **FR-008**: Nagłówek strony MUSI zawierać przełącznik trybu nocnego (ciemny/jasny motyw)
- **FR-009**: Wybrany motyw (jasny/ciemny) MUSI być zapisywany lokalnie po stronie przeglądarki i automatycznie stosowany przy kolejnym odwiedzeniu strony
- **FR-010**: Przy pierwszym odwiedzeniu strony, jeśli urządzenie systemowo jest ustawione na tryb ciemny, strona MUSI automatycznie uruchomić się w trybie nocnym
- **FR-011**: Godziny wyświetlane na wykresach historycznych MUSZĄ odpowiadać strefie czasowej Warszawa (nie UTC), bez przesunięcia
- **FR-012**: Okno z godzinami otwarcia MUSI dać się zamknąć klawiszem Escape lub przyciskiem „Zamknij"

### Informacje o obiektach

Dane adresowe i godziny otwarcia obiektów (na podstawie istniejącej wersji Django):

| Obiekt | Adres | Link Google Maps |
|--------|-------|------------------|
| Basen Mały (Kameralna) | Mazowiecka 39C, 15-302 Białystok | maps.app.goo.gl/YTTwYV16m3tyxoW76 |
| Basen Sportowy | Włókiennicza 4, 15-465 Białystok | maps.app.goo.gl/KXXXf2iYu16VJgCz5 |
| Basen Rodzinny | Stroma 1A, 15-661 Białystok | maps.app.goo.gl/gpSoMPBoRtcT9dw89 |
| Lodowisko | 11 Listopada 28, 15-320 Białystok | maps.app.goo.gl/WTfr4wwKsGnKtJUQ9 |

Godziny otwarcia Basenu Sportowego, Rodzinnego i Małego: Pon–Sob 06:15–21:30, Czw 07:00–21:30; Lodowisko: Pon–Pt 17:00–18:30 i 19:00–20:30 (Pon/Czw do 21:00), Sob–Nd 11:30–21:00.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Kliknięcie ikony każdej z 4 pływalni otwiera okno modalne z pełnym harmonogramem godzin otwarcia — czas otwarcia okna poniżej 200 ms
- **SC-002**: Pod każdą z 4 kart pływalni widoczny jest adres z poprawnym linkiem do Google Maps prowadzącym do właściwej lokalizacji
- **SC-003**: Karta pogody jest widoczna na dashboardzie i wyświetla aktualne dane (temperatura, opis, wilgotność, ikona) w ciągu 3 sekund od załadowania strony
- **SC-004**: Wykres obłożenia z bieżącego dnia wyświetla dane z poprawną strefą czasową Warszawy — godziny są zgodne z faktycznym czasem lokalnym
- **SC-005**: Godziny na wykresie historycznym są przesunięte o 0h względem czasu rzeczywistego (błąd +1h jest wyeliminowany)
- **SC-006**: Przełączenie trybu nocnego zajmuje poniżej 100 ms i nie powoduje „błysku" niestylowanej zawartości
- **SC-007**: Preferencja trybu nocnego jest zachowana po zamknięciu i ponownym otwarciu przeglądarki (weryfikacja przez odświeżenie strony)
- **SC-008**: Kliknięcie karty Facebook otwiera poprawną stronę `facebook.com/basenbialystok` w nowej karcie przeglądarki
- **SC-009**: W przypadku niedostępności serwisu pogodowego reszta dashboardu działa bez błędów JavaScript widocznych dla użytkownika

## Assumptions

- Klucz API OpenWeatherMap jest już skonfigurowany w zmiennych środowiskowych backendu (`OPENWEATHER_API_KEY`) — widoczny w istniejącej implementacji Django
- Dane pogodowe są buforowane po stronie backendu, aby nie przekraczać limitów zapytań API na darmowym planie OpenWeatherMap (maksymalnie 60 zapytań/minutę)
- Endpoint pogodowy (`/api/weather/`) jest dodawany do backendu Django i zwraca dane w formacie JSON — analogicznie do istniejącego `/api/current/`
- Godziny otwarcia są statyczne i zakodowane na stałe (nie są pobierane dynamicznie z bazy danych) — odzwierciedla to poprzednią implementację
- Zdjęcia obiektów (używane w poprzedniej wersji w oknach modalnych) są dostępne jako statyczne pliki obrazów; jeśli nie są dostępne po stronie frontendowej, okno zostanie wyświetlone bez zdjęcia
- Błąd +1h w historycznych danych wynika z braku konwersji strefy czasowej UTC → Europe/Warsaw w warstwie backendu (`update_chart` view)
