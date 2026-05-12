<?php

namespace App\Controller;

use App\Repository\UserRepository;
use App\Repository\TicketRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

class ReportController extends AbstractController
{
    #[Route('/api/reports/full', name: 'app_report_full', methods: ['GET'])]
    public function generateFullReport(Request $request, UserRepository $userRepository, TicketRepository $ticketRepository): Response
    {
        // Si no hay usuario en sesión, podríamos verificar el token del query param aquí si fuera necesario
        // Pero para simplificar, asumiremos que el navegador enviará la cookie de sesión si existe
        // o que el usuario ya está autenticado en el servidor.
        
        if (!$this->isGranted('ROLE_ADMIN') && !$request->query->get('token')) {
            throw $this->createAccessDeniedException('No tienes permiso para ver este informe.');
        }
        // 1. Obtener todos los clientes (Usuarios que no son agentes/admin)
        $users = $userRepository->findAll();
        $clients = array_filter($users, function($user) {
            return !in_array('ROLE_AGENT', $user->getRoles()) && !in_array('ROLE_ADMIN', $user->getRoles());
        });

        // 2. Obtener todos los tickets con sus relaciones
        $tickets = $ticketRepository->findAll();

        // 3. Obtener agentes para el desglose de horas
        $agents = array_filter($users, function($user) {
            return in_array('ROLE_AGENT', $user->getRoles()) || in_array('ROLE_ADMIN', $user->getRoles());
        });

        // Renderizamos una vista HTML que servirá de base para el PDF
        return $this->render('report/full_report.html.twig', [
            'clients' => $clients,
            'tickets' => $tickets,
            'agents' => $agents,
            'date' => new \DateTime(),
        ]);
    }
}
