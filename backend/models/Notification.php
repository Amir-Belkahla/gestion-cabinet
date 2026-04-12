<?php
class Notification {
    private PDO $pdo;

    public function __construct() {
        $this->pdo = Database::getInstance()->getConnection();
    }

    public function getByUtilisateur(int $utilisateurId, int $page = 1, int $limit = 20): array {
        $offset = ($page - 1) * $limit;
        $stmt = $this->pdo->prepare(
            "SELECT * FROM notifications
             WHERE utilisateur_id = ?
             ORDER BY date_envoi DESC
             LIMIT {$limit} OFFSET {$offset}"
        );
        $stmt->execute([$utilisateurId]);
        $rows = $stmt->fetchAll();

        $countStmt = $this->pdo->prepare("SELECT COUNT(*) FROM notifications WHERE utilisateur_id = ?");
        $countStmt->execute([$utilisateurId]);

        return ['data' => $rows, 'total' => (int)$countStmt->fetchColumn(), 'page' => $page, 'limit' => $limit];
    }

    public function countNonLues(int $utilisateurId): int {
        $stmt = $this->pdo->prepare("SELECT COUNT(*) FROM notifications WHERE utilisateur_id = ? AND lue = 0");
        $stmt->execute([$utilisateurId]);
        return (int)$stmt->fetchColumn();
    }

    public function marquerLue(int $id, int $utilisateurId): bool {
        $stmt = $this->pdo->prepare("UPDATE notifications SET lue = 1 WHERE id = ? AND utilisateur_id = ?");
        $stmt->execute([$id, $utilisateurId]);
        return $stmt->rowCount() > 0;
    }

    public function marquerToutesLues(int $utilisateurId): void {
        $stmt = $this->pdo->prepare("UPDATE notifications SET lue = 1 WHERE utilisateur_id = ?");
        $stmt->execute([$utilisateurId]);
    }

    public function delete(int $id, int $utilisateurId): bool {
        $stmt = $this->pdo->prepare("DELETE FROM notifications WHERE id = ? AND utilisateur_id = ?");
        $stmt->execute([$id, $utilisateurId]);
        return $stmt->rowCount() > 0;
    }
}
