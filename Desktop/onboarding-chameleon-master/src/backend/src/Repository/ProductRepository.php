<?php

namespace App\Repository;

use App\Entity\Product;
use AsyncAws\DynamoDb\DynamoDbClient;
use AsyncAws\DynamoDb\Input\DeleteItemInput;
use AsyncAws\DynamoDb\Input\GetItemInput;
use AsyncAws\DynamoDb\Input\PutItemInput;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Monolog\Level;
use Psr\Log\LoggerInterface;

/**
 * @extends ServiceEntityRepository<Product>
 */
class ProductRepository extends ServiceEntityRepository
{
    public function __construct(
        private ManagerRegistry $registry, 
        private DynamoDbClient $dynamoDbClient,
        private LoggerInterface $logger,
    ){
        parent::__construct($registry, Product::class);
    }

    public function ormSave(Product $product): void
    {
        $entityManager = $this->getEntityManager();
        $entityManager->persist($product);
        $entityManager->flush();
    }

    public function ormDelete(string $id): void
    {
        $product = $this->find($id);
        
        if (!$product)
            return;

        $entityManager = $this->getEntityManager();
        $entityManager->remove($product);
        $entityManager->flush();
    }

    public function findById($id): ?Product
    {
        
        $this->logger->log(Level::Info, 'findById', [
            'id' => $id,
        ]);

        $result = $this->dynamoDbClient->getItem(new GetItemInput([
            'TableName' => 'products',
            'ConsistentRead' => true,
            'Key' => [
                'id' => ['S' => $id],
            ],
        ]));


        $item = $result->getItem();
        if (!$item) {
            return null;
        }

        $this->logger->log(Level::Info, 'Result', [
            'result' => $result,
            'item' => $item,
        ]);

        $product = new Product();
        $product->setId($item['id']->getS());
        $product->setName($item['name']->getS());
        $product->setDescription($item['description']->getS());
        $product->setPrice((float) $item['price']->getN());
        return $product;
    }
    
    public function save(Product $product): string
    {
        $input = new PutItemInput([
            'TableName' => 'products',
            'Item' => [
                'id' => ['S' => $product->getId()],
                'name' => ['S' => $product->getName()],
                'description' => ['S' => $product->getDescription()],
                'price' => ['N' => (string) $product->getPrice()],
            ],
        ]);

        // esto lo vuelca en dynamo
        $this->dynamoDbClient->putItem($input);

        // y esto en sqlite
        $this->ormSave($product);

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

        // de dynamodb
        $this->dynamoDbClient->deleteItem($input);

        // y de sqlite
        $this->ormDelete($id);
    }

    public function createTable(): void
    {
        $existingTables = $this->dynamoDbClient->listTables()->getTableNames();

        foreach($existingTables as $table){
            if ('products' === $table) {
                return; // La tabla ya existe
            }
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

    public function deleteAll(): void
    {
        $items = $this->dynamoDbClient->scan(['TableName' => 'products'])->getItems();

        foreach ($items as $item) {
            $this->delete($item['id']->getS());
            $this->ormDelete($item['id']->getS());
        }
    }

    public function deleteById(string $id): void
    {
        $this->delete($id);
    }

    public function listAll(): array
    {
        $items = $this->dynamoDbClient->scan(['TableName' => 'products'])->getItems();

        return $items;
    }
}
