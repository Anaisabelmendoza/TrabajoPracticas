<?php
require __DIR__ . '/vendor/autoload.php';
$kernel = new \App\Kernel('dev', true);
$kernel->boot();
$container = $kernel->getContainer();
$repo = $container->get('doctrine')->getRepository(\App\Entity\Ticket::class);
$stats = $repo->getDashboardStatistics(null, null, null, null);
print_r($stats);
