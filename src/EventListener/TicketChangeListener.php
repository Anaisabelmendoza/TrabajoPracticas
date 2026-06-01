<?php

namespace App\EventListener;

use App\Entity\Ticket;
use App\Entity\TicketHistory;
use Doctrine\Bundle\DoctrineBundle\Attribute\AsDoctrineListener;
use Doctrine\ORM\Event\OnFlushEventArgs;
use Doctrine\ORM\Events;
use Symfony\Bundle\SecurityBundle\Security;

#[AsDoctrineListener(event: Events::onFlush)]
class TicketChangeListener
{
    public function __construct(private readonly Security $security)
    {
    }

    public function onFlush(OnFlushEventArgs $event): void
    {
        $em = $event->getObjectManager();
        $uow = $em->getUnitOfWork();
        $user = $this->security->getUser();
        $historyMeta = $em->getClassMetadata(TicketHistory::class);

        // 1. Gestionar creación de tickets (Insertions)
        foreach ($uow->getScheduledEntityInsertions() as $entity) {
            if ($entity instanceof Ticket) {
                $history = new TicketHistory();
                $history->setTicket($entity);
                $history->setAction('Creación de Ticket');
                $history->setNewValue($entity->getTitle());
                $history->setUser($user);

                $em->persist($history);
                $uow->computeChangeSet($historyMeta, $history);
            }
        }

        // 2. Gestionar actualización de tickets (Updates)
        foreach ($uow->getScheduledEntityUpdates() as $entity) {
            if ($entity instanceof Ticket) {
                $changeSet = $uow->getEntityChangeSet($entity);

                if (isset($changeSet['status'])) {
                    $history = new TicketHistory();
                    $history->setTicket($entity);
                    $history->setAction('Cambio de Estado');
                    $history->setOldValue($changeSet['status'][0]);
                    $history->setNewValue($changeSet['status'][1]);
                    $history->setUser($user);

                    $em->persist($history);
                    $uow->computeChangeSet($historyMeta, $history);
                }

                if (isset($changeSet['agent'])) {
                    $history = new TicketHistory();
                    $history->setTicket($entity);
                    $history->setAction('Cambio de Agente');
                    $history->setOldValue($changeSet['agent'][0]?->getEmail() ?? 'Sin asignar');
                    $history->setNewValue($changeSet['agent'][1]?->getEmail() ?? 'Sin asignar');
                    $history->setUser($user);

                    $em->persist($history);
                    $uow->computeChangeSet($historyMeta, $history);
                }

                if (isset($changeSet['priority'])) {
                    $history = new TicketHistory();
                    $history->setTicket($entity);
                    $history->setAction('Cambio de Prioridad');
                    $history->setOldValue($changeSet['priority'][0]);
                    $history->setNewValue($changeSet['priority'][1]);
                    $history->setUser($user);

                    $em->persist($history);
                    $uow->computeChangeSet($historyMeta, $history);
                }

                if (isset($changeSet['category'])) {
                    $history = new TicketHistory();
                    $history->setTicket($entity);
                    $history->setAction('Cambio de Categoría');
                    $history->setOldValue($changeSet['category'][0]?->getName() ?? 'Sin categoría');
                    $history->setNewValue($changeSet['category'][1]?->getName() ?? 'Sin categoría');
                    $history->setUser($user);

                    $em->persist($history);
                    $uow->computeChangeSet($historyMeta, $history);
                }

                if (isset($changeSet['rating'])) {
                    $history = new TicketHistory();
                    $history->setTicket($entity);
                    $history->setAction('Encuesta CSAT Completada');
                    $history->setOldValue($changeSet['rating'][0] ? $changeSet['rating'][0] . ' ★' : 'Sin valorar');
                    $history->setNewValue($changeSet['rating'][1] . ' ★');
                    $history->setUser($user);

                    $em->persist($history);
                    $uow->computeChangeSet($historyMeta, $history);
                }
            }
        }
    }
}
