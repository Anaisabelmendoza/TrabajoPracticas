<?php

namespace App\Controller;

use App\Service\EmailFetchService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

class EmailSyncController extends AbstractController
{
    #[Route('/api/sync-emails', name: 'api_sync_emails', methods: ['POST'])]
    public function sync(EmailFetchService $emailFetchService): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_ADMIN');

        $emailUser = $_ENV['GMAIL_USER'] ?? null;
        $emailPass = $_ENV['GMAIL_APP_PASS'] ?? null;

        if (!$emailUser || !$emailPass) {
            return new JsonResponse(['error' => 'Configuración de Gmail faltante en .env'], 400);
        }

        try {
            $stats = $emailFetchService->fetchAndSyncEmails($emailUser, $emailPass);
            return new JsonResponse($stats);
        } catch (\Throwable $e) {
            error_log("SYNC ERROR: " . $e->getMessage() . " in " . $e->getFile() . ":" . $e->getLine());
            return new JsonResponse([
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ], 500);
        }
    }
}
