import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppDispatch } from '../../store/hooks';
import { setAuthenticated, setUser } from '../../store/authSlice';
import { verifyMagicLink } from '../../api';

export function AuthVerifyPage() {
  const dispatch  = useAppDispatch();
  const navigate  = useNavigate();
  const [searchParams] = useSearchParams();
  const [error,   setError]   = useState('');

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) return;

    verifyMagicLink(token)
      .then((res: any) => {
        const payload = res?.accessToken
          ? JSON.parse(atob(res.accessToken.split('.')[1]))
          : null;
        dispatch(setAuthenticated(true));
        dispatch(setUser({
          name:  payload?.email?.split('@')[0] ?? 'User',
          role:  payload?.role ?? 'viewer',
          email: payload?.email ?? '',
        }));
        navigate('/', { replace: true });
      })
      .catch((err: any) => {
        setError(err.message || 'Invalid or expired magic link');
      });
  }, [token, searchParams, dispatch, navigate]);

  if (!token || error) {
    const message = !token ? 'Missing token' : error;
    return (
      <div style={{
        minHeight: '100vh',
        background: 'var(--color-bg-page)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}>
        <div style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
          <div style={{
            background: 'var(--color-bg-card)',
            border: '1px solid var(--color-border)',
            borderRadius: '16px',
            padding: '40px 32px',
          }}>
            <div style={{ marginBottom: '16px' }}>
              <svg width="48" height="48" fill="none" stroke="var(--color-red)" strokeWidth="1.5" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
            </div>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '20px',
              fontWeight: 700,
              marginBottom: '8px',
            }}>
              Link invalid or expired
            </h2>
            <p style={{
              fontSize: '13px',
              color: 'var(--color-muted)',
              lineHeight: 1.6,
              marginBottom: '20px',
            }}>
              {message}
            </p>
            <a
              href="/login"
              style={{
                display: 'inline-block',
                padding: '12px 24px',
                background: 'var(--color-orange)',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 600,
                textDecoration: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
              }}
            >
              Back to Login
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--color-bg-page)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        <div style={{
          background: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
          borderRadius: '16px',
          padding: '40px 32px',
        }}>
          <div className="loading-pulse" style={{ marginBottom: '16px' }}>
            <svg width="48" height="48" fill="none" stroke="var(--color-orange)" strokeWidth="1.5" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '20px',
            fontWeight: 700,
            marginBottom: '8px',
          }}>
            Signing you in…
          </h2>
          <p style={{
            fontSize: '13px',
            color: 'var(--color-muted)',
          }}>
            Please wait while we verify your magic link.
          </p>
        </div>
      </div>
    </div>
  );
}
