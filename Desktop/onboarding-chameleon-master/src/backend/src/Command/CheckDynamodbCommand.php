<?php

namespace App\Command;

use AsyncAws\DynamoDb\DynamoDbClient;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'app:check-dynamodb',
    description: 'Check dynamodb tables',
)]
class CheckDynamodbCommand extends Command
{

    private DynamoDbClient $dynamoDbClient;

    public function __construct(DynamoDbClient $dynamoDbClient)
    {
        $this->dynamoDbClient = $dynamoDbClient;
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->setDescription('Verifica la conexión a DynamoDB y lista las tablas existentes.')
            ->setHelp('Este comando verifica la conexión a DynamoDB Local y lista todas las tablas disponibles.');
    }


    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        try {
            $output->writeln('<info>Conectando a DynamoDB...</info>');

            $tables = $this->dynamoDbClient->listTables()->getTableNames();

            if (empty($tables)) {
                $output->writeln('<comment>No se encontraron tablas en DynamoDB.</comment>');
            } else {
                $output->writeln('<info>Tablas encontradas:</info>');
                foreach ($tables as $table) {
                    $output->writeln('- ' . $table);
                }
            }

            $output->writeln('<info>Verificación completa.</info>');
            return Command::SUCCESS;
        } catch (\Exception $e) {
            $output->writeln('<error>Error al conectar con DynamoDB: ' . $e->getMessage() . '</error>');
            return Command::FAILURE;
        }
    }
}
