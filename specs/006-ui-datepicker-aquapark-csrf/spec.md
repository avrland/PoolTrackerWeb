# Feature Specification: Wykres dnia z datepickerem, poprawka kafelka Aquapark i naprawa CSRF chatbota

**Feature Branch**: `006-ui-datepicker-aquapark-csrf`  
**Created**: 2026-05-06  
**Status**: Draft  
**Input**: Wykres dnia powinien mieć datepicker z opcją powrotu do dzisiaj, poprawna legenda godzin, kafelek Aquapark z pełnymi wordingami i linkiem, naprawa CSRF chatbota.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Przeglądanie wykresu obłożenia dla wybranego dnia (Priority: P1)

Użytkownik odwiedzający serwis chce sprawdzić, jak wyglądało obłożenie basenów w konkretnym minionym dniu. Aktualnie wykres „Dzisiaj" pokazuje tylko bieżący dzień. Brakuje możliwości wybrania daty z kalendarza i powrotu do dnia dzisiejszego.

**Why this priority**: Najważniejsza funkcja biznesowa w tym zestawie zmian — umożliwia realne porównanie danych historycznych i angażuje użytkownika w eksplorację danych.

**Independent Test**: Otwórz stronę główną, wybierz datę sprzed kilku dni z datepickera — wykres powinien zaktualizować dane. Kliknij „Dzisiaj" — wykres powinien wrócić do danych z bieżącego dnia.

**Acceptance Scenarios**:

1. **Given** użytkownik jest na stronie głównej, **When** widzi wykres dnia, **Then** nad wykresem widoczna jest kontrolka kalendarza (datepicker) i przycisk „Dzisiaj".
2. **Given** użytkownik otwiera datepicker i wybiera wcześniejszą datę, **When** data zostaje potwierdzona, **Then** wykres odświeża się i pokazuje dane z wybranego dnia (tytuł wykresu zmienia się na wybraną datę w formacie czytelnym po polsku).
3. **Given** użytkownik ogląda dane z minionego dnia, **When** klika „Dzisiaj", **Then** wykres wraca do danych z dzisiaj, a przycisk „Dzisiaj" znika (jest widoczny tylko gdy wybrano inny dzień).
4. **Given** wybrany dzień nie ma żadnych danych (brak zapisów w bazie), **When** API zwraca pustą odpowiedź, **Then** wykres wyświetla komunikat „Brak danych z wybranego dnia" zamiast pustego wykresu.
5. **Given** użytkownik wybiera datę z przyszłości lub datę sprzed zakresu danych, **When** API zwraca błąd lub pustą odpowiedź, **Then** system obsługuje to gracefully z czytelnym komunikatem.

---

### User Story 2 — Czytelna legenda wykresu z godzinami (Priority: P1)

Aktualnie legenda osi X wykresu dnia pokazuje kolejne liczby porządkowe zamiast faktycznych godzin pomiaru. Użytkownik nie wie, o której godzinie były wykonane odczyty.

**Why this priority**: Brak godzin na legendzie czyni wykres praktycznie nieużytecznym do analizy rytmu dnia — należy to naprawić razem z datepickerem.

**Independent Test**: Otwórz wykres dnia — etykiety na osi poziomej oraz w tooltipie powinny pokazywać godziny w formacie HH:MM (np. „08:00", „10:30"), a nie kolejne cyfry (1, 2, 3...).

**Acceptance Scenarios**:

1. **Given** wykres dnia jest wyświetlony, **When** użytkownik patrzy na etykiety osi X, **Then** widzi godziny w formacie HH:MM odpowiadające faktycznym momentom pomiaru, a nie liczby porządkowe.
2. **Given** użytkownik najeżdża kursorem (lub dotyka na mobile) na punkt wykresu, **Then** tooltip pokazuje godzinę pomiaru w formacie HH:MM oraz liczbę osób dla każdego obiektu.

---

### User Story 3 — Kafelek Aquapark z pełnymi informacjami i licznikiem (Priority: P2)

Kafelek „Aquapark" w bieżącej wersji React pokazuje tylko liczbę dni do otwarcia bez szczegółowego licznika godzin/minut/sekund, bez tytułu „Aquapark Andersa | Grudzień 2028", bez symbolu budowy i bez linku do artykułu prasowego. Stara wersja Django miała wszystkie te elementy.

**Why this priority**: Informacja o aquaparku jest istotnym elementem kontekstowym dla użytkowników — wymagana zgodność z poprzednią wersją.

**Independent Test**: Otwórz stronę główną i znajdź kafelek z aquaparkiem — tytuł powinien brzmieć „Aquapark Andersa | Grudzień 2028", powinien być widoczny symbol budowy, licznik w formacie „Otwarcie za X dni" (klikalne hiperłącze) oraz „Y godzin, Z minut, W sekund" odliczający w czasie rzeczywistym.

**Acceptance Scenarios**:

1. **Given** użytkownik otwiera stronę główną, **When** widzi kafelek Aquapark, **Then** tytuł wyświetla się jako „Aquapark Andersa | Grudzień 2028".
2. **Given** użytkownik patrzy na kafelek, **When** go obserwuje, **Then** widzi symbol budowy (emoji 🏗️) w obszarze ikony.
3. **Given** użytkownik patrzy na kafelek, **When** go obserwuje, **Then** widzi tekst „Otwarcie za X dni" gdzie X jest wyliczane dynamicznie na podstawie daty docelowej 15 grudnia 2028, oraz oddzielny licznik „Y godzin, Z minut, W sekund" odświeżany co sekundę.
4. **Given** tekst „Otwarcie za X dni" jest widoczny, **When** użytkownik klika na niego, **Then** otwiera się nowa karta przeglądarki z adresem `https://www.lech.net.pl/pl/aktualnosci/bedziemy-budowac-aquapark-w-bialymstoku-.html`.
5. **Given** licznik godzin/minut/sekund jest widoczny, **When** użytkownik klika na niego, **Then** otwiera się nowa karta z tym samym adresem.
6. **Given** data docelowa (15 grudnia 2028) już minęła, **When** użytkownik patrzy na kafelek, **Then** zamiast licznika wyświetla się komunikat „Aquapark jest już otwarty! 🎉".

---

### User Story 4 — Chatbot działa bez błędu CSRF (Priority: P3)

Chatbot na stronie `https://basen.bialystok.pl` zwraca błąd „CSRF verification failed. Request aborted." przy próbie wysłania wiadomości. Użytkownik nie może skorzystać z chatbota mimo że witryna jest załadowana i sesja aktywna.

**Why this priority**: Błąd blokuje funkcję pomocniczą, ale nie wpływa na główną wartość serwisu (dane o obłożeniu).

**Independent Test**: Otwórz stronę główną, następnie otwórz panel chatbota i wyślij dowolną wiadomość — odpowiedź powinna pojawić się bez błędu CSRF, bez konieczności wcześniejszego odwiedzania żadnej strony Django z formularzem.

**Acceptance Scenarios**:

1. **Given** użytkownik po raz pierwszy odwiedza stronę główną (tylko jedna sesja), **When** otwiera chatbot i wysyła wiadomość, **Then** chatbot odpowiada prawidłowo (brak błędu CSRF, brak statusu 403).
2. **Given** pierwsza odpowiedź API `/api/current/` została odebrana przez przeglądarkę, **When** użytkownik wysyła POST do `/chatbot/api/chat/`, **Then** serwer odbiera prawidłowy token CSRF i przetwarza żądanie.
3. **Given** użytkownik odświeżył stronę, **When** ponownie wysyła wiadomość do chatbota, **Then** token CSRF jest aktualny i żądanie przechodzi bez błędu.

---

### Edge Cases

- Co jeśli użytkownik wybierze datę sprzed pierwszego rekordu w bazie? → komunikat „Brak danych z wybranego dnia", bez awarii aplikacji.
- Co jeśli użytkownik wybierze dzisiejszą datę ręcznie z datepickera? → wykres zachowuje się identycznie jak domyślny tryb „Dzisiaj", przycisk „Dzisiaj" nie pojawia się.
- Co jeśli data docelowa Aquaparku zostanie zmieniona? → wartość powinna być zdefiniowana w jednym miejscu (stała), a nie powielana.
- Co jeśli ciasteczko CSRF wygasło w trakcie sesji? → kolejne żądanie GET do `/api/current/` odświeży ciasteczko i następna wiadomość chatbota przejdzie poprawnie.
- Co jeśli API dla wybranej daty zwraca dane częściowe (np. tylko godziny poranne)? → wykres renderuje dostępne punkty bez błędu.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Komponent wykresu dnia MUSI zawierać kontrolkę wyboru daty (natywny `<input type="date">`), domyślnie ustawioną na dzisiejszą datę.
- **FR-002**: Komponent wykresu dnia MUSI zawierać przycisk „Dzisiaj", widoczny tylko gdy wybrana jest data inna niż bieżąca; kliknięcie resetuje widok do danych z dzisiaj.
- **FR-003**: Po wyborze daty z datepickera system MUSI pobrać dane z endpointu obsługującego dane historyczne (`/get_date_data/`) i zaktualizować wykres.
- **FR-004**: Tytuł nad wykresem MUSI wyświetlać „Dzisiaj" dla bieżącej daty oraz sformatowaną datę po polsku (np. „Wtorek, 5 maja 2026") dla dat historycznych.
- **FR-005**: Etykiety osi X wykresu MUSZĄ wyświetlać godziny w formacie HH:MM wyodrębnione ze znaczników czasu zwróconych przez API.
- **FR-006**: Tooltip wykresu MUSI wyświetlać godzinę pomiaru w formacie HH:MM dla każdego punktu danych.
- **FR-007**: Gdy API zwróci pustą lub brakującą odpowiedź dla wybranej daty, komponent MUSI wyświetlić komunikat „Brak danych z wybranego dnia" zamiast pustego lub błędnego wykresu.
- **FR-008**: Kafelek Aquapark MUSI wyświetlać tytuł „Aquapark Andersa | Grudzień 2028".
- **FR-009**: Kafelek Aquapark MUSI zawierać symbol budowy (emoji 🏗️).
- **FR-010**: Kafelek Aquapark MUSI wyświetlać dynamicznie obliczaną liczbę dni do 15 grudnia 2028, aktualizowaną co sekundę, w formacie „Otwarcie za X dni".
- **FR-011**: Kafelek Aquapark MUSI wyświetlać osobny licznik godzin, minut i sekund aktualizowany co sekundę.
- **FR-012**: Tekst „Otwarcie za X dni" MUSI być klikalnym hiperłączem otwierającym w nowej karcie adres `https://www.lech.net.pl/pl/aktualnosci/bedziemy-budowac-aquapark-w-bialymstoku-.html` z atrybutem `rel="noopener noreferrer"`.
- **FR-013**: Licznik godzin/minut/sekund MUSI być klikalnym hiperłączem do tego samego adresu.
- **FR-014**: Gdy data 15 grudnia 2028 minie, kafelek MUSI wyświetlić komunikat „Aquapark jest już otwarty! 🎉" zamiast licznika.
- **FR-015**: Widok backendu obsługujący endpoint `/api/current/` MUSI wymuszać ustawienie ciasteczka CSRF w odpowiedzi HTTP, tak aby pierwsza wizyta na stronie wystarczyła do autoryzowania kolejnych żądań POST chatbota.

### Key Entities

- **Dane wykresu dnia**: Zestaw pomiarów powiązanych z konkretną datą (znacznik czasu, sport, rodzinna, kameralna). Źródło: API danych bieżących lub historycznych według daty.
- **Licznik Aquaparku**: Wyliczana różnica między aktualną chwilą a 15 grudnia 2028, prezentowana jako dni + godziny/minuty/sekundy. Obliczana wyłącznie po stronie klienta, nie pochodzi z API.
- **Token CSRF**: Ciasteczko ustawiane przez serwer; musi być dostępne po pierwszym załadowaniu strony, przed jakimkolwiek żądaniem POST.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Użytkownik może wybrać dowolną datę z przeszłości z datepickera i zobaczyć zaktualizowany wykres w ciągu 2 sekund od wyboru (przy typowej przepustowości sieci).
- **SC-002**: 100% etykiet na osi X wykresu dnia wyświetla godziny HH:MM zamiast liczb porządkowych — weryfikowalne wizualnie i przez testy automatyczne.
- **SC-003**: Kafelek Aquapark wyświetla poprawny tytuł, symbol budowy, licznik dni i licznik HH:MM:SS odświeżany co sekundę — weryfikowalne po załadowaniu strony i odczekaniu kilku sekund.
- **SC-004**: Wysłanie pierwszej wiadomości do chatbota zaraz po załadowaniu strony kończy się odpowiedzią bota (status 200), a nie błędem autoryzacji (status 403) — weryfikowalne w narzędziach deweloperskich przeglądarki.
- **SC-005**: Przycisk „Dzisiaj" pojawia się wyłącznie gdy wybrana data jest różna od bieżącej — weryfikowalne ręcznie i przez testy automatyczne.

---

## Assumptions

- Data docelowa Aquaparku: **15 grudnia 2028** (`2028-12-15T00:00:00` czas lokalny) — tak jak w starym frontendzie Django.
- Endpoint `/get_date_data/` jest już zaimplementowany w backendie i zwraca dane w tym samym schemacie co endpoint bieżący.
- Problem CSRF wynika z tego, że Django nie ustawia ciasteczka CSRF automatycznie na widokach JSON API — rozwiązanie wymaga wymuszenia ustawienia ciasteczka na endpointach GET.
- Nie są dodawane nowe zależności npm — datepicker oparty o natywny element HTML5, licznik na mechanizm cyklicznego odświeżania po stronie klienta.
- Hiperłącze Aquaparku otwiera się w nowej karcie z odpowiednimi atrybutami bezpieczeństwa.

### Functional Requirements

- **FR-001**: Komponent wykresu dnia MUSI zawierać kontrolkę wyboru daty (natywny input kalendarza), domyślnie ustawioną na dzisiejszą datę.
- **FR-002**: Komponent wykresu dnia MUSI zawierać przycisk „Dzisiaj", widoczny tylko gdy wybrana jest data inna niż bieżąca; kliknięcie resetuje widok do danych z dzisiaj.
- **FR-003**: Po wyborze daty z datepickera system MUSI pobrać dane z endpointu obsługującego dane historyczne i zaktualizować wykres.
- **FR-004**: Tytuł nad wykresem MUSI wyświetlać „Dzisiaj" dla bieżącej daty oraz sformatowaną datę po polsku dla dat historycznych.
- **FR-005**: Etykiety osi X wykresu MUSZĄ wyświetlać godziny w formacie HH:MM wyodrębnione ze znaczników czasu zwróconych przez API.
- **FR-006**: Tooltip wykresu MUSI wyświetlać godzinę pomiaru w formacie HH:MM dla każdego punktu danych.
- **FR-007**: Gdy API zwróci pustą odpowiedź dla wybranej daty, komponent MUSI wyświetlić komunikat „Brak danych z wybranego dnia".
- **FR-008**: Kafelek Aquapark MUSI wyświetlać tytuł „Aquapark Andersa | Grudzień 2028".
- **FR-009**: Kafelek Aquapark MUSI zawierać symbol budowy (emoji 🏗️).
- **FR-010**: Kafelek Aquapark MUSI wyświetlać dynamicznie obliczaną liczbę dni do 15 grudnia 2028 w formacie „Otwarcie za X dni", aktualizowaną co sekundę.
- **FR-011**: Kafelek Aquapark MUSI wyświetlać osobny licznik godzin, minut i sekund aktualizowany co sekundę.
- **FR-012**: Tekst „Otwarcie za X dni" MUSI być klikalnym hiperłączem otwierającym w nowej karcie adres `https://www.lech.net.pl/pl/aktualnosci/bedziemy-budowac-aquapark-w-bialymstoku-.html` z atrybutami bezpieczeństwa.
- **FR-013**: Licznik godzin/minut/sekund MUSI być klikalnym hiperłączem do tego samego adresu.
- **FR-014**: Gdy data 15 grudnia 2028 minie, kafelek MUSI wyświetlić komunikat „Aquapark jest już otwarty! 🎉" zamiast licznika.
- **FR-015**: Serwer MUSI gwarantować, że ciasteczko CSRF jest ustawiane w odpowiedzi na pierwsze żądanie GET do strony głównej, tak aby kolejne żądania POST chatbota mogły je wykorzystać.

### Key Entities

- **Dane wykresu dnia**: Zestaw pomiarów powiązanych z konkretną datą (znacznik czasu, sport, rodzinna, kameralna). Źródło: endpoint danych bieżących lub historycznych.
- **Licznik Aquaparku**: Wyliczana różnica między aktualną chwilą a 15 grudnia 2028, prezentowana jako dni oraz godziny/minuty/sekundy. Obliczana wyłącznie po stronie klienta.
- **Token CSRF**: Ciasteczko ustawiane przez serwer przy pierwszym załadowaniu; musi być dostępne przed jakimkolwiek żądaniem POST.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Użytkownik może wybrać datę z przeszłości z datepickera i zobaczyć zaktualizowany wykres w ciągu 2 sekund od wyboru.
- **SC-002**: 100% etykiet na osi X wykresu dnia wyświetla godziny HH:MM zamiast liczb porządkowych — weryfikowalne wizualnie i przez testy automatyczne.
- **SC-003**: Kafelek Aquapark wyświetla poprawny tytuł, symbol budowy, licznik dni i licznik HH:MM:SS odświeżany co sekundę — weryfikowalne po załadowaniu strony.
- **SC-004**: Wysłanie pierwszej wiadomości do chatbota zaraz po załadowaniu strony kończy się odpowiedzią bota (status 200), a nie błędem autoryzacji (status 403).
- **SC-005**: Przycisk „Dzisiaj" pojawia się wyłącznie gdy wybrana data jest różna od bieżącej.

---

## Assumptions

- Data docelowa Aquaparku: **15 grudnia 2028** — tak jak w starym frontendzie Django.
- Endpoint obsługujący dane dla konkretnej daty jest już zaimplementowany w backendie i zwraca dane w tym samym schemacie co endpoint bieżący.
- Problem CSRF wynika z tego, że Django nie ustawia ciasteczka CSRF automatycznie na widokach JSON API — rozwiązanie wymaga wymuszenia ustawienia ciasteczka przy pierwszym żądaniu GET.
- Nie są dodawane nowe zewnętrzne biblioteki — datepicker oparty o natywny element kalendarza przeglądarki, licznik na mechanizm cyklicznego odświeżania po stronie klienta.
- Hiperłącza Aquaparku otwierają się w nowej karcie z odpowiednimi atrybutami bezpieczeństwa (brak dostępu do kontekstu otwierającej strony).
