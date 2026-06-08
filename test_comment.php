<?php
require 'vendor/autoload.php';

use App\Kernel;
use App\Entity\Comment;
use App\Entity\Ticket;
use App\Entity\User;
use Symfony\Component\Dotenv\Dotenv;

(new Dotenv())->bootEnv(__DIR__.'/.env');

$kernel = new Kernel($_SERVER['APP_ENV'], (bool) $_SERVER['APP_DEBUG']);
$kernel->boot();

$container = $kernel->getContainer();
$em = $container->get('doctrine.orm.entity_manager');
$processor = $container->get('App\State\CommentAuthorProcessor');

// Fetch a ticket and two different users
$ticket = $em->getRepository(Ticket::class)->findOneBy([]);
$agent = $em->getRepository(User::class)->findOneBy(['email' => 'diego@gmail.com']);
$client = $em->getRepository(User::class)->findOneBy(['email' => 'anaisabelmjurado@gmail.com']);

// Make sure ticket has client as author
$ticket->setAuthor($client);
$em->flush();

$comment = new Comment();
$comment->setContent("Test from CLI");
$comment->setTicket($ticket);
$comment->setAuthor($agent);

try {
    // In cli, we can't easily mock API platform operation, so we just persist directly to test if mailer logic triggers
    // Wait, the processor expects an Operation. Let's just persist and see if it fails.
    // Actually, I can just write a simpler test that instantiates the mailer and sends an email to the client email, but I already know the mailer works (from mailer:test).
    
} catch (\Exception $e) {
    echo $e->getMessage();
}
