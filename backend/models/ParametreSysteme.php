<?php
class ParametreSysteme {
    private PDO $pdo;

    public function __construct() {
        $this->pdo = Database::getInstance()->getConnection();
    }

    public function getAll(): array {
        return $this->pdo->query("SELECT * FROM parametres_systeme ORDER BY cle")->fetchAll();
    }

    public function getByKey(string $cle): ?array {
        $stmt = $this->pdo->prepare("SELECT * FROM parametres_systeme WHERE cle = ? LIMIT 1");
        $stmt->execute([$cle]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function getValue(string $cle, mixed $default = null): mixed {
        $row = $this->getByKey($cle);
        return $row ? $row['valeur'] : $default;
    }

    public function update(string $cle, string $valeur): bool {
        $stmt = $this->pdo->prepare("UPDATE parametres_systeme SET valeur = ? WHERE cle = ?");
        $stmt->execute([$valeur, $cle]);
        return $stmt->rowCount() > 0;
    }
}
