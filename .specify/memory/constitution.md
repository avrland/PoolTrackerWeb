<!--
Temporary amendment review notes; remove this comment before committing the constitution.
Version change: 1.0.0 -> 2.0.0.
Reason: rewrite for the current architecture and a sole-maintainer workflow; replace
multi-person approvals and zero-downtime deployment obligations.
Modified principles:
- I. Code Quality First -> I. Maintainable Architecture and Code.
- II. Test-Driven Development -> II. Test-Driven Development and Measured Coverage.
- III. User Experience Consistency -> III. Polish, Accessible, Consistent User Experience.
- IV. Performance & Scalability -> IV. Measured Performance.
Added principle: V. Trustworthy Data and Recoverability.
Added subsections: Current Product and Architecture; Known Gaps and Planned Removal.
Removed requirements: English UI, chatbot service targets, donor-specific file rules,
two-maintainer consensus, mandatory staging/canary, zero-downtime releases and universal
performance limits without feature-specific measurement conditions.
Templates: unchanged; plan-template reads constitution gates at runtime.
tasks-template calls tests optional; this constitution overrides that wording, so feature
specifications and generated tasks MUST explicitly include TDD and coverage work.
Deferred implementation: remove rework/ and darkmode/; remove chatbot, donations and ad-free
functionality; configure daily backups and verify recovery; specify a freshness threshold.
No unresolved placeholder tokens. Known implementation gaps are documented below.
-->

# PoolTrackerWeb Constitution

## Core Principles

### I. Maintainable Architecture and Code

- The application MUST retain clear responsibilities: React renders the interface, Django
  serves the API, the scraper collects and aggregates readings, and PostgreSQL stores data.
  Changes to this architecture MUST be justified in a feature plan.
- The frontend MUST use the existing JavaScript/JSX stack unless a separate architectural
  decision authorizes a migration. TypeScript is not a prerequisite for new features.
- Python functions MUST have parameter and return type hints. Public Python interfaces MUST
  have docstrings; public JavaScript interfaces with non-obvious data contracts MUST document
  their inputs, outputs and failure behavior.
- Code MUST follow the surrounding conventions and Python PEP 8, separate responsibilities,
  name domain constants, and explain non-obvious decisions. Shared data fetching and design
  tokens MUST be reused instead of duplicated.
- API and database contract changes MUST document their effect on the frontend, backend,
  scraper and persisted data. Schema or timestamp changes MUST include a migration and
  rollback strategy.

Rationale: this project is maintained by one person; explicit boundaries and contracts reduce
the effort required to change it safely.

### II. Test-Driven Development and Measured Coverage

- New executable behavior and bug fixes MUST follow Red-Green-Refactor: first add a test,
  demonstrate the intended failure, implement the change, then refactor with passing tests.
- Every new feature MUST reach at least 80% executable-line coverage for its new production
  code. This is a line-coverage requirement, not a branch-coverage requirement.
- A feature spanning multiple runtimes MUST report coverage separately for each affected
  runtime. Reports MUST identify the included source files or new executable lines.
  Generated assets and vendored code may be excluded; new business logic MUST NOT be excluded
  to meet the threshold.
- Tests MUST cover observable behavior and relevant failure cases. Changes to aggregation,
  atomic history replacement, API responses, session checks or CSRF MUST include regression
  tests at the appropriate integration boundary.
- React tests MUST use the existing Vitest and React Testing Library setup. Backend tests
  MUST run with Django's test framework; scraper tests MUST use its unittest suite, including
  PostgreSQL integration checks when database behavior changes.
- Test skips, unavailable dependencies and missing coverage reports MUST be reported explicitly.
  A placeholder test module or a planned test is not evidence that a gate passed.
- Documentation-only changes MUST be checked for consistency and validity; they do not require
  artificial executable tests or a coverage percentage.

Rationale: incorrect occupancy data can mislead users. Coverage provides a measurable minimum,
while behavior and integration tests protect the data path.

### III. Polish, Accessible, Consistent User Experience

- User-facing content, loading states and error messages MUST be in Polish. English interface
  translations are not required. This constitution is maintained in English.
- Active views MUST work on mobile and desktop, in light and dark themes, and with keyboard
  navigation. Interactive elements MUST have accessible names and visible focus states.
- Changes to the interface MUST meet the retained WCAG 2.1 AA accessibility target. Color MUST
  NOT be the only way to convey occupancy or status; charts MUST provide understandable labels,
  legends and access to their essential information.
- Asynchronous views MUST distinguish loading, unavailable data, failed refreshes and successful
  responses. Errors MUST explain the situation and provide an available recovery action.
- Shared chart colors, typography, spacing and theme behavior MUST use the active design system.
  Significant changes to navigation or interpretation of data MUST be documented in the PR and
  checked through the affected user journeys.

Rationale: the same occupancy information must remain usable across devices, themes and input
methods.

### IV. Measured Performance

- Changes that materially affect page loading, API latency, database work or chart rendering
  MUST include measurements before and after the change, or a documented baseline for a new path.
- The feature specification MUST define applicable performance budgets, measurement conditions,
  representative data volumes and acceptance criteria before implementation.
- A PR MUST record the measured results and explain regressions against those budgets.
  Unsupported assumptions MUST NOT be reported as successful performance checks.
- The frontend MUST reuse shared queries, avoid unnecessary polling and repeated work, and use
  production builds. Static delivery MUST retain compression and appropriate cache policies;
  long-lived immutable caching is appropriate only for content-versioned assets.
- Charts and optional information MUST NOT unnecessarily block the core occupancy view.
  Performance changes MUST preserve correctness, accessibility and intelligible loading states.
- This version replaces the previous universal latency, chart-size and image-size limits with
  feature-specific budgets. It does not assert that the old limits have been met.

Rationale: useful performance requirements need reproducible measurements matched to the actual
application and deployment conditions.

### V. Trustworthy Data and Recoverability

- Missing readings and failed requests MUST NOT be represented as measured zero occupancy.
  A last known value MUST retain its measurement time and MUST NOT be presented as a new reading.
- The freshness policy MUST use the measurement timestamp, not merely the success of an HTTP
  request. Its exact age threshold and behavior outside operating hours MUST be defined in a
  separate feature specification before the policy is implemented.
- User-facing dates, days and opening-hour calculations MUST use Europe/Warsaw consistently.
  API and storage contracts MUST document timestamp interpretation; changing existing timestamp
  storage requires an explicit migration.
- Raw readings MUST be preserved when computing derived statistics. Replacement of derived
  history MUST be atomic: failures preserve the previous snapshot, while a successful refresh
  with no usable readings produces an empty snapshot.
- Database backups MUST run at least daily. Recovery MUST restore the application and its
  available backed-up data within 24 hours after the maintainer starts the repair.
  This is not a promise to detect an incident or start repair within 24 hours.
- Backup completion and restore usability MUST be verified and recorded. Changes to backup,
  schema or restore procedures MUST include a restore check against a separate database.
  A rollback MUST NOT discard production data without the maintainer's explicit decision.

Rationale: honest presentation, transactional updates and usable backups protect the project's
core asset: its occupancy history.

## Additional Standards

### Current Product and Architecture

The supported product is the Polish occupancy dashboard for Bialystok facilities, including
current readings, day-specific charts, weekday averages, facility details and supporting
information displayed by the current frontend.

The current repository baseline is:

| Area | Implementation |
|------|----------------|
| Frontend | React, JavaScript/JSX, Vite, TanStack Query, ApexCharts, Tailwind and shared themes |
| API | Django and Gunicorn under `tablechart/` |
| Collection and aggregation | Python service under `scrapper/` |
| Persistence | PostgreSQL; raw readings and derived history |
| Runtime | Docker Compose services: `frontend`, `web`, `db`, `scrapper`, `backup` |
| Public entry point | Nginx serves the SPA and proxies requests to Django |

Dependencies and runtime versions MUST be taken from current manifests, lockfiles and Dockerfiles.
Historical plans MUST NOT override the actual runtime configuration without a deliberate change.

Collection every 15 minutes and averages over 14 days describe current behavior. Their exact
values belong in feature specifications and configuration, rather than immutable principles.

Chatbot, donations and ad-free functionality are unsupported and designated for removal.
They MUST NOT receive new features or new product commitments. Remaining routes, dependencies,
credentials and stored data MUST be accounted for during removal; unsupported code MUST NOT
be assumed to be disabled merely because it is absent from the UI.

The `rework/` and `darkmode/` design-material directories are designated for removal.
Removing `darkmode/` MUST preserve the supported light/dark theme implementation in `frontend/`.
Legacy Django presentation templates are not the basis for new user-facing functionality.

### Security

- Secrets MUST be supplied through environment configuration and MUST NOT be committed or
  exposed in frontend bundles, API responses or logs.
- Production MUST use HTTPS with secure session cookies and the existing HSTS policy.
  Proxy and development settings MUST be documented separately.
- APIs MUST validate user input and preserve session and CSRF protections where applicable.
  Changes to cookie or proxy handling MUST test the affected protection.
- Dependency security fixes MUST be prioritized; dependency health MUST be reviewed monthly.
- Retired features MUST NOT justify new collection of user information. Their removal plan MUST
  identify existing stored data and determine its disposition before deleting or retaining it.

### Documentation

- The README MUST describe the actual stack, local setup, configuration and deployment/recovery
  commands. A PR changing these behaviors MUST update the affected instructions.
- Feature specifications, plans, tasks and API contracts MUST live under `specs/`.
- Requirements MUST be distinguished from verified capabilities. Compliance claims MUST cite
  concrete evidence or record the gap and required follow-up.
- Each feature specification and task list MUST include the mandatory TDD and coverage work,
  even when a generic template describes tests as optional.

### Known Gaps and Planned Removal

The repository review for this amendment found the following gaps. Listing them does not
claim that remediation has been implemented:

- No CI workflow is present on the reviewed branch, and the maintainer has no current CI,
  staging environment or monitoring setup. Local verification is the current merge gate.
- The Django test modules are placeholders. Existing frontend and scraper tests do not by
  themselves establish 80% coverage for all new features; coverage evidence must be produced.
- Docker Compose currently defaults to weekly backups. Daily backup configuration and a
  demonstrated restore within the adopted recovery window remain implementation work.
- Current freshness status detects failed refreshes, but does not enforce a measurement-age
  threshold. That policy requires its own specification and implementation.
- Chatbot code and routes remain present. Chatbot, donation and ad-free remnants, plus
  `rework/` and `darkmode/`, require a separate removal change.
- The README and historical feature plans contain outdated architectural descriptions or
  unverified compliance claims. They must be reconciled when the corresponding area changes.

## Development Workflow

### Pull Requests and Verification

- Changes MUST be developed on a branch and merged through a PR. Direct development commits
  to `main` or `develop` are not permitted.
- The sole maintainer MAY review and merge their own PR. Approval by a second person or a
  platform-enforced self-approval is not required.
- The PR MUST describe the behavior change, reference the applicable specification or issue,
  and record test commands, results, coverage scope and material limitations.
- Before merge, relevant tests and builds MUST pass locally. Frontend changes require Vitest
  checks and a production build; backend changes require relevant Django tests; scraper
  changes require its tests. Container changes require the affected build/configuration checks.
- Applicable configured linters MUST pass. The constitution does not claim that absent lint
  tooling or CI already runs.
- UI changes MUST include a smoke check of the affected flow on mobile and desktop, in both
  themes and with keyboard navigation. Automated tests do not replace this inspection.
- If CI is introduced, its required checks MUST pass before merge. Until then, reproducible
  local results in the PR provide the verification evidence.

### Deployment and Recovery

- The maintainer controls production releases. Each release MUST identify the deployed commit,
  verification evidence and a rollback procedure.
- A short deployment interruption is acceptable. Zero-downtime, canary deployment and a
  permanent staging environment are not mandatory.
- Database changes MUST be checked against a separate test database or restored copy before
  production execution. Destructive changes require a verified backup and a recovery plan.
- After deployment, the maintainer MUST check the frontend, API, database connectivity and
  collection path. Failed checks MUST lead to repair or execution of the rollback plan.
- Recovery documentation MUST identify backup location, restoration commands and how to verify
  usable application data after restoration.

### Adoption and Existing Code

- This policy applies to new work from this amendment onward. It does not require an immediate
  rewrite of all existing code.
- When existing code is modified, the changed behavior MUST follow TDD and the affected code
  MUST be brought into compliance with the applicable quality rules. Unrelated legacy code
  need not be rewritten in the same PR.
- The 80% line-coverage gate applies to new feature code, not to the entire historical codebase.
  Bug fixes still require a failing regression test before the fix.
- Existing gaps MUST remain explicit in plans and PRs affecting the relevant area. Work MUST
  NOT introduce new reliance on retired features or claim a known gap has been resolved without
  verification.
- Daily backups, recovery validation and feature removal remain separate implementation work;
  this document changes their required policy, not the running application.

## Governance

This constitution is the governing policy for feature planning, implementation and review.
Explicit maintainer decisions may amend it; implicit habits and generic template defaults
do not override it.

The sole maintainer authorizes amendments through the project PR workflow. Each amendment MUST
state its rationale, changed obligations, effects on existing work and required follow-up.
No second-maintainer consensus or separate issue is required when the PR records that information.

Versions follow semantic versioning: MAJOR for removing or redefining obligations incompatibly,
MINOR for additional principles or materially expanded guidance, and PATCH for non-semantic
clarifications. The original ratification date MUST be preserved; an amendment updates the
version and last-amended date.

Feature plans and PR reviews MUST check the applicable principles. A gate may be marked passed
only with evidence; planned work, unavailable tooling and skipped checks MUST remain visible.
Exceptions require a written reason, scope, remediation action and the sole maintainer's decision
in the relevant PR or specification.

Dependent templates read this policy at runtime. Template sources are not edited as part of
a constitution amendment. Identified conflicts and separate implementation requests MUST be
reported as follow-up work.

**Version**: 2.0.0 | **Ratified**: 2026-01-18 | **Last Amended**: 2026-09-26
