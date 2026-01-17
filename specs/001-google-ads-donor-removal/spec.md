# Feature Specification: Google Ads with Donor-Based Ad Removal

**Feature Branch**: `001-google-ads-donor-removal`  
**Created**: 2026-01-17  
**Status**: Draft  
**Input**: User description: "Users should be able to remove ads after 'logging in' with their e-mail, which will be checked with donation list and if it's there, ads won't be shown to user."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Site with Ads (Priority: P1)

Regular users visiting the site see Google AdSense ads in designated locations without disrupting the core pool occupancy functionality.

**Why this priority**: This is the baseline functionality that enables monetization while maintaining the free service.

**Independent Test**: Can be fully tested by visiting the site as a new user and verifying ads appear in appropriate locations without breaking layout or performance (<2s page load per constitution).

**Acceptance Scenarios**:

1. **Given** a user visits the site for the first time, **When** the page loads, **Then** Google AdSense script loads and ads display in designated locations
2. **Given** a user has no ad-free cookie, **When** they navigate between pages (dashboard, live chart, stats), **Then** ads display consistently across all pages
3. **Given** the site is accessed on mobile, **When** the page loads, **Then** responsive ads display correctly without breaking mobile layout
4. **Given** ads are displaying, **When** user interacts with charts or dashboard, **Then** ads do not interfere with functionality (zoom, click, scroll)

---

### User Story 2 - Remove Ads via Email Verification (Priority: P2)

Donors can enter their email to verify donation status and receive ad-free access for one year.

**Why this priority**: This is the value proposition for donors - reward them with an improved experience while maintaining free access for others.

**Independent Test**: Can be tested by clicking "Remove Ads" button, entering email from donation list, and verifying ads disappear for 365 days.

**Acceptance Scenarios**:

1. **Given** a user sees the "Remove Ads" button on dashboard, **When** they click it, **Then** a popup modal appears with email input field
2. **Given** a user enters valid email from donation list, **When** they submit, **Then** system sets ad-free cookie for 365 days and reloads page without ads
3. **Given** a user enters email NOT in donation list, **When** they submit, **Then** system shows error message "Email not found in donor list" with link to buycoffee.to
4. **Given** a user has ad-free cookie, **When** they visit any page, **Then** Google AdSense script does NOT load and ads do not appear
5. **Given** a user has ad-free cookie, **When** they view the site, **Then** an "✓ Ad-free mode active" indicator appears in header with logout option

---

### User Story 3 - Ad-Free Status Management (Priority: P3)

Users with ad-free access can view their status and optionally log out (remove cookie) to see ads again.

**Why this priority**: Transparency and user control are important for trust, but secondary to core ad display and removal functionality.

**Independent Test**: Can be tested by verifying ad-free cookie, seeing status indicator, clicking logout, and confirming ads reappear.

**Acceptance Scenarios**:

1. **Given** a user has ad-free access, **When** they view the header, **Then** they see "✓ Ad-free mode active" indicator with logout button
2. **Given** a user clicks logout, **When** confirmed, **Then** ad-free cookie is deleted and page reloads with ads enabled
3. **Given** a user's ad-free cookie expires (365 days), **When** they visit the site, **Then** ads reappear and "Remove Ads" button is shown again

---

### Edge Cases

- What happens when donation list file is missing or corrupted? (System should fail safely: show ads and log error)
- How does system handle invalid email formats? (Client-side validation before submission)
- What happens if user enters testing "godmode" email? (Always grants ad-free access regardless of donation date)
- How does cookie work across subdomains? (Cookie should be domain-wide for consistency)
- What happens if user clears cookies before 365 days? (Must re-verify email)
- How does system handle concurrent requests to check donation list? (Read-only operation, no locking needed)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST conditionally load Google AdSense script based on presence of valid ad-free cookie
- **FR-002**: System MUST display "Remove Ads" button prominently on dashboard for users without ad-free access
- **FR-003**: System MUST provide email verification popup modal with input field and submit button
- **FR-004**: System MUST validate email format client-side before submission (HTML5 email validation)
- **FR-005**: System MUST check submitted email against donation list containing email and donation_date fields
- **FR-006**: System MUST accept "godmode" email (configurable via environment variable) for testing purposes
- **FR-007**: System MUST set secure HTTP-only cookie with 365-day expiration upon successful email verification
- **FR-008**: System MUST display "✓ Ad-free mode active" indicator in header for users with valid ad-free cookie
- **FR-009**: System MUST provide logout functionality to remove ad-free cookie
- **FR-010**: System MUST include link to buycoffee.to donation page when email is not found in donor list
- **FR-011**: System MUST log all email verification attempts (success/failure) for security monitoring
- **FR-012**: System MUST NOT log Google AdSense script when ad-free cookie is present
- **FR-013**: System MUST maintain existing Google Analytics tracking regardless of ad-free status

### Key Entities *(include if feature involves data)*

- **Donor**: Represents a person who donated, identified by email and donation date
  - email: string (unique identifier)
  - donation_date: date (ISO 8601 format)
  
- **AdFreeSession**: Cookie-based session tracking ad-free status
  - email: string (donor email)
  - granted_at: timestamp (when cookie was set)
  - expires_at: timestamp (365 days from granted_at)

### Non-Functional Requirements

- **NFR-001**: Email verification response time MUST be <200ms (constitution performance requirement)
- **NFR-002**: Page load with ads MUST complete in <2 seconds on 3G (constitution requirement)
- **NFR-003**: Page load without ads MUST complete in <1.5 seconds on 3G (faster due to no ad script)
- **NFR-004**: Donation list MUST be stored securely with restricted file permissions (600)
- **NFR-005**: Ad-free cookie MUST be HTTP-only and Secure (HTTPS) to prevent XSS attacks
- **NFR-006**: Modal popup MUST follow Bootstrap NiceAdmin theme styling (constitution UX consistency)
- **NFR-007**: Solution MUST NOT require changes to existing database schema (lightweight approach)

## Out of Scope

- Full user authentication system (username/password)
- Donation payment processing (handled externally by buycoffee.to)
- Automated donation list synchronization (manual CSV/JSON update)
- Ad click tracking or revenue analytics
- Multiple donation tiers or varying ad-free durations
- Email verification link (not needed for cookie-based approach)
- Admin interface for managing donation list (manual file editing for v1)

## Success Criteria

1. Users without ad-free cookie see Google AdSense ads on all pages
2. Donors can verify email and receive ad-free access in <2 clicks
3. Ad-free status persists for 365 days via cookie
4. Page performance meets constitution requirements (<2s load, <500ms chart render)
5. All changes pass constitution UX consistency checks (Bootstrap theme compliance)
6. Zero regressions to existing pool tracking functionality
7. Email verification success rate >95% for valid donors

## Dependencies

- Google AdSense account (already configured: ca-pub-5991927434708691)
- buycoffee.to donation page (external service)
- Donation list file (CSV or JSON format) accessible to Django application
- HTTPS enabled for secure cookies (already in production per README)

## Assumptions

- Donation list is updated manually by project maintainer
- Donors use the same email they provided to buycoffee.to
- Users accept functional cookies (Google AdSense cookie consent covers this)
- 365-day duration is sufficient for donor retention
- Single "godmode" test email is adequate for testing
