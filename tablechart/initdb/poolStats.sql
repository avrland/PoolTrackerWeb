-- PostgreSQL initialization script
-- Converted from poolStats.sql (MySQL) to PostgreSQL-compatible syntax
-- Runs automatically on first container start (empty postgres_data volume)

START TRANSACTION;

-- Pool statistics table
CREATE TABLE IF NOT EXISTS "poolStats" (
    "date"   TIMESTAMP    NOT NULL,
    "sport"  INTEGER      NOT NULL,
    "family" INTEGER      NOT NULL,
    "small"  INTEGER      NOT NULL,
    "ice"    INTEGER      NOT NULL,
    "guid"   VARCHAR(36)  NOT NULL,
    CONSTRAINT poolstats_guid_unique UNIQUE ("guid")
);

-- Historical pool statistics (per weekday/time slot)
-- NOTE: PostgreSQL has no ON UPDATE CURRENT_TIMESTAMP; use a trigger if needed.
CREATE TABLE IF NOT EXISTS poolStats_history (
    guid            VARCHAR(36)  NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::varchar,
    weekday         VARCHAR(10),
    time            TIME,
    sport           INTEGER,
    family          INTEGER,
    small           INTEGER,
    ice             INTEGER,
    update_datetime TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- Pool registry
CREATE TABLE IF NOT EXISTS poolList (
    pool_id      SERIAL       PRIMARY KEY,
    pool_name    VARCHAR(100) NOT NULL,
    pool_address VARCHAR(255) NOT NULL,
    max_capacity INTEGER      NOT NULL CHECK (max_capacity > 0)
);

-- Pool timetable (opening hours per weekday)
CREATE TABLE IF NOT EXISTS poolTimetable (
    id           SERIAL      PRIMARY KEY,
    pool_id      INTEGER     NOT NULL,
    weekday      VARCHAR(20) NOT NULL,
    opening_time TIME        NOT NULL,
    closing_time TIME        NOT NULL,
    CONSTRAINT fk_pooltimetable_pool FOREIGN KEY (pool_id) REFERENCES poolList (pool_id),
    CHECK (weekday IN ('Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota', 'Niedziela')),
    CHECK (opening_time < closing_time)
);

-- Seed data for poolList
INSERT INTO poolList (pool_name, pool_address, max_capacity) VALUES
    ('Basen Olimpijski', 'ul. Sportowa 1, Warszawa',   200),
    ('Aquapark Relaks',  'ul. Wodna 15, Kraków',       150),
    ('Basen Miejski',    'ul. Rekreacyjna 8, Poznań',  100);

COMMIT;
