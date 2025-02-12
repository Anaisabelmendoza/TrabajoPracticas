import { ApolloClient, InMemoryCache } from "@apollo/client";

const createApolloClient = () => {
  return new ApolloClient({
    uri: "http://localhost:8000/api/graphql", // Backend ya configurado
    cache: new InMemoryCache(),
  });
};

export default createApolloClient;