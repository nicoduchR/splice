# Évaluation du Starter Template

## Domaine Technologique Principal

**Desktop App Full-Stack** basé sur l'analyse des exigences du projet.

**Stack Technologique Fixée:**
- Framework: Tauri 2.x (architecture hybride Rust + Web)
- Backend: Rust (performance, traitement vidéo/ML)
- Frontend: React + TypeScript + Vite
- Design System: Tailwind CSS + shadcn/ui
- Plateformes: macOS 13+ / Windows 10+
- **Structure: Monorepo** (pnpm workspaces + Turbo) pour packages shared

## Options de Starter Considérées

**Option 1: create-tauri-app Officiel + Setup Manuel Monorepo (RECOMMANDÉE)**
- Outil: [create-tauri-app](https://v2.tauri.app/start/create-project/) (officiel Tauri)
- Inclut: Tauri 2.x + React + TypeScript + Vite configuré
- À ajouter:
  - Tailwind CSS v4 + shadcn/ui (15-20 minutes setup)
  - Structure monorepo pnpm workspaces
  - Packages shared (ui, types, validation, utils)
- Maintenance: Officiel, toujours compatible dernière version Tauri

**Option 2: Templates Communautaires Pré-Configurés**
- [agmmnn/tauri-ui](https://github.com/agmmnn/tauri-ui): CLI avec shadcn/ui intégré
- [MrLightful/create-tauri-react](https://github.com/MrLightful/create-tauri-react): Architecture bulletproof-react
- Inclut: Tout pré-configuré
- Risque: Pas de structure monorepo, dépendance mainteneurs communautaires

**Option 3: Setup Custom Complet**
- Contrôle total mais temps setup significatif
- Non adapté timeline MVP 2-4 mois

## Starter Sélectionné: create-tauri-app + Monorepo Setup

**Rationale de Sélection:**

1. **Stabilité & Support Officiel:** L'outil create-tauri-app est maintenu par l'équipe Tauri core
2. **Structure Monorepo Nécessaire:** Packages shared (ui, types, validation, utils) requis pour Clean Architecture
3. **Contrôle Configuration:** Évite dépendances repositories communautaires
4. **Documentation Exhaustive:** Setup Tailwind CSS v4 + shadcn/ui bien documenté
5. **Overhead Acceptable:** Setup monorepo + Tailwind/shadcn ajoute 30-40 minutes vs bénéfice long terme organisation code

## Commandes d'Initialisation Complètes

**Étape 1: Création Structure Monorepo**

```bash
# Créer dossier projet
mkdir splice
cd splice

# Initialiser pnpm workspace
pnpm init

# Créer structure monorepo
mkdir -p apps/desktop
mkdir -p packages/ui packages/types packages/validation packages/utils
```

**Configuration `pnpm-workspace.yaml`:**

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

**Configuration `package.json` root:**

```json
{
  "name": "splice",
  "private": true,
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "test": "turbo run test",
    "lint": "turbo run lint"
  },
  "devDependencies": {
    "turbo": "^2.0.0"
  },
  "engines": {
    "node": ">=18.0.0",
    "pnpm": ">=8.0.0"
  }
}
```

**Configuration `turbo.json`:**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", "target/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["build"]
    },
    "lint": {
      "dependsOn": ["^lint"]
    }
  }
}
```

**Étape 2: Création App Tauri dans apps/desktop**

```bash
cd apps/desktop

# Option A: Interactive (recommandé pour première fois)
pnpm create tauri-app@latest

# Lors des prompts:
# - Project name: . (current directory)
# - Package manager: pnpm
# - UI template: React
# - UI flavor: TypeScript

cd ../..
```

**Étape 3: Installation Tailwind CSS v4 dans apps/desktop**

```bash
cd apps/desktop

# Installer Tailwind CSS v4 avec plugin Vite
pnpm add tailwindcss @tailwindcss/vite

cd ../..
```

**Configuration Vite (éditer `apps/desktop/vite.config.ts`):**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@splice/ui": path.resolve(__dirname, "../../packages/ui/src"),
      "@splice/types": path.resolve(__dirname, "../../packages/types/src"),
      "@splice/validation": path.resolve(__dirname, "../../packages/validation/src"),
      "@splice/utils": path.resolve(__dirname, "../../packages/utils/src"),
    },
  },
})
```

**Ajouter directives Tailwind (`apps/desktop/src/index.css`):**

```css
@import "tailwindcss";
```

**Étape 4: Configuration TypeScript Path Aliases**

**Éditer `apps/desktop/tsconfig.json`:**

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@splice/ui": ["../../packages/ui/src"],
      "@splice/types": ["../../packages/types/src"],
      "@splice/validation": ["../../packages/validation/src"],
      "@splice/utils": ["../../packages/utils/src"]
    }
  }
}
```

**Éditer `apps/desktop/tsconfig.app.json`:**

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@splice/ui": ["../../packages/ui/src"],
      "@splice/types": ["../../packages/types/src"],
      "@splice/validation": ["../../packages/validation/src"],
      "@splice/utils": ["../../packages/utils/src"]
    }
  }
}
```

**Étape 5: Initialisation shadcn/ui**

```bash
cd apps/desktop

# Installer et configurer shadcn/ui
npx shadcn@latest init

# Répondre aux questions:
# - TypeScript: yes
# - Style: Default
# - Base color: Slate
# - CSS variables: yes
# - CSS file: src/index.css
# - Import alias: @/components

cd ../..
```

**Étape 6: Initialisation Packages Shared**

**packages/ui/package.json:**

```json
{
  "name": "@splice/ui",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "lint": "eslint . --ext ts,tsx"
  },
  "devDependencies": {
    "react": "^18.3.1",
    "typescript": "^5.5.3"
  }
}
```

**packages/types/package.json:**

```json
{
  "name": "@splice/types",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "lint": "eslint . --ext ts"
  },
  "devDependencies": {
    "typescript": "^5.5.3"
  }
}
```

**packages/validation/package.json:**

```json
{
  "name": "@splice/validation",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "dependencies": {
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "typescript": "^5.5.3"
  }
}
```

**packages/utils/package.json:**

```json
{
  "name": "@splice/utils",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "devDependencies": {
    "typescript": "^5.5.3"
  }
}
```

**Étape 7: Ajout Composants shadcn/ui de Base**

```bash
cd apps/desktop

# Installer composants essentiels pour MVP
npx shadcn@latest add button
npx shadcn@latest add dialog
npx shadcn@latest add progress
npx shadcn@latest add toast
npx shadcn@latest add tooltip

cd ../..
```

**Étape 8: Installation Dépendances & Vérification**

```bash
# Installer toutes dépendances monorepo
pnpm install

# Démarrer serveur développement
pnpm dev
```

## Structure Projet Finale

```
splice/
├── apps/
│   └── desktop/                # Application principale
│       ├── src/                # Frontend React
│       │   ├── components/     # Composants React
│       │   │   └── ui/        # shadcn/ui components
│       │   ├── lib/           # Utilitaires
│       │   ├── App.tsx
│       │   ├── main.tsx
│       │   └── index.css
│       ├── src-tauri/         # Backend Rust
│       │   ├── src/
│       │   │   └── main.rs
│       │   ├── Cargo.toml
│       │   └── tauri.conf.json
│       ├── package.json
│       ├── vite.config.ts
│       └── tsconfig.json
├── packages/
│   ├── ui/                    # Composants React partagés
│   │   ├── src/
│   │   │   ├── transcript-editor.tsx
│   │   │   ├── timeline.tsx
│   │   │   ├── video-player.tsx
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── types/                 # Types TypeScript partagés
│   │   ├── src/
│   │   │   ├── video.ts
│   │   │   ├── transcript.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── validation/            # Schémas Zod
│   │   ├── src/
│   │   │   ├── video-schema.ts
│   │   │   ├── selection-schema.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── utils/                 # Utilitaires partagés
│       ├── src/
│       │   ├── timecode.ts
│       │   ├── duration.ts
│       │   └── index.ts
│       ├── package.json
│       └── tsconfig.json
├── pnpm-workspace.yaml
├── turbo.json
├── package.json
└── .gitignore
```

## Décisions Architecturales Fournies par le Starter

**Langage & Runtime:**
- **TypeScript strict mode** activé (type safety maximale)
- **React 18+** avec hooks modernes
- **Vite 6.x** comme build tool (HMR ultra-rapide)
- **Rust stable** pour backend Tauri
- **Node.js LTS** pour développement frontend

**Solution de Styling:**
- **Tailwind CSS v4** avec plugin Vite
- **CSS Variables** pour theming shadcn/ui
- **Utility-first approach** cohérent monorepo
- **JIT compilation** intégrée

**Build Tooling:**
- **Turbo** pour orchestration builds monorepo
- **pnpm workspaces** pour gestion dépendances
- **Vite** pour bundling frontend optimisé
- **Cargo** pour compilation Rust backend
- **Tree-shaking** automatique
- **Code splitting** configuré

**Testing Framework:**
- **Non inclus par défaut** - à ajouter:
  - Frontend: Vitest + React Testing Library
  - Backend Rust: Tests unitaires intégrés Cargo
  - E2E: Playwright (testé avec Tauri)

**Organisation du Code:**

**Monorepo Structure:**
- **apps/desktop:** Application principale isolée
- **packages/*:** Packages réutilisables avec versions indépendantes
- **Shared dependencies:** Gérées au niveau root
- **Build cache:** Turbo optimise builds incrémentaux

**Patterns Architecturaux:**
- **Monorepo Pattern:** Code partagé entre frontend/backend via packages
- **Component-Based Architecture:** React components modulaires
- **Type-Safe IPC:** Communication Tauri via commandes typées
- **Workspace Dependencies:** Import entre packages via aliases

**Configuration Environnement:**
- **Variables d'environnement** via `import.meta.env` (Vite) + `.env` files
- **Mode dev vs production** gérés automatiquement
- **Tauri config** pour permissions, window, bundling
- **.gitignore** pré-configuré (node_modules, dist, target/)

**Expérience Développement:**
- **Hot Module Replacement** pour React via Vite
- **TypeScript IntelliSense** complet avec aliases monorepo
- **Tauri CLI** pour dev/build (`pnpm tauri dev`, `pnpm tauri build`)
- **Turbo cache** accélère builds répétés
- **pnpm** installation ultra-rapide dépendances
- **Path aliases** simplifient imports (`@splice/ui`, `@splice/types`)

**Note Importante:** L'initialisation du projet avec cette structure monorepo doit être la **première story d'implémentation**. Cela établit la fondation technique organisée sur laquelle tous les composants custom et la Clean Architecture seront construits.

## Prochaine Étape: Architecture Clean Pragmatique

Avec cette structure monorepo établie, nous allons maintenant définir l'architecture en couches (Domain, Application, Infrastructure) adaptée à Tauri + Rust, inspirée de votre architecture tailored-friend mais adaptée au contexte desktop app.
