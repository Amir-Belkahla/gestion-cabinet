<?php
class PatientController {

    public static function index(array $authPayload, array $query): void {
        RoleMiddleware::handle($authPayload, ['admin', 'medecin', 'secretaire']);
        $model  = new Patient();
        $result = $model->getAll(
            ['search' => $query['search'] ?? null],
            (int)($query['page'] ?? 1),
            (int)($query['limit'] ?? 20)
        );
        Response::success($result);
    }

    public static function show(int $id, array $authPayload): void {
        $model   = new Patient();
        $patient = $model->findById($id);
        if (!$patient) Response::notFound('Patient introuvable.');

        // Patient : ne peut voir que son propre dossier
        if ($authPayload['role'] === 'patient') {
            $own = $model->findByUtilisateurId((int)$authPayload['sub']);
            if (!$own || $own['id'] !== $id) Response::forbidden();
        }

        Response::success($patient);
    }

    public static function store(array $body, array $authPayload): void {
        RoleMiddleware::handle($authPayload, ['admin', 'secretaire']);

        $v = new Validator();
        $v->required('nom',            $body['nom'] ?? '')
          ->required('prenom',         $body['prenom'] ?? '')
          ->required('date_naissance', $body['date_naissance'] ?? '')
          ->date(    'date_naissance', $body['date_naissance'] ?? '')
          ->required('sexe',           $body['sexe'] ?? '')
          ->inArray( 'sexe',           $body['sexe'] ?? '', ['M','F']);

        if (!$v->passes()) Response::error('Données invalides', 422, $v->getErrors());

        $model = new Patient();
        $id    = $model->create([
            'nom'            => Validator::sanitizeString($body['nom']),
            'prenom'         => Validator::sanitizeString($body['prenom']),
            'date_naissance' => $body['date_naissance'],
            'sexe'           => $body['sexe'],
            'telephone'      => $body['telephone'] ?? null,
            'adresse'        => $body['adresse'] ?? null,
            'email'          => $body['email'] ?? null,
            'groupe_sanguin' => $body['groupe_sanguin'] ?? null,
            'allergies'      => $body['allergies'] ?? null,
            'antecedents'    => $body['antecedents'] ?? null,
        ]);

        $dossierModel = new DossierMedical();
        $dossierModel->createForPatient($id);

        Logger::log($authPayload['sub'], 'create_patient', 'patients', $id);
        Response::created(['id' => $id], 'Patient ajouté.');
    }

    public static function update(int $id, array $body, array $authPayload): void {
        RoleMiddleware::handle($authPayload, ['admin', 'secretaire']);
        $model = new Patient();
        if (!$model->findById($id)) Response::notFound('Patient introuvable.');
        $model->update($id, $body);
        Logger::log($authPayload['sub'], 'update_patient', 'patients', $id);
        Response::success(null, 'Patient mis à jour.');
    }

    public static function destroy(int $id, array $authPayload): void {
        RoleMiddleware::handle($authPayload, ['admin']);
        $model = new Patient();
        if (!$model->findById($id)) Response::notFound('Patient introuvable.');
        $model->delete($id);
        Logger::log($authPayload['sub'], 'delete_patient', 'patients', $id);
        Response::success(null, 'Patient supprimé.');
    }
}
