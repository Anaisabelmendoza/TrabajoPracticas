# Ejercicio 4: Resolvers personalizados en API Platform

> Partiendo de la rama `feature/2-3-api-platform-graphql`, crea una rama `feature/2-4-graphql-resolvers-usuario` y realiza los pasos que te indica el ejercicio.

En este ejercicio implementarás lógica personalizada utilizando resolvers en API Platform.

---

## **Objetivos**

1. Crear un resolver personalizado en API Platform.
2. Implementar lógica de negocio específica en el resolver.

---

## **Instrucciones**

1. Crea la carpeta `src/Resolver`, donde crearemos los resolversque te permita insertar un producto.
2. Crea un resolver `CreateProductResolver` que implemente `MutationResolverInterface` en esa misma carpeta.
```php
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
        // TODO: lee de $item e inserta usando $this->productRepository->save
    }
}

```
tienes algunas importaciones que seguramente necesites.


> **MutationResolverInterface**: Un resolver de mutación en GraphQL permite interceptar, modificar y validar los datos antes de ser almacenados en la base de datos.

3. Configura el resolver:
   - Añade la lógica de negocio en el método `__invoke` del servicio.
   - Asocia el resolver a una entidad 
     - Alternativa 1: usando anotaciones en la propia entidad `Product`.
     - Alternativa 2: en `api_platform.yaml`. 

> :warning: Dado que Symfony está configurado con auto-mapping, recomendamos usar anotaciones en la entidad en lugar de configurarlo manualmente en api_platform.yaml.

4. Si ya has terminado con el resolver que inserta el producto, ¡enhorabuena!  :sparkler: :sparkler: ¿Ahora, prueba a crear otro que permita **recuperar un producto por su ID**. Así completarás el flujo básico de GraphQL.

---

## **Recursos Adicionales**

- [Custom Operations (Graphql) en API Platform](https://api-platform.com/docs/core/graphql/#operations)
- Lee mas acerca de [logging y monolog en symfony](https://symfony.com/doc/current/logging.html), te servirá para depurar el código de tu resolver.

---

¡Buena suerte!
