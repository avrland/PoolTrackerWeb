# Data Model: Google Ads Donor-Based Ad Removal

**Date**: 2026-01-17  
**Status**: Final  
**Storage**: File-based (JSON) + HTTP cookies (no database changes)

## Overview

This feature uses a **hybrid storage approach**:
1. **Donation List**: JSON file containing donor emails and donation dates
2. **Ad-Free Session**: HTTP-only secure cookie set on successful verification

**No Django models required** - constraint honored (no database schema changes).

---

## Entity 1: Donor (File-based)

**Purpose**: Represents a person who has donated, stored in JSON file

**Storage**: `/path/to/donors.json` (configured via `settings.DONATION_LIST_PATH`)

### Schema

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `email` | string | Yes | Valid email format, lowercase | Donor's email address (unique identifier) |
| `donation_date` | string | Yes | ISO 8601 date (YYYY-MM-DD) | Date donation was received |

### JSON Structure

```json
{
  "donors": [
    {
      "email": "user@example.com",
      "donation_date": "2026-01-15"
    },
    {
      "email": "another@domain.org",
      "donation_date": "2025-12-20"
    }
  ],
  "godmode_email": "test@pooltrackerdev.local"
}
```

### Validation Rules

1. **Email Normalization**: 
   - Convert to lowercase before storage and comparison
   - Trim whitespace
   - Validate format: `^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$`

2. **Date Format**:
   - Must be ISO 8601 (YYYY-MM-DD)
   - Optional field (not used for verification logic in v1)
   - Future use: track donation age, expire after N years

3. **Uniqueness**:
   - Email must be unique in donor list
   - Duplicate emails: use latest donation_date

4. **Godmode Email**:
   - Special test email that always grants access
   - Configured at root level of JSON
   - Loaded from environment variable `GODMODE_EMAIL`

### Example File (`donors.json`)

```json
{
  "donors": [
    {
      "email": "john.doe@example.com",
      "donation_date": "2026-01-10"
    },
    {
      "email": "jane.smith@domain.com",
      "donation_date": "2026-01-12"
    },
    {
      "email": "supporter@pool-lover.org",
      "donation_date": "2026-01-05"
    }
  ],
  "godmode_email": "test@pooltrackerdev.local"
}
```

### Example File for Git (`donors.example.json`)

```json
{
  "donors": [
    {
      "email": "example@donor.com",
      "donation_date": "2026-01-01"
    }
  ],
  "godmode_email": "test@example.com"
}
```

---

## Entity 2: AdFreeSession (Cookie-based)

**Purpose**: Tracks user's ad-free status after successful email verification

**Storage**: HTTP cookie named `ad_free_session`

### Cookie Attributes

| Attribute | Value | Purpose |
|-----------|-------|---------|
| `key` | `ad_free_session` | Cookie name |
| `value` | Verified email address | Identifier (or hashed for privacy) |
| `max_age` | `31536000` (365 days) | Cookie lifespan in seconds |
| `httponly` | `True` | Prevent JavaScript access (XSS protection) |
| `secure` | `True` | HTTPS-only transmission |
| `samesite` | `Lax` | CSRF protection, allows external navigation |
| `path` | `/` | Available site-wide |
| `domain` | Auto (current domain) | Single domain scope |

### Cookie Value Format

**Option A** (Simple - Recommended):
```
ad_free_session=user@example.com
```

**Option B** (Privacy-enhanced):
```
ad_free_session=sha256(email)[:16]
```

*Recommendation*: Use Option A for simplicity. Cookie is HTTP-only, so privacy risk is minimal.

### State Transitions

```
[No Cookie] --verify email--> [Cookie Set] --365 days OR logout--> [No Cookie]
     ↓                              ↓
  Show Ads                      Hide Ads
```

### Cookie Lifecycle

1. **Creation**: User submits valid email → Server checks donor list → Sets cookie
2. **Validation**: Every page load checks for cookie presence (not expiration date - browser handles that)
3. **Expiration**: Browser automatically deletes after 365 days (31,536,000 seconds)
4. **Manual Removal**: User clicks "Logout" → Server sends `Set-Cookie` with `max_age=0`

---

## Data Access Patterns

### Pattern 1: Check if User is Ad-Free (Every Request)

**Trigger**: Template rendering (every page load)  
**Operation**: Read cookie from request  
**Performance**: O(1) - dictionary lookup  

**Django Template**:
```django
{% if not request.COOKIES.ad_free_session %}
  <!-- Load ads -->
{% endif %}
```

**Django View** (if needed):
```python
def is_ad_free(request) -> bool:
    """Check if user has valid ad-free cookie."""
    return 'ad_free_session' in request.COOKIES
```

### Pattern 2: Verify Donor Email (Rare - User-Initiated)

**Trigger**: User submits email in modal  
**Operation**: 
1. Load donor list from JSON (cached)
2. Normalize submitted email
3. Check if email in donor list OR matches godmode email
4. Set cookie if found

**Performance**: 
- Cold load: ~5ms (JSON parse)
- Cached: <1ms (dict lookup)
- Total: <200ms (target), ~50ms (expected)

**Pseudocode**:
```python
def verify_donor_email(email: str) -> bool:
    email_normalized = email.strip().lower()
    
    # Check godmode
    if email_normalized == settings.GODMODE_EMAIL:
        return True
    
    # Load donor list (cached)
    donor_list = get_donor_list()
    
    # Check if email exists
    for donor in donor_list['donors']:
        if donor['email'] == email_normalized:
            return True
    
    return False
```

### Pattern 3: Load Donation List (Startup + File Change)

**Trigger**: 
- Django worker startup (once per process)
- File modification detected (mtime change)

**Operation**: Read JSON file, parse, cache in memory

**Caching Strategy**:
```python
from functools import lru_cache
from pathlib import Path

@lru_cache(maxsize=1)
def load_donor_list(file_mtime: float) -> dict:
    """Load donor list. Cache key is file mtime."""
    with open(settings.DONATION_LIST_PATH) as f:
        return json.load(f)

def get_donor_list() -> dict:
    """Get donor list with auto-reload on file change."""
    mtime = Path(settings.DONATION_LIST_PATH).stat().st_mtime
    return load_donor_list(mtime)
```

**Cache Invalidation**: Automatic when file mtime changes

---

## Data Flow Diagram

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       │ 1. Submit email
       ▼
┌─────────────────────┐
│ VerifyDonorEmailView│
└──────┬──────────────┘
       │
       │ 2. Normalize email
       ▼
┌─────────────────────┐
│  validate_email()   │
└──────┬──────────────┘
       │
       │ 3. Check donor list
       ▼
┌─────────────────────┐
│  get_donor_list()   │ ←──── donors.json (cached)
└──────┬──────────────┘
       │
       │ 4a. Found? Set cookie
       ▼
┌─────────────────────┐
│  response.set_cookie│
│  ('ad_free_session')│
└──────┬──────────────┘
       │
       │ 4b. Not found? Error
       ▼
┌─────────────────────┐
│   JSON error msg    │
└─────────────────────┘

Every page request:
┌─────────────┐
│   Browser   │
│ (has cookie)│
└──────┬──────┘
       │
       │ Check cookie
       ▼
┌─────────────────────┐
│ Template rendering  │
│ {% if not cookie %} │
│   <script ads>      │
│ {% endif %}         │
└─────────────────────┘
```

---

## File Structure & Permissions

### Production
```
/var/www/pooltrackerWeb/
├── donors.json         # SECURE: chmod 600, owner www-data
├── .env                # Contains GODMODE_EMAIL
└── tablechart/
    └── settings.py     # Reads DONATION_LIST_PATH
```

### Development
```
/Users/.../PoolTrackerWeb/
├── donors.json         # Gitignored
├── donors.example.json # Committed (example structure)
└── .env                # GODMODE_EMAIL=test@pooltrackerdev.local
```

### Security Requirements

1. **File Permissions**: `chmod 600 donors.json` (owner read/write only)
2. **Git Ignore**: Add `donors.json` to `.gitignore` (contains real emails)
3. **Backup**: Regular backups to secure location
4. **Encryption**: Optional file encryption at rest (future enhancement)

---

## Error Handling

### Missing Donor File

**Scenario**: `donors.json` not found or unreadable

**Response**:
- Log error: "Donor list file not found at {path}"
- Fallback: Empty donor list (all verifications fail except godmode)
- User sees: "Unable to verify donation. Please try again later."

**Code**:
```python
def get_donor_list() -> dict:
    try:
        # ... load file
    except FileNotFoundError:
        logger.error(f"Donor list file not found: {settings.DONATION_LIST_PATH}")
        return {"donors": [], "godmode_email": settings.GODMODE_EMAIL}
    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON in donor list: {e}")
        return {"donors": [], "godmode_email": settings.GODMODE_EMAIL}
```

### Invalid JSON Format

**Scenario**: Malformed JSON in `donors.json`

**Response**:
- Log error with line number
- Fallback to empty list
- Alert admin via logging system

### Duplicate Emails

**Scenario**: Same email appears multiple times

**Response**:
- Log warning
- Use first occurrence
- Future: Deduplicate on load

---

## Testing Data

### Test Donors (`donors.json` for development)

```json
{
  "donors": [
    {
      "email": "verified@test.com",
      "donation_date": "2026-01-01"
    },
    {
      "email": "old-donor@example.com",
      "donation_date": "2025-06-15"
    }
  ],
  "godmode_email": "test@pooltrackerdev.local"
}
```

### Test Scenarios

| Email | Expected Result |
|-------|-----------------|
| `verified@test.com` | ✅ Grants access |
| `test@pooltrackerdev.local` | ✅ Grants access (godmode) |
| `unknown@example.com` | ❌ Not found |
| `VERIFIED@TEST.COM` | ✅ Grants access (case-insensitive) |
| ` verified@test.com ` | ✅ Grants access (whitespace trimmed) |
| `invalid-email` | ❌ Validation error |

---

## Future Enhancements (Out of Scope for v1)

1. **Expiration Logic**: Expire donors after 2 years of donation_date
2. **Admin Interface**: Django admin for managing donor list
3. **Automatic Sync**: Integration with buycoffee.to API
4. **Donation Tiers**: Different ad-free durations (30/90/365 days)
5. **Multi-Device Sync**: Account-based instead of cookie-based
6. **Privacy Mode**: Hash email in cookie value
7. **Analytics**: Track donor retention, conversion rate
