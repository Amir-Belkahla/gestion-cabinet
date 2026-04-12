<?php
class ConsultationController {

    public static function index(array $authPayload, array $query): void {
        RoleMiddleware::handle($authPayload, ['admin', 'medecin']);
        $model = new Consultation();
        $filters = [];
        if ($authPayload['role'] === 'medecin') {
            $medecinModel = new Medecin();
            $medecin = $medecinModel->findByUtilisateurId((int)$authPayload['sub']);
            if ($medecin) $filters['medecin_id'] = $medecin['id'];
        }
        if (!empty($query['patient_id'])) $filters['patient_id'] = (int)$query['patient_id'];
        Response::success($model->getAll($filters, (int)($query['page'] ?? 1), (int)($query['limit'] ?? 20)));
    }

    public static function show(int $id, array $authPayload): void {
        $model = new Consultation();
        $consult = $model->findById($id);
        if (!$consult) Response::notFound('Consultation introuvable.');

        if ($authPayload['role'] === 'patient') {
            $patientModel = new Patient();
            $own = $patientModel->findByUtilisateurId((int)$authPayload['sub']);
            if (!$own || $own['id'] !== (int)$consult['patient_id']) Response::forbidden();
        }

        Response::success($consult);
    }

    public static function byPatient(int $patientId, array $authPayload): void {
        if ($authPayload['role'] === 'patient') {
            $own = (new Patient())->findByUtilisateurId((int)$authPayload['sub']);
            if (!$own || $own['id'] !== $patientId) Response::forbidden();
        } else {
            RoleMiddleware::handle($authPayload, ['admin', 'medecin']);
        }
        $model = new Consultation();
        Response::success($model->getByPatient($patientId));
    }

    public static function store(array $body, array $authPayload): void {
        RoleMiddleware::handle($authPayload, ['medecin']);

        $medecinModel = new Medecin();
        $medecin = $medecinModel->findByUtilisateurId((int)$authPayload['sub']);
        if (!$medecin) Response::forbidden('Profil médecin introuvable.');

        $v = new Validator();
        $v->required('patient_id',         $body['patient_id'] ?? '')
          ->required('date_consultation',   $body['date_consultation'] ?? '');
        if (!$v->passes()) Response::error('Données invalides', 422, $v->getErrors());

        $model = new Consultation();
        $id = $model->create([
            'rendez_vous_id'   => $body['rendez_vous_id'] ?? null,
            'patient_id'       => (int)$body['patient_id'],
            'medecin_id'       => $medecin['id'],
            'date_consultation'=> $body['date_consultation'],
            'symptomes'        => $body['symptomes'] ?? null,
            'diagnostic'       => $body['diagnostic'] ?? null,
            'notes'            => $body['notes'] ?? null,
        ]);

        // Marquer le RDV comme terminé
        if (!empty($body['rendez_vous_id'])) {
            $rdvModel = new RendezVous();
            $rdvModel->updateStatut((int)$body['rendez_vous_id'], 'termine');
        }

        // Créer/vérifier le dossier médical
        $dossierModel = new DossierMedical();
        $dossierModel->createForPatient((int)$body['patient_id']);

        Logger::log($authPayload['sub'], 'create_consultation', 'consultations', $id);
        Response::created(['id' => $id], 'Consultation enregistrée.');
    }

    public static function update(int $id, array $body, array $authPayload): void {
        RoleMiddleware::handle($authPayload, ['medecin']);
        $model = new Consultation();
        if (!$model->findById($id)) Response::notFound('Consultation introuvable.');
        $model->update($id, $body);
        Logger::log($authPayload['sub'], 'update_consultation', 'consultations', $id);
        Response::success(null, 'Consultation mise à jour.');
    }

    public static function destroy(int $id, array $authPayload): void {
        RoleMiddleware::handle($authPayload, ['admin']);
        $model = new Consultation();
        if (!$model->findById($id)) Response::notFound('Consultation introuvable.');
        $model->delete($id);
        Logger::log($authPayload['sub'], 'delete_consultation', 'consultations', $id);
        Response::success(null, 'Consultation supprimée.');
    }
}
