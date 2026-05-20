<?php

namespace App\Repository;

use App\Entity\Ticket;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Ticket>
 */
class TicketRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Ticket::class);
    }

    public function getDashboardStatistics(?int $categoryId, ?string $status, ?string $priority, ?int $agentId, ?string $startDate = null, ?string $endDate = null): array
    {
        $qb = $this->createQueryBuilder('t');

        if ($categoryId) {
            $qb->andWhere('t.category = :cat')->setParameter('cat', $categoryId);
        }
        if ($status) {
            $qb->andWhere('t.status = :status')->setParameter('status', $status);
        }
        if ($priority) {
            $qb->andWhere('t.priority = :prio')->setParameter('prio', $priority);
        }
        if ($agentId) {
            $qb->andWhere('t.agent = :agent')->setParameter('agent', $agentId);
        }
        if ($startDate) {
            $qb->andWhere('t.createdAt >= :startDate')->setParameter('startDate', new \DateTime($startDate.' 00:00:00'));
        }
        if ($endDate) {
            $qb->andWhere('t.createdAt <= :endDate')->setParameter('endDate', new \DateTime($endDate.' 23:59:59'));
        }

        $baseQb = clone $qb;

        $total = (int) (clone $baseQb)->select('COUNT(t.id)')->getQuery()->getSingleScalarResult();

        $byStatus = (clone $baseQb)->select('t.status, COUNT(t.id) as count')
            ->groupBy('t.status')->getQuery()->getArrayResult();

        $byPriority = (clone $baseQb)->select('t.priority, COUNT(t.id) as count')
            ->groupBy('t.priority')->getQuery()->getArrayResult();

        $byCategory = (clone $baseQb)->select('c.name as category_name, COUNT(t.id) as count')
            ->leftJoin('t.category', 'c')
            ->groupBy('t.category, c.name')->getQuery()->getArrayResult();

        $byAgent = (clone $baseQb)->select('u.firstName, u.lastName, COUNT(t.id) as count')
            ->leftJoin('t.agent', 'u')
            ->andWhere('t.agent IS NOT NULL')
            ->groupBy('t.agent, u.firstName, u.lastName')->getQuery()->getArrayResult();

        $criticalPending = (int) (clone $baseQb)->select('COUNT(t.id)')
            ->andWhere('t.priority IN (\'Alta\', \'Crítica\')')
            ->andWhere('t.status NOT IN (\'Resuelto\', \'Cerrado\')')
            ->getQuery()->getSingleScalarResult();

        $byAgentDaily = (clone $baseQb)->select('u.firstName, u.lastName, SUBSTRING(t.createdAt, 1, 10) as date, COUNT(t.id) as count')
            ->leftJoin('t.agent', 'u')
            ->andWhere('t.agent IS NOT NULL')
            ->groupBy('date, t.agent, u.firstName, u.lastName')
            ->orderBy('date', 'ASC')
            ->getQuery()->getArrayResult();

        return [
            'total' => $total,
            'by_status' => $byStatus,
            'by_priority' => $byPriority,
            'by_category' => $byCategory,
            'by_agent' => $byAgent,
            'by_agent_daily' => $byAgentDaily,
            'critical_pending_count' => $criticalPending,
        ];
    }
}
