<?php

namespace App\EventSubscriber;

use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\Event\TerminateEvent;
use Symfony\Component\HttpKernel\KernelEvents;
use Symfony\Component\Security\Core\Authentication\Token\Storage\TokenStorageInterface;

class UserActivitySubscriber implements EventSubscriberInterface
{
    private $tokenStorage;
    private $entityManager;

    public function __construct(TokenStorageInterface $tokenStorage, EntityManagerInterface $entityManager)
    {
        $this->tokenStorage = $tokenStorage;
        $this->entityManager = $entityManager;
    }

    public function onKernelTerminate(TerminateEvent $event)
    {
        if (!$event->isMainRequest()) {
            return;
        }

        $token = $this->tokenStorage->getToken();
        if (!$token) {
            return;
        }

        $user = $token->getUser();
        if ($user instanceof User) {
            $now = new \DateTime();
            $lastActivity = $user->getLastActivityAt();
            
            // Solo actualizamos si han pasado más de 60 segundos
            if (!$lastActivity || ($now->getTimestamp() - $lastActivity->getTimestamp()) > 60) {
                
                $connectionData = $user->getConnectionData() ?: [];
                $today = $now->format('Y-m-d');
                $currentTime = $now->format('H:i:s');

                if (!isset($connectionData[$today])) {
                    $connectionData[$today] = [
                        'segments' => [
                            ['start' => $currentTime, 'end' => $currentTime]
                        ],
                        'totalMinutes' => 0
                    ];
                } else {
                    $segments = &$connectionData[$today]['segments'];
                    $lastIdx = count($segments) - 1;
                    
                    // Si la última actividad fue hace más de 10 minutos, creamos segmento nuevo
                    if ($lastActivity && ($now->getTimestamp() - $lastActivity->getTimestamp()) > 600) {
                        $segments[] = ['start' => $currentTime, 'end' => $currentTime];
                    } else {
                        // Actualizamos el final del segmento actual
                        $segments[$lastIdx]['end'] = $currentTime;
                    }
                }

                // Recalcular minutos de hoy
                $todayMinutes = 0;
                foreach ($connectionData[$today]['segments'] as $seg) {
                    $start = \DateTime::createFromFormat('H:i:s', $seg['start']);
                    $end = \DateTime::createFromFormat('H:i:s', $seg['end']);
                    if ($start && $end) {
                        $diff = $end->getTimestamp() - $start->getTimestamp();
                        $todayMinutes += round($diff / 60);
                    }
                }
                $connectionData[$today]['totalMinutes'] = max(1, $todayMinutes);

                $user->setConnectionData($connectionData);
                $user->setLastActivityAt($now);
                $this->entityManager->flush();
            }
        }
    }

    public static function getSubscribedEvents(): array
    {
        return [
            KernelEvents::TERMINATE => 'onKernelTerminate',
        ];
    }
}
