<?php

require_once 'vendor/autoload.php';

use App\Kernel;
use App\Entity\User;
use Symfony\Component\Dotenv\Dotenv;
use Symfony\Component\HttpFoundation\Request;

$dotenv = new Dotenv();
$dotenv->load(__DIR__.'/.env');

$kernel = new Kernel($_SERVER['APP_ENV'] ?? 'dev', (bool) ($_SERVER['APP_DEBUG'] ?? true));
$kernel->boot();

$container = $kernel->getContainer();
$entityManager = $container->get('doctrine')->getManager();

try {
    $email = 'test_script_'.time().'@example.com';
    $user = new User();
    $user->setEmail($email);
    $user->setPassword('Password123'); // No hasher for simplicity in this script
    $user->setRoles(['ROLE_USER']);

    $entityManager->persist($user);
    $entityManager->flush();

    echo "SUCCESS: User created with email: $email\n";
} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
