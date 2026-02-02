# Epic 7: License Management & Monetization

Les utilisateurs peuvent gérer leur licence freemium/pro et accéder aux fonctionnalités selon leur plan.

## Story 7.1: Backend API License Service Setup

As a developer,
I want to create the NestJS backend API for license management,
So that licenses can be verified and managed centrally.

**Acceptance Criteria:**

**Given** architecture specifies NestJS + Prisma + PostgreSQL (ARCH-6, ARCH-7)
**When** setting up backend API
**Then** NestJS project initialized with modules:
  - `license` - License verification and activation
  - `stripe` - Webhook handling for subscriptions
  - `analytics` - Usage tracking (Phase 2)
**And** PostgreSQL database configured with Prisma schema:
  ```prisma
  model User {
    id        String   @id @default(uuid())
    email     String   @unique
    stripeCustomerId String? @unique
    licenses  License[]
    createdAt DateTime @default(now())
  }

  model License {
    id          String   @id @default(uuid())
    userId      String
    user        User     @relation(fields: [userId], references: [id])
    licenseKey  String   @unique
    plan        String   // 'free' | 'pro'
    status      String   // 'active' | 'expired'
    activatedAt DateTime?
    expiresAt   DateTime?
    createdAt   DateTime @default(now())
  }
  ```
**And** REST endpoints implemented:
  - `POST /api/v1/license/verify` - Verify license validity (FR35)
  - `POST /api/v1/license/activate` - Activate new license (FR39)
  - `POST /api/v1/stripe/webhook` - Receive Stripe events (FR35)
**And** API secured with API keys and rate limiting
**And** HTTPS enforced (NFR14)
**And** deployed to cloud provider (Render, Railway, or Fly.io)

---

## Story 7.2: License Verification on App Startup

As a user,
I want my license verified automatically when I launch the app,
So that I can access features according to my subscription plan.

**Acceptance Criteria:**

**Given** app launches (FR35)
**When** license verification runs
**Then** license stored securely in:
  - macOS: Keychain (NFR13, PLATFORM-8)
  - Windows: Credential Manager (NFR13, PLATFORM-8)
**And** if online, license verified via backend API: `POST /license/verify { licenseKey }`
**And** API returns: `{ valid: true, plan: 'pro', expiresAt: '2025-12-31' }`
**And** license cached locally in SQLite `license_cache` table
**And** if offline, grace period checked (7 days) (FR40, NFR32)
**And** `grace_period_ends_at` compared to current time
**And** if within grace period, app functions normally
**And** if grace period expired (>7 days offline), warning modal:
  - "Connexion requise pour vérifier la licence"
  - "Dernière vérification: il y a 8 jours"
  - "Connectez-vous à Internet pour continuer." (FR41)
**And** after successful online verification, grace period reset (FR42)
**And** license store updated with current plan and expiry

---

## Story 7.3: Freemium Limitations & Enforcement

As a user on the free plan,
I want clear limitations on video length,
So that I understand what I need to upgrade for.

**Acceptance Criteria:**

**Given** user has free/freemium license (FR36)
**When** importing video
**Then** video duration checked
**And** if duration ≤ 30 minutes, import proceeds normally
**And** if duration > 30 minutes, error dialog displays:
  - "Limite freemium dépassée"
  - "Les utilisateurs gratuits peuvent traiter des vidéos jusqu'à 30 minutes."
  - "Cette vidéo dure 45 minutes."
  - "Passez à Splice Pro pour supprimer cette limite."
  - "Upgrade to Pro" button (links to upgrade flow)
  - "Cancel" button
**And** video not imported until upgraded
**And** transcription and editing work normally for videos ≤30min
**And** preview works normally for freemium users (FR25-FR28)
**And** export blocked for freemium users (FR37)

---

## Story 7.4: Export Blocker & Conversion Flow

As a freemium user,
I want to see a clear upgrade prompt when I try to export,
So that I understand the value of upgrading and can easily do so.

**Acceptance Criteria:**

**Given** freemium user completes preview and clicks "Export" (FR37, FR38)
**When** export attempted
**Then** export blocked with modal:
  - Title: "Export disponible uniquement pour Splice Pro"
  - Message: "Vous avez créé un montage parfait! Pour exporter votre vidéo, passez à Splice Pro."
  - Benefits list:
    - ✅ Export illimité en MP4 haute qualité
    - ✅ Vidéos jusqu'à 2h (pas de limite 30min)
    - ✅ Support prioritaire
    - ✅ Mises à jour incluses
  - Pricing: "19€/mois ou 99€/an"
  - "Upgrade to Pro" button (prominent, emerald green)
  - "Maybe Later" button (subtle)
**And** clicking "Upgrade to Pro" opens Stripe Checkout
**And** after successful payment, license upgraded immediately
**And** user can export without restarting app
**And** conversion message: "Bienvenue dans Splice Pro! Vous pouvez maintenant exporter." (FR38)

---

## Story 7.5: Early Adopter Codes & Lifetime Access

As a user with an early adopter code,
I want to activate my lifetime access,
So that I can use Splice Pro forever without subscription.

**Acceptance Criteria:**

**Given** user has early adopter code (FR39)
**When** app prompts for license
**Then** "Have an early adopter code?" link available
**And** clicking opens activation dialog:
  - "Enter your early adopter code"
  - Input field for code (format: SPLICE-XXXX-XXXX-XXXX)
  - "Activate" button
**And** on activation, code sent to backend: `POST /license/activate { code }`
**And** backend validates code is valid and unused
**And** if valid, license created with:
  - Plan: 'pro'
  - Status: 'active'
  - ExpiresAt: null (lifetime)
**And** license stored in Keychain/Credential Manager
**And** success message: "Code activé! Bienvenue dans Splice Pro - Accès lifetime."
**And** if invalid, error: "Code invalide ou déjà utilisé."
**And** early adopters treated as Pro users (no limits, no payment required)

---
