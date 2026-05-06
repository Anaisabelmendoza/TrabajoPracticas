<?php

namespace App\EventListener;

use Lexik\Bundle\JWTAuthenticationBundle\Event\JWTCreatedEvent;
use Symfony\Component\EventDispatcher\Attribute\AsEventListener;
use App\Entity\User;

class JWTCreatedListener
{
    #[AsEventListener(event: 'lexik_jwt_authentication.on_jwt_created')]
    public function onJWTCreated(JWTCreatedEvent $event): void
    {
        $payload = $event->getData();
        $user = $event->getUser();

        if ($user instanceof User) {
            $payload['id'] = $user->getId();
            $payload['email'] = $user->getEmail();
            $payload['firstName'] = $user->getFirstName();
            $payload['lastName'] = $user->getLastName();
        }

        $event->setData($payload);
    }
}
