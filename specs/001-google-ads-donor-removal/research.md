# Research: Google Ads with Donor-Based Ad Removal

**Date**: 2026-01-17  
**Purpose**: Resolve technical unknowns and establish best practices for secure, performant ad-free session management

## Research Tasks Completed

### 1. Cookie-Based Session Management Best Practices

**Decision**: Use HTTP-only, Secure, SameSite=Lax cookie with 365-day expiration

**Rationale**:
- **HTTP-only**: Prevents XSS attacks from accessing cookie via JavaScript
- **Secure flag**: Ensures cookie only transmitted over HTTPS (site already has SSL per README)
- **SameSite=Lax**: Protects against CSRF while allowing navigation from external sites (buycoffee.to redirect)
- **365-day max-age**: Persistent cookie survives browser restarts; user must re-verify after one year

**Django Implementation**:
```python
response.set_cookie(
    key='ad_free_session',
    value=email,  # or hash of email for privacy
    max_age=365*24*60*60,  # 365 days in seconds
    httponly=True,
    secure=True,  # requires HTTPS
    samesite='Lax'
)
```

**Alternatives Considered**:
- **Session-based (expires on browser close)**: Rejected - too short for donor benefit
- **LocalStorage**: Rejected - vulnerable to XSS attacks
- **Database-backed sessions**: Rejected - violates "no DB schema changes" constraint

**References**:
- Django cookie documentation: https://docs.djangoproject.com/en/stable/ref/request-response/#django.http.HttpResponse.set_cookie
- OWASP cookie security: https://owasp.org/www-community/controls/SecureCookieAttribute

---

### 2. Conditional Google AdSense Script Loading

**Decision**: Use Django template conditional `{% if not request.COOKIES.ad_free_session %}` to wrap AdSense script

**Rationale**:
- **Performance**: Prevents entire AdSense library from loading when not needed (~200KB+ saved)
- **Privacy**: No tracking scripts execute for donors
- **Simple**: No JavaScript required; server-side decision
- **Compliant**: Google allows conditional loading based on user preferences

**Implementation Pattern**:
```django
{% if not request.COOKIES.ad_free_session %}
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5991927434708691" crossorigin="anonymous"></script>
{% endif %}
```

**Ad Unit Placement** (also conditional):
```django
{% if not request.COOKIES.ad_free_session %}
  <ins class="adsbygoogle" style="display:block" data-ad-client="ca-pub-5991927434708691"></ins>
  <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
{% endif %}
```

**Alternatives Considered**:
- **JavaScript-based hiding**: Rejected - script still loads, wastes bandwidth
- **CSS display:none**: Rejected - violates AdSense policies (hidden ads)

**References**:
- Google AdSense implementation guide
- Django template conditionals: https://docs.djangoproject.com/en/stable/ref/templates/builtins/#if

---

### 3. Donation List Storage Format

**Decision**: JSON file with email (lowercase, trimmed) and donation_date (ISO 8601)

**Rationale**:
- **Simple**: No database migrations, easy manual editing
- **Fast**: JSON parsing in Python is ~1-2ms for 1000 entries
- **Version Control**: Can track donation list changes in git (if not gitignored)
- **Portable**: Easy backup/restore

**File Format** (`donors.json`):
```json
{
  "donors": [
    {
      "email": "example@domain.com",
      "donation_date": "2026-01-15"
    },
    {
      "email": "another@example.com",
      "donation_date": "2026-01-10"
    }
  ],
  "godmode_email": "test@pooltrackerdev.local"
}
```

**Caching Strategy**:
- Load JSON once at Django worker startup (module-level)
- Reload on file modification timestamp change (check before each verification)
- Expected load time: <5ms for 1000 donors

**Code Pattern**:
```python
import json
from pathlib import Path
from functools import lru_cache

@lru_cache(maxsize=1)
def load_donor_list(file_mtime: float) -> dict:
    """Load and cache donor list. Cache key is file modification time."""
    with open(DONATION_LIST_PATH) as f:
        return json.load(f)

def get_donor_list() -> dict:
    """Get donor list with automatic cache invalidation on file change."""
    mtime = Path(DONATION_LIST_PATH).stat().st_mtime
    return load_donor_list(mtime)
```

**Alternatives Considered**:
- **CSV format**: Rejected - JSON easier for nested structures, better error messages
- **Database table**: Rejected - violates constraint, overkill for 100-1000 entries
- **Redis cache**: Rejected - adds infrastructure complexity

---

### 4. Email Validation & Security

**Decision**: Client-side HTML5 validation + server-side regex + lowercase normalization

**Rationale**:
- **User Experience**: Immediate feedback on invalid format (client-side)
- **Security**: Never trust client; server validates again
- **Normalization**: Email matching is case-insensitive (`user@domain.com` == `USER@domain.com`)

**Client-Side** (HTML):
```html
<input type="email" required pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$">
```

**Server-Side** (Python):
```python
import re
from typing import Optional

EMAIL_REGEX = re.compile(r'^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$', re.IGNORECASE)

def validate_email(email: str) -> Optional[str]:
    """Validate and normalize email. Returns normalized email or None."""
    email = email.strip().lower()
    if not EMAIL_REGEX.match(email):
        return None
    return email
```

**Rate Limiting**:
- **Decision**: Django's built-in rate limiting middleware (not implemented in v1, but planned)
- **Rationale**: Prevent brute-force email enumeration attacks
- **Future**: 10 attempts per IP per hour

**Alternatives Considered**:
- **Third-party email validation API**: Rejected - adds latency, external dependency
- **Email verification link**: Rejected - over-engineered for cookie-based approach

**References**:
- Django email validation: https://docs.djangoproject.com/en/stable/ref/validators/#django.core.validators.EmailValidator
- HTML5 email input: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/email

---

### 5. Bootstrap Modal Best Practices (NiceAdmin Theme)

**Decision**: Use Bootstrap 5 modal with form submission via fetch API (AJAX)

**Rationale**:
- **UX**: No page reload; instant feedback
- **Consistency**: Matches existing chatbot widget modal pattern
- **Accessibility**: Bootstrap modal handles focus trap, keyboard navigation

**Modal Structure**:
```html
<div class="modal fade" id="donorVerificationModal" tabindex="-1">
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">Remove Ads - Verify Donation</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
      </div>
      <div class="modal-body">
        <form id="donorVerificationForm">
          <input type="email" class="form-control" placeholder="Enter your email" required>
          <div class="invalid-feedback">Please enter a valid email address.</div>
        </form>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
        <button type="submit" form="donorVerificationForm" class="btn btn-primary">Verify</button>
      </div>
    </div>
  </div>
</div>
```

**JavaScript Pattern** (fetch API):
```javascript
document.getElementById('donorVerificationForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = e.target.querySelector('input[type="email"]').value;
  
  const response = await fetch('/api/verify-donor-email/', {
    method: 'POST',
    headers: {'Content-Type': 'application/json', 'X-CSRFToken': getCsrfToken()},
    body: JSON.stringify({email})
  });
  
  if (response.ok) {
    location.reload(); // Reload to hide ads
  } else {
    const error = await response.json();
    showError(error.message);
  }
});
```

**Alternatives Considered**:
- **Full page reload with POST**: Rejected - poor UX
- **jQuery AJAX**: Rejected - prefer vanilla JS, reduce dependencies

**References**:
- Bootstrap 5 modal: https://getbootstrap.com/docs/5.3/components/modal/
- Fetch API: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API

---

### 6. Ad-Free Indicator Design

**Decision**: Green badge in header with checkmark icon + logout link

**Rationale**:
- **Visibility**: Header is visible on all pages
- **Consistency**: Green matches <80% occupancy indicators (positive/safe)
- **Accessibility**: High contrast, icon + text for clarity

**HTML Structure**:
```html
{% if request.COOKIES.ad_free_session %}
<div class="ad-free-indicator">
  <span class="badge bg-success">
    <i class="bi bi-check-circle-fill"></i> Ad-free mode active
  </span>
  <a href="/api/logout-ad-free/" class="text-muted small ms-2">Logout</a>
</div>
{% endif %}
```

**CSS** (responsive):
```css
.ad-free-indicator {
  display: flex;
  align-items: center;
  margin-left: auto;
  padding: 0 1rem;
}

@media (max-width: 768px) {
  .ad-free-indicator .badge {
    font-size: 0.75rem;
  }
}
```

**Alternatives Considered**:
- **Footer placement**: Rejected - less visible
- **Persistent notification toast**: Rejected - too intrusive

---

### 7. Performance Optimization Strategies

**Decision**: Module-level caching + file mtime checking

**Rationale**:
- **Fast**: Donation list loaded once per worker (not per request)
- **Fresh**: Automatic reload when file changes
- **Memory**: ~10KB for 1000 donors (negligible)

**Benchmark Targets**:
| Operation | Target | Expected |
|-----------|--------|----------|
| Load JSON (cold) | <10ms | ~5ms |
| Check email (cached) | <1ms | ~0.1ms |
| Set cookie + response | <5ms | ~2ms |
| **Total verification** | **<200ms** | **~50ms** |

**Monitoring**:
- Log verification attempts (success/failure/timing)
- Alert if JSON file missing or corrupted
- Track cookie expiration rate (measure 365-day retention)

**Alternatives Considered**:
- **Per-request JSON load**: Rejected - too slow (~5ms per request)
- **Redis caching**: Rejected - over-engineered

---

## Summary of Key Decisions

| Topic | Decision | Primary Benefit |
|-------|----------|-----------------|
| Session Management | HTTP-only, Secure, 365-day cookie | Security + persistence |
| Ad Loading | Server-side conditional template | Performance + privacy |
| Donation Storage | JSON file with mtime-based caching | Simplicity + speed |
| Email Validation | Client + server, lowercase normalized | UX + security |
| Modal UI | Bootstrap 5 + fetch API | Consistency + modern |
| Status Indicator | Green badge in header | Visibility + clarity |
| Performance | Module-level cache + mtime check | <200ms verification |

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Donation list file deleted/corrupted | Low | High | Fail safely: show ads, log error, alert admin |
| Cookie cleared by user | Medium | Low | Easy re-verification; expected behavior |
| Email enumeration attack | Low | Low | Future: rate limiting (10/hour/IP) |
| JSON parse error | Low | Medium | Try-except with fallback to empty list |
| HTTPS downgrade attack | Very Low | High | Site already HTTPS-only per README |

## Open Questions (None Remaining)

All technical unknowns resolved. Ready for Phase 1 (design documents).
