<?php
class Utilisateur {
    private PDO $pdo;

    public function __construct() {
        $this->pdo = Database::getInstance()->getConnection();
    }

    public function findByEmail(string $email): ?array {
        $stmt = $this->pdo->prepare("SELECT * FROM utilisateurs WHERE email = ? LIMIT 1");
        $stmt->execute([$email]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function findById(int $id): ?array {
        $stmt = $this->pdo->prepare("SELECT id, nom, prenom, email, telephone, role, actif, created_at FROM utilisateurs WHERE id = ? LIMIT 1");
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function getAll(array $filters = [], int $page = 1, int $limit = 20): array {
        $where  = ['1=1'];
        $params = [];

        if (!empty($filters['role'])) {
            $where[]  = 'role = ?';
            $params[] = $filters['role'];
        }
        if (isset($filters['actif'])) {
            $where[]  = 'actif = ?';
            $params[] = (int)$filters['actif'];
        }
        if (!empty($filters['search'])) {
            $where[]  = "(nom LIKE ? OR prenom LIKE ? OR email LIKE ?)";
            $s = '%' . $filters['search'] . '%';
            $params[] = $s; $params[] = $s; $params[] = $s;
        }

        $offset = ($page - 1) * $limit;
        $sql = "SELECT id, nom, prenom, email, telephone, role, actif, created_at
                FROM utilisateurs
                WHERE " . implode(' AND ', $where) . "
                ORDER BY created_at DESC
                LIMIT {$limit} OFFSET {$offset}";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll();

        $countStmt = $this->pdo->prepare("SELECT COUNT(*) FROM utilisateurs WHERE " . implode(' AND ', $where));
        $countStmt->execute($params);
        $total = (int)$countStmt->fetchColumn();

        return ['data' => $rows, 'total' => $total, 'page' => $page, 'limit' => $limit];
    }

    public function create(array $data): int {
        $stmt = $this->pdo->prepare(
            "INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, telephone, role, actif)
             VALUES (?, ?, ?, ?, ?, ?, ?)"
        );
        $stmt->execute([
            $data['nom'],
            $data['prenom'],
            $data['email'],
            $data['mot_de_passe'],
            $data['telephone'] ?? null,
            $data['role'],
            $data['actif'] ?? 1,
        ]);
        return (int)$this->pdo->lastInsertId();
    }

    public function update(int $id, array $data): bool {
        $fields = [];
        $params = [];
        foreach (['nom', 'prenom', 'email', 'role', 'actif', 'telephone'] as $f) {
            if (array_key_exists($f, $data)) {
                $fields[] = "{$f} = ?";
                $params[] = $data[$f];
            }
        }
        if (empty($fields)) return false;
        $params[] = $id;
        $stmt = $this->pdo->prepare("UPDATE utilisateurs SET " . implode(', ', $fields) . " WHERE id = ?");
        $stmt->execute($params);
        return $stmt->rowCount() > 0;
    }

    public function updatePassword(int $id, string $hash): bool {
        $stmt = $this->pdo->prepare("UPDATE utilisateurs SET mot_de_passe = ? WHERE id = ?");
        $stmt->execute([$hash, $id]);
        return $stmt->rowCount() > 0;
    }

    public function toggleActif(int $id): bool {
        $stmt = $this->pdo->prepare("UPDATE utilisateurs SET actif = NOT actif WHERE id = ?");
        $stmt->execute([$id]);
        return $stmt->rowCount() > 0;
    }

    public function delete(int $id): bool {
        $stmt = $this->pdo->prepare("DELETE FROM utilisateurs WHERE id = ?");
        $stmt->execute([$id]);
        return $stmt->rowCount() > 0;
    }

    public function emailExists(string $email, ?int $excludeId = null): bool {
        if ($excludeId) {
            $stmt = $this->pdo->prepare("SELECT 1 FROM utilisateurs WHERE email = ? AND id != ? LIMIT 1");
            $stmt->execute([$email, $excludeId]);
        } else {
            $stmt = $this->pdo->prepare("SELECT 1 FROM utilisateurs WHERE email = ? LIMIT 1");
            $stmt->execute([$email]);
        }
        return (bool)$stmt->fetchColumn();
    }
}
