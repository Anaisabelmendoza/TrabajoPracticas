<?php

use App\Kernel;
use App\Entity\User;

require dirname(__DIR__).'/vendor/autoload.php';

use Symfony\Component\Dotenv\Dotenv;
(new Dotenv())->bootEnv(dirname(__DIR__).'/.env');

$kernel = new Kernel('dev', true);
$kernel->boot();

$container = $kernel->getContainer();
// Use the test service container to access private services in dev mode, or we can get twig directly
$twig = $container->get('test.service_container')->get('twig');
$entityManager = $container->get('test.service_container')->get('doctrine')->getManager();

$userRepo = $entityManager->getRepository(User::class);
$users = $userRepo->findAll();
$agents = array_filter($users, function($user) {
    return in_array('ROLE_AGENT', $user->getRoles()) || in_array('ROLE_ADMIN', $user->getRoles());
});

$month = '2026-06';
$monthDt = \DateTime::createFromFormat('Y-m', $month);
$daysInMonth = 30; // June has 30 days

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

    $agentsData[] = [
        'agent' => $agent,
        'totalMinutes' => $totalMinutes,
        'dailyStats' => $dailyStats
    ];
}

$html = $twig->render('pdf/all_agents_sessions.html.twig', [
    'agentsData' => $agentsData,
    'monthName' => 'June',
    'year' => '2026'
]);

file_put_contents(dirname(__DIR__).'/scratch/rendered_report.html', $html);
echo "RENDERED REPORT HTML WRITTEN TO scratch/rendered_report.html\n";

// Let's print out the dailyStats for Diego Blázquez (ID: 4)
foreach ($agentsData as $item) {
    if ($item['agent']->getId() === 4) {
        echo "\nDiego Blázquez daily stats:\n";
        foreach ($item['dailyStats'] as $day => $data) {
            if ($data['workMinutes'] > 0 || $data['totalMinutes'] > 0) {
                echo "  Day $day: totalMinutes=" . $data['totalMinutes'] . ", workMinutes=" . $data['workMinutes'] . "\n";
            }
        }
    }
}
