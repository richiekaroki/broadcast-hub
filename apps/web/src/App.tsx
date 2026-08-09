import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'react-redux';
import { store } from './store/store';
import { useAppSelector, useAppDispatch } from './store/hooks';
import { setAuthenticated } from './store/authSlice';
import { Toaster } from './components/Toast';
import { ErrorBoundary } from './components/ErrorBoundary';

// Pages
import { LandingPage }   from './features/landing/LandingPage';
import { LoginPage }     from './features/auth/LoginPage';
import { AuthVerifyPage } from './features/auth/AuthVerifyPage';
import { OAuthCallback } from './features/auth/OAuthCallback';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { LiveFeedPage }  from './features/live-feed/LiveFeedPage';
import { ContentPage }   from './features/content/ContentPage';
import { StatsPage }     from './features/stats/StatsPage';
import { SettingsPage }  from './features/settings/SettingsPage';

// Mobile CSS (appended to index.css behaviours)
import './mobile.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:  30_000,
      retry:      1,
      // Show stale data while revalidating — prevents full loading screens on nav
      refetchOnWindowFocus: true,
    },
  },
});

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAppSelector(s => s.auth.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function AppRoutes() {
  const dispatch    = useAppDispatch();
  const handleLogin = () => dispatch(setAuthenticated(true));

  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/"             element={<LandingPage />} />
        <Route path="/login"        element={<LoginPage onLogin={handleLogin} />} />
        <Route path="/auth/callback" element={<OAuthCallback />} />
        <Route path="/auth/verify"   element={<AuthVerifyPage />} />

        {/* Protected */}
        <Route path="/dashboard"   element={<ErrorBoundary><PrivateRoute><DashboardPage /></PrivateRoute></ErrorBoundary>} />
        <Route path="/live-feed"   element={<ErrorBoundary><PrivateRoute><LiveFeedPage  /></PrivateRoute></ErrorBoundary>} />
        <Route path="/content"     element={<ErrorBoundary><PrivateRoute><ContentPage   /></PrivateRoute></ErrorBoundary>} />
        <Route path="/stats"       element={<ErrorBoundary><PrivateRoute><StatsPage     /></PrivateRoute></ErrorBoundary>} />
        <Route path="/settings"    element={<ErrorBoundary><PrivateRoute><SettingsPage  /></PrivateRoute></ErrorBoundary>} />

        {/* Fallback */}
        <Route path="*" element={<LandingPage />} />
      </Routes>

      {/* Global toast container */}
      <Toaster />
    </BrowserRouter>
  );
}

export function App() {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <AppRoutes />
      </QueryClientProvider>
    </Provider>
  );
}
