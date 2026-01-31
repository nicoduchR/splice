# Meta Ads Campaign Setup Guide
## Story 0.4: Meta Ads Campaign Launch

This guide walks you through the complete setup of Meta Business Manager, Meta Pixel installation, and Meta Ads campaign configuration for the Splice landing page.

---

## Prerequisites

- ✅ Landing page deployed at https://splicely.io (Story 0.1)
- ✅ Email collection via Tally.so configured (Story 0.2)
- ✅ DataFast analytics + GDPR consent banner live (Story 0.3)
- 💳 Credit card for Meta Ads billing
- 📧 Facebook/Instagram account with business access

---

## Part 1: Meta Business Manager Setup

### 1.1 Create Meta Business Manager Account

1. Navigate to: **https://business.facebook.com**
2. Click **"Create Account"**
3. Enter business details:
   - **Business Name**: `Splicely` (or `Splice`)
   - **Your Name**: Your legal name
   - **Business Email**: Your professional email
4. Click **"Next"** and complete verification
5. Add business details:
   - Business address (optional but recommended)
   - Website: `https://splicely.io`
   - Category: **"Technology/Software"** or **"Media/Video Production"**

### 1.2 Add Payment Method

1. In Business Manager, go to **"Settings" → "Payments"**
2. Click **"Add Payment Method"**
3. Enter credit card details:
   - Card number, expiry date, CVV
   - Billing address
   - Currency: **USD** (recommended for international targeting)
4. Set as **default payment method**
5. Verify payment method (Meta may charge $1 USD to verify)

### 1.3 Create Instagram Business Account (Optional)

If you want to run ads on Instagram (recommended):

1. Create an Instagram account for Splicely (if not exists)
2. In Business Manager: **"Settings" → "Instagram Accounts"**
3. Click **"Add" → "Connect Your Instagram Account"**
4. Log in to Instagram and authorize connection
5. Convert Instagram account to **Business Account** if not already

---

## Part 2: Meta Pixel Installation

### 2.1 Create Meta Pixel

1. In Business Manager, navigate to: **"Events Manager"**
   - Direct link: https://business.facebook.com/events_manager
2. Click **"Connect Data Sources" → "Web" → "Meta Pixel"**
3. Enter Pixel name: `Splice Landing Page Pixel`
4. Enter website URL: `https://splicely.io`
5. Click **"Create Pixel"**
6. **COPY THE PIXEL ID** (15-digit number, e.g., `123456789012345`)
   - ⚠️ **IMPORTANT**: Save this Pixel ID - you'll need it in the next step

### 2.2 Replace Pixel ID in Code

The Meta Pixel code has already been integrated into `index.html` (Story 0.4), but you need to replace the placeholder Pixel ID.

1. Open `landing-page/index.html`
2. Find the line (around line 399):
   ```javascript
   const META_PIXEL_CONFIG = {
     pixelId: 'PIXEL_ID'  // REPLACE with actual Pixel ID from Meta Events Manager
   };
   ```
3. Replace `'PIXEL_ID'` with your actual Pixel ID:
   ```javascript
   const META_PIXEL_CONFIG = {
     pixelId: '123456789012345'  // Your real Pixel ID
   };
   ```
4. Save the file

### 2.3 Deploy to Vercel and Test

1. Commit changes:
   ```bash
   git add landing-page/index.html
   git commit -m "feat(epic-0): add Meta Pixel ID for Story 0.4"
   ```

2. Deploy to **preview** first (test before prod):
   ```bash
   vercel
   ```
   - Vercel will give you a preview URL (e.g., `https://landing-page-xyz.vercel.app`)

3. **Test Meta Pixel Installation** using Meta Pixel Helper extension:
   - Install browser extension: [Meta Pixel Helper](https://chrome.google.com/webstore/detail/meta-pixel-helper/) (Chrome/Firefox)
   - Visit the preview URL
   - **Accept GDPR consent** (click "Accept" button)
   - Click the Pixel Helper extension icon
   - Verify:
     - ✅ Pixel ID detected (should show your Pixel ID)
     - ✅ PageView event fired
   - If errors appear (red), troubleshoot before deploying to prod

4. **Test Lead Event**:
   - On preview site, click a CTA button to open Tally.so form
   - Submit a test email
   - Check Pixel Helper: Should show **Lead** event fired
   - If Lead event doesn't appear, check browser console for errors

5. **Verify in Meta Events Manager**:
   - Go to: https://business.facebook.com/events_manager
   - Select your Pixel → **"Test Events"** tab
   - Open preview site in new tab
   - Real-time feed should show:
     - ✅ PageView event with URL
     - ✅ Lead event when email submitted (with parameters: content_name, value, currency)
   - If no events appear after 30 seconds, troubleshoot CSP headers or Pixel ID

6. **Deploy to production** (ONLY if tests pass):
   ```bash
   vercel --prod
   ```
   - This deploys to https://splicely.io

7. **Retest on production domain**:
   - Visit https://splicely.io
   - Repeat Pixel Helper and Events Manager tests
   - Ensure PageView and Lead events work in production

---

## Part 3: Meta Ads Campaign Configuration

### 3.1 Access Meta Ads Manager

1. Navigate to: **https://adsmanager.facebook.com**
2. Select your Business Account: **Splicely**
3. Click **"Create" → "Ad"** (green button)

### 3.2 Campaign Level Configuration

**Campaign Objective**:
1. Choose campaign objective: **"Leads"** (primary)
   - If "Leads" is not available, use **"Traffic"** (fallback)
2. Name campaign: `Splice Landing Page - Beta Waitlist 2026 Q1`
3. **Special Ad Categories**: Select **"None"** (we're not in housing/employment/credit/social issues)

**Budget & Schedule**:
1. **Budget Type**: Select **"Lifetime Budget"**
2. **Lifetime Budget**: Enter `150` USD (or 100-150 USD range)
3. **Start Date**: Today's date
4. **End Date**: 7-10 days from today (e.g., if today is Jan 31, set Feb 7-10)
5. **Daily Spend Limit** (Advanced Options):
   - Enable **"Set a daily minimum or maximum spend limit"**
   - **Maximum daily spend**: `20` USD (prevents overspend)
   - This ensures ~15-20 USD/day average over 7-10 days

**Campaign Settings**:
1. **Advantage Campaign Budget** (ACB): **Disable** (we want manual control with small budget)
2. **Bid Strategy**: Select **"Lowest cost"** (default, recommended for small budgets)

Click **"Next"** to Ad Set level.

### 3.3 Ad Set Level Configuration

**Ad Set Name**: `French-Speaking Video Creators - Cold Traffic`

**Conversion Location**:
1. Select **"Website"** (our landing page)

**Performance Goal** (if Lead objective):
1. Select **"Maximize number of conversions"** (get more leads)
2. **Conversion Event**: Select **"Lead"** (the custom event we track with Meta Pixel)

**Dynamic Creative** (optional):
1. **Disable** Dynamic Creative for now (we'll manually control ad variations)

**Budget & Schedule**:
- Inherited from Campaign level (no changes needed)

**Audience Targeting**:

1. **Locations**:
   - Click **"Edit"** next to Locations
   - **Type**: Select **"People living in or recently in this location"**
   - Add countries:
     - 🇫🇷 **France**
     - 🇧🇪 **Belgium** (or specify "Wallonie" region for French-speaking)
     - 🇨🇭 **Switzerland** (or specify "Romandie" cantons: Geneva, Vaud, Neuchâtel, Jura)
     - 🇨🇦 **Canada** (or specify "Quebec" province for French-speaking)

2. **Age**:
   - **Minimum age**: `18`
   - **Maximum age**: `45`

3. **Gender**:
   - Select **"All Genders"** (don't narrow unnecessarily)

4. **Language**:
   - Add **"French (Français)"**
   - This is CRITICAL to ensure francophone targeting

5. **Detailed Targeting** (Interests):
   - Click **"Edit"** next to Detailed Targeting
   - Add interests (use broad targeting per Andromeda algorithm best practices):
     - `Video editing`
     - `Adobe Premiere Pro`
     - `DaVinci Resolve`
     - `Final Cut Pro`
     - `YouTube Creator`
     - `Content creation`
     - `Video production`
     - `Filmmaking`
   - Use **"OR"** matching (not "AND") for broader reach

6. **Advantage+ Audience** (RECOMMENDED):
   - Enable **"Advantage+ Audience"** toggle
   - This allows Meta algorithm to expand beyond your targeting if performance improves
   - Useful with limited budget to maximize efficiency

7. **Exclusions**:
   - Click **"Exclude" → "Custom Audiences"**
   - **Exclude**: People who visited https://splicely.io in last 30 days
   - ⚠️ Note: You need to create a "Website Custom Audience" first:
     - Go to Audiences Manager: https://business.facebook.com/adsmanager/audiences
     - Create **"Custom Audience" → "Website Traffic"**
     - Select: **"People who visited specific web pages"** → URL contains `splicely.io`
     - Timeframe: **Last 30 days**
     - Name audience: `Splice Website Visitors (30d)`
     - Save, then add as exclusion in Ad Set targeting

8. **Review Audience Size Estimate**:
   - Check estimated audience size (bottom right)
   - **Target range**: 50K - 500K potential reach
   - If **<10K**: Too narrow, remove some interests
   - If **>1M**: Too broad, add more specific interests or narrow geography

**Placements**:
1. Select **"Advantage+ Placements"** (Automatic Placements)
   - Meta algorithm optimizes delivery to best-performing placements
   - Includes: Facebook Feed, Instagram Feed, Instagram Stories, Facebook/Instagram Reels
2. **Do NOT** manually select placements (dilutes budget with small spend)

**Optimization & Delivery** (if visible):
- **Conversion Event**: Lead (should be auto-selected)
- **Optimization for Ad Delivery**: **"Conversions"** (if Lead objective)
- **Attribution Setting**: **7-day click, 1-day view** (default)

Click **"Next"** to Ad level.

### 3.4 Ad Level Configuration (Carousel Ad Creatives)

**Ad Setup**:
1. **Ad Name**: `Carousel - Text-Based Editing Value Prop`
2. **Identity**: Select **"Facebook Page"** (if you have one) or **"Instagram Account"**
   - If no Page exists, click **"Create New Page"** → Quick setup for "Splicely"

**Ad Format**:
1. Select **"Carousel"** format (shows multiple scrollable cards)

**Media**:

You need to create **3-5 carousel cards** with screenshots of the landing page.

**Screenshot Preparation** (Do this BEFORE creating ads):
1. Visit https://splicely.io
2. Take screenshots of key sections using browser screenshot tool or OS snipping tool:
   - **Card 1 - Hero Section**: Screenshot of "Edit your videos by selecting text" headline + hero image
   - **Card 2 - Comparison Table**: Screenshot of "Traditional editing vs Splicely" section
   - **Card 3 - Features Grid**: Screenshot of 6 feature cards
   - **Card 4 - CTA Section**: Screenshot of "Ready to edit 10x faster?" final CTA
3. **Image Specs** (CRITICAL):
   - **Resolution**: 1080 x 1080 pixels minimum (square format 1:1)
   - **File format**: JPG or PNG
   - **File size**: Under 1 MB per image (compress if needed using tools like TinyPNG)
   - **No text overlay >20%** of image area (Meta policy)
4. Save screenshots as: `card1-hero.png`, `card2-comparison.png`, `card3-features.png`, `card4-cta.png`

**Upload Carousel Cards**:
1. Click **"Add Media" → "Upload"**
2. Upload all 4 screenshots (or 3-5 depending on your strategy)
3. For **each card**, add:
   - **Headline** (40 characters max):
     - Card 1: `Découpez vidéos via texte` (27 chars)
     - Card 2: `Montage vidéo intelligent` (26 chars)
     - Card 3: `Rapide, précis, sécurisé` (24 chars)
     - Card 4: `Rejoindre la beta` (17 chars)
   - **Destination URL**: `https://splicely.io` (for all cards)
   - **Description** (optional, 30 chars): Leave blank or add short tagline

**Ad Copy**:

1. **Primary Text** (80 characters max for mobile-friendly):
   ```
   Montez vos vidéos 10x plus vite en sélectionnant du texte. Beta gratuite !
   ```
   _(79 characters - pain-driven hook + CTA)_

2. **Headline** (optional, auto-filled from cards):
   - Will use carousel card headlines

3. **Call-to-Action Button**:
   - Select **"Learn More"** (primary) or **"Sign Up"** (if available)
   - French equivalent: **"En savoir plus"** or **"S'inscrire"**

**Tracking** (CRITICAL):
1. **Pixel**: Should auto-select your `Splice Landing Page Pixel`
2. **Conversion Event**: Should auto-select **"Lead"** event
3. Verify these are correctly set (required for conversion tracking)

**Ad Variations** (OPTIONAL - for future A/B testing):

Create 2-3 ad variations by duplicating the ad and changing:
- **Variation 1**: Current copy (pain-driven)
- **Variation 2**: Benefit-driven copy: `L'éditeur vidéo qui comprend votre transcript. Essai gratuit !` (72 chars)
- **Variation 3**: Feature-driven copy: `Transcription IA + Montage par texte. Rejoignez 1000+ créateurs !` (66 chars)

Click **"Publish"** to submit ads for review.

### 3.5 Ad Review and Approval

1. **Review Timeline**:
   - Meta typically reviews ads within **24-48 hours**
   - Status: **"In Review"** → **"Active"** (approved) or **"Rejected"** (policy violation)

2. **Check Review Status**:
   - Go to Ads Manager: https://adsmanager.facebook.com
   - Column **"Delivery"** shows status:
     - ✅ **"Active"**: Campaign is running
     - ⏳ **"In Review"**: Wait for approval
     - ❌ **"Rejected"**: Policy violation, click to see reason

3. **Common Rejection Reasons**:
   - **Misleading Claims**: Don't promise unrealistic results (e.g., "Make $10K/month")
   - **Before/After Images**: Requires disclaimers
   - **Too Much Text**: >20% text overlay on images
   - **Trademark Issues**: Don't claim association with Premiere Pro/Adobe
   - **Landing Page Mismatch**: Ad content must match landing page

4. **If Rejected**:
   - Read rejection reason
   - Edit ad to fix issue
   - Resubmit for review (usually faster 2nd review)

5. **Once Approved**:
   - Campaign status changes to **"Active"**
   - Ads start delivering within 1-2 hours
   - Check **"Delivery"** column to confirm impressions are growing

---

## Part 4: Campaign Monitoring (Daily Checklist)

### First 24 Hours (Critical Monitoring)

- [ ] Campaign status: **"Active"** (not "Learning Limited" or "Not Delivering")
- [ ] Impressions > 0 (ads are being shown)
- [ ] Spend matches expected ~15-20 USD/day
- [ ] No policy violations or disapprovals
- [ ] Meta Pixel tracking PageView events in Events Manager

### Days 1-3 (Learning Phase)

**DO NOT make changes** during learning phase (interrupts algorithm optimization).

**Monitor**:
- [ ] Daily spend on track (~15-20 USD/day)
- [ ] Impressions growing daily
- [ ] Reach increasing (unique users)
- [ ] No delivery issues

**Expected Metrics** (Day 3 benchmark):
- **Impressions**: 5,000 - 15,000
- **Reach**: 3,000 - 10,000
- **CPM**: $5 - $20 USD (cost per 1000 impressions)

### Days 4-7 (Optimization Window)

**Key Metrics to Track**:

1. **CTR (Click-Through Rate)**: Clicks / Impressions × 100
   - ✅ **Target**: >1%
   - ⚠️ If <0.5%: Ad creative not resonating, consider new visuals/copy

2. **CPM (Cost Per Mille)**: Total Spend / (Impressions / 1000)
   - ✅ **Target**: <$20 USD
   - ⚠️ If >$30: Audience too narrow or bidding not competitive

3. **CPC (Cost Per Click)**: Total Spend / Clicks
   - ✅ **Target**: $1-5 USD
   - ⚠️ If >$10: High CPM or low CTR, review targeting

4. **Leads Generated**: Tracked via Meta Pixel "Lead" event
   - ✅ **Target**: 5-15 leads by Day 7 (with 100-150 USD budget)
   - ⚠️ If 0 leads by Day 5: Check Pixel tracking, test form submission

5. **CPL (Cost Per Lead)**: Total Spend / Leads
   - ✅ **Target**: <$10 USD (success criteria)
   - ⚠️ If $10-$20: Acceptable for testing, optimize in Story 0.5
   - ❌ If >$20: Major messaging/targeting issue, pause campaign and pivot

6. **Conversion Rate**: Leads / Clicks × 100
   - ✅ **Target**: >5%
   - ⚠️ If <3%: Landing page issue, not ad issue (check form, CTA, page load)

**Actions to Take** (Days 4-7):
- [ ] Identify best-performing ad variation (highest CTR + lowest CPL)
- [ ] Pause underperforming ads if CPL >$20 USD (stop wasting budget)
- [ ] Reallocate remaining budget to best-performing ad
- [ ] Cross-reference leads with DataFast analytics:
   - Page views from Facebook/Instagram referrer
   - Email submissions with `source: facebook_ad` tracking

### Days 8-10 (Final Push)

- [ ] Campaign nearing end date
- [ ] Final budget allocation to best ads
- [ ] Document learnings for Story 0.5 (A/B Testing):
   - Which ad creative performed best?
   - Which audience interests drove most conversions?
   - What messaging resonated (pain vs benefit vs feature)?
   - CPL achieved vs $10 target?
   - Conversion rate achieved vs 5% target?

### After Campaign Ends (Day 10+)

**Final Metrics Report**:

Calculate overall campaign performance:

```
Total Spend: $150 USD
Total Impressions: ______
Total Clicks: ______
Total Leads: ______

CTR: (Clicks / Impressions) × 100 = _____%
CPM: (Total Spend / Impressions) × 1000 = $______
CPC: Total Spend / Clicks = $______
CPL: Total Spend / Leads = $______
Conversion Rate: (Leads / Clicks) × 100 = _____%
```

**Success Criteria Evaluation** (Epic 0 KPIs):
- ✅ **CPL < $10 USD**: PASS / FAIL
- ✅ **Conversion Rate > 5%**: PASS / FAIL
- ✅ **50+ emails collected**: PASS / FAIL (likely requires Story 0.5 optimization)
- ✅ **CPM < $20 USD**: PASS / FAIL
- ✅ **CTR > 1%**: PASS / FAIL

**Go/No-Go Decision**:
- ✅ **Success**: Conversion >5%, CPL <$10 USD, 50+ emails → Continue full development (Epic 1+)
- ⚠️ **Pivot**: Conversion 2-5%, CPL $10-20 USD → Test new messaging (Story 0.5 A/B Testing)
- ❌ **Stop**: Conversion <2%, CPL >$20 USD → Abandon or radical pivot (not enough demand)

---

## Part 5: Troubleshooting

### Pixel Not Tracking Events

**Symptom**: No PageView or Lead events in Meta Events Manager.

**Solutions**:
1. **Check GDPR Consent**:
   - Visit landing page, clear localStorage
   - Refresh page, GDPR banner should appear
   - Click **"Accept"**, check if Pixel loads
   - Open browser console (F12) → Check for `fbq is not defined` errors

2. **Check CSP Headers**:
   - Open browser console (F12) → Look for CSP errors like:
     ```
     Refused to load script from 'https://connect.facebook.net' because it violates CSP
     ```
   - If CSP error appears, verify `vercel.json` CSP headers include Meta domains:
     - `script-src`: `https://connect.facebook.net`
     - `connect-src`: `https://www.facebook.com https://connect.facebook.net`
     - `img-src`: `https://www.facebook.com`
   - Redeploy to Vercel after CSP fix: `vercel --prod`

3. **Check Pixel ID**:
   - Verify `META_PIXEL_CONFIG.pixelId` in `index.html` matches Pixel ID in Events Manager
   - Common mistake: Extra spaces, quotes, or wrong ID

4. **Test with Pixel Helper**:
   - Install [Meta Pixel Helper](https://chrome.google.com/webstore/detail/meta-pixel-helper/)
   - Visit landing page, accept consent
   - Click extension icon → Should show green checkmark + Pixel ID
   - If red errors, click to see details (common: wrong Pixel ID, CSP block)

### Ads Not Delivering

**Symptom**: Campaign status "Active" but Impressions = 0 after 24 hours.

**Solutions**:
1. **Check Delivery Status**:
   - Go to Ads Manager → Column "Delivery"
   - Common issues:
     - **"Learning Limited"**: Budget too low, audience too narrow (expected with our budget)
     - **"Not Delivering"**: Payment failed, policy violation, or audience too small
     - **"In Review"**: Still pending approval (wait 24-48h)

2. **Check Payment Method**:
   - Go to Business Settings → Payments
   - Verify card is active, not expired, sufficient funds
   - Check email for Meta billing alerts

3. **Check Audience Size**:
   - Ad Set → Edit → Check "Estimated Audience Size" (bottom right)
   - If **<1,000**: Audience too narrow, expand targeting (remove interests or expand geography)

4. **Check Budget**:
   - Meta may not deliver ads if budget is too low for audience size
   - Our $15-20/day budget is borderline; if delivery fails, consider increasing to $25-30/day (hors scope Epic 0)

### High CPL (Cost Per Lead >$20)

**Symptom**: Leads are too expensive, CPL exceeding target.

**Solutions**:
1. **Check CTR (Click-Through Rate)**:
   - If CTR <0.5%: Ad creative not engaging, try new images/copy
   - Test different pain points or benefits in copy

2. **Check Conversion Rate** (Leads / Clicks):
   - If <3%: Landing page issue, not ad issue
   - Check landing page load time, form functionality, CTA clarity
   - Run A/B tests on landing page (hors scope Story 0.4)

3. **Check Targeting**:
   - If CPM >$30: Audience too narrow or competitive
   - Try broader interests or remove exclusions

4. **Pause Campaign**:
   - If CPL consistently >$20 after 5 days, pause campaign
   - Don't waste remaining budget on ineffective targeting
   - Prepare for Story 0.5 pivot (new messaging, audience, or creative)

### No Leads Generated After 3-5 Days

**Symptom**: Clicks are happening, but no Lead events tracked.

**Solutions**:
1. **Test Form Submission Manually**:
   - Click ad → Visit landing page
   - Accept GDPR consent
   - Open Tally.so form
   - Submit test email
   - Check browser console for errors
   - Verify `trackMetaLead()` function is called (add `console.log` for debugging)

2. **Check Meta Pixel Helper**:
   - During form submission, Pixel Helper should show **"Lead"** event
   - If not appearing, check `onSubmit` callback in Tally.so integration

3. **Check Events Manager**:
   - Go to Events Manager → Test Events
   - Submit email on landing page
   - Real-time feed should show Lead event within 10 seconds
   - If not, Pixel integration has bug (check `trackMetaLead()` function)

4. **Cross-Reference with DataFast**:
   - Check DataFast dashboard: https://datafa.st
   - Verify `email_submitted` events are firing (independent validation)
   - If DataFast shows emails but Meta doesn't, Pixel-specific issue

---

## Part 6: Next Steps

### After Campaign Completes (Story 0.4 Done)

1. **Document Results**:
   - [ ] Create final metrics report (CPL, CTR, conversion rate)
   - [ ] Save ad creatives (images, copy) for future reference
   - [ ] Export Ads Manager data as CSV (for retrospective analysis)

2. **Prepare for Story 0.5 (A/B Testing & Campaign Optimization)**:
   - [ ] Identify top-performing ad creative (use as baseline)
   - [ ] Identify top-performing audience interests (refine targeting)
   - [ ] List messaging variations to test (pain vs benefit vs feature)
   - [ ] Determine budget allocation for A/B tests

3. **Run Code Review**:
   - [ ] Execute `/code-review` workflow for Story 0.4
   - [ ] Use **different LLM** than implementation (fresh perspective)
   - [ ] Address any security, GDPR, or performance issues

4. **Optional: Expand Test Coverage**:
   - [ ] Run TEA `/automate` to generate guardrail tests
   - [ ] Add integration tests for Meta Pixel tracking
   - [ ] Test cross-browser Pixel functionality (Safari, Firefox, Chrome)

---

## Reference Links

### Meta Platform Documentation
- [Meta Business Manager](https://business.facebook.com)
- [Meta Ads Manager](https://adsmanager.facebook.com)
- [Meta Events Manager](https://business.facebook.com/events_manager)
- [Meta Pixel Helper Extension](https://chrome.google.com/webstore/detail/meta-pixel-helper/)
- [Meta Advertising Policies](https://www.facebook.com/policies/ads/)

### Project Documentation
- [Story 0.4 File](./../_bmad-output/implementation-artifacts/0-4-meta-ads-campaign-launch.md)
- [Epic 0 Overview](./../_bmad-output/planning-artifacts/epics/epic-0-market-validation-landing-page.md)
- [Story 0.3: DataFast Analytics](./../_bmad-output/implementation-artifacts/0-3-datafast-analytics-integration.md)

### Troubleshooting Resources
- [Meta Ads Delivery Troubleshooting](https://www.facebook.com/business/help/177066696006168)
- [Meta Pixel Troubleshooting](https://www.facebook.com/business/help/742478679120153)
- [Meta Ads Status Dashboard](https://adstatus.app)

---

**Last Updated**: 2026-01-31 (Story 0.4 Implementation)
