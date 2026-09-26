# Implementation validation

Local validation on 2026-09-26, branch `cleanup`. No production deployment or
production data inspection. All database/file fixtures below are synthetic.

## Baseline

- Initial Git status: only untracked feature 007 documentation; existing work retained.
- Docker 29.8.0, desktop-linux; Python host 3.14.7. Backend image uses Python 3.14.2,
  Django 6.1.1 and pandas 3.0.6; frontend builder uses Node 20.20.2 / Vitest 5.0.2.
- Dedicated `retirement007` network, container names prefixed `retirement007-`,
  isolated PostgreSQL, host ports 18007/18008. Production Compose names/8008 untouched.
- Sanitized baseline build contexts contained tracked sources only; private environment,
  donor/history/password files and generated artifacts were excluded.
- Backend active-contract baseline: 4 tests passed. Existing frontend tests initially
  had 7 stale expectations (countdown wording/format and accessible names of pool links).
  Updated only those test expectations to the existing rendered interface: 53 passed.
  This is recorded separately from retirement RED; product rendering was not changed.
- Baseline production and builder images built successfully.

## Red

Before deleting source or dependencies:

- Django retirement tests failed on the registered application and live old route.
- Frontend retirement test failed because `sendChatMessage` was still exported;
  current-data credential regression passed.
- HTTP tests failed for missing 410 and old routing. The test initially used a Docker
  hostname rejected by Vite; setting the standard localhost Host isolated real failures.
  Vite's broad prefix also incorrectly consumed `/chatbot-other`, and OPTIONS returned
  middleware 204. These were implementation defects exposed by the contract tests.
- Fresh-runtime checks failed for installed retired packages and retired settings.
- Packaging check failed: synthetic donor/history and `.env example` files entered
  the old Docker build context. This check passed after ignore rules changed.
- No provider credentials or production data were used. Transport/setup failures are
  not counted as expected RED results.

## Green

| Check | Result |
| --- | --- |
| Django `manage.py test chart_app` | 6 passed; active data/session/CSRF/weather and retired routes |
| Vitest `npm run test:coverage` | 55 passed across 6 files |
| Fresh image runtime | 2 passed; no five retired distributions or four settings |
| Scraper unittest | 10 passed, including all 3 PostgreSQL transaction tests; no skips |
| HTTP contract | 60 method/path/layer cases plus 2 unrelated-SPA controls passed |
| HTTP with four fictional old settings | Same complete matrix passed |
| Archive packaging | Passed against synthetic Docker context |
| Clean database | Migrate + no retired tables + active endpoint integration passed |
| Upgrade and restart | Content checksums and migration records unchanged |
| Live PostgreSQL endpoint test | Passed; traced SQL contains no chatbot-table access |
| Repair image rollback | Migrate, archive verification and active/retired endpoint checks passed |
| Nginx | `nginx -t` passed |
| Compose | `docker compose --env-file tests/retirement/env.test config --quiet` passed |

Retired Django tests forbid external sockets and database access; live data tests
forbid external requests and trace real SQL. Test suites cover POST with no valid
CSRF token, HEAD, OPTIONS, query strings and `.js` suffixes. Nginx explicitly clears
extension MIME mappings so `/chatbot/old.js` still returns JSON. Vite preserves a
narrow development proxy and allows preflight to continue to the target response.

The fresh image's unit-test command bypasses entrypoint and reports a missing
`staticfiles` directory warning; normal startup runs collectstatic successfully.
Vite reports existing plugin deprecation and Node engine warnings; build and
coverage both succeeded without dependency upgrades. One immediate post-restart HTTP
attempt ran before Gunicorn was ready; readiness retry and restarting the dev
container sharing its network namespace resolved this test orchestration issue.

## Coverage

- Backend application: **0 new executable Python lines**; registration, settings,
  routing and dead code are removed. Added Python is verification tooling/tests.
- Browser application: **0 new executable JavaScript/JSX lines**; API/component code
  is deleted and active components are unchanged. New static Vite/Nginx configuration
  is validated by live HTTP, including negative prefix and preflight cases.
- The >=80% requirement for new feature lines therefore has no new application-line
  denominator in this deletion. Tests remain mandatory and passed.
- V8 reports **85.29% line coverage** for the instrumented frontend files (84.05%
  statements, 83.97% branches, 81.81% functions). This is not a claim that every
  legacy file or the entire backend has >=80% coverage.

## UI

Chromium 145 / Playwright 1.58.2: **4/4 variants passed** (390×900 and 1440×900,
initial light/dark). Each variant toggles the theme by keyboard and checks persistence
across reload, then exercises date selection with session headers, weekday selection,
pool details and return, weather, FAQ, true zero, missing data, initial error, and
failed periodic refresh retaining the last values with a stale indicator.

Synthetic controls: sport 12, family 4, small 1, weather 20°C; both charts rendered.
No page JavaScript errors or chatbot requests. External traffic was blocked; these
browser fixtures complement the separate integration tests against PostgreSQL.
Screenshots were inspected for mobile dark and desktop light. The initial UI test
needed a more precise selector because mobile details has two valid Close buttons;
no application change was needed. Local screenshots/results are ignored artifacts
under `.retirement-validation/`, with baseline results in its `ui-baseline/` directory.

## Archive

- Old image was migrated and seeded before removal. Hash manifest covers all columns
  of conversation/message/pool measurement/weekday aggregate rows and old migration
  records, including keys and timestamps. Upgrade, repeat startup and repair rollback
  matched it. Session uniqueness and message foreign-key relationship remain present.
- Old synthetic `/app/logs/chat_history.csv`: 101 bytes,
  SHA-256 `058a4cf4b689a4db2550fcf143b6fc117f33151eccba01a90597f1594fcf19f7`.
- Old synthetic `/app/donors.json`: 43 bytes,
  SHA-256 `c716d481e0ecd4c1701fedc5184b9612b5a804d18b2644e975502a239f528954`.
- Both were copied before old-container shutdown and size/hash verified. Old `/logs/`
  CSV was absent. New container has none of these archive files; checksums of preserved
  copies remain equal. Actual production locations/content were never inspected.
- Clean `retirement_clean` database created no chatbot tables. Test pool schema/data
  were seeded separately and active endpoints/session protection passed against it.
- No destructive migration, content-type cleanup, migration unapply, DROP, volume
  removal or archive deletion was performed. Existing data remains dormant pending
  a separate decision. No public archive API or file mount was introduced.
- Real deployment still requires a private archive/location manifest held by the
  maintainer, outside this repository and outside served directories.

## Rollback

Built `retirement007-repair` from the baseline image with updated settings/URLconf.
The old pool code remains; chatbot registration/routes and provider settings stay
removed. Ordinary migrate, the live endpoint checks and archive checks passed.
Public retirement is retained by the updated Nginx image. Do not redeploy the
unmodified baseline image as a production rollback.

## Build size and performance scope

| Artifact | Before | After |
| --- | ---: | ---: |
| Backend image (Docker reported bytes) | 821231944 | 640565971 |
| Public frontend image | 79957779 | 79957898 |
| Frontend dist (`du -sb`) | 3276104 | 3276104 |

Backend decreased by 180665973 bytes (about 22%). Frontend bundle size and every dist file SHA-256 are unchanged;
removed browser code was already unreachable. No latency improvement is claimed.
All four baseline UI variants also passed. Each before/after dashboard issued the same four API requests: current readings, available dates, weather and the selected weekday. Successful mocked API requests across each full scenario were also unchanged (21). Error retries are tested separately and are not included in that successful-response count. No query, aggregation, polling or active
API code was changed; separate performance budgets remain outside this feature.

Image IDs:

- Backend before: `sha256:0d938908aa48af060e31529a114a253331e5133be3df44d7bcf14b1c4c70f5ed`
- Backend after: `sha256:aa8f5bd11c73f23688af8b36a2b7d71c223f140914336bce0273f96db5278667`
- Frontend before: `sha256:0fdb46997ec0d28b982e618e5f3e06e38d3dff2937bc987a973a90621eb63ace`
- Frontend after: `sha256:421f6155dc99ce6e15a3787f0d23e61886d714ca47df61e46dbad233eb020f69`
- Repair: `sha256:f8ebba12b95a52e6d1b063cce15a732a4270b17b8a503003d638dbc8db5e4e8a`

## Remaining references and scope

Intentional references remain in retirement routes/tests, archive ignore rules,
release instructions and historical feature/agent records. Active agent technology
notes were corrected. Vendor donate icons and unrelated legacy assets remain.
Compose, measurement schema/logic, active theme code, historical specifications,
private environment files and backups have not been changed.

No extension hook configuration exists. Production release and daily-backup/freshness
work are not part of this local implementation.
