import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AsteroidsGame from "./components/AsteroidsGame";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AsteroidsGame />
    </QueryClientProvider>
  );
}
