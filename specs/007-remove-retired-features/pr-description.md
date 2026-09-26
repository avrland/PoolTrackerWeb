# Remove retired chatbot, donation features and design mockups

The repository still packaged an unused chatbot, donor/ad-free settings and design
mockups. Remove that code and its five backend dependencies while preserving the
active Polish pool interface, both themes, pool APIs, sessions and CSRF protection.

Old `/chatbot` URLs now return JSON 410 at Nginx and 404 directly through Django
or Vite. Exact/prefix rules prevent SPA fallback and handle OPTIONS and static-file
suffixes. Archive files and private environment files are excluded from the image.

## Data and release

No data-deleting migration is introduced. Existing conversation/message tables,
migration records, history files, donor files and backups remain dormant pending
a separate decision. Before replacing a real old container, preserve files from
`/app/logs/` as well as checking `/logs/` and the former configured donor path;
compare hashes and keep a private manifest outside the repository.

Deploy through the [release checklist](quickstart.md). A rollback must retain the
retirement rules in both Nginx and Django; a repair-image rehearsal passed locally.
No production deployment is included in this PR.

## Validation

- Django: 6 passing tests, including active API/session/CSRF and retired routes.
- Frontend: 55 passing tests; measured line coverage 85.29%. Seven stale baseline
  expectations were corrected without changing their components.
- Scraper: 10 passing tests, including PostgreSQL transactions; no skipped DB tests.
- Fresh-runtime and archive-packaging checks passed.
- Live HTTP matrix passed with old settings absent and with fictional values.
- Clean installation, upgrade, repeat startup and repair rollback passed with
  synthetic data; content hashes/relationships preserved and no active archive SQL.
- Build, `nginx -t`, Compose validation and diff checks passed.
- Chromium: 4/4 mobile/desktop and light/dark variants passed, including keyboard use, theme persistence and failed refresh. All four baseline variants also passed; dashboard API request sets stayed identical. See the [validation report](validation.md).

Backend image size fell by about 22%; frontend dist is byte-identical by SHA-256.
This deletion adds no executable application Python/JSX lines. Static routing
configuration is covered by live integration tests; no latency improvement is claimed.

Historical specifications, vendor assets, archive-protection references and the
narrow Vite retirement guard are intentional exceptions. Daily backup automation
and freshness limits remain separate work. See the [closed inventory](contracts/removal-inventory.md).
