<?php
class Logger {

    public static function log(
        ?int $utilisateurId,
        string $action,
        string $table = '',
        ?int $enregistrementId = null,
        string $details = '',
        string $ip = ''
    ): void {
        try {
            $pdo = Database::getInstance()->getConnection();
            $ip  = $ip ?: ($_SERVER['REMOTE_ADDR'] ?? 'unknown');
            $stmt = $pdo->prepare(
                "INSERT INTO logs_systeme
                 (utilisateur_id, action, table_concernee, enregistrement_id, details, adresse_ip)
                 VALUES (?, ?, ?, ?, ?, ?)"
            );
            $stmt->execute([$utilisateurId, $action, $table, $enregistrementId, $details, $ip]);
        } catch (Exception) {
            // Logging ne doit jamais faire planter l'application
        }
    }
}
