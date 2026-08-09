import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppDispatch } from '../../store/hooks';
import { setAuthenticated, setUser } from '../../store/authSlice';
import { verifyMagicLink } from '../../api/client';

export function AuthVerifyPage() {
  const dispatch  = useAppDispatch();
  const navigate  = useNavigate();
  const [searchParams] = useSearchParams();
  const [error,   setError]   = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setError('Missing token');
      return;
    }

    verifyMagicLink(token)
      .then(() => {
        dispatch(setAuthenticated(true));
        dispatch(setUser({ name: 'User', role: 'viewer' }));
        navigate('/', { replace: true });
      })
      .catch((err: any) => {
        setError(err.message || 'Invalid or expired magic link');
      });
  }, [searchParams, dispatch, navigate]);

  if (error) {
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
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
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
              {error}
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
          <div className="loading-pulse" style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
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
