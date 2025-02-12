Feature: Obtener un producto de la API GraphQL

  Scenario: Obtener un producto existente por su ID
    Given el backend está corriendo
    And existe un producto con ID "behat-12345"
    When hago una consulta GraphQL para obtener el producto con ID "behat-12345"
    Then la respuesta de "findByIdProduct" debe contener en la raiz:
      | id          | /api/products/behat-12345              |
