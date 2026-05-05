<?php

namespace App\Controller;

use App\Repository\TicketRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

class StatisticsController extends AbstractController
{
    #[Route('/api/statistics', name: 'api_statistics', methods: ['GET'])]
    #[IsGranted('ROLE_ADMIN')]
    public function getStatistics(Request $request, TicketRepository $ticketRepository): JsonResponse
    {
        $categoryId = $request->query->get('category') ? (int) $request->query->get('category') : null;
        $status = $request->query->get('status');
        $priority = $request->query->get('priority');
        $agentId = $request->query->get('agent') ? (int) $request->query->get('agent') : null;

        $stats = $ticketRepository->getDashboardStatistics($categoryId, $status, $priority, $agentId);

        return $this->json($stats);
    }
}
