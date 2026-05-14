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
    private \Symfony\Component\String\Slugger\SluggerInterface $slugger;
    private string $projectDir;
    private \Symfony\Component\Mailer\MailerInterface $mailer;

    public function __construct(
        EntityManagerInterface $entityManager, 
        \Symfony\Component\String\Slugger\SluggerInterface $slugger,
        \Symfony\Component\HttpKernel\KernelInterface $kernel,
        \Symfony\Component\Mailer\MailerInterface $mailer
    ) {
        $this->entityManager = $entityManager;
        $this->slugger = $slugger;
        $this->projectDir = $kernel->getProjectDir();
        $this->mailer = $mailer;
    }

    public function fetchAndSyncEmails(string $emailUser, string $emailPass): array
    {
        $stats = ['created' => 0, 'errors' => 0, 'messages' => []];

        try {
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

            $client->connect();
            $folder = $client->getFolder('INBOX');
            $messages = $folder->query()->unseen()->get();

            foreach ($messages as $message) {
                try {
                    $subject = (string) $message->getSubject();
                    $body = $message->getTextBody() ?: $message->getHTMLBody(true);
                    $from = $message->getFrom()[0]->mail;

                    // Procesar adjuntos
                    $attachments = [];
                    foreach ($message->getAttachments() as $attachment) {
                        $filename = $attachment->getName();
                        $extension = pathinfo($filename, PATHINFO_EXTENSION) ?: 'bin';
                        
                        // Solo permitimos ciertos formatos igual que en el controlador
                        $allowedExtensions = ['jpg', 'jpeg', 'png', 'pdf'];
                        if (!in_array(strtolower($extension), $allowedExtensions)) {
                            continue;
                        }

                        $safeFilename = $this->slugger->slug(pathinfo($filename, PATHINFO_FILENAME));
                        $newFilename = $safeFilename.'-'.uniqid().'.'.$extension;
                        $uploadDir = $this->projectDir . '/public/uploads/attachments';
                        
                        if (!is_dir($uploadDir)) {
                            mkdir($uploadDir, 0777, true);
                        }

                        // Guardar el contenido del adjunto
                        file_put_contents($uploadDir . '/' . $newFilename, $attachment->getContent());
                        $attachments[] = '/uploads/attachments/' . $newFilename;
                    }

                    $this->createTicketFromEmail($from, $subject, $body, $attachments);
                    
                    $message->setFlag('Seen');
                    $stats['created']++;
                } catch (\Exception $e) {
                    $stats['errors']++;
                    $stats['messages'][] = $e->getMessage();
                }
            }

            return $stats;
        } catch (\Exception $e) {
            $logDir = $this->projectDir . '/var/log';
            if (!is_dir($logDir)) {
                mkdir($logDir, 0777, true);
            }
            file_put_contents(
                $logDir . '/email_sync_error.log', 
                "[" . date('Y-m-d H:i:s') . "] ERROR: " . $e->getMessage() . "\n" . $e->getTraceAsString() . "\n\n", 
                FILE_APPEND
            );
            throw new \Exception('Error de conexión con Gmail: ' . $e->getMessage());
        }
    }

    private function createTicketFromEmail(string $email, string $subject, string $body, array $attachments = []): void
    {
        $author = $this->entityManager->getRepository(User::class)->findOneBy(['email' => $email]);
        
        if (!$author) {
            $author = new User();
            $author->setEmail($email);
            $author->setFirstName('Cliente');
            $author->setLastName('Externo (Gmail)');
            // Password aleatoria para cumplir con la base de datos
            $author->setPassword(bin2hex(random_bytes(10)));
            $author->setRoles(['ROLE_USER']);
            $this->entityManager->persist($author);
        }

        // Buscamos la categoría "Email" o la primera que exista
        $category = $this->entityManager->getRepository(Category::class)->findOneBy(['name' => 'Email'])
                 ?? $this->entityManager->getRepository(Category::class)->findOneBy([]);
        
        if (!$category) {
            $category = new Category();
            $category->setName('Email');
            $this->entityManager->persist($category);
        }

        $ticket = new Ticket();
        $ticket->setTitle($subject);
        $ticket->setDescription("[ORIGEN: EMAIL]\n\n" . strip_tags($body));
        $ticket->setAuthor($author);
        $ticket->setCategory($category);
        $ticket->setStatus('Nuevo');
        $ticket->setPriority('Media');
        $ticket->setAttachments($attachments);

        $this->entityManager->persist($ticket);
        $this->entityManager->flush();

        // Enviar respuesta automática con diseño personalizado
        try {
            $emailResponse = (new \Symfony\Bridge\Twig\Mime\TemplatedEmail())
                ->from('anaisabelmendozajurado@gmail.com')
                ->to($email)
                ->subject('Incidencia Recibida: #' . $ticket->getId() . ' - ' . $subject)
                ->htmlTemplate('emails/auto_reply.html.twig')
                ->context([
                    'ticketId' => $ticket->getId(),
                    'subject' => $subject,
                ]);

            $this->mailer->send($emailResponse);
        } catch (\Exception $e) {
            // Error al enviar email - podemos registrarlo en el log
            error_log('Error enviando auto-respuesta: ' . $e->getMessage());
        }
    }
}
