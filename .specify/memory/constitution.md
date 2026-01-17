<!--
=== Sync Impact Report ===
Version change: 0.0.0 → 1.0.0 (Initial constitution)
Modified principles: N/A (initial creation)
Added sections:
  - Core Principles (4 principles: Code Quality, Testing Standards, UX Consistency, Performance)
  - Technology Stack
  - Development Workflow
  - Governance
Removed sections: N/A
Templates requiring updates:
  - .specify/templates/plan-template.md ✅ (Constitution Check section compatible)
  - .specify/templates/spec-template.md ✅ (Requirements section compatible)
  - .specify/templates/tasks-template.md ✅ (Test phase structure compatible)
Follow-up TODOs: None
========================
-->

# PoolTrackerWeb Constitution

## Core Principles

### I. Code Quality

All code MUST adhere to these quality standards:

- **Django Best Practices**: Follow Django coding style, use class-based views where appropriate, leverage ORM properly (no raw SQL unless justified for performance)
- **Python Standards**: PEP 8 compliance enforced; type hints REQUIRED for all function signatures and public APIs
- **DRY Principle**: Common functionality MUST be extracted into reusable utilities in `chart_app/` or shared modules; duplication across views is prohibited
- **Separation of Concerns**: Business logic MUST NOT reside in views or templates; use service layers or model methods
- **Documentation**: All public functions, classes, and modules MUST have docstrings explaining purpose, parameters, and return values
- **Error Handling**: All database operations and external API calls (Gemini, OpenWeatherMap) MUST have explicit error handling with appropriate logging

**Rationale**: Maintainable code reduces technical debt and enables faster feature development. PoolTrackerWeb integrates multiple external services and displays real-time data—code quality ensures reliability.

### II. Testing Standards

Testing requirements for all changes:

- **Unit Tests**: All service functions and utility methods MUST have unit tests with ≥80% coverage
- **View Tests**: Django views MUST have tests verifying correct status codes, template usage, and context data
- **Integration Tests**: Features involving database queries or external APIs MUST include integration tests
- **Chart/Data Tests**: Any changes to chart data processing MUST include tests with sample data verifying correct calculations (mean occupancy, live data parsing)
- **Test Isolation**: Tests MUST NOT depend on external services; use mocks for database, Gemini API, and OpenWeatherMap API
- **Test Naming**: Test functions MUST follow pattern `test_<what>_<condition>_<expected>` (e.g., `test_live_chart_empty_data_returns_empty_response`)

**Rationale**: Automated testing catches regressions early. Pool occupancy calculations and chart rendering are critical features that users depend on for decision-making.

### III. User Experience Consistency

All user-facing changes MUST maintain consistency:

- **Bootstrap Theme**: UI components MUST use the existing NiceAdmin Bootstrap template classes; custom CSS MUST extend, not override, the theme
- **Chart Behavior**: All charts (live, stats) MUST support zoom functionality with right-click reset; chart styles MUST be consistent across views
- **Responsive Design**: All pages MUST render correctly on mobile (≥320px), tablet (≥768px), and desktop (≥1024px) viewports
- **Dashboard Indicators**: Color coding MUST follow established patterns: red for ≥80% occupancy, green for <80%; thresholds MUST be configurable
- **Loading States**: Data-fetching operations MUST show loading indicators; charts MUST display gracefully when data is unavailable
- **Error Messages**: User-facing errors MUST be actionable and friendly; technical details logged, not displayed

**Rationale**: Users rely on consistent visual cues to quickly assess pool availability. Inconsistent UX creates confusion and reduces trust in the data.

### IV. Performance Requirements

Performance standards for production deployment:

- **Page Load**: Initial page load MUST complete in <2 seconds on 3G connection; time-to-interactive <3 seconds
- **Chart Rendering**: Live chart and stats chart MUST render within 500ms after data fetch
- **Database Queries**: View functions MUST NOT execute more than 5 database queries; use `select_related()` and `prefetch_related()` to prevent N+1
- **API Response Time**: All internal API endpoints MUST respond in <200ms (p95) for cached data, <1s for fresh calculations
- **Memory**: Docker container MUST NOT exceed 512MB memory under normal load
- **Caching**: Frequently accessed data (mean occupancy calculations) MUST be cached with appropriate TTL; cache invalidation strategy MUST be documented

**Rationale**: Users check pool availability in real-time before deciding to visit. Slow performance defeats the purpose of the application.

## Technology Stack

The following technologies form the foundation of PoolTrackerWeb:

| Layer | Technology | Version Requirement |
|-------|------------|---------------------|
| Backend | Django | Latest stable (≥4.x) |
| Database | MySQL/MariaDB | Via PyMySQL driver |
| Frontend | Bootstrap (NiceAdmin) | 5.x |
| Charts | Plotly.js, ApexCharts | As bundled in static/ |
| AI/Chatbot | LangChain + Gemini API | Latest stable |
| Weather | OpenWeatherMap API | v2.5 |
| Containerization | Docker + Compose | Docker 20+ |

**Constraints**:
- Environment variables MUST be used for all secrets (DB credentials, API keys)
- Static files MUST be served via Django's staticfiles or a CDN in production
- All dependencies MUST be pinned in `requirements.txt`

## Development Workflow

### Code Review Requirements

- All changes MUST be submitted via pull request
- PRs MUST include: description of change, testing performed, screenshots for UI changes
- Constitution compliance MUST be verified before merge

### Quality Gates

1. **Pre-commit**: Linting passes (flake8/ruff), type checking passes (mypy)
2. **CI Pipeline**: All tests pass, coverage threshold met
3. **Review**: At least one approval for non-trivial changes
4. **Deploy**: Docker build succeeds, container health check passes

### Branching Strategy

- `main`: Production-ready code
- `develop`: Integration branch for features
- `feature/*`: Individual feature branches
- `fix/*`: Bug fix branches

## Governance

This constitution is the authoritative source for development standards in PoolTrackerWeb. All contributors MUST comply.

**Amendment Process**:
1. Propose changes via pull request to this file
2. Document rationale for the change
3. Obtain approval from project maintainer
4. Update version according to semantic versioning:
   - MAJOR: Principle removed or fundamentally changed
   - MINOR: New principle or section added
   - PATCH: Clarification or wording improvement

**Compliance**:
- All PRs MUST pass Constitution Check in plan phase
- Violations MUST be documented and justified if exemption is granted
- Periodic reviews (quarterly) to assess constitution relevance

**Version**: 1.0.0 | **Ratified**: 2026-01-17 | **Last Amended**: 2026-01-17
