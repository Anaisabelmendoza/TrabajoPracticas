<?php

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

    /**
     * Initializes context.
     */
    public function __construct()
    {
        $this->httpClient = HttpClient::create();
    }

    /**
     * @BeforeScenario
     */
    public function limpiarBaseDeDatos()
    {
        // Se ejecuta antes de cada escenario para empezar con una BD limpia.
        $this->createdProducts = [];
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
            'query' => '
                mutation {
                  createProduct(input: {
                    _id: "' . $data['id'] . '",
                    name: "' . $data['name'] . '",
                    description: "' . $data['description'] . '",
                    price: ' . $data['price'] . '
                  }) {
                    product {
                      id
                      name
                      description
                      price
                    }
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
     * @Then la respuesta debe contener:
     * @Then la respuesta de :operation debe contener:
     */
    public function laRespuestaDebeContener(TableNode $table, string $operation = 'createProduct')
    {
        try {
            $expectedData = $table->getRowsHash();

            // Extraemos los datos devueltos en GraphQL
            $actualData = $this->responseData['data'][$operation]['product'] ?? null;

            if (!$actualData) {
                throw new \Exception("No se encontró la respuesta esperada para la operación $operation. Respuesta completa: " . serialize($this->responseData));
            }

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
     * @Then la respuesta debe contener en la raiz:
     * @Then la respuesta de :operation debe contener en la raiz:
     */
    public function laRespuestaDebeContenerEnLaRaiz(TableNode $table, string $operation = 'createProduct')
    {
        try {
            $expectedData = $table->getRowsHash();

            // Extraemos los datos devueltos en GraphQL
            $actualData = $this->responseData['data'][$operation] ?? null;

            if (!$actualData) {
                throw new \Exception("No se encontró la respuesta esperada para la operación $operation. Respuesta completa: " . serialize($this->responseData));
            }

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
     * @Given existe un producto con ID :id
     */
    public function existeUnProductoConId($id)
    {
        // Creamos un producto mediante GraphQL para evitar inyección de dependencias.
        $faker = Factory::create();

        $mutation = json_encode([
            'query' => '
                mutation {
                  createProduct(input: {
                    _id: "' . $id . '",
                    name: "' . $faker->word . '",
                    description: "' . $faker->sentence(10) . '",
                    price: ' . $faker->randomFloat(2, 10, 100) . '
                  }) {
                    product {
                      id
                    }
                  }
                }'
        ]);

        $this->httpClient->request('POST', 'http://localhost:8000/api/graphql', [
            'headers' => ['Content-Type' => 'application/json'],
            'body' => $mutation
        ]);

        $this->createdProducts[] = $id;
    }

    /**
     * @When hago una consulta GraphQL para obtener el producto con ID :id
     */
    public function hagoUnaConsultaGraphqlParaObtenerElProductoConId($id)
    {
        $query = json_encode([
            'query' => '
                query {
                  findByIdProduct(id: "' . $id . '") {
                    id
                    name
                    description
                    price
                  }
                }'
        ]);

        $this->responseData = $this->httpClient->request('POST', 'http://localhost:8000/api/graphql', [
            'headers' => ['Content-Type' => 'application/json'],
            'body' => $query
        ])->toArray();
    }

    /**
     * @When hago una mutación GraphQL para eliminar el producto con ID :id
     */
    public function hagoUnaMutacionGraphqlParaEliminarElProductoConId($id)
    {
        $mutation = json_encode([
            'query' => '
                mutation {
                  deleteByIdProduct(input: { _id: "' . $id . '" }) {
                    clientMutationId
                  }
                }'
        ]);

        $this->responseData = $this->httpClient->request('POST', 'http://localhost:8000/api/graphql', [
            'headers' => ['Content-Type' => 'application/json'],
            'body' => $mutation
        ])->toArray();
    }

    /**
     * @Then el producto con ID :id no debe existir
     */
    public function elProductoConIdNoDebeExistir($id)
    {
        $query = json_encode([
            'query' => '
                query {
                  findByIdProduct(id: "' . $id . '") {
                    id
                  }
                }'
        ]);

        $response = $this->httpClient->request('POST', 'http://localhost:8000/api/graphql', [
            'headers' => ['Content-Type' => 'application/json'],
            'body' => $query
        ])->toArray();

        if (isset($response['data']['findByIdProduct']) && $response['data']['findByIdProduct'] !== null) {
            throw new \Exception("El producto con ID $id todavía existe en la API");
        }
    }

    /**
     * @AfterScenario
     */
    public function limpiarProductosCreados()
    {
        foreach ($this->createdProducts as $productId) {
            $mutation = json_encode([
                'query' => '
                    mutation {
                      deleteByIdProduct(input: { _id: "' . $productId . '" }) {
                        clientMutationId
                      }
                    }'
            ]);

            $this->httpClient->request('POST', 'http://localhost:8000/api/graphql', [
                'headers' => ['Content-Type' => 'application/json'],
                'body' => $mutation
            ]);
        }
    }
}
