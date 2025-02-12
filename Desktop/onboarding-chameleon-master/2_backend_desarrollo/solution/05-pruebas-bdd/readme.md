# Solución: Pruebas BDD con Behat en Symfony + API Platform


> Partiendo de la rama `feature/2-4-graphql-resolvers-graphql`, crea una rama `feature/2-5-behat-bdd-usuario` y realiza los pasos que te indica el ejercicio.
> Como este ejercicio requiere de mucha configuración de Symfony que puede dejar el sistema inestable, hazlo si y solo sí quieres profundizar en la configuración del bundle y entender cómo se instala y se solucionan los problemas. En caso contrario, usa `master` como rama de partida y crea un nuevo escenario familirizándote con behat.

En este ejercicio, implementamos **pruebas de aceptación** para validar nuestra API GraphQL usando **Behat** y el enfoque **BDD (Behavior-Driven Development)**.

---

## Recuerda :warning:

* Debes arrancar el proyecto con `docker-compose up -d` desde la raíz.
* Los comandos, salvo que se indique lo contrario, se ejecutan dentro de la consola del backend (`docker exec -ti backend-app /bin/bash`)
* Si has cambiado de rama y/o hecho cambios en `composer.json`: `php bin/console cache:clear && composer install`.
* Cuando te hayas bajado los cambios, limpia el contenido con: `php bin/console doctrine:schema:drop --force && php bin/console doctrine:schema:create && php bin/console doctrine:fixtures:load -n`.
* Los pasos que se indican a continuación asumen que partes de las solución 4 a todos los niveles, es decir, tienes activa la rama `feature/2-4-graphql-resolvers` o has partido de ella.
* Si lo prefieres puedes ir a las pruebas bajándote esta rama `feature/2-5-behat-bdd` e ir drectamente al punto 5 y únicamente leer lo que hemos hecho.

---

## **1. Por qué usamos un resolver para limpiar los datos**

En **pruebas de comportamiento (BDD)**, es fundamental que el entorno de pruebas sea **predecible** y que el estado de la base de datos no afecte los resultados de los tests.  

Por ello, hemos agregado un **resolver en GraphQL** que permite **eliminar productos** de forma controlada **sin depender de la base de datos directamente**. Esto nos ayuda a que los tests:
- **No fallen por datos previos** en la base de datos.
- **No requieran acceso directo al repositorio**, evitando acoplamiento.
- **Simulen el comportamiento real** de un cliente de la API.

🔹 **En conclusión:** Es mejor que los tests usen **acciones de usuario real** (mutaciones GraphQL en este caso) en lugar de tocar directamente la base de datos.  

---

## **2. Configuración de Behat**

Para ejecutar los tests, primero hay que instalar **Behat** dentro del contenedor backend:  

```bash
docker exec -ti backend-app /bin/bash
composer require --dev behat/behat
vendor/bin/behat --init
```

Esto creará el directorio `features/bootstrap/` donde definiremos los **contextos de prueba**.

### **2.1 Configuración de servicios para pruebas**

Behat no usa Symfony directamente de forma deliverada. ¿Eso qué significa? Que a todos los efectos, usa la API, no nuestro código, es decir, prueba la API como si fuese un usuario, por lo que no tendrás acceso al repositorio o a las fixtures, tendrás que hacerlo todo como *cliente*.

---

## **3. Implementación de `FeatureContext.php`**

En `features/bootstrap/FeatureContext.php` definimos **los pasos** para Behat.

```php
<?php

use App\Entity\Product;
use Behat\Behat\Context\Context;
use Behat\Gherkin\Node\TableNode;
use Faker\Factory;
use Symfony\Component\HttpClient\HttpClient;

/**
 * Defines application features from the specific context.
 */
class FeatureContext implements Context
{
    private $httpClient;
    private $responseData;
    private array $createdProducts = [];

    public function __construct()
    {
        $this->httpClient = HttpClient::create();
    }

    /**
     * @BeforeScenario
     */
    public function limpiarBaseDeDatos()
    {
        $this->httpClient->request('POST', 'http://localhost:8000/api/graphql', [
            'headers' => ['Content-Type' => 'application/json'],
            'body' => json_encode([
                'query' => 'mutation { deleteAllProducts { clientMutationId } }'
            ])
        ]);
    }

    /**
     * @Given el backend está corriendo
     */
    public function elBackendEstaCorriendo()
    {
        $response = $this->httpClient->request('GET', 'http://localhost:8000/api');
        if ($response->getStatusCode() !== 200) {
            throw new \Exception("El backend no está disponible");
        }
    }

    /**
     * @When hago una mutación GraphQL para crear un producto con:
     */
    public function hagoUnaMutacionGraphqlParaCrearUnProductoCon(TableNode $table)
    {
        $data = $table->getRowsHash();
        $mutation = json_encode([
            'query' => 'mutation {
                createProduct(input: {
                    _id: "' . $data['id'] . '",
                    name: "' . $data['name'] . '",
                    description: "' . $data['description'] . '",
                    price: ' . $data['price'] . '
                }) {
                    product { id name description price }
                }
            }'
        ]);

        $this->responseData = $this->httpClient->request('POST', 'http://localhost:8000/api/graphql', [
            'headers' => ['Content-Type' => 'application/json'],
            'body' => $mutation
        ])->toArray();

        $this->createdProducts[] = $data['id'];
    }

    /**
     * @Then la respuesta de :operation debe contener en la raiz:
     */
    public function laRespuestaDebeContenerEnLaRaiz(String $operation, TableNode $table)
    {
        try {
            $expectedData = $table->getRowsHash();
            $actualData = $this->responseData['data'][$operation];

            foreach ($expectedData as $key => $value) {
                if ($actualData[$key] != $value) {
                    throw new \Exception("La respuesta no contiene el valor esperado para $key - " . serialize($this->responseData));
                }
            }
        } catch (Exception $e) {
            throw new \Exception("Excepción inesperada al comprobar la respuesta - " . serialize($this->responseData));
        }
    }

    /**
     * @AfterScenario
     */
    public function limpiarProductosCreados()
    {
        foreach ($this->createdProducts as $productId) {
            $this->httpClient->request('POST', 'http://localhost:8000/api/graphql', [
                'headers' => ['Content-Type' => 'application/json'],
                'body' => json_encode([
                    'query' => 'mutation { deleteByIdProduct(input: { _id: "' . $productId . '" }) { clientMutationId } }'
                ])
            ]);
        }
    }
}
```

---

## **4. Definición de escenarios en Behat (Gherkin)**

Hemos creado **tres archivos** en `features/` para probar **crear, obtener y eliminar** productos.

### **4.1 Crear un producto**
```gherkin
Feature: Crear un producto en la API GraphQL

  Scenario: Creación exitosa de un producto
    Given el backend está corriendo
    When hago una mutación GraphQL para crear un producto con:
      | id          | behat-12345             |
      | name        | Producto de prueba      |
      | description | Una descripción genérica |
      | price       | 29.99                   |
    Then la respuesta de "createProduct" debe contener en la raiz:
      | id          | /api/products/behat-12345             |
```

### **4.2 Obtener un producto existente**
```gherkin
Feature: Obtener un producto de la API GraphQL

  Scenario: Obtener un producto existente por su ID
    Given el backend está corriendo
    And hago una mutación GraphQL para crear un producto con:
      | id          | behat-12345             |
      | name        | Producto de prueba      |
      | description | Una descripción genérica |
      | price       | 29.99                   |
    When hago una consulta GraphQL para obtener el producto con ID "behat-12345"
    Then la respuesta de "findByIdProduct" debe contener en la raiz:
      | id          | /api/products/behat-12345             |
```

### **4.3 Eliminar un producto**
```gherkin
Feature: Eliminar un producto de la API GraphQL

  Scenario: Borrar un producto por su ID
    Given el backend está corriendo
    And hago una mutación GraphQL para crear un producto con:
      | id          | behat-12345             |
      | name        | Producto de prueba      |
      | description | Una descripción genérica |
      | price       | 29.99                   |
    When hago una mutación GraphQL para eliminar el producto con ID "behat-12345"
    Then el producto con ID "behat-12345" ya no debe existir en la API
```

---

## **5. Ejecutar los tests**
Para correr los tests:

```bash
vendor/bin/behat
```

Si necesitas ver más detalles:

```bash
vendor/bin/behat --format=progress
```

---

:rocket: **¡Listo! Nuestra API GraphQL ahora está validada con BDD y Behat.** :rocket:
