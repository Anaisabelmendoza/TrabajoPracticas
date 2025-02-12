<?php

namespace App\Resolver;

use ApiPlatform\GraphQl\Resolver\QueryItemResolverInterface;
use App\Repository\ProductRepository;
use Monolog\Level;
use Psr\Log\LoggerInterface;

class ProductResolver implements QueryItemResolverInterface
{
    public function __construct(
        private ProductRepository $productRepository,
        private LoggerInterface $logger
    ){}

    public function __invoke(?object $item, array $context): object
    {
        $this->logger->log(Level::Info, 'Find', [
            'item' => $item,
            'context' => $context,
        ]);

        $id = $context['args']['id'];

        if (!isset($id)) {
            throw new \RuntimeException('El id es obligatorio');
        }

        $product = $this->productRepository->findById($id);
        $this->logger->log(Level::Info, 'Find response', [
            'product' => $product,
        ]);
        return $product;
    }
}
