# Tally.so Form Setup Instructions

## ✅ Completed Integration

The Tally.so email collection form has been integrated into the landing page with:
- Popup triggers on all 3 CTA buttons (header, hero, final_cta)
- Bilingual support (French/English forms)
- CSP headers updated to allow Tally.so
- Auto-close after successful submission (3s)
- Source tracking via hidden field

## 🔄 Next Steps: Replace Placeholder Form IDs

Once you have created your Tally.so forms, you need to replace the placeholder Form IDs in the code.

### Step 1: Get Your Form IDs

After creating your forms on Tally.so:
1. Go to your form settings
2. Click on "Share" or "Embed"
3. Find the Form ID in the URL or embed code
   - Format: `https://tally.so/r/XXXXXXX` (the `XXXXXXX` is your Form ID)

### Step 2: Update the Code

Open `landing-page/index.html` and find this section (around line 350):

```javascript
const TALLY_FORMS = {
    fr: 'FORM_FR_PLACEHOLDER',  // Replace with actual French form ID
    en: 'FORM_EN_PLACEHOLDER'   // Replace with actual English form ID
};
```

Replace with your actual Form IDs:

```javascript
const TALLY_FORMS = {
    fr: 'wQ6xY2z',  // Your French form ID
    en: 'mK9nP4v'   // Your English form ID
};
```

### Step 3: Test

1. Deploy to Vercel: `vercel --prod`
2. Click on each CTA button (header, hero, final_cta)
3. Verify the correct language form opens
4. Test form submission
5. Check email notification received

## 📋 Form Configuration Checklist

Make sure your Tally.so forms have:

**French Form** (`Rejoindre la beta Splicely`):
- ✅ Email field (required)
- ✅ Name field (optional)
- ✅ GDPR checkbox (required, unchecked by default)
- ✅ Privacy policy link in GDPR text
- ✅ Submit button: "Rejoindre la beta"
- ✅ Success message: "Merci! Nous vous contacterons bientôt pour l'accès beta."
- ✅ Dark theme enabled
- ✅ Email notifications enabled

**English Form** (`Join the Splicely beta`):
- ✅ Email field (required)
- ✅ Name field (optional)
- ✅ GDPR checkbox (required, unchecked by default)
- ✅ Privacy policy link in GDPR text
- ✅ Submit button: "Join the beta"
- ✅ Success message: "Thank you! We will contact you soon for beta access."
- ✅ Dark theme enabled
- ✅ Email notifications enabled

## 🎨 Recommended Tally.so Settings

**Design**:
- Theme: Dark mode
- Primary color: `#0D7EFF`
- Font: Inter or system sans-serif
- Background: Darkest option available

**Notifications**:
- Enable email notifications
- Enter your email to receive signup alerts

**Advanced** (optional):
- Add hidden field `source` (will be populated automatically with CTA location)
- Configure webhook for future analytics integration (Story 0.3)

## 🔒 GDPR Compliance Verification

Before going live, verify:
- ✅ Checkbox is unchecked by default
- ✅ Form cannot be submitted without checking consent
- ✅ Privacy policy text is clear and visible
- ✅ Forms are hosted in EU (Tally.so uses Frankfurt servers)
- ✅ Email notifications work correctly

## 🚀 Deployment

Once Form IDs are updated:

```bash
cd landing-page
vercel --prod
```

Test the live site:
1. Visit production URL
2. Switch languages (🇬🇧/🇫🇷)
3. Click each CTA button
4. Verify correct language form opens
5. Submit a test email
6. Confirm notification received

---

**Questions?** Check the story file for detailed context:
`_bmad-output/implementation-artifacts/0-2-email-collection-setup-with-tally-so.md`
