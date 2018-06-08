<?php
use \Psr\Http\Message\ServerRequestInterface as Request;
use \Psr\Http\Message\ResponseInterface as Response;

require "../vendor/autoload.php";
require_once "raven.php";
require "../secrets.php";
require_once "auth.php";
require_once "twitter.php";
require_once "db.php";

$config = [
    'settings' => [
        'displayErrorDetails' => (ENVIRONMENT === "development") ? true : false,
    ],
];

$app = new \Slim\App($config);

$app->add(function ($request, $response, $next) {
    $authorized = isAuthorisedUser("su");

    if ($authorized) {
        // authorized, call next middleware
        return $next($request, $response);
    }

    // not authorized, don't call next middleware and return our own response
    return $response
        ->withStatus(403);
});

$app->get('/hello/{name}', function (Request $request, Response $response, array $args) {
    $name = $args['name'];
    $response->getBody()->write("Hello, $name");

    return $response;
});

$app->get('/hello-tweets', function (Request $request, Response $response, array $args) use ($twitterConnection) {
    // $twitterResponse = $twitterConnection->get("statuses/mentions_timeline", ["tweet_mode" => "extended"]);
    $twitterResponse = $twitterConnection->get("search/tweets", ["q" => "#democracysausage", "result_type" => "recent", "tweet_mode" => "extended"]);
    // $response = $twitterConnection->get("application/rate_limit_status");
    
    return $response->withJson($twitterResponse);
});

$app->run();