# Non-Functional Requirements

## Performance

**Transcription:**
- **NFR1:** La transcription d'une vidéo de 60 minutes doit se compléter en moins de 5 secondes sur un CPU moderne (Intel i7/Ryzen 7 ou équivalent, Apple Silicon M1+)
- **NFR2:** Le système doit afficher un indicateur de progression pendant la transcription pour vidéos >10 minutes
- **NFR3:** La transcription doit fonctionner en arrière-plan sans bloquer l'interface utilisateur

**Découpage vidéo:**
- **NFR4:** Le traitement des cuts pour 1 heure de vidéo source doit se compléter en moins de 30 secondes
- **NFR5:** Le découpage vidéo doit utiliser un traitement streaming pour éviter de saturer la mémoire (RAM usage <4GB pour vidéos 50GB)
- **NFR6:** Le système doit afficher une barre de progression en temps réel pendant le traitement des cuts

**Interface utilisateur:**
- **NFR7:** Les interactions UI principales (surlignage texte, navigation) doivent répondre en moins de 100ms
- **NFR8:** La preview vidéo doit démarrer en moins de 2 secondes après génération des cuts
- **NFR9:** L'application doit démarrer en moins de 3 secondes sur des machines avec SSD

**Export:**
- **NFR10:** L'export MP4 ne doit pas prendre plus de 2x la durée de la vidéo finale (ex: vidéo finale 20min = export max 40min)
- **NFR11:** Le système doit préserver la qualité vidéo originale sans ré-encodage inutile

## Security

**Données utilisateur:**
- **NFR12:** Les vidéos importées ne doivent jamais être envoyées vers des serveurs externes (traitement 100% local)
- **NFR13:** Les tokens de licence doivent être stockés de manière sécurisée (Keychain macOS, Credential Manager Windows)
- **NFR14:** Toutes les communications avec le backend de licence doivent utiliser HTTPS avec validation certificat

**Paiements:**
- **NFR15:** Les informations de paiement ne doivent jamais transiter par ou être stockées par Splice (délégation complète à Stripe)
- **NFR16:** Les tokens d'authentification doivent expirer et nécessiter re-validation après 30 jours de grace period

**Code & distribution:**
- **NFR17:** L'application macOS doit être signée et notarisée par Apple pour éviter les avertissements Gatekeeper
- **NFR18:** L'application Windows doit être signée avec code signing pour éviter les warnings SmartScreen
- **NFR19:** Les mises à jour téléchargées doivent être signées et validées avant installation

**Confidentialité:**
- **NFR20:** Aucune donnée analytique ou télémétrie ne doit être collectée en MVP (pas de tracking utilisateur)
- **NFR21:** Les logs locaux ne doivent pas contenir de données sensibles (pas de contenu transcript, pas de chemins fichiers complets)

## Reliability

**Stabilité:**
- **NFR22:** Le taux de crash doit être inférieur à 1% des sessions utilisateur
- **NFR23:** Le système doit gérer gracieusement les fichiers vidéo corrompus ou mal formés sans crasher
- **NFR24:** Le système doit gérer les situations de manque d'espace disque avec des messages d'erreur clairs

**Sauvegarde & récupération:**
- **NFR25:** Le système doit sauvegarder automatiquement le transcript et les passages surlignés toutes les 30 secondes
- **NFR26:** En cas de crash, le système doit offrir de récupérer le dernier projet en cours au redémarrage
- **NFR27:** Les projets non exportés ne doivent pas être perdus en cas de fermeture brutale

**Gestion d'erreurs:**
- **NFR28:** Tous les échecs de téléchargement (modèle Parakeet, mises à jour) doivent offrir un retry automatique avec backoff exponentiel
- **NFR29:** Les messages d'erreur doivent être actionnables et en français (langue de l'utilisateur)
- **NFR30:** Le système ne doit jamais afficher de stack traces techniques aux utilisateurs finaux

**Offline resilience:**
- **NFR31:** Le système doit fonctionner à 100% sans connexion internet après installation initiale et téléchargement du modèle
- **NFR32:** La vérification licence en échec (pas de connexion) ne doit pas bloquer l'utilisation pendant 7 jours (grace period)

## Integration

**FFmpeg:**
- **NFR33:** Le système doit bundler FFmpeg compatible avec toutes les plateformes supportées (macOS Intel/Silicon, Windows)
- **NFR34:** Le traitement vidéo doit supporter les codecs courants H.264, H.265 (HEVC) sans installation additionnelle

**Formats vidéo:**
- **NFR35:** Le système doit détecter et rejeter les formats/codecs non supportés avec un message clair avant traitement
- **NFR36:** L'export MP4 doit utiliser le codec H.264 (compatible universellement) avec profil High à qualité préservée

**Compatibilité outils pro:**
- **NFR37:** Les MP4 exportés doivent être immédiatement importables dans Adobe Premiere Pro CC 2020+ sans erreur
- **NFR38:** Les MP4 exportés doivent être immédiatement importables dans DaVinci Resolve 17+ sans erreur

**Modèle ML:**
- **NFR39:** Le système doit détecter si Parakeet est déjà téléchargé et skip le téléchargement si présent et valide
- **NFR40:** Le modèle Parakeet doit fonctionner sur CPU-only sans dépendances GPU/CUDA pour MVP
