<?php
class AdminController {

    public static function stats(array $authPayload): void {
        RoleMiddleware::handle($authPayload, ['admin']);
        $pdo = Database::getInstance()->getConnection();
        $row = $pdo->query("SELECT * FROM vue_stats_admin LIMIT 1")->fetch();
        Response::success($row);
    }

    public static function logs(array $authPayload, array $query): void {
        RoleMiddleware::handle($authPayload, ['admin']);
        $model = new LogSysteme();
        Response::success($model->getAll(
            ['utilisateur_id' => $query['utilisateur_id'] ?? null, 'action' => $query['action'] ?? null, 'date' => $query['date'] ?? null],
            (int)($query['page'] ?? 1),
            (int)($query['limit'] ?? 30)
        ));
    }

    public static function parametres(array $authPayload): void {
        RoleMiddleware::handle($authPayload, ['admin']);
        Response::success((new ParametreSysteme())->getAll());
    }

    public static function updateParametre(string $cle, array $body, array $authPayload): void {
        RoleMiddleware::handle($authPayload, ['admin']);
        $model = new ParametreSysteme();
        if (!$model->getByKey($cle)) Response::notFound('Paramètre introuvable.');
        $model->update($cle, $body['valeur'] ?? '');
        Logger::log($authPayload['sub'], 'update_parametre', 'parametres_systeme', null, "cle={$cle}");
        Response::success(null, 'Paramètre mis à jour.');
    }
}
