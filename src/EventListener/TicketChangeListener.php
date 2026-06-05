<?php

namespace App\EventListener;

use App\Entity\Ticket;
use App\Entity\TicketHistory;
use Doctrine\Bundle\DoctrineBundle\Attribute\AsDoctrineListener;
use Doctrine\ORM\Event\OnFlushEventArgs;
use Doctrine\ORM\Events;
use Symfony\Bridge\Twig\Mime\TemplatedEmail;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\Mailer\MailerInterface;

#[AsDoctrineListener(event: Events::onFlush)]
class TicketChangeListener
{
    public function __construct(private readonly Security $security, private readonly MailerInterface $mailer)
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

                    // Enviar notificación por email sobre el cambio de estado
                    $clientEmail = $entity->getAuthor() ? $entity->getAuthor()->getEmail() : null;
                    $systemEmails = ['anaisabelmendozajurado@gmail.com', 'soporte@helpdesk.com'];
                    
                    if ($clientEmail && !in_array(strtolower($clientEmail), $systemEmails)) {
                        $email = (new TemplatedEmail())
                            ->from(new \Symfony\Component\Mime\Address('soporte@helpdesk.com', 'HelpDesk Soporte'))
                            ->replyTo(new \Symfony\Component\Mime\Address('soporte@helpdesk.com', 'HelpDesk Soporte'))
                            ->to($clientEmail)
                            ->subject('Actualización en tu incidencia: ' . $changeSet['status'][1])
                            ->htmlTemplate('emails/status_changed.html.twig')
                            ->context([
                                'ticketId' => $entity->getId(),
                                'subject' => $entity->getTitle(),
                                'clientName' => $entity->getAuthor() ? $entity->getAuthor()->getFirstName() ?? 'Cliente' : 'Cliente',
                                'newStatus' => $changeSet['status'][1],
                                'ticketUrl' => 'http://localhost:4200/tickets/' . $entity->getId(),
                            ]);
                        $this->mailer->send($email);
                    }
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
