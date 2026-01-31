# DataFast Analytics Testing Checklist

**Story**: 0.3 - DataFast Analytics Integration
**Test Date**: _________
**Tester**: _________
**Environment**: Production (https://landing-page-vert-ten-24.vercel.app)

## Pre-Test Setup

- [ ] DataFast account created at https://datafa.st
- [ ] Website configured in DataFast dashboard
- [ ] Website ID (`dfid_*`) replaced in `index.html` (no more `dfid_PLACEHOLDER`)
- [ ] Code deployed to Vercel production
- [ ] CSP headers include `https://datafa.st` in vercel.json
- [ ] DataFast dashboard accessible and website selected

---

## 1. Functional Testing

### 1.1 Page Views Tracking

- [ ] **Load landing page** → Verify page view logged in DataFast dashboard
- [ ] **Switch to French** (click flag 🇫🇷) → Verify separate page view or language property
- [ ] **Refresh page** → Verify new page view increments counter
- [ ] **Real-time updates** → Dashboard shows events within 10-15 seconds

**Expected Result**: Each page load = 1 page view in dashboard
**Actual Result**: _______________

### 1.2 CTA Click Events

Test all 3 CTA button locations:

- [ ] **Click Header "Download" button** → Event `cta_click` logged with `source: header`
- [ ] **Click Hero "Download for Mac" button** → Event `cta_click` logged with `source: hero`
- [ ] **Click Final CTA "Download Splicely now" button** → Event `cta_click` logged with `source: final_cta`
- [ ] **Verify event properties** in DataFast dashboard → Each event shows correct `source` property

**Expected Result**: 3 `cta_click` events with different `source` values
**Actual Result**: _______________

### 1.3 Email Submitted Events

Test email submission tracking:

- [ ] **Click header CTA** → Tally form opens
- [ ] **Submit test email** (e.g., `test@example.com`) → Form closes after 3s
- [ ] **Check DataFast dashboard** → Event `email_submitted` logged with `source: header` and `form_language: en` or `fr`
- [ ] **Repeat from hero CTA** → Event logged with `source: hero`
- [ ] **Repeat from final CTA** → Event logged with `source: final_cta`

**Expected Result**: 3 `email_submitted` events with correct `source` and `form_language`
**Actual Result**: _______________

### 1.4 Scroll Depth Tracking

Test scroll milestones:

- [ ] **Scroll to ~25% of page** → Event `scroll_depth` with `depth: 25%` logged
- [ ] **Continue to ~50%** → Event `scroll_depth` with `depth: 50%` logged
- [ ] **Continue to ~75%** → Event `scroll_depth` with `depth: 75%` logged
- [ ] **Scroll to bottom (100%)** → Event `scroll_depth` with `depth: 100%` logged
- [ ] **Scroll back up and down** → NO duplicate events (each milestone fires only once)

**Expected Result**: 4 `scroll_depth` events, no duplicates
**Actual Result**: _______________

### 1.5 GDPR Consent Flow

Test consent banner and script loading:

#### First Visit (No Consent)

- [ ] **Open page in incognito window** → Consent banner appears at bottom
- [ ] **Verify banner bilingual** → Text switches EN ↔ FR with language toggle
- [ ] **Click "Decline"** → Banner disappears immediately
- [ ] **Check `localStorage.analytics_consent`** (DevTools Console) → Value = `'declined'`
- [ ] **Verify DataFast NOT loaded** → `window.df` = `undefined`
- [ ] **Refresh page** → Banner does NOT reappear, no tracking

#### Accept Consent

- [ ] **Clear localStorage** → `localStorage.clear()` in console
- [ ] **Refresh page** → Banner appears again
- [ ] **Click "Accept"** → Banner disappears immediately
- [ ] **Check `localStorage.analytics_consent`** → Value = `'accepted'`
- [ ] **Verify DataFast loaded** → `window.df` = `function`
- [ ] **Refresh page** → Banner does NOT reappear, tracking active
- [ ] **Perform action** (e.g., scroll) → Events logged in dashboard

**Expected Result**: Consent properly stored, DataFast loads only after accept
**Actual Result**: _______________

---

## 2. Performance Testing

### 2.1 Page Load Impact

- [ ] **Baseline load time** (before accepting analytics): < 2 seconds
- [ ] **Load time with DataFast** (after accepting): Still < 2 seconds
- [ ] **DataFast script.js size**: ~4KB (check Network tab)
- [ ] **Script load time**: < 200ms
- [ ] **`defer` attribute** prevents render blocking (verify in Network → Waterfall)

**Tool**: Chrome DevTools → Network tab → Disable cache → Hard refresh
**Expected Result**: Page load remains fast (< 2s), no blocking
**Actual Result**: _______________

### 2.2 Script Loading Order

- [ ] **Tailwind CDN** loads first
- [ ] **Tally.so script** loads asynchronously
- [ ] **DataFast script** loads after consent with `defer`
- [ ] **No console errors** during load
- [ ] **All scripts non-blocking** (page renders before all scripts finish)

**Expected Result**: Smooth page load, no errors
**Actual Result**: _______________

---

## 3. Cross-Browser Testing

### 3.1 Desktop Browsers

Test on each browser:

| Browser | Version | Page Views | Events Fire | GDPR Banner | Notes |
|---------|---------|------------|-------------|-------------|-------|
| Chrome/Edge | Latest | [ ] | [ ] | [ ] | _____ |
| Safari (macOS) | Latest | [ ] | [ ] | [ ] | _____ |
| Firefox | Latest | [ ] | [ ] | [ ] | _____ |

**Expected Result**: All events fire correctly, zero console errors on all browsers
**Actual Result**: _______________

### 3.2 Mobile Browsers

Test on real devices or emulators:

| Device | Browser | Page Views | Events Fire | GDPR Banner Usable | Notes |
|--------|---------|------------|-------------|---------------------|-------|
| iOS Safari | Latest | [ ] | [ ] | [ ] | _____ |
| Android Chrome | Latest | [ ] | [ ] | [ ] | _____ |

**Expected Result**: Touch interactions tracked, banner readable on small screens
**Actual Result**: _______________

---

## 4. Ad Blocker Testing

### 4.1 Expected Behavior with Ad Blockers

- [ ] **Install uBlock Origin** (or similar ad blocker)
- [ ] **Visit landing page** → Page functions normally (no broken UI)
- [ ] **Accept analytics** → DataFast script blocked by ad blocker
- [ ] **Check `window.df`** → `undefined` (expected)
- [ ] **Click CTAs, submit form, scroll** → No console errors (defensive checks work)
- [ ] **Verify page usability** → All features work despite blocked analytics

**Expected Result**: ~30% of users will block analytics (acceptable). Page still works perfectly.
**Actual Result**: _______________

---

## 5. GDPR Compliance Verification

### 5.1 Consent Enforcement

- [ ] **No consent given** → DataFast script NOT loaded (check Network tab)
- [ ] **User declines** → No tracking occurs (verify no `df()` calls in console)
- [ ] **User accepts** → Tracking begins immediately
- [ ] **Consent persists** → Refresh page, tracking continues without re-asking

**Expected Result**: Strict consent enforcement, no tracking before accept
**Actual Result**: _______________

### 5.2 Privacy Verification

- [ ] **Check DataFast dashboard data** → Only anonymous behavioral data (clicks, scrolls, page views)
- [ ] **Verify NO personal data** → No emails, names, or PII sent to DataFast
- [ ] **Email submissions** → Event tracked, but email address NOT sent (only event occurrence)

**Expected Result**: Full GDPR compliance, no PII leakage
**Actual Result**: _______________

---

## 6. Conversion Funnel Testing

Test complete user journey:

### 6.1 Sample Session

- [ ] **Load page** → 1 page view
- [ ] **Scroll to 50%** → 1 `scroll_depth` event (25%), 1 `scroll_depth` event (50%)
- [ ] **Click hero CTA** → 1 `cta_click` event (`source: hero`)
- [ ] **Submit email** → 1 `email_submitted` event (`source: hero`, `form_language: en/fr`)

**Expected Result**: Complete funnel tracked in DataFast dashboard
**Actual Result**: _______________

### 6.2 Metrics Calculation (Manual)

From DataFast dashboard, calculate:

- **Page Views (PV)**: _____ (count)
- **CTA Clicks**: _____ (sum of all `cta_click` events)
- **Email Submissions**: _____ (count of `email_submitted` events)
- **Click-Through Rate (CTR)**: (CTA Clicks / PV) × 100 = _____%
- **Conversion Rate**: (Email Submissions / PV) × 100 = _____%

**Expected Result**: Metrics accurately reflect test session
**Actual Result**: _______________

---

## 7. Bilingual Support Testing

### 7.1 Language Switching

- [ ] **Load page in English** → GDPR banner shows English text
- [ ] **Accept consent** → DataFast loads
- [ ] **Click English CTA** → Event tracked with `form_language: en`
- [ ] **Submit form** → `email_submitted` event has `form_language: en`
- [ ] **Switch to French** (flag 🇫🇷) → Page translates
- [ ] **Click French CTA** → Event tracked
- [ ] **Submit form** → `email_submitted` event has `form_language: fr`

**Expected Result**: Language property correctly captured in events
**Actual Result**: _______________

---

## 8. Edge Cases & Error Handling

### 8.1 Script Load Failures

- [ ] **Simulate DataFast CDN down** (block https://datafa.st in hosts file)
- [ ] **Load page** → Page functions normally, no broken UI
- [ ] **Click CTAs** → No console errors (defensive `if (window.df)` checks work)
- [ ] **Verify graceful degradation** → Analytics fail silently, core functionality intact

**Expected Result**: Robust error handling, no user-facing issues
**Actual Result**: _______________

### 8.2 Rapid Actions

- [ ] **Click multiple CTAs rapidly** → All events logged (no rate limiting issues)
- [ ] **Scroll very fast** → Milestones tracked correctly (no missed events)
- [ ] **Submit multiple forms** → All submissions tracked

**Expected Result**: High-frequency actions handled correctly
**Actual Result**: _______________

---

## 9. Dashboard Verification

### 9.1 Real-Time Dashboard

- [ ] **Access DataFast dashboard** → Website selected correctly
- [ ] **Verify real-time section** → Shows active visitors (during testing)
- [ ] **Check page views graph** → Increments match test sessions
- [ ] **Review custom events** → All 3 event types visible (`cta_click`, `email_submitted`, `scroll_depth`)

**Expected Result**: Dashboard accurately reflects test activity
**Actual Result**: _______________

### 9.2 Event Properties

For each event type, verify properties are captured:

| Event Type | Expected Properties | Visible in Dashboard | Notes |
|------------|---------------------|----------------------|-------|
| `cta_click` | `source: header/hero/final_cta` | [ ] | _____ |
| `email_submitted` | `source`, `form_language` | [ ] | _____ |
| `scroll_depth` | `depth: 25%/50%/75%/100%` | [ ] | _____ |

**Expected Result**: All event properties captured and queryable
**Actual Result**: _______________

---

## 10. Regression Testing

### 10.1 Previous Features Still Work

Ensure Story 0.1 and 0.2 functionality intact:

- [ ] **Landing page loads** → Bilingual, Tailwind styling applied
- [ ] **Language switcher** → EN ↔ FR toggle works
- [ ] **Tally.so forms** → Open correctly, submit successfully
- [ ] **Email collection** → Forms submit to Tally.so backend
- [ ] **SEO meta tags** → Present in `<head>`
- [ ] **Performance** → Page load < 2s (Story 0.1 baseline: 0.12s)

**Expected Result**: No regressions, all previous features functional
**Actual Result**: _______________

---

## Final Checklist Summary

### All Tests Passed?

- [ ] **Functional Testing** (Page views, CTA clicks, email submission, scroll depth, GDPR)
- [ ] **Performance Testing** (Load time < 2s, no blocking)
- [ ] **Cross-Browser Testing** (Chrome, Safari, Firefox, iOS, Android)
- [ ] **Ad Blocker Testing** (Graceful degradation)
- [ ] **GDPR Compliance** (Consent enforcement, no PII)
- [ ] **Conversion Funnel** (Complete journey tracked)
- [ ] **Bilingual Support** (EN/FR events tracked correctly)
- [ ] **Edge Cases** (Error handling, rapid actions)
- [ ] **Dashboard Verification** (Real-time data, event properties)
- [ ] **Regression Testing** (Previous stories unaffected)

### Test Results

**Overall Status**: [ ] PASS  [ ] FAIL  [ ] PARTIAL

**Issues Found**: _______________

**Action Items**: _______________

---

## Sign-Off

**Tester Name**: _________
**Test Date**: _________
**Approved By**: _________
**Ready for Production**: [ ] YES  [ ] NO

---

**Related Documents**:
- Setup Guide: `landing-page/DATAFAST_SETUP.md`
- Story File: `_bmad-output/implementation-artifacts/0-3-datafast-analytics-integration.md`
- Code Review Checklist: (Story 0.3 code-review workflow)
