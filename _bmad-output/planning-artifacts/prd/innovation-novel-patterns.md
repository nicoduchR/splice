# Innovation & Novel Patterns

## Detected Innovation Areas

**Paradigme inversé du découpage vidéo:**
Splice inverse le paradigme des outils existants (Descript, Autopod) qui coupent les **silences**. Splice permet de **couper le contenu parlé lui-même** - sélectionner intelligemment quels passages de dialogue garder ou supprimer. Passage d'une logique de "suppression des blancs" à "curation du contenu".

**Desktop AI locale pour confidentialité et performance:**
Contrairement aux solutions cloud (Whisper API, AssemblyAI), Splice utilise Parakeet TDT 0.6B v3 en **transcription locale on-device**:
- **Performance:** 60min → 1-2s sans latence réseau
- **Confidentialité:** Monteurs pros travaillent sur projets sensibles (interviews non publiques, contenu entreprise) qui ne peuvent être envoyés à OpenAI. Argument de vente critique.

**Interface textuelle pour workflow vidéo:**
Transformer le dérushage - tâche visuelle/temporelle (scrubber timeline) - en **lecture et annotation de texte**. Le monteur lit le transcript comme un article, surligne les passages pertinents, système génère cuts automatiquement avec précision au mot près.

## Market Context & Competitive Landscape

**Outils existants - Focus silences:**
- **Descript:** Édition vidéo via texte, mais surtout sous-titres et retrait silences
- **Autopod:** Coupe automatique silences podcasts
- **Premiere Auto-Reframe:** Recadrage auto, pas découpage contenu

**Gap de marché:**
Aucun outil ne permet de **sélectionner textuellement les passages parlés à conserver** et générer cuts automatiques. Les monteurs doivent toujours: écouter/regarder rushes, scrubber manuellement, couper manuellement.

Validation Orlan (5 ans d'expérience): *"Les outils de coupe des blancs existent. Mais personne n'a fait un outil où tu surligne le texte et ça coupe la vidéo automatiquement."*

**Positionnement unique:**
Splice se positionne entre sous-titrage automatique (pas de découpage) et coupe de silences (pas de contenu parlé). Nouvel espace dans le workflow de montage.

## Validation Approach

**Phase 1 - Pilotes:**
- Orlan: monteur pro, 15 vidéos/semaine, besoin validé 1h15→3-5min
- Ayub: monteur chaîne YouTube Nicolas, feedback terrain workflow pro

**Métrique validation:**
Réduction dérushage 1h15→3-5min (95%) avec cuts qualité pro (<5% retouches) = innovation validée.

**Phase 2 - Réseau (0-3 mois):**
10 premiers utilisateurs réseau Orlan, monteurs pros volume important, validation besoin au-delà des 2 pilotes.

**Critères réussite innovation:**
- Adoption monteurs pro
- Usage régulier 2-5 vidéos/semaine
- Conversion freemium >10%
- NPS >50

## Risk Mitigation

**Risque 1 - Précision transcription:**
- Impact: Transcript inutilisable
- Probabilité: Faible (benchmarks Parakeet 95-98%)
- Mitigation: Tests réels Orlan/Ayub, correction manuelle V2, fallback Whisper API

**Risque 2 - Cuts imprécis:**
- Impact: Retouches manuelles, valeur réduite
- Probabilité: Faible (word-level timestamps)
- Mitigation: Marges 0.1s auto, tests intensifs, ajustement marges si nécessaire

**Risque 3 - Performance gros fichiers:**
- Impact: Crashes, lenteur
- Probabilité: Moyenne (15-50GB challengeant)
- Mitigation: Architecture streaming, tests charge 4K 50GB, Rust optimisé, support prioritaire early adopters

**Risque 4 - Adoption limitée:**
- Impact: Pas assez d'utilisateurs PMF
- Probabilité: Faible (validation terrain)
- Mitigation: Validation 2 monteurs, extension bouche-à-oreille, pivot créateurs solo si nécessaire

**Risque 5 - Confidentialité pas valorisée:**
- Impact: Différenciateur local vs cloud pas perçu
- Probabilité: Moyenne
- Mitigation: Marketing explicite confidentialité, testimonials projets sensibles, certifications V2

**Fallback général:**
Si approche innovante échoue, Splice reste outil de transcription locale ultra-rapide avec édition textuelle - déjà valeur significative.

---
