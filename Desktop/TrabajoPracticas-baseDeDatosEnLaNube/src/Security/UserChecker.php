<?php

namespace App\Security;

use App\Entity\User;
use Symfony\Component\Security\Core\Exception\CustomUserMessageAccountStatusException;
use Symfony\Component\Security\Core\User\UserCheckerInterface;
use Symfony\Component\Security\Core\User\UserInterface;

class UserChecker implements UserCheckerInterface
{
    public function checkPreAuth(UserInterface $user): void
    {
        if (!$user instanceof User) {
            return;
        }

        if (!$user->isActive() && in_array('ROLE_AGENT', $user->getRoles()) && !in_array('ROLE_ADMIN', $user->getRoles())) {
            // Este mensaje se devuelve en la respuesta 401 si falla el login o en peticiones con token
            throw new CustomUserMessageAccountStatusException('Tu cuenta de agente ha sido desactivada por un administrador.');
        }
    }

    public function checkPostAuth(UserInterface $user, ?\Symfony\Component\Security\Core\Authentication\Token\TokenInterface $token = null): void
    {
    }
}
