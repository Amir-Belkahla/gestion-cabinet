<?php
class LogSysteme {
    private PDO $pdo;

    public function __construct() {
        $this->pdo = Database::getInstance()->getConnection();
    }

    public function getAll(array $filters = [], int $page = 1, int $limit = 30): array {
        $where  = ['1=1'];
        $params = [];
        if (!empty($filters['utilisateur_id'])) {
            $where[] = 'l.utilisateur_id = ?'; $params[] = $filters['utilisateur_id'];
        }
        if (!empty($filters['action'])) {
            $where[] = 'l.action LIKE ?'; $params[] = '%' . $filters['action'] . '%';
        }
        if (!empty($filters['date'])) {
            $where[] = 'DATE(l.created_at) = ?'; $params[] = $filters['date'];
        }
        $offset = ($page - 1) * $limit;
        $sql = "SELECT l.*, CONCAT(u.nom,' ',u.prenom) AS utilisateur_nom
                FROM logs_systeme l
                LEFT JOIN utilisateurs u ON l.utilisateur_id = u.id
                WHERE " . implode(' AND ', $where) . "
                ORDER BY l.created_at DESC
                LIMIT {$limit} OFFSET {$offset}";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll();

        $countStmt = $this->pdo->prepare("SELECT COUNT(*) FROM logs_systeme l WHERE " . implode(' AND ', $where));
        $countStmt->execute($params);

        return ['data' => $rows, 'total' => (int)$countStmt->fetchColumn(), 'page' => $page, 'limit' => $limit];
    }
}
