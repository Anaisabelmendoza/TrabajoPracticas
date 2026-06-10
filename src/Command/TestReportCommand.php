<?php

namespace App\Command;

use App\Repository\UserRepository;
use Twig\Environment;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;

#[AsCommand(
    name: 'app:test-report',
    description: 'Debugs the worklogs calculation for the report',
)]
class TestReportCommand extends Command
{
    private UserRepository $userRepository;
    private Environment $twig;
    private \App\Service\PdfService $pdfService;

    public function __construct(UserRepository $userRepository, Environment $twig, \App\Service\PdfService $pdfService)
    {
        parent::__construct();
        $this->userRepository = $userRepository;
        $this->twig = $twig;
        $this->pdfService = $pdfService;
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $users = $this->userRepository->findAll();
        $agents = array_filter($users, function($user) {
            return in_array('ROLE_AGENT', $user->getRoles()) || in_array('ROLE_ADMIN', $user->getRoles());
        });

        $month = '2026-06';
        
        // Generate PDF
        $pdfContent = $this->pdfService->generateAllAgentsSessionPdf($agents, $month);
        file_put_contents(dirname(dirname(__DIR__)).'/scratch/all_agents_test.pdf', $pdfContent);
        $output->writeln("PDF WRITTEN TO scratch/all_agents_test.pdf");

        $agents = array_filter($users, function($user) {
            return in_array('ROLE_AGENT', $user->getRoles()) || in_array('ROLE_ADMIN', $user->getRoles());
        });

        $month = '2026-06';
        $daysInMonth = 30; // June has 30 days

        $output->writeln("DEBUGGING WORKLOGS FOR AGENTS IN $month:");

        $agentsData = [];
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
            $output->writeln("Agent: " . $agent->getFirstName() . " " . $agent->getLastName() . " (ID: " . $agent->getId() . ")");
            $output->writeln("  Total workLogs in DB collection: " . count($agent->getWorkLogs()));
            
            foreach ($agent->getWorkLogs() as $log) {
                $logDate = $log->getDate();
                if ($logDate && $logDate->format('Y-m') === $month) {
                    $day = $logDate->format('d');
                    if (isset($dailyStats[$day])) {
                        $dailyStats[$day]['workMinutes'] += $log->getMinutesSpent();
                        $output->writeln("    - Added log ID " . $log->getId() . " | " . $log->getMinutesSpent() . " mins to day $day");
                    } else {
                        $output->writeln("    - Day $day not found in dailyStats");
                    }
                } else {
                    $output->writeln("    - Log ID " . $log->getId() . " has date " . ($logDate ? $logDate->format('Y-m-d') : 'NULL') . " (does not match $month)");
                }
            }

            ksort($dailyStats);

            $agentsData[] = [
                'agent' => $agent,
                'totalMinutes' => $totalMinutes,
                'dailyStats' => $dailyStats
            ];
        }

        // Output daily stats summary
        foreach ($agentsData as $item) {
            $output->writeln("\nSummary for " . $item['agent']->getFirstName() . " " . $item['agent']->getLastName() . ":");
            foreach ($item['dailyStats'] as $day => $data) {
                if ($data['workMinutes'] > 0 || $data['totalMinutes'] > 0) {
                    $output->writeln("  Day $day: totalMinutes=" . $data['totalMinutes'] . ", workMinutes=" . $data['workMinutes']);
                }
            }
        }

        return Command::SUCCESS;
    }
}
