# Quickstart: Google Ads with Donor-Based Ad Removal

**Feature**: 001-google-ads-donor-removal  
**Last Updated**: 2026-01-17  
**Estimated Setup Time**: 10 minutes

## Overview

This guide helps developers set up and test the Google Ads donor verification feature locally.

---

## Prerequisites

- ✅ Python 3.11+ with Django installed
- ✅ PoolTrackerWeb repository cloned
- ✅ Development environment running (`python manage.py runserver`)
- ✅ HTTPS enabled (or use `settings.DEBUG = True` to disable secure cookie requirement)

---

## Quick Setup (5 Steps)

### 1. Create Donation List File

Create `donors.json` in project root:

```bash
cd /path/to/PoolTrackerWeb
cat > donors.json << 'EOF'
{
  "donors": [
    {
      "email": "verified@test.com",
      "donation_date": "2026-01-01"
    },
    {
      "email": "john.doe@example.com",
      "donation_date": "2026-01-15"
    }
  ],
  "godmode_email": "test@pooltrackerdev.local"
}
EOF
```

Set secure permissions:
```bash
chmod 600 donors.json
```

### 2. Update Environment Variables

Add to `.env` file:

```bash
# Donation list path (absolute or relative to project root)
DONATION_LIST_PATH=donors.json

# Godmode email for testing (always grants access)
GODMODE_EMAIL=test@pooltrackerdev.local

# BuyCoffee donation page URL
BUYCOFFEE_URL=https://buycoffee.to/pooltracker
```

### 3. Update Django Settings

Verify `tablechart/settings.py` includes:

```python
# Add to settings.py
DONATION_LIST_PATH = os.getenv('DONATION_LIST_PATH', 'donors.json')
GODMODE_EMAIL = os.getenv('GODMODE_EMAIL', 'test@pooltrackerdev.local')
BUYCOFFEE_URL = os.getenv('BUYCOFFEE_URL', 'https://buycoffee.to/pooltracker')

# For local development without HTTPS
if DEBUG:
    # Allow non-secure cookies in development
    SESSION_COOKIE_SECURE = False
    CSRF_COOKIE_SECURE = False
```

### 4. Add to .gitignore

Prevent committing real donor emails:

```bash
echo "donors.json" >> .gitignore
```

### 5. Restart Django Server

```bash
python manage.py runserver
```

---

## Testing the Feature

### Test Scenario 1: View Ads (Default State)

1. Open browser in **incognito/private mode**
2. Navigate to `http://localhost:8000/`
3. ✅ **Expected**: Google AdSense ads appear in designated locations

### Test Scenario 2: Verify Donor Email

1. On dashboard, click **"Remove Ads"** button
2. Modal popup appears
3. Enter email: `verified@test.com`
4. Click **"Verify"**
5. ✅ **Expected**: 
   - Success message: "Ad-free access granted! Thank you for your support."
   - Page reloads
   - Ads disappear
   - Green badge in header: "✓ Ad-free mode active"

### Test Scenario 3: Unknown Email

1. Click **"Remove Ads"** button (if you don't have ad-free access yet)
2. Enter email: `unknown@example.com`
3. Click **"Verify"**
4. ✅ **Expected**:
   - Error message: "Email not found in donor list"
   - Link to buycoffee.to donation page

### Test Scenario 4: Godmode Email (Testing)

1. Click **"Remove Ads"** button
2. Enter email: `test@pooltrackerdev.local`
3. Click **"Verify"**
4. ✅ **Expected**: 
   - Ad-free access granted (always works for testing)
   - Ads hidden

### Test Scenario 5: Logout

1. With ad-free access active, view header
2. Click **"Logout"** link next to "✓ Ad-free mode active"
3. ✅ **Expected**:
   - Page reloads
   - Ads reappear
   - "Remove Ads" button visible again

### Test Scenario 6: Cookie Persistence

1. Verify email to get ad-free access
2. Close browser
3. Reopen browser, navigate to site
4. ✅ **Expected**: Ad-free status persists (cookie survives browser restart)

### Test Scenario 7: Case Insensitivity

1. Add donor email in lowercase: `user@example.com`
2. Verify with uppercase: `USER@EXAMPLE.COM`
3. ✅ **Expected**: Verification succeeds (case-insensitive matching)

---

## Manual Testing Checklist

### Frontend
- [ ] "Remove Ads" button appears on dashboard
- [ ] Button styled with Bootstrap theme (consistent with other buttons)
- [ ] Modal opens on button click
- [ ] Email input has HTML5 validation
- [ ] Submit button disabled during API call (loading state)
- [ ] Success message displays correctly
- [ ] Error message displays correctly with donation link
- [ ] Modal closes after successful verification
- [ ] Ad-free indicator appears in header
- [ ] Logout link functions correctly

### Backend
- [ ] `/api/verify-donor-email/` endpoint responds in <200ms
- [ ] Valid donor email returns 200 with cookie
- [ ] Invalid email format returns 400
- [ ] Unknown email returns 404 with donation link
- [ ] Godmode email always returns 200
- [ ] Cookie attributes set correctly (HttpOnly, Secure, SameSite, Max-Age)
- [ ] CSRF token required
- [ ] Missing donor file fails gracefully (500 with generic error)

### Integration
- [ ] Ads load when no cookie present
- [ ] Ads hidden when cookie present
- [ ] Cookie persists across page navigation
- [ ] Logout removes cookie and shows ads
- [ ] Mobile responsive layout maintained
- [ ] Chart functionality unaffected by feature

---

## Debugging Tips

### Problem: Ads Not Loading

**Symptoms**: No ads appear even without ad-free cookie

**Checks**:
1. Verify Google AdSense script in `templates/index.html`:
   ```html
   {% if not request.COOKIES.ad_free_session %}
     <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5991927434708691"></script>
   {% endif %}
   ```
2. Check browser console for AdSense errors
3. Verify ad units placed correctly in templates
4. Ensure AdSense account approved and active

### Problem: Verification Always Fails

**Symptoms**: Valid donor emails return 404

**Checks**:
1. Verify `donors.json` path is correct:
   ```python
   python manage.py shell
   >>> from django.conf import settings
   >>> print(settings.DONATION_LIST_PATH)
   ```
2. Check JSON format is valid:
   ```bash
   python -m json.tool donors.json
   ```
3. Verify email is lowercase in JSON file
4. Check file permissions: `ls -la donors.json` (should be readable by Django process)
5. View logs for error messages

### Problem: Cookie Not Persisting

**Symptoms**: Ad-free status lost on page reload

**Checks**:
1. Verify cookie set in browser DevTools → Application → Cookies
2. Check cookie attributes (HttpOnly, Secure, Max-Age)
3. For development without HTTPS, ensure `SESSION_COOKIE_SECURE = False` in settings
4. Check if browser blocks third-party cookies (shouldn't affect first-party)

### Problem: Modal Not Opening

**Symptoms**: Clicking "Remove Ads" button does nothing

**Checks**:
1. Check browser console for JavaScript errors
2. Verify Bootstrap JS loaded: `static/assets/vendor/bootstrap/js/bootstrap.bundle.min.js`
3. Verify modal HTML exists in template
4. Check modal ID matches button `data-bs-target` attribute

---

## Running Automated Tests

### Unit Tests

```bash
cd /path/to/PoolTrackerWeb/tablechart
python manage.py test chart_app.tests.test_ad_free_utils
python manage.py test chart_app.tests.test_donor_verification
```

### Integration Tests

```bash
python manage.py test chart_app.tests --tag=integration
```

### Coverage Report

```bash
pip install coverage
coverage run --source='chart_app' manage.py test
coverage report
coverage html  # Open htmlcov/index.html
```

**Target**: ≥80% coverage per constitution

---

## Production Deployment

### 1. Secure Donor List

```bash
# Set restrictive permissions
chmod 600 /var/www/PoolTrackerWeb/donors.json
chown www-data:www-data /var/www/PoolTrackerWeb/donors.json
```

### 2. Environment Variables

Update production `.env`:
```bash
DONATION_LIST_PATH=/var/www/PoolTrackerWeb/donors.json
GODMODE_EMAIL=  # Leave empty or set to internal test email
BUYCOFFEE_URL=https://buycoffee.to/pooltracker
```

### 3. Enable HTTPS

Ensure SSL certificate valid. Cookie `Secure` flag requires HTTPS.

### 4. Update Donor List

Manually add donors to `donors.json`:
```bash
# Backup first
cp donors.json donors.json.bak

# Edit file
nano donors.json

# Validate JSON
python -m json.tool donors.json

# Reload Django workers (cookie cache auto-updates on file mtime change)
sudo systemctl reload pooltrackerWeb
```

### 5. Monitor Logs

```bash
tail -f /var/log/pooltrackerWeb/error.log | grep "donor"
```

Look for:
- `"Email verification attempt: {email}"`
- `"Email verification success: {email}"`
- `"Email verification failed: {email}"`
- `"Donor list file not found"`

---

## Common Use Cases

### Add New Donor

1. Receive donation on buycoffee.to
2. Note donor's email
3. Add to `donors.json`:
   ```json
   {
     "email": "newdonor@example.com",
     "donation_date": "2026-01-17"
   }
   ```
4. File auto-reloads on next verification attempt (no restart needed)

### Bulk Import Donors

```bash
# From CSV export
python manage.py import_donors --csv donors_export.csv
# (Custom management command - implement if needed)
```

### Test in Production

Use godmode email to verify feature works:
1. Navigate to site
2. Click "Remove Ads"
3. Enter godmode email (from `.env`)
4. Verify ad-free access granted
5. Logout to restore ads

---

## Performance Benchmarks

Run performance tests:

```bash
python manage.py test chart_app.tests.test_donor_verification.PerformanceTests
```

**Expected Results**:
- Email verification: <50ms (average), <200ms (p95)
- Donor list load (cold): ~5ms
- Donor list load (cached): <1ms
- Cookie set: ~2ms

---

## FAQ

**Q: How long does ad-free access last?**  
A: 365 days from verification. Cookie expires automatically.

**Q: Can donors use multiple devices?**  
A: Yes, but they must verify email on each device (cookie is device-specific).

**Q: What if donor changes email?**  
A: Update `donors.json` with new email. Old email verification will fail.

**Q: Can I manually expire a donor?**  
A: Yes, remove email from `donors.json`. They must re-donate and re-verify.

**Q: How do I disable ads globally (e.g., for maintenance)?**  
A: Set environment variable `DISABLE_ADS=true` and update template logic.

**Q: Is donor email visible in cookies?**  
A: Yes (plain text), but cookie is HTTP-only (not accessible via JavaScript). For enhanced privacy, hash the email.

---

## Next Steps

After successful testing:
1. ✅ Review all test scenarios passed
2. ✅ Verify constitution compliance (code quality, performance, UX)
3. ✅ Commit changes to feature branch: `001-google-ads-donor-removal`
4. ✅ Create pull request with test results
5. ✅ Deploy to production after approval

---

## Support

**Issues**: Report bugs on GitHub  
**Documentation**: See [spec.md](spec.md), [plan.md](plan.md), [data-model.md](data-model.md)  
**Logs**: Check Django logs for donor verification errors
