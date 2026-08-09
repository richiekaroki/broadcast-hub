import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../store/hooks';
import { setAuthenticated, setUser } from '../../store/authSlice';
import { tokens } from '../../api/client';
import { toast } from '../../components/Toast';

/**
 * Route: /auth/callback
 *
 * The NestJS Google OAuth callback redirects here with tokens in the URL fragment:
 *   /auth/callback#accessToken=<jwt>&refreshToken=<jwt>
 *
 * Fragments (#) are never sent to the server, keeping tokens out of server logs,
 * browser history logs, and Referer headers.
 *
 * This page:
 *  1. Reads tokens from the URL fragment
 *  2. Stores them in localStorage
 *  3. Decodes the JWT payload for user info
 *  4. Dispatches auth state to Redux
 *  5. Redirects to /dashboard
 *  6. Handles errors (missing tokens, malformed JWT)
 */
export function OAuthCallback() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const handled  = useRef(false); // prevent double-run in React StrictMode

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    // Read from URL fragment (#) instead of query params (?)
    const hash           = window.location.hash.slice(1); // strip leading #
    const params         = new URLSearchParams(hash);
    const accessToken    = params.get('accessToken');
    const refreshToken   = params.get('refreshToken');

    if (!accessToken || !refreshToken) {
      toast.error('OAuth failed', 'No tokens received from Google.');
      navigate('/login', { replace: true });
      return;
    }

    // Store tokens
    tokens.set(accessToken, refreshToken);

    // Decode payload (no verification needed — server already verified it)
    try {
      const payload = JSON.parse(atob(accessToken.split('.')[1]));
      dispatch(setAuthenticated(true));
      dispatch(setUser({
        name:  payload.email?.split('@')[0] ?? 'User',
        role:  payload.role?.replace('_', ' ') ?? 'viewer',
        email: payload.email ?? '',
      }));
    } catch {
      // Decode failed — still authenticated, just no display name
      dispatch(setAuthenticated(true));
    }

    toast.success('Signed in with Google');

    // Clean URL and redirect — replace history so back button doesn't return to callback
    navigate('/dashboard', { replace: true });
  }, [dispatch, navigate]);

  return (
    <div style={{
      minHeight:      '100vh',
      background:     'var(--bg-base)',
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      flexDirection:  'column',
      gap:            '16px',
    }}>
      {/* Spinner */}
      <div style={{
        width:        '36px',
        height:       '36px',
        border:       '3px solid var(--border)',
        borderTop:    '3px solid var(--orange)',
        borderRadius: '50%',
        animation:    'spin-slow 0.8s linear infinite',
      }}/>
      <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
        Completing sign-in…
      </div>
    </div>
  );
}
