<?php

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\Ticket;
use Symfony\Bundle\SecurityBundle\Security;

class TicketClaimProcessor implements ProcessorInterface
{
    public function __construct(
        private readonly ProcessorInterface $persistProcessor,
        private readonly Security $security
    ) {}

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): mixed
    {
        if ($data instanceof Ticket) {
            $user = $this->security->getUser();
            if ($user && !$data->getAgent()) {
                // Verificar si el agente está de turno/vacaciones
                if ($user instanceof \App\Entity\User && !$user->getOnDuty()) {
                    throw new \Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException("Estás marcado como fuera de servicio (vacaciones/inactivo) y no puedes recibir incidencias.");
                }

                $data->setAgent($user);
                // También cambiamos el estado a "En proceso" automáticamente al reclamar
                if ($data->getStatus() === 'Nuevo') {
                    $data->setStatus('En proceso');
                }
            }
        }

        return $this->persistProcessor->process($data, $operation, $uriVariables, $context);
    }
}
