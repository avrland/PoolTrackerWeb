# Implementation Plan: Google Ads with Donor-Based Ad Removal

**Branch**: `001-google-ads-donor-removal` | **Date**: 2026-01-17 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-google-ads-donor-removal/spec.md`

## Summary

Enable Google AdSense monetization with donor recognition: users who donate via buycoffee.to can verify their email to receive ad-free access for 365 days via secure cookie. Non-donors see ads; donors enjoy clean experience. Cookie-based approach (no database changes), Bootstrap modal for email verification, manual donation list management (CSV/JSON).

**Technical Approach**: Conditional template rendering based on cookie presence; Django view for email verification endpoint; JSON donation list file; HTTP-only secure cookie with 365-day expiration.

## Technical Context

**Language/Version**: Python 3.11+ (Django latest stable ≥4.x)  
**Primary Dependencies**: Django (web framework), PyMySQL (existing DB driver), Bootstrap 5 (NiceAdmin template)  
**Storage**: JSON file for donation list (email + donation_date); HTTP-only cookies for ad-free session  
**Testing**: Django TestCase for views, Django test client for cookie behavior, mock file I/O  
**Target Platform**: Docker container (Linux), served via Gunicorn/Nginx (production)  
**Project Type**: Web application (Django monolith)  
**Performance Goals**: <200ms email verification response, <2s page load with ads, <1.5s without ads  
**Constraints**: <512MB Docker memory, ≤5 DB queries per view (constitution), no database schema changes  
**Scale/Scope**: ~100-1000 donors expected, manual donation list updates, single godmode test email

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Code Quality ✅ PASS

- **Django Best Practices**: Email verification view follows class-based view pattern; business logic in service layer
- **Python Standards**: Type hints required for all functions (email verification, cookie management)
- **DRY Principle**: Cookie management utilities extracted to `chart_app/utils/ad_free.py`
- **Separation of Concerns**: Donation list reader is separate service, not in views
- **Documentation**: All public functions have docstrings
- **Error Handling**: File I/O and email validation have explicit error handling with logging

**Status**: No violations

### II. Testing Standards ✅ PASS

- **Unit Tests**: Service functions (donation list reader, email validator) will have ≥80% coverage
- **View Tests**: Email verification endpoint tested for status codes, cookie setting, error cases
- **Integration Tests**: End-to-end flow: email submission → cookie set → ads hidden
- **Test Isolation**: Donation list mocked; no external API dependencies for this feature
- **Test Naming**: Follows `test_<what>_<condition>_<expected>` pattern

**Status**: All testing requirements met

### III. User Experience Consistency ✅ PASS

- **Bootstrap Theme**: Modal uses NiceAdmin Bootstrap classes; button styling matches existing dashboard cards
- **Responsive Design**: Modal and button work on mobile (≥320px), tablet, desktop
- **Dashboard Indicators**: Ad-free indicator follows green color pattern; logout button uses standard styles
- **Loading States**: Email verification shows spinner during submission
- **Error Messages**: User-friendly messages ("Email not found in donor list" + buycoffee.to link)

**Status**: UX consistency maintained

### IV. Performance Requirements ✅ PASS

- **Page Load**: No additional database queries; file read cached in memory
- **Email Verification**: <200ms response (file read + JSON parse + cookie set)
- **Database Queries**: Zero new queries (file-based, no DB changes per constraint)
- **Memory**: JSON file <1MB; negligible memory impact
- **Caching**: Donation list loaded once per Django worker process startup (module-level cache)

**Status**: All performance requirements met

**OVERALL GATE STATUS: ✅ PASS** - No constitution violations; no complexity justifications required

## Project Structure

### Documentation (this feature)

```text
specs/001-google-ads-donor-removal/
├── plan.md              # This file (implementation plan)
├── spec.md              # Feature specification (completed)
├── research.md          # Phase 0 output (best practices, security)
├── data-model.md        # Phase 1 output (donor data structure)
├── quickstart.md        # Phase 1 output (setup & testing guide)
├── contracts/           # Phase 1 output (API endpoints)
│   └── verify-email.json
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
tablechart/
├── chart_app/
│   ├── views.py             # Add VerifyDonorEmailView
│   ├── urls.py              # Add /api/verify-donor-email/ endpoint
│   ├── utils/
│   │   └── ad_free.py       # NEW: Cookie management, donation list reader
│   └── tests/
│       ├── test_ad_free_utils.py      # NEW: Unit tests for utilities
│       └── test_donor_verification.py # NEW: Integration tests for view
├── templates/
│   ├── index.html           # Modify: Conditional AdSense script loading
│   ├── dashboard.html       # Modify: Add "Remove Ads" button, ad-free indicator
│   └── partials/
│       └── donor_modal.html # NEW: Email verification modal
├── static/
│   └── assets/
│       └── js/
│           └── donor-verification.js # NEW: Modal interaction, AJAX submission
└── tablechart/
    └── settings.py          # Add DONATION_LIST_PATH, GODMODE_EMAIL config

# Project root
.env                         # Add GODMODE_EMAIL=test@example.com
donors.json                  # NEW: Donation list file (gitignored)
donors.example.json          # NEW: Example donation list structure
```

**Structure Decision**: Django monolith web application (existing structure). New functionality added to `chart_app` with utilities in `utils/` subdirectory. Templates extended with conditional blocks. Static JavaScript for modal interaction. File-based storage (no database migrations needed).

## Complexity Tracking

> **No complexity violations** - Constitution gates passed. This section intentionally left empty.
