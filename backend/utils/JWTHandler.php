<?php
class JWTHandler {

    private static function b64Encode(string $data): string {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private static function b64Decode(string $data): string {
        $pad = strlen($data) % 4;
        if ($pad) $data .= str_repeat('=', 4 - $pad);
        return base64_decode(strtr($data, '-_', '+/'));
    }

    public static function generate(array $payload, string $secret, int $expiry = JWT_ACCESS_EXPIRY): string {
        $header  = self::b64Encode(json_encode(['typ' => 'JWT', 'alg' => 'HS256']));
        $payload['iat'] = time();
        $payload['exp'] = time() + $expiry;
        $payloadEnc = self::b64Encode(json_encode($payload));
        $sig = self::b64Encode(hash_hmac('sha256', "{$header}.{$payloadEnc}", $secret, true));
        return "{$header}.{$payloadEnc}.{$sig}";
    }

    public static function validate(string $token, string $secret): array|false {
        $parts = explode('.', $token);
        if (count($parts) !== 3) return false;

        [$header, $payload, $sig] = $parts;
        $expected = self::b64Encode(hash_hmac('sha256', "{$header}.{$payload}", $secret, true));
        if (!hash_equals($expected, $sig)) return false;

        $data = json_decode(self::b64Decode($payload), true);
        if (!$data || !isset($data['exp']) || $data['exp'] < time()) return false;

        return $data;
    }

    public static function decode(string $token): ?array {
        $parts = explode('.', $token);
        if (count($parts) !== 3) return null;
        $data = json_decode(self::b64Decode($parts[1]), true);
        return is_array($data) ? $data : null;
    }

    public static function generateAccess(int $userId, string $role): string {
        return self::generate(['sub' => $userId, 'role' => $role], JWT_SECRET, JWT_ACCESS_EXPIRY);
    }

    public static function generateRefresh(int $userId): string {
        return self::generate(['sub' => $userId, 'type' => 'refresh'], JWT_SECRET, JWT_REFRESH_EXPIRY);
    }
}
