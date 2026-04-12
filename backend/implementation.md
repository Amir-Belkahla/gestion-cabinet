# ✅ Checklist Backend — Cabinet Médical

## 📁 Phase 0 : Structure du projet

- [ ] Créer l'arborescence du projet
  ```
  backend/
  ├── config/
  ├── models/
  ├── controllers/
  ├── middlewares/
  ├── routes/
  ├── utils/
  └── index.php
  ```
- [ ] Configurer le fichier `.htaccess` (réécriture URL vers `index.php`)
- [ ] Créer le front controller `index.php` (point d'entrée unique)
- [ ] Créer le routeur `routes/router.php`
- [ ] Créer `config/database.php` (connexion PDO à MySQL)
- [ ] Créer `config/constants.php` (clé JWT, durées tokens, etc.)
- [ ] Installer la librairie JWT (`firebase/php-jwt` via Composer)
- [ ] Créer `composer.json` + `autoload`

---

## 🔐 Phase 1 : Authentification (JWT)

### Config & Utils
- [ ] Créer `utils/Response.php` (réponses JSON standardisées)
- [ ] Créer `utils/Validator.php` (validation des inputs)
- [ ] Créer `utils/JWTHandler.php`
  - [ ] Générer un access token (expiration 15 min)
  - [ ] Générer un refresh token (expiration 7 jours)
  - [ ] Décoder / valider un token
  - [ ] Extraire le payload (id, role)

### Middleware
- [ ] Créer `middlewares/AuthMiddleware.php`
  - [ ] Vérifier la présence du header `Authorization: Bearer <token>`
  - [ ] Valider l'access token
  - [ ] Injecter `utilisateur_id` et `role` dans la requête
- [ ] Créer `middlewares/RoleMiddleware.php`
  - [ ] Vérifier que le rôle de l'utilisateur est autorisé
  - [ ] Bloquer l'accès si rôle insuffisant

### Model
- [ ] Créer `models/Utilisateur.php`
  - [ ] `findByEmail($email)`
  - [ ] `findById($id)`
  - [ ] `create($data)`
  - [ ] `update($id, $data)`
  - [ ] `delete($id)`
  - [ ] `getAll($filters)`
  - [ ] `updatePassword($id, $hash)`
  - [ ] `toggleActif($id)`
- [ ] Créer `models/JWTToken.php`
  - [ ] `storeRefreshToken($utilisateur_id, $token, $expire_at)`
  - [ ] `findRefreshToken($token)`
  - [ ] `revokeToken($token)`
  - [ ] `revokeAllUserTokens($utilisateur_id)`
  - [ ] `deleteExpiredTokens()`

### Controller
- [ ] Créer `controllers/AuthController.php`
  - [ ] `POST /api/auth/register` — inscription (patient uniquement)
    - [ ] Valider les champs (nom, prénom, email, mot_de_passe)
    - [ ] Vérifier que l'email n'existe pas
    - [ ] Hasher le mot de passe (`password_hash` bcrypt)
    - [ ] Créer l'utilisateur avec role = 'patient'
    - [ ] Créer l'entrée dans la table `patients`
    - [ ] Retourner access token + refresh token
  - [ ] `POST /api/auth/login` — connexion
    - [ ] Valider email + mot_de_passe
    - [ ] Vérifier que le compte est actif
    - [ ] `password_verify()`
    - [ ] Générer access token + refresh token
    - [ ] Stocker le refresh token en BDD
  - [ ] `POST /api/auth/refresh` — rafraîchir le token
    - [ ] Valider le refresh token
    - [ ] Vérifier qu'il n'est pas révoqué / expiré
    - [ ] Générer un nouveau access token
  - [ ] `POST /api/auth/logout` — déconnexion
    - [ ] Révoquer le refresh token en BDD
  - [ ] `GET /api/auth/me` — profil connecté
    - [ ] Retourner les infos de l'utilisateur courant

### Routes
- [ ] `POST /api/auth/register`
- [ ] `POST /api/auth/login`
- [ ] `POST /api/auth/refresh`
- [ ] `POST /api/auth/logout` 🔒
- [ ] `GET /api/auth/me` 🔒

### Tests
- [ ] Tester inscription avec données valides
- [ ] Tester inscription avec email dupliqué
- [ ] Tester login valide
- [ ] Tester login avec mauvais mot de passe
- [ ] Tester accès protégé sans token
- [ ] Tester accès prot��gé avec token expiré
- [ ] Tester refresh token
- [ ] Tester logout + tentative de refresh après

---

## 👥 Phase 2 : Gestion des utilisateurs (Admin)

### Model
- [ ] Réutiliser `models/Utilisateur.php` (déjà créé)

### Controller
- [ ] Créer `controllers/UtilisateurController.php`
  - [ ] `GET /api/utilisateurs` — liste paginée + filtres (role, actif)
  - [ ] `GET /api/utilisateurs/:id` — détail d'un utilisateur
  - [ ] `POST /api/utilisateurs` — créer un utilisateur (tout rôle)
    - [ ] Si médecin → créer aussi l'entrée dans `medecins`
    - [ ] Si patient → créer aussi l'entrée dans `patients`
  - [ ] `PUT /api/utilisateurs/:id` — modifier un utilisateur
  - [ ] `PATCH /api/utilisateurs/:id/toggle` — activer/désactiver
  - [ ] `DELETE /api/utilisateurs/:id` — supprimer un utilisateur

### Routes (🔒 Admin uniquement)
- [ ] `GET /api/utilisateurs`
- [ ] `GET /api/utilisateurs/:id`
- [ ] `POST /api/utilisateurs`
- [ ] `PUT /api/utilisateurs/:id`
- [ ] `PATCH /api/utilisateurs/:id/toggle`
- [ ] `DELETE /api/utilisateurs/:id`

### Tests
- [ ] Tester CRUD complet en tant qu'admin
- [ ] Tester accès refusé pour médecin / secrétaire / patient
- [ ] Tester désactivation d'un compte → login impossible

---

## 🏥 Phase 3 : Gestion des patients

### Model
- [ ] Créer `models/Patient.php`
  - [ ] `getAll($filters, $page, $limit)`
  - [ ] `findById($id)`
  - [ ] `search($query)` — recherche par nom/prénom/téléphone
  - [ ] `create($data)`
  - [ ] `update($id, $data)`
  - [ ] `delete($id)`

### Controller
- [ ] Créer `controllers/PatientController.php`
  - [ ] `GET /api/patients` — liste paginée
  - [ ] `GET /api/patients/search?q=` — recherche
  - [ ] `GET /api/patients/:id` — détail patient
  - [ ] `POST /api/patients` — ajouter un patient
  - [ ] `PUT /api/patients/:id` — modifier un patient
  - [ ] `DELETE /api/patients/:id` — supprimer un patient

### Routes
- [ ] `GET /api/patients` 🔒 admin, médecin, secrétaire
- [ ] `GET /api/patients/search` 🔒 admin, médecin, secrétaire
- [ ] `GET /api/patients/:id` 🔒 admin, médecin, secrétaire, patient (le sien)
- [ ] `POST /api/patients` �� admin, secrétaire
- [ ] `PUT /api/patients/:id` 🔒 admin, secrétaire
- [ ] `DELETE /api/patients/:id` 🔒 admin

### Tests
- [ ] Tester CRUD complet
- [ ] Tester recherche par nom
- [ ] Tester qu'un patient ne voit que ses propres infos
- [ ] Tester pagination

---

## 📅 Phase 4 : Gestion des rendez-vous

### Model
- [ ] Créer `models/RendezVous.php`
  - [ ] `getAll($filters, $page, $limit)`
  - [ ] `findById($id)`
  - [ ] `getByDate($medecin_id, $date)` — planning du jour
  - [ ] `getByPatient($patient_id)`
  - [ ] `getByMedecin($medecin_id)`
  - [ ] `checkDisponibilite($medecin_id, $date, $heure_debut, $heure_fin)`
  - [ ] `create($data)`
  - [ ] `update($id, $data)`
  - [ ] `updateStatut($id, $statut)`
  - [ ] `delete($id)`

### Controller
- [ ] Créer `controllers/RendezVousController.php`
  - [ ] `GET /api/rendez-vous` — liste avec filtres (date, médecin, statut)
  - [ ] `GET /api/rendez-vous/:id` — détail
  - [ ] `GET /api/rendez-vous/planning/:medecin_id?date=` — planning médecin
  - [ ] `GET /api/rendez-vous/mes-rdv` — RDV du patient connecté
  - [ ] `GET /api/rendez-vous/disponibilites/:medecin_id?date=` — créneaux libres
  - [ ] `POST /api/rendez-vous` — prendre un RDV
    - [ ] Vérifier la disponibilité du créneau
    - [ ] Vérifier les horaires du cabinet (`parametres_systeme`)
    - [ ] Créer le RDV
    - [ ] Déclencher notification de confirmation
  - [ ] `PUT /api/rendez-vous/:id` — modifier un RDV
    - [ ] Re-vérifier la disponibilité si changement d'horaire
  - [ ] `PATCH /api/rendez-vous/:id/annuler` — annuler
    - [ ] Déclencher notification d'annulation
  - [ ] `PATCH /api/rendez-vous/:id/confirmer` — confirmer
  - [ ] `PATCH /api/rendez-vous/:id/terminer` — marquer terminé

### Routes
- [ ] `GET /api/rendez-vous` 🔒 admin, médecin, secrétaire
- [ ] `GET /api/rendez-vous/:id` 🔒 tous (filtré par rôle)
- [ ] `GET /api/rendez-vous/planning/:medecin_id` 🔒 admin, médecin, secrétaire
- [ ] `GET /api/rendez-vous/mes-rdv` 🔒 patient
- [ ] `GET /api/rendez-vous/disponibilites/:medecin_id` 🔒 tous
- [ ] `POST /api/rendez-vous` 🔒 admin, secrétaire, patient
- [ ] `PUT /api/rendez-vous/:id` 🔒 admin, secrétaire
- [ ] `PATCH /api/rendez-vous/:id/annuler` 🔒 admin, secrétaire, patient (le sien)
- [ ] `PATCH /api/rendez-vous/:id/confirmer` 🔒 admin, secrétaire
- [ ] `PATCH /api/rendez-vous/:id/terminer` 🔒 admin, médecin

### Tests
- [ ] Tester prise de RDV valide
- [ ] Tester conflit d'horaire → rejet
- [ ] Tester RDV hors horaires cabinet → rejet
- [ ] Tester annulation + notification
- [ ] Tester que le patient ne voit que ses RDV
- [ ] Tester le planning par date

---

## 🩺 Phase 5 : Gestion des consultations

### Model
- [ ] Créer `models/Consultation.php`
  - [ ] `getAll($filters, $page, $limit)`
  - [ ] `findById($id)`
  - [ ] `getByPatient($patient_id)`
  - [ ] `getByMedecin($medecin_id)`
  - [ ] `create($data)`
  - [ ] `update($id, $data)`
  - [ ] `delete($id)`

### Controller
- [ ] Créer `controllers/ConsultationController.php`
  - [ ] `GET /api/consultations` — liste avec filtres
  - [ ] `GET /api/consultations/:id` — détail consultation
  - [ ] `GET /api/consultations/patient/:patient_id` — historique patient
  - [ ] `POST /api/consultations` — enregistrer une consultation
    - [ ] Lier au RDV si applicable (passer statut à 'termine')
    - [ ] Créer/mettre à jour le dossier médical
  - [ ] `PUT /api/consultations/:id` — modifier
  - [ ] `DELETE /api/consultations/:id` — supprimer

### Routes
- [ ] `GET /api/consultations` 🔒 admin, médecin
- [ ] `GET /api/consultations/:id` 🔒 admin, médecin, patient (les siennes)
- [ ] `GET /api/consultations/patient/:patient_id` 🔒 admin, médecin
- [ ] `POST /api/consultations` 🔒 médecin
- [ ] `PUT /api/consultations/:id` 🔒 médecin
- [ ] `DELETE /api/consultations/:id` 🔒 admin

### Tests
- [ ] Tester création consultation liée à un RDV
- [ ] Tester que le RDV passe en 'termine'
- [ ] Tester historique consultations d'un patient
- [ ] Tester accès patient limité à ses consultations

---

## 💊 Phase 6 : Gestion des ordonnances

### Model
- [ ] Créer `models/Ordonnance.php`
  - [ ] `findById($id)`
  - [ ] `getByConsultation($consultation_id)`
  - [ ] `getByPatient($patient_id)`
  - [ ] `create($data)`
  - [ ] `update($id, $data)`
  - [ ] `delete($id)`
- [ ] Créer `models/OrdonnanceMedicament.php`
  - [ ] `getByOrdonnance($ordonnance_id)`
  - [ ] `create($data)`
  - [ ] `update($id, $data)`
  - [ ] `delete($id)`
  - [ ] `deleteByOrdonnance($ordonnance_id)`

### Controller
- [ ] Créer `controllers/OrdonnanceController.php`
  - [ ] `GET /api/ordonnances/:id` — détail avec médicaments
  - [ ] `GET /api/ordonnances/consultation/:consultation_id`
  - [ ] `GET /api/ordonnances/patient/:patient_id`
  - [ ] `POST /api/ordonnances` — créer ordonnance + médicaments
  - [ ] `PUT /api/ordonnances/:id` — modifier ordonnance + médicaments
  - [ ] `DELETE /api/ordonnances/:id` — supprimer

### Routes
- [ ] `GET /api/ordonnances/:id` 🔒 admin, médecin, patient (les siennes)
- [ ] `GET /api/ordonnances/consultation/:id` 🔒 admin, médecin
- [ ] `GET /api/ordonnances/patient/:id` 🔒 admin, médecin, patient (les siennes)
- [ ] `POST /api/ordonnances` 🔒 médecin
- [ ] `PUT /api/ordonnances/:id` 🔒 médecin
- [ ] `DELETE /api/ordonnances/:id` 🔒 admin, médecin

### Tests
- [ ] Tester création ordonnance avec plusieurs médicaments
- [ ] Tester modification des médicaments
- [ ] Tester accès patient limité à ses ordonnances

---

## 📂 Phase 7 : Dossier médical

### Model
- [ ] Créer `models/DossierMedical.php`
  - [ ] `findByPatient($patient_id)`
  - [ ] `create($patient_id)`
  - [ ] `update($patient_id, $notes)`

### Controller
- [ ] Créer `controllers/DossierMedicalController.php`
  - [ ] `GET /api/dossiers-medicaux/:patient_id` — dossier complet
    - [ ] Infos patient
    - [ ] Historique consultations
    - [ ] Historique ordonnances
    - [ ] Notes générales
  - [ ] `PUT /api/dossiers-medicaux/:patient_id` — modifier notes générales

### Routes
- [ ] `GET /api/dossiers-medicaux/:patient_id` 🔒 admin, médecin, patient (le sien)
- [ ] `PUT /api/dossiers-medicaux/:patient_id` 🔒 médecin

### Tests
- [ ] Tester récupération dossier complet
- [ ] Tester que le patient ne voit que son dossier
- [ ] Tester mise à jour des notes

---

## 🔔 Phase 8 : Notifications

### Model
- [ ] Créer `models/Notification.php`
  - [ ] `getByUtilisateur($utilisateur_id, $page, $limit)`
  - [ ] `countNonLues($utilisateur_id)`
  - [ ] `create($data)`
  - [ ] `marquerLue($id)`
  - [ ] `marquerToutesLues($utilisateur_id)`
  - [ ] `delete($id)`

### Utils
- [ ] Créer `utils/NotificationService.php`
  - [ ] `envoyerConfirmationRDV($rdv_id)`
  - [ ] `envoyerRappelRDV($rdv_id)`
  - [ ] `envoyerAnnulationRDV($rdv_id)`
  - [ ] `envoyerNotificationGenerale($utilisateur_id, $titre, $message)`

### Controller
- [ ] Créer `controllers/NotificationController.php`
  - [ ] `GET /api/notifications` — mes notifications
  - [ ] `GET /api/notifications/non-lues/count` — compteur
  - [ ] `PATCH /api/notifications/:id/lue` — marquer comme lue
  - [ ] `PATCH /api/notifications/tout-lire` — tout marquer comme lu
  - [ ] `DELETE /api/notifications/:id` — supprimer

### CRON : Rappels automatiques
- [ ] Créer `cron/rappel_rdv.php`
  - [ ] Chercher les RDV dans les prochaines X heures (config)
  - [ ] Envoyer un rappel si pas déjà envoyé
  - [ ] Documenter la commande cron à configurer

### Routes
- [ ] `GET /api/notifications` 🔒 tous
- [ ] `GET /api/notifications/non-lues/count` 🔒 tous
- [ ] `PATCH /api/notifications/:id/lue` 🔒 tous (la sienne)
- [ ] `PATCH /api/notifications/tout-lire` 🔒 tous
- [ ] `DELETE /api/notifications/:id` 🔒 tous (la sienne)

### Tests
- [ ] Tester création notification à la prise de RDV
- [ ] Tester compteur non-lues
- [ ] Tester marquer comme lue
- [ ] Tester le script CRON de rappel

---

## ⚙️ Phase 9 : Administration système

### Model
- [ ] Créer `models/LogSysteme.php`
  - [ ] `getAll($filters, $page, $limit)`
  - [ ] `create($utilisateur_id, $action, $table, $id, $details, $ip)`
- [ ] Créer `models/ParametreSysteme.php`
  - [ ] `getAll()`
  - [ ] `getByKey($cle)`
  - [ ] `update($cle, $valeur)`

### Utils
- [ ] Créer `utils/Logger.php`
  - [ ] Méthode statique `log($action, $table, $id, $details)`
  - [ ] Récupérer automatiquement l'IP et l'utilisateur courant
- [ ] Intégrer le logger dans tous les controllers existants
  - [ ] AuthController (login, register, logout)
  - [ ] UtilisateurController (CRUD)
  - [ ] PatientController (CRUD)
  - [ ] RendezVousController (CRUD + changements statut)
  - [ ] ConsultationController (CRUD)
  - [ ] OrdonnanceController (CRUD)

### Controller
- [ ] Créer `controllers/AdminController.php`
  - [ ] `GET /api/admin/stats` — tableau de bord (vue_stats_admin)
  - [ ] `GET /api/admin/logs` — logs paginés + filtres
  - [ ] `GET /api/admin/parametres` — tous les paramètres
  - [ ] `PUT /api/admin/parametres/:cle` — modifier un paramètre

### Routes (🔒 Admin uniquement)
- [ ] `GET /api/admin/stats`
- [ ] `GET /api/admin/logs`
- [ ] `GET /api/admin/parametres`
- [ ] `PUT /api/admin/parametres/:cle`

### Tests
- [ ] Tester que les logs se créent automatiquement
- [ ] Tester les stats du tableau de bord
- [ ] Tester modification des paramètres
- [ ] Tester accès refusé pour non-admin

---

## 🛡️ Phase 10 : Sécurité & Finalisation

### Sécurité
- [ ] Utiliser des requêtes préparées PDO partout (anti SQL injection)
- [ ] Échapper les outputs (`htmlspecialchars`) si nécessaire
- [ ] Valider et assainir tous les inputs côté serveur
- [ ] Implémenter le rate limiting sur `/api/auth/login`
- [ ] Ajouter les headers CORS
- [ ] Ajouter les headers de sécurité (`X-Content-Type-Options`, `X-Frame-Options`)
- [ ] Vérifier qu'aucun mot de passe n'est retourné dans les réponses API
- [ ] Vérifier les permissions sur chaque endpoint

### Gestion d'erreurs
- [ ] Créer un gestionnaire d'erreurs global
- [ ] Retourner des codes HTTP appropriés (200, 201, 400, 401, 403, 404, 409, 500)
- [ ] Logger les erreurs 500 dans un fichier de log

### Documentation
- [ ] Documenter toutes les routes API (méthode, URL, body, réponse)
- [ ] Documenter l'installation du projet (BDD, config, Composer)
- [ ] Documenter la configuration du CRON

### Nettoyage
- [ ] Supprimer le code mort
- [ ] Vérifier la cohérence des noms de variables / fonctions
- [ ] Vérifier que tous les endpoints sont protégés
- [ ] Test final de bout en bout de tous les endpoints

---

## 📊 Récapitulatif des endpoints API

| Méthode | Endpoint | Rôles autorisés |
|---------|----------|-----------------|
| POST | `/api/auth/register` | public |
| POST | `/api/auth/login` | public |
| POST | `/api/auth/refresh` | public |
| POST | `/api/auth/logout` | 🔒 tous |
| GET | `/api/auth/me` | 🔒 tous |
| GET | `/api/utilisateurs` | 🔒 admin |
| GET | `/api/utilisateurs/:id` | 🔒 admin |
| POST | `/api/utilisateurs` | 🔒 admin |
| PUT | `/api/utilisateurs/:id` | 🔒 admin |
| PATCH | `/api/utilisateurs/:id/toggle` | 🔒 admin |
| DELETE | `/api/utilisateurs/:id` | 🔒 admin |
| GET | `/api/patients` | 🔒 admin, médecin, secrétaire |
| GET | `/api/patients/search` | 🔒 admin, médecin, secrétaire |
| GET | `/api/patients/:id` | 🔒 tous (filtré) |
| POST | `/api/patients` | 🔒 admin, secrétaire |
| PUT | `/api/patients/:id` | 🔒 admin, secrétaire |
| DELETE | `/api/patients/:id` | 🔒 admin |
| GET | `/api/rendez-vous` | 🔒 admin, médecin, secrétaire |
| GET | `/api/rendez-vous/:id` | 🔒 tous (filtré) |
| GET | `/api/rendez-vous/planning/:mid` | 🔒 admin, médecin, secrétaire |
| GET | `/api/rendez-vous/mes-rdv` | 🔒 patient |
| GET | `/api/rendez-vous/disponibilites/:mid` | 🔒 tous |
| POST | `/api/rendez-vous` | 🔒 admin, secrétaire, patient |
| PUT | `/api/rendez-vous/:id` | 🔒 admin, secrétaire |
| PATCH | `/api/rendez-vous/:id/annuler` | 🔒 admin, secrétaire, patient |
| PATCH | `/api/rendez-vous/:id/confirmer` | 🔒 admin, secrétaire |
| PATCH | `/api/rendez-vous/:id/terminer` | 🔒 admin, médecin |
| GET | `/api/consultations` | 🔒 admin, médecin |
| GET | `/api/consultations/:id` | 🔒 admin, médecin, patient |
| GET | `/api/consultations/patient/:pid` | 🔒 admin, médecin |
| POST | `/api/consultations` | 🔒 médecin |
| PUT | `/api/consultations/:id` | 🔒 médecin |
| DELETE | `/api/consultations/:id` | 🔒 admin |
| GET | `/api/ordonnances/:id` | 🔒 admin, médecin, patient |
| GET | `/api/ordonnances/consultation/:id` | 🔒 admin, médecin |
| GET | `/api/ordonnances/patient/:id` | 🔒 admin, médecin, patient |
| POST | `/api/ordonnances` | 🔒 médecin |
| PUT | `/api/ordonnances/:id` | 🔒 médecin |
| DELETE | `/api/ordonnances/:id` | 🔒 admin, médecin |
| GET | `/api/dossiers-medicaux/:pid` | 🔒 admin, médecin, patient |
| PUT | `/api/dossiers-medicaux/:pid` | 🔒 médecin |
| GET | `/api/notifications` | 🔒 tous |
| GET | `/api/notifications/non-lues/count` | 🔒 tous |
| PATCH | `/api/notifications/:id/lue` | 🔒 tous |
| PATCH | `/api/notifications/tout-lire` | 🔒 tous |
| DELETE | `/api/notifications/:id` | 🔒 tous |
| GET | `/api/admin/stats` | 🔒 admin |
| GET | `/api/admin/logs` | 🔒 admin |
| GET | `/api/admin/parametres` | 🔒 admin |
| PUT | `/api/admin/parametres/:cle` | 🔒 admin |

---

> **Légende** : 🔒 = nécessite authentification JWT | 🔸 = accès limité à ses propres données
>
> **Ordre recommandé** : Phase 0 → 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10
>
> Chaque phase doit être **testée avant** de passer à la suivante.