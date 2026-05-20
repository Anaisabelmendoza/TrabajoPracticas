<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\DependencyInjection\ParameterBag\ParameterBagInterface;
use Symfony\Component\Finder\Finder;

class PdfArchiveController extends AbstractController
{
    #[Route('/api/pdf-archive', name: 'api_pdf_archive_list', methods: ['GET'])]
    public function list(ParameterBagInterface $params): JsonResponse
    {
        $archiveDir = $params->get('kernel.project_dir') . '/public/uploads/pdf_archive';
        
        if (!file_exists($archiveDir)) {
            return new JsonResponse([]);
        }

        $finder = new Finder();
        $finder->files()->in($archiveDir)->name('*.pdf');

        $files = [];
        foreach ($finder as $file) {
            // El path relativo para el frontend sería /uploads/pdf_archive/...
            $relativePath = str_replace($params->get('kernel.project_dir') . '/public', '', $file->getRealPath());
            
            // Extraer email del cliente de la carpeta padre
            $folderName = basename(dirname($file->getRealPath()));
            $clientEmail = str_replace('_', '.', $folderName); // Aproximación

            $files[] = [
                'filename' => $file->getFilename(),
                'path' => $relativePath,
                'client' => $clientEmail,
                'date' => date("Y-m-d H:i:s", $file->getMTime()),
                'size' => $file->getSize()
            ];
        }

        // Ordenar por fecha descendente
        usort($files, fn($a, $b) => $b['date'] <=> $a['date']);

        return new JsonResponse($files);
    }
}
