<?php
class JWTToken {
    private PDO $pdo;

    public function __construct() {
        $this->pdo = Database::getInstance()->getConnection();
    }

    public function store(int $utilisateurId, string $token, string $expireAt): void {
        $stmt = $this->pdo->prepare(
            "INSERT INTO jwt_tokens (utilisateur_id, token, expire_at) VALUES (?, ?, ?)"
        );
        $stmt->execute([$utilisateurId, $token, $expireAt]);
    }

    public function find(string $token): ?array {
        $stmt = $this->pdo->prepare(
            "SELECT * FROM jwt_tokens WHERE token = ? LIMIT 1"
        );
        $stmt->execute([$token]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function revoke(string $token): void {
        $stmt = $this->pdo->prepare("UPDATE jwt_tokens SET revoque = 1 WHERE token = ?");
        $stmt->execute([$token]);
    }

    public function revokeAll(int $utilisateurId): void {
        $stmt = $this->pdo->prepare("UPDATE jwt_tokens SET revoque = 1 WHERE utilisateur_id = ?");
        $stmt->execute([$utilisateurId]);
    }

    public function deleteExpired(): void {
        $this->pdo->exec("DELETE FROM jwt_tokens WHERE expire_at < NOW()");
    }
}
