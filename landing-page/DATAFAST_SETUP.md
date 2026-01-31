# DataFast Analytics Setup Guide

This guide explains how to configure DataFast analytics for the Splicely landing page.

## Prerequisites

- Landing page deployed on Vercel: https://landing-page-vert-ten-24.vercel.app
- Story 0.3 implementation completed (GDPR banner, tracking code integrated)

## Step 1: Create DataFast Account

1. Visit https://datafa.st
2. Sign up for a free account (supports up to 10,000 page views/month)
3. Confirm your email address

## Step 2: Create Website in DataFast Dashboard

1. Log in to your DataFast account
2. Click "Add Website" or "New Site"
3. Enter the following details:
   - **Website Name**: Splicely Landing Page
   - **Domain**: `landing-page-vert-ten-24.vercel.app`
   - **Timezone**: Your preferred timezone (e.g., Europe/Paris)
4. Click "Create" or "Save"

## Step 3: Obtain Website ID

After creating the website, DataFast will provide a unique **Website ID** (also called `dfid`).

- It will look like: `dfid_a1b2c3d4e5f6g7h8` (format: `dfid_` followed by alphanumeric characters)
- **Copy this ID** - you'll need it in the next step

## Step 4: Update Landing Page Code

1. Open `landing-page/index.html`
2. Find the DataFast configuration section (around line 360):

```javascript
const DATAFAST_CONFIG = {
  websiteId: 'dfid_PLACEHOLDER', // TODO: Replace with real DataFast website ID
  domain: 'landing-page-vert-ten-24.vercel.app'
};
```

3. Replace `dfid_PLACEHOLDER` with your actual Website ID from Step 3:

```javascript
const DATAFAST_CONFIG = {
  websiteId: 'dfid_a1b2c3d4e5f6g7h8', // ✅ Your real DataFast Website ID
  domain: 'landing-page-vert-ten-24.vercel.app'
};
```

4. Save the file

## Step 5: Deploy to Vercel

Deploy the updated code to Vercel:

```bash
cd landing-page
vercel --prod
```

Wait for deployment to complete. Vercel will provide a production URL confirmation.

## Step 6: Verify Analytics Tracking

### Test Page Views

1. Visit your landing page: https://landing-page-vert-ten-24.vercel.app
2. Accept the analytics consent banner when it appears
3. Wait 10-15 seconds
4. Check DataFast dashboard → Should show 1 page view
5. Refresh the page → Page view count should increment

### Test Custom Events

Test each custom event to ensure tracking works:

#### Test CTA Click Events

1. Click the **Header "Download" button** → Should log `cta_click` event with `source: header`
2. Click the **Hero "Download for Mac" button** → Should log `cta_click` event with `source: hero`
3. Click the **Final CTA "Download Splicely now" button** → Should log `cta_click` event with `source: final_cta`

Check DataFast dashboard → Events section → Should show 3 `cta_click` events

#### Test Email Submission Event

1. Click any CTA button to open Tally.so form
2. Enter a test email address (e.g., `test@example.com`)
3. Submit the form
4. Wait 10-15 seconds

Check DataFast dashboard → Events section → Should show 1 `email_submitted` event with properties:
- `source`: header/hero/final_cta (depending on which CTA was clicked)
- `form_language`: en or fr (current page language)

#### Test Scroll Depth Events

1. Scroll down the page to ~25% → Should log `scroll_depth` event with `depth: 25%`
2. Continue scrolling to ~50% → Should log `scroll_depth` event with `depth: 50%`
3. Continue scrolling to ~75% → Should log `scroll_depth` event with `depth: 75%`
4. Scroll to bottom (100%) → Should log `scroll_depth` event with `depth: 100%`

Check DataFast dashboard → Events section → Should show 4 `scroll_depth` events

**Important**: Each scroll milestone should only fire ONCE per session. Scrolling up and down should NOT create duplicate events.

### Test GDPR Consent Flow

1. Open landing page in incognito/private window
2. Verify consent banner appears at bottom of page
3. Click "Decline" → Banner should disappear, no DataFast script loaded
4. Check `localStorage.getItem('analytics_consent')` in console → Should return `'declined'`
5. Refresh page → Banner should NOT reappear, no tracking active
6. Clear localStorage, refresh page
7. Click "Accept" → Banner should disappear, DataFast script loaded
8. Check `localStorage.getItem('analytics_consent')` in console → Should return `'accepted'`
9. Refresh page → Banner should NOT reappear, tracking should be active

## Troubleshooting

### DataFast Script Not Loading

**Symptom**: Console error "Refused to load script from 'https://datafa.st/js/script.js'"

**Solution**: Check CSP headers in `vercel.json`:
- Ensure `script-src` includes `https://datafa.st`
- Ensure `connect-src` includes `https://datafa.st`
- Redeploy to Vercel if CSP was updated

### No Data in Dashboard

**Symptom**: Events fired in console but not appearing in DataFast dashboard

**Possible Causes**:
1. **Wrong Website ID**: Verify `dfid_*` matches the ID from DataFast dashboard
2. **Ad Blocker Active**: Disable ad blockers for testing (uBlock Origin, Privacy Badger, etc.)
3. **Consent Not Given**: Ensure you clicked "Accept" on the GDPR banner
4. **Dashboard Delay**: Wait 15-30 seconds and refresh dashboard (real-time updates have ~10s lag)

### Events Not Firing

**Symptom**: No events logged in DataFast dashboard

**Debug Steps**:
1. Open browser DevTools → Console
2. Check if `window.df` is defined:
   ```javascript
   console.log(typeof window.df); // Should output: "function"
   ```
3. If undefined → DataFast script not loaded (check consent, check CSP, check ad blockers)
4. Manually test event tracking:
   ```javascript
   window.df('event', 'test_event', { test: 'manual' });
   ```
5. Check DataFast dashboard → Should show `test_event` within 15 seconds

### Consent Banner Not Appearing

**Symptom**: No banner shown on first visit

**Solution**:
1. Check `localStorage.getItem('analytics_consent')` in console
2. If it returns a value → Clear localStorage:
   ```javascript
   localStorage.removeItem('analytics_consent');
   ```
3. Refresh page → Banner should appear

**Alternative**: Open landing page in incognito/private window (clean slate, no localStorage)

## Expected Analytics Data

After successful setup and initial traffic from Meta Ads (Story 0.4), you should see:

### Page Views
- Total visits to landing page
- Language breakdown (EN vs FR)
- Traffic sources (Direct, Meta Ads, etc.)

### Custom Events
- `cta_click` - Which CTA buttons convert best (header, hero, final_cta)
- `email_submitted` - Actual conversions (visitors → email leads)
- `scroll_depth` - Engagement metrics (25%, 50%, 75%, 100%)

### Key Metrics for Epic 0
- **Conversion Rate**: (email_submitted / page_views) × 100
- **CTA Click-Through Rate**: (cta_click / page_views) × 100
- **Engagement Score**: Average scroll depth

## DataFast Dashboard Overview

Access your dashboard at: https://datafa.st/dashboard

**Main Sections**:
- **Overview**: Real-time page views, visitors, events
- **Pages**: Most visited pages (should mainly be `/`)
- **Events**: Custom events breakdown with properties
- **Sources**: Traffic sources (referrers, direct, social)
- **Devices**: Desktop vs Mobile vs Tablet
- **Locations**: Geographic data (countries, regions)

## Next Steps

After DataFast is configured and verified:

1. ✅ Story 0.3 Complete: Analytics tracking active
2. ⏭️ Story 0.4: Launch Meta Ads campaign (traffic will flow to DataFast)
3. ⏭️ Story 0.5: Use DataFast data for A/B testing optimization

## Support

- **DataFast Documentation**: https://datafa.st/docs
- **Getting Started Guide**: https://datafa.st/docs/getting-started
- **GDPR Compliance**: https://datafa.st/gdpr
- **Story 0.3 Dev Notes**: See `_bmad-output/implementation-artifacts/0-3-datafast-analytics-integration.md`

---

**Last Updated**: 2026-01-31 (Story 0.3 Implementation)
