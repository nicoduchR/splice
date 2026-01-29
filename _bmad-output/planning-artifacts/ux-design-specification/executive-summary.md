# Executive Summary

## Project Vision

Splice transforme le dérushage vidéo en remplaçant le scrubbing manuel chronophage (1h15 pour 1h de rushes) par un workflow textuel ultra-rapide (3-5 minutes). L'utilisateur importe sa vidéo, obtient un transcript instantané via transcription locale (Parakeet), surligne les passages à garder dans une interface familière type logiciel de montage, et obtient des cuts automatiques précis prêts à exporter.

**Innovation UX clé:** Introduire le paradigme textuel (curation par surlignage) dans une interface timeline familière aux monteurs professionnels, réduisant drastiquement la courbe d'apprentissage tout en offrant le contrôle frame-par-frame qu'ils attendent.

## Target Users

**Profil principal:** Monteurs vidéo professionnels et créateurs de contenu avec niveau technique élevé, habitués aux outils professionnels (Premiere Pro, DaVinci Resolve, CapCut). Utilisateurs exigeants qui connaissent leur métier et attendent une interface polie, rapide, et précise.

**Personas clés:**
1. **Orlan** - Monteur pro (15 vidéos/semaine, interviews longues, besoin massif de gain de temps)
2. **Nicolas** - Créateur tech solo (limité par temps de montage, veut tripler sa production)
3. **Sophie** - Podcasteuse gaming (sceptique mais convertie par la preuve de valeur)

**Caractéristiques comportementales:**
- Workflow séquentiel: Splice → Export → Import dans leur NLE principal
- Pensent en "frames", "secondes", "cuts", "timeline"
- Tolérance zéro pour bugs ou lenteur
- Apprécient les raccourcis clavier et navigation efficace
- Besoin de contrôle précis (ajustements frame par frame)

## Key Design Challenges

**Challenge 1: Hybridation paradigmes**
Créer une interface qui marie le paradigme textuel (surlignage de transcript) avec les patterns mentaux timeline des monteurs. L'utilisateur doit voir immédiatement "timeline en bas + texte à gauche" et comprendre instinctivement le lien entre les deux.

**Challenge 2: Balance rapidité / précision**
Le workflow principal doit être ultra-rapide (surlignage → cuts en 3min) MAIS offrir des outils d'ajustement précis frame par frame pour les 5% de cas nécessitant des retouches. Deux modes d'interaction: Quick (surlignage massif) et Precision (ajustement fin avec flèches clavier, marges personnalisées).

**Challenge 3: Feedback pour opérations longues**
Gros fichiers (15-50GB) créent de l'anxiété. Besoin de feedback rassurant et précis: barre de progression, pourcentage, estimation temps restant, possibilité d'annuler à tout moment. Gestion d'erreurs gracieuse avec retry facile si transcription échoue.

**Challenge 4: Moment de conversion freemium**
Créer une frustration calculée au moment optimal: après preview parfaite (utilisateur convaincu de la valeur) mais avant export (blocage total). Message doit transformer frustration en achat immédiat: "Vous venez de créer votre vidéo en 5min au lieu de 1h15. Débloquez l'export maintenant."

## Design Opportunities

**Opportunité 1: Exploitation patterns familiers**
Utiliser l'interface timeline que les monteurs connaissent par cœur (timeline en bas, contrôles lecture familiers, navigation clavier) pour créer un sentiment immédiat de familiarité. Réduction courbe d'apprentissage à quasi-zéro.

**Opportunité 2: Innovation dans la familiarité**
Introduire la "magie" (transcript instantané, cuts automatiques) dans un contexte visuel familier. La timeline devient synchronisée avec le texte surligné - pattern mental nouveau mais ancré dans leurs habitudes.

**Opportunité 3: Conversion par preuve irréfutable**
Le modèle freemium devient un démonstrateur de valeur: l'utilisateur voit sa vidéo parfaitement cutée en preview, calcule mentalement le temps gagné, puis se heurte au blocage export. Conversion naturelle car valeur déjà prouvée.

**Opportunité 4: Crédibilité professionnelle**
Offrir ajustements frame par frame, contrôle marges précis, export qualité préservée = signaux de crédibilité pour utilisateurs pros. Splice n'est pas un "jouet" mais un outil pro qui respecte leur expertise.
