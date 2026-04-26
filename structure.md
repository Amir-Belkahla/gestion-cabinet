# Structure du Projet - Gestion de Cabinet Médical

Voici la structure des fichiers du projet :

```text
gestion_cabinet/
├── backend/
│   ├── config/
│   │   ├── constants.php
│   │   └── database.php
│   ├── controllers/
│   │   ├── AdminController.php
│   │   ├── AuthController.php
│   │   ├── ConsultationController.php
│   │   ├── DossierMedicalController.php
│   │   ├── MedecinController.php
│   │   ├── NotificationController.php
│   │   ├── OrdonnanceController.php
│   │   ├── PatientController.php
│   │   ├── RendezVousController.php
│   │   └── UtilisateurController.php
│   ├── middlewares/
│   │   ├── AuthMiddleware.php
│   │   └── RoleMiddleware.php
│   ├── models/
│   │   ├── Consultation.php
│   │   ├── DossierMedical.php
│   │   ├── JWTToken.php
│   │   ├── LogSysteme.php
│   │   ├── Medecin.php
│   │   ├── Notification.php
│   │   ├── Ordonnance.php
│   │   ├── OrdonnanceMedicament.php
│   │   ├── ParametreSysteme.php
│   │   ├── Patient.php
│   │   ├── RendezVous.php
│   │   └── Utilisateur.php
│   ├── routes/
│   │   └── router.php
│   ├── utils/
│   │   ├── JWTHandler.php
│   │   ├── Logger.php
│   │   ├── NotificationService.php
│   │   ├── Response.php
│   │   └── Validator.php
│   ├── .htaccess
│   ├── BDD.sql
│   ├── implementation.md
│   ├── index.php
│   └── setup.php
└── frontend/
    ├── css/
    │   └── style.css
    ├── js/
    │   ├── admin.js
    │   ├── api.js
    │   ├── app.js
    │   ├── auth.js
    │   ├── consultations.js
    │   ├── notifications.js
    │   ├── ordonnances.js
    │   ├── patients.js
    │   ├── profil.js
    │   ├── rendez_vous.js
    │   └── utilisateurs.js
    ├── admin.html
    ├── consultations.html
    ├── dashboard.html
    ├── index.html
    ├── notifications.html
    ├── ordonnances.html
    ├── patients.html
    ├── profil.html
    ├── rendez-vous.html
    └── utilisateurs.html
```
