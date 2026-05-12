<?php

namespace App\Command;

use App\Entity\Ticket;
use App\Entity\User;
use App\Entity\Category;
use App\Service\EmailFetchService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'app:fetch-emails',
    description: 'Lee correos de Gmail y los convierte en incidencias',
)]
class FetchEmailsCommand extends Command
{
    private EmailFetchService $emailFetchService;

    public function __construct(EmailFetchService $emailFetchService)
    {
        parent::__construct();
        $this->emailFetchService = $emailFetchService;
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);

        $emailUser = $_ENV['GMAIL_USER'] ?? null;
        $emailPass = $_ENV['GMAIL_APP_PASS'] ?? null;

        if (!$emailUser || !$emailPass) {
            $io->error('GMAIL_USER o GMAIL_APP_PASS no están configurados en el .env');
            return Command::FAILURE;
        }

        $io->note("Conectando a Gmail para sincronizar correos...");

        try {
            $stats = $this->emailFetchService->fetchAndSyncEmails($emailUser, $emailPass);
            
            if ($stats['created'] > 0) {
                $io->success(sprintf('Se han creado %d tickets nuevos desde Gmail.', $stats['created']));
            } else {
                $io->info('No hay correos nuevos.');
            }

            if ($stats['errors'] > 0) {
                $io->warning(sprintf('Hubo %d errores durante la sincronización.', $stats['errors']));
                foreach ($stats['messages'] as $msg) {
                    $io->text(" - $msg");
                }
            }

            return Command::SUCCESS;
        } catch (\Exception $e) {
            $io->error($e->getMessage());
            return Command::FAILURE;
        }
    }
}
