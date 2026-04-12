<?php
class OrdonnanceController {

    public static function show(int $id, array $authPayload): void {
        $ordoModel = new Ordonnance();
        $ordo = $ordoModel->findById($id);
        if (!$ordo) Response::notFound('Ordonnance introuvable.');

        if ($authPayload['role'] === 'patient') {
            $own = (new Patient())->findByUtilisateurId((int)$authPayload['sub']);
            if (!$own || $own['id'] !== (int)$ordo['patient_id']) Response::forbidden();
        }

        $ordo['medicaments'] = (new OrdonnanceMedicament())->getByOrdonnance($id);
        Response::success($ordo);
    }

    public static function byConsultation(int $consultationId, array $authPayload): void {
        RoleMiddleware::handle($authPayload, ['admin', 'medecin']);
        $ordos = (new Ordonnance())->getByConsultation($consultationId);
        foreach ($ordos as &$ordo) {
            $ordo['medicaments'] = (new OrdonnanceMedicament())->getByOrdonnance($ordo['id']);
        }
        Response::success($ordos);
    }

    public static function byPatient(int $patientId, array $authPayload): void {
        if ($authPayload['role'] === 'patient') {
            $own = (new Patient())->findByUtilisateurId((int)$authPayload['sub']);
            if (!$own || $own['id'] !== $patientId) Response::forbidden();
        } else {
            RoleMiddleware::handle($authPayload, ['admin', 'medecin']);
        }
        $ordos = (new Ordonnance())->getByPatient($patientId);
        foreach ($ordos as &$ordo) {
            $ordo['medicaments'] = (new OrdonnanceMedicament())->getByOrdonnance($ordo['id']);
        }
        Response::success($ordos);
    }

    public static function store(array $body, array $authPayload): void {
        RoleMiddleware::handle($authPayload, ['medecin']);

        $v = new Validator();
        $v->required('patient_id',      $body['patient_id']     ?? '')
          ->required('date_ordonnance',  $body['date_ordonnance'] ?? '')
          ->date(    'date_ordonnance',  $body['date_ordonnance'] ?? '');
        if (!$v->passes()) Response::error('Données invalides', 422, $v->getErrors());

        $ordoModel = new Ordonnance();
        $id = $ordoModel->create([
            'patient_id'      => (int)$body['patient_id'],
            'consultation_id' => !empty($body['consultation_id']) ? (int)$body['consultation_id'] : null,
            'date_ordonnance' => $body['date_ordonnance'],
            'instructions'    => $body['instructions'] ?? null,
        ]);

        $medModel = new OrdonnanceMedicament();
        foreach (($body['medicaments'] ?? []) as $med) {
            $nom = $med['nom_medicament'] ?? $med['medicament_nom'] ?? '';
            if (!empty($nom)) {
                $medModel->create([
                    'ordonnance_id'  => $id,
                    'nom_medicament' => $nom,
                    'dosage'         => $med['dosage'] ?? null,
                    'frequence'      => $med['frequence'] ?? null,
                    'duree'          => $med['duree'] ?? null,
                    'instructions'   => $med['instructions'] ?? null,
                ]);
            }
        }

        Logger::log($authPayload['sub'], 'create_ordonnance', 'ordonnances', $id);
        Response::created(['id' => $id], 'Ordonnance créée.');
    }

    public static function update(int $id, array $body, array $authPayload): void {
        RoleMiddleware::handle($authPayload, ['medecin']);
        $ordoModel = new Ordonnance();
        if (!$ordoModel->findById($id)) Response::notFound('Ordonnance introuvable.');
        $ordoModel->update($id, $body);

        // Remplacer les médicaments si fournis
        if (isset($body['medicaments'])) {
            $medModel = new OrdonnanceMedicament();
            $medModel->deleteByOrdonnance($id);
            foreach ($body['medicaments'] as $med) {
                $nom = $med['nom_medicament'] ?? $med['medicament_nom'] ?? '';
                if (!empty($nom)) {
                    $medModel->create(array_merge($med, ['ordonnance_id' => $id, 'nom_medicament' => $nom]));
                }
            }
        }

        Logger::log($authPayload['sub'], 'update_ordonnance', 'ordonnances', $id);
        Response::success(null, 'Ordonnance mise à jour.');
    }

    public static function destroy(int $id, array $authPayload): void {
        RoleMiddleware::handle($authPayload, ['admin', 'medecin']);
        $ordoModel = new Ordonnance();
        if (!$ordoModel->findById($id)) Response::notFound('Ordonnance introuvable.');
        $ordoModel->delete($id);
        Logger::log($authPayload['sub'], 'delete_ordonnance', 'ordonnances', $id);
        Response::success(null, 'Ordonnance supprimée.');
    }
}
