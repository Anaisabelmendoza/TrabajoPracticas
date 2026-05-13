<?php

namespace App\Service;

use App\Entity\Ticket;
use Dompdf\Dompdf;
use Dompdf\Options;
use Symfony\Component\DependencyInjection\ParameterBag\ParameterBagInterface;
use Twig\Environment;

class PdfService
{
    private $twig;
    private $params;

    public function __construct(Environment $twig, ParameterBagInterface $params)
    {
        $this->twig = $twig;
        $this->params = $params;
    }

    public function archiveTicketPdf(Ticket $ticket): string
    {
        // 1. Configurar Dompdf
        $options = new Options();
        $options->set('defaultFont', 'Helvetica');
        $options->set('isRemoteEnabled', true);
        
        $dompdf = new Dompdf($options);

        // 2. Renderizar el HTML usando Twig
        $html = $this->twig->render('pdf/ticket_archive.html.twig', [
            'ticket' => $ticket,
            'date' => new \DateTime()
        ]);

        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4', 'portrait');
        $dompdf->render();

        // 3. Definir la ruta de guardado
        $clientEmail = $ticket->getAuthor() ? $ticket->getAuthor()->getEmail() : 'unknown';
        $safeEmail = str_replace(['@', '.'], '_', $clientEmail);
        
        $targetDir = $this->params->get('kernel.project_dir') . '/public/uploads/pdf_archive/' . $safeEmail;
        
        if (!file_exists($targetDir)) {
            mkdir($targetDir, 0777, true);
        }

        $filename = sprintf(
            'ticket_%d_%s_%s.pdf',
            $ticket->getId(),
            $ticket->getCreatedAt()->format('Ymd'),
            uniqid()
        );

        $outputPath = $targetDir . '/' . $filename;
        file_put_contents($outputPath, $dompdf->output());

        return $outputPath;
    }

    public function generateAgentSessionPdf(\App\Entity\User $agent, string $month): string
    {
        $options = new Options();
        $options->set('defaultFont', 'Helvetica');
        $dompdf = new Dompdf($options);

        $connectionData = $agent->getConnectionData() ?: [];
        $dailyStats = [];
        $totalMinutes = 0;

        // Filtrar por el mes solicitado (Formato Y-m)
        foreach ($connectionData as $date => $data) {
            if (str_starts_with($date, $month)) {
                $day = substr($date, 8, 2);
                
                // Calcular horas de trabajo (WorkLogs) para ese día
                $workMinutes = 0;
                foreach ($agent->getWorkLogs() as $log) {
                    if ($log->getDate()->format('Y-m-d') === $date) {
                        $workMinutes += $log->getMinutesSpent();
                    }
                }

                $dailyStats[$day] = [
                    'segments' => $data['segments'] ?? [],
                    'totalMinutes' => $data['totalMinutes'] ?? 0,
                    'workMinutes' => $workMinutes
                ];
                $totalMinutes += ($data['totalMinutes'] ?? 0);
            }
        }

        ksort($dailyStats);

        $monthDt = \DateTime::createFromFormat('Y-m', $month);
        $html = $this->twig->render('pdf/agent_sessions.html.twig', [
            'agent' => $agent,
            'monthName' => $monthDt ? $monthDt->format('F') : $month,
            'year' => $monthDt ? $monthDt->format('Y') : '',
            'dailyStats' => $dailyStats,
            'totalMinutes' => $totalMinutes
        ]);

        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4', 'portrait');
        $dompdf->render();

        return $dompdf->output();
    }
}
