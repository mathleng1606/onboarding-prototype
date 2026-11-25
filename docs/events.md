# Events

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
| `checklist_item_viewed` | `item` | front | `home/Checklist.tsx`, une fois par session et par item, pas sous la modale de bienvenue |
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
  - **une reco** = `reco_sent` − le `reco_started` juste avant, chaque départ ne servant qu'une fois. La reco
    test est exclue, puisqu'elle compte déjà dans le tutoriel.
- **Les events**, du plus récent au plus ancien, avec le compte ou l'identifiant anonyme et les props.
- **« Vider les events »** (deux clics) efface la table `events`, sans toucher au reste.

Pour un parcours complet : `npm run db:reset`, puis s'inscrire, suivre le guide et envoyer une vraie reco.
