<?php

namespace App\Repository;

use App\Entity\Demo;
use App\Entity\Product;
use AsyncAws\DynamoDb\DynamoDbClient;
use AsyncAws\DynamoDb\Input\DeleteItemInput;
use AsyncAws\DynamoDb\Input\PutItemInput;
use AsyncAws\DynamoDb\Input\QueryInput;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Demo>
 */
class DemoRepository extends ServiceEntityRepository
{
    private DynamoDbClient $dynamoDbClient;

    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Demo::class);
    }

    public function findById($id): ?Demo
    {
        $input = new QueryInput([
            'TableName' => 'demo',
            'KeyConditionExpression' => 'id = :id',
            'ExpressionAttributeValues' => [
                ':id' => ['S' => $id],
            ],
        ]);

        $result = $this->dynamoDbClient->query($input);

        if (!$result->getItems()) {
            return null;
        }
 
        $item = $result->getItems()[0];
        $demo = new Demo();
        $demo->setId($item['id']->getS());
    }

    //    /**
    //     * @return Demo[] Returns an array of Demo objects
    //     */
    //    public function findByExampleField($value): array
    //    {
    //        return $this->createQueryBuilder('d')
    //            ->andWhere('d.exampleField = :val')
    //            ->setParameter('val', $value)
    //            ->orderBy('d.id', 'ASC')
    //            ->setMaxResults(10)
    //            ->getQuery()
    //            ->getResult()
    //        ;
    //    }

    //    public function findOneBySomeField($value): ?Demo
    //    {
    //        return $this->createQueryBuilder('d')
    //            ->andWhere('d.exampleField = :val')
    //            ->setParameter('val', $value)
    //            ->getQuery()
    //            ->getOneOrNullResult()
    //        ;
    //    }
    public function save(Product $product): string
    {
        $input = new PutItemInput([
            'TableName' => 'products',
            'Item' => [
                'id' => ['S' => $product->getId()],
                'name' => ['S' => $product->getName()],
                'price' => ['N' => (string) $product->getPrice()],
            ],
        ]);

        $this->dynamoDbClient->putItem($input);
        return $product->getId();
    }

    public function delete(string $id): void
    {
        $input = new DeleteItemInput([
            'TableName' => 'products',
            'Key' => [
                'id' => ['S' => $id],
            ],
        ]);

        $this->dynamoDbClient->deleteItem($input);
    }

    public function deleteAll(): void
    {
        $items = $this->dynamoDbClient->scan(['TableName' => 'products'])->getItems();

        foreach ($items as $item) {
            $this->delete($item['id']->getS());
        }
    }

    public function createTable(): void
    {
        $existingTables = $this->dynamoDbClient->listTables()->getTableNames();

        if (in_array('products', $existingTables)) {
            return; // La tabla ya existe
        }

        $this->dynamoDbClient->createTable([
            'TableName' => 'products',
            'AttributeDefinitions' => [
                ['AttributeName' => 'id', 'AttributeType' => 'S'],
            ],
            'KeySchema' => [
                ['AttributeName' => 'id', 'KeyType' => 'HASH'],
            ],
            'BillingMode' => 'PAY_PER_REQUEST',
        ]);
    }
}

