<?php
class OrdonnanceMedicament {
    private PDO $pdo;

    public function __construct() {
        $this->pdo = Database::getInstance()->getConnection();
    }

    public function getByOrdonnance(int $ordonnanceId): array {
        $stmt = $this->pdo->prepare(
            "SELECT *, nom_medicament AS medicament_nom FROM ordonnance_medicaments WHERE ordonnance_id = ?"
        );
        $stmt->execute([$ordonnanceId]);
        return $stmt->fetchAll();
    }

    public function create(array $data): int {
        $stmt = $this->pdo->prepare(
            "INSERT INTO ordonnance_medicaments (ordonnance_id, nom_medicament, dosage, frequence, duree, instructions)
             VALUES (?, ?, ?, ?, ?, ?)"
        );
        $stmt->execute([
            $data['ordonnance_id'],
            $data['nom_medicament'],
            $data['dosage'] ?? null,
            $data['frequence'] ?? null,
            $data['duree'] ?? null,
            $data['instructions'] ?? null,
        ]);
        return (int)$this->pdo->lastInsertId();
    }

    public function deleteByOrdonnance(int $ordonnanceId): void {
        $stmt = $this->pdo->prepare("DELETE FROM ordonnance_medicaments WHERE ordonnance_id = ?");
        $stmt->execute([$ordonnanceId]);
    }

    public function delete(int $id): bool {
        $stmt = $this->pdo->prepare("DELETE FROM ordonnance_medicaments WHERE id = ?");
        $stmt->execute([$id]);
        return $stmt->rowCount() > 0;
    }
}
