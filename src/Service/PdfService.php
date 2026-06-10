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

        $monthDt = \DateTime::createFromFormat('Y-m', $month);
        if (!$monthDt) {
            $monthDt = new \DateTime();
        }
        $daysInMonth = (int) $monthDt->format('t');

        // Inicializar todos los días del mes
        for ($i = 1; $i <= $daysInMonth; $i++) {
            $dayStr = str_pad((string)$i, 2, '0', STR_PAD_LEFT);
            $dailyStats[$dayStr] = [
                'totalMinutes' => 0,
                'workMinutes' => 0
            ];
        }

        // Rellenar con los datos de conexión
        foreach ($connectionData as $date => $data) {
            if (str_starts_with($date, $month)) {
                $day = substr($date, 8, 2);
                if (isset($dailyStats[$day])) {
                    $dailyStats[$day]['totalMinutes'] = $data['totalMinutes'] ?? 0;
                    $totalMinutes += $dailyStats[$day]['totalMinutes'];
                }
            }
        }

        // Calcular horas de trabajo (WorkLogs)
        foreach ($agent->getWorkLogs() as $log) {
            $logDate = $log->getDate();
            if ($logDate && $logDate->format('Y-m') === $month) {
                $day = $logDate->format('d');
                if (isset($dailyStats[$day])) {
                    $dailyStats[$day]['workMinutes'] += $log->getMinutesSpent();
                }
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

    public function generateAllAgentsSessionPdf(array $agents, string $month): string
    {
        $options = new Options();
        $options->set('defaultFont', 'Helvetica');
        $dompdf = new Dompdf($options);

        $agentsData = [];
        
        $monthDt = \DateTime::createFromFormat('Y-m', $month);
        $daysInMonth = $monthDt ? (int)$monthDt->format('t') : 31;

        foreach ($agents as $agent) {
            $connectionData = $agent->getConnectionData() ?: [];
            $totalMinutes = 0;
            $dailyStats = [];

            for ($i = 1; $i <= $daysInMonth; $i++) {
                $dayStr = str_pad((string)$i, 2, '0', STR_PAD_LEFT);
                $dailyStats[$dayStr] = [
                    'totalMinutes' => 0,
                    'workMinutes' => 0
                ];
            }

            foreach ($connectionData as $date => $data) {
                if (str_starts_with($date, $month)) {
                    $day = substr($date, 8, 2);
                    if (isset($dailyStats[$day])) {
                        $dailyStats[$day]['totalMinutes'] = $data['totalMinutes'] ?? 0;
                        $totalMinutes += $dailyStats[$day]['totalMinutes'];
                    }
                }
            }
            
            // Calcular horas de trabajo
            foreach ($agent->getWorkLogs() as $log) {
                $logDate = $log->getDate();
                if ($logDate) {
                    $formattedLogMonth = $logDate->format('Y-m');
                    $match = ($formattedLogMonth === $month) ? 'YES' : 'NO';
                    error_log("DEBUG PDF: Agent " . $agent->getId() . " | Log Date: " . $logDate->format('Y-m-d') . " | Log Month: " . $formattedLogMonth . " | Query Month: " . $month . " | Match: " . $match);
                }
                if ($logDate && $logDate->format('Y-m') === $month) {
                    $day = $logDate->format('d');
                    if (isset($dailyStats[$day])) {
                        $dailyStats[$day]['workMinutes'] += $log->getMinutesSpent();
                    }
                }
            }

            ksort($dailyStats);

            $agentsData[] = [
                'agent' => $agent,
                'totalMinutes' => $totalMinutes,
                'dailyStats' => $dailyStats
            ];
        }

        $monthDt = \DateTime::createFromFormat('Y-m', $month);
        $html = $this->twig->render('pdf/all_agents_sessions.html.twig', [
            'agentsData' => $agentsData,
            'monthName' => $monthDt ? $monthDt->format('F') : $month,
            'year' => $monthDt ? $monthDt->format('Y') : ''
        ]);

        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4', 'portrait');
        $dompdf->render();

        return $dompdf->output();
    }
}
