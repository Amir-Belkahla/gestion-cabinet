<?php
class Response {

    public static function json(mixed $data, int $code = 200): void {
        http_response_code($code);
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    public static function success(mixed $data = null, string $message = 'OK', int $code = 200): void {
        self::json(['success' => true, 'message' => $message, 'data' => $data], $code);
    }

    public static function created(mixed $data = null, string $message = 'Créé avec succès'): void {
        self::json(['success' => true, 'message' => $message, 'data' => $data], 201);
    }

    public static function error(string $message, int $code = 400, mixed $errors = null): void {
        $body = ['success' => false, 'message' => $message];
        if ($errors !== null) $body['errors'] = $errors;
        self::json($body, $code);
    }

    public static function unauthorized(string $message = 'Non autorisé'): void {
        self::error($message, 401);
    }

    public static function forbidden(string $message = 'Accès refusé'): void {
        self::error($message, 403);
    }

    public static function notFound(string $message = 'Ressource introuvable'): void {
        self::error($message, 404);
    }

    public static function conflict(string $message = 'Conflit de données'): void {
        self::error($message, 409);
    }

    public static function serverError(string $message = 'Erreur serveur interne'): void {
        self::error($message, 500);
    }
}
