<?php

namespace App\Command;

use App\Entity\Ticket;
use App\Entity\TicketHistory;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

use Symfony\Component\Console\Input\InputOption;

#[AsCommand(
    name: 'app:auto-close-tickets',
    description: 'Cierra automáticamente tickets resueltos tras 3 días de inactividad.',
)]
class AutoCloseTicketsCommand extends Command
{
    private EntityManagerInterface $entityManager;

    public function __construct(EntityManagerInterface $entityManager)
    {
        parent::__construct();
        $this->entityManager = $entityManager;
    }

    protected function configure(): void
    {
        $this->addOption('loop', 'l', InputOption::VALUE_NONE, 'Ejecutar en bucle (cada hora)');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $loop = $input->getOption('loop');

        do {
            $io->info(sprintf("[%s] Buscando tickets resueltos para auto-cierre...", date('H:i:s')));

            $repo = $this->entityManager->getRepository(Ticket::class);
            $resolvedTickets = $repo->findBy(['status' => 'Resuelto']);

            $now = new \DateTimeImmutable();
            $closedCount = 0;

            foreach ($resolvedTickets as $ticket) {
                $updatedAt = $ticket->getUpdatedAt() ?: $ticket->getCreatedAt();
                
                // Calculamos la diferencia en días
                $diff = $now->diff($updatedAt);
                $days = $diff->days;

                if ($days >= 3) {
                    $ticket->setStatus('Cerrado');
                    
                    // Añadimos entrada al historial
                    $history = new TicketHistory();
                    $history->setTicket($ticket);
                    $history->setAction('Cierre Automático');
                    $history->setOldValue('Resuelto');
                    $history->setNewValue('Cerrado');
                    $this->entityManager->persist($history);

                    $closedCount++;
                }
            }

            $this->entityManager->flush();

            if ($closedCount > 0) {
                $io->success(sprintf('Se han cerrado %d tickets automáticamente.', $closedCount));
            } else {
                $io->info('No hay tickets para cerrar en este momento.');
            }

            if ($loop) {
                $io->text("Esperando 1 hora para el próximo escaneo... (Ctrl+C para parar)");
                sleep(3600);
            }
        } while ($loop);

        return Command::SUCCESS;
    }
}
