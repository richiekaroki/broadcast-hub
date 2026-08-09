import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'react-redux';
import { store } from './store/store';
import { useAppSelector } from './store/hooks';
import { Toaster } from './components/Toast';
import { ErrorBoundary } from './components/ErrorBoundary';

// Lazy-loaded pages — only the visited route is bundled
const LandingPage    = lazy(() => import('./features/landing/LandingPage').then(m => ({ default: m.LandingPage })));
const LoginPage      = lazy(() => import('./features/auth/LoginPage').then(m => ({ default: m.LoginPage })));
const AuthVerifyPage = lazy(() => import('./features/auth/AuthVerifyPage').then(m => ({ default: m.AuthVerifyPage })));
const OAuthCallback  = lazy(() => import('./features/auth/OAuthCallback').then(m => ({ default: m.OAuthCallback })));
const DashboardPage  = lazy(() => import('./features/dashboard/DashboardPage').then(m => ({ default: m.DashboardPage })));
const LiveFeedPage   = lazy(() => import('./features/live-feed/LiveFeedPage').then(m => ({ default: m.LiveFeedPage })));
const ContentPage    = lazy(() => import('./features/content/ContentPage').then(m => ({ default: m.ContentPage })));
const StatsPage      = lazy(() => import('./features/stats/StatsPage').then(m => ({ default: m.StatsPage })));
const SettingsPage   = lazy(() => import('./features/settings/SettingsPage').then(m => ({ default: m.SettingsPage })));

// Mobile CSS (appended to index.css behaviours)
import './mobile.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:  30_000,
      retry:      1,
      refetchOnWindowFocus: true,
    },
  },
});

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAppSelector(s => s.auth.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <Suspense>
        <Routes>
          {/* Public */}
          <Route path="/"             element={<LandingPage />} />
          <Route path="/login"        element={<LoginPage />} />
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
      </Suspense>

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
