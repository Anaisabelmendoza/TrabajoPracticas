"use client";
import { ApolloProvider, gql, useQuery } from "@apollo/client";
import createApolloClient from "../../lib/apolloClient";

const client = createApolloClient();

const TEST_QUERY = gql`
  query {
    __typename
  }
`;

function GraphQLTestComponent() {
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
        <GraphQLTestComponent />
      </div>
    </ApolloProvider>
  );
}