# Tasks: Google Ads with Donor-Based Ad Removal

**Input**: Design documents from `/specs/001-google-ads-donor-removal/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: Not explicitly requested in spec - focus on implementation first, add tests if needed later

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Django web application structure:
- Backend: `tablechart/chart_app/` (views, URLs, utils)
- Templates: `tablechart/templates/`
- Static: `tablechart/static/assets/`
- Config: `tablechart/tablechart/settings.py`
- Root: `.env`, `donors.json`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic file structure

- [X] T001 Create example donation list file `donors.example.json` at project root with sample structure
- [X] T002 [P] Add `donors.json` to `.gitignore` to prevent committing real donor emails
- [X] T003 [P] Create utility directory `tablechart/chart_app/utils/` if it doesn't exist
- [X] T004 Update `.env` file with `DONATION_LIST_PATH=donors.json`, `GODMODE_EMAIL=test@pooltrackerdev.local`, `BUYCOFFEE_URL=https://buycoffee.to/pooltracker`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core utilities and configuration that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T005 Update `tablechart/tablechart/settings.py` to load `DONATION_LIST_PATH`, `GODMODE_EMAIL`, `BUYCOFFEE_URL` from environment variables
- [X] T006 [P] Create `tablechart/chart_app/utils/__init__.py` (empty file for Python package)
- [X] T007 Implement donor list reader in `tablechart/chart_app/utils/ad_free.py` with functions: `load_donor_list(file_mtime)` (cached with lru_cache), `get_donor_list()` (with mtime-based cache invalidation)
- [X] T008 Implement email validator in `tablechart/chart_app/utils/ad_free.py`: `validate_email(email)` function with regex validation and lowercase normalization
- [X] T009 Implement email verification logic in `tablechart/chart_app/utils/ad_free.py`: `verify_donor_email(email)` function that checks against donor list and godmode email
- [X] T010 [P] Add logging configuration for donor verification events in `tablechart/chart_app/utils/ad_free.py`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - View Site with Ads (Priority: P1) 🎯 MVP

**Goal**: Regular users see Google AdSense ads in designated locations without disrupting pool occupancy functionality

**Independent Test**: Visit site as new user, verify ads appear in appropriate locations without breaking layout or performance

### Implementation for User Story 1

- [X] T011 [P] [US1] Modify `tablechart/templates/index.html` to add conditional AdSense script: wrap existing script tag with `{% if not request.COOKIES.ad_free_session %}` block
- [X] T012 [P] [US1] Verify Google AdSense auto ad placement is enabled in AdSense account (ad placement handled automatically by AdSense script, no manual placement needed)
- [ ] T013 [US1] Test ad display on desktop: verify AdSense script loads, ads render automatically, no layout breakage
- [ ] T014 [US1] Test ad display on mobile: verify responsive ads display correctly on ≥320px viewport
- [ ] T015 [US1] Test navigation: verify ads persist across pages (dashboard, live chart, stats)
- [ ] T016 [US1] Performance validation: measure page load time with ads (<2s target per constitution)

**Checkpoint**: At this point, User Story 1 should be fully functional - ads display for all users

---

## Phase 4: User Story 2 - Remove Ads via Email Verification (Priority: P2)

**Goal**: Donors can verify email and receive ad-free access for 365 days

**Independent Test**: Click "Remove Ads" button, enter donor email, verify ads disappear and cookie set for 365 days

### Implementation for User Story 2

- [X] T017 [P] [US2] Create email verification modal template `tablechart/templates/partials/donor_modal.html` with Bootstrap 5 modal structure, email input field with HTML5 validation, submit button
- [X] T018 [P] [US2] Create "Remove Ads" button in `tablechart/templates/dashboard.html` with conditional display: `{% if not request.COOKIES.ad_free_session %}` shows button, else shows ad-free indicator
- [X] T019 [US2] Create Django view `VerifyDonorEmailView` in `tablechart/chart_app/views.py`: POST endpoint that accepts JSON with email field
- [X] T020 [US2] Implement verification logic in `VerifyDonorEmailView`: validate email format, check donor list, set cookie if found, return appropriate JSON response (200 success, 404 not found, 400 invalid)
- [X] T021 [US2] Add cookie setting logic in `VerifyDonorEmailView`: `response.set_cookie('ad_free_session', email, max_age=31536000, httponly=True, secure=True, samesite='Lax')`
- [X] T022 [US2] Add URL route in `tablechart/chart_app/urls.py`: `path('api/verify-donor-email/', VerifyDonorEmailView.as_view(), name='verify_donor_email')`
- [X] T023 [P] [US2] Create JavaScript file `tablechart/static/assets/js/donor-verification.js` for modal interaction: form submission via fetch API, CSRF token handling, success/error message display
- [X] T024 [US2] Include modal template in `tablechart/templates/content.html` or `index.html`: `{% include 'partials/donor_modal.html' %}`
- [X] T025 [US2] Link JavaScript file in `tablechart/templates/index.html`: `<script src="{% static 'assets/js/donor-verification.js' %}"></script>`
- [X] T026 [US2] Add error handling in `VerifyDonorEmailView` for missing donor file: log error, return 500 with generic message
- [ ] T027 [US2] Test valid donor email: submit email from donor list, verify 200 response, cookie set, ads hidden on reload
- [ ] T028 [US2] Test unknown email: submit email not in list, verify 404 response with buycoffee.to link
- [ ] T029 [US2] Test godmode email: submit test email, verify always grants access
- [ ] T030 [US2] Test invalid email format: submit malformed email, verify 400 response
- [ ] T031 [US2] Test case insensitivity: submit uppercase email, verify matches lowercase in donor list
- [ ] T032 [US2] Performance validation: measure email verification response time (<200ms target)

**Checkpoint**: At this point, User Story 2 should be fully functional - donors can verify email and remove ads

---

## Phase 5: User Story 3 - Ad-Free Status Management (Priority: P3)

**Goal**: Users with ad-free access can view status and log out to restore ads

**Independent Test**: Verify ad-free cookie, see status indicator in header, click logout, confirm ads reappear

### Implementation for User Story 3

- [X] T033 [P] [US3] Add ad-free indicator to header in `tablechart/templates/index.html`: conditional block with green badge "✓ Ad-free mode active" and logout link
- [X] T034 [US3] Style ad-free indicator in `tablechart/static/assets/css/style.css` or inline: green badge using Bootstrap `.badge.bg-success`, responsive font sizing
- [X] T035 [US3] Create Django view `LogoutAdFreeView` in `tablechart/chart_app/views.py`: GET endpoint that deletes cookie and redirects to homepage
- [X] T036 [US3] Implement logout logic in `LogoutAdFreeView`: `response.set_cookie('ad_free_session', '', max_age=0)` and `return redirect('/')`
- [X] T037 [US3] Add URL route in `tablechart/chart_app/urls.py`: `path('api/logout-ad-free/', LogoutAdFreeView.as_view(), name='logout_ad_free')`
- [X] T038 [US3] Update logout link in header to point to `/api/logout-ad-free/`
- [ ] T039 [US3] Test ad-free indicator visibility: verify appears only when cookie present
- [ ] T040 [US3] Test logout functionality: click logout, verify cookie deleted, ads reappear on homepage
- [ ] T041 [US3] Test cookie persistence: close browser, reopen, verify ad-free status persists (365-day cookie)
- [ ] T042 [US3] Test mobile responsiveness: verify indicator and logout link display correctly on mobile viewport

**Checkpoint**: At this point, User Story 3 should be fully functional - users can manage ad-free status

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final touches, documentation, and production readiness

- [X] T043 [P] Create production donation list file `donors.json` at project root (empty or with initial donors)
- [X] T044 [P] Set secure file permissions for `donors.json`: `chmod 600 donors.json` (document in deployment guide)
- [X] T045 Add donation link button/text near "Remove Ads" button in `tablechart/templates/dashboard.html` pointing to buycoffee.to
- [X] T046 [P] Update README.md with brief mention of ad-free access for donors
- [X] T047 Verify all logging statements use appropriate log levels (INFO for success, ERROR for failures)
- [ ] T048 Test error scenario: delete/rename `donors.json`, verify graceful failure (ads shown, error logged)
- [ ] T049 Test concurrent requests: simulate multiple users verifying emails simultaneously
- [ ] T050 Cross-browser testing: verify functionality in Chrome, Firefox, Safari, Edge
- [X] T051: Accessibility audit: verify modal has proper ARIA labels, keyboard navigation works
- [ ] T052: Performance audit: run Lighthouse, verify <2s page load, no performance regressions
- [X] T053: Security review: verify cookie attributes (HttpOnly, Secure, SameSite), CSRF protection enabled
- [X] T054 [P] Documentation: update quickstart.md with production deployment notes if needed
- [ ] T055 Create pull request with feature branch, include testing checklist from quickstart.md

---

## Dependencies & Execution Order

### Story Completion Order (by priority)

```
Phase 1 (Setup)
    ↓
Phase 2 (Foundational) ← BLOCKING
    ↓
├─→ Phase 3 (US1 - Display Ads) ← MVP - Deploy First
│       ↓
├─→ Phase 4 (US2 - Email Verification) ← Core Feature
│       ↓
└─→ Phase 5 (US3 - Status Management) ← Nice-to-Have
        ↓
    Phase 6 (Polish)
```

### Parallel Execution Opportunities

**Phase 1**: All tasks [P] can run in parallel (T002, T003)

**Phase 2**: T006 and T010 can run in parallel after T005 completes

**Phase 3 (US1)**: T011 and T012 can start in parallel after Phase 2

**Phase 4 (US2)**: 
- T017 (modal template) and T018 (button) can run in parallel
- T023 (JavaScript) can start in parallel with T019-T022 (backend)

**Phase 5 (US3)**:
- T033 (indicator) and T034 (styling) can run in parallel
- T035-T037 (backend) independent from frontend tasks

**Phase 6**: Most tasks with [P] can run in parallel (T043, T044, T046, T054)

---

## Implementation Strategy

### MVP Approach

**Minimum Viable Product** = Phase 1 + Phase 2 + Phase 3 (US1 - Display Ads)

This delivers:
- ✅ Ads displaying for all users
- ✅ No disruption to existing functionality
- ✅ Foundation for donor verification

**Deploy MVP first**, then iterate:
- **Week 1**: Deploy US1 (ads live)
- **Week 2**: Add US2 (donor verification)
- **Week 3**: Add US3 (status management)
- **Week 4**: Polish and production hardening

### Incremental Delivery

Each user story is independently deployable:
- **US1 alone**: Monetization enabled, all users see ads
- **US1 + US2**: Donors can remove ads
- **US1 + US2 + US3**: Full feature set with status management

### Testing Strategy

- Unit tests optional (not requested in spec)
- Focus on manual testing per quickstart.md
- Test each user story independently before moving to next
- Use godmode email (`test@pooltrackerdev.local`) for development testing

---

## Task Summary

| Phase | Story | Tasks | Estimated Time |
|-------|-------|-------|----------------|
| Phase 1: Setup | - | 4 tasks (T001-T004) | 30 minutes |
| Phase 2: Foundational | - | 6 tasks (T005-T010) | 2-3 hours |
| Phase 3: US1 - Display Ads | P1 | 6 tasks (T011-T016) | 2-3 hours |
| Phase 4: US2 - Email Verification | P2 | 16 tasks (T017-T032) | 4-6 hours |
| Phase 5: US3 - Status Management | P3 | 10 tasks (T033-T042) | 2-3 hours |
| Phase 6: Polish | - | 13 tasks (T043-T055) | 3-4 hours |
| **TOTAL** | **3 stories** | **55 tasks** | **14-19 hours** |

**Recommended Sprint Plan**: 
- Sprint 1 (Week 1): Phase 1-3 (MVP with ads)
- Sprint 2 (Week 2): Phase 4 (donor verification)
- Sprint 3 (Week 3): Phase 5-6 (status management + polish)

---

## Constitution Compliance Verification

### Code Quality Checkpoints
- [ ] T010: Logging configured per constitution
- [ ] T007-T009: Type hints on all utility functions
- [ ] T019-T020: Business logic in utilities, not views
- [ ] T026: Error handling for file I/O

### Testing Standards Checkpoints
- [ ] T027-T032: Manual test scenarios cover edge cases
- [ ] T048-T049: Error scenarios tested
- [ ] T050: Cross-browser testing

### UX Consistency Checkpoints
- [ ] T013-T014: Responsive design validated
- [ ] T018: Bootstrap theme compliance (button styling)
- [ ] T033-T034: Ad-free indicator follows design system
- [ ] T051: Accessibility standards met

### Performance Checkpoints
- [ ] T016: Page load <2s with ads
- [ ] T032: Email verification <200ms
- [ ] T052: Lighthouse performance audit

**All constitution requirements tracked through task checklist** ✅
