# Simplycure · prototype d'onboarding praticien

Prototype du parcours d'un nouveau praticien, de l'inscription à sa première vraie recommandation : guide « mode démarrage » avec un patient test, checklist « Vos premiers pas », catalogue, patients, favoris. Il inclut la mesure du parcours (events produit et page `/debug`). Toutes les données sont fictives.

## Lancer

Node 20 ou plus.

```bash
npm install && npm --prefix server install && npm --prefix web install
cp web/.env.example web/.env
npm run dev     # API sur :3001, front sur http://localhost:5173
```

| Commande | Effet |
|---|---|
| `npm run dev` | API (Fastify, rechargement auto) + front (Vite) |
| `npm test` | tests d'intégration de l'API, typecheck serveur et front, lint du front |
| `npm run db:reset` | base vidée puis re-remplie : on repart d'un praticien jamais inscrit |

## Structure

```
server/   API Fastify + SQLite (better-sqlite3), validation zod
  src/routes/    un fichier par ressource, sous /api/practitioners/{uid}
  src/services/  la logique métier (checklist, recos, events, durées)
web/      React + Vite + TanStack Query + Tailwind, un dossier par zone
```

## Choix à connaître

- **La checklist n'est jamais stockée.** Le serveur la recalcule à chaque appel à partir des faits.
- **Reco test = drapeau.** `is_test` vient du patient et est copié sur la reco.
- **Les events** passent par une liste fermée validée par zod, avec horodatage serveur et aucune durée stockée. Liste complète : `docs/events.md`. Endpoints : `docs/api.md`. Page `/debug` pour les voir.
- **Suppression logique** (`deleted_at`) : ce qui a été fait reste fait pour la checklist.

## Volontairement simplifié

- Pas d'authentification : un seul praticien fixé dans `web/.env`.
- Durées brutes : les longues pauses ne sont pas filtrées, c'est laissé à l'analyse.
- Events envoyés un par un, sans retry. Les faits dont dépendent les durées sont écrits par le serveur.
- `/dev/*` et `/debug` ne sont pas protégés, seulement coupés en production.
- Protocoles, import de patients et outils connectés : écrans statiques.
