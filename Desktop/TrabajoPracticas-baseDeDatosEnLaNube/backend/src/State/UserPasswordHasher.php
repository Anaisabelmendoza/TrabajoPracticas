<?php

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface; // <-- IMPORTANTE
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class UserPasswordHasher implements ProcessorInterface
{
    public function __construct(
        private readonly ProcessorInterface $persistProcessor,
        private readonly UserPasswordHasherInterface $passwordHasher,
        private readonly EntityManagerInterface $entityManager // <-- Añadimos esto
    ) {}

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): mixed
    {
        if ($data instanceof User) {
            // Si hay contraseña, la encriptamos
            if ($data->getPlainPassword()) {
                $hashedPassword = $this->passwordHasher->hashPassword(
                    $data,
                    $data->getPlainPassword()
                );
                $data->setPassword($hashedPassword);
                $data->eraseCredentials();
            }

            // Si por algún motivo no tiene roles, le damos el básico
            if (empty($data->getRoles())) {
                $data->setRoles(['ROLE_USER']);
            }
        }

        // 1. Usamos el procesador normal
        $result = $this->persistProcessor->process($data, $operation, $uriVariables, $context);
        
        // 2. ¡EL GOLPE FINAL! Forzamos el guardado en la base de datos real (Aiven)
        $this->entityManager->flush();

        return $result;
    }
}