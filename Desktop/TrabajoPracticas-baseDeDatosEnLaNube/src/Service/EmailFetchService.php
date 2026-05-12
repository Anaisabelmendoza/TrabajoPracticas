<?php

namespace App\Service;

use App\Entity\Ticket;
use App\Entity\User;
use App\Entity\Category;
use Doctrine\ORM\EntityManagerInterface;

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

        if (!function_exists('imap_open')) {
            throw new \Exception('La extensión PHP-IMAP no está instalada.');
        }

        $host = '{imap.gmail.com:993/imap/ssl}INBOX';
        $inbox = @imap_open($host, $emailUser, $emailPass);

        if (!$inbox) {
            throw new \Exception('No se pudo conectar a Gmail: ' . imap_last_error());
        }

        $emails = imap_search($inbox, 'UNSEEN');

        if ($emails) {
            foreach ($emails as $emailNumber) {
                try {
                    $overview = imap_fetch_overview($inbox, $emailNumber, 0)[0];
                    $body = imap_fetchbody($inbox, $emailNumber, 1);
                    $body = quoted_printable_decode($body);
                    
                    $subject = isset($overview->subject) ? imap_utf8($overview->subject) : 'Nueva incidencia por Email';
                    $from = $overview->from;
                    
                    if (preg_match('/<([^>]+)>/', $from, $matches)) {
                        $senderEmail = $matches[1];
                    } else {
                        $senderEmail = $from;
                    }

                    $this->createTicketFromEmail($senderEmail, $subject, $body);
                    
                    imap_setflag_full($inbox, $emailNumber, "\\Seen");
                    $stats['created']++;
                } catch (\Exception $e) {
                    $stats['errors']++;
                    $stats['messages'][] = $e->getMessage();
                }
            }
        }

        imap_close($inbox);
        return $stats;
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
