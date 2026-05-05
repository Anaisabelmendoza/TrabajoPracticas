<?php

namespace App\Controller;

use App\Entity\Ticket;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\File\Exception\FileException;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\String\Slugger\SluggerInterface;

class AttachmentController extends AbstractController
{
    #[Route('/api/tickets/{id}/upload', name: 'app_ticket_upload', methods: ['POST'])]
    public function upload(
        int $id,
        Request $request,
        EntityManagerInterface $em,
        SluggerInterface $slugger
    ): JsonResponse {
        $ticket = $em->getRepository(Ticket::class)->find($id);
        if (!$ticket) {
            return new JsonResponse(['error' => 'Ticket no encontrado'], 404);
        }

        /** @var UploadedFile $file */
        $file = $request->files->get('file');

        if (!$file) {
            return new JsonResponse(['error' => 'No se ha enviado ningún archivo'], 400);
        }

        // VALIDACIÓN SEGURIDAD (MIME TYPES)
        $allowedExtensions = ['jpg', 'jpeg', 'png', 'pdf'];
        $extension = $file->getClientOriginalExtension();

        if (!in_array($extension, $allowedExtensions)) {
            return new JsonResponse(['error' => 'Formato no permitido. Solo JPG, PNG o PDF'], 400);
        }

        $originalFilename = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
        $safeFilename = $slugger->slug($originalFilename);
        $newFilename = $safeFilename.'-'.uniqid().'.'.$extension;

        try {
            $file->move(
                $this->getParameter('kernel.project_dir').'/public/uploads/attachments',
                $newFilename
            );
        } catch (FileException $e) {
            return new JsonResponse(['error' => 'Error al guardar el archivo'], 500);
        }

        // ACTUALIZAR TICKET
        $currentAttachments = $ticket->getAttachments() ?? [];
        $currentAttachments[] = '/uploads/attachments/'.$newFilename;
        $ticket->setAttachments($currentAttachments);

        $em->flush();

        return new JsonResponse([
            'message' => 'Archivo subido con éxito',
            'path' => '/uploads/attachments/'.$newFilename
        ]);
    }

    #[Route('/api/upload', name: 'app_generic_upload', methods: ['POST'])]
    public function uploadGeneric(
        Request $request,
        SluggerInterface $slugger
    ): JsonResponse {
        /** @var UploadedFile $file */
        $file = $request->files->get('file');

        error_log("Upload started at " . date('Y-m-d H:i:s'));
        if (!$file) {
            error_log("No file found in request");
            return new JsonResponse(['error' => 'No se ha enviado ningún archivo'], 400);
        }
        error_log("File received: " . $file->getClientOriginalName());

        $allowedExtensions = ['jpg', 'jpeg', 'png', 'pdf'];
        $extension = $file->getClientOriginalExtension();

        if (!in_array($extension, $allowedExtensions)) {
            error_log("Invalid extension: " . $extension);
            return new JsonResponse(['error' => 'Formato no permitido'], 400);
        }

        $originalFilename = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
        $safeFilename = $slugger->slug($originalFilename);
        $newFilename = $safeFilename.'-'.uniqid().'.'.$extension;

        try {
            $dest = $this->getParameter('kernel.project_dir').'/public/uploads/attachments';
            error_log("Moving file to: " . $dest);
            $file->move($dest, $newFilename);
        } catch (FileException $e) {
            error_log("File error: " . $e->getMessage());
            return new JsonResponse(['error' => 'Error al guardar'], 500);
        }

        error_log("Upload success: " . $newFilename);
        return new JsonResponse([
            'path' => '/uploads/attachments/'.$newFilename
        ]);
    }
}
