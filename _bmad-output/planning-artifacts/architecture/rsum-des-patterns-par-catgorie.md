# Résumé des Patterns par Catégorie

| Catégorie | Pattern Principal | Rationale |
|-----------|-------------------|-----------|
| **Naming** | Rust: `snake_case`, TS: `camelCase`, SQL: `snake_case` | Conformité standards langages |
| **Tests** | Rust: inline + `/tests`, TS: côte-à-côte `.test.tsx` | Découvrabilité facile |
| **Components** | Organisation par feature, barrel exports | Cohésion logique |
| **Rust Modules** | Clean Architecture 3 layers | Séparation concerns claire |
| **Stores** | Multiple stores par domaine | Performance + clarté |
| **Errors** | `Result<T, String>` Tauri, custom domain errors | Sérialisation simple |
| **Dates** | Unix timestamps SQLite, ISO strings API | Storage efficace + transport standard |
| **Progress** | Format uniforme `{current, total, percent}` | UX cohérente |
| **Events** | `domain:action` kebab-case | Lisibilité |
| **Loading** | `isLoading` + `error` pattern | Simplicité |
| **Async** | async/await partout | Lisibilité vs callbacks |
| **Files** | Streaming pour gros fichiers | Évite OOM |

---

Cette section garantit que tous les agents AI générant du code pour Splice suivront les mêmes conventions, évitant conflits et incohérences. Les patterns sont concrets, avec exemples applicables immédiatement.

---
