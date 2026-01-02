import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import AuthPage from "@/pages/Auth";
import { useEffect } from "react";

// Composant de redirection pour sécuriser l'accès au Dashboard en production
function DashboardRedirect() {
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    // Rediriger immédiatement vers la page d'accueil en production
    setLocation("/");
  }, [setLocation]);
  
  return null;
}

function Router() {
  // Vérifier si on est en mode développement
  const isDev = import.meta.env.DEV;
  
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      {/* En développement : accès au Dashboard autorisé */}
      {/* En production : redirection vers la page d'accueil */}
      {isDev ? (
      <Route path={"/dashboard"} component={Dashboard} />
      ) : (
        <Route path={"/dashboard"} component={DashboardRedirect} />
      )}
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
