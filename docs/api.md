# API

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
| `POST · GET …/events` | events du navigateur (voir [events.md](events.md)) |
| `POST /dev/reset` | base remise à zéro (hors production) |
| `GET /dev/events` · `GET /dev/durations` · `DELETE /dev/events` | page `/debug` (hors production) |

## Schéma

| Table | Rôle |
|---|---|
| `practitioners` | le compte : identité, profession, volume déclaré, remise patient, dates de l'onboarding |
| `patients` | patients du praticien, dont un patient test (`is_test`) non supprimable |
| `products`, `product_profession_ranks` | catalogue et classement « les plus recommandés » par profession |
| `recommendations`, `recommendation_items` | recos (brouillon puis envoyée, figée à l'envoi) et leurs produits |
| `favorites` | produits habituels du praticien |
| `events` | la mesure, voir [events.md](events.md) |

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
