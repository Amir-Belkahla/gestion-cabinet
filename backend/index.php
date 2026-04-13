<?php
declare(strict_types=1);

// ── CORS ────────────────────────────────────────────────────────────────────
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '') {
    header("Access-Control-Allow-Origin: {$origin}");
    header('Access-Control-Allow-Credentials: true');
} else {
    header('Access-Control-Allow-Origin: *');
}
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=UTF-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// ── Sécurité ─────────────────────────────────────────────────────────────────
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');

// ── Autoload ─────────────────────────────────────────────────────────────────
$basePath = __DIR__;

require_once $basePath . '/config/database.php';
require_once $basePath . '/config/constants.php';
require_once $basePath . '/utils/Response.php';
require_once $basePath . '/utils/Validator.php';
require_once $basePath . '/utils/JWTHandler.php';
require_once $basePath . '/utils/Logger.php';
require_once $basePath . '/utils/NotificationService.php';

require_once $basePath . '/middlewares/AuthMiddleware.php';
require_once $basePath . '/middlewares/RoleMiddleware.php';

require_once $basePath . '/models/Utilisateur.php';
require_once $basePath . '/models/JWTToken.php';
require_once $basePath . '/models/Patient.php';
require_once $basePath . '/models/Medecin.php';
require_once $basePath . '/models/RendezVous.php';
require_once $basePath . '/models/Consultation.php';
require_once $basePath . '/models/Ordonnance.php';
require_once $basePath . '/models/OrdonnanceMedicament.php';
require_once $basePath . '/models/DossierMedical.php';
require_once $basePath . '/models/Notification.php';
require_once $basePath . '/models/LogSysteme.php';
require_once $basePath . '/models/ParametreSysteme.php';

require_once $basePath . '/controllers/AuthController.php';
require_once $basePath . '/controllers/UtilisateurController.php';
require_once $basePath . '/controllers/PatientController.php';
require_once $basePath . '/controllers/MedecinController.php';
require_once $basePath . '/controllers/RendezVousController.php';
require_once $basePath . '/controllers/ConsultationController.php';
require_once $basePath . '/controllers/OrdonnanceController.php';
require_once $basePath . '/controllers/DossierMedicalController.php';
require_once $basePath . '/controllers/NotificationController.php';
require_once $basePath . '/controllers/AdminController.php';

require_once $basePath . '/routes/router.php';

// ── Global error handler ─────────────────────────────────────────────────────
set_exception_handler(function (Throwable $e) {
    error_log($e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine());
    Response::serverError('Une erreur interne est survenue.');
});

// ── Parse request ─────────────────────────────────────────────────────────────
$method = $_SERVER['REQUEST_METHOD'];
$uri    = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Normalise le chemin en supprimant le préfixe /gestion_cabinet/backend
$uri = preg_replace('#^/gestion_cabinet/backend#', '', $uri);
$uri = '/' . trim($uri, '/');

// ── Body JSON ─────────────────────────────────────────────────────────────────
$body = [];
$rawInput = file_get_contents('php://input');
if ($rawInput) {
    $decoded = json_decode($rawInput, true);
    if (json_last_error() === JSON_ERROR_NONE) {
        $body = $decoded;
    }
}

// ── Dispatch ─────────────────────────────────────────────────────────────────
Router::dispatch($method, $uri, $body);
