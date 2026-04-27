import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/AppShell";
import Auth from "./pages/Auth";
import Home from "./pages/Home";
import LessonPlayer from "./pages/LessonPlayer";
import Profile from "./pages/Profile";
import ChessPage from "./pages/ChessPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const Protected = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center font-display text-xl">Loading…</div>;
  if (!session) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

const Shelled = ({ children }: { children: React.ReactNode }) => (
  <Protected><AppShell>{children}</AppShell></Protected>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<Shelled><Home /></Shelled>} />
            <Route path="/chess" element={<Shelled><ChessPage /></Shelled>} />
            <Route path="/profile" element={<Shelled><Profile /></Shelled>} />
            <Route path="/lesson/:id" element={<Protected><LessonPlayer /></Protected>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
