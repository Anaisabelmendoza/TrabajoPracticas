<?php

namespace App\EventListener;

use App\Entity\Ticket;
use App\Entity\TicketHistory;
use Doctrine\Bundle\DoctrineBundle\Attribute\AsEntityListener;
use Doctrine\ORM\Event\PreUpdateEventArgs;
use Doctrine\ORM\Events;
use Symfony\Bundle\SecurityBundle\Security;

#[AsEntityListener(event: Events::preUpdate, method: 'preUpdate', entity: Ticket::class)]
class TicketChangeListener
{
    public function __construct(private readonly Security $security)
    {
    }

    public function preUpdate(Ticket $ticket, PreUpdateEventArgs $event): void
    {
        $em = $event->getObjectManager();
        $user = $this->security->getUser();

        if ($event->hasChangedField('status')) {
            $history = new TicketHistory();
            $history->setTicket($ticket);
            $history->setAction('Cambio de Estado');
            $history->setOldValue($event->getOldValue('status'));
            $history->setNewValue($event->getNewValue('status'));
            $history->setUser($user);
            $em->persist($history);
        }

        if ($event->hasChangedField('agent')) {
            $history = new TicketHistory();
            $history->setTicket($ticket);
            $history->setAction('Cambio de Agente');
            $history->setOldValue($event->getOldValue('agent')?->getEmail() ?? 'Sin asignar');
            $history->setNewValue($event->getNewValue('agent')?->getEmail() ?? 'Sin asignar');
            $history->setUser($user);
            $em->persist($history);
        }
    }
}
