<?php
require 'vendor/autoload.php';

use App\Kernel;
use Symfony\Component\Dotenv\Dotenv;

(new Dotenv())->bootEnv(__DIR__.'/.env');

$kernel = new Kernel($_SERVER['APP_ENV'], (bool) $_SERVER['APP_DEBUG']);
$kernel->boot();

$container = $kernel->getContainer();
$em = $container->get('doctrine')->getManager();

$tickets = $em->getRepository(\App\Entity\Ticket::class)->findAll();
echo "Tickets count: " . count($tickets) . "\n";
foreach ($tickets as $ticket) {
    $catId = $ticket->getCategory() ? $ticket->getCategory()->getId() : 'null';
    $catName = $ticket->getCategory() ? $ticket->getCategory()->getName() : 'null';
    echo "ID: " . $ticket->getId() . " | Category: " . $catName . " (ID: " . $catId . ") | Author: " . $ticket->getAuthor()->getEmail() . "\n";
}
