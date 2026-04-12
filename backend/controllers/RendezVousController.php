<?php
class RendezVousController {

    public static function index(array $authPayload, array $query): void {
        RoleMiddleware::handle($authPayload, ['admin', 'medecin', 'secretaire']);
        $model = new RendezVous();
        $filters = [
            'medecin_id' => $query['medecin_id'] ?? null,
            'patient_id' => $query['patient_id'] ?? null,
            'date'       => $query['date'] ?? null,
            'statut'     => $query['statut'] ?? null,
        ];
        Response::success($model->getAll($filters, (int)($query['page'] ?? 1), (int)($query['limit'] ?? 20)));
    }

    public static function show(int $id, array $authPayload): void {
        $model = new RendezVous();
        $rdv   = $model->findById($id);
        if (!$rdv) Response::notFound('Rendez-vous introuvable.');

        if ($authPayload['role'] === 'patient') {
            $patientModel = new Patient();
            $own = $patientModel->findByUtilisateurId((int)$authPayload['sub']);
            if (!$own || $own['id'] !== (int)$rdv['patient_id']) Response::forbidden();
        }

        Response::success($rdv);
    }

    public static function planning(int $medecinId, array $query): void {
        $date  = $query['date'] ?? date('Y-m-d');
        $model = new RendezVous();
        Response::success($model->getPlanning($medecinId, $date));
    }

    public static function mesRdv(array $authPayload): void {
        RoleMiddleware::handle($authPayload, ['patient']);
        $patientModel = new Patient();
        $patient = $patientModel->findByUtilisateurId((int)$authPayload['sub']);
        if (!$patient) Response::notFound('Profil patient introuvable.');
        $model = new RendezVous();
        Response::success($model->getByPatient($patient['id']));
    }

    public static function store(array $body, array $authPayload): void {
        RoleMiddleware::handle($authPayload, ['admin', 'secretaire', 'patient']);

        $v = new Validator();
        // patient_id non requis pour le rôle patient (auto-rempli depuis le profil)
        if ($authPayload['role'] !== 'patient') {
            $v->required('patient_id', $body['patient_id'] ?? '');
        }
        $v->required('medecin_id',   $body['medecin_id'] ?? '')
          ->required('date_rdv',     $body['date_rdv'] ?? '')
          ->date(    'date_rdv',     $body['date_rdv'] ?? '')
          ->required('heure_debut',  $body['heure_debut'] ?? '')
          ->time(    'heure_debut',  $body['heure_debut'] ?? '')
          ->required('heure_fin',    $body['heure_fin'] ?? '')
          ->time(    'heure_fin',    $body['heure_fin'] ?? '');

        if (!$v->passes()) Response::error('Données invalides', 422, $v->getErrors());

        // Si patient, forcer son propre patient_id
        if ($authPayload['role'] === 'patient') {
            $patientModel = new Patient();
            $own = $patientModel->findByUtilisateurId((int)$authPayload['sub']);
            if (!$own) Response::notFound('Profil patient introuvable.');
            $body['patient_id'] = $own['id'];
        }

        $model = new RendezVous();

        // Vérifier disponibilité
        if (!$model->checkDisponibilite(
            (int)$body['medecin_id'],
            $body['date_rdv'],
            $body['heure_debut'],
            $body['heure_fin']
        )) {
            Response::conflict('Ce créneau est déjà occupé.');
        }

        // Vérifier horaires cabinet
        $params = new ParametreSysteme();
        $ouverture  = $params->getValue('heure_ouverture', '08:00');
        $fermeture  = $params->getValue('heure_fermeture', '18:00');

        if ($body['heure_debut'] < $ouverture || $body['heure_fin'] > $fermeture) {
            Response::error("Le RDV doit être entre {$ouverture} et {$fermeture}.");
        }

        $id = $model->create([
            'patient_id'  => (int)$body['patient_id'],
            'medecin_id'  => (int)$body['medecin_id'],
            'date_rdv'    => $body['date_rdv'],
            'heure_debut' => $body['heure_debut'],
            'heure_fin'   => $body['heure_fin'],
            'motif'       => $body['motif'] ?? null,
            'statut'      => 'planifie',
            'notes'       => $body['notes'] ?? null,
        ]);

        NotificationService::confirmationRDV($id);
        Logger::log($authPayload['sub'], 'create_rdv', 'rendez_vous', $id);

        Response::created(['id' => $id], 'Rendez-vous créé.');
    }

    public static function update(int $id, array $body, array $authPayload): void {
        RoleMiddleware::handle($authPayload, ['admin', 'secretaire']);
        $model = new RendezVous();
        $rdv   = $model->findById($id);
        if (!$rdv) Response::notFound('Rendez-vous introuvable.');

        // Vérifier disponibilité si changement d'horaire
        if (!empty($body['heure_debut']) || !empty($body['heure_fin'])) {
            $heureDebut = $body['heure_debut'] ?? $rdv['heure_debut'];
            $heureFin   = $body['heure_fin']   ?? $rdv['heure_fin'];
            $medecinId  = $body['medecin_id']  ?? $rdv['medecin_id'];
            $dateRdv    = $body['date_rdv']    ?? $rdv['date_rdv'];

            if (!$model->checkDisponibilite((int)$medecinId, $dateRdv, $heureDebut, $heureFin, $id)) {
                Response::conflict('Ce créneau est déjà occupé.');
            }
        }

        $model->update($id, $body);
        Logger::log($authPayload['sub'], 'update_rdv', 'rendez_vous', $id);
        Response::success(null, 'Rendez-vous mis à jour.');
    }

    public static function annuler(int $id, array $authPayload): void {
        $model = new RendezVous();
        $rdv   = $model->findById($id);
        if (!$rdv) Response::notFound('Rendez-vous introuvable.');

        if ($authPayload['role'] === 'patient') {
            $patientModel = new Patient();
            $own = $patientModel->findByUtilisateurId((int)$authPayload['sub']);
            if (!$own || $own['id'] !== (int)$rdv['patient_id']) Response::forbidden();
        } else {
            RoleMiddleware::handle($authPayload, ['admin', 'secretaire', 'patient']);
        }

        $model->updateStatut($id, 'annule');
        NotificationService::annulationRDV($id);
        Logger::log($authPayload['sub'], 'annuler_rdv', 'rendez_vous', $id);
        Response::success(null, 'Rendez-vous annulé.');
    }

    public static function confirmer(int $id, array $authPayload): void {
        RoleMiddleware::handle($authPayload, ['admin', 'secretaire']);
        $model = new RendezVous();
        if (!$model->findById($id)) Response::notFound('Rendez-vous introuvable.');
        $model->updateStatut($id, 'confirme');
        Logger::log($authPayload['sub'], 'confirmer_rdv', 'rendez_vous', $id);
        Response::success(null, 'Rendez-vous confirmé.');
    }

    public static function terminer(int $id, array $authPayload): void {
        RoleMiddleware::handle($authPayload, ['admin', 'medecin']);
        $model = new RendezVous();
        if (!$model->findById($id)) Response::notFound('Rendez-vous introuvable.');
        $model->updateStatut($id, 'termine');
        Logger::log($authPayload['sub'], 'terminer_rdv', 'rendez_vous', $id);
        Response::success(null, 'Rendez-vous marqué comme terminé.');
    }

    public static function destroy(int $id, array $authPayload): void {
        RoleMiddleware::handle($authPayload, ['admin']);
        $model = new RendezVous();
        if (!$model->findById($id)) Response::notFound('Rendez-vous introuvable.');
        $model->delete($id);
        Logger::log($authPayload['sub'], 'delete_rdv', 'rendez_vous', $id);
        Response::success(null, 'Rendez-vous supprimé.');
    }
}
