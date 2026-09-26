# Data Model: zachowane archiwum i aktywne dane

**Status**: Projekt zachowania danych, bez nowych modeli i bez migracji kasujących.

## Archiwalne tabele

Nazwy wynikają z domyślnego nazewnictwa modeli istniejącego `chatbot_app`;
ich obecność w konkretnym wdrożeniu wymaga sprawdzenia.

| Encja / tabela | Istotne pola | Relacje i ograniczenia | Stan po wdrożeniu |
|---|---|---|---|
| Conversation / chatbot_app_conversation | id, session_id, created_at, updated_at | session_id unikalny | Zachowana, niezarejestrowana w aktywnym modelu |
| Message / chatbot_app_message | id, conversation_id, role, content, timestamp | FK do Conversation; dotychczasowe CASCADE przy usunięciu rozmowy | Zachowana, bez odczytu lub zapisu przez aplikację |
| Metadane Django | rekordy migracji oraz dawne content types/uprawnienia, jeśli istnieją | Materiał potrzebny do odtworzenia historii | Pozostają; bez automatycznego cleanup |

Nie zmieniać kluczy, znaczników czasu ani relacji. Nie uruchamiać operacji usuwających rozmowy,
wiadomości lub ich tabele. Usunięcie kodu aplikacji nie jest poleceniem kasowania danych.
Brak modeli nie oznacza izolacji na poziomie uprawnień DB: aplikacja nie zawiera już ścieżki
użycia tych tabel; odrębne role/eksport i fizyczna izolacja mogą być osobną decyzją.

## Pliki i stan klienta

| Zbiór | Możliwa lokalizacja | Polityka |
|---|---|---|
| Historia CSV | /app/logs/chat_history.csv, /logs/chat_history.csv lub katalog uruchomienia starego backendu | Zachować; zabezpieczyć plik spoza wolumenu przed odtworzeniem kontenera |
| Darczyńcy | dotychczasowy DONATION_LIST_PATH, domyślnie donors.json względem backendu | Zachować bez czytania przez nową aplikację; brak pliku jest poprawnym stanem |
| Dawny stan widgetu | localStorage: pooltracker_chatbot_state | Nie odczytywać i nie czyścić automatycznie; brak nowego kodu zarządzania historią klienta |
| Archiwa i backupy | prywatne miejsca opiekuna, postgres_data, logs_data, backups/ | Nie kasować ani nie zmieniać polityki retencji |

Wartości i treści prywatne nie trafiają do specyfikacji, PR ani repozytorium.
Archiwa nie mogą znajdować się w katalogach publicznych, statycznych lub w nowych obrazach.

## Stan i przejścia

1. **Przed**: kod funkcji może odczytywać i zapisywać dane.
2. **Zabezpieczone**: przed restartem sprawdzono lokalizacje; nietrwałe pliki skopiowano
   do prywatnego archiwum, porównano rozmiary i SHA-256.
3. **Wycofane**: kod i rejestracja usunięte, dawne żądania odrzucane; dane nieaktywne.
4. **Oczekiwanie na decyzję**: dane pozostają zachowane; nie ma automatycznej daty kasowania.

Jeżeli nie ma dawnych danych, pominąć kopiowanie; nie tworzyć pustych danych/plików chatbota.
Ponowne wdrożenie musi zachować ten sam stan.

## Dane aktywne i walidacja zachowania

Chronione: `poolStats`, `poolstats_history`, aktywne sesje i ustawienia motywu.
Nie zmieniać agregacji, stref czasowych, schematu basenowego ani interwałów pobierania.

Na izolowanej kopii zatrzymać zapisy, porównać przed/po:
obecność tabel, liczbę i treść syntetycznych rekordów, klucze oraz hash/rozmiar plików.
Same liczby wierszy nie dowodzą zachowania treści. Dla produkcji rejestrować tylko metadane
kontroli, bez publikowania tekstu rozmów. Nie zatrzymywać produkcyjnego scrapera w ramach
samego przygotowania dokumentacji.

## Manifest zachowania

Prywatny zapis opiekuna obejmuje: identyfikator środowiska i starego obrazu, czas kontroli,
nazwę zbioru, obecność/brak, oryginalną i docelową lokalizację, rozmiar/liczbę rekordów,
wynik porównania oraz wykonawcę. Raport w PR zawiera wyłącznie zanonimizowany wynik.
Nie dodajemy modelu, panelu ani komendy aplikacji do obsługi tego manifestu.

