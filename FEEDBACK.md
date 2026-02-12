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
- **Status:** done
- **Completed:** 2026-02-12 — commit `29482e3`
- **Description:** CI GitHub Actions en échec — vérifier et réparer en priorité. Le cron doit aussi vérifier l'état de la CI en début de chaque session avant toute autre amélioration. Si la CI est cassée, c'est la priorité #1.

## Item #23
- **Date:** 2026-02-12
- **Priority:** medium
- **Status:** done
- **Completed:** 2026-02-12 — commit `73d9e5f`
- **Description:** Icônes par channel/type dans la liste des sessions (sidebar)
  - Discord → icône Discord
  - Telegram → icône Telegram
  - Cron → icône horloge ou engrenage
  - Webchat → icône chat/bulle
  - Fallback générique pour les channels non-vanilla (ex: TeamSpeak) → icône par défaut (bulle ou globe)
  - Utiliser des SVG ou une lib d'icônes (lucide-react, react-icons, etc.)

## Item #24
- **Date:** 2026-02-12
- **Priority:** medium
- **Status:** done
- **Completed:** 2026-02-12 — commit `96f2883`
- **Description:** Display agent and model info in the UI
- **Details:**
  - Show the OpenClaw agent ID (e.g. "main") and the model being used (e.g. "claude-opus-4-6") somewhere in the UI
  - Investigate what data `sessions.list` and the connect response return — look for `agentId`, `model`, `defaultModel` or similar fields
  - Good placement options: in the header bar near the session name, or in a small info tooltip/popover
  - If the gateway doesn't expose this info via WebSocket, check if there's another endpoint or if it can be inferred from the session key
  - Keep it subtle/non-intrusive — small text or an info icon that reveals details on hover
  - This helps users know which agent/model is handling their conversation

## Item #25
- **Date:** 2026-02-12
- **Priority:** high
- **Status:** done
- **Completed:** 2026-02-12 — commit `1465ae1`
- **Description:** Move model badge from header to left of token progress bar
- **Details:**
  - Currently the model chip is in the navbar/header — too cramped on mobile
  - Move it to the left of the token usage progress bar instead
  - Should be subtle, same style as surrounding elements
  - Remove it from the header entirely

## Item #26
- **Date:** 2026-02-12
- **Priority:** high
- **Status:** done
- **Completed:** 2026-02-12 — commit `8ef1b42`
- **Description:** Mobile viewport overflow — conversation clipped on left and right edges on iPhone
- **Details:**
  - On iPhone, the chat messages are slightly clipped on both sides, requiring the user to pinch-zoom out
  - Likely a viewport/padding/overflow issue — check meta viewport tag, body/container width, and message padding
  - Ensure `<meta name="viewport" content="width=device-width, initial-scale=1">` is correct
  - Check for any elements with fixed widths or horizontal overflow (code blocks, tool calls, long URLs)
  - Test with responsive dev tools at 375px width (iPhone SE) and 390px (iPhone 14)
  - May need `overflow-x: hidden` on the main container or `max-width: 100vw` adjustments

## Item #27
- **Date:** 2026-02-12
- **Priority:** high
- **Status:** done
- **Completed:** 2026-02-12 — commit `aa158ad`
- **Description:** Clean release workflow with Docker image tags
- **Details:**
  - Currently no proper version tags on Docker images — needs a clean release process
  - Create a GitHub Actions release workflow that:
    1. Triggers on git tag push (v*)
    2. Builds Docker image
    3. Pushes to ghcr.io with proper tags: `vX.Y.Z`, `vX.Y`, `vX`, `latest`
    4. Creates a GitHub Release with changelog excerpt
  - Stop bumping versions in the cron — versions should only be bumped via the release workflow
  - The cron should NOT create tags or releases — it should commit to main with conventional commits, and Nicolas (or a manual trigger) decides when to cut a release
  - Consider using `release-please` or a simple manual workflow_dispatch with version input
  - Current Docker workflow (if any) should be reviewed and replaced by this proper one

## Item #29
- **Date:** 2026-02-12
- **Priority:** medium
- **Status:** done
- **Completed:** 2026-02-12 — commit `fa9b10a`
- **Description:** Sidebar resizable par drag & drop
- **Details:**
  - Les noms de sessions sont coupés dans la sidebar
  - Permettre à l'utilisateur de redimensionner la sidebar en glissant le bord droit
  - Persister la largeur choisie (localStorage)

## Item #30
- **Date:** 2026-02-12
- **Priority:** medium
- **Status:** done
- **Completed:** 2026-02-12 — commit `e94325b`
- **Description:** Supprimer une session depuis la sidebar
- **Details:**
  - Ajouter un bouton/action pour supprimer une session (clic droit ou icône)
  - Confirmation avant suppression
  - Vérifier si le gateway expose un endpoint de suppression de session

## Item #31
- **Date:** 2026-02-12
- **Priority:** medium
- **Status:** done
- **Completed:** 2026-02-12 — commit `03eb9e6`
- **Description:** Contenu des inputs scopé par session
- **Details:**
  - Quand on commence à taper un message dans une session puis qu'on switch vers une autre, le brouillon doit être conservé
  - Stocker les drafts par sessionKey (en mémoire ou localStorage)
  - Restaurer le brouillon quand on revient sur la session

## Item #32
- **Date:** 2026-02-12
- **Priority:** medium
- **Status:** done
- **Completed:** 2026-02-12 — commit `52a1a7f`
- **Description:** Meilleur titre de session en haut de page
- **Details:**
  - Actuellement on voit un UUID moche comme titre
  - Afficher un nom plus lisible : le displayName de la session, ou le channel + contexte
  - Pour les sessions main : afficher "Main" ou le nom de l'agent
  - Pour les sub-agents : afficher le label s'il existe
  - Fallback : session key nettoyée (sans le préfixe agent:xxx:)

## Item #33
- **Date:** 2026-02-12
- **Priority:** medium
- **Status:** done
- **Completed:** 2026-02-12 — commit `17ff52a`
- **Description:** Afficher le nom de l'agent dans l'UI
- **Details:**
  - Montrer clairement à quel agent on parle (pas juste l'agentId technique)
  - Utile pour le multi-agent : savoir si on parle à "Marlbot" ou à un autre agent
  - Placement : header ou en haut du chat

## Item #34
- **Date:** 2026-02-12
- **Priority:** high
- **Status:** done
- **Completed:** 2026-02-12 — commit `581675d`
- **Description:** Distinguer les événements système des messages utilisateur
- **Details:**
  - Les événements système (TeamSpeak join/leave, webhooks, heartbeats, etc.) arrivent comme des messages `role: user` et s'affichent comme si c'était l'utilisateur qui parlait
  - Il faut les détecter et les afficher différemment — petite notification grisée/discrète, pas une bulle utilisateur
  - Indices pour les détecter : présence de `[EVENT]`, `[from: ... (system)]`, `[HEARTBEAT]`, messages qui matchent le heartbeat prompt, etc.
  - Peut aussi checker si le gateway expose un champ type `source` ou `system` dans les métadonnées du message
  - Ces messages ne devraient pas avoir le même poids visuel que les vrais messages de l'utilisateur

## Item #28
- **Date:** 2026-02-12
- **Priority:** high
- **Status:** done
- **Completed:** 2026-02-12 — tagged `v1.4.0`
- **Description:** Cron should auto-tag releases with semver based on commit type
- **Details:**
  - The cron knows what changes it made (feat, fix, docs, refactor, etc.)
  - It should auto-determine the version bump based on conventional commits:
    - `feat:` → minor bump
    - `fix:` / `refactor:` / `style:` / `perf:` → patch bump
    - `docs:` / `ci:` / `chore:` → no release (skip tagging)
    - Breaking changes → major bump
  - After each meaningful commit (feat or fix), the cron should:
    1. Read current version from package.json
    2. Determine bump type from commit prefix
    3. Bump version in package.json
    4. Update CHANGELOG.md (move unreleased to new version section)
    5. Commit the version bump
    6. Create and push the git tag (vX.Y.Z)
    7. The release.yml workflow handles the rest (Docker, GitHub Release)
  - Accumulate doc/ci changes — only tag when there's a feat or fix to release
  - This replaces the previous "Nicolas tags manually" approach

## Item #35
- **Date:** 2026-02-12
- **Priority:** high
- **Status:** done
- **Completed:** 2026-02-12 — commit `4c8faf0`
- **Description:** Markdown not rendering in long assistant messages — raw `**bold**` shown
- **Details:**
  - Reported by Josh (external user) — screenshot shows `**Hypothèse :**` rendered as raw text instead of bold
  - Happens on long responses with multiple sections
  - The message content appears to bypass ReactMarkdown rendering
  - Investigate: is it a blocks vs content fallback issue? Does the message have empty blocks array but content filled?
  - Check if autoFormatText() is interfering with markdown syntax
  - Verify that streaming → final transition properly re-renders with markdown
  - Test with a long multi-section response to reproduce

## Item #36
- **Date:** 2026-02-12
- **Priority:** medium
- **Status:** done
- **Completed:** 2026-02-12 — commit `cecfa3e`
- **Description:** Prettier scrollbar in the text input field (ChatInput textarea)
- **Details:**
  - On macOS the default scrollbar in the textarea looks ugly
  - Style it with custom CSS (thin, dark theme matching the UI — similar to the chat scroll area)
  - Use webkit-scrollbar styles + scrollbar-width/scrollbar-color for Firefox
  - Keep it subtle: thin track, small thumb with rounded corners, matching the zinc/cyan theme
  - Reported by Josh (external user on macOS)

## Item #37
- **Date:** 2026-02-12
- **Priority:** high
- **Status:** done
- **Completed:** 2026-02-12 — commit `ad7d149`
- **Description:** Scrollbar in textarea still ugly on Windows (horizontal scrollbar)
- **Details:**
  - Josh reports the textarea horizontal scrollbar is still ugly/beige on Windows even after v1.11.0
  - The webkit scrollbar fix from #36 may not apply to the textarea horizontal scrollbar
  - Screenshot shows a small beige/gold horizontal scrollbar at the bottom of the input area
  - May need to also hide the horizontal scrollbar entirely (textarea shouldn't need horizontal scroll — use word-wrap/overflow-wrap instead)
  - Add `overflow-x: hidden` on the textarea to prevent horizontal scrollbar entirely
  - Also check that `resize: none` is set and `word-break: break-word` / `overflow-wrap: break-word` to avoid horizontal overflow

## Item #38
- **Date:** 2026-02-12
- **Priority:** high
- **Status:** done
- **Completed:** 2026-02-12 — commit `d9e1b88`
- **Description:** Session deletion doesn't persist — deleted sessions reappear after page refresh
- **Details:**
  - The delete session feature (v1.7.0) only deletes from local state/localStorage
  - On refresh, sessions are reloaded from the gateway via loadHistory/listSessions API
  - Need to actually call the gateway API to delete the session server-side
  - Check if the gateway WS protocol supports session deletion (DELETE or a command message)
  - If not, at minimum maintain a localStorage blacklist of deleted session keys and filter them out on reload

## Item #39
- **Date:** 2026-02-12
- **Priority:** medium
- **Status:** done
- **Completed:** 2026-02-12 — commit `b4813f0`
- **Description:** Message metadata viewer — discreet button on each message to show raw metadata
- **Details:**
  - Small icon button (ℹ️ or ⋯) on hover of each message
  - Click to expand/toggle a subtle panel showing all available metadata: timestamp, message_id, channel, sender info, session key, etc.
  - Should show whatever the gateway sends in the message object (raw dump or formatted key/value pairs)
  - Keep it discreet — not visible by default, only on hover, doesn't clutter the UI
  - Useful for debugging and understanding message routing
  - Collapsed by default, like the tool call details

## Item #40
- **Date:** 2026-02-12
- **Priority:** medium
- **Status:** done
- **Completed:** 2026-02-12 — commit `25e63f8`
- **Description:** Better thinking/reasoning indicator when content is hidden
- **Details:**
  - When the gateway streams a thinking block without visible content (thinking=low), PinchChat shows "Thinking..." but nothing happens for a while
  - Improve the UX: show elapsed time counter, maybe a pulsing animation, and a label like "Reasoning..." or "Thinking (hidden)..."
  - If the gateway sends thinking content (thinking=stream), display it in a collapsible block (already works)
  - If no content is sent, at least show the user that the agent is actively reasoning and how long it's been
  - Keep it purely client-side, no gateway modifications

## Item #41
- **Date:** 2026-02-12
- **Priority:** medium
- **Status:** pending
- **Description:** Tool call payload viewer — word-wrap toggle instead of horizontal scroll
- **Details:**
  - Currently tool call JSON payloads/results have long lines that require horizontal scrolling
  - Add a toggle button (wrap/nowrap) on the tool call content viewer
  - Default to word-wrap (break-word / white-space: pre-wrap) so content fits without horizontal scroll
  - Optional toggle to switch to nowrap (pre + overflow-x scroll) for when users want to see raw formatting
  - Apply to both tool call parameters and tool results

## Item #42
- **Date:** 2026-02-12
- **Priority:** high
- **Status:** done
- **Completed:** 2026-02-12 — commit `792a34b`
- **Description:** Visual differentiation between user messages and assistant messages/tool calls
- **Details:**
  - Currently user and assistant messages look too similar
  - Add distinct background color or left border color for user messages (like classic chat apps)
  - Keep it subtle and matching the dark theme (e.g. slightly different zinc shade, or a colored left border like cyan for user)
  - Assistant messages stay as-is, tool calls already have their own styling
  - System events should also be visually distinct (already somewhat handled but could be improved)
  - Think WhatsApp/Telegram style: your messages vs their messages are clearly different
  - Keep the soft palette for keratoconus — no harsh contrast

## Item #43
- **Date:** 2026-02-12
- **Priority:** medium
- **Status:** done
- **Completed:** 2026-02-12 — commit `7388139`
- **Description:** Textarea scrollbar always visible — should only show on overflow
- **Details:**
  - The vertical scrollbar in the message input textarea is always displayed
  - It should only appear when the content exceeds the max height (overflow)
  - Use overflow-y: auto instead of overflow-y: scroll on the textarea
  - The scrollbar should be hidden when the textarea hasn't reached its max size

## Item #44
- **Date:** 2026-02-12
- **Priority:** high
- **Status:** done
- **Completed:** 2026-02-12 — commit `3ca76eb`
- **Description:** User message styling from #42 needs rework — too dark and off-brand
- **Details:**
  - The violet tint from #42 is too dark and doesn't fit the color scheme
  - Use a lighter, more visible differentiation — try cyan/teal tones instead of violet (matches the existing cyan accent theme)
  - Could use a lighter background (slightly brighter than assistant messages) or a colored left border
  - Keep it subtle but clearly distinguishable
  - Test against the zinc dark theme to make sure it's readable for keratoconus (no harsh contrast)

## Item #45
- **Date:** 2026-02-12
- **Priority:** high
- **Status:** done
- **Completed:** 2026-02-12 — commit `da2e486`
- **Description:** Display the agent's avatar when set in OpenClaw config
  - OpenClaw gateway can provide an avatar URL for the agent (configured in openclaw.json)
  - PinchChat should display this avatar next to assistant messages instead of the default Bot icon
  - Check the gateway WebSocket session/handshake data for avatar info
  - Fallback to the current default icon if no avatar is configured
  - Should also appear in the header next to the agent name

## Item #46
- **Date:** 2026-02-12
- **Priority:** high
- **Status:** done
- **Completed:** 2026-02-12 — commit `9f67c9e`
- **Description:** Bug: metadata viewer (ℹ️ button) doesn't work
  - Clicking the info button on messages does nothing — no panel appears
  - Introduced in v1.15.0 (commit `b4813f0`)
  - Fix the click handler / panel display logic

## Item #47
- **Date:** 2026-02-12
- **Priority:** medium
- **Status:** pending
- **Description:** Themes — light mode, OLED black, custom theme support
  - Add theme switcher (dark default, light mode, OLED black)
  - Configurable accent color
  - Persist choice in localStorage

## Item #48
- **Date:** 2026-02-12
- **Priority:** medium
- **Status:** pending
- **Description:** Message search — Ctrl+F in conversation history
  - Search bar that filters/highlights messages in the current session
  - Navigate between results (up/down arrows)
  - Keyboard shortcut Ctrl+F

## Item #49
- **Date:** 2026-02-12
- **Priority:** medium
- **Status:** pending
- **Description:** Syntax highlight in the input textarea
  - Color code blocks even while typing in the prompt input
  - Highlight markdown syntax (bold, code, headers) in real-time

## Item #50
- **Date:** 2026-02-12
- **Priority:** medium
- **Status:** pending
- **Description:** Multi-tab — split view for 2 sessions side by side
  - Allow viewing 2 sessions simultaneously in a split pane layout
  - Drag-to-resize divider between panes
  - Toggle via button or keyboard shortcut

## Item #51
- **Date:** 2026-02-12
- **Priority:** medium
- **Status:** pending
- **Description:** Typing preview — live markdown render while typing
  - Show a preview pane below or beside the input with rendered markdown
  - Toggle on/off
  - Helps compose complex messages with formatting

## Item #52
- **Date:** 2026-02-12
- **Priority:** medium
- **Status:** pending
- **Description:** Raw JSON viewer — toggle to see raw gateway messages
  - Toggle button to switch between rendered view and raw JSON
  - Show the full gateway message payload as formatted JSON
  - Useful for debugging and understanding the protocol

## Item #53
- **Date:** 2026-02-12
- **Priority:** high
- **Status:** done
- **Completed:** 2026-02-12 — commit `4b41b45`
- **Description:** Update the fake chat demo on the GitHub Pages landing page
  - The animated demo is completely outdated — it no longer matches the current UI
  - Needs to reflect the actual current look: cyan user bubbles, avatar display, date separators, channel icons, metadata button, tool call emojis, etc.
  - Make it as close as possible to the real PinchChat UI

## Item #54
- **Date:** 2026-02-12
- **Priority:** medium
- **Status:** pending
- **Description:** Better display of webhook/hook session messages
  - Sessions created via /hooks/agent show raw prompt scaffolding (SECURITY NOTICE, EXTERNAL_UNTRUSTED_CONTENT delimiters, task IDs, job IDs)
  - This raw envelope should be cleaned up or collapsed in the UI
  - Strip or collapse the system scaffolding, show only the actual user message content
  - Could detect the <<<EXTERNAL_UNTRUSTED_CONTENT>>> pattern and extract just the message body
