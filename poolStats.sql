SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Baza danych: `db_m318`
--

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `poolStats`
--

CREATE TABLE `poolStats` (
  `date` datetime NOT NULL,
  `sport` int(11) NOT NULL,
  `family` int(11) NOT NULL,
  `small` int(11) NOT NULL,
  `ice` int(11) NOT NULL,
  `guid` varchar(36) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Indeksy dla zrzutów tabel
--

--
-- Indeksy dla tabeli `poolStats`
--
ALTER TABLE `poolStats`
  ADD UNIQUE KEY `guid` (`guid`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

CREATE TABLE poolStats_history (
    guid CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()), -- Generates a unique identifier for each entry
    weekday VARCHAR(10),        -- Day of the week (e.g., "Monday", "Tuesday")
    time TIME,                  -- Time in HH:MM:SS format
    sport INT,                  -- Sport column (integer value)
    family INT,                 -- Family column (integer value)
    small INT,                  -- Small column (integer value)
    ice INT,                     -- Ice column (integer value)
    update_datetime DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP -- Track last update timestamp
);

-- Tworzenie tabeli basenów
CREATE TABLE poolList (
    pool_id INT PRIMARY KEY AUTO_INCREMENT,
    pool_name VARCHAR(100) NOT NULL,
    pool_address VARCHAR(255) NOT NULL,
    max_capacity INT NOT NULL CHECK (max_capacity > 0)
);

-- Tworzenie tabeli harmonogramu z własnym kluczem głównym
CREATE TABLE poolTimetable (
    id INT PRIMARY KEY AUTO_INCREMENT,  -- Dodany klucz główny
    pool_id INT NOT NULL,
    weekday VARCHAR(20) NOT NULL,
    opening_time TIME NOT NULL,
    closing_time TIME NOT NULL,
    FOREIGN KEY (pool_id) REFERENCES poolList(pool_id),
    CHECK (weekday IN ('Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota', 'Niedziela')),
    CHECK (opening_time < closing_time)
);

-- Przykładowe dane dla poolList
INSERT INTO poolList (pool_name, pool_address, max_capacity) VALUES
    ('Basen Olimpijski', 'ul. Sportowa 1, Warszawa', 200),
    ('Aquapark Relaks', 'ul. Wodna 15, Kraków', 150),
    ('Basen Miejski', 'ul. Rekreacyjna 8, Poznań', 100);

-- Dane dla basenu Olimpijskiego (pool_id = 1)
INSERT INTO poolTimetable (pool_id, weekday, opening_time, closing_time) VALUES
    (1, 'Poniedziałek', '06:15', '21:30'),
    (1, 'Wtorek', '06:15', '21:30'),
    (1, 'Środa', '06:15', '21:30'),
    (1, 'Czwartek', '07:00', '21:30'),
    (1, 'Piątek', '06:15', '21:30'),
    (1, 'Sobota', '06:15', '21:30'),
    (1, 'Niedziela', '06:15', '21:30');

-- Dane dla basenu Sportowa (pool_id = 2)
INSERT INTO poolTimetable (pool_id, weekday, opening_time, closing_time) VALUES
    (2, 'Poniedziałek', '06:15', '21:30'),
    (2, 'Wtorek', '06:15', '21:30'),
    (2, 'Środa', '06:15', '21:30'),
    (2, 'Czwartek', '07:00', '21:30'),
    (2, 'Piątek', '06:15', '21:30'),
    (2, 'Sobota', '06:15', '21:30'),
    (2, 'Niedziela', '06:15', '21:30');

-- Dane dla basenu Rodzinna (pool_id = 3)
INSERT INTO poolTimetable (pool_id, weekday, opening_time, closing_time) VALUES
    (3, 'Poniedziałek', '06:15', '21:30'),
    (3, 'Wtorek', '06:15', '21:30'),
    (3, 'Środa', '06:15', '21:30'),
    (3, 'Czwartek', '07:00', '21:30'),
    (3, 'Piątek', '06:15', '21:30'),
    (3, 'Sobota', '06:15', '21:30'),
    (3, 'Niedziela', '06:15', '21:30');