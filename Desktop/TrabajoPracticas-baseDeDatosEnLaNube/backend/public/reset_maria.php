<?php

require dirname(__DIR__).'/vendor/autoload.php';

use App\Kernel;
use App\Entity\User;
use Symfony\Component\Dotenv\Dotenv;

(new Dotenv())->bootEnv(dirname(__DIR__).'/.env');

$kernel = new Kernel($_SERVER['APP_ENV'], (bool) $_SERVER['APP_DEBUG']);
$kernel->boot();

$container = $kernel->getContainer();
$em = $container->get('doctrine')->getManager();

$userRepository = $em->getRepository(User::class);
$user = $userRepository->findOneBy(['email' => 'maria@gmail.com']);

if (!$user) {
    echo "User not found";
    exit;
}

// BCRYPT is natively supported and valid for Symfony "auto" hashing
$hashedPassword = password_hash('123456', PASSWORD_BCRYPT);
$user->setPassword($hashedPassword);
$em->flush();

echo "Success! maria@gmail.com password updated to: 123456. Hash: " . $hashedPassword;
