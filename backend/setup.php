<?php
/**
 * setup.php — Script de configuration initiale du cabinet médical
 * 
 * UTILISATION :
 *   1. Importer BDD.sql dans phpMyAdmin (ou ligne de commande)
 *   2. Accéder à http://localhost/gestion_cabinet/backend/setup.php
 *   3. Suivre les instructions à l'écran
 * 
 * SUPPRIMER ce fichier après configuration initiale.
 */

declare(strict_types=1);

// Empêcher l'accès depuis CLI en production
if (PHP_SAPI === 'cli' && !in_array('--force', $argv ?? [])) {
    echo "Exécutez via navigateur ou ajoutez --force\n";
}

// ─── Configuration DB ───────────────────────────────────────────────────────
$dbHost   = 'localhost';
$dbName   = 'cabinet_medical';
$dbUser   = 'root';
$dbPass   = '';

// ─── HTML output start ──────────────────────────────────────────────────────
?>
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Setup — Cabinet Médical</title>
<style>
  body { font-family: 'Segoe UI', sans-serif; background: #f1f5f9; padding: 2rem; }
  .card { background: white; border-radius: 10px; padding: 2rem; max-width: 680px; margin: 0 auto; box-shadow: 0 2px 8px rgba(0,0,0,.1); }
  h1 { color: #1e40af; margin-bottom: .5rem; }
  .step { border-left: 4px solid #e2e8f0; padding: 1rem 1.5rem; margin: 1rem 0; }
  .step.ok  { border-color: #16a34a; background: #f0fdf4; }
  .step.err { border-color: #dc2626; background: #fef2f2; }
  .step.warn{ border-color: #d97706; background: #fffbeb; }
  .step h3  { margin: 0 0 .5rem; }
  code { background: #f1f5f9; padding: .15rem .4rem; border-radius: 4px; font-family: monospace; font-size: .875rem; }
  .btn { display: inline-block; background: #2563eb; color: white; padding: .6rem 1.2rem; border-radius: 6px; text-decoration: none; margin-top: 1rem; border: none; cursor: pointer; font-size: 1rem; }
  .cred-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1rem; margin-top: 1rem; }
  .cred-row { display: flex; justify-content: space-between; padding: .4rem 0; border-bottom: 1px solid #e2e8f0; }
  .cred-row:last-child { border-bottom: none; }
  label { font-weight: 600; font-size: .85rem; }
  input[type=text], input[type=password] { width: 100%; padding: .5rem .75rem; border: 1.5px solid #e2e8f0; border-radius: 6px; font-size: .95rem; margin-top: .25rem; box-sizing: border-box; }
  form { margin-top: 1.5rem; }
  .form-group { margin-bottom: 1rem; }
  hr { border: none; border-top: 1px solid #e2e8f0; margin: 1.5rem 0; }
  .warning { color: #c2410c; font-weight: 600; }
</style>
</head>
<body>
<div class="card">
  <h1>🏥 Cabinet Médical — Configuration initiale</h1>
  <p style="color:#64748b">Ce script configure le compte administrateur et vérifie la connexion à la base de données.</p>
  <hr>

<?php

$errors = [];
$success = [];
$pdo = null;

// ─── Étape 1 : Connexion DB ──────────────────────────────────────────────────
try {
    $dsn = "mysql:host={$dbHost};dbname={$dbName};charset=utf8mb4";
    $pdo = new PDO($dsn, $dbUser, $dbPass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    echo '<div class="step ok"><h3>✅ Connexion MySQL réussie</h3><p>Base de données <code>' . $dbName . '</code> accessible.</p></div>';
} catch (PDOException $e) {
    echo '<div class="step err"><h3>❌ Erreur de connexion MySQL</h3><p>' . htmlspecialchars($e->getMessage()) . '</p>
    <p>Vérifiez que XAMPP est démarré et que la base <code>' . $dbName . '</code> existe (importez BDD.sql).</p></div>';
    echo '</div></body></html>';
    exit;
}

// ─── Étape 2 : Vérifier les tables ──────────────────────────────────────────
$tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
$required = ['utilisateurs', 'patients', 'medecins', 'rendez_vous', 'consultations', 'ordonnances', 'notifications', 'logs_systeme', 'parametres_systeme', 'jwt_tokens'];
$missing = array_diff($required, $tables);

if ($missing) {
    echo '<div class="step err"><h3>❌ Tables manquantes</h3><p>Importez d\'abord <code>BDD.sql</code> dans phpMyAdmin.</p><p>Tables manquantes : <code>' . implode(', ', $missing) . '</code></p></div>';
    echo '</div></body></html>';
    exit;
} else {
    echo '<div class="step ok"><h3>✅ Structure de base de données OK</h3><p>' . count($tables) . ' tables trouvées.</p></div>';
}

// ─── Traitement du formulaire ────────────────────────────────────────────────
$formSubmitted = $_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['admin_password']);

if ($formSubmitted) {
    $adminEmail    = trim($_POST['admin_email']    ?? 'admin@cabinet.com');
    $adminPassword = $_POST['admin_password']      ?? '';
    $adminNom      = trim($_POST['admin_nom']      ?? 'Super');
    $adminPrenom   = trim($_POST['admin_prenom']   ?? 'Admin');

    if (strlen($adminPassword) < 8) {
        echo '<div class="step err"><h3>❌ Mot de passe trop court</h3><p>Minimum 8 caractères.</p></div>';
    } else {
        $hash = password_hash($adminPassword, PASSWORD_BCRYPT);

        // Vérifier si un admin existe déjà
        $existing = $pdo->prepare("SELECT id FROM utilisateurs WHERE email = ? AND role = 'admin' LIMIT 1");
        $existing->execute([$adminEmail]);
        $admin = $existing->fetch();

        if ($admin) {
            // Mettre à jour
            $stmt = $pdo->prepare("UPDATE utilisateurs SET mot_de_passe = ?, nom = ?, prenom = ?, actif = 1 WHERE id = ?");
            $stmt->execute([$hash, $adminNom, $adminPrenom, $admin['id']]);
            echo '<div class="step ok"><h3>✅ Compte admin mis à jour</h3></div>';
        } else {
            // Créer
            $stmt = $pdo->prepare("INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, role, actif) VALUES (?, ?, ?, ?, 'admin', 1)");
            $stmt->execute([$adminNom, $adminPrenom, $adminEmail, $hash]);
            echo '<div class="step ok"><h3>✅ Compte admin créé</h3></div>';
        }

        echo '<div class="step ok">
            <h3>🔑 Identifiants de connexion</h3>
            <div class="cred-box">
              <div class="cred-row"><span>Email</span><code>' . htmlspecialchars($adminEmail) . '</code></div>
              <div class="cred-row"><span>Mot de passe</span><code>' . htmlspecialchars($adminPassword) . '</code></div>
              <div class="cred-row"><span>URL frontend</span><a href="http://localhost/gestion_cabinet/frontend/index.html">http://localhost/gestion_cabinet/frontend/index.html</a></div>
            </div>
            <p class="warning" style="margin-top:.75rem">⚠️ Supprimez ce fichier setup.php après configuration !</p>
        </div>';
        echo '</div></body></html>';
        exit;
    }
}

// ─── Vérifier compte admin existant ─────────────────────────────────────────
$adminCheck = $pdo->query("SELECT id, email, nom, prenom FROM utilisateurs WHERE role = 'admin' LIMIT 1")->fetch();
if ($adminCheck) {
    echo '<div class="step warn"><h3>⚠️ Compte admin existant</h3>
    <p>Un admin existe déjà : <code>' . htmlspecialchars($adminCheck['email']) . '</code></p>
    <p>Utilisez le formulaire ci-dessous pour modifier le mot de passe.</p></div>';
} else {
    echo '<div class="step warn"><h3>⚠️ Aucun compte admin</h3><p>Complétez le formulaire pour créer le compte administrateur.</p></div>';
}
?>

  <hr>
  <h2 style="font-size:1.1rem">Configurer le compte administrateur</h2>
  <form method="POST">
    <div class="form-group">
      <label>Email admin</label>
      <input type="text" name="admin_email" value="admin@cabinet.com" required>
    </div>
    <div class="form-group">
      <label>Nom</label>
      <input type="text" name="admin_nom" value="Super" required>
    </div>
    <div class="form-group">
      <label>Prénom</label>
      <input type="text" name="admin_prenom" value="Admin" required>
    </div>
    <div class="form-group">
      <label>Mot de passe (min. 8 caractères)</label>
      <input type="password" name="admin_password" placeholder="Mot de passe fort" required>
    </div>
    <button type="submit" class="btn">🔧 Configurer maintenant</button>
  </form>

  <hr>
  <p style="font-size:.85rem;color:#94a3b8;text-align:center">⚠️ Supprimez ce fichier <code>setup.php</code> après configuration.</p>
</div>
</body>
</html>
