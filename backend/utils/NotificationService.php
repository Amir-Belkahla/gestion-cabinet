<?php
class NotificationService {

    private static function create(int $utilisateurId, string $type, string $titre, string $message, ?int $refId = null): void {
        try {
            $pdo  = Database::getInstance()->getConnection();
            $stmt = $pdo->prepare(
                "INSERT INTO notifications (utilisateur_id, type, titre, message, reference_id)
                 VALUES (?, ?, ?, ?, ?)"
            );
            $stmt->execute([$utilisateurId, $type, $titre, $message, $refId]);
        } catch (Exception) {}
    }

    public static function confirmationRDV(int $rdvId): void {
        try {
            $pdo  = Database::getInstance()->getConnection();
            $stmt = $pdo->prepare(
                "SELECT rv.*, CONCAT(p.nom,' ',p.prenom) AS patient_nom,
                        CONCAT(u.nom,' ',u.prenom) AS medecin_nom,
                        pat.utilisateur_id
                 FROM rendez_vous rv
                 JOIN patients p ON rv.patient_id = p.id
                 JOIN medecins m ON rv.medecin_id = m.id
                 JOIN utilisateurs u ON m.utilisateur_id = u.id
                 LEFT JOIN patients pat ON rv.patient_id = pat.id
                 WHERE rv.id = ?"
            );
            $stmt->execute([$rdvId]);
            $rdv = $stmt->fetch();
            if (!$rdv || !$rdv['utilisateur_id']) return;

            self::create(
                $rdv['utilisateur_id'],
                'confirmation_rdv',
                'Rendez-vous confirmé',
                "Votre RDV le {$rdv['date_rdv']} à {$rdv['heure_debut']} avec Dr {$rdv['medecin_nom']} est confirmé.",
                $rdvId
            );
        } catch (Exception) {}
    }

    public static function annulationRDV(int $rdvId): void {
        try {
            $pdo  = Database::getInstance()->getConnection();
            $stmt = $pdo->prepare(
                "SELECT rv.*, pat.utilisateur_id,
                        CONCAT(u.nom,' ',u.prenom) AS medecin_nom
                 FROM rendez_vous rv
                 JOIN patients pat ON rv.patient_id = pat.id
                 JOIN medecins m ON rv.medecin_id = m.id
                 JOIN utilisateurs u ON m.utilisateur_id = u.id
                 WHERE rv.id = ?"
            );
            $stmt->execute([$rdvId]);
            $rdv = $stmt->fetch();
            if (!$rdv || !$rdv['utilisateur_id']) return;

            self::create(
                $rdv['utilisateur_id'],
                'annulation_rdv',
                'Rendez-vous annulé',
                "Votre RDV du {$rdv['date_rdv']} à {$rdv['heure_debut']} avec Dr {$rdv['medecin_nom']} a été annulé.",
                $rdvId
            );
        } catch (Exception) {}
    }

    public static function general(int $utilisateurId, string $titre, string $message): void {
        self::create($utilisateurId, 'general', $titre, $message);
    }
}
