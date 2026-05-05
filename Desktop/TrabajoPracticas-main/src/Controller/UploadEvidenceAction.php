<?php

namespace App\Controller;

use App\Entity\Evidence;
use App\Entity\Ticket;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\File\Exception\FileException;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Attribute\AsController;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Bundle\SecurityBundle\Security;

#[AsController]
class UploadEvidenceAction extends AbstractController
{
    private Security $security;

    public function __construct(Security $security)
    {
        $this->security = $security;
    }

    public function __invoke(Request $request, EntityManagerInterface $entityManager): Evidence
    {
        $uploadedFile = $request->files->get('file');
        $ticketId = $request->request->get('ticket_id');

        if (!$uploadedFile) {
            throw new BadRequestHttpException('El archivo "file" es obligatorio.');
        }

        if (!$ticketId) {
            throw new BadRequestHttpException('El campo "ticket_id" es obligatorio.');
        }

        $ticket = $entityManager->getRepository(Ticket::class)->find($ticketId);

        if (!$ticket) {
            throw new NotFoundHttpException(sprintf('Ticket con ID %d no encontrado.', $ticketId));
        }

        // SEGURIDAD: Solo el dueño, el asignado o un admin/agente pueden subir evidencias
        $user = $this->security->getUser();
        if (!$this->security->isGranted('ROLE_ADMIN') && 
            !$this->security->isGranted('ROLE_AGENT') && 
            $ticket->getOwner() !== $user && 
            $ticket->getAssignee() !== $user) {
            throw new AccessDeniedHttpException('No tienes permiso para adjuntar evidencias a este ticket.');
        }

        // VALIDACIÓN DE INTEGRIDAD (OWASP A08): Verificar tipo MIME real, no solo la extensión
        $allowedMimeTypes = ['image/jpeg', 'image/png', 'application/pdf', 'image/webp'];
        $mimeType = $uploadedFile->getMimeType();

        if (!in_array($mimeType, $allowedMimeTypes)) {
            throw new BadRequestHttpException(sprintf('Tipo de archivo no permitido (%s). Solo se aceptan JPG, PNG, WEBP y PDF.', $mimeType));
        }

        $destination = $this->getParameter('kernel.project_dir') . '/public/uploads/evidences';
        $originalFilename = pathinfo($uploadedFile->getClientOriginalName(), PATHINFO_FILENAME);
        $newFilename = uniqid() . '-' . $originalFilename . '.' . $uploadedFile->guessExtension();

        try {
            $uploadedFile->move($destination, $newFilename);
        } catch (FileException $e) {
            throw new BadRequestHttpException('Error al subir el archivo al servidor.');
        }

        $evidence = new Evidence();
        $evidence->setFilePath('/uploads/evidences/' . $newFilename);
        $evidence->setTicket($ticket);

        $entityManager->persist($evidence);
        $entityManager->flush();

        return $evidence;
    }
}
