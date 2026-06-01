<?php

namespace App\Controller;

use App\Entity\Ticket;
use App\Entity\TicketHistory;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

class TicketNoteController extends AbstractController
{
    #[Route('/api/ticket-notes/{id}', name: 'add_ticket_note', methods: ['POST'])]
    public function addNote(
        int $id,
        Request $request,
        EntityManagerInterface $em,
        Security $security
    ): JsonResponse {
        $user = $security->getUser();
        if (!$user) {
            return new JsonResponse(['error' => 'No autenticado'], 401);
        }

        // Solo agentes y admins pueden añadir notas manuales
        if (!$this->isGranted('ROLE_AGENT') && !$this->isGranted('ROLE_ADMIN')) {
            return new JsonResponse(['error' => 'Acceso denegado'], 403);
        }

        $ticket = $em->getRepository(Ticket::class)->find($id);
        if (!$ticket) {
            return new JsonResponse(['error' => 'Ticket no encontrado'], 404);
        }

        $data = json_decode($request->getContent(), true);
        $note = trim($data['note'] ?? '');

        if (empty($note)) {
            return new JsonResponse(['error' => 'La nota no puede estar vacía'], 400);
        }

        if (strlen($note) > 1000) {
            return new JsonResponse(['error' => 'La nota no puede superar 1000 caracteres'], 400);
        }

        $history = new TicketHistory();
        $history->setTicket($ticket);
        $history->setAction('📝 Nota Manual');
        $history->setOldValue(null);
        $history->setNewValue($note);
        $history->setUser($user);

        $em->persist($history);
        $em->flush();

        return new JsonResponse([
            'id'        => $history->getId(),
            'action'    => $history->getAction(),
            'newValue'  => $history->getNewValue(),
            'oldValue'  => $history->getOldValue(),
            'createdAt' => $history->getCreatedAt()?->format(\DateTimeInterface::ATOM),
            'user'      => [
                'firstName' => $user->getFirstName() ?? '',
                'lastName'  => $user->getLastName() ?? '',
                'email'     => $user->getUserIdentifier(),
            ],
        ], 201);
    }
}
