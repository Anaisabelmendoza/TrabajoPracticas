<?php
require 'vendor/autoload.php';
use App\Entity\User;
$kernel = new App\Kernel('prod', false);
$kernel->boot();
$container = $kernel->getContainer();
$serializer = $container->get('serializer');
$em = $container->get('doctrine')->getManager();
$user = $em->getRepository(User::class)->find(1);
echo "Before: " . ($user->isActive() ? 'true' : 'false') . "\n";

$json = '{"isActive": false}';
$context = ['groups' => ['user:write'], 'object_to_populate' => $user];
$serializer->deserialize($json, User::class, 'json', $context);

echo "After deserialization: " . ($user->isActive() ? 'true' : 'false') . "\n";
