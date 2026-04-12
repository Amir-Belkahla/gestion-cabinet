<?php
class MedecinController {

    public static function index(array $authPayload): void {
        $model = new Medecin();
        Response::success($model->getAll());
    }

    public static function show(int $id, array $authPayload): void {
        $model   = new Medecin();
        $medecin = $model->findById($id);
        if (!$medecin) Response::notFound('Médecin introuvable.');
        Response::success($medecin);
    }
}
