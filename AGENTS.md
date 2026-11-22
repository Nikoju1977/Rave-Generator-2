# Consignes agent Studio Niko — Modern Web Guidance

Références web officielles : https://github.com/GoogleChrome/modern-web-guidance
En environnement de développement Node.js, consulter les guides actuels via `npx modern-web-guidance@latest search "responsive web controls"` et `npx modern-web-guidance@latest retrieve "<id>"` après avoir obtenu le vrai identifiant.
Privilégier HTML sémantique, accessibilité clavier et tactile, API web natives, CSS responsive, états de chargement/erreur explicites, compatibilité Safari iOS/Chrome Android/Firefox, gestion de ressources et de mémoire, fallbacks justifiés.

## Contraintes du dépôt

Groovebox 909 / synthé acid. Préserver l'horloge, les patterns, la sortie Web Audio, la capture/enregistrement WAV PCM, les exports MIDI et le comportement sans API externe. Activer l'AudioContext uniquement après interaction et borner la mémoire des exports.

## Exigences de livraison

- Ne pas introduire de clés ou données privées dans un dépôt public ; respecter les licences.
- Préserver les fonctionnalités existantes, les formats enregistrés et les chemins GitHub Pages.
- Aucune campagne de tests à lancer sans instruction explicite du propriétaire. Ne jamais déclarer non vérifié comme testé ou déployé.
- Distinguer code modifié, commit confirmé, hébergement publié et fonctionnement réel.
