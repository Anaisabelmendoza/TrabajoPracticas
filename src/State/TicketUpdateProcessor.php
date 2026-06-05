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



        return $result;
    }
}
