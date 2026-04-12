<?php
class Patient {
    private PDO $pdo;

    public function __construct() {
        $this->pdo = Database::getInstance()->getConnection();
    }

    public function getAll(array $filters = [], int $page = 1, int $limit = 20): array {
        $where  = ['1=1'];
        $params = [];

        if (!empty($filters['search'])) {
            $s = '%' . $filters['search'] . '%';
            $where[]  = "(nom LIKE ? OR prenom LIKE ? OR telephone LIKE ? OR email LIKE ?)";
            $params[] = $s; $params[] = $s; $params[] = $s; $params[] = $s;
        }

        $offset = ($page - 1) * $limit;
        $sql = "SELECT * FROM patients WHERE " . implode(' AND ', $where)
             . " ORDER BY nom ASC LIMIT {$limit} OFFSET {$offset}";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll();

        $countStmt = $this->pdo->prepare("SELECT COUNT(*) FROM patients WHERE " . implode(' AND ', $where));
        $countStmt->execute($params);
        $total = (int)$countStmt->fetchColumn();

        return ['data' => $rows, 'total' => $total, 'page' => $page, 'limit' => $limit];
    }

    public function findById(int $id): ?array {
        $stmt = $this->pdo->prepare("SELECT * FROM patients WHERE id = ? LIMIT 1");
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function findByUtilisateurId(int $utilisateurId): ?array {
        $stmt = $this->pdo->prepare("SELECT * FROM patients WHERE utilisateur_id = ? LIMIT 1");
        $stmt->execute([$utilisateurId]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function create(array $data): int {
        $stmt = $this->pdo->prepare(
            "INSERT INTO patients (utilisateur_id, nom, prenom, date_naissance, sexe, telephone, adresse, email, groupe_sanguin, allergies, antecedents)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        );
        $stmt->execute([
            $data['utilisateur_id'] ?? null,
            $data['nom'],
            $data['prenom'],
            $data['date_naissance'],
            $data['sexe'],
            $data['telephone'] ?? null,
            $data['adresse'] ?? null,
            $data['email'] ?? null,
            $data['groupe_sanguin'] ?? null,
            $data['allergies'] ?? null,
            $data['antecedents'] ?? null,
        ]);
        return (int)$this->pdo->lastInsertId();
    }

    public function update(int $id, array $data): bool {
        $fields = [];
        $params = [];
        $updatable = ['nom','prenom','date_naissance','sexe','telephone','adresse','email','groupe_sanguin','allergies','antecedents'];
        foreach ($updatable as $f) {
            if (array_key_exists($f, $data)) {
                $fields[] = "{$f} = ?";
                $params[] = $data[$f];
            }
        }
        if (empty($fields)) return false;
        $params[] = $id;
        $stmt = $this->pdo->prepare("UPDATE patients SET " . implode(', ', $fields) . " WHERE id = ?");
        $stmt->execute($params);
        return $stmt->rowCount() > 0;
    }

    public function delete(int $id): bool {
        $stmt = $this->pdo->prepare("DELETE FROM patients WHERE id = ?");
        $stmt->execute([$id]);
        return $stmt->rowCount() > 0;
    }
}
