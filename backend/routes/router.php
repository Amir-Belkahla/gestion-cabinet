<?php
class Router {

    public static function dispatch(string $method, string $uri, array $body): void {
        $query = $_GET;

        // ── Auth (public) ────────────────────────────────────────────────────
        if ($method === 'POST' && $uri === '/api/auth/register') {
            AuthController::register($body); return;
        }
        if ($method === 'POST' && $uri === '/api/auth/login') {
            AuthController::login($body); return;
        }
        if ($method === 'POST' && $uri === '/api/auth/refresh') {
            AuthController::refresh($body); return;
        }

        // ── Routes protégées — vérif token ────────────────────────────────────
        $auth = AuthMiddleware::handle();

        if ($method === 'POST' && $uri === '/api/auth/logout') {
            AuthController::logout($body, $auth); return;
        }
        if ($method === 'GET' && $uri === '/api/auth/me') {
            AuthController::me($auth); return;
        }
        if ($method === 'POST' && $uri === '/api/auth/change-password') {
            AuthController::changePassword($body, $auth); return;
        }

        // ── Utilisateurs ─────────────────────────────────────────────────────
        if ($method === 'GET'    && $uri === '/api/utilisateurs') {
            UtilisateurController::index($auth, $query); return;
        }
        if ($method === 'POST'   && $uri === '/api/utilisateurs') {
            UtilisateurController::store($body, $auth); return;
        }
        if ($method === 'GET'    && preg_match('#^/api/utilisateurs/(\d+)$#', $uri, $m)) {
            UtilisateurController::show((int)$m[1], $auth); return;
        }
        if ($method === 'PUT'    && preg_match('#^/api/utilisateurs/(\d+)$#', $uri, $m)) {
            UtilisateurController::update((int)$m[1], $body, $auth); return;
        }
        if ($method === 'PATCH'  && preg_match('#^/api/utilisateurs/(\d+)/toggle$#', $uri, $m)) {
            UtilisateurController::toggle((int)$m[1], $auth); return;
        }
        if ($method === 'DELETE' && preg_match('#^/api/utilisateurs/(\d+)$#', $uri, $m)) {
            UtilisateurController::destroy((int)$m[1], $auth); return;
        }

        // ── Médecins ─────────────────────────────────────────────────────────
        if ($method === 'GET' && $uri === '/api/medecins') {
            MedecinController::index($auth); return;
        }
        if ($method === 'GET' && preg_match('#^/api/medecins/(\d+)$#', $uri, $m)) {
            MedecinController::show((int)$m[1], $auth); return;
        }

        // ── Patients ─────────────────────────────────────────────────────────
        if ($method === 'GET'    && $uri === '/api/patients') {
            PatientController::index($auth, $query); return;
        }
        if ($method === 'POST'   && $uri === '/api/patients') {
            PatientController::store($body, $auth); return;
        }
        if ($method === 'GET'    && preg_match('#^/api/patients/(\d+)$#', $uri, $m)) {
            PatientController::show((int)$m[1], $auth); return;
        }
        if ($method === 'PUT'    && preg_match('#^/api/patients/(\d+)$#', $uri, $m)) {
            PatientController::update((int)$m[1], $body, $auth); return;
        }
        if ($method === 'DELETE' && preg_match('#^/api/patients/(\d+)$#', $uri, $m)) {
            PatientController::destroy((int)$m[1], $auth); return;
        }

        // ── Rendez-vous ──────────────────────────────────────────────────────
        if ($method === 'GET'   && $uri === '/api/rendez-vous') {
            RendezVousController::index($auth, $query); return;
        }
        if ($method === 'POST'  && $uri === '/api/rendez-vous') {
            RendezVousController::store($body, $auth); return;
        }
        if ($method === 'GET'   && $uri === '/api/rendez-vous/mes-rdv') {
            RendezVousController::mesRdv($auth); return;
        }
        if ($method === 'GET'   && preg_match('#^/api/rendez-vous/planning/(\d+)$#', $uri, $m)) {
            RendezVousController::planning((int)$m[1], $query); return;
        }
        if ($method === 'GET'   && preg_match('#^/api/rendez-vous/(\d+)$#', $uri, $m)) {
            RendezVousController::show((int)$m[1], $auth); return;
        }
        if ($method === 'PUT'   && preg_match('#^/api/rendez-vous/(\d+)$#', $uri, $m)) {
            RendezVousController::update((int)$m[1], $body, $auth); return;
        }
        if ($method === 'PATCH' && preg_match('#^/api/rendez-vous/(\d+)/annuler$#', $uri, $m)) {
            RendezVousController::annuler((int)$m[1], $auth); return;
        }
        if ($method === 'PATCH' && preg_match('#^/api/rendez-vous/(\d+)/confirmer$#', $uri, $m)) {
            RendezVousController::confirmer((int)$m[1], $auth); return;
        }
        if ($method === 'PATCH' && preg_match('#^/api/rendez-vous/(\d+)/terminer$#', $uri, $m)) {
            RendezVousController::terminer((int)$m[1], $auth); return;
        }
        if ($method === 'DELETE' && preg_match('#^/api/rendez-vous/(\d+)$#', $uri, $m)) {
            RendezVousController::destroy((int)$m[1], $auth); return;
        }

        // ── Consultations ────────────────────────────────────────────────────
        if ($method === 'GET'   && $uri === '/api/consultations') {
            ConsultationController::index($auth, $query); return;
        }
        if ($method === 'POST'  && $uri === '/api/consultations') {
            ConsultationController::store($body, $auth); return;
        }
        if ($method === 'GET'   && preg_match('#^/api/consultations/patient/(\d+)$#', $uri, $m)) {
            ConsultationController::byPatient((int)$m[1], $auth); return;
        }
        if ($method === 'GET'   && preg_match('#^/api/consultations/(\d+)$#', $uri, $m)) {
            ConsultationController::show((int)$m[1], $auth); return;
        }
        if ($method === 'PUT'   && preg_match('#^/api/consultations/(\d+)$#', $uri, $m)) {
            ConsultationController::update((int)$m[1], $body, $auth); return;
        }
        if ($method === 'DELETE' && preg_match('#^/api/consultations/(\d+)$#', $uri, $m)) {
            ConsultationController::destroy((int)$m[1], $auth); return;
        }

        // ── Ordonnances ──────────────────────────────────────────────────────
        if ($method === 'POST'  && $uri === '/api/ordonnances') {
            OrdonnanceController::store($body, $auth); return;
        }
        if ($method === 'GET'   && preg_match('#^/api/ordonnances/consultation/(\d+)$#', $uri, $m)) {
            OrdonnanceController::byConsultation((int)$m[1], $auth); return;
        }
        if ($method === 'GET'   && preg_match('#^/api/ordonnances/patient/(\d+)$#', $uri, $m)) {
            OrdonnanceController::byPatient((int)$m[1], $auth); return;
        }
        if ($method === 'GET'   && preg_match('#^/api/ordonnances/(\d+)$#', $uri, $m)) {
            OrdonnanceController::show((int)$m[1], $auth); return;
        }
        if ($method === 'PUT'   && preg_match('#^/api/ordonnances/(\d+)$#', $uri, $m)) {
            OrdonnanceController::update((int)$m[1], $body, $auth); return;
        }
        if ($method === 'DELETE' && preg_match('#^/api/ordonnances/(\d+)$#', $uri, $m)) {
            OrdonnanceController::destroy((int)$m[1], $auth); return;
        }

        // ── Dossiers médicaux ────────────────────────────────────────────────
        if ($method === 'GET' && preg_match('#^/api/dossiers-medicaux/(\d+)$#', $uri, $m)) {
            DossierMedicalController::show((int)$m[1], $auth); return;
        }
        if ($method === 'PUT' && preg_match('#^/api/dossiers-medicaux/(\d+)$#', $uri, $m)) {
            DossierMedicalController::update((int)$m[1], $body, $auth); return;
        }

        // ── Notifications ────────────────────────────────────────────────────
        if ($method === 'GET'   && $uri === '/api/notifications') {
            NotificationController::index($auth, $query); return;
        }
        if ($method === 'GET'   && $uri === '/api/notifications/non-lues/count') {
            NotificationController::countNonLues($auth); return;
        }
        if ($method === 'PATCH' && preg_match('#^/api/notifications/(\d+)/lue$#', $uri, $m)) {
            NotificationController::marquerLue((int)$m[1], $auth); return;
        }
        if ($method === 'PATCH' && $uri === '/api/notifications/tout-lire') {
            NotificationController::toutLire($auth); return;
        }
        if ($method === 'DELETE' && preg_match('#^/api/notifications/(\d+)$#', $uri, $m)) {
            NotificationController::destroy((int)$m[1], $auth); return;
        }

        // ── Admin ────────────────────────────────────────────────────────────
        if ($method === 'GET' && $uri === '/api/admin/stats') {
            AdminController::stats($auth); return;
        }
        if ($method === 'GET' && $uri === '/api/admin/logs') {
            AdminController::logs($auth, $query); return;
        }
        if ($method === 'GET' && $uri === '/api/admin/parametres') {
            AdminController::parametres($auth); return;
        }
        if ($method === 'PUT' && preg_match('#^/api/admin/parametres/(.+)$#', $uri, $m)) {
            AdminController::updateParametre($m[1], $body, $auth); return;
        }

        // ── 404 ──────────────────────────────────────────────────────────────
        Response::notFound("Route {$method} {$uri} introuvable.");
    }
}
