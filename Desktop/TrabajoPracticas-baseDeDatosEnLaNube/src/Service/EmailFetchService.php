<?php

namespace App\Service;

use App\Entity\Ticket;
use App\Entity\User;
use App\Entity\Category;
use Doctrine\ORM\EntityManagerInterface;

use Webklex\PHPIMAP\ClientManager;

class EmailFetchService
{
    private EntityManagerInterface $entityManager;

    public function __construct(EntityManagerInterface $entityManager)
    {
        $this->entityManager = $entityManager;
    }

    public function fetchAndSyncEmails(string $emailUser, string $emailPass): array
    {
        $stats = ['created' => 0, 'errors' => 0, 'messages' => []];

        $cm = new ClientManager();
        $client = $cm->make([
            'host'          => 'imap.gmail.com',
            'port'          => 993,
            'encryption'    => 'ssl',
            'validate_cert' => false,
            'username'      => $emailUser,
            'password'      => $emailPass,
            'protocol'      => 'imap'
        ]);

        try {
            $client->connect();
            $folder = $client->getFolder('INBOX');
            $messages = $folder->query()->unseen()->get();

            foreach ($messages as $message) {
                try {
                    $subject = (string) $message->getSubject();
                    $body = $message->getTextBody() ?: $message->getHTMLBody(true);
                    $from = $message->getFrom()[0]->mail;

                    $this->createTicketFromEmail($from, $subject, $body);
                    
                    $message->setFlag('Seen');
                    $stats['created']++;
                } catch (\Exception $e) {
                    $stats['errors']++;
                    $stats['messages'][] = $e->getMessage();
                }
            }

            return $stats;
        } catch (\Exception $e) {
            throw new \Exception('Error de conexión con Gmail: ' . $e->getMessage());
        }
    }

    private function createTicketFromEmail(string $email, string $subject, string $body): void
    {
        $author = $this->entityManager->getRepository(User::class)->findOneBy(['email' => $email]);
        
        if (!$author) {
            $author = new User();
            $author->setEmail($email);
            $author->setFirstName('Cliente');
            $author->setLastName('Externo (Gmail)');
            $author->setPassword(bin2hex(random_bytes(10)));
            $author->setRoles(['ROLE_USER']);
            $this->entityManager->persist($author);
        }

        $category = $this->entityManager->getRepository(Category::class)->findOneBy(['name' => 'Email'])
                 ?? $this->entityManager->getRepository(Category::class)->findOneBy([]);
        
        if (!$category) {
            $category = new Category();
            $category->setName('Email');
            $this->entityManager->persist($category);
        }

        $ticket = new Ticket();
        $ticket->setTitle($subject);
        // Marcamos que viene de email en la descripción para detectarlo en el frontend
        $ticket->setDescription("[ORIGEN: EMAIL]\n\n" . $body);
        $ticket->setAuthor($author);
        $ticket->setCategory($category);
        $ticket->setStatus('Nuevo');
        $ticket->setPriority('Media');

        $this->entityManager->persist($ticket);
        $this->entityManager->flush();
    }
}
