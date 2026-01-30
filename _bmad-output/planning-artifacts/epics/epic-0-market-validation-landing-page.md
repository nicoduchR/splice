# Epic 0: Market Validation & Landing Page

Valider la demande marché pour Splice avant d'investir dans le développement complet de l'application desktop en lançant une landing page et une campagne publicitaire ciblée.

## Story 0.1: Landing Page Deployment

As a entrepreneur,
I want to deploy the existing landing page design to production,
So that I can start collecting early adopter emails and validate market demand immediately.

**Acceptance Criteria:**

**Given** the HTML/CSS code exists in `/designs/splice_product_landing_page/code.html`
**When** deployed to Vercel with custom domain
**Then** landing page is accessible publicly on production domain
**And** page loads in less than 2 seconds on desktop and mobile
**And** all sections render correctly (Hero, Comparison, Features, CTA, Footer)
**And** responsive design works on mobile, tablet, and desktop
**And** SSL certificate is active (HTTPS)

---

## Story 0.2: Email Collection Setup with Tally.so

As a entrepreneur,
I want to collect email addresses from interested visitors,
So that I can build a waitlist of early adopters to contact when the product launches.

**Acceptance Criteria:**

**Given** a visitor lands on the page and is interested
**When** they click on any "Télécharger" CTA button
**Then** a Tally.so form popup or embed appears
**And** form requests email address and optional name
**And** form includes RGPD consent checkbox
**And** on successful submission, user sees confirmation message "Merci! Nous vous contacterons bientôt pour l'accès beta."
**And** email is saved in Tally.so dashboard
**And** entrepreneur receives email notification for each new signup
**And** form design matches landing page dark theme aesthetic

---

## Story 0.3: DataFast Analytics Integration

As a entrepreneur,
I want to track visitor behavior and conversion metrics on the landing page,
So that I can measure campaign performance and optimize conversion rates.

**Acceptance Criteria:**

**Given** DataFast account is created and tracking script obtained
**When** integrated into landing page `<head>` section
**Then** all page views are tracked in DataFast dashboard
**And** custom events are tracked:
  - Event "cta_click" with button location (header, hero, final_cta)
  - Event "email_submitted" with source location
  - Event "scroll_depth" at 25%, 50%, 75%, 100%
**And** real-time metrics visible in DataFast dashboard
**And** tracking works without blocking page load
**And** RGPD compliance banner shown if required

---

## Story 0.4: Meta Ads Campaign Launch

As a entrepreneur,
I want to launch targeted Instagram and Facebook ads,
So that I can drive qualified traffic to the landing page and test market demand with real budget.

**Acceptance Criteria:**

**Given** landing page is live with tracking and email collection
**When** Meta Ads campaign is created and launched
**Then** campaign objective is set to "Lead Generation" or "Traffic"
**And** budget is set to 100-150 USD over 7-10 days
**And** daily budget cap configured to prevent overspend
**And** target audiences include:
  - Interests: "Video editing", "Adobe Premiere Pro", "DaVinci Resolve", "YouTube Creator", "Content Creation"
  - Geographic: France, Belgium, Switzerland, Canada (French-speaking)
  - Age: 18-45
**And** ad creatives include:
  - Carousel with landing page screenshots
  - Copy highlighting "Découpez vos vidéos en sélectionnant du texte"
  - Clear CTA "Rejoindre la beta" or "Découvrir Splice"
**And** Meta Pixel installed on landing page for conversion tracking
**And** campaign performance metrics visible in Meta Ads Manager
**And** cost per lead (CPL) calculated and monitored

---

## Story 0.5: A/B Testing & Campaign Optimization

As a entrepreneur,
I want to test variations of messaging and optimize ad performance,
So that I can improve conversion rates and reduce cost per lead.

**Acceptance Criteria:**

**Given** initial campaign has run for 3-5 days with sufficient data
**When** analyzing DataFast and Meta Ads metrics
**Then** conversion rate (visitors → email signups) is measured
**And** cost per lead is calculated
**And** A/B test variations are created for:
  - Different hero headlines
  - CTA button wording ("Rejoindre la beta" vs "Essai gratuit" vs "Télécharger gratuitement")
  - Ad creative variations (different screenshots, videos)
**And** winning variations are identified based on conversion rate
**And** budget is reallocated to best-performing ads
**And** campaign is paused or continued based on validation criteria:
  - ✅ Success: Conversion rate >5%, CPL <10 USD, 50+ emails collected
  - ⚠️ Pivot: Conversion rate 2-5%, test new messaging
  - ❌ Stop: Conversion rate <2%, CPL >20 USD

---
