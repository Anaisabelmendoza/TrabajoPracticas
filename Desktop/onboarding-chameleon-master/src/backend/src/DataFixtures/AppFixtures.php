<?php

namespace App\DataFixtures;

use App\Entity\Product;
use App\Repository\ProductRepository;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;
use Symfony\Polyfill\Uuid\Uuid;
use Faker\Factory;

class AppFixtures extends Fixture
{
    private ProductRepository $productRepository;

    public function __construct(ProductRepository $productRepository)
    {
        $this->productRepository = $productRepository;
    }

    public function load(ObjectManager $manager): void
    {
        // Crear la tabla si no existe
        $this->productRepository->createTable();

        // Limpiar la tabla antes de cargar datos
        $this->productRepository->deleteAll();

        // Crear una instancia de Faker
        $faker = Factory::create();

        // Generar productos aleatorios
        for ($i = 1; $i <= 5; $i++) {
            $product = new Product();
            $product->setId(Uuid::uuid_create());
            $product->setName($faker->word);
            $product->setDescription($faker->sentence(10));
            $product->setPrice(rand(10, 100) / 10);
            $this->productRepository->save($product);
        }
    }
}
