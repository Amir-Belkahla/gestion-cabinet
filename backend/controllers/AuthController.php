<?php
class AuthController {

    public static function register(array $body): void {
        $v = new Validator();
        $v->required('nom',          $body['nom'] ?? '')
          ->required('prenom',       $body['prenom'] ?? '')
          ->required('email',        $body['email'] ?? '')
          ->email(   'email',        $body['email'] ?? '')
          ->required('mot_de_passe', $body['mot_de_passe'] ?? '')
          ->minLength('mot_de_passe', $body['mot_de_passe'] ?? '', 8);

        if (!$v->passes()) {
            Response::error('Données invalides', 422, $v->getErrors());
        }

        $utilisateurModel = new Utilisateur();

        if ($utilisateurModel->emailExists($body['email'])) {
            Response::conflict('Cet email est déjà utilisé.');
        }

        $hash = password_hash($body['mot_de_passe'], PASSWORD_BCRYPT);
        $id   = $utilisateurModel->create([
            'nom'          => Validator::sanitizeString($body['nom']),
            'prenom'       => Validator::sanitizeString($body['prenom']),
            'email'        => strtolower(trim($body['email'])),
            'mot_de_passe' => $hash,
            'role'         => 'patient',
        ]);

        // Créer l'entrée patient
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

        // Créer dossier médical
        $dossierModel = new DossierMedical();
        $dossierModel->createForPatient($patientId);

        $accessToken  = JWTHandler::generateAccess($id, 'patient');
        $refreshToken = JWTHandler::generateRefresh($id);

        $tokenModel = new JWTToken();
        $tokenModel->store($id, $refreshToken, date('Y-m-d H:i:s', time() + JWT_REFRESH_EXPIRY));

        Logger::log($id, 'register', 'utilisateurs', $id);

        Response::created([
            'access_token'  => $accessToken,
            'refresh_token' => $refreshToken,
            'user'          => ['id' => $id, 'role' => 'patient', 'nom' => $body['nom'], 'prenom' => $body['prenom']],
        ], 'Inscription réussie');
    }

    public static function login(array $body): void {
        $v = new Validator();
        $v->required('email',        $body['email'] ?? '')
          ->email(   'email',        $body['email'] ?? '')
          ->required('mot_de_passe', $body['mot_de_passe'] ?? '');

        if (!$v->passes()) {
            Response::error('Données invalides', 422, $v->getErrors());
        }

        $utilisateurModel = new Utilisateur();
        $user = $utilisateurModel->findByEmail(strtolower(trim($body['email'])));

        if (!$user || !password_verify($body['mot_de_passe'], $user['mot_de_passe'])) {
            Response::unauthorized('Email ou mot de passe incorrect.');
        }

        if (!$user['actif']) {
            Response::forbidden('Votre compte est désactivé. Contactez l\'administrateur.');
        }

        $accessToken  = JWTHandler::generateAccess($user['id'], $user['role']);
        $refreshToken = JWTHandler::generateRefresh($user['id']);

        $tokenModel = new JWTToken();
        $tokenModel->store($user['id'], $refreshToken, date('Y-m-d H:i:s', time() + JWT_REFRESH_EXPIRY));

        Logger::log($user['id'], 'login', 'utilisateurs', $user['id']);

        Response::success([
            'access_token'  => $accessToken,
            'refresh_token' => $refreshToken,
            'user'          => [
                'id'     => $user['id'],
                'nom'    => $user['nom'],
                'prenom' => $user['prenom'],
                'email'  => $user['email'],
                'role'   => $user['role'],
            ],
        ], 'Connexion réussie');
    }

    public static function refresh(array $body): void {
        $token = $body['refresh_token'] ?? '';
        if (!$token) Response::error('Refresh token manquant.');

        $payload = JWTHandler::validate($token, JWT_SECRET);
        if (!$payload || ($payload['type'] ?? '') !== 'refresh') {
            Response::unauthorized('Refresh token invalide ou expiré.');
        }

        $tokenModel = new JWTToken();
        $stored = $tokenModel->find($token);

        if (!$stored || $stored['revoque']) {
            Response::unauthorized('Refresh token révoqué.');
        }

        $utilisateurModel = new Utilisateur();
        $user = $utilisateurModel->findById((int)$payload['sub']);
        if (!$user) Response::unauthorized('Utilisateur introuvable.');

        $newAccess = JWTHandler::generateAccess($user['id'], $user['role']);

        Response::success(['access_token' => $newAccess]);
    }

    public static function logout(array $body, array $authPayload): void {
        $token = $body['refresh_token'] ?? '';
        if ($token) {
            $tokenModel = new JWTToken();
            $tokenModel->revoke($token);
        }
        Logger::log($authPayload['sub'], 'logout', 'utilisateurs', $authPayload['sub']);
        Response::success(null, 'Déconnecté avec succès.');
    }

    public static function me(array $authPayload): void {
        $utilisateurModel = new Utilisateur();
        $user = $utilisateurModel->findById((int)$authPayload['sub']);
        if (!$user) Response::notFound('Utilisateur introuvable.');

        // Ajouter l'ID patient si rôle patient
        if ($user['role'] === 'patient') {
            $patientModel = new Patient();
            $patient = $patientModel->findByUtilisateurId($user['id']);
            if ($patient) $user['patient_id'] = $patient['id'];
        }

        // Ajouter l'ID médecin si rôle médecin
        if ($user['role'] === 'medecin') {
            $medecinModel = new Medecin();
            $medecin = $medecinModel->findByUtilisateurId($user['id']);
            if ($medecin) $user['medecin_id'] = $medecin['id'];
        }

        Response::success($user);
    }

    public static function changePassword(array $body, array $authPayload): void {
        $v = new Validator();
        $v->required('ancien_mot_de_passe',  $body['ancien_mot_de_passe']  ?? '')
          ->required('nouveau_mot_de_passe', $body['nouveau_mot_de_passe'] ?? '')
          ->minLength('nouveau_mot_de_passe', $body['nouveau_mot_de_passe'] ?? '', 6);
        if (!$v->passes()) Response::error('Données invalides', 422, $v->getErrors());

        $utilisateurModel = new Utilisateur();
        $user = $utilisateurModel->findById((int)$authPayload['sub']);
        if (!$user) Response::notFound('Utilisateur introuvable.');

        if (!password_verify($body['ancien_mot_de_passe'], $user['mot_de_passe'])) {
            Response::error('Mot de passe actuel incorrect.', 422);
        }

        $hash = password_hash($body['nouveau_mot_de_passe'], PASSWORD_BCRYPT);
        $utilisateurModel->updatePassword((int)$authPayload['sub'], $hash);
        Logger::log($authPayload['sub'], 'change_password', 'utilisateurs', $authPayload['sub']);
        Response::success(null, 'Mot de passe modifié avec succès.');
    }
}
