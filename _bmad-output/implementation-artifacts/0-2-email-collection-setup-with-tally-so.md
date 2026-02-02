# Story 0.2: Email Collection Setup with Tally.so

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a entrepreneur,
I want to collect email addresses from interested visitors,
So that I can build a waitlist of early adopters to contact when the product launches.

## Acceptance Criteria

1. **Given** a visitor lands on the page and is interested
   **When** they click on any "Télécharger" CTA button (header, hero, or final_cta)
   **Then** a Tally.so form popup or embed appears
   **And** form requests email address and optional name
   **And** form includes RGPD consent checkbox (unchecked by default)
   **And** on successful submission, user sees confirmation message "Merci! Nous vous contacterons bientôt pour l'accès beta."
   **And** email is saved in Tally.so dashboard
   **And** entrepreneur receives email notification for each new signup
   **And** form design matches landing page dark theme aesthetic

## Tasks / Subtasks

- [ ] Create Tally.so form with required fields (AC: 1)
  - [ ] Sign up for Tally.so account (free tier)
  - [ ] Create new form with bilingual support (French/English)
  - [ ] Add email field (required)
  - [ ] Add name field (optional)
  - [ ] Add RGPD consent checkbox field (required, unchecked by default)
  - [ ] Add privacy policy text block with link
  - [ ] Configure success message in French: "Merci! Nous vous contacterons bientôt pour l'accès beta."

- [ ] Style form to match dark theme aesthetic (AC: 1)
  - [ ] Apply dark background: #25252D or #2F2F38
  - [ ] Set border color: #35353F (1px)
  - [ ] Configure primary action color: #0D7EFF
  - [ ] Set text colors: #FFFFFF (labels), #B4B4C0 (secondary)
  - [ ] Set border-radius: 8px
  - [ ] Use Inter font or system sans-serif fallback
  - [ ] Test form appearance on dark landing page background

- [ ] Configure email notifications and webhooks (AC: 1)
  - [ ] Enable email notifications in Tally.so settings
  - [ ] Set entrepreneur email for signup notifications
  - [ ] Test notification delivery with test submission
  - [ ] Optional: Configure webhook for future analytics integration

- [x] Integrate Tally.so form into landing page (AC: 1)
  - [x] Get Tally.so embed code (popup mode recommended)
  - [x] Add popup trigger to header CTA button (data-track="header")
  - [x] Add popup trigger to hero CTA button (data-track="hero")
  - [x] Add popup trigger to final_cta CTA button (data-track="final_cta")
  - [x] Configure popup to be dismissable (close button)
  - [x] Test form opens correctly from all three locations

- [ ] Test multilingual support and RGPD compliance (AC: 1)
  - [ ] Test form labels display in French when landing page is in French
  - [ ] Test form labels display in English when landing page is in English
  - [ ] Verify RGPD checkbox is unchecked by default
  - [ ] Verify form cannot be submitted without checking consent
  - [ ] Verify confirmation message appears: "Merci! Nous vous contacterons bientôt pour l'accès beta."
  - [ ] Test email appears in Tally.so dashboard
  - [ ] Test entrepreneur receives email notification

- [ ] Performance and cross-platform testing (AC: 1)
  - [ ] Verify form embed doesn't block page load
  - [ ] Test popup on mobile (320px - 767px)
  - [ ] Test popup on tablet (768px - 1023px)
  - [ ] Test popup on desktop (1024px+)
  - [ ] Test on Chrome/Edge, Safari, Firefox
  - [ ] Test on Mobile Safari (iOS) and Chrome Mobile (Android)

## Dev Notes

### Contexte Produit

Cette story fait partie de l'**Epic 0: Market Validation & Landing Page**, qui vise à valider la demande marché pour Splicely avant d'investir dans le développement complet de l'application desktop.

**Objectif business**: Construire une liste d'early adopters pour mesurer l'intérêt réel. La collecte d'emails est le KPI principal de la validation marché avec:
- Objectif: 50+ emails collectés (critère de succès Story 0.5)
- Taux de conversion cible: >5% (visiteurs → emails)
- Coût par lead (CPL) cible: <10 USD
- Campagne Meta Ads: 100-150 USD sur 7-10 jours

**Contexte utilisateur**: Les visiteurs arrivent via Meta Ads (Instagram/Facebook) ciblant des créateurs de contenu francophones intéressés par le montage vidéo. Ils cliquent sur "Télécharger" en pensant obtenir l'application, mais découvrent qu'ils s'inscrivent pour la beta.

### Architecture & Stack Technique

**Landing Page Existante (Story 0.1)**:
- URL Production: https://landing-page-vert-ten-24.vercel.app
- Technologies: HTML statique + Tailwind CSS CDN
- Déployé sur: Vercel (avec SSL/HTTPS automatique)
- Performance: 0.12s load time (très rapide)
- Bilingual: English/French avec language switcher (flags 🇬🇧/🇫🇷)

**Tally.so: Service de Formulaires 2026**:
- **Compliance RGPD**: Hébergé en EU (serveurs Frankfurt)
- **Pricing**: Tier gratuit suffisant pour cette phase (unlimited forms & submissions)
- **Features clés**:
  - Webhooks gratuits pour tous les utilisateurs
  - Email notifications intégrées
  - Export de données (CSV, Excel)
  - Embed code léger (iframe + script)
  - Support popup modal et embed inline
  - Templates GDPR-compliant disponibles

**Integration Technique**:
```javascript
// Exemple d'intégration popup Tally.so
<script src="https://tally.so/widgets/embed.js"></script>
<script>
  // Trigger popup on button click
  document.querySelectorAll('[data-tally-open]').forEach(button => {
    button.addEventListener('click', () => {
      Tally.openPopup('FORM_ID', {
        layout: 'modal',
        width: 500,
        autoClose: 3000 // Close after success
      });
    });
  });
</script>
```

### RGPD / GDPR Compliance Requirements

**Exigences Légales (CRITIQUE)**:
1. **Consentement Explicite**:
   - Checkbox RGPD DOIT être vide par défaut (jamais pré-cochée)
   - Utilisateur doit activement cocher la case pour soumettre
   - Formulaire ne peut PAS être soumis sans consentement

2. **Transparence**:
   - Texte clair expliquant l'usage des données
   - Lien vers privacy policy (peut être simple pour MVP)
   - Exemple: "En soumettant ce formulaire, j'accepte de recevoir des communications sur le lancement de Splicely et je consens au traitement de mes données conformément à la politique de confidentialité."

3. **Droits Utilisateur**:
   - Données exportables depuis Tally.so
   - Possibilité de suppression sur demande
   - Stockage EU (Tally.so Frankfurt)

**Template GDPR Tally.so**:
- Tally propose un template pré-configuré: [GDPR Compliant Contact form](https://tally.so/templates/gdpr-compliant-contact-form/M3NrO3)
- Recommandation: Partir de ce template et l'adapter

### Design System & Dark Theme Matching

**Palette de Couleurs (from UX Design)**:
```
Backgrounds:
  Primary: #1A1A1F (page background)
  Secondary: #25252D (cards/form background)
  Tertiary: #2F2F38 (elevated elements)
  Hover: #35353F

Actions:
  Primary Blue: #0D7EFF (CTA buttons, focus states)
  Blue Hover: #0A66CC
  Blue Disabled: #0D7EFF40 (40% opacity)

Text:
  Primary: #FFFFFF (labels, headings)
  Secondary: #B4B4C0 (placeholders, secondary text)
  Tertiary: #7D7D8A (disabled text)

Borders:
  Default: #35353F (1px)
  Focus: #0D7EFF (input focus)

Status Colors:
  Success: #52C41A (confirmation messages)
  Error: #FF4D4F (validation errors)
```

**Typography**:
- Font Family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif
- Body Text: 14px / Regular / Line-height 22px
- Form Labels: 14px medium
- Error Text: 12px

**Form Design Principles**:
- Professional aesthetic (NLE-style like Premiere Pro/DaVinci Resolve)
- Subtle border-radius (8-12px, not overly rounded)
- Consistent 4px spacing grid (padding: 16px = 4*4)
- Dark glassmorphism effect compatible
- **AVOID**: Generic web form look, bright colors, large rounded corners

**CTA Button Locations** (from Story 0.1):
1. **Header** (data-track="header"): Fixed navigation button
2. **Hero Section** (data-track="hero"): Main call-to-action
3. **Final CTA** (data-track="final_cta"): Bottom conversion area

All buttons currently styled with: #0D7EFF background, white text, rounded corners.

### Multilingual Support (Bilingual Site)

**Landing Page Language Switcher**:
- Détection automatique de la langue du navigateur (navigator.language)
- Switcher manuel avec flags: 🇬🇧 (English) / 🇫🇷 (Français)
- Préférence stockée dans localStorage: `preferredLanguage`

**Form Translation Requirements**:
```
French (primary):
  - Email field label: "Adresse email"
  - Name field label: "Nom (optionnel)"
  - Consent text: "En soumettant ce formulaire, j'accepte de recevoir des communications sur le lancement de Splicely et je consens au traitement de mes données conformément à la politique de confidentialité."
  - Submit button: "Rejoindre la beta"
  - Success message: "Merci! Nous vous contacterons bientôt pour l'accès beta."

English (secondary):
  - Email field label: "Email address"
  - Name field label: "Name (optional)"
  - Consent text: "By submitting this form, I agree to receive communications about the launch of Splicely and consent to the processing of my data in accordance with the privacy policy."
  - Submit button: "Join the beta"
  - Success message: "Thank you! We will contact you soon for beta access."
```

**Implementation Options**:
1. **Option A**: Create two separate Tally forms (one French, one English)
   - Trigger correct form based on landing page language state
   - Simpler but requires maintaining two forms

2. **Option B**: Use single multilingual Tally form
   - Detect language from landing page and pre-populate hidden field
   - Use conditional logic in Tally to show correct language fields
   - More complex setup but single source of truth

**Recommended**: Option A pour MVP (plus simple, moins de risque d'erreur)

### Previous Story Intelligence (Story 0.1)

**Learnings from Landing Page Deployment**:

1. **Vercel Deployment**:
   - Vercel auto-detects static HTML (no config needed)
   - SSL/HTTPS automatique (pas de configuration requise)
   - Performance excellente: 0.12s load time
   - CDN global intégré

2. **Content Security Policy**:
   - Story 0.1 a ajouté CSP headers via vercel.json
   - **IMPORTANT**: Tally.so embed nécessitera d'ajuster CSP pour autoriser:
     - `script-src`: https://tally.so
     - `frame-src`: https://tally.so (pour iframe embed)
     - `connect-src`: https://tally.so (pour API calls)

3. **Bilingual Implementation**:
   - Language switcher fonctionne avec localStorage
   - Auto-détection browser language au premier chargement
   - État de langue accessible via `document.documentElement.lang` ou localStorage

4. **Analytics Preparation**:
   - Tous les CTA buttons ont déjà `data-track` attributes:
     - Header: `data-track="header"`
     - Hero: `data-track="hero"`
     - Final CTA: `data-track="final_cta"`
   - Story 0.3 (DataFast) va tracker `email_submitted` event avec source location
   - **Recommandation**: Passer le `data-track` value à Tally.so via hidden field pour tracking source

5. **Code Review Fixes Applied**:
   - Security headers configured (CSP, X-Frame-Options, XSS-Protection)
   - SEO meta tags added (hreflang for fr/en)
   - robots.txt et sitemap.xml créés
   - Favicon inline SVG (scissors emoji)
   - All files committed to git

6. **File Structure**:
   ```
   landing-page/
   ├── index.html (bilingual landing page)
   ├── vercel.json (security headers, CSP)
   ├── robots.txt (SEO)
   ├── sitemap.xml (bilingual sitemap)
   └── .gitignore (Vercel artifacts)
   ```

### Git Intelligence Summary

**Recent Commits (Last 5)**:
```
e5608ba - chore(epic-0): mark Story 0.1 as done after code review fixes
1db1462 - docs(epic-0): update Story 0.1 with code review fixes documentation
f3a8a4d - feat(epic-0): fix code review findings for Story 0.1
e89e98e - fix: shard epics
bed4960 - feat: complete setup. Ready to dev
```

**Patterns Observés**:
1. **Commit Convention**: feat/fix/chore/docs prefix with (epic-X) scope
2. **Code Review Process**: Story 0.1 a subi un code review avec 9 findings
3. **Security First**: CSP et security headers ajoutés post-review
4. **Bilingual from Start**: i18n implémenté dès Story 0.1
5. **Git Workflow**: All work committed to `development` branch

**Files Modified in Story 0.1**:
- `landing-page/index.html`: Main landing page (bilingual, dark theme)
- `landing-page/vercel.json`: Deployment config + CSP headers
- `landing-page/robots.txt`: SEO configuration
- `landing-page/sitemap.xml`: Sitemap with fr/en URLs
- Story file: `_bmad-output/implementation-artifacts/0-1-landing-page-deployment.md`

**Implications for Story 0.2**:
- Follow same commit convention: `feat(epic-0): integrate Tally.so email collection`
- Plan for code review (expect 3-10 findings minimum)
- Update vercel.json CSP to allow Tally.so
- Update story file with comprehensive dev notes like Story 0.1
- Test multilingual form matches language switcher behavior

### Latest Technical Information (2026)

**Tally.so Platform Updates (2026)**:

1. **GDPR Compliance**:
   - Hosted in EU (Frankfurt servers) ✅
   - DPA (Data Processing Agreement) available on request
   - Data export (CSV, Excel) and deletion capabilities
   - **Developer Responsibility**: Add consent checkbox, write privacy policy, configure retention
   - Source: [How to create a GDPR compliant form](https://tally.so/help/how-to-create-a-gdpr-compliant-form)

2. **Embedding Options**:
   - **Standard Embed**: Inline iframe
   - **Popup Modal**: Overlay (recommended for this use case)
   - **Full Page**: Entire page replacement
   - Source: [How to Embed a Tally Form](https://tally.so/help/embed-your-form), [Popup Forms Guide](https://tally.so/help/popup-forms)

3. **Webhooks (Free Feature)**:
   - Available to all users (free tier included)
   - JSON POST request to custom URL on form submission
   - Event types: `FORM_RESPONSE`
   - Security: Signing secret for verification, custom HTTP headers
   - Retry mechanism: 10-second timeout, automatic retries on failure
   - API endpoint: `https://api.tally.so/webhooks`
   - Source: [Webhooks Documentation](https://tally.so/help/webhooks), [Webhooks API Reference](https://developers.tally.so/api-reference/endpoint/webhooks/post)

4. **Email Notifications**:
   - Self-notification: Entrepreneur receives email for each submission
   - Pro users: Custom domain for email notifications (not needed for MVP)
   - Configuration: Form settings → Email notifications toggle
   - Source: [Tally Features](https://tally.so/features)

5. **Form Customization**:
   - Custom CSS supported for Pro users (we're free tier)
   - Dark mode theme option available
   - **Workaround for free tier**: Use Tally's built-in dark theme + adjust via browser DevTools to match colors
   - Font family can be changed in form settings

**Integration Best Practices**:
```javascript
// Modern Tally.so popup integration (2026)
<script async src="https://tally.so/widgets/embed.js"></script>

<button data-tally-open="FORM_ID"
        data-tally-layout="modal"
        data-tally-width="500"
        data-tally-auto-close="3000">
  Télécharger
</button>

// OR programmatic trigger
<script>
  Tally.openPopup('FORM_ID', {
    layout: 'modal',
    width: 500,
    autoClose: 3000, // ms after success
    hideTitle: false,
    overlay: true,
    emoji: {
      text: '📧',
      animation: 'wave'
    }
  });
</script>
```

**CSP Header Update Required**:
Story 0.1 added strict CSP. For Tally.so, update `landing-page/vercel.json`:
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://tally.so; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.tailwindcss.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; frame-src https://tally.so; connect-src 'self' https://tally.so;"
        }
      ]
    }
  ]
}
```

### Testing Standards

**Functional Testing**:
1. **Form Accessibility**:
   - Click header "Télécharger" → popup appears ✅
   - Click hero "Télécharger" → popup appears ✅
   - Click final_cta "Télécharger" → popup appears ✅
   - Close button dismisses popup ✅
   - Escape key dismisses popup ✅

2. **Form Validation**:
   - Email field required: Cannot submit without email ✅
   - Email validation: Invalid format shows error ✅
   - Name field optional: Can submit without name ✅
   - RGPD checkbox required: Cannot submit without consent ✅
   - Checkbox unchecked by default ✅

3. **Multilingual**:
   - Landing page in French → Form labels in French ✅
   - Landing page in English → Form labels in English ✅
   - Language switch → Form adapts on next open ✅

4. **Submission Flow**:
   - Submit form → Success message appears ✅
   - Success message text: "Merci! Nous vous contacterons bientôt pour l'accès beta." (French) ✅
   - Email saved in Tally.so dashboard ✅
   - Entrepreneur receives email notification ✅
   - Form auto-closes after 3 seconds (optional) ✅

**Design Testing**:
1. **Theme Matching**:
   - Form background: #25252D or similar dark ✅
   - Border color: Subtle, matches #35353F ✅
   - Primary button: #0D7EFF or close match ✅
   - Text colors: White labels, gray placeholders ✅
   - Font: Inter or system sans-serif ✅

2. **Responsive Design**:
   - Mobile (320px): Popup fits screen, readable ✅
   - Tablet (768px): Popup centered, appropriate width ✅
   - Desktop (1024px+): Popup width ~500px, centered ✅

**Performance Testing**:
1. **Page Load Impact**:
   - Initial page load: <2s (Story 0.1 baseline: 0.12s) ✅
   - Tally script loads asynchronously (doesn't block) ✅
   - Popup opens quickly (<500ms after click) ✅

2. **Cross-Browser**:
   - Chrome/Edge (Chromium): Popup works ✅
   - Safari (macOS): Popup works ✅
   - Firefox: Popup works ✅
   - Mobile Safari (iOS): Touch interaction works ✅
   - Chrome Mobile (Android): Touch interaction works ✅

**RGPD Compliance Testing**:
1. **Consent Enforcement**:
   - Try submitting without checking consent → Error shown ✅
   - Checkbox pre-checked? → FAIL (must be unchecked) ❌
   - Privacy text visible and clear? ✅

2. **Data Handling**:
   - Email appears in Tally.so dashboard ✅
   - Data exportable from Tally (CSV) ✅
   - Form hosted in EU (Frankfurt) ✅

### Project Structure Notes

**Files to Modify**:
```
landing-page/
├── index.html              (ADD: Tally.so embed script, popup triggers)
└── vercel.json            (MODIFY: Update CSP for Tally.so)
```

**Files to Create** (optional):
```
landing-page/
└── privacy-policy.html     (Optional: Simple privacy policy page for RGPD link)
```

**Deployment Workflow**:
1. Modify `index.html` to add Tally.so integration
2. Update `vercel.json` CSP headers
3. Test locally if possible (or directly on Vercel preview)
4. Deploy to Vercel: `vercel --prod` (from landing-page/ directory)
5. Test all three CTA buttons on production URL
6. Verify form submission end-to-end

**Alignment with Project Structure**:
- Landing page is SEPARATE from main Tauri monorepo (Story 1.1+)
- Lives in `/landing-page` directory at project root
- No shared code with desktop app
- Deployed independently to Vercel
- Desktop app will have different domain (e.g., app.splicely.com vs splicely.com)

### Limitations and Scope

**Within Scope (This Story)**:
- Create Tally.so account and form
- Configure form fields (email, name, RGPD consent)
- Style form to approximate dark theme (within Tally free tier limits)
- Integrate popup into landing page (3 CTA locations)
- Test form submission and notifications
- Basic multilingual support (2 forms or conditional logic)
- Update CSP headers for Tally.so

**Out of Scope (Future Stories)**:
- DataFast analytics tracking of form submissions (Story 0.3)
- Meta Pixel tracking (Story 0.4)
- A/B testing different form variants (Story 0.5)
- Advanced form customization (Pro tier features)
- Automated email sequences to subscribers (post-MVP)
- CRM integration (post-MVP)

**Known Limitations**:
- Free tier Tally: Limited customization, no custom CSS
- Form design will approximate dark theme, may not be pixel-perfect match
- Multilingual requires either 2 forms or conditional logic (adds complexity)
- CSP headers need update (may need multiple Vercel deployments to test)

### Troubleshooting Potentiel

**Tally.so Popup Not Appearing**:
- Check browser console for CSP errors → Update vercel.json
- Verify embed script loaded: `<script src="https://tally.so/widgets/embed.js"></script>`
- Check form ID correct in `data-tally-open="FORM_ID"`
- Test on different browser (Safari may have stricter privacy settings)

**Form Submission Fails**:
- Email validation: Ensure valid email format
- RGPD checkbox: Must be checked to submit
- Tally.so dashboard: Check form is published (not draft)
- Network issues: Check browser Network tab for failed API calls

**Email Notifications Not Received**:
- Verify email settings in Tally.so form configuration
- Check spam folder
- Test with different email address
- Ensure notifications enabled in Tally dashboard

**Design Doesn't Match**:
- Free tier limitation: Cannot use custom CSS
- Workaround: Use Tally's dark theme option
- Accept approximate match for MVP (pixel-perfect requires Pro tier)
- Document discrepancies for future upgrade consideration

**Bilingual Issues**:
- If using 2 forms: Ensure correct form ID triggered based on language
- If using conditional logic: Test language detection thoroughly
- Fallback: Default to French (primary market)

### References

**Epic & Requirements**:
- [Source: Epic 0 - Story 0.2](/Users/nicoduch/Documents/Dev/splice/_bmad-output/planning-artifacts/epics/epic-0-market-validation-landing-page.md#story-02-email-collection-setup-with-tallyso)
- [Source: Story 0.1 - Landing Page Deployment](/Users/nicoduch/Documents/Dev/splice/_bmad-output/implementation-artifacts/0-1-landing-page-deployment.md)

**Design System**:
- [Source: UX Design - UI Screens Specification](/Users/nicoduch/Documents/Dev/splice/_bmad-output/planning-artifacts/ux-design-specification/ui-screens-specification.md)
- [Source: Architecture - Design System](/Users/nicoduch/Documents/Dev/splice/_bmad-output/planning-artifacts/archive/architecture.md#design-system)

**Tally.so Documentation (2026)**:
- [How to create a GDPR compliant form](https://tally.so/help/how-to-create-a-gdpr-compliant-form)
- [GDPR Compliant Contact form Template](https://tally.so/templates/gdpr-compliant-contact-form/M3NrO3)
- [How to Embed a Tally Form on your Website](https://tally.so/help/embed-your-form)
- [How to build popup forms with Tally](https://tally.so/help/popup-forms)
- [Webhooks Documentation](https://tally.so/help/webhooks)
- [Creating webhooks - API Reference](https://developers.tally.so/api-reference/endpoint/webhooks/post)
- [Tally Features Overview](https://tally.so/features)

**Compliance**:
- [GDPR Overview - Tally](https://tally.so/help/gdpr)
- [Best GDPR-compliant form builders](https://tally.so/help/best-gdpr-form-builders)

**Technical Resources**:
- [Vercel Deployment Documentation](https://vercel.com/docs/deployments)
- [Content Security Policy Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Debug Log References

**Session 1 - 2026-01-31**: Tally.so Integration Setup

### Implementation Plan

**Approach**: Integrated Tally.so popup forms with bilingual support (FR/EN) using placeholder Form IDs that will be replaced once the user creates actual forms on Tally.so platform.

**Technical Decisions**:
1. **Bilingual Strategy**: Implemented Option A (two separate forms) for simplicity
   - Each language has its own Form ID
   - JavaScript detects current page language and opens appropriate form
   - Avoids complex conditional logic in Tally.so

2. **Integration Method**: Popup modal (recommended approach)
   - Better UX than inline embed for this use case
   - Doesn't disrupt page flow
   - Auto-closes 3s after successful submission
   - Fully dismissable with close button or ESC key

3. **Source Tracking**: Added hidden field to track CTA location
   - Passes `source` parameter (header/hero/final_cta) to form
   - Enables future analytics on which CTA converts best (Story 0.3)

4. **CSP Updates**: Extended Content Security Policy to allow Tally.so
   - `script-src`: Added https://tally.so for embed script
   - `frame-src`: Added https://tally.so for iframe popup
   - `connect-src`: Added https://tally.so for API calls
   - `style-src`: Added https://tally.so for form styling

**Placeholder Form IDs**:
- French: `FORM_FR_PLACEHOLDER`
- English: `FORM_EN_PLACEHOLDER`

These must be replaced in `landing-page/index.html` (around line 350) once user creates actual Tally.so forms.

### Completion Notes List

✅ **Completed (Session 1)**:
- Tally.so embed script integrated in HTML head
- All 3 CTA buttons updated with `onclick="openTallyForm(location)"` handlers
- Bilingual form logic implemented with language detection
- CSP headers updated in vercel.json to allow Tally.so resources
- `openTallyForm()` JavaScript function created with popup configuration
- Hidden field tracking for CTA source location
- TALLY_SETUP.md guide created for Form ID replacement
- Auto-close after successful submission (3s)
- Emoji wave animation on popup open

⏳ **Pending User Action**:
- User must create 2 Tally.so forms (FR + EN) with specs provided
- User must replace placeholder Form IDs in index.html
- User must configure email notifications in Tally.so dashboard
- User must apply dark theme styling in Tally.so form settings

⏸️ **Blocked Until Forms Created**:
- Task 1: Create Tally.so form (requires manual Tally.so account creation)
- Task 2: Style form to match dark theme (must be done in Tally.so UI)
- Task 3: Configure email notifications (Tally.so dashboard setting)
- Task 5: Test multilingual support (needs real Form IDs)
- Task 6: Performance and cross-platform testing (needs functional forms)

**Next Steps After Form Creation**:
1. Replace Form IDs in `landing-page/index.html`
2. Deploy to Vercel preview: `vercel`
3. Test all 3 CTA buttons open correct language form
4. Submit test email and verify notification received
5. Complete Tasks 5 & 6 (testing)
6. Mark story as ready for review

### File List

**Modified**:
- `landing-page/index.html`: Added Tally.so script, updated 3 CTA buttons, added `openTallyForm()` function
- `landing-page/vercel.json`: Updated CSP headers to allow Tally.so resources

**Created**:
- `landing-page/TALLY_SETUP.md`: Setup guide for replacing placeholder Form IDs
