<?php

namespace App\Resolver;

use ApiPlatform\GraphQl\Resolver\MutationResolverInterface;
use App\Entity\Product;
use App\Repository\ProductRepository;
use Monolog\Level;
use Psr\Log\LoggerInterface;
use Symfony\Component\Uid\Uuid;

class CreateProductResolver implements MutationResolverInterface
{
    public function __construct(
        private ProductRepository $productRepository,
        private LoggerInterface $logger
    ){}

    public function __invoke(?object $item, array $context): ?object
    {
        if (!$item instanceof Product) {
            throw new \RuntimeException('El objeto debe ser una instancia de Product');
        }

        $this->logger->log(Level::Info, 'Insert', [
            'item' => $item,
            'context' => $context,
        ]);

        if (!isset($item->id)) {
            $item->setId($context['args']['input']['_id'] ?? Uuid::v4()->toRfc4122());
        }

        // Guardamos el producto en DynamoDB usando el repositorio
        $this->productRepository->save($item);

        return $item;
    }
}
