# RAVE GENERATOR 2 — STUDIO NIKO · Correctif WAV

Groovebox inspirée du son TR-909 et synthé acid, entièrement en HTML/CSS/JavaScript avec Web Audio API. Sans clé API, sans dépendance audio et sans échantillon tiers.

## Démarrer

1. Ouvrir `index.html` dans un navigateur compatible (Chrome, Edge, Firefox). Sur Android, privilégier une installation PWA depuis une adresse HTTPS.
2. Cliquer sur **PLAY** : le navigateur autorise alors Web Audio.
3. Éditer les 11 pistes de percussion, la basse acid, le tempo (60–230 BPM), le swing et les patterns 16/32 pas A–H.
4. Utiliser le **mixer 12 voies**, les volumes, mute/solo, panoramique, tuning, decay, distorsion, filtre, delay, reverb, compresseur et le mode Song à huit slots.
5. Importer des samples WAV/MP3/OGG selon le décodage du navigateur (15 Mo par fichier), ou sauvegarder un projet JSON.

## Enregistrer en WAV — nouveauté corrigée

**REC WAV** démarre la capture réelle de la sortie master (mix batterie + basse acid + effets). Si la lecture n'est pas active, elle démarre automatiquement. **STOP WAV** crée et télécharge un fichier **.wav PCM stéréo 16 bits**, à la fréquence native de l'AudioContext (44,1 kHz ou 48 kHz selon l'appareil). L'enregistrement ne capture pas le micro. Limite de protection mémoire : 8 minutes.

**EXPORT WAV** rend une séquence de 4, 8, 16 ou 32 mesures dans un fichier WAV PCM **44,1 kHz / 16 bits stéréo**, sans attendre la lecture temps réel. Le rendu suit le pattern courant ou le mode Song.

**PARTAGER WAV** utilise la feuille de partage du système si elle est disponible (notamment Android) ; le bouton devient actif après un export/enregistrement. Si le partage de fichier est indisponible, utilisez le fichier enregistré dans **Téléchargements**.

**SUNO** ouvre uniquement https://suno.com/create : pour importer le son dans Suno, sélectionner **Upload Audio / Importer l'audio**, choisir le fichier WAV. Il n'y a **pas d'envoi automatique**, ni de connexion Suno, ni d'API privée intégrée.

## Autres exports

- MIDI de type 1, une piste tempo et 12 pistes d'instruments.
- Export et import de projet JSON avec intégration facultative des samples.
- Sauvegarde automatique en `localStorage` si autorisée par le navigateur.

## PWA et mise à jour

Héberger en HTTPS les fichiers `index.html`, `sw.js`, `manifest.webmanifest` et `icon.svg` sur un serveur statique (GitHub Pages, Vercel, etc.). Le Service Worker a une nouvelle version de cache pour invalider les anciens fichiers et privilégier les mises à jour HTML en ligne avec secours hors ligne.

Le fichier autonome `Rave-Generator-2.html` fonctionne également dans le navigateur, avec des restrictions possibles selon la sécurité du navigateur et du système.

## Compatibilité et vérification

- Fonctions audio basées sur Web Audio API ; l'enregistrement en direct privilégie AudioWorklet, avec repli ScriptProcessor sur les environnements plus anciens/restrictifs.
- Tests automatisés Chromium effectués sur le DOM, la synthèse, l'enregistrement PCM direct et le rendu WAV hors ligne ; vérification des en-têtes RIFF, de la stéréo, de la résolution et de la présence d'audio non silencieux.
- Les téléchargements réels, le partage vers Suno et le comportement sur un téléphone Android physique n'ont pas été testés dans un navigateur réel associé à un appareil ou un compte Suno.

**Marques :** logiciel indépendant de Roland, inspirations fonctionnelles et sonores uniquement.
## Lot de fiabilisation du 22 novembre 2026 — restauration sans perte et WAV

- L'import d'un projet JSON demande désormais une **confirmation explicite** avant de remplacer les patterns, réglages et samples. Un refus ne modifie pas le projet actuel.
- Les éventuels samples joints sont intégralement préparés et décodés **avant** toute substitution des données ; en cas de sample corrompu, le projet actuel est conservé et l'import est refusé, plutôt que de perdre silencieusement les prises précédentes.
- Le bouton d'import est désactivé pendant la préparation des samples pour empêcher deux imports concurrents.
- La CI `tests/check.cjs` valide le code et la présence des protections. `tests/browser-smoke.cjs` vérifie dans Chromium une annulation d'import, une restauration et **le contenu PCM d'un rendu WAV stéréo 44,1 kHz, 16 bits avec signal non nul**.
- Cette validation automatisée ne vaut ni essai sur iPhone/Android physique ni garantie d'enregistrement temps réel, de partage Suno ou de qualité sonore professionnelle.

