<?php
class UtilisateurController {

    public static function index(array $authPayload, array $query): void {
        RoleMiddleware::handle($authPayload, ['admin']);

        $model = new Utilisateur();
        $result = $model->getAll(
            [
                'role'   => $query['role']   ?? null,
                'actif'  => isset($query['actif']) ? (int)$query['actif'] : null,
                'search' => $query['search'] ?? null,
            ],
            (int)($query['page'] ?? 1),
            (int)($query['limit'] ?? 20)
        );
        Response::success($result);
    }

    public static function show(int $id, array $authPayload): void {
        RoleMiddleware::handle($authPayload, ['admin']);
        $model = new Utilisateur();
        $user = $model->findById($id);
        if (!$user) Response::notFound('Utilisateur introuvable.');
        Response::success($user);
    }

    public static function store(array $body, array $authPayload): void {
        RoleMiddleware::handle($authPayload, ['admin']);

        $v = new Validator();
        $v->required('nom',          $body['nom'] ?? '')
          ->required('prenom',       $body['prenom'] ?? '')
          ->required('email',        $body['email'] ?? '')
          ->email(   'email',        $body['email'] ?? '')
          ->required('mot_de_passe', $body['mot_de_passe'] ?? '')
          ->minLength('mot_de_passe', $body['mot_de_passe'] ?? '', 8)
          ->required('role',         $body['role'] ?? '')
          ->inArray( 'role',         $body['role'] ?? '', ROLES);

        if (!$v->passes()) Response::error('Données invalides', 422, $v->getErrors());

        $model = new Utilisateur();
        if ($model->emailExists($body['email'])) Response::conflict('Email déjà utilisé.');

        $id = $model->create([
            'nom'          => Validator::sanitizeString($body['nom']),
            'prenom'       => Validator::sanitizeString($body['prenom']),
            'email'        => strtolower(trim($body['email'])),
            'mot_de_passe' => password_hash($body['mot_de_passe'], PASSWORD_BCRYPT),
            'role'         => $body['role'],
        ]);

        // Créer profil selon rôle
        if ($body['role'] === 'medecin') {
            $medecinModel = new Medecin();
            $medecinModel->create($id, $body['specialite'] ?? null, $body['telephone'] ?? null);
        }

        if ($body['role'] === 'patient') {
            $patientModel = new Patient();
            $patientId = $patientModel->create([
                'utilisateur_id' => $id,
                'nom'            => Validator::sanitizeString($body['nom']),
                'prenom'         => Validator::sanitizeString($body['prenom']),
                'date_naissance' => $body['date_naissance'] ?? '2000-01-01',
                'sexe'           => $body['sexe'] ?? 'M',
                'telephone'      => $body['telephone'] ?? null,
                'email'          => strtolower(trim($body['email'])),
            ]);
            $dossierModel = new DossierMedical();
            $dossierModel->createForPatient($patientId);
        }

        Logger::log($authPayload['sub'], 'create_user', 'utilisateurs', $id);
        Response::created(['id' => $id], 'Utilisateur créé.');
    }

    public static function update(int $id, array $body, array $authPayload): void {
        // Admin peut modifier n'importe qui ; un utilisateur peut modifier son propre profil
        $isSelf = $id === (int)$authPayload['sub'];
        if (!$isSelf) {
            RoleMiddleware::handle($authPayload, ['admin']);
        }

        $model = new Utilisateur();
        if (!$model->findById($id)) Response::notFound('Utilisateur introuvable.');

        if (!empty($body['email']) && $model->emailExists($body['email'], $id)) {
            Response::conflict('Email déjà utilisé.');
        }

        $data = [];
        // Un non-admin ne peut pas changer son rôle
        $editableFields = $isSelf && $authPayload['role'] !== 'admin'
            ? ['nom', 'prenom', 'email', 'telephone']
            : ['nom', 'prenom', 'email', 'role', 'actif'];

        foreach ($editableFields as $f) {
            if (array_key_exists($f, $body)) $data[$f] = $body[$f];
        }

        $model->update($id, $data);

        if (!empty($body['mot_de_passe'])) {
            $model->updatePassword($id, password_hash($body['mot_de_passe'], PASSWORD_BCRYPT));
        }

        // Mettre à jour médecin
        if (!empty($body['specialite']) || !empty($body['telephone'])) {
            $medecinModel = new Medecin();
            $medecin = $medecinModel->findByUtilisateurId($id);
            if ($medecin) {
                $medecinModel->update($medecin['id'], ['specialite' => $body['specialite'] ?? null, 'telephone' => $body['telephone'] ?? null]);
            }
        }

        Logger::log($authPayload['sub'], 'update_user', 'utilisateurs', $id);
        Response::success(null, 'Utilisateur mis à jour.');
    }

    public static function toggle(int $id, array $authPayload): void {
        RoleMiddleware::handle($authPayload, ['admin']);
        $model = new Utilisateur();
        if (!$model->findById($id)) Response::notFound('Utilisateur introuvable.');
        $model->toggleActif($id);
        Logger::log($authPayload['sub'], 'toggle_user', 'utilisateurs', $id);
        Response::success(null, 'Statut modifié.');
    }

    public static function destroy(int $id, array $authPayload): void {
        RoleMiddleware::handle($authPayload, ['admin']);
        if ($id === (int)$authPayload['sub']) Response::error('Impossible de supprimer son propre compte.');
        $model = new Utilisateur();
        if (!$model->findById($id)) Response::notFound('Utilisateur introuvable.');
        $model->delete($id);
        Logger::log($authPayload['sub'], 'delete_user', 'utilisateurs', $id);
        Response::success(null, 'Utilisateur supprimé.');
    }
}
