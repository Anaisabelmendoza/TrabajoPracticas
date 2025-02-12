# Solución: Uso básico de DynamoDB con Doctrine

> Partiendo de la rama `feature/2-1-estructura-symfony`, crea una rama `feature/2-2-dynamodb-doctrine-usuario` y realiza los pasos que te indica el ejercicio.
> Como este ejercicio requiere de mucha configuración de Symfony que puede dejar el sistema inestable, hazlo si y solo sí quieres profundizar en la configuración del bundle y entender cómo se instala y se solucionan los problemas. En caso contrario, usa `master` como rama de partida, crea una nueva entidad con `make:entity` y vete al punto 3.

En este ejercicio, integramos **DynamoDB** con Symfony utilizando **SQLite** como base de datos local para Doctrine. Esto nos permite seguir usando herramientas estándar de Symfony, como `make:entity`, `doctrine:schema:create`, y la integración nativa con **API Platform**, mientras que las operaciones reales se delegan a DynamoDB a través de métodos personalizados en los repositorios.

## To dyn or not to dyn

Probablemente os habréis vuelto locos intentando hacerlo _bien_. Hay otras alternativas que podrían ser mejores según el caso:

* No usar DynamoDB.
* No usar Doctrine, usando otro ORM o incluso prescindiendo de ORMs.
* Implementar un driver para doctrine de DynamoDB que lo integre completamente.

Si has explorado cualquiera de esas opciones, puedes comentarlas por el canal del equipo. Os animamos a abrir el debate y cambiar de base de datos o de estrategia de cara al bloque 4.

Podéis usar referencias a documentación oficial de otros bundles, de Doctrine, de AWS; también podéis investigar acerca de bases de datos relacionales y no relacionales, sus diferencias, ventajas e inconvenientes.

---

## **1. Por qué esta estrategia**

La integración directa de DynamoDB con Doctrine no es posible actualmente, ya que no existe un driver oficial para DynamoDB. En lugar de gestionar las entidades manualmente, hemos optado por usar SQLite como una base intermedia. Esto ofrece varias ventajas:

1. **Estándares de Symfony y Doctrine:**
   - Puedes seguir usando comandos como `make:entity`, `doctrine:schema:create`, y las funcionalidades avanzadas de Doctrine.

2. **Compatibilidad con API Platform:**
   - API Platform puede manejar las entidades automáticamente al estar registradas con Doctrine.

3. **Separación de responsabilidades:**
   - SQLite actúa como un esquema local para gestionar entidades, pero las operaciones CRUD se redirigen a DynamoDB a través de métodos personalizados en los repositorios.

Esta estrategia facilita el desarrollo y asegura que el proyecto sea escalable y mantenible.

---

## **2. Configuración inicial**

### **2.1 Configurar Doctrine con SQLite**

En el archivo `.env`, la base de datos se configura así:

```dotenv
DATABASE_URL=sqlite:///%kernel.project_dir%/var/data.db
```

No tienes que tocar nada más en la configuración de Doctrine, ya que utilizaremos la configuración por defecto que Symfony proporciona para SQLite.

> **Importante:** DynamoDB Local separa las bases de datos por credenciales (`AWS_ACCESS_KEY_ID` y `AWS_SECRET_ACCESS_KEY`). Para evitar inconsistencias, asegúrate de que **todas las herramientas** (Symfony, DynamoDB Admin, AWS CLI) usen los mismos valores. En este caso, recomendamos:
>
> ````
> AWS_ACCESS_KEY_ID=codearts
> AWS_SECRET_ACCESS_KEY=codearts
> ````
>
> Esto debe estar definido en:
> - `.env`
> - `docker-compose.yml`
> - Configuración de AWS CLI (`aws configure`)

---

## **3. Personalizar el repositorio**

En el repositorio `ProductRepository`, hemos sobrescrito los métodos de Doctrine para redirigir las operaciones a DynamoDB. Además, hemos implementado el método `createTable` para garantizar que la tabla de DynamoDB exista antes de realizar cualquier operación.

### **3.1 Código del repositorio**

```php
<?php

namespace App\Repository;

use App\Entity\Product;
use AsyncAws\DynamoDb\DynamoDbClient;
use AsyncAws\DynamoDb\Input\DeleteItemInput;
use AsyncAws\DynamoDb\Input\QueryInput;
use AsyncAws\DynamoDb\Input\PutItemInput;
use AsyncAws\DynamoDb\Input\CreateTableInput;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class ProductRepository extends ServiceEntityRepository
{
    private DynamoDbClient $dynamoDbClient;

    public function __construct(ManagerRegistry $registry, DynamoDbClient $dynamoDbClient)
    {
        parent::__construct($registry, Product::class);
        $this->dynamoDbClient = $dynamoDbClient;
    }

    public function findById($id): ?Product
    {
        $input = new QueryInput([
            'TableName' => 'products',
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
        return new Product($item['id']['S'], $item['name']['S'], (float) $item['price']['N']);
    }

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
```

---



## **4. Inicializar datos con Data Fixtures**

Aquí tenéis una serie de herramientas que usaremos para apoyarnos a lo largo del proyecto que no estaban incluidas en el ejercicio inicial, principalmente, para popular datos temporales y borrarlos de forma ágil al arrancar o reiniciar el proyecto.

### **¿Qué son los Data Fixtures?**

Los **Data Fixtures** son una herramienta de Symfony que permite inicializar datos en una base de datos o sistema al inicio de un proyecto. Son útiles para cargar datos de prueba o configurar un entorno predecible para el desarrollo. Para más información, consulta la documentación oficial: [DoctrineFixturesBundle](https://symfony.com/bundles/DoctrineFixturesBundle/current/index.html).

---

### **4.1 Preparar el entorno**

1. **Instalar el paquete de Fixtures si no lo tienes:**
   ```bash
   composer require --dev orm-fixtures fakerphp/faker
   ```

2. **Crear y limpiar la tabla `products` en DynamoDB:**
   - La tabla será creada automáticamente por los `DataFixtures` al ejecutarse, asegurándose de que exista antes de insertar datos.
   - Si ya existe, se reutilizará y limpiará antes de cargar los datos.

---

### **4.2 Crear los Data Fixtures**

Crea un archivo en `src/DataFixtures/AppFixtures.php` con el siguiente contenido:

```php
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
            $product = new Product(
                Uuid::uuid_create(),
                $faker->word,               // Nombre aleatorio
                $faker->sentence(10),       // Descripción aleatoria
                rand(10, 100) / 10          // Precio aleatorio
            );
            $this->productRepository->save($product);
        }
    }
}
```

---

### **4.3 Cargar los datos iniciales**

Ejecuta el siguiente comando para inicializar DynamoDB con datos aleatorios:

```bash
php bin/console doctrine:schema:drop --force
php bin/console doctrine:schema:create
php bin/console doctrine:fixtures:load -n
```

Ten en cuenta que los primeros dos comandos interactuarán con SQLite, ya que recreará el esquema en esta base de datos, pero Doctrine lo necesita para poder lanzar el tercero asumiendo que todo está correcto en el esquema. En el último, saliéndose del estándar, se recrea y purga la tabla en DynamoDB.
---

## **5. Verificar los datos en DynamoDB**

Accede a **DynamoDB Admin** en `http://localhost:8002`, selecciona la tabla `products`, y verifica los productos que se han creado.

> **Depuración adicional:** Si no ves las tablas en DynamoDB Admin, ejecuta el siguiente comando para verificar en qué región se han creado:
>
> ```bash
> php bin/console app:list-dynamodb-tables
> ```
>
> Esto mostrará todas las tablas creadas en distintas regiones y ayudará a identificar inconsistencias en la configuración.

---

### **Notas finales**

- Los Data Fixtures garantizan un entorno inicial limpio y predecible, creando la tabla si no existe, limpiándola si es necesario y cargando datos de prueba.
- SQLite se usa solo para esquemas, pero las operaciones de datos reales se hacen en DynamoDB.
- **Asegúrate de que las credenciales AWS sean las mismas en Symfony, DynamoDB Admin y AWS CLI.**

---