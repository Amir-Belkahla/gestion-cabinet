<?php
class AuthMiddleware {

    /**
     * Vérifie le token Bearer, retourne le payload ou appelle Response::unauthorized().
     */
    public static function handle(): array {
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';

        if (!$authHeader) {
            // Try Apache fallback
            $authHeader = apache_request_headers()['Authorization'] ?? '';
        }

        if (!str_starts_with($authHeader, 'Bearer ')) {
            Response::unauthorized('Token d\'authentification manquant.');
        }

        $token   = substr($authHeader, 7);
        $payload = JWTHandler::validate($token, JWT_SECRET);

        if (!$payload) {
            Response::unauthorized('Token invalide ou expiré.');
        }

        return $payload;
    }
}
