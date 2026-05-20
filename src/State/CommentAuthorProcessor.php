<?php

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\Comment;
use Symfony\Bundle\SecurityBundle\Security;

class CommentAuthorProcessor implements ProcessorInterface
{
    public function __construct(
        private readonly ProcessorInterface $persistProcessor,
        private readonly Security $security
    ) {}

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): mixed
    {
        if ($data instanceof Comment) {
            // Asignar autor si no tiene
            if (!$data->getAuthor()) {
                $user = $this->security->getUser();
                if ($user) {
                    $data->setAuthor($user);
                }
            }

            // REAPERTURA AUTOMÁTICA
            $ticket = $data->getTicket();
            if ($ticket && in_array($ticket->getStatus(), ['Resuelto', 'Cerrado'])) {
                $oldStatus = $ticket->getStatus();
                $ticket->setStatus('Nuevo');
                
                // Forzamos actualización de timestamp para que suba en el kanban
                $ticket->updateTimestamps();
            }
        }

        return $this->persistProcessor->process($data, $operation, $uriVariables, $context);
    }
}
