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
