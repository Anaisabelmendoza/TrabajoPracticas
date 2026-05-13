<?php

namespace App\State;

use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\Ticket;
use App\Service\PdfService;
use Symfony\Component\DependencyInjection\Attribute\Autowire;

class TicketDeleteProcessor implements ProcessorInterface
{
    public function __construct(
        #[Autowire(service: 'api_platform.doctrine.orm.state.remove_processor')]
        private ProcessorInterface $removeProcessor,
        private PdfService $pdfService
    ) {
    }

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): void
    {
        if ($data instanceof Ticket) {
            // 1. Verificar si se ha solicitado archivar mediante parámetro de consulta ?archive=true
            $request = $context['request'] ?? null;
            $shouldArchive = $request ? $request->query->getBoolean('archive', true) : true;

            if ($shouldArchive) {
                try {
                    $this->pdfService->archiveTicketPdf($data);
                } catch (\Exception $e) {
                    error_log("Error archivando ticket PDF: " . $e->getMessage());
                }
            }
        }

        // 2. Proceder con la eliminación real
        $this->removeProcessor->process($data, $operation, $uriVariables, $context);
    }
}
