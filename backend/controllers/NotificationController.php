<?php
class NotificationController {

    public static function index(array $authPayload, array $query): void {
        $model = new Notification();
        Response::success($model->getByUtilisateur(
            (int)$authPayload['sub'],
            (int)($query['page'] ?? 1),
            (int)($query['limit'] ?? 20)
        ));
    }

    public static function countNonLues(array $authPayload): void {
        $model = new Notification();
        Response::success(['count' => $model->countNonLues((int)$authPayload['sub'])]);
    }

    public static function marquerLue(int $id, array $authPayload): void {
        $model = new Notification();
        $model->marquerLue($id, (int)$authPayload['sub']);
        Response::success(null, 'Notification lue.');
    }

    public static function toutLire(array $authPayload): void {
        $model = new Notification();
        $model->marquerToutesLues((int)$authPayload['sub']);
        Response::success(null, 'Toutes les notifications ont été lues.');
    }

    public static function destroy(int $id, array $authPayload): void {
        $model = new Notification();
        $model->delete($id, (int)$authPayload['sub']);
        Response::success(null, 'Notification supprimée.');
    }
}
