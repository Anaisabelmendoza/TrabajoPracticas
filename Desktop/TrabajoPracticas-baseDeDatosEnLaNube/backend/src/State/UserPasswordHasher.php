<?php

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\User;
use Symfony\Component\DependencyInjection\Attribute\Autowire; // <-- 1. ¡Esta línea es vital!
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class UserPasswordHasher implements ProcessorInterface
{
    public function __construct(
        // 2. ¡ESTA ETIQUETA ES LA QUE EVITA EL ERROR! 👇
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

        // 3. El guardado oficial de Doctrine
        return $this->persistProcessor->process($data, $operation, $uriVariables, $context);
    }
}