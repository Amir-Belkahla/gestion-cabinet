<?php
class Validator {
    private array $errors = [];

    public function required(string $field, mixed $value): self {
        if ($value === null || $value === '') {
            $this->errors[$field][] = "Le champ {$field} est obligatoire.";
        }
        return $this;
    }

    public function email(string $field, mixed $value): self {
        if ($value !== null && $value !== '' && !filter_var($value, FILTER_VALIDATE_EMAIL)) {
            $this->errors[$field][] = "Le champ {$field} doit être un email valide.";
        }
        return $this;
    }

    public function minLength(string $field, mixed $value, int $min): self {
        if ($value !== null && strlen((string)$value) < $min) {
            $this->errors[$field][] = "Le champ {$field} doit contenir au moins {$min} caractères.";
        }
        return $this;
    }

    public function maxLength(string $field, mixed $value, int $max): self {
        if ($value !== null && strlen((string)$value) > $max) {
            $this->errors[$field][] = "Le champ {$field} ne doit pas dépasser {$max} caractères.";
        }
        return $this;
    }

    public function inArray(string $field, mixed $value, array $allowed): self {
        if ($value !== null && $value !== '' && !in_array($value, $allowed, true)) {
            $this->errors[$field][] = "Valeur invalide pour {$field}. Valeurs autorisées : " . implode(', ', $allowed);
        }
        return $this;
    }

    public function date(string $field, mixed $value): self {
        if ($value !== null && $value !== '') {
            $d = DateTime::createFromFormat('Y-m-d', $value);
            if (!$d || $d->format('Y-m-d') !== $value) {
                $this->errors[$field][] = "Le champ {$field} doit être une date valide (YYYY-MM-DD).";
            }
        }
        return $this;
    }

    public function time(string $field, mixed $value): self {
        if ($value !== null && $value !== '') {
            if (!preg_match('/^([01]\d|2[0-3]):[0-5]\d$/', $value)) {
                $this->errors[$field][] = "Le champ {$field} doit être une heure valide (HH:MM).";
            }
        }
        return $this;
    }

    public function integer(string $field, mixed $value): self {
        if ($value !== null && $value !== '' && !filter_var($value, FILTER_VALIDATE_INT)) {
            $this->errors[$field][] = "Le champ {$field} doit être un entier.";
        }
        return $this;
    }

    public function passes(): bool {
        return empty($this->errors);
    }

    public function getErrors(): array {
        return $this->errors;
    }

    public static function sanitizeString(mixed $value): string {
        return htmlspecialchars(trim((string)$value), ENT_QUOTES, 'UTF-8');
    }

    public static function sanitizeInt(mixed $value): ?int {
        $v = filter_var($value, FILTER_VALIDATE_INT);
        return $v === false ? null : (int)$v;
    }
}
