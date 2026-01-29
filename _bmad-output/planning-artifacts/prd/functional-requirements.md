# Functional Requirements

## Video Import & Management

**FR1:** Les utilisateurs peuvent importer des fichiers vidéo par glisser-déposer depuis leur système de fichiers

**FR2:** Le système peut accepter les formats vidéo MP4, MOV, et AVI

**FR3:** Le système peut valider le format et le codec du fichier vidéo importé

**FR4:** Le système peut afficher un message d'erreur clair si le fichier importé n'est pas supporté

**FR5:** Le système peut gérer des fichiers vidéo jusqu'à 50GB sans échec

**FR6:** Les utilisateurs peuvent importer un seul projet vidéo à la fois (mono-projet MVP)

## Transcription

**FR7:** Le système peut télécharger automatiquement le modèle de transcription Parakeet lors du premier lancement

**FR8:** Le système peut afficher une barre de progression pendant le téléchargement du modèle

**FR9:** Le système peut générer automatiquement un transcript textuel à partir de l'audio de la vidéo importée

**FR10:** Le système peut effectuer la transcription localement sur la machine de l'utilisateur (on-device)

**FR11:** Le système peut générer des word-level timestamps (timestamp par mot) pour le transcript

**FR12:** Le système peut afficher le transcript généré dans une interface textuelle lisible

**FR13:** Le système peut gérer la transcription de vidéos jusqu'à 2 heures de durée

## Content Editing

**FR14:** Les utilisateurs peuvent lire le transcript comme du texte dans l'interface

**FR15:** Les utilisateurs peuvent surligner des passages de texte dans le transcript

**FR16:** Le système peut identifier les passages surlignés comme "passages à garder"

**FR17:** Les utilisateurs peuvent dé-surligner des passages précédemment surlignés

**FR18:** Le système peut synchroniser visuellement le texte surligné avec les segments vidéo correspondants

## Video Processing

**FR19:** Le système peut générer automatiquement des cuts vidéo basés sur les passages surlignés

**FR20:** Le système peut appliquer des marges temporelles automatiques (0.1s) avant et après chaque cut pour des transitions naturelles

**FR21:** Le système peut traiter le découpage vidéo en streaming pour éviter de charger la vidéo entière en mémoire

**FR22:** Le système peut afficher une barre de progression pendant le traitement des cuts

**FR23:** Le système peut garantir que les cuts ne coupent jamais au milieu d'un mot (utilisation word-level timestamps)

**FR24:** Le système peut assembler automatiquement les segments surlignés dans l'ordre chronologique

## Preview & Validation

**FR25:** Les utilisateurs peuvent prévisualiser la vidéo cutée avant l'export

**FR26:** Le système peut fournir des contrôles de lecture basiques (play, pause) dans le lecteur de preview

**FR27:** Le système peut fournir un scrubbing basique dans le lecteur de preview

**FR28:** Les utilisateurs peuvent valider que les cuts correspondent à leurs attentes avant d'exporter

## Export

**FR29:** Les utilisateurs peuvent exporter la vidéo cutée en format MP4

**FR30:** Le système peut encoder l'export en codec H.264 pour compatibilité universelle

**FR31:** Le système peut préserver la qualité originale de la vidéo lors de l'export

**FR32:** Le système peut afficher une barre de progression pendant l'export

**FR33:** Les utilisateurs peuvent télécharger le fichier MP4 exporté sur leur système de fichiers

**FR34:** Le système peut générer un fichier export prêt à être importé dans Premiere Pro ou DaVinci Resolve

## Licensing & Monetization

**FR35:** Le système peut vérifier la licence de l'utilisateur au démarrage de l'application

**FR36:** Le système peut limiter les vidéos sources à 30 minutes maximum pour les utilisateurs gratuits (freemium)

**FR37:** Le système peut bloquer l'export pour les utilisateurs freemium après la preview

**FR38:** Le système peut afficher un message de conversion vers abonnement payant au moment du blocage export

**FR39:** Le système peut accepter des codes early adopters pour débloquer l'accès lifetime gratuit

**FR40:** Le système peut fonctionner offline pendant une période de grace de 7 jours sans vérification licence

**FR41:** Le système peut afficher un message informatif après 7 jours offline demandant une connexion pour vérifier la licence

**FR42:** Le système peut réinitialiser le compteur de grace period après une vérification licence réussie

## Platform & Distribution

**FR43:** Le système peut s'installer sur macOS 13 Ventura et supérieur (Intel et Apple Silicon)

**FR44:** Le système peut s'installer sur Windows 10 22H2 et supérieur, et Windows 11

**FR45:** Le système peut vérifier automatiquement la disponibilité de mises à jour au démarrage

**FR46:** Le système peut télécharger et installer les mises à jour de manière silencieuse en arrière-plan

**FR47:** Le système peut afficher un indicateur discret de mise à jour disponible sans bloquer le workflow

**FR48:** Le système peut appliquer les mises à jour au prochain redémarrage de l'application

**FR49:** Les administrateurs système peuvent signer et notariser l'application pour macOS

**FR50:** Les administrateurs système peuvent signer l'application pour Windows (code signing)

## Error Handling & User Feedback

**FR51:** Le système peut afficher des messages d'erreur clairs et actionnables en cas de problème

**FR52:** Le système peut gérer gracieusement les échecs de connexion réseau (téléchargement Parakeet, vérification licence)

**FR53:** Le système peut fournir un retry automatique en cas d'échec de téléchargement du modèle Parakeet

**FR54:** Le système peut afficher des messages d'état pour informer l'utilisateur des opérations en cours

---
