<?php
require_once 'vendor/autoload.php';

use App\Kernel;
use App\Entity\User;
use Symfony\Component\Dotenv\Dotenv;

$dotenv = new Dotenv();
$dotenv->load(__DIR__.'/.env');

$kernel = new Kernel($_SERVER['APP_ENV'] ?? 'dev', (bool) ($_SERVER['APP_DEBUG'] ?? true));
$kernel->boot();

$container = $kernel->getContainer();
$entityManager = $container->get('doctrine')->getManager();

$usersToReset = ['maria@gmail.com', 'diego@gmail.com'];

foreach ($usersToReset as $email) {
    $user = $entityManager->getRepository(User::class)->findOneBy(['email' => $email]);
    if ($user) {
        $hashed = password_hash('A123456a!', PASSWORD_BCRYPT, ['cost' => 12]);
        $user->setPassword($hashed);
        $entityManager->flush();
        echo "SUCCESS: Reset password for $email to 'A123456a!'\n";
    } else {
        echo "ERROR: User $email not found\n";
    }
}
