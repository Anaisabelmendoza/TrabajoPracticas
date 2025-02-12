# Solución: Exposición de la Entidad `Product` con API Platform y GraphQL

> Partiendo de la rama `feature/2-2-dynamodb-doctrine`, crea una rama `feature/2-3-api-platform-graphql-usuario` y realiza los pasos que te indica el ejercicio.
> Como este ejercicio requiere de mucha configuración de Symfony que puede dejar el sistema inestable, hazlo si y solo sí quieres profundizar en la configuración del bundle y entender cómo se instala y se solucionan los problemas. En caso contrario, usa `master` como rama de partida, crea una nueva entidad con `make:entity` y vete al punto 3.

En este ejercicio, vamos a exponer la entidad `Product` como un recurso REST y GraphQL utilizando **API Platform**. Esto nos permitirá gestionar los productos a través de una API estandarizada con soporte para **Swagger UI** y **GraphQL Playground**.

---

## **1. Configuración de API Platform**

Todos estos pasos, salvo que se indique lo contrario, se deben de ejecutar dentro del container `backend-app`, después de haberlo levantado con `docker-compose`:

```bash
docker-compose up -d
docker exec -ti backend-app /bin/bash
```

### **1.1 Instalar API Platform**

Si aún no tienes **API Platform** instalado, ejecuta:

```bash
composer require api
```

Esto instalará todas las dependencias necesarias para que Symfony pueda exponer entidades como recursos de API.

#### **Problemas para ver la consola de GraphQL**

##### **Asset mapper**

Parece que el javascript que permite cargar el playground de graphql no es estable y hace que falle la carga, por lo que, si os pasa esto:

```bash
root@5ed2d955a640:/app# php bin/console asset-map:

 // Compiling and writing asset files to public                                                                         


In JavaScriptImportPathCompiler.php line 140:
                                                                                                                                                     
  Unable to find asset "./path/to/domAnimations" imported from "/app/vendor/api-platform/symfony/Bundle/Resources/public/graphiql/graphiql.min.js".  
                                                                                                                                                     

asset-map:compile

```

Poned esto en vuestro framework.yaml:

```yaml
    asset_mapper:
        # The paths to make available to the asset mapper.
        paths:
            - assets/
        missing_import_mode: warn
```

De ese modo, el error se convertirá en un warning y funcionará.

[1] https://github.com/symfony/symfony/pull/58944#issuecomment-2500260287

##### **Actualizar versiones en `composer.json` para GraphQL**

> Si aún sigues sin ver la consola de graphql, prueba con esto, si no, opta por saltarte esto y tomar la opción de partir de `master` e ir al punto siguiente.

Para asegurar compatibilidad total con GraphQL y evitar bugs en **GraphiQL**, es recomendable actualizar `composer.json` con estas versiones:

```json
{
    "require": {
        "api-platform/doctrine-orm": "^4.0.3",
        "api-platform/symfony": "^4.0.8"
    }
}
```

Luego, ejecuta:

```bash
composer update
```

---

## **2. Configurar API Platform para servir GraphQL**
API Platform permite exponer entidades en **REST** y **GraphQL**. Para habilitar GraphQL, ejecuta:

```bash
composer require api-platform/graphql
```

Luego, toca el title en `config/packages/api_platform.yaml`:

```yaml
api_platform:
    title: Onboarding API Platform
    version: 1.0.0
```

Con esto, API Platform generará automáticamente esquemas de GraphQL para las entidades expuestas.

---

## **3. Configurar la entidad `Product` como un recurso API**

Para que API Platform pueda gestionar la entidad `Product`, es necesario agregar las anotaciones correspondientes.

Edita el archivo `src/Entity/Product.php` y agrégale la anotación `#[ApiResource]`:

```php
<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ApiResource]
class Product
{
    #[ORM\Id]
    #[ORM\Column(type: 'string')]
    private string $id;

    #[ORM\Column(type: 'string')]
    private string $name;

    #[ORM\Column(type: 'string')]
    private string $description;

    #[ORM\Column(type: 'float')]
    private float $price;

    public function __construct(string $id, string $name, string $description, float $price)
    {
        $this->id = $id;
        $this->name = $name;
        $this->description = $description;
        $this->price = $price;
    }

    public function getId(): string { return $this->id; }
    public function getName(): string { return $this->name; }
    public function getDescription(): string { return $this->description; }
    public function getPrice(): float { return $this->price; }
}
```

---

## **4. Solución al problema de permisos con `api_platform.yaml`**
Algunos usuarios han encontrado problemas al modificar `src/backend/config/packages/api_platform.yaml` debido a restricciones de permisos. Para solucionarlo, ejecuta:

```bash
sudo chown $USER:$USER src/backend/config/packages/api_platform.yaml
```

Esto permite modificar el archivo y cambiar el título de la API:

```yaml
api_platform:
    title: Onboarding API Platform
```

---

## **5. Solución al problema de assets en Swagger UI**
Si **Swagger UI** o **GraphQL Playground** siguen sin cargar correctamente los estilos y scripts (`init-swagger-ui-*.js` devuelve error 500), ejecuta:

```bash
php bin/console assets:install --symlink --relative
```

Esto asegurará que los assets se sirvan correctamente.

---

## **6. Probar la API en el navegador**

API Platform genera automáticamente una interfaz gráfica en **Swagger UI** y **GraphQL Playground**. Accede a:

- **Swagger UI:**  
  [http://localhost:8000/api](http://localhost:8000/api)

- **GraphQL Playground:**  
  [http://localhost:8000/api/graphql](http://localhost:8000/api/graphql)

Aquí podrás probar los endpoints de `Product` sin necesidad de herramientas externas.

---

## **7. Verificar los endpoints con cURL o Postman**

Puedes probar los endpoints generados por API Platform usando `cURL` o **Postman**.

### **7.1 Obtener todos los productos**
```bash
curl -X GET "http://localhost:8000/api/products" -H "Accept: application/json"
```

Estará vacío.

### **7.2 Crear un producto**
```bash
curl -X POST "http://localhost:8000/api/products" \
     -H "Content-Type: application/json" \
     -d '{"id": "12345", "name": "Producto de prueba", "description": "Descripción de prueba", "price": 19.99}'
```

Este endpoint aún no funcionará correctamente porque la creación de productos se gestionará en el siguiente ejercicio con `resolvers`.

---

## **8. Solución al problema de GraphQL Playground**
Si **GraphQL Playground no carga correctamente** o tiene problemas con `graphiql`, asegúrate de seguir estos pasos:

1. **Instalar GraphQL con API Platform**  
   ```bash
   composer require api-platform/graphql
   ```

2. **Actualizar versiones en `composer.json`**  
   ```json
   {
       "require": {
           "api-platform/doctrine-orm": "^4.0.3",
           "api-platform/symfony": "^4.0.8"
       }
   }
   ```

3. **Instalar los assets manualmente**  
   ```bash
   php bin/console assets:install --symlink --relative
   ```

> :warning: **Si aún experimentas problemas, revisa la configuración en `config/packages/api_platform.yaml` y asegúrate de que `enable_graphql: true` está activado.**

---

🚀 **¡API Platform y GraphQL ya están en marcha con DynamoDB!** 🚀
