# FEEDBACK.md — PinchChat Feedback Queue

## Item #13
- **Date:** 2026-02-11
- **Priority:** high
- **Status:** done
- **Completed:** 2026-02-11 — commit `d118498`
- **Description:** GitHub Pages landing page — layout & design improvements
  - **Démo en hero** : La démo animée doit être EN HAUT de la page, dans le hero, bien en évidence. Pas en bas. C'est la première chose que les visiteurs doivent voir.
  - **Features layout** : Les feature cards en mosaïque/grid c'est trop classique. Trouver un layout plus original — par exemple : timeline verticale, sections alternées gauche/droite avec illustrations, ou scroll-based reveal. Pas de grid 3x3 basique.

## Item #14
- **Date:** 2026-02-11
- **Priority:** high
- **Status:** done
- **Completed:** 2026-02-11 — commit `84c8e24`
- **Description:** Progress bars plus sobres dans l'app
  - Les barres de tokens dans la sidebar et le header sont trop disparates : gradient cyan→violet, orange quand >80%, rouge quand >95%. C'est pas cohérent.
  - Adopter un style plus sobre et uniforme : une seule couleur douce (ex: un cyan/bleu soft), qui s'intensifie subtilement quand ça se remplit. Pas de changement de couleur radical.
  - Garder ça discret et élégant, pas flashy.

## Item #15
- **Date:** 2026-02-11
- **Priority:** medium
- **Status:** done
- **Completed:** 2026-02-11 — commit `72f7d76`
- **Description:** Ajouter des icônes/emojis sur les tool call badges dans l'app (comme sur la démo de la landing page)
  - Sur la landing page les badges tool calls ont des petits emojis (🔍 pour search, ⚡ pour exec, etc.) — c'est sympa et aide à identifier visuellement le type de tool
  - Reproduire ça dans la vraie app : ajouter une petite icône/emoji devant le nom du tool dans chaque badge
  - Exemples : 🔍 web_search, ⚡ exec, 📖 read, ✏️ write/edit, 🌐 browser, 🖼️ image, 🧠 memory, ⏰ cron, 🚀 sessions_spawn, etc.

## Item #12
- **Date:** 2026-02-11
- **Priority:** high
- **Status:** done
- **Completed:** 2026-02-11 — commit `d26c498`
- **Description:** Animated fake UI demo on the GitHub Pages landing page
  - Créer une version fake/simulée de l'interface PinchChat directement dans la landing page (docs/index.html)
  - L'animation doit montrer un dialogue réaliste entre un utilisateur et un assistant AI, avec :
    - Un message utilisateur qui s'affiche (typing effect)
    - L'assistant qui "réfléchit" (thinking indicator)
    - Des badges de tool calls colorés qui apparaissent (comme dans la vraie app : exec en amber, read en sky, web_search en emerald, etc.)
    - Les tool calls qui s'expandent pour montrer les paramètres/résultats
    - Le message final de l'assistant avec du markdown formaté
    - Une sidebar simplifiée avec quelques sessions fake et des barres de tokens
  - Le tout doit boucler ou rejouer après quelques secondes
  - Utiliser du CSS/JS pur (pas de React, c'est une page statique)
  - Reproduire le même style visuel que l'app (dark theme, mêmes couleurs, mêmes badges, mêmes fonts)
  - L'objectif c'est que les visiteurs voient immédiatement à quoi ressemble l'app sans avoir à l'installer
  - Mettre ça en haut de la landing page, au-dessus ou juste en dessous du hero

## Item #11
- **Date:** 2026-02-11
- **Priority:** high
- **Status:** done
- **Completed:** 2026-02-11 — commit `f556c8d`
- **Description:** Rewrite des features — README + GitHub Pages landing page
  - Les features actuelles sont mal vendues. Trop techniques, pas assez pragmatiques.
  - **Ce qu'il ne faut PAS vendre comme feature :**
    - "Dark neon theme" — on s'en fiche, c'est un choix esthétique pas une feature
    - "Runtime auth / token not in build" — c'est normal, pas un argument de vente
    - "Markdown rendering" — tous les chats font ça
    - "File upload" — basique
  - **Ce qu'il FAUT mettre en avant (la vraie valeur ajoutée vs l'UI native OpenClaw) :**
    - **Visualisation des tool calls** — comprendre ce que l'agent fait en temps réel avec des badges colorés, paramètres visibles, résultats expandables. C'est LA killer feature.
    - **Interface GPT-like** — sessions dans une sidebar, switch entre conversations, familier pour les utilisateurs de ChatGPT/Claude
    - **Focalisé sur le chat** — pas de menus settings/config partout, juste le chat, clean et efficace
    - **Token usage en temps réel** — barres de progression par session, savoir combien de contexte il reste
    - **Multi-session** — voir et naviguer entre toutes les sessions actives (crons, sub-agents, etc.)
    - **Streaming live** — voir l'agent réfléchir et écrire en temps réel
    - **Images inline** — voir les images générées/lues directement dans le chat
    - **i18n** — EN/FR switchable
  - Réécrire la section Features du README avec des descriptions courtes et percutantes
  - Réécrire les feature cards de la landing page (docs/index.html) de la même manière
  - Ordre : les features les plus différenciantes en premier
  - Ton : pragmatique, pas marketing bullshit

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
- **Status:** done
- **Completed:** 2026-02-11 — commit `5fd7300`
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
- **Status:** done
- **Completed:** 2026-02-11 — commit `762a5f2`
- **Description:** Affichage des images dans le chat
  - Rendre les images inline dans les messages (quand le gateway envoie des images en base64/URL via `mediaUrls` ou content blocks de type image)
  - Rendre les images dans les tool results (quand un tool `read` retourne une image, l'afficher au lieu de juste "Read image file [image/png]")
  - Support des formats courants : png, jpg, gif, webp
  - Les images doivent être cliquables pour voir en taille réelle (lightbox ou nouvel onglet)
  - Garder le style dark theme cohérent (bordures arrondies, pas de fond blanc autour des images)

## Item #8
- **Date:** 2026-02-11
- **Priority:** high
- **Status:** done
- **Completed:** 2026-02-11 — commit `97c16be`
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
- **Status:** done
- **Completed:** 2026-02-11 — commit `4f47732`
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

## Item #10
- **Date:** 2026-02-11
- **Priority:** medium
- **Status:** done
- **Completed:** 2026-02-11 — commit `02d2ab3`
- **Description:** Remplacer le diagramme d'architecture ASCII art dans le README par un diagramme Mermaid
  - GitHub rend nativement les blocs ```mermaid dans les README
  - Utiliser un flowchart ou graph LR/TD montrant : Browser → WebSocket → OpenClaw Gateway → LLM Provider, avec les composants internes (LoginScreen, Chat, Sidebar, Gateway client, etc.)
  - Plus lisible et maintenable que l'ASCII art

## Item #22
- **Date:** 2026-02-12
- **Priority:** high
- **Status:** pending
- **Description:** CI GitHub Actions en échec — vérifier et réparer en priorité. Le cron doit aussi vérifier l'état de la CI en début de chaque session avant toute autre amélioration. Si la CI est cassée, c'est la priorité #1.

## Item #23
- **Date:** 2026-02-12
- **Priority:** medium
- **Status:** pending
- **Description:** Icônes par channel/type dans la liste des sessions (sidebar)
  - Discord → icône Discord
  - Telegram → icône Telegram
  - Cron → icône horloge ou engrenage
  - Webchat → icône chat/bulle
  - Fallback générique pour les channels non-vanilla (ex: TeamSpeak) → icône par défaut (bulle ou globe)
  - Utiliser des SVG ou une lib d'icônes (lucide-react, react-icons, etc.)
