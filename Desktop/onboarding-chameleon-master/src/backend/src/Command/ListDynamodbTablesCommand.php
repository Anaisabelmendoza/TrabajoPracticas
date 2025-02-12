<?php

namespace App\Command;

use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use AsyncAws\DynamoDb\DynamoDbClient;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'app:list-dynamodb-tables',
    description: 'Add a short description for your command',
)]
class ListDynamodbTablesCommand extends Command
{
    private const REGIONS = [
        'us-east-1',
        'us-west-1',
        'us-west-2',
        'eu-west-1',
        'eu-west-2',
        'eu-central-1',
        'ap-southeast-1',
        'ap-southeast-2',
        'ap-northeast-1',
        'ap-northeast-2',
        'sa-east-1',
    ];

    public function __construct()
    {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->setDescription('Lista las tablas en todas las regiones posibles de DynamoDB')
            ->setHelp('Este comando verifica las tablas existentes en todas las regiones disponibles para identificar posibles discrepancias.');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $output->writeln('<info>Buscando tablas en todas las regiones...</info>');

        foreach (self::REGIONS as $region) {
            $output->writeln("<comment>Región: $region</comment>");
            
            try {
                $client = new DynamoDbClient([
                    'region' => $region,
                    'endpoint' => 'http://dynamodb:8000',
                    'accessKeyId' => 'codearts',
                    'accessKeySecret' => 'codearts',
                ]);

                $tables = $client->listTables()->getTableNames();

                if (empty($tables)) {
                    $output->writeln('<comment>No se encontraron tablas en esta región.</comment>');
                } else {
                    foreach ($tables as $table) {
                        $output->writeln(" - $table");
                    }
                }
            } catch (\Exception $e) {
                $output->writeln("<error>Error al conectar en la región $region: {$e->getMessage()}</error>");
            }
        }

        $output->writeln('<info>Búsqueda completada.</info>');

        return Command::SUCCESS;
    }
}
