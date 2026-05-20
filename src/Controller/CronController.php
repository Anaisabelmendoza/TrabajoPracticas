<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Console\Input\ArrayInput;
use Symfony\Component\Console\Output\BufferedOutput;
use Symfony\Component\HttpKernel\KernelInterface;
use Symfony\Bundle\FrameworkBundle\Console\Application;

class CronController extends AbstractController
{
    #[Route('/api/cron/close-tickets', name: 'app_cron_close_tickets')]
    public function closeTickets(KernelInterface $kernel): Response
    {
        // Obtener el token de forma robusta de cualquier entorno (Render, local .env, etc.)
        $cronToken = $_ENV['CRON_TOKEN'] ?? $_SERVER['CRON_TOKEN'] ?? getenv('CRON_TOKEN') ?: null;

        $token = $_GET['token'] ?? '';
        if (!$cronToken || $token !== $cronToken) {
            return new Response('Acceso denegado', 403);
        }

        $application = new Application($kernel);
        $application->setAutoExit(false);

        $input = new ArrayInput(['command' => 'app:auto-close-tickets']);
        $output = new BufferedOutput();
        $application->run($input, $output);

        return new Response($output->fetch());
    }
}
