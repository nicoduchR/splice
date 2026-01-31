# Story 0.2 - Email Collection Testing Checklist

## 🧪 Pre-Deployment Testing (Local/Preview)

Before deploying to production, complete these tests on a Vercel preview deployment.

### Deploy to Vercel Preview
```bash
cd landing-page
vercel
```

Copy the preview URL provided by Vercel.

---

## ✅ Task 5: Test Multilingual Support and RGPD Compliance

### 5.1 Multilingual Form Loading

**Test FR-1: French Form Opens When Page is in French**
- [ ] Open preview URL
- [ ] Click language switcher to set to 🇫🇷 (if not already)
- [ ] Verify page language is French (check hero title)
- [ ] Click **Header** "Télécharger" button
- [ ] ✅ Verify: Form title is "Rejoindre la beta Splicely"
- [ ] ✅ Verify: Form labels are in French
- [ ] Close popup (X or ESC)

**Test FR-2: French Form from Hero CTA**
- [ ] Click **Hero section** "Télécharger pour Mac" button
- [ ] ✅ Verify: Same French form opens
- [ ] Close popup

**Test FR-3: French Form from Final CTA**
- [ ] Scroll to bottom
- [ ] Click **Final CTA** "Télécharger Splicely maintenant" button
- [ ] ✅ Verify: Same French form opens
- [ ] Close popup

**Test EN-1: English Form Opens When Page is in English**
- [ ] Click language switcher to set to 🇬🇧
- [ ] Verify page language is English (check hero title)
- [ ] Click **Header** "Download" button
- [ ] ✅ Verify: Form title is "Join the Splicely beta"
- [ ] ✅ Verify: Form labels are in English
- [ ] Close popup

**Test EN-2: English Form from Hero CTA**
- [ ] Click **Hero section** "Download for Mac" button
- [ ] ✅ Verify: Same English form opens
- [ ] Close popup

**Test EN-3: English Form from Final CTA**
- [ ] Scroll to bottom
- [ ] Click **Final CTA** "Download Splicely now" button
- [ ] ✅ Verify: Same English form opens
- [ ] Close popup

### 5.2 RGPD Compliance Verification

**Test RGPD-1: Checkbox Unchecked by Default (CRITICAL)**
- [ ] Open French form (click any CTA)
- [ ] ✅ VERIFY: RGPD consent checkbox is **UNCHECKED** by default
- [ ] ⚠️ **IF CHECKED**: This is a GDPR violation - must fix immediately
- [ ] Close popup
- [ ] Open English form (switch language, click CTA)
- [ ] ✅ VERIFY: GDPR consent checkbox is **UNCHECKED** by default
- [ ] Close popup

**Test RGPD-2: Cannot Submit Without Consent**
- [ ] Open French form
- [ ] Enter email: test@example.com
- [ ] Enter name: Test User
- [ ] DO NOT check RGPD checkbox
- [ ] Try to click "Rejoindre la beta" button
- [ ] ✅ VERIFY: Form shows validation error / button disabled
- [ ] ✅ VERIFY: Form does NOT submit

**Test RGPD-3: Privacy Text Visible and Clear**
- [ ] Open French form
- [ ] ✅ VERIFY: RGPD text is visible: "En soumettant ce formulaire, j'accepte..."
- [ ] ✅ VERIFY: Text is readable (good contrast)
- [ ] ✅ VERIFY: Privacy policy link present (if implemented)
- [ ] Repeat for English form

### 5.3 Form Validation

**Test VAL-1: Email Field Required**
- [ ] Open form
- [ ] Leave email field empty
- [ ] Enter name: Test User
- [ ] Check RGPD consent
- [ ] Try to submit
- [ ] ✅ VERIFY: Validation error shown
- [ ] ✅ VERIFY: Form does NOT submit

**Test VAL-2: Email Format Validation**
- [ ] Open form
- [ ] Enter invalid email: "notanemail"
- [ ] Check RGPD consent
- [ ] Try to submit
- [ ] ✅ VERIFY: Validation error shown for invalid email format
- [ ] Enter valid email: test@example.com
- [ ] ✅ VERIFY: Validation error disappears

**Test VAL-3: Name Field is Optional**
- [ ] Open form
- [ ] Enter email: test@example.com
- [ ] Leave name field EMPTY
- [ ] Check RGPD consent
- [ ] Submit form
- [ ] ✅ VERIFY: Form submits successfully without name

### 5.4 Submission Flow

**Test SUB-1: Successful Submission (French)**
- [ ] Open French form
- [ ] Enter email: test-fr@example.com
- [ ] Enter name: Test Français
- [ ] Check RGPD consent checkbox
- [ ] Click "Rejoindre la beta"
- [ ] ✅ VERIFY: Success message appears
- [ ] ✅ VERIFY: Message text is: "Merci! Nous vous contacterons bientôt pour l'accès beta."
- [ ] ✅ VERIFY: Popup auto-closes after ~3 seconds
- [ ] Go to Tally.so dashboard
- [ ] ✅ VERIFY: Submission appears with email: test-fr@example.com
- [ ] ✅ VERIFY: Name field shows: Test Français

**Test SUB-2: Successful Submission (English)**
- [ ] Switch page to English
- [ ] Open English form
- [ ] Enter email: test-en@example.com
- [ ] Enter name: Test English
- [ ] Check GDPR consent checkbox
- [ ] Click "Join the beta"
- [ ] ✅ VERIFY: Success message appears
- [ ] ✅ VERIFY: Message text is: "Thank you! We will contact you soon for beta access."
- [ ] ✅ VERIFY: Popup auto-closes after ~3 seconds
- [ ] Go to Tally.so dashboard
- [ ] ✅ VERIFY: Submission appears with email: test-en@example.com
- [ ] ✅ VERIFY: Name field shows: Test English

**Test SUB-3: Email Notification Received**
- [ ] Submit a test form (either language)
- [ ] Check entrepreneur email inbox
- [ ] ✅ VERIFY: Email notification received from Tally.so
- [ ] ✅ VERIFY: Email contains submission details
- [ ] Check spam folder if not in inbox

### 5.5 Popup Behavior

**Test POP-1: Popup Dismissable**
- [ ] Open form from any CTA
- [ ] ✅ VERIFY: Close button (X) visible in top-right
- [ ] Click close button
- [ ] ✅ VERIFY: Popup closes
- [ ] Open form again
- [ ] Press ESC key
- [ ] ✅ VERIFY: Popup closes

**Test POP-2: Popup Overlay**
- [ ] Open form
- [ ] ✅ VERIFY: Dark overlay visible behind popup
- [ ] ✅ VERIFY: Background page content dimmed/blurred
- [ ] Click outside popup (on overlay)
- [ ] ✅ VERIFY: Popup closes (if Tally.so configured for this)

---

## ✅ Task 6: Performance and Cross-Platform Testing

### 6.1 Page Load Performance

**Test PERF-1: Tally Script Doesn't Block Page Load**
- [ ] Open preview URL in Chrome
- [ ] Open DevTools → Network tab
- [ ] Reload page
- [ ] ✅ VERIFY: Tally.so script loads asynchronously (check "Async" column)
- [ ] ✅ VERIFY: Page content appears before Tally script finishes
- [ ] Check Console tab
- [ ] ✅ VERIFY: No CSP errors related to Tally.so
- [ ] ✅ VERIFY: No JavaScript errors

**Test PERF-2: Initial Page Load Time**
- [ ] Open DevTools → Network tab
- [ ] Hard reload (Cmd+Shift+R / Ctrl+Shift+R)
- [ ] Check "Load" time at bottom
- [ ] ✅ VERIFY: Page load time < 2 seconds (target: maintain Story 0.1 baseline ~0.12s + Tally overhead)
- [ ] Note: Tally script adds ~200-300ms but loads async

**Test PERF-3: Popup Opens Quickly**
- [ ] Close DevTools
- [ ] Click any CTA button
- [ ] ✅ VERIFY: Popup appears in < 500ms
- [ ] ✅ VERIFY: No noticeable lag or delay
- [ ] ✅ VERIFY: Smooth animation

### 6.2 Responsive Design Testing

**Test RESP-1: Mobile (320px - 414px)**
- [ ] Open Chrome DevTools → Device Toolbar
- [ ] Select iPhone SE (375x667)
- [ ] Reload page
- [ ] ✅ VERIFY: Landing page displays correctly
- [ ] Click header CTA button
- [ ] ✅ VERIFY: Popup fits screen width
- [ ] ✅ VERIFY: Form fields are readable (not too small)
- [ ] ✅ VERIFY: Submit button visible without scrolling
- [ ] ✅ VERIFY: Close button accessible
- [ ] Try iPhone 12 Pro (390x844)
- [ ] Repeat checks above

**Test RESP-2: Tablet (768px - 1024px)**
- [ ] Switch to iPad (768x1024)
- [ ] Reload page
- [ ] Click hero CTA button
- [ ] ✅ VERIFY: Popup centered on screen
- [ ] ✅ VERIFY: Popup width ~500px (not full screen)
- [ ] ✅ VERIFY: Form is readable and well-spaced
- [ ] Try iPad Pro (1024x1366)
- [ ] Repeat checks above

**Test RESP-3: Desktop (1024px+)**
- [ ] Switch to responsive mode: 1280x720
- [ ] Reload page
- [ ] Click final CTA button
- [ ] ✅ VERIFY: Popup centered horizontally
- [ ] ✅ VERIFY: Popup width exactly ~500px
- [ ] ✅ VERIFY: Overlay covers entire viewport
- [ ] Try 1920x1080
- [ ] Repeat checks above

### 6.3 Cross-Browser Testing

**Test BROWSER-1: Chrome/Edge (Chromium)**
- [ ] Open in Google Chrome (or Edge)
- [ ] Click CTA button
- [ ] ✅ VERIFY: Popup opens correctly
- [ ] Submit test form
- [ ] ✅ VERIFY: Submission works
- [ ] ✅ VERIFY: Auto-close works after 3s
- [ ] Check Console for errors
- [ ] ✅ VERIFY: No errors

**Test BROWSER-2: Safari (macOS)**
- [ ] Open preview URL in Safari
- [ ] Click CTA button
- [ ] ✅ VERIFY: Popup opens correctly (Safari has stricter privacy)
- [ ] Submit test form
- [ ] ✅ VERIFY: Submission works
- [ ] ✅ VERIFY: Auto-close works
- [ ] Open Web Inspector → Console
- [ ] ✅ VERIFY: No errors or CSP violations

**Test BROWSER-3: Firefox**
- [ ] Open preview URL in Firefox
- [ ] Click CTA button
- [ ] ✅ VERIFY: Popup opens correctly
- [ ] Submit test form
- [ ] ✅ VERIFY: Submission works
- [ ] Open Developer Tools → Console
- [ ] ✅ VERIFY: No errors

**Test BROWSER-4: Mobile Safari (iOS)**
- [ ] Open preview URL on actual iPhone (if available)
- [ ] OR use BrowserStack / Simulator
- [ ] Tap header CTA button
- [ ] ✅ VERIFY: Popup opens on tap (no delay)
- [ ] ✅ VERIFY: Form is touchable and scrollable
- [ ] Fill and submit form
- [ ] ✅ VERIFY: Keyboard appears for email/name fields
- [ ] ✅ VERIFY: Checkbox is tappable
- [ ] ✅ VERIFY: Submit button works on tap

**Test BROWSER-5: Chrome Mobile (Android)**
- [ ] Open preview URL on Android device (if available)
- [ ] OR use BrowserStack / Emulator
- [ ] Tap hero CTA button
- [ ] ✅ VERIFY: Popup opens on tap
- [ ] ✅ VERIFY: Form displays correctly
- [ ] Fill and submit form
- [ ] ✅ VERIFY: Touch interactions work smoothly
- [ ] ✅ VERIFY: Auto-close works after submission

### 6.4 Edge Cases

**Test EDGE-1: Tally Script Failed to Load**
- [ ] Open DevTools → Network tab
- [ ] Block requests to tally.so domain
- [ ] Reload page
- [ ] Click CTA button
- [ ] ✅ VERIFY: Graceful error handling (alert message appears)
- [ ] ✅ VERIFY: Page doesn't crash or freeze

**Test EDGE-2: Multiple Form Opens**
- [ ] Click header CTA → close popup
- [ ] Click hero CTA → close popup
- [ ] Click final CTA → close popup
- [ ] Click header CTA again
- [ ] ✅ VERIFY: Form still works correctly
- [ ] ✅ VERIFY: No duplicate popups
- [ ] ✅ VERIFY: No memory leaks (check DevTools Memory if needed)

**Test EDGE-3: Language Switch Mid-Session**
- [ ] Page in French
- [ ] Click CTA → French form opens
- [ ] Close popup
- [ ] Switch to English
- [ ] Click CTA → English form opens
- [ ] ✅ VERIFY: Correct language form opens after switch
- [ ] Close popup
- [ ] Switch back to French
- [ ] Click CTA
- [ ] ✅ VERIFY: French form opens again

---

## 📊 Test Results Summary

**Date Tested**: _________________
**Tester**: _________________
**Environment**: Preview URL: _________________

### Pass/Fail Summary

| Category | Tests Passed | Tests Failed | Notes |
|----------|-------------|--------------|-------|
| Multilingual Support | __ / 6 | __ | |
| RGPD Compliance | __ / 3 | __ | |
| Form Validation | __ / 3 | __ | |
| Submission Flow | __ / 3 | __ | |
| Popup Behavior | __ / 2 | __ | |
| Performance | __ / 3 | __ | |
| Responsive Design | __ / 3 | __ | |
| Cross-Browser | __ / 5 | __ | |
| Edge Cases | __ / 3 | __ | |
| **TOTAL** | **__ / 31** | **__** | |

### Critical Failures (Must Fix Before Production)
- [ ] None
- [ ] RGPD checkbox pre-checked (GDPR violation)
- [ ] Form doesn't open on mobile
- [ ] CSP errors blocking Tally.so
- [ ] Other: _________________

### Non-Critical Issues (Can Fix Later)
- [ ] None
- [ ] Minor styling inconsistency
- [ ] Performance could be better
- [ ] Other: _________________

---

## ✅ Definition of Done Checklist

Before marking Story 0.2 as "review", verify ALL items checked:

- [ ] All 31 tests passed (or issues documented and acceptable)
- [ ] RGPD checkbox is unchecked by default (CRITICAL)
- [ ] Both French and English forms work correctly
- [ ] Email notifications received in Tally.so
- [ ] All 3 CTA buttons open forms correctly
- [ ] Forms work on mobile, tablet, desktop
- [ ] Forms work in Chrome, Safari, Firefox
- [ ] No CSP errors in browser console
- [ ] Page load time acceptable (< 2s)
- [ ] Story file updated with test results
- [ ] Code committed to git
- [ ] Ready for deployment to production

---

## 🚀 Next Steps After Testing

1. **If all tests pass**:
   - Deploy to production: `vercel --prod`
   - Update story status to "review"
   - Run code-review workflow (recommended: different LLM)

2. **If tests fail**:
   - Document failures in story file
   - Fix issues
   - Re-test
   - Repeat until all pass

3. **Production deployment**:
   ```bash
   cd landing-page
   vercel --prod
   ```

4. **Post-deployment verification**:
   - Test all 3 CTAs on production URL
   - Submit real test email
   - Verify notification received
   - Check Tally.so dashboard for submission
