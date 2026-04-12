<?php
class RendezVous {
    private PDO $pdo;

    public function __construct() {
        $this->pdo = Database::getInstance()->getConnection();
    }

    public function getAll(array $filters = [], int $page = 1, int $limit = 20): array {
        $where  = ['1=1'];
        $params = [];

        if (!empty($filters['medecin_id'])) {
            $where[]  = 'rv.medecin_id = ?';
            $params[] = $filters['medecin_id'];
        }
        if (!empty($filters['patient_id'])) {
            $where[]  = 'rv.patient_id = ?';
            $params[] = $filters['patient_id'];
        }
        if (!empty($filters['date'])) {
            $where[]  = 'rv.date_rdv = ?';
            $params[] = $filters['date'];
        }
        if (!empty($filters['statut'])) {
            $where[]  = 'rv.statut = ?';
            $params[] = $filters['statut'];
        }

        $offset = ($page - 1) * $limit;
        $sql = "SELECT rv.*,
                       CONCAT(p.nom,' ',p.prenom) AS patient_nom,
                       p.telephone AS patient_tel,
                       CONCAT(u.nom,' ',u.prenom) AS medecin_nom,
                       m.specialite
                FROM rendez_vous rv
                JOIN patients p ON rv.patient_id = p.id
                JOIN medecins m ON rv.medecin_id = m.id
                JOIN utilisateurs u ON m.utilisateur_id = u.id
                WHERE " . implode(' AND ', $where) . "
                ORDER BY rv.date_rdv DESC, rv.heure_debut DESC
                LIMIT {$limit} OFFSET {$offset}";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll();

        $countStmt = $this->pdo->prepare(
            "SELECT COUNT(*) FROM rendez_vous rv
             JOIN patients p ON rv.patient_id = p.id
             JOIN medecins m ON rv.medecin_id = m.id
             JOIN utilisateurs u ON m.utilisateur_id = u.id
             WHERE " . implode(' AND ', $where)
        );
        $countStmt->execute($params);
        $total = (int)$countStmt->fetchColumn();

        return ['data' => $rows, 'total' => $total, 'page' => $page, 'limit' => $limit];
    }

    public function findById(int $id): ?array {
        $stmt = $this->pdo->prepare(
            "SELECT rv.*,
                    CONCAT(p.nom,' ',p.prenom) AS patient_nom,
                    p.telephone AS patient_tel,
                    CONCAT(u.nom,' ',u.prenom) AS medecin_nom,
                    m.specialite
             FROM rendez_vous rv
             JOIN patients p ON rv.patient_id = p.id
             JOIN medecins m ON rv.medecin_id = m.id
             JOIN utilisateurs u ON m.utilisateur_id = u.id
             WHERE rv.id = ? LIMIT 1"
        );
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function getByPatient(int $patientId): array {
        $stmt = $this->pdo->prepare(
            "SELECT rv.*,
                    CONCAT(u.nom,' ',u.prenom) AS medecin_nom,
                    m.specialite
             FROM rendez_vous rv
             JOIN medecins m ON rv.medecin_id = m.id
             JOIN utilisateurs u ON m.utilisateur_id = u.id
             WHERE rv.patient_id = ?
             ORDER BY rv.date_rdv DESC, rv.heure_debut DESC"
        );
        $stmt->execute([$patientId]);
        return $stmt->fetchAll();
    }

    public function getPlanning(int $medecinId, string $date): array {
        $stmt = $this->pdo->prepare(
            "SELECT rv.*,
                    CONCAT(p.nom,' ',p.prenom) AS patient_nom,
                    p.telephone AS patient_tel
             FROM rendez_vous rv
             JOIN patients p ON rv.patient_id = p.id
             WHERE rv.medecin_id = ? AND rv.date_rdv = ?
             ORDER BY rv.heure_debut"
        );
        $stmt->execute([$medecinId, $date]);
        return $stmt->fetchAll();
    }

    public function checkDisponibilite(int $medecinId, string $date, string $heureDebut, string $heureFin, ?int $excludeId = null): bool {
        $sql = "SELECT COUNT(*) FROM rendez_vous
                WHERE medecin_id = ? AND date_rdv = ?
                AND statut NOT IN ('annule')
                AND heure_debut < ? AND heure_fin > ?";
        $params = [$medecinId, $date, $heureFin, $heureDebut];
        if ($excludeId) {
            $sql .= " AND id != ?";
            $params[] = $excludeId;
        }
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return (int)$stmt->fetchColumn() === 0; // true = disponible
    }

    public function create(array $data): int {
        $stmt = $this->pdo->prepare(
            "INSERT INTO rendez_vous (patient_id, medecin_id, date_rdv, heure_debut, heure_fin, motif, statut, notes)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
        );
        $stmt->execute([
            $data['patient_id'],
            $data['medecin_id'],
            $data['date_rdv'],
            $data['heure_debut'],
            $data['heure_fin'],
            $data['motif'] ?? null,
            $data['statut'] ?? 'planifie',
            $data['notes'] ?? null,
        ]);
        return (int)$this->pdo->lastInsertId();
    }

    public function update(int $id, array $data): bool {
        $fields = [];
        $params = [];
        $updatable = ['patient_id','medecin_id','date_rdv','heure_debut','heure_fin','motif','statut','notes'];
        foreach ($updatable as $f) {
            if (array_key_exists($f, $data)) {
                $fields[] = "{$f} = ?";
                $params[] = $data[$f];
            }
        }
        if (empty($fields)) return false;
        $params[] = $id;
        $stmt = $this->pdo->prepare("UPDATE rendez_vous SET " . implode(', ', $fields) . " WHERE id = ?");
        $stmt->execute($params);
        return true;
    }

    public function updateStatut(int $id, string $statut): bool {
        $stmt = $this->pdo->prepare("UPDATE rendez_vous SET statut = ? WHERE id = ?");
        $stmt->execute([$statut, $id]);
        return $stmt->rowCount() > 0;
    }

    public function delete(int $id): bool {
        $stmt = $this->pdo->prepare("DELETE FROM rendez_vous WHERE id = ?");
        $stmt->execute([$id]);
        return $stmt->rowCount() > 0;
    }
}
