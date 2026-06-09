import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'react-redux';
import { store } from './store/store';
import { useAppSelector, useAppDispatch } from './store/hooks';
import { setAuthenticated } from './store/authSlice';
import { Toaster } from './components/Toast';

// Pages
import { LandingPage }   from './features/landing/LandingPage';
import { LoginPage }     from './features/auth/LoginPage';
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

        {/* Protected */}
        <Route path="/dashboard"   element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
        <Route path="/live-feed"   element={<PrivateRoute><LiveFeedPage  /></PrivateRoute>} />
        <Route path="/content"     element={<PrivateRoute><ContentPage   /></PrivateRoute>} />
        <Route path="/stats"       element={<PrivateRoute><StatsPage     /></PrivateRoute>} />
        <Route path="/settings"    element={<PrivateRoute><SettingsPage  /></PrivateRoute>} />

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
