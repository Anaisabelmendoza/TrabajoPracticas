# Solución 3.3 - Conectar con el backend usando Apollo Client y GraphQL

Partiendo de la rama `feature/3-2-tailwind-layout-usuario`, crea una nueva rama `feature/3-3-conectar-graphql-usuario` y sigue las instrucciones del ejercicio.

## Recuerda :warning:

* Arranca el proyecto con `docker-compose up` desde la raíz. En este ejercicio te interesa ver los logs de como todo va conectando.
* Ejecuta los comandos dentro del contenedor de frontend: `docker exec -ti frontend-app /bin/bash`
* Si has cambiado de rama y/o hecho cambios en `package.json`: `npm install`.

---
## 1️⃣ Instalar Apollo Client y GraphQL

Ejecuta el siguiente comando dentro del contenedor del frontend:

```bash
npm install @apollo/client graphql
```

---
## 2️⃣ Configurar Apollo Provider

### 📌 Definir el cliente Apollo en `lib/apolloClient.ts`

Crea el archivo `lib/apolloClient.ts` y define el cliente GraphQL:

```tsx
import { ApolloClient, InMemoryCache } from "@apollo/client";

const createApolloClient = () => {
  return new ApolloClient({
    uri: "http://localhost:8000/api/graphql", // Backend ya configurado
    cache: new InMemoryCache(),
  });
};

export default createApolloClient;
```

### 📌 Crear el componente `ApolloTest.tsx`

Crea el archivo `components/ApolloTest.tsx` para envolver la app con `ApolloProvider`:

```tsx
"use client";
import { ApolloProvider, gql, useQuery } from "@apollo/client";
import createApolloClient from "../../lib/apolloClient";

const client = createApolloClient();

const TEST_QUERY = gql`
  query {
    __typename
  }
`;

function ApolloTestComponent() {
  const { loading, error, data } = useQuery(TEST_QUERY);

  if (loading) return <p className="text-center text-gray-500">Cargando...</p>;
  if (error) return <p className="text-center text-red-500">Error: {error.message}</p>;

  return (
    <p className="text-center text-green-500">
      Conexión GraphQL funcionando: {JSON.stringify(data)}
    </p>
  );
}

export default function ApolloTest() {
  return (
    <ApolloProvider client={client}>
      <div className="p-4 bg-gray-900 text-white">
        <h2 className="text-xl font-bold mb-2">Apollo Test</h2>
        <ApolloTestComponent />
      </div>
    </ApolloProvider>
  );
}
```

---
## 3️⃣ Mostrar los detalles de un producto

Crea `components/ProductDetails.tsx` para obtener y mostrar los detalles de un producto a partir de su ID:

```tsx
"use client";
import { ApolloProvider, gql, useQuery } from "@apollo/client";
import createApolloClient from "../../lib/apolloClient";

const client = createApolloClient();

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
};

type ProductQueryData = {
  findByIdProduct: Product;
};

const GET_PRODUCT = gql`
  query GetProduct($id: ID!) {
    findByIdProduct(id: $id) {
      id
      name
      description
      price
    }
  }
`;

function ProductDetailsComponent({ productId }: { productId: string }) {
  const { loading, error, data } = useQuery<ProductQueryData>(GET_PRODUCT, {
    variables: { id: productId },
  });

  if (loading) return <p>Cargando...</p>;
  if (error) return <p>Error: {error.message}</p>;

  const product = data?.findByIdProduct;
  if (!product) return <p>Producto no encontrado</p>;

  return (
    <div className="p-4 border rounded shadow-md">
      <h2 className="text-xl font-bold">{product.name}</h2>
      <p className="text-gray-700">{product.description}</p>
      <p className="text-green-600 font-bold">${product.price}</p>
    </div>
  );
}

export default function ProductDetails({ productId }: { productId: string }) {
  return (
    <ApolloProvider client={client}>
      <ProductDetailsComponent productId={productId} />
    </ApolloProvider>
  );
}
```

---
## 4️⃣ Crear un producto en el backend

Antes de probar el componente, asegúrate de que el producto existe en la base de datos. Puedes crearlo con la siguiente **mutación GraphQL** en `http://localhost:8000/api/graphql`:

```graphql
mutation {
  createProduct(input: {
    _id: "12345"
    name: "Producto de prueba 2"
    description: "Descripción de prueba 2"
    price: 29.95
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

---
## 📌 Notas Adicionales y Manipulación de Componentes

* Asegúrate de que el backend GraphQL está corriendo y accesible en `http://localhost:8000/api/graphql`.
* (De 2-4-resolvers) Si tienes datos corruptos, entra en la consola del backend (`docker exec -ti backend-app /bin/bash`):
    > y limpia el contenido con: `php bin/console doctrine:schema:drop --force && php bin/console doctrine:schema:create && php bin/console doctrine:fixtures:load -n`.

### Cómo usar los componentes

- **`ApolloTest`**: Comprueba si la conexión con GraphQL está funcionando correctamente.
- **`ProductDetails`**: Permite visualizar un producto específico a partir de su ID en la API GraphQL.

### Cómo integrar `ProductDetails` en una página

Edita `app/page.tsx` e incluye `ProductDetails` con un ID de prueba:

```tsx
import ProductDetails from "../components/ProductDetails";

export default function Home() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Detalles del Producto</h1>
      <ProductDetails productId="12345" />
    </div>
  );
}
```

### Consultar detalles del producto en GraphQL

```graphql
query {
  findByIdProduct(id: "12345") {
    id
    name
    description
    price
  }
}
```

🎉 ¡Listo! Ahora el frontend puede obtener y mostrar detalles de un producto desde GraphQL.