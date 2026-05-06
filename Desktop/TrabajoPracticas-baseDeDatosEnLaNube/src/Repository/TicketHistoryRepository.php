<?php

namespace App\Repository;

use App\Entity\TicketHistory;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<TicketHistory>
 *
 * @method TicketHistory|null find($id, $lockMode = null, $lockVersion = null)
 * @method TicketHistory|null findOneBy(array $criteria, array $orderBy = null)
 * @method TicketHistory[]    findAll()
 * @method TicketHistory[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class TicketHistoryRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, TicketHistory::class);
    }
}
