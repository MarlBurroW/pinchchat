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
- **Description:** Ajouter le support i18n (internationalisation) — le projet open-source est en anglais, mais le deploy perso de Nicolas doit rester en français. Soit via une config `.env` (ex: `VITE_LOCALE=fr`), soit via un système de traduction léger. Les strings UI (placeholder input, bouton envoyer, statut connexion, etc.) doivent être configurables.

## Item #4
- **Date:** 2026-02-11
- **Priority:** high
- **Status:** done
- **Completed:** 2026-02-11 — commit `36f9480`
- **Description:** Supprimer le token du build — implémenter un écran de login au runtime
  - Au premier lancement (ou si pas de credentials en localStorage), afficher un écran de connexion avec :
    - Champ "Gateway URL" (ex: `ws://192.168.1.14:18789`)
    - Champ "Token" (password field)
    - Bouton "Connect"
  - Stocker les credentials en `localStorage` (pas dans le bundle JS)
  - Supprimer `VITE_GATEWAY_TOKEN` du `.env.example` et du code
  - Garder `VITE_GATEWAY_WS_URL` uniquement comme valeur par défaut optionnelle pour pré-remplir le champ URL
  - Ajouter un bouton "Disconnect" / "Logout" dans le header qui clear le localStorage et revient à l'écran de login
  - L'écran de login doit suivre le même thème dark neon que le reste de l'app
  - ⚠️ Après ce changement, le deploy perso (`~/marlbot-chat/.env`) n'a plus besoin de `VITE_GATEWAY_TOKEN` — l'utilisateur entrera le token via l'UI
