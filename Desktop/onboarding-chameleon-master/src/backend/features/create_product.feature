Feature: Crear un producto en la API GraphQL

  Scenario: Crear un producto correctamente
    Given el backend está corriendo
    When hago una mutación GraphQL para crear un producto con:
      | id          | behat-12345              |
      | name        | Producto de prueba       |
      | description | Una descripción genérica |
      | price       | 30.99                    |
    Then la respuesta debe contener:
      | id          | /api/products/behat-12345 |
      | name        | Producto de prueba        |
      | description | Una descripción genérica  |
      | price       | 30.99                     |
