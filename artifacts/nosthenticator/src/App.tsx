import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { AppLayout } from "@/components/layout/app-layout";
import NotFound from "@/pages/not-found";

import Dashboard from "@/pages/dashboard";
import KeysList from "@/pages/keys/index";
import KeyAdd from "@/pages/keys/add";
import KeyDetail from "@/pages/keys/detail";
import PendingList from "@/pages/pending/index";
import AuditLog from "@/pages/log/index";
import Settings from "@/pages/settings/index";

const queryClient = new QueryClient();

function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/keys" component={KeysList} />
        <Route path="/keys/add" component={KeyAdd} />
        <Route path="/keys/:id" component={KeyDetail} />
        <Route path="/pending" component={PendingList} />
        <Route path="/log" component={AuditLog} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="nosthenticator-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
