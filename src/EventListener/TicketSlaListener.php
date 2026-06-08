<?php

namespace App\EventListener;

use App\Entity\Ticket;
use App\Repository\PriorityRepository;
use Doctrine\Bundle\DoctrineBundle\Attribute\AsDoctrineListener;
use Doctrine\ORM\Event\PrePersistEventArgs;
use Doctrine\ORM\Event\PreUpdateEventArgs;
use Doctrine\ORM\Event\PostLoadEventArgs;
use Doctrine\ORM\Events;

#[AsDoctrineListener(event: Events::prePersist)]
#[AsDoctrineListener(event: Events::preUpdate)]
#[AsDoctrineListener(event: Events::postLoad)]
class TicketSlaListener
{
    public function __construct(private readonly PriorityRepository $priorityRepository)
    {
    }

    public function postLoad(PostLoadEventArgs $event): void
    {
        $entity = $event->getObject();
        if (!$entity instanceof Ticket) {
            return;
        }

        $this->calculateSla($entity);
    }

    public function prePersist(PrePersistEventArgs $event): void
    {
        $entity = $event->getObject();
        if (!$entity instanceof Ticket) {
            return;
        }

        $this->calculateSla($entity);
    }

    public function preUpdate(PreUpdateEventArgs $event): void
    {
        $entity = $event->getObject();
        if (!$entity instanceof Ticket) {
            return;
        }

        // Only recalculate if priority or createdAt changed
        if ($event->hasChangedField('priority') || $event->hasChangedField('createdAt')) {
            $this->calculateSla($entity);
        }
    }

    private function calculateSla(Ticket $ticket): void
    {
        if (null === $ticket->getCreatedAt() || null === $ticket->getPriority()) {
            return;
        }

        $priorityEntity = $this->priorityRepository->findOneBy(['name' => $ticket->getPriority()]);
        
        // Si no encuentra la prioridad en BD, usamos 24 por defecto
        $hours = $priorityEntity ? $priorityEntity->getSlaHours() : 24;

        $limit = clone $ticket->getCreatedAt();
        $limit = $limit->modify(sprintf('+%d hours', $hours));

        // Use reflection to set the private property since there is no public setter
        $reflection = new \ReflectionClass(Ticket::class);
        $property = $reflection->getProperty('slaLimit');
        $property->setValue($ticket, $limit);
    }
}
