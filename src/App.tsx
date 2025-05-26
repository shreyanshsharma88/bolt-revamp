import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ChatContainer, GlassBox, Navbar } from "./components";
import { AppThemeProvider, GlobalProvider } from "./providers";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  },
});

function App() {
  return (
    <AppThemeProvider>
      <GlassBox>
        <QueryClientProvider client={queryClient}>
          <GlobalProvider>
            <Navbar />
            <ChatContainer />
          </GlobalProvider>
        </QueryClientProvider>
      </GlassBox>
    </AppThemeProvider>
  );
}

export default App;
