# Meta Ads Campaign - Daily Monitoring Checklist
## Story 0.4: Meta Ads Campaign Launch

This checklist helps you monitor the Meta Ads campaign performance over the 7-10 day campaign duration. Follow this daily to track progress, identify issues early, and optimize spend.

---

## Quick Access Links

- **Meta Ads Manager**: https://adsmanager.facebook.com
- **Meta Events Manager**: https://business.facebook.com/events_manager
- **DataFast Analytics**: https://datafa.st (cross-reference)
- **Landing Page**: https://splicely.io
- **Meta Ads Status**: https://adstatus.app (check for platform outages)

---

## Campaign Overview

- **Campaign Name**: `Splice Landing Page - Beta Waitlist 2026 Q1`
- **Budget**: 100-150 USD over 7-10 days
- **Daily Target**: ~15-20 USD/day
- **Start Date**: _________
- **End Date**: _________
- **Objective**: Lead Generation (or Traffic)
- **Target Audience**: French-speaking video creators, 18-45 years old

---

## Day 0-2: Ad Review & Launch Phase

### ✅ Pre-Launch Checklist (Day 0)

- [ ] **Ads Submitted for Review**
  - Status: "In Review" (expected 24-48h approval time)
  - Check Ads Manager → "Delivery" column for status

- [ ] **Meta Pixel Installation Verified**
  - Visit https://splicely.io
  - Accept GDPR consent
  - Check Meta Pixel Helper extension: Green checkmark + Pixel ID shown
  - Check Events Manager → Test Events: PageView event appears

- [ ] **Lead Event Tracking Tested**
  - Submit test email via Tally.so form
  - Check Pixel Helper: Lead event fires
  - Check Events Manager: Lead event appears with parameters (content_name, value, currency)

### Day 1-2: Approval & Initial Delivery

- [ ] **Check Ad Approval Status** (every 12 hours)
  - Go to Ads Manager → "Delivery" column
  - Status should change from "In Review" → "Active"
  - If "Rejected": Read rejection reason, fix issue, resubmit

- [ ] **Monitor First Impressions** (once approved)
  - Check Ads Manager within 2-4 hours of approval
  - Verify Impressions > 0 (ads are delivering)
  - Expected first day: 500-2,000 impressions (varies by time of day)

- [ ] **Check Initial Spend**
  - Verify spend is occurring (~$5-10 USD on Day 1)
  - Check daily spend is NOT exceeding $20 USD cap

- [ ] **No Delivery Issues**
  - Delivery status: "Active" (not "Not Delivering" or "Learning Limited")
  - If "Not Delivering": Check payment method, audience size, policy violations

**DO NOT MAKE CHANGES** during Days 1-2 (interrupts learning phase).

---

## Day 3-5: Learning Phase Monitoring

### Daily Metrics Check (Morning Routine)

Access Ads Manager → Select Campaign → View Metrics:

#### Delivery & Spend

- [ ] **Campaign Status**: Active ✅
- [ ] **Total Spend to Date**: $_______ USD
  - Day 3 target: $45-60 USD cumulative
  - Day 4 target: $60-80 USD cumulative
  - Day 5 target: $75-100 USD cumulative
- [ ] **Daily Spend**: $_______ USD (yesterday)
  - Target: $15-20 USD/day
  - ⚠️ If <$5/day: Delivery issue, check targeting or budget
  - ⚠️ If >$25/day: Exceeding cap, verify daily spend limit setting

#### Reach & Impressions

- [ ] **Impressions (Today)**: _______
  - Day 3 target: 2,000-5,000 impressions/day
- [ ] **Reach (Today)**: _______
  - Reach = unique users who saw ads
  - Should be 60-80% of impressions (rest are repeat views)
- [ ] **Frequency**: _______
  - Frequency = Impressions / Reach
  - Target: 1.2-2.0 (each user sees ad 1-2 times)
  - ⚠️ If >3.0: Audience too small, ad fatigue risk

#### Engagement Metrics

- [ ] **Clicks (Today)**: _______
  - Day 3 target: 50-200 clicks/day
- [ ] **CTR (Click-Through Rate)**: _______%
  - Formula: (Clicks / Impressions) × 100
  - ✅ Target: >1%
  - ⚠️ If 0.5-1%: Acceptable, monitor
  - ❌ If <0.5%: Ad creative not engaging, note for Story 0.5 optimization

#### Cost Metrics

- [ ] **CPM (Cost Per Mille)**: $_______ USD
  - Formula: (Spend / Impressions) × 1000
  - ✅ Target: <$20 USD
  - ⚠️ If $20-30: Higher than target, but acceptable for small budget
  - ❌ If >$30: Audience too competitive or narrow

- [ ] **CPC (Cost Per Click)**: $_______ USD
  - Formula: Spend / Clicks
  - ✅ Target: $1-5 USD
  - ⚠️ If $5-10: Higher than ideal, monitor
  - ❌ If >$10: Review ad creative and targeting

#### Conversion Metrics

- [ ] **Leads Generated (Today)**: _______
  - Check Meta Pixel "Lead" events in Events Manager
  - Day 3-5 target: 1-3 leads/day (with small budget)

- [ ] **CPL (Cost Per Lead) - Cumulative**: $_______ USD
  - Formula: Total Spend / Total Leads
  - ✅ Target: <$10 USD
  - ⚠️ If $10-20: Acceptable for testing, optimize later
  - ❌ If >$20: Major issue, prepare to pause/pivot

- [ ] **Conversion Rate**: _______%
  - Formula: (Leads / Clicks) × 100
  - ✅ Target: >5%
  - ⚠️ If 3-5%: Acceptable, landing page could improve
  - ❌ If <3%: Landing page issue, not ad issue (check form, CTA, load time)

### Cross-Reference with DataFast Analytics

- [ ] **Access DataFast Dashboard**: https://datafa.st
- [ ] **Check Page Views from Facebook/Instagram Referrer**:
  - Should match ~80% of Meta's Click count (tracking discrepancies normal)
- [ ] **Check Email Submissions** (`email_submitted` event):
  - Should match Meta's Lead count (validate Pixel accuracy)
- [ ] **Scroll Depth Analysis**:
  - Are visitors engaging with landing page? (check 50%, 75%, 100% scroll rates)

### Action Items (Days 3-5)

**DO NOT EDIT CAMPAIGN YET** (learning phase still active).

- [ ] **Document Daily Metrics** in spreadsheet:
  - Date, Impressions, Clicks, CTR, CPM, CPC, Leads, CPL, Conversion Rate
- [ ] **Identify Trends**:
  - Is CTR improving or declining?
  - Is CPL trending down (algorithm optimizing)?
  - Any days with zero leads? (check Pixel tracking)
- [ ] **Check for Platform Issues**:
  - Visit https://adstatus.app
  - If Meta ads platform has outage, delivery may be affected (wait for resolution)

---

## Day 6-10: Optimization & Final Push

### Daily Metrics Check (Same as Days 3-5)

Complete the same metrics checklist as Days 3-5 above.

### Advanced Analysis (Day 6+)

#### Ad Creative Performance Breakdown

- [ ] **Access Ads Manager → "Ads" Tab**
- [ ] **Compare Ad Variations** (if multiple ads running):
  - Sort by CTR (descending) → Which ad has highest CTR?
  - Sort by CPL (ascending) → Which ad has lowest CPL?
  - **Identify best performer**: _____________

#### Placement Performance

- [ ] **Access Ads Manager → "Breakdown" → "By Placement"**
- [ ] **Review Performance by Platform**:
  - Facebook Feed: Impressions _____, CTR ___%, CPL $_____
  - Instagram Feed: Impressions _____, CTR ___%, CPL $_____
  - Instagram Stories: Impressions _____, CTR ___%, CPL $_____
  - Facebook/Instagram Reels: Impressions _____, CTR ___%, CPL $_____
- [ ] **Identify Best Placement**: _____________
  - Note for Story 0.5: Focus budget on best-performing placement

#### Audience Insights (if available)

- [ ] **Access Ads Manager → "Audience" Tab**
- [ ] **Review Demographics**:
  - Age range performing best: _____________
  - Gender split: _____________
  - Countries performing best: _____________
- [ ] **Note Insights for Story 0.5 Targeting Refinement**

### Optimization Actions (Days 6-8 ONLY)

**ONLY make changes if campaign is clearly underperforming AND you have >100 clicks** (sufficient data).

#### If CTR <0.5% AND CPL >$20:

- [ ] **Pause worst-performing ad creative** (if multiple ads running)
  - Keep only best-performing ad active
  - Reallocate remaining budget to winner

#### If Leads = 0 by Day 6:

- [ ] **Verify Pixel Tracking**:
  - Submit manual test email
  - Check Events Manager for Lead event
  - If Pixel broken, fix immediately and redeploy

- [ ] **Check Landing Page Conversion**:
  - Test form submission flow
  - Check page load time (<2 seconds?)
  - Verify CTA buttons work on mobile

#### If Budget Running Out Early:

- [ ] **Check Daily Spend Limit**:
  - If campaign will end before Day 7-10, reduce daily cap
  - Example: $120 spent by Day 6, $30 left → Set cap to $10/day for last 3 days

### Final Days (Days 8-10)

- [ ] **Monitor Until Campaign Ends**
  - Continue daily metrics tracking
  - Don't make major changes in final 48 hours
- [ ] **Prepare for Campaign End**:
  - Campaign auto-stops on End Date at midnight
  - Final spend should be within $100-150 USD budget

---

## End of Campaign: Final Report (Day 10+)

### Final Metrics Summary

Access Ads Manager → Select Campaign → View "Lifetime" metrics:

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| **Total Spend** | $_______ USD | $100-150 | ✅ / ⚠️ / ❌ |
| **Total Impressions** | _______ | 10K-50K | ✅ / ⚠️ / ❌ |
| **Total Clicks** | _______ | 500-2000 | ✅ / ⚠️ / ❌ |
| **Total Leads** | _______ | 5-15 | ✅ / ⚠️ / ❌ |
| **CTR (Overall)** | _______% | >1% | ✅ / ⚠️ / ❌ |
| **CPM (Average)** | $_______ | <$20 | ✅ / ⚠️ / ❌ |
| **CPC (Average)** | $_______ | $1-5 | ✅ / ⚠️ / ❌ |
| **CPL (Final)** | $_______ | <$10 | ✅ / ⚠️ / ❌ |
| **Conversion Rate** | _______% | >5% | ✅ / ⚠️ / ❌ |

### Epic 0 Success Criteria Evaluation

- [ ] **CPL < $10 USD**: ✅ PASS / ❌ FAIL
  - Actual CPL: $_______
  - If PASS: Cost-effective lead generation, sustainable for scaling
  - If FAIL: Need messaging/targeting optimization in Story 0.5

- [ ] **Conversion Rate > 5%**: ✅ PASS / ❌ FAIL
  - Actual Conversion Rate: _______%
  - If PASS: Landing page converts well, keep current copy
  - If FAIL: Landing page needs A/B testing (CTA, form, messaging)

- [ ] **50+ Emails Collected** (Total, not just Meta Ads): ✅ PASS / ❌ FAIL
  - Meta Ads emails: _______
  - Organic traffic emails: _______
  - Total emails: _______
  - If FAIL: Expected with limited budget, scale in Story 0.5

- [ ] **CPM < $20 USD**: ✅ PASS / ❌ FAIL
  - Actual CPM: $_______
  - If PASS: Efficient reach, audience not oversaturated
  - If FAIL: Audience too competitive, try broader targeting

- [ ] **CTR > 1%**: ✅ PASS / ❌ FAIL
  - Actual CTR: _______%
  - If PASS: Ad creative engaging, strong value proposition
  - If FAIL: Creative needs improvement (images, copy, CTA)

### Go/No-Go Decision Matrix

Based on final results, determine Epic 0 outcome:

#### ✅ **SUCCESS** (Continue to Epic 1+ Full Development)
- Conversion Rate >5% ✅
- CPL <$10 USD ✅
- 50+ emails collected ✅ (or strong trend showing achievable with more budget)
- **Decision**: Market demand validated, proceed with desktop app development

#### ⚠️ **PIVOT** (Story 0.5 A/B Testing & Optimization)
- Conversion Rate 2-5% ⚠️
- CPL $10-20 USD ⚠️
- 10-50 emails collected ⚠️
- **Decision**: Some demand, but needs optimization before scaling
- **Action**: Run Story 0.5 to test new messaging, audiences, and creatives

#### ❌ **STOP** (Abandon or Radical Pivot)
- Conversion Rate <2% ❌
- CPL >$20 USD ❌
- <10 emails collected ❌
- **Decision**: Insufficient demand or wrong product-market fit
- **Action**: Conduct user interviews, pivot value proposition, or abandon

### Key Learnings Documentation

#### What Worked? ✅

- **Best-performing ad creative**: _____________
  - Why did it resonate? (pain point, benefit, feature-driven?)
- **Best-performing audience interests**: _____________
  - Which targeting drove most conversions?
- **Best-performing placement**: _____________
  - Facebook Feed? Instagram Stories? Reels?
- **Optimal messaging angle**: _____________
  - Pain-driven? Benefit-driven? Feature-driven?

#### What Didn't Work? ❌

- **Worst-performing ad creative**: _____________
  - Why did it fail? (unclear value prop, bad visuals?)
- **Ineffective targeting**: _____________
  - Which interests yielded high CPL or low CTR?
- **Underperforming placements**: _____________
  - Which platforms wasted budget?

#### Surprises & Insights 💡

- **Unexpected findings**: _____________
  - Did a specific age group perform better than expected?
  - Did certain geographic regions convert better?
  - Did time of day affect CTR?

#### Action Items for Story 0.5

- [ ] **Messaging Tests**:
  - Test #1: _____________
  - Test #2: _____________
  - Test #3: _____________

- [ ] **Audience Refinements**:
  - Narrow to best-performing interests: _____________
  - Expand to lookalike audience (if 100+ emails collected)

- [ ] **Creative Improvements**:
  - New images: _____________
  - New copy angles: _____________
  - New CTA variations: _____________

- [ ] **Budget Recommendations**:
  - If successful: Increase to $300-500 USD for Story 0.5 (better learning phase)
  - If pivot needed: Keep $100-150 USD, focus on testing variations

### Export Campaign Data

- [ ] **Download CSV Report from Ads Manager**:
  - Go to Ads Manager → Select Campaign
  - Click "Export" → "Export Table Data"
  - Save as: `Meta_Ads_Campaign_Story_0.4_Final_Report.csv`

- [ ] **Save Ad Creatives**:
  - Download all carousel images used
  - Copy all ad copy variations
  - Store in project folder: `landing-page/ad-creatives/`

- [ ] **Screenshot Final Metrics**:
  - Take screenshot of Ads Manager dashboard (lifetime metrics)
  - Save as: `Meta_Ads_Final_Dashboard_Story_0.4.png`

### Next Steps

- [ ] **Run Epic 0 Retrospective** (if last story in Epic 0):
  - Use `/retrospective` skill to analyze Epic 0 overall
  - Document lessons learned across Stories 0.1-0.5

- [ ] **Update Sprint Status**:
  - Mark Story 0.4 as "done" in sprint-status.yaml

- [ ] **Run Code Review**:
  - Execute `/code-review` workflow for Story 0.4
  - Use different LLM than implementation
  - Address any security or GDPR compliance issues

- [ ] **Prepare Story 0.5** (if continuing):
  - Create next story for A/B Testing & Campaign Optimization
  - Use learnings from Story 0.4 to inform test variations

---

## Troubleshooting Quick Reference

### Issue: Ads Not Delivering (Impressions = 0)

**Check**:
1. Campaign Status: "Active"? (not "In Review" or "Paused")
2. Payment Method: Valid card, sufficient funds?
3. Audience Size: >1,000 potential reach?
4. Budget: Sufficient for audience size?

**Fix**: See [META_ADS_SETUP.md Part 5: Troubleshooting](./META_ADS_SETUP.md#part-5-troubleshooting)

### Issue: High CPL (>$20 USD)

**Check**:
1. CTR: <1%? (ad creative issue)
2. Conversion Rate: <3%? (landing page issue)
3. CPM: >$30? (targeting too narrow or competitive)

**Fix**:
- Pause worst ad, keep best
- Test landing page form submission flow
- Broaden targeting (remove interests or expand geography)

### Issue: No Leads Generated (Leads = 0)

**Check**:
1. Meta Pixel Helper: Lead event fires on form submission?
2. Events Manager → Test Events: Lead event appears?
3. DataFast: `email_submitted` events tracked?

**Fix**:
- Test manual email submission
- Check `trackMetaLead()` function in index.html
- Verify Pixel ID is correct
- Check CSP headers allow Meta domains

### Issue: Budget Spent Too Fast

**Check**:
1. Daily Spend Limit: Set to $20 USD max?
2. Campaign End Date: Correct (7-10 days from start)?

**Fix**:
- Edit Ad Set → Budget & Schedule → Reduce daily cap to $10-15 USD
- Pause campaign temporarily if spending too fast

---

## Daily Monitoring Log Template

Copy this table to a spreadsheet and fill in daily:

| Date | Status | Impressions | Clicks | CTR | CPM | CPC | Leads | CPL | Conv Rate | Notes |
|------|--------|-------------|--------|-----|-----|-----|-------|-----|-----------|-------|
| Day 1 |        |             |        |     |     |     |       |     |           |       |
| Day 2 |        |             |        |     |     |     |       |     |           |       |
| Day 3 |        |             |        |     |     |     |       |     |           |       |
| Day 4 |        |             |        |     |     |     |       |     |           |       |
| Day 5 |        |             |        |     |     |     |       |     |           |       |
| Day 6 |        |             |        |     |     |     |       |     |           |       |
| Day 7 |        |             |        |     |     |     |       |     |           |       |
| Day 8 |        |             |        |     |     |     |       |     |           |       |
| Day 9 |        |             |        |     |     |     |       |     |           |       |
| Day 10 |       |             |        |     |     |     |       |     |           |       |

**Formulas**:
- **CTR** = (Clicks / Impressions) × 100
- **CPM** = (Daily Spend / Impressions) × 1000
- **CPC** = Daily Spend / Clicks
- **CPL** = Cumulative Spend / Cumulative Leads
- **Conv Rate** = (Leads / Clicks) × 100

---

**Last Updated**: 2026-01-31 (Story 0.4 Implementation)
