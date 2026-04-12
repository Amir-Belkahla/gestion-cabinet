<?php
define('JWT_SECRET',         'c@b!n3t_M3d1c@l_S3cr3t_K3y_2026!');
define('JWT_ACCESS_EXPIRY',  15 * 60);          // 15 minutes
define('JWT_REFRESH_EXPIRY', 7 * 24 * 3600);    // 7 jours

define('BASE_URL', 'http://localhost/gestion_cabinet/backend');
define('FRONTEND_URL', 'http://localhost/gestion_cabinet/frontend');

define('ROLES', ['admin', 'medecin', 'secretaire', 'patient']);
