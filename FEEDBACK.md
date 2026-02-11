# FEEDBACK.md — PinchChat Feedback Queue

## Item #1
- **Date:** 2026-02-11
- **Priority:** high
- **Status:** done
- **Completed:** 2026-02-11 — commit `d58c34f`
- **Description:** Migrer le projet de "ClawChat" vers "PinchChat"

## Item #2
- **Date:** 2026-02-11
- **Priority:** high
- **Status:** done
- **Completed:** 2026-02-11 — commit `8834b2a`
- **Description:** Filtrer les messages "NO_REPLY"

## Item #3
- **Date:** 2026-02-11
- **Priority:** medium
- **Status:** done
- **Completed:** 2026-02-11 — commit `99b7db9`
- **Description:** i18n support

## Item #4
- **Date:** 2026-02-11
- **Priority:** high
- **Status:** done
- **Completed:** 2026-02-11 — commit `36f9480`
- **Description:** Runtime login screen

## Item #5
- **Date:** 2026-02-11
- **Priority:** high
- **Status:** done
- **Completed:** 2026-02-11 — commit `9b3aed4`
- **Description:** Language selector in header

## Item #6
- **Date:** 2026-02-11
- **Priority:** high
- **Status:** pending
- **Description:** Installation simplifiée — Docker + oneliner
  - **Dockerfile** : image légère (nginx:alpine ou similar) qui sert le build statique. Multi-stage : node pour build, nginx pour serve. Pas de secrets dans l'image (tout est runtime via le login screen).
  - **docker-compose.yml** : exemple simple avec juste le container PinchChat
  - **Publier l'image sur ghcr.io** : `ghcr.io/marlburrow/pinchchat:latest` — le CI GitHub Actions doit build & push l'image à chaque push sur main
  - **Oneliner** : `docker run -p 3000:80 ghcr.io/marlburrow/pinchchat:latest` dans le README
  - Alternative sans Docker : `npx pinchchat` ou un script curl qui télécharge le dernier release (build statique) et lance un serveur
  - Mettre à jour le README avec les nouvelles méthodes d'installation

## Item #7
- **Date:** 2026-02-11
- **Priority:** high
- **Status:** pending
- **Description:** Affichage des images dans le chat
  - Rendre les images inline dans les messages (quand le gateway envoie des images en base64/URL via `mediaUrls` ou content blocks de type image)
  - Rendre les images dans les tool results (quand un tool `read` retourne une image, l'afficher au lieu de juste "Read image file [image/png]")
  - Support des formats courants : png, jpg, gif, webp
  - Les images doivent être cliquables pour voir en taille réelle (lightbox ou nouvel onglet)
  - Garder le style dark theme cohérent (bordures arrondies, pas de fond blanc autour des images)

## Item #8
- **Date:** 2026-02-11
- **Priority:** high
- **Status:** in-progress
- **Description:** Intégrer le logo PinchChat
  - Le logo est déjà dans `public/logo.png`
  - L'utiliser comme favicon (générer les tailles appropriées ou utiliser le PNG directement)
  - L'afficher dans le header à côté du titre "PinchChat"
  - L'afficher sur l'écran de login
  - L'ajouter dans le README (en haut, centré)
  - Mettre à jour les meta OG tags pour utiliser le logo

## Item #9
- **Date:** 2026-02-11
- **Priority:** high
- **Status:** pending
- **Description:** GitHub Pages — landing page / démo
  - Activer GitHub Pages sur le repo (branche `gh-pages` ou dossier `docs/`)
  - Créer une landing page simple et stylée (même thème dark neon que l'app) avec :
    - Le logo PinchChat
    - Un titre + tagline
    - Des screenshots/GIFs de l'app
    - Les features principales
    - Un bouton "Get Started" qui pointe vers le README / installation
    - Le oneliner Docker
  - URL : `https://marlburrow.github.io/pinchchat/`
  - Ajouter un lien "Website" dans les settings du repo GitHub
  - Ajouter le workflow GitHub Actions pour déployer automatiquement
