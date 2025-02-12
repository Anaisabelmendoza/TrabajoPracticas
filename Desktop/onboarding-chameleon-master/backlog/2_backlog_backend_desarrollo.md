## Bloque 2: Backend - Desarrollo

```json
[
  {
    "category": "Backend",
    "title": "Crear estructura inicial del proyecto Symfony",
    "description": "Utilizar Symfony CLI para inicializar un nuevo proyecto con una configuración básica. Implementar autenticación básica y configurar rutas iniciales.",
    "estimate": 6,
    "tags": ["backend", "symfony", "autenticación"],
    "references": ["https://symfony.com/doc/current/setup.html"]
  },
  {
    "category": "Backend",
    "title": "Configurar base de datos con DynamoDB utilizando Doctrine",
    "description": "Configurar Doctrine para interactuar con DynamoDB, manteniendo la abstracción de la base de datos. Crear entidades y repositorios básicos para gestionar los datos.",
    "estimate": 10,
    "tags": ["backend", "dynamodb", "doctrine", "orm"],
    "references": [
      "https://www.doctrine-project.org/",
      "https://docs.aws.amazon.com/amazondynamodb/"
    ]
  },
  {
    "category": "Backend",
    "title": "Configurar API Platform con GraphQL",
    "description": "Instalar y configurar API Platform en el proyecto Symfony para generar automáticamente esquemas GraphQL y REST basados en las entidades de Doctrine. Validar la configuración con consultas y mutaciones básicas.",
    "estimate": 8,
    "tags": ["backend", "api-platform", "graphql", "doctrine"],
    "references": [
      "https://api-platform.com/docs/core/graphql/",
      "https://api-platform.com/docs/core/"
    ]
  },
  {
    "category": "Backend",
    "title": "Extender API Platform con resolvers personalizados",
    "description": "Añadir lógica específica mediante resolvers personalizados en API Platform para cubrir casos de negocio no estándar. Implementar pruebas unitarias (TDD) para validar la funcionalidad.",
    "estimate": 6,
    "tags": ["backend", "graphql", "tdd", "api-platform"],
    "references": [
      "https://api-platform.com/docs/core/resolvers/",
      "https://symfony.com/doc/current/testing.html"
    ]
  },
  {
    "category": "Backend",
    "title": "Desarrollar pruebas BDD para flujos clave",
    "description": "Escribir escenarios en Behat para validar flujos clave de negocio, como autenticación y CRUD de datos, asegurando que cumplen con los requisitos funcionales.",
    "estimate": 6,
    "tags": ["backend", "bdd", "behat", "testing"],
    "references": [
      "https://behat.org/",
      "https://symfony.com/doc/current/testing.html"
    ]
  }
]
```.
