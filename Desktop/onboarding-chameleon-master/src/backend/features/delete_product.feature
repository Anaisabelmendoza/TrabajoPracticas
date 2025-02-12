Feature: Eliminar un producto de la API GraphQL

  Scenario: Eliminar un producto existente
    Given el backend está corriendo
    And existe un producto con ID "behat-12345"
    When hago una mutación GraphQL para eliminar el producto con ID "behat-12345"
    Then el producto con ID "behat-12345" no debe existir
