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

                    // --- FILTRO DE CORREOS (Google, Spam, Clientes No Registrados) ---
                    $blockedKeywords = [
                        // dominios y remitentes genéricos no deseados
                        'google.com', 'noreply', 'no-reply', 'marketing',
                        // listas de difusión y rebotes
                        'newsletter', 'mailer-daemon', 'postmaster', 'bounce',
                        // palabras clave comunes de spam / phishing
                        'promociones', 'promo', 'promocion', 'info@', 'google', 'alertas', 'alerts', 'spam',
                        // contenido publicitario y promociones
                        'publicidad', 'advert', 'advertising', 'sponsored', 'sponsor',
                        'ganaste', 'premio', 'loter', 'oferta', 'descuento', 'free', 'win', 'winner', 'prize', 'gift',
                        // temas de alto riesgo / fraude
                        'viagra', 'casino', 'crypto', 'bitcoin', 'invest', 'seo',
                        // intentos de evasión y respuestas automáticas
                        'no-responder',
                        // nuevos filtros solicitados
                        'facturas', 'alerta',
                        // plataformas y newsletters de terceros
                        'ngrok', 'hubspot', 'mailchimp', 'sendgrid', 'news', 'updates', 'boletin'
                    ];
                    
                    $isSpam = false;
                    
                    // 1. Validar palabras clave de Spam o alertas de Google en el remitente o el asunto
                    foreach ($blockedKeywords as $keyword) {
                        if (stripos($from, $keyword) !== false || stripos($subject, $keyword) !== false) {
                            $isSpam = true;
                            break;
                        }
                    }

                    // 2. No se verifica registro de usuario; cualquier remitente válido pasa siempre (solo se aplica el filtro de palabras clave)
                    // La lógica de registro se ha eliminado para permitir que clientes potenciales envíen incidencias sin estar registrados.
                    // if (!$isSpam) {
                    //     $userRepo = $this->entityManager->getRepository(User::class);
                    //     $registeredUser = $userRepo->findOneBy(['email' => $from]);
                    //     if (!$registeredUser) {
                    //         $isSpam = true;
                    //     }
                    // }

                    if ($isSpam) {
                        // Lo marcamos como leído para que no vuelva a procesarse y pasamos al siguiente
                        $message->setFlag('Seen');
                        continue;
                    }
                    // -----------------------------------------------------------------

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
        
        // --- DETECCIÓN DE PRIORIDAD POR PALABRAS CLAVE ---
        $highKeywords = [
            'urgente', 'emergencia', 'caída', 'caida', 'crítico', 'critico', 'grave', 'roto', 'inmediato',
            'falla total', 'urgencia', 'incidente', 'error', 'fallo', 'colapso', 'apagón', 'apagon'
        ];
        $criticalKeywords = ['crítica', 'critica', 'crítico', 'critico'];
        $lowKeywords = ['baja', 'menor', 'trivial'];

        $priority = 'Media'; // Por defecto
        $contentToCheck = strtolower($subject . ' ' . $body);

        // Prioridad Crítica
        foreach ($criticalKeywords as $word) {
            if (str_contains($contentToCheck, $word)) {
                $priority = 'Crítica';
                break;
            }
        }
        // Prioridad Alta (si no es crítica)
        if ($priority === 'Media') {
            foreach ($highKeywords as $word) {
                if (str_contains($contentToCheck, $word)) {
                    $priority = 'Alta';
                    break;
                }
            }
        }
        // Prioridad Baja (solo si sigue en Media)
        if ($priority === 'Media') {
            foreach ($lowKeywords as $word) {
                if (str_contains($contentToCheck, $word)) {
                    $priority = 'Baja';
                    break;
                }
            }
        }
        $ticket->setPriority($priority);
        // ------------------------------------------------------
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
