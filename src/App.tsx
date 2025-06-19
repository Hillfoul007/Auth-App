import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index.tsx";
import JoinAsPro from "./pages/JoinAsPro.tsx";
import RiderPortal from "./pages/RiderPortal.tsx";
import EnhancedRiderPortal from "./pages/EnhancedRiderPortal.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import NotFound from "./pages/NotFound.tsx";
import FloatingCart from "./components/FloatingCart";
import ErrorBoundary from "./components/ErrorBoundary";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route
              path="/join-as-pro"
              element={<JoinAsPro onBack={() => window.history.back()} />}
            />
            <Route path="/rider-portal" element={<EnhancedRiderPortal />} />
            <Route path="/rider-portal-legacy" element={<RiderPortal />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <FloatingCart
            onBookServices={() => {
              // Dispatch custom event to trigger booking flow
              window.dispatchEvent(new CustomEvent("bookCartServices"));
            }}
          />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
