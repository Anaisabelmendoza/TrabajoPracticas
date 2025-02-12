# Solución: Resolvers personalizados

> Partiendo de la rama `feature/2-3-api-platform-graphql`, crea una rama `feature/2-4-graphql-resolvers-usuario` y realiza los pasos que te indica el ejercicio.

En este ejercicio, implementamos dos resolvers básicos en **api-platform** que nos permiten crear y buscar por id usando **graphql**

## Recuerda :warning:

* Debes arrancar el proyecto con `docker-compose up -d` desde la raíz.
* Los comandos, salvo que se indique lo contrario, se ejecutan dentro de la consola del backend (`docker exec -ti backend-app /bin/bash`)
* Si has cambiado de rama y/o hecho cambios en `composer.json`: `php bin/console cache:clear && composer install`.
* Si en algún momento ves un error de que la tabla no existe, reiniciala con los comandos `php bin/console doctrine:schema:drop --force && php bin/console doctrine:schema:create && php bin/console doctrine:fixtures:load -n`.

## Registro de errores :bug:

### Make:service
En el enunciado de este ejercicio se pedía:
> 1. Crea un servicio para el resolver:
> ```bash
>php bin/console make:service App\\Resolver\\CustomResolver
> ```
Symfony no dispone del comando `make:service`, por lo que debemos crear el resolver manualmente. Puedes seguir la documentación de API Platform para personalizar operaciones en GraphQL.

### Enlace no disponible

El recurso adicional que se facilitaba:
> - [Custom Resolvers en API Platform](https://api-platform.com/docs/core/resolvers/)

No está disponible. En su lugar, API platform tiene documentación de las operaciones que puedes configurar en graphql:

> - [Custom Operations (Graphql) en API Platform](https://api-platform.com/docs/core/graphql/#operations)

---

## **1. Resolver completo**

En este caso, el resolver lo puedes ver adjunto en el código. De cualquier modo: 

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

```

## **2. Anotaciones**

En esta solución hemos usado las anotaciones en la propia entidad:

```php
#[ApiResource(
    graphQlOperations: [
        new Query(),
        new Query(
            name: 'findById',
            resolver: ProductResolver::class,
            read: false
        ),
        new Mutation(
            name: 'create',
            resolver: CreateProductResolver::class
        )
    ]
)]
class Product
```

## **3. Prueba en el propio playground**

Para probar que todo está correctamente configurado. Usa la mutación:

```graphql
mutation {
  createProduct(input: {
		_id: "1234"
    name: "Producto de prueba"
    description: "Descripción de prueba"
    price: 29.99
  }) {
    product {
      id
      name
      description
      price
    }
  }
}

```

Desde el [playground de graphql](http://localhost:8000/api/graphql). Luego entra en la [tabla de products](http://localhost:8002/tables/products) y comprueba que está ahí.


Para verificar que el resolver `findById` funciona correctamente, usa la siguiente consulta GraphQL:


```graphql
query {
	findByIdProduct(id: "1234") {
        id
        name
        description
        price
	}  
}
```

## Uso de Monolog para debugging

Recuerda que usamos `monolog` para ver lo que pasa en el backend. Los logs los verás en `var/logs/dev.log`. Para verlo en directo cuando juegues con el playground, usa:

```bash
tail -f var/logs/dev.log
```

Y cuando quieras salir: `Ctl+C`.

Ejemplo de log:
```log
[2025-02-01T11:16:49.762418+00:00] security.DEBUG: Checking for authenticator support. {"firewall_name":"main","authenticators":0} []
[2025-02-01T11:16:49.839629+00:00] app.INFO: Find {"item":null,"context":{"source":null,"args":{"id":"1234"},"info":{"GraphQL\\Type\\Definition\\ResolveInfo":{"fieldDefinition":{"name":"findByIdProduct","args":[{"name":"id","defaultValue":null,"description":null,"deprecationReason":null,"astNode":null,"config":{"type":"ID!","name":"id"}}],"argsMapper":null,"resolveFn":[],"description":null,"visible":true,"deprecationReason":null,"astNode":null,"complexityFn":null,"config":{"type":"Product","description":null,"args":{"id":{"type":"ID!"}},"resolve":[],"deprecationReason":null,"name":"findByIdProduct"}},"fieldName":"findByIdProduct","returnType":"Product","fieldNodes":[{"loc":{"start":819,"end":893},"kind":"Field","name":{"loc":{"start":819,"end":834},"kind":"Name","value":"findByIdProduct"},"arguments":[{"loc":{"start":835,"end":845},"kind":"Argument","value":{"loc":{"start":839,"end":845},"kind":"StringValue","value":"1234","block":false},"name":{"loc":{"start":835,"end":837},"kind":"Name","value":"id"}}],"directives":[],"selectionSet":{"loc":{"start":847,"end":893},"kind":"SelectionSet","selections":[{"loc":{"start":853,"end":855},"kind":"Field","name":{"loc":{"start":853,"end":855},"kind":"Name","value":"id"},"arguments":[],"directives":[]},{"loc":{"start":860,"end":864},"kind":"Field","name":{"loc":{"start":860,"end":864},"kind":"Name","value":"name"},"arguments":[],"directives":[]},{"loc":{"start":869,"end":880},"kind":"Field","name":{"loc":{"start":869,"end":880},"kind":"Name","value":"description"},"arguments":[],"directives":[]},{"loc":{"start":885,"end":890},"kind":"Field","name":{"loc":{"start":885,"end":890},"kind":"Name","value":"price"},"arguments":[],"directives":[]}]}}],"parentType":"Query","path":["findByIdProduct"],"unaliasedPath":["findByIdProduct"],"schema":{"astNode":null,"extensionASTNodes":[]},"fragments":[],"rootValue":null,"operation":{"loc":{"start":810,"end":897},"kind":"OperationDefinition","operation":"query","variableDefinitions":[],"directives":[],"selectionSet":{"loc":{"start":816,"end":897},"kind":"SelectionSet","selections":[{"loc":{"start":819,"end":893},"kind":"Field","name":{"loc":{"start":819,"end":834},"kind":"Name","value":"findByIdProduct"},"arguments":[{"loc":{"start":835,"end":845},"kind":"Argument","value":{"loc":{"start":839,"end":845},"kind":"StringValue","value":"1234","block":false},"name":{"loc":{"start":835,"end":837},"kind":"Name","value":"id"}}],"directives":[],"selectionSet":{"loc":{"start":847,"end":893},"kind":"SelectionSet","selections":[{"loc":{"start":853,"end":855},"kind":"Field","name":{"loc":{"start":853,"end":855},"kind":"Name","value":"id"},"arguments":[],"directives":[]},{"loc":{"start":860,"end":864},"kind":"Field","name":{"loc":{"start":860,"end":864},"kind":"Name","value":"name"},"arguments":[],"directives":[]},{"loc":{"start":869,"end":880},"kind":"Field","name":{"loc":{"start":869,"end":880},"kind":"Name","value":"description"},"arguments":[],"directives":[]},{"loc":{"start":885,"end":890},"kind":"Field","name":{"loc":{"start":885,"end":890},"kind":"Name","value":"price"},"arguments":[],"directives":[]}]}}]}},"variableValues":[]}},"root_class":"App\\Entity\\Product","graphql_context":[]}} []
[2025-02-01T11:16:49.840140+00:00] app.INFO: findById {"id":"1234"} []
[2025-02-01T11:16:49.859725+00:00] http_client.INFO: Request: "POST http://dynamodb:8000/" [] []
[2025-02-01T11:16:49.878826+00:00] http_client.INFO: Response: "200 http://dynamodb:8000/" 0.014098 seconds {"http_code":200,"url":"http://dynamodb:8000/","total_time":0.014098} []
[2025-02-01T11:16:49.879417+00:00] app.INFO: Result {"result":{"AsyncAws\\DynamoDb\\Result\\GetItemOutput":[]},"item":{"name":{"AsyncAws\\DynamoDb\\ValueObject\\AttributeValue":[]},"description":{"AsyncAws\\DynamoDb\\ValueObject\\AttributeValue":[]},"id":{"AsyncAws\\DynamoDb\\ValueObject\\AttributeValue":[]},"price":{"AsyncAws\\DynamoDb\\ValueObject\\AttributeValue":[]}}} []
[2025-02-01T11:16:49.879618+00:00] app.INFO: Find response {"product":{"App\\Entity\\Product":[]}} []
```

---

### **Notas finales**

- Lee mas acerca de [logging y monolog en symfony](https://symfony.com/doc/current/logging.html).
- Profundiza en [graphl](https://graphql.org/learn/).
- Recuerda que tenemos un poco trucado Doctrine para usar DynamoDB, por lo que todo lo que no toques como un custom resolver será inestable o directamente te devolverá errores.

---

:tophat::tophat: ¡Enhorabuena, ya tenemos el bloque de backend casi listo! :tophat::tophat: