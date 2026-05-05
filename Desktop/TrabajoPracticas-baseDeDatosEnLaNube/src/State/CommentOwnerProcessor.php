<?php

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\Comment;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

class CommentOwnerProcessor implements ProcessorInterface
{
    public function __construct(
        #[Autowire(service: 'api_platform.doctrine.orm.state.persist_processor')]
        private ProcessorInterface $persistProcessor,
        private Security $security
    ) {
    }

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = [])
    {
        if ($data instanceof Comment) {
            $user = $this->security->getUser();
            if ($user) {
                // Securización: Asegurar que el usuario tiene acceso al ticket en el que está comentando
                $ticket = $data->getTicket();
                if ($ticket && !$this->security->isGranted('ROLE_ADMIN') && !$this->security->isGranted('ROLE_AGENT') && $ticket->getOwner() !== $user && $ticket->getAssignee() !== $user) {
                    throw new AccessDeniedHttpException('No tienes permiso para comentar en este ticket.');
                }
                
                $data->setAuthor($user);
            }
        }

        return $this->persistProcessor->process($data, $operation, $uriVariables, $context);
    }
}
