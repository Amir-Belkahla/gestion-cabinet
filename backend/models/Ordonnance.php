<?php
class Ordonnance {
    private PDO $pdo;

    public function __construct() {
        $this->pdo = Database::getInstance()->getConnection();
    }

    public function findById(int $id): ?array {
        $stmt = $this->pdo->prepare(
            "SELECT o.*,
                    CONCAT(p.nom,' ',p.prenom) AS patient_nom
             FROM ordonnances o
             JOIN patients p ON o.patient_id = p.id
             WHERE o.id = ? LIMIT 1"
        );
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function getByConsultation(int $consultationId): array {
        $stmt = $this->pdo->prepare("SELECT * FROM ordonnances WHERE consultation_id = ?");
        $stmt->execute([$consultationId]);
        return $stmt->fetchAll();
    }

    public function getByPatient(int $patientId): array {
        $stmt = $this->pdo->prepare(
            "SELECT o.*,
                    CONCAT(p.nom,' ',p.prenom) AS patient_nom,
                    (SELECT COUNT(*) FROM ordonnance_medicaments om WHERE om.ordonnance_id = o.id) AS medicaments_count
             FROM ordonnances o
             JOIN patients p ON o.patient_id = p.id
             WHERE o.patient_id = ?
             ORDER BY o.date_ordonnance DESC"
        );
        $stmt->execute([$patientId]);
        return $stmt->fetchAll();
    }

    public function getAll(int $page = 1, int $limit = 20): array {
        $offset = ($page - 1) * $limit;
        $stmt = $this->pdo->prepare(
            "SELECT o.*,
                    CONCAT(p.nom,' ',p.prenom) AS patient_nom,
                    (SELECT COUNT(*) FROM ordonnance_medicaments om WHERE om.ordonnance_id = o.id) AS medicaments_count
             FROM ordonnances o
             JOIN patients p ON o.patient_id = p.id
             ORDER BY o.date_ordonnance DESC
             LIMIT ? OFFSET ?"
        );
        $stmt->execute([$limit, $offset]);
        return $stmt->fetchAll();
    }

    public function countAll(): int {
        return (int)$this->pdo->query("SELECT COUNT(*) FROM ordonnances")->fetchColumn();
    }

    public function create(array $data): int {
        $stmt = $this->pdo->prepare(
            "INSERT INTO ordonnances (patient_id, consultation_id, date_ordonnance, instructions)
             VALUES (?, ?, ?, ?)"
        );
        $stmt->execute([
            $data['patient_id'],
            $data['consultation_id'] ?? null,
            $data['date_ordonnance'],
            $data['instructions'] ?? null,
        ]);
        return (int)$this->pdo->lastInsertId();
    }

    public function update(int $id, array $data): bool {
        $fields = [];
        $params = [];
        foreach (['date_ordonnance','instructions'] as $f) {
            if (array_key_exists($f, $data)) {
                $fields[] = "{$f} = ?";
                $params[] = $data[$f];
            }
        }
        if (empty($fields)) return false;
        $params[] = $id;
        $stmt = $this->pdo->prepare("UPDATE ordonnances SET " . implode(', ', $fields) . " WHERE id = ?");
        $stmt->execute($params);
        return true;
    }

    public function delete(int $id): bool {
        $stmt = $this->pdo->prepare("DELETE FROM ordonnances WHERE id = ?");
        $stmt->execute([$id]);
        return $stmt->rowCount() > 0;
    }
}

