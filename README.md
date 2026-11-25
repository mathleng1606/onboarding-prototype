# Simplycure · prototype d'onboarding praticien

Prototype du parcours d'un nouveau praticien sur Simplycure, de l'inscription à sa première vraie recommandation :
inscription en 3 étapes, guide « mode démarrage » avec un patient test, checklist « Vos premiers pas », catalogue,
patients, favoris. Il inclut la **mesure** du parcours : des events produit et une page `/debug` qui en tire les durées.

Toutes les données sont fictives (praticien, patients, produits). Le prototype ne fait aucune promesse de santé.

## Lancer le projet

Prérequis : Node 20 ou plus.

```bash
npm install && npm --prefix server install && npm --prefix web install
cp web/.env.example web/.env        # uid du praticien fictif
npm run dev                         # API sur :3001, front sur http://localhost:5173
```

La base SQLite (`server/data/simplycure.db`) est créée et remplie au premier démarrage.

| Commande | Effet |
|---|---|
| `npm run dev` | API (Fastify, rechargement auto) + front (Vite) |
| `npm test` | tests d'intégration de l'API, typecheck serveur et front, lint du front |
| `npm run db:reset` | base vidée puis re-remplie : on repart d'un praticien jamais inscrit |

## Architecture

```
server/            API Fastify + SQLite (better-sqlite3), validation zod
  src/db/          schema.sql, seed (données fictives), migration de la table events
  src/routes/      un fichier par ressource, toutes sous /api/practitioners/{uid}
  src/services/    la logique métier (checklist, recos, events, durées…)
  test/            tests d'intégration (node:test, app.inject)
web/               React + Vite + TanStack Query + Tailwind
  src/<zone>/      un dossier par zone : signup, home, catalogue, patients, reco, favorites, debug
  src/ui/          composants partagés ; src/lib/ : flow, wording, track
```

Le prototype n'a pas d'authentification : le praticien est fixé par `VITE_PRACTITIONER_UID`.
La checklist n'est jamais stockée : le serveur la recalcule à partir des faits (compte terminé, reco envoyée…).

## Schéma

| Table | Rôle |
|---|---|
| `practitioners` | le compte : identité, profession, volume déclaré, remise patient, dates de l'onboarding |
| `patients` | patients du praticien, dont un patient test (`is_test`) non supprimable |
| `products`, `product_profession_ranks` | catalogue et classement « les plus recommandés » par profession |
| `recommendations`, `recommendation_items` | recos (brouillon puis envoyée, figée à l'envoi) et leurs produits |
| `favorites` | produits habituels du praticien |
| `events` | la mesure, voir plus bas |

Suppression logique partout (`deleted_at`) : ce qui a été fait reste fait pour la checklist.

```sql
events (
  id           INTEGER PRIMARY KEY,
  name         TEXT NOT NULL,
  anonymous_id TEXT,              -- avant le compte : identifiant aléatoire du navigateur
  account_uid  TEXT,              -- après : uid du praticien, posé par le serveur
  props        TEXT JSON,         -- jamais de donnée patient
  created_at   TEXT               -- horodatage SERVEUR, à la milliseconde
)                                 -- aucune durée stockée
```

## Endpoints

Tous sous `/api`. Les erreurs ont toujours la forme `{ error: { code, message, details? } }`, avec 422 `validation_error` pour une requête invalide.

| | |
|---|---|
| `GET /health`, `GET /categories` | |
| `GET · PATCH /practitioners/{uid}` | profil (l'inscription enregistre chaque étape) |
| `POST /practitioners/{uid}/signup/complete` | fin d'inscription, body `{ anonymousId }` |
| `GET /practitioners/{uid}/onboarding` | checklist et état du guide |
| `POST …/onboarding/skip-guide` | « Passer le guide », body `{ step: 1-3 }` |
| `POST …/onboarding/dismiss-welcome` · `dismiss-checklist` | |
| `GET · POST …/patients`, `GET · DELETE …/patients/{uid}` | |
| `GET …/products?section=starter\|popular&category=&q=` | prix remisés, classement selon la profession |
| `GET …/favorites`, `PUT · DELETE …/favorites/{productUid}` | |
| `GET · POST …/recommendations`, `GET · PATCH · DELETE …/recommendations/{uid}` | |
| `POST …/recommendations/{uid}/send` | envoi, body `{ source }` ; renvoie aussi la checklist |
| `POST · GET …/events` | events du navigateur (voir plus bas) |
| `POST /dev/reset` | base remise à zéro (hors production) |
| `GET /dev/events` · `GET /dev/durations` · `DELETE /dev/events` | page `/debug` (hors production) |

## Mesure : la liste des events

Le front envoie ses events avec `track(event, props)` (`web/src/lib/track.ts`). Le serveur les valide contre une
liste fermée (`server/src/services/eventCatalog.ts`), avec un schéma strict par event.

**Posé par le serveur, jamais par le navigateur :**
- l'horodatage ;
- `account_uid`, dès que l'inscription est terminée ;
- `profession`, ajoutée à tous les events ;
- `days_since_signup`, ajouté à `session_started`.

**Identité avant le compte.** `anonymous_id` est créé dans le `localStorage` sur la page d'inscription. À
`signup_completed`, le serveur rattache tous les events de cet identifiant au compte, puis le navigateur l'oublie.

**Refusé (422) :**
- un nom inconnu, ou un event réservé au serveur ;
- une propriété inattendue ou une valeur hors liste ;
- une clé du type nom, e-mail ou téléphone, et toute valeur qui ressemble à un e-mail ou à un numéro.

| Event | Props | Écrit par | Où |
|---|---|---|---|
| `signup_started` | | front | `signup/SignupPage.tsx`, au premier champ rempli |
| `signup_step_completed` | `step`, `volume_declared` (étape 3) | front | `signup/SignupPage.tsx` |
| `signup_completed` | | serveur | `routes/practitioners.ts` |
| `session_started` | `days_since_signup` | front + serveur | `App.tsx`, une fois par session navigateur |
| `guide_step_viewed` | `step` | front | `PatientPanel` (1), `CataloguePage` (2), `RecommendationPage` (3) |
| `guide_step_completed` | `step` | front | patient test choisi (1), reco créée (2), reco test envoyée (3) |
| `guide_dismissed` | `step` | serveur | `routes/onboarding.ts`, sur « Passer le guide » |
| `reco_started` | `source` : guide, accueil, checklist, patients | front | `lib/flow.ts` |
| `reco_cta_clicked` | `location` : en_tete, checklist | front | `home/HomePage.tsx`, `home/Checklist.tsx` |
| `reco_sent` | `is_test_patient`, `source`, `n_products` | serveur | `routes/recommendations.ts` |
| `patient_created` | `source` : checklist, flux_reco, page_patients | front | `PatientPanel`, `PatientCreatePage` |
| `patient_list_viewed` | `n_patients_shown` | front | `patients/PatientsListPage.tsx` |
| `favorites_configured` | `n_products` | front | `favorites/FavoritesPage.tsx`, sur « Terminer » |
| `checklist_item_viewed` | `item` | front | `home/Checklist.tsx`, une fois par session et par item |
| `checklist_item_clicked` | `item` | front | `home/Checklist.tsx` |
| `checklist_item_completed` | `item` | serveur | `services/onboarding.ts`, quand un item passe à « fait » |
| `checklist_dismissed` | `n_items_done` | front | `home/Checklist.tsx`, fermeture définitive |
| `checklist_closed` | `n_items_done` | serveur | `services/onboarding.ts`, à la première vraie reco |
| `protocol_created`, `tool_connected` | `tool` | — | acceptés par l'API, mais aucun écran n'existe encore |

`patient_order_paid` est hors prototype : il n'est pas implémenté et l'API le refuse.

## Lire `/debug`

Ouvrir http://localhost:5173/debug (la page n'est pas dans le menu). Elle se rafraîchit toutes les 2 secondes, donc
on peut la garder ouverte dans un second onglet pendant qu'on parcourt l'app.

- **Les durées.** Chaque carte donne la médiane, le nombre de mesures et le détail de chaque mesure. Le calcul est
  fait à la lecture, sur les horodatages serveur :
  - **inscription** = `signup_completed` − `signup_started` (même `anonymous_id`) ;
  - **tutoriel** = premier `reco_sent` vers le patient test − `guide_step_viewed` étape 1 ;
  - **une reco** = `reco_sent` − le `reco_started` juste avant, chaque départ ne servant qu'une fois.
- **Les events**, du plus récent au plus ancien, avec le compte ou l'identifiant anonyme et les props.
- **« Vider les events »** (deux clics) efface la table `events`, sans toucher au reste.

Pour un parcours complet : `npm run db:reset`, puis s'inscrire, suivre le guide et envoyer une vraie reco.

## Volontairement simplifié

- **Un seul praticien, sans connexion.** L'uid est dans `web/.env`, et la fiche praticien existe avant l'inscription.
  « Avant le compte » veut donc dire « inscription pas terminée ».
- **Les durées sont brutes.** Les pauses sont comptées telles quelles, et un parcours abandonné ne produit pas de
  durée. Le traitement des longues pauses est laissé à l'analyse.
- **Les events sont stockés dans SQLite, envoyés un par un, sans retry ni file d'attente.** Un event front perdu (onglet
  fermé, réseau coupé) n'est pas renvoyé. C'est pour ça que les faits dont dépendent les durées (`signup_completed`,
  `reco_sent`) sont écrits par le serveur.
- **Les routes `/dev/*` et `/debug` ne sont pas protégées.** Elles sont seulement désactivées quand
  `NODE_ENV=production`.
- **`protocol_created` et `tool_connected`** sont prévus dans le plan de tracking, mais les écrans correspondants
  n'existent pas dans le prototype.
- **Plusieurs éléments de l'interface sont statiques** (protocoles, import de patients, Simplycure Assist…) : ils
  affichent « pas dans le prototype ».
