<?php
use \Psr\Http\Message\ServerRequestInterface as Request;
use \Psr\Http\Message\ResponseInterface as Response;

require "../vendor/autoload.php";
require "../secrets.php";

$config = [
    'settings' => [
        'displayErrorDetails' => (ENVIRONMENT === "development") ? true : false,
    ],
];

$app = new \Slim\App($config);
$app->get('/hello/{name}', function (Request $request, Response $response, array $args) {
    $name = $args['name'];
    $response->getBody()->write("Hello, $name");

    return $response;
});
$app->run();