<?php
class RoleMiddleware {

    /**
     * Vérifie que le rôle de l'utilisateur est dans la liste des rôles autorisés.
     * @param array  $userPayload  Retourné par AuthMiddleware::handle()
     * @param array  $allowedRoles Liste des rôles autorisés
     */
    public static function handle(array $userPayload, array $allowedRoles): void {
        $role = $userPayload['role'] ?? '';
        if (!in_array($role, $allowedRoles, true)) {
            Response::forbidden('Vous n\'avez pas les permissions requises.');
        }
    }
}
