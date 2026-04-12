<?php
class DossierMedicalController {

    public static function show(int $patientId, array $authPayload): void {
        // Patient : uniquement son dossier
        if ($authPayload['role'] === 'patient') {
            $own = (new Patient())->findByUtilisateurId((int)$authPayload['sub']);
            if (!$own || $own['id'] !== $patientId) Response::forbidden();
        } else {
            RoleMiddleware::handle($authPayload, ['admin', 'medecin']);
        }

        $patient = (new Patient())->findById($patientId);
        if (!$patient) Response::notFound('Patient introuvable.');

        $dossier      = (new DossierMedical())->findByPatient($patientId);
        $consultations = (new Consultation())->getByPatient($patientId);
        $ordonnances   = (new Ordonnance())->getByPatient($patientId);
        $rdvs          = (new RendezVous())->getByPatient($patientId);

        foreach ($ordonnances as &$ordo) {
            $ordo['medicaments'] = (new OrdonnanceMedicament())->getByOrdonnance($ordo['id']);
        }

        Response::success([
            'patient'       => $patient,
            'dossier'       => $dossier,
            'consultations' => $consultations,
            'ordonnances'   => $ordonnances,
            'rendez_vous'   => $rdvs,
        ]);
    }

    public static function update(int $patientId, array $body, array $authPayload): void {
        RoleMiddleware::handle($authPayload, ['medecin']);
        $dossierModel = new DossierMedical();
        $dossierModel->createForPatient($patientId); // S'assurer qu'il existe
        $dossierModel->update($patientId, $body['notes_generales'] ?? '');
        Logger::log($authPayload['sub'], 'update_dossier', 'dossiers_medicaux', $patientId);
        Response::success(null, 'Dossier mis à jour.');
    }
}
