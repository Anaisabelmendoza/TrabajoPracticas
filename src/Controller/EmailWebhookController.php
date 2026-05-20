<?php

namespace App\Controller;

use App\Entity\Ticket;
use App\Entity\User;
use App\Entity\Category;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

class EmailWebhookController extends AbstractController
{
    #[Route('/api/webhooks/email', name: 'api_webhook_email', methods: ['POST'])]
    public function receiveEmail(Request $request, EntityManagerInterface $em): JsonResponse
    {
        // En un entorno real, aquí recibirías el JSON de Mailgun, SendGrid, etc.
        $data = json_decode($request->getContent(), true);

        if (!$data) {
            return new JsonResponse(['error' => 'Invalid JSON'], 400);
        }

        // Parámetros esperados (ejemplo):
        // sender: email del cliente
        // subject: título de la incidencia
        // body: descripción
        $senderEmail = $data['sender'] ?? null;
        $subject = $data['subject'] ?? 'Nueva incidencia por Email';
        $body = $data['body'] ?? 'Sin descripción';

        if (!$senderEmail) {
            return new JsonResponse(['error' => 'Sender email is required'], 400);
        }

        // 1. Buscar o crear el usuario autor
        $author = $em->getRepository(User::class)->findOneBy(['email' => $senderEmail]);
        
        if (!$author) {
            // Opcional: Crear un usuario "Invitado" si no existe
            $author = new User();
            $author->setEmail($senderEmail);
            $author->setFirstName('Cliente');
            $author->setLastName('Externo (Email)');
            $author->setPassword('no-password'); // O un hash aleatorio
            $author->setRoles(['ROLE_USER']);
            $em->persist($author);
        }

        // 2. Obtener una categoría por defecto
        $category = $em->getRepository(Category::class)->findOneBy([]) ?: null;
        if (!$category) {
            $category = new Category();
            $category->setName('Email / General');
            $em->persist($category);
        }

        // 3. Crear el Ticket
        $ticket = new Ticket();
        $ticket->setTitle($subject);
        $ticket->setDescription("RECIBIDO POR EMAIL: \n\n" . $body);
        $ticket->setAuthor($author);
        $ticket->setCategory($category);
        $ticket->setStatus('Nuevo'); // Al ser nuevo, aparecerá a todos los agentes
        $ticket->setPriority('Media');

        $em->persist($ticket);
        $em->flush();

        return new JsonResponse([
            'status' => 'Ticket created successfully',
            'ticket_id' => $ticket->getId()
        ], 201);
    }
}
