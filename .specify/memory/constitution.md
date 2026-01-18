<!--
SYNC IMPACT REPORT (v1.0.0)
═══════════════════════════════════════════════════════════════════════════════
Version Change: Initial (0.0.0) → 1.0.0

Principles Defined:
  ✓ I. Code Quality First - Maintainable, documented, type-safe code
  ✓ II. Test-Driven Development - Tests before implementation, comprehensive coverage
  ✓ III. User Experience Consistency - Responsive, accessible, predictable UX
  ✓ IV. Performance & Scalability - Response time targets, optimization requirements

Sections Added:
  ✓ Core Principles (4 principles)
  ✓ Additional Standards (Security, Documentation, Deployment)
  ✓ Development Workflow (Review, Testing, CI/CD gates)
  ✓ Governance (Amendment procedure, compliance)

Templates Status:
  ✅ plan-template.md - Constitution Check section aligned
  ✅ spec-template.md - User scenarios & testing requirements aligned
  ✅ tasks-template.md - Ready for use (no updates needed)
  ℹ️  checklist-template.md - Ready for use
  ℹ️  agent-file-template.md - Ready for use

Follow-up Actions:
  • None - all templates compatible with defined principles
  • Review constitution after first feature implementation for refinements

Ratification: 2026-01-18 (Initial adoption)
═══════════════════════════════════════════════════════════════════════════════
-->

# PoolTrackerWeb Constitution

## Core Principles

### I. Code Quality First

**Code MUST be maintainable, readable, and self-documenting:**
- Type hints required for all Python functions (params + return types)
- Docstrings mandatory for all public modules, classes, and functions
- PEP 8 compliance enforced via linters
- Complex logic requires inline comments explaining "why", not "what"
- Magic numbers and strings extracted to named constants
- Functions limited to single responsibility (max 50 lines guideline)

**Rationale**: PoolTrackerWeb is a long-term project serving public users. Code quality directly impacts maintainability, onboarding new contributors, and reducing technical debt. Poor code quality in data processing or chart generation creates user-facing bugs that erode trust.

### II. Test-Driven Development

**Testing is NON-NEGOTIABLE:**
- Unit tests MUST be written before implementation (Red-Green-Refactor cycle)
- Minimum 80% code coverage for new features
- All views require integration tests with response validation
- Data processing logic requires property-based tests where applicable
- Test files mirror source structure (`chart_app/utils/ad_free.py` → `chart_app/tests/test_ad_free.py`)
- CI pipeline MUST pass before merge (all tests green, no linter errors)

**Rationale**: PoolTrackerWeb processes real-time occupancy data affecting user decisions (pool visits). Untested code risks displaying incorrect statistics, broken charts, or donor verification failures. TDD ensures features work as specified before deployment.

### III. User Experience Consistency

**User interface MUST be responsive, accessible, and predictable:**
- Mobile-first design (80%+ users on mobile per analytics)
- All interactive elements require `:hover`, `:focus`, `:active` states
- Loading states mandatory for async operations (charts, chatbot, donor verification)
- Error messages MUST be user-friendly, actionable, and localized (Polish + English)
- Color contrast ratios meet WCAG 2.1 AA minimum (4.5:1 for text)
- Charts use consistent color schemes and include legends
- No breaking UI changes without migration plan and user communication

**Rationale**: Users rely on PoolTrackerWeb for real-time pool decisions. Inconsistent UX (broken mobile layouts, unclear errors, inaccessible charts) drives users away. Accessibility ensures all users, including those with disabilities, can access pool data.

### IV. Performance & Scalability

**Application MUST meet performance targets under load:**
- Dashboard page load: < 2 seconds (p95) on 3G connection
- Live chart API response: < 500ms (p95)
- Database queries: < 100ms (p95), use indexing and query optimization
- Static assets compressed (gzip/brotli) and cached (1 year for versioned assets)
- Chart rendering: < 1 second for 1440 data points (24 hours @ 1min intervals)
- Chatbot responses: < 3 seconds (p95) including LLM latency
- Docker image size: < 500MB (optimize layers, multi-stage builds)

**Monitoring requirements:**
- Log slow queries (>100ms) with query plan
- Track API endpoint latency (p50, p95, p99)
- Monitor memory usage (alert if >80% container limit)

**Rationale**: PoolTrackerWeb serves real-time data where delays reduce usefulness. Slow dashboards lead to stale data decisions. Poor performance disproportionately affects mobile users on slower connections. Scalability ensures the app handles traffic spikes (e.g., holiday weekends).

## Additional Standards

### Security
- Environment variables for all secrets (DB credentials, API keys)
- `donors.json` file permissions: `chmod 600` (owner read/write only)
- HTTPS only in production (HSTS enabled)
- Input validation on all user-submitted data (email, chatbot queries)
- Dependency updates monthly (security patches immediately)

### Documentation
- README MUST include: setup instructions, environment variables, deployment guide
- Feature specs in `/specs/[###-feature-name]/` using Specify templates
- Inline code comments for non-obvious logic
- API contracts documented in `/specs/[feature]/contracts/`

### Deployment
- Zero-downtime deployments using Docker Compose with health checks
- Database migrations tested in staging before production
- Rollback plan required for all production deployments
- Monitoring dashboards for production metrics (uptime, latency, errors)

## Development Workflow

### Code Review Requirements
- All changes via pull requests (no direct commits to `main` or `develop`)
- At least one approval required from code owner
- PR description MUST reference issue/spec and include testing evidence
- Constitution compliance verified during review

### Testing Gates
- Local: All tests pass before pushing (`python manage.py test`)
- CI: Automated test suite + linter checks must pass
- Staging: Manual smoke testing for user-facing changes
- Production: Canary deployment for high-risk changes

### CI/CD Pipeline
- Automated linting (pylint, flake8) on every commit
- Full test suite on every PR
- Docker image build validation
- Deployment to staging on merge to `develop`
- Production deployment requires manual approval + tag

## Governance

This constitution supersedes informal practices and ad-hoc decisions. All feature development, code reviews, and architectural decisions MUST align with these principles.

**Amendment Procedure:**
1. Propose amendment with rationale (GitHub issue or discussion)
2. Document impact on existing code/templates
3. Achieve consensus from maintainers (minimum 2 approvals)
4. Update constitution with incremented version (MAJOR for backward-incompatible changes, MINOR for new principles, PATCH for clarifications)
5. Update dependent templates and documentation
6. Communicate changes to all contributors

**Compliance:**
- Code reviews MUST verify principle adherence
- Exceptions require documented justification and technical lead approval
- Technical debt explicitly tracked with remediation plan

**Version**: 1.0.0 | **Ratified**: 2026-01-18 | **Last Amended**: 2026-01-18
