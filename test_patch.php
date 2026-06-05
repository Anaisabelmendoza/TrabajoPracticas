<?php
require 'vendor/autoload.php';
$kernel = new App\Kernel('prod', false);
$kernel->boot();
$container = $kernel->getContainer();
$em = $container->get('doctrine')->getManager();
$user = $em->getRepository(App\Entity\User::class)->findOneBy([]);
echo "User ID: " . $user->getId() . "\n";
