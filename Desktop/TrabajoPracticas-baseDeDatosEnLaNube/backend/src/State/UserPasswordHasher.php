<?php

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\User;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
// ¡ESTA LÍNEA ES NUEVA E IMPORTANTE! 👇
use Symfony\Component\DependencyInjection\Attribute\Autowire;

class UserPasswordHasher implements ProcessorInterface
{
    public function __construct(
        // ¡ESTA ETIQUETA ES LA MAGIA QUE GUARDA EN LA BASE DE DATOS! 👇
        #[Autowire(service: 'api_platform.doctrine.orm.state.persist_processor')]
        private readonly ProcessorInterface $persistProcessor,
        private readonly UserPasswordHasherInterface $passwordHasher
    ) {}

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): mixed
    {
        if ($data instanceof User && $data->getPlainPassword()) {
            $hashedPassword = $this->passwordHasher->hashPassword(
                $data,
                $data->getPlainPassword()
            );
            $data->setPassword($hashedPassword);
            $data->eraseCredentials();

            if (empty($data->getRoles())) {
                $data->setRoles(['ROLE_USER']);
            }
        }

        // Ahora sí, esta línea cogerá el guardador de Doctrine y escribirá en Aiven
        return $this->persistProcessor->process($data, $operation, $uriVariables, $context);
    }
}
