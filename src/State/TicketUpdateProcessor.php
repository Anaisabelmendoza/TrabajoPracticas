<?php

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\Ticket;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bridge\Twig\Mime\TemplatedEmail;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Address;

class TicketUpdateProcessor implements ProcessorInterface
{
    public function __construct(
        private readonly ProcessorInterface $persistProcessor,
        private readonly MailerInterface $mailer,
        private readonly EntityManagerInterface $entityManager
    ) {}

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): mixed
    {
        $statusChanged = false;
        $previousStatus = null;
        $newStatus = null;

        if ($data instanceof Ticket) {
            $uow = $this->entityManager->getUnitOfWork();
            $originalData = $uow->getOriginalEntityData($data);
            
            if (isset($originalData['status'])) {
                $previousStatus = $originalData['status'];
                $newStatus = $data->getStatus();
                if ($previousStatus !== $newStatus) {
                    $statusChanged = true;
                }
            }
        }

        // Persistimos en la base de datos
        $result = $this->persistProcessor->process($data, $operation, $uriVariables, $context);

        // Si el estado cambió y pudimos guardarlo, enviamos el correo
        if ($statusChanged && $data instanceof Ticket && $data->getAuthor() && $data->getAuthor()->getEmail()) {
            try {
                $email = (new TemplatedEmail())
                    ->from(new Address('soporte@helpdesk.com', 'HelpDesk Soporte'))
                    ->to($data->getAuthor()->getEmail())
                    ->subject(sprintf('Actualización en tu incidencia #%d', $data->getId()))
                    ->htmlTemplate('emails/status_changed.html.twig')
                    ->context([
                        'clientName' => $data->getAuthor()->getFirstName() ?: 'Cliente',
                        'ticketId' => $data->getId(),
                        'subject' => $data->getTitle(),
                        'newStatus' => $newStatus,
                        'ticketUrl' => (getenv('DEFAULT_URI') ?: 'http://localhost:4200') . '/tickets/' . $data->getId()
                    ]);

                $this->mailer->send($email);
            } catch (\Exception $e) {
                // Si el correo falla, no rompemos el proceso de actualización
                error_log('Error enviando correo de cambio de estado: ' . $e->getMessage());
            }
        }

        return $result;
    }
}
