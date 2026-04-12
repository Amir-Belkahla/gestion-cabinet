-- =============================================
-- Base de données : Gestion de Cabinet Médical
-- =============================================

CREATE DATABASE IF NOT EXISTS cabinet_medical;
USE cabinet_medical;

-- =============================================
-- Table : utilisateurs (authentification + rôles)
-- =============================================
CREATE TABLE utilisateurs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    mot_de_passe VARCHAR(255) NOT NULL,  -- hash bcrypt
    telephone VARCHAR(20),
    role ENUM('admin', 'medecin', 'secretaire', 'patient') NOT NULL,
    actif TINYINT(1) DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =============================================
-- Table : tokens JWT (refresh tokens / blacklist)
-- =============================================
CREATE TABLE jwt_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    utilisateur_id INT NOT NULL,
    token TEXT NOT NULL,
    expire_at DATETIME NOT NULL,
    revoque TINYINT(1) DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =============================================
-- Table : patients
-- =============================================
CREATE TABLE patients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    utilisateur_id INT DEFAULT NULL,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    date_naissance DATE NOT NULL,
    sexe ENUM('M', 'F') NOT NULL,
    telephone VARCHAR(20),
    adresse TEXT,
    email VARCHAR(150),
    groupe_sanguin VARCHAR(5),
    allergies TEXT,
    antecedents TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- =============================================
-- Table : medecins
-- =============================================
CREATE TABLE medecins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    utilisateur_id INT NOT NULL UNIQUE,
    specialite VARCHAR(100),
    telephone VARCHAR(20),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =============================================
-- Table : rendez-vous
-- =============================================
CREATE TABLE rendez_vous (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    medecin_id INT NOT NULL,
    date_rdv DATE NOT NULL,
    heure_debut TIME NOT NULL,
    heure_fin TIME NOT NULL,
    motif VARCHAR(255),
    statut ENUM('planifie', 'confirme', 'annule', 'termine') DEFAULT 'planifie',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (medecin_id) REFERENCES medecins(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Index pour éviter les conflits d'horaires
CREATE UNIQUE INDEX idx_no_conflit
ON rendez_vous (medecin_id, date_rdv, heure_debut);

-- =============================================
-- Table : consultations
-- =============================================
CREATE TABLE consultations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rendez_vous_id INT DEFAULT NULL,
    patient_id INT NOT NULL,
    medecin_id INT NOT NULL,
    date_consultation DATETIME NOT NULL,
    symptomes TEXT,
    diagnostic TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (rendez_vous_id) REFERENCES rendez_vous(id) ON DELETE SET NULL,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (medecin_id) REFERENCES medecins(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =============================================
-- Table : ordonnances
-- =============================================
CREATE TABLE ordonnances (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    consultation_id INT DEFAULT NULL,
    date_ordonnance DATE NOT NULL,
    instructions TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (consultation_id) REFERENCES consultations(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- =============================================
-- Table : médicaments d'une ordonnance
-- =============================================
CREATE TABLE ordonnance_medicaments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ordonnance_id INT NOT NULL,
    nom_medicament VARCHAR(200) NOT NULL,
    dosage VARCHAR(100),
    frequence VARCHAR(100),
    duree VARCHAR(100),
    instructions TEXT,
    FOREIGN KEY (ordonnance_id) REFERENCES ordonnances(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =============================================
-- Table : dossier médical (historique centralisé)
-- =============================================
CREATE TABLE dossiers_medicaux (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL UNIQUE,
    notes_generales TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =============================================
-- Table : notifications
-- =============================================
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    utilisateur_id INT NOT NULL,
    type ENUM('confirmation_rdv', 'rappel_rdv', 'annulation_rdv', 'general', 'rdv', 'consultation', 'ordonnance', 'systeme') NOT NULL,
    titre VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    lue TINYINT(1) DEFAULT 0,
    reference_id INT DEFAULT NULL,
    date_envoi DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =============================================
-- Table : logs système (traçabilité pour l'admin)
-- =============================================
CREATE TABLE logs_systeme (
    id INT AUTO_INCREMENT PRIMARY KEY,
    utilisateur_id INT DEFAULT NULL,
    action VARCHAR(255) NOT NULL,
    table_concernee VARCHAR(100),
    enregistrement_id INT,
    details TEXT,
    adresse_ip VARCHAR(45),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- =============================================
-- Table : paramètres système (config du cabinet)
-- =============================================
CREATE TABLE parametres_systeme (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cle VARCHAR(100) NOT NULL UNIQUE,
    valeur TEXT NOT NULL,
    description VARCHAR(255),
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =============================================
-- Données initiales
-- =============================================

-- Compte admin système (mot de passe à changer au premier login)
INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, role)
-- Mot de passe : Admin@2026  (hash bcrypt généré via setup.php)
VALUES ('Super', 'Admin', 'admin@cabinet.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');
-- Note: hash ci-dessus correspond à 'password' (bcrypt cost 10)
-- Changez via setup.php ou en relançant : UPDATE utilisateurs SET mot_de_passe=? WHERE email='admin@cabinet.com';

-- Paramètres par défaut
INSERT INTO parametres_systeme (cle, valeur, description) VALUES
('nom_cabinet', 'Cabinet Médical', 'Nom du cabinet'),
('heure_ouverture', '08:00', 'Heure d\'ouverture du cabinet'),
('heure_fermeture', '18:00', 'Heure de fermeture du cabinet'),
('duree_rdv_defaut', '30', 'Durée par défaut d\'un RDV en minutes'),
('rappel_rdv_heures', '24', 'Envoyer le rappel X heures avant le RDV');

-- =============================================
-- Vues utiles
-- =============================================

-- Vue : rendez-vous du jour
CREATE VIEW vue_rdv_jour AS
SELECT
    rv.id,
    rv.date_rdv,
    rv.heure_debut,
    rv.heure_fin,
    rv.statut,
    rv.motif,
    CONCAT(p.nom, ' ', p.prenom) AS patient_nom,
    p.telephone AS patient_tel,
    CONCAT(u.nom, ' ', u.prenom) AS medecin_nom
FROM rendez_vous rv
JOIN patients p ON rv.patient_id = p.id
JOIN medecins m ON rv.medecin_id = m.id
JOIN utilisateurs u ON m.utilisateur_id = u.id
WHERE rv.date_rdv = CURDATE()
ORDER BY rv.heure_debut;

-- Vue : historique consultations
CREATE VIEW vue_historique_consultations AS
SELECT
    c.id,
    c.date_consultation,
    c.symptomes,
    c.diagnostic,
    c.notes,
    CONCAT(p.nom, ' ', p.prenom) AS patient_nom,
    CONCAT(u.nom, ' ', u.prenom) AS medecin_nom,
    p.id AS patient_id
FROM consultations c
JOIN patients p ON c.patient_id = p.id
JOIN medecins m ON c.medecin_id = m.id
JOIN utilisateurs u ON m.utilisateur_id = u.id
ORDER BY c.date_consultation DESC;

-- Vue : statistiques pour le tableau de bord admin
CREATE VIEW vue_stats_admin AS
SELECT
    (SELECT COUNT(*) FROM utilisateurs WHERE actif = 1) AS total_utilisateurs,
    (SELECT COUNT(*) FROM patients) AS total_patients,
    (SELECT COUNT(*) FROM medecins) AS total_medecins,
    (SELECT COUNT(*) FROM rendez_vous WHERE date_rdv = CURDATE()) AS rdv_aujourdhui,
    (SELECT COUNT(*) FROM rendez_vous WHERE statut = 'planifie') AS rdv_en_attente,
    (SELECT COUNT(*) FROM consultations WHERE DATE(date_consultation) = CURDATE()) AS consultations_aujourdhui;