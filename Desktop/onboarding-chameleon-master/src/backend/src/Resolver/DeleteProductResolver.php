<?php

namespace App\Resolver;

use ApiPlatform\GraphQl\Resolver\MutationResolverInterface;
use App\Repository\ProductRepository;
use Psr\Log\LoggerInterface;

class DeleteProductResolver implements MutationResolverInterface
{
    public function __construct(
        private ProductRepository $productRepository,
        private LoggerInterface $logger
    ) {}

    public function __invoke(?object $item, array $context): ?object
    {
        $id = $context['args']['input']['_id'] ?? null;

        if (!$id) {
            throw new \InvalidArgumentException('Se requiere un ID para eliminar un producto.');
        }

        $this->logger->info("Buscando producto con ID: " . $id);
        $product = $this->productRepository->findById($id);

        if(!$product) {
            throw new \RuntimeException('No existe el producto.');
        }

        $this->logger->info("Eliminando producto con ID: " . $id);

        $this->productRepository->deleteById($id);

        return $product;
    }
}
