<?php
require 'vendor/autoload.php';

use App\Kernel;
use Symfony\Component\Dotenv\Dotenv;
use Symfony\Component\HttpFoundation\Request;

(new Dotenv())->bootEnv(__DIR__.'/.env');

$kernel = new Kernel($_SERVER['APP_ENV'], (bool) $_SERVER['APP_DEBUG']);
$kernel->boot();

$container = $kernel->getContainer();
$jwtManager = $container->get('lexik_jwt_authentication.jwt_manager');
$em = $container->get('doctrine')->getManager();

$user = $em->getRepository(\App\Entity\User::class)->findOneBy(['email' => 'ana@gmail.com']);
$token = $jwtManager->create($user);

$request = Request::create('/api/tickets', 'GET');
$request->headers->set('Accept', 'application/json');
$request->headers->set('Authorization', 'Bearer ' . $token);

$response = $kernel->handle($request);
echo $response->getContent();
