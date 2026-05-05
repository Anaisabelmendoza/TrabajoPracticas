<?php

namespace App\EventListener;

use App\Entity\Ticket;
use App\Entity\TicketHistory;
use Doctrine\Bundle\DoctrineBundle\Attribute\AsEntityListener;
use Doctrine\ORM\Event\PreUpdateEventArgs;
use Doctrine\ORM\Events;
use Symfony\Bundle\SecurityBundle\Security;

#[AsEntityListener(event: Events::preUpdate, method: 'preUpdate', entity: Ticket::class)]
class TicketAuditListener
{
    private Security $security;

    public function __construct(Security $security)
    {
        $this->security = $security;
    }

    public function preUpdate(Ticket $ticket, PreUpdateEventArgs $event): void
    {
        $em = $event->getObjectManager();
        /** @var \App\Entity\User|null $user */
        $user = $this->security->getUser();

        if (!$user) {
            // Si el cambio no lo hace un usuario logueado (ej. comando CLI), no se puede loggear el author
            return;
        }

        // Revisar si cambió el estado
        if ($event->hasChangedField('status')) {
            $history = new TicketHistory();
            $history->setTicket($ticket);
            $history->setAuthor($user);
            $history->setFieldChanged('status');
            $history->setOldValue($event->getOldValue('status'));
            $history->setNewValue($event->getNewValue('status'));
            
            $em->persist($history);
            // Instruir a Doctrine para que inserte la nueva entidad a pesar de estar en medio de un preUpdate
            $em->getUnitOfWork()->computeChangeSet($em->getClassMetadata(TicketHistory::class), $history);
        }

        // Revisar si cambió el responsable
        if ($event->hasChangedField('assignee')) {
            /** @var \App\Entity\User|null $oldAssignee */
            $oldAssignee = $event->getOldValue('assignee');
            /** @var \App\Entity\User|null $newAssignee */
            $newAssignee = $event->getNewValue('assignee');

            $history = new TicketHistory();
            $history->setTicket($ticket);
            $history->setAuthor($user); 
            $history->setFieldChanged('assignee');
            $history->setOldValue($oldAssignee ? $oldAssignee->getEmail() : 'Unassigned');
            $history->setNewValue($newAssignee ? $newAssignee->getEmail() : 'Unassigned');
            
            $em->persist($history);
            $em->getUnitOfWork()->computeChangeSet($em->getClassMetadata(TicketHistory::class), $history);
        }
    }
}
