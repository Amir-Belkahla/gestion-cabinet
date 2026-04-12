<?php
class Consultation {
    private PDO $pdo;

    public function __construct() {
        $this->pdo = Database::getInstance()->getConnection();
    }

    public function getAll(array $filters = [], int $page = 1, int $limit = 20): array {
        $where  = ['1=1'];
        $params = [];
        if (!empty($filters['medecin_id'])) {
            $where[] = 'c.medecin_id = ?'; $params[] = $filters['medecin_id'];
        }
        if (!empty($filters['patient_id'])) {
            $where[] = 'c.patient_id = ?'; $params[] = $filters['patient_id'];
        }
        $offset = ($page - 1) * $limit;
        $sql = "SELECT c.*,
                       CONCAT(p.nom,' ',p.prenom) AS patient_nom,
                       CONCAT(u.nom,' ',u.prenom) AS medecin_nom
                FROM consultations c
                JOIN patients p ON c.patient_id = p.id
                JOIN medecins m ON c.medecin_id = m.id
                JOIN utilisateurs u ON m.utilisateur_id = u.id
                WHERE " . implode(' AND ', $where) . "
                ORDER BY c.date_consultation DESC
                LIMIT {$limit} OFFSET {$offset}";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll();

        $countStmt = $this->pdo->prepare(
            "SELECT COUNT(*) FROM consultations c WHERE " . implode(' AND ', $where)
        );
        $countStmt->execute($params);

        return ['data' => $rows, 'total' => (int)$countStmt->fetchColumn(), 'page' => $page, 'limit' => $limit];
    }

    public function findById(int $id): ?array {
        $stmt = $this->pdo->prepare(
            "SELECT c.*,
                    CONCAT(p.nom,' ',p.prenom) AS patient_nom,
                    CONCAT(u.nom,' ',u.prenom) AS medecin_nom
             FROM consultations c
             JOIN patients p ON c.patient_id = p.id
             JOIN medecins m ON c.medecin_id = m.id
             JOIN utilisateurs u ON m.utilisateur_id = u.id
             WHERE c.id = ? LIMIT 1"
        );
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function getByPatient(int $patientId): array {
        $stmt = $this->pdo->prepare(
            "SELECT c.*,
                    CONCAT(u.nom,' ',u.prenom) AS medecin_nom,
                    m.specialite
             FROM consultations c
             JOIN medecins m ON c.medecin_id = m.id
             JOIN utilisateurs u ON m.utilisateur_id = u.id
             WHERE c.patient_id = ?
             ORDER BY c.date_consultation DESC"
        );
        $stmt->execute([$patientId]);
        return $stmt->fetchAll();
    }

    public function create(array $data): int {
        $stmt = $this->pdo->prepare(
            "INSERT INTO consultations (rendez_vous_id, patient_id, medecin_id, date_consultation, symptomes, diagnostic, notes)
             VALUES (?, ?, ?, ?, ?, ?, ?)"
        );
        $stmt->execute([
            $data['rendez_vous_id'] ?? null,
            $data['patient_id'],
            $data['medecin_id'],
            $data['date_consultation'],
            $data['symptomes'] ?? null,
            $data['diagnostic'] ?? null,
            $data['notes'] ?? null,
        ]);
        return (int)$this->pdo->lastInsertId();
    }

    public function update(int $id, array $data): bool {
        $fields = [];
        $params = [];
        foreach (['symptomes','diagnostic','notes','date_consultation'] as $f) {
            if (array_key_exists($f, $data)) {
                $fields[] = "{$f} = ?";
                $params[] = $data[$f];
            }
        }
        if (empty($fields)) return false;
        $params[] = $id;
        $stmt = $this->pdo->prepare("UPDATE consultations SET " . implode(', ', $fields) . " WHERE id = ?");
        $stmt->execute($params);
        return true;
    }

    public function delete(int $id): bool {
        $stmt = $this->pdo->prepare("DELETE FROM consultations WHERE id = ?");
        $stmt->execute([$id]);
        return $stmt->rowCount() > 0;
    }
}
