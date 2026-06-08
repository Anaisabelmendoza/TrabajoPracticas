<?php
require 'vendor/autoload.php';

use App\Kernel;
use App\Entity\Ticket;
use Symfony\Component\Dotenv\Dotenv;

(new Dotenv())->bootEnv(__DIR__.'/.env');
$kernel = new Kernel($_SERVER['APP_ENV'], (bool) $_SERVER['APP_DEBUG']);
$kernel->boot();

$container = $kernel->getContainer();
$em = $container->get('doctrine.orm.entity_manager');

// Get a ticket in "Nueva" status
$ticket = $em->getRepository(Ticket::class)->findOneBy(['status' => 'Nueva']);

if (!$ticket) {
    echo "No ticket found in Nueva status.\n";
    exit;
}

echo "Deleting ticket " . $ticket->getId() . "...\n";

try {
    $em->remove($ticket);
    $em->flush();
    echo "Deleted successfully.\n";
} catch (\Throwable $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
