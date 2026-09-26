# Data Model: Integracja Scrapper + PostgreSQL

**Phase 1 Output** | Branch: `002-scrapper-docker-integration` | Date: 2026-04-27

---

## Encje i schemat bazy danych

Baza danych PostgreSQL jest współdzielona między serwisem Django (`web`) a scraperem (`scrapper`). Schemat jest zdefiniowany w `tablechart/initdb/poolStats.sql` i inicjalizowany automatycznie przy pierwszym uruchomieniu kontenera bazy danych.

### Tabela: `poolStats`

Przechowuje każdy pomiar obłożenia stref basenowych.

| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|-------------|------|
| `guid` | `VARCHAR(36)` | `NOT NULL`, `UNIQUE` | Unikalny identyfikator pomiaru (UUID v4) |
| `date` | `TIMESTAMP` | `NOT NULL` | Czas pomiaru w polskiej strefie czasowej |
| `sport` | `INTEGER` | `NOT NULL` | Liczba osób na torze sportowym |
| `family` | `INTEGER` | `NOT NULL` | Liczba osób na torze rodzinnym |
| `small` | `INTEGER` | `NOT NULL` | Liczba osób na torze kameralnym |
| `ice` | `INTEGER` | `NOT NULL` | Liczba osób na lodowisku |

**Klucz unikalności**: `guid` (kolumna bez PRIMARY KEY w DDL, ale z UNIQUE constraint).

**Zapis przez scrapper**: Co 15 minut (`schedule.every().hour.at(":00")`, `:15`, `:30`, `:45`) scrapper wywołuje INSERT z nową wartością GUID i aktualnym znacznikiem czasu.

**Odczyt przez Django**: Aplikacja webowa korzysta z tej tabeli do generowania wykresów i statystyk. Encja jest mapowana przez model Django w `chart_app/models.py`.

---

### Tabela: `poolStats_history`

Tabela historycznych statystyk (średnie/agregaty na dzień tygodnia i porę dnia). Zarządzana wyłącznie przez aplikację Django; scrapper nie pisze do tej tabeli.

| Kolumna | Typ | Opis |
|---------|-----|------|
| `guid` | `VARCHAR(36)` | PRIMARY KEY (auto-generated UUID) |
| `weekday` | `VARCHAR(10)` | Dzień tygodnia (np. `Monday`) |
| `time` | `TIME` | Pora dnia (slot czasowy) |
| `sport` | `INTEGER` | Średnia wartość dla toru sportowego |
| `family` | `INTEGER` | Średnia wartość dla toru rodzinnego |
| `small` | `INTEGER` | Średnia wartość dla toru kameralnego |
| `ice` | `INTEGER` | Średnia wartość dla lodowiska |
| `update_datetime` | `TIMESTAMP` | Czas ostatniej aktualizacji agregatu |

---

## Przepływ danych

```
Zewnętrzne API (miejskoaktywni.pl)
         │
         │ HTTP GET /api/activities_table_items (co 15 min)
         ▼
  ┌─────────────────┐
  │    scrapper     │  ← kontener Docker (serwis: scrapper)
  │  scrapper.py    │
  │  db_handler.py  │
  └────────┬────────┘
           │ INSERT INTO "poolStats" (psycopg2)
           ▼
  ┌─────────────────┐
  │   PostgreSQL    │  ← kontener Docker (serwis: db)
  │  poolStats DB   │
  └────────┬────────┘
           │ SELECT (Django ORM)
           ▼
  ┌─────────────────┐
  │   Django web    │  ← kontener Docker (serwis: web)
  │  chart_app      │
  └─────────────────┘
```

---

## Reguły walidacji

- Scrapper generuje `uuid.uuid4()` dla każdego rekordu — duplikaty są niemożliwe przy normalnym działaniu.
- Wszystkie cztery wartości obłożenia (`sport`, `family`, `small`, `ice`) muszą być obecne; brak którejkolwiek powoduje pominięcie zapisu i log błędu.
- Znacznik czasu pochodzi z `datetime.now()` na maszynie scrapera (strefa: `Europe/Warsaw` via `TZ` env var).

---

## Stan istniejący a zmiany

| Element | Stan obecny | Po integracji |
|---------|-------------|---------------|
| Schemat tabeli `poolStats` | Istniejący (PostgreSQL) | BEZ ZMIAN |
| Adapter DB scrapera | `mysql-connector-python` | `psycopg2-binary` |
| Konfiguracja połączenia | `db_config.json` (plik) | Zmienne środowiskowe |
| Dostęp Django do tabeli | Istniejący | BEZ ZMIAN |
