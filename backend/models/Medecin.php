<?php
class Medecin {
    private PDO $pdo;

    public function __construct() {
        $this->pdo = Database::getInstance()->getConnection();
    }

    public function getAll(): array {
        $stmt = $this->pdo->query(
            "SELECT m.*, CONCAT(u.nom,' ',u.prenom) AS nom_complet, u.email
             FROM medecins m
             JOIN utilisateurs u ON m.utilisateur_id = u.id
             WHERE u.actif = 1
             ORDER BY u.nom"
        );
        return $stmt->fetchAll();
    }

    public function findById(int $id): ?array {
        $stmt = $this->pdo->prepare(
            "SELECT m.*, CONCAT(u.nom,' ',u.prenom) AS nom_complet, u.email, u.nom, u.prenom
             FROM medecins m
             JOIN utilisateurs u ON m.utilisateur_id = u.id
             WHERE m.id = ? LIMIT 1"
        );
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function findByUtilisateurId(int $utilisateurId): ?array {
        $stmt = $this->pdo->prepare("SELECT * FROM medecins WHERE utilisateur_id = ? LIMIT 1");
        $stmt->execute([$utilisateurId]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function create(int $utilisateurId, ?string $specialite, ?string $telephone): int {
        $stmt = $this->pdo->prepare(
            "INSERT INTO medecins (utilisateur_id, specialite, telephone) VALUES (?, ?, ?)"
        );
        $stmt->execute([$utilisateurId, $specialite, $telephone]);
        return (int)$this->pdo->lastInsertId();
    }

    public function update(int $id, array $data): bool {
        $fields = [];
        $params = [];
        foreach (['specialite','telephone'] as $f) {
            if (array_key_exists($f, $data)) {
                $fields[] = "{$f} = ?";
                $params[] = $data[$f];
            }
        }
        if (empty($fields)) return false;
        $params[] = $id;
        $stmt = $this->pdo->prepare("UPDATE medecins SET " . implode(', ', $fields) . " WHERE id = ?");
        $stmt->execute($params);
        return true;
    }
}
