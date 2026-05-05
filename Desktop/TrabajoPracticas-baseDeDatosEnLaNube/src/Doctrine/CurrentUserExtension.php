<?php

namespace App\Doctrine;

use ApiPlatform\Doctrine\Orm\Extension\QueryCollectionExtensionInterface;
use ApiPlatform\Doctrine\Orm\Util\QueryNameGeneratorInterface;
use ApiPlatform\Metadata\Operation;
use App\Entity\Ticket;
use App\Entity\Notification;
use App\Entity\Comment;
use Doctrine\ORM\QueryBuilder;
use Symfony\Bundle\SecurityBundle\Security;

final class CurrentUserExtension implements QueryCollectionExtensionInterface
{
    private Security $security;

    public function __construct(Security $security)
    {
        $this->security = $security;
    }

    public function applyToCollection(QueryBuilder $queryBuilder, QueryNameGeneratorInterface $queryNameGenerator, string $resourceClass, ?Operation $operation = null, array $context = []): void
    {
        $this->addWhere($queryBuilder, $resourceClass);
    }

    private function addWhere(QueryBuilder $queryBuilder, string $resourceClass): void
    {
        if (null === $user = $this->security->getUser() || $this->security->isGranted('ROLE_ADMIN')) {
            return;
        }

        $rootAlias = $queryBuilder->getRootAliases()[0];

        if (Ticket::class === $resourceClass && !$this->security->isGranted('ROLE_AGENT')) {
            $queryBuilder->andWhere(sprintf('%s.owner = :current_user OR %s.assignee = :current_user', $rootAlias, $rootAlias));
            $queryBuilder->setParameter('current_user', $user->getId());
        }

        if (Notification::class === $resourceClass) {
            $queryBuilder->andWhere(sprintf('%s.user = :current_user', $rootAlias));
            $queryBuilder->setParameter('current_user', $user->getId());
        }

        if (Comment::class === $resourceClass && !$this->security->isGranted('ROLE_AGENT')) {
            $queryBuilder->join(sprintf('%s.ticket', $rootAlias), 't');
            $queryBuilder->andWhere('t.owner = :current_user OR t.assignee = :current_user');
            $queryBuilder->setParameter('current_user', $user->getId());
        }
    }
}
