<?php
class DossierMedical {
    private PDO $pdo;

    public function __construct() {
        $this->pdo = Database::getInstance()->getConnection();
    }

    public function findByPatient(int $patientId): ?array {
        $stmt = $this->pdo->prepare("SELECT * FROM dossiers_medicaux WHERE patient_id = ? LIMIT 1");
        $stmt->execute([$patientId]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function createForPatient(int $patientId): void {
        $stmt = $this->pdo->prepare(
            "INSERT IGNORE INTO dossiers_medicaux (patient_id) VALUES (?)"
        );
        $stmt->execute([$patientId]);
    }

    public function update(int $patientId, string $notes): bool {
        $stmt = $this->pdo->prepare(
            "UPDATE dossiers_medicaux SET notes_generales = ? WHERE patient_id = ?"
        );
        $stmt->execute([$notes, $patientId]);
        return $stmt->rowCount() > 0;
    }
}
