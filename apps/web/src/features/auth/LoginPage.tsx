import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../store/hooks';
import { setAuthenticated, setUser } from '../../store/authSlice';
import { login } from '../../api/client';

interface LoginPageProps {
  onLogin?: () => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const dispatch  = useAppDispatch();
  const navigate  = useNavigate();
  const [email,    setEmail]    = useState('admin@demo.com');
  const [password, setPassword] = useState('Demo1234!');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { accessToken, refreshToken } = await login(email, password);
      localStorage.setItem('accessToken',  accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      // Decode role from JWT for sidebar display
      try {
        const payload = JSON.parse(atob(accessToken.split('.')[1]));
        dispatch(setUser({ name: email.split('@')[0], role: payload.role?.replace('_', ' '), email }));
      } catch {}

      dispatch(setAuthenticated(true));
      onLogin?.();
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight:      '100vh',
      background:     'var(--color-bg-page)',
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      padding:        '24px',
      position:       'relative',
      overflow:       'hidden',
    }}>
      {/* Background grid */}
      <div style={{
        position:   'absolute',
        inset:      0,
        backgroundImage: `
          linear-gradient(rgba(232,89,60,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(232,89,60,0.04) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
        pointerEvents: 'none',
      }} />

      <div className="animate-fade-up" style={{ width: '100%', maxWidth: '400px', position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            width: '48px', height: '48px', background: 'var(--color-orange)',
            borderRadius: '10px', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '24px', margin: '0 auto 16px',
          }}>📡</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 700, letterSpacing: '0.04em' }}>
            BroadcastHub
          </div>
          <div style={{ fontSize: '13px', color: 'var(--color-muted)', marginTop: '4px' }}>
            Sign in to your workspace
          </div>
        </div>

        {/* Card */}
        <div style={{
          background:   'var(--color-bg-card)',
          border:       '1px solid var(--color-border)',
          borderRadius: '16px',
          padding:      '32px',
        }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                style={inputStyle}
                placeholder="admin@demo.com"
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={labelStyle}>Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={inputStyle}
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div style={{
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: '8px', padding: '10px 14px', marginBottom: '16px',
                fontSize: '13px', color: 'var(--color-red)',
              }}>
                {error}
              </div>
            )}

<button type="submit"
              disabled={loading}
              style={{
                width:        '100%',
                padding:      '13px',
                background:   loading ? 'rgba(232,89,60,0.5)' : 'var(--color-orange)',
                border:       'none',
                borderRadius: '8px',
                color:        '#fff',
                fontSize:     '14px',
                fontWeight:   600,
                cursor:       loading ? 'not-allowed' : 'pointer',
                fontFamily:   'var(--font-body)',
                transition:   'background 0.15s',
                marginBottom: '12px',
              }}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>

            {/* Google OAuth */}
            <a
              href="/api/v1/auth/oauth/google"
              style={{
                display:      'flex',
                alignItems:   'center',
                justifyContent: 'center',
                gap:          '10px',
                width:        '100%',
                padding:      '12px',
                background:   'transparent',
                border:       '1px solid var(--color-border)',
                borderRadius: '8px',
                color:        'var(--color-text)',
                fontSize:     '14px',
                textDecoration: 'none',
                transition:   'border-color 0.15s',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </a>
          </form>
        </div>

        {/* Demo credentials */}
        <div style={{
          marginTop:    '20px',
          background:   'rgba(232,89,60,0.06)',
          border:       '1px solid rgba(232,89,60,0.2)',
          borderRadius: '10px',
          padding:      '16px',
          fontSize:     '12px',
          color:        'var(--color-muted)',
        }}>
          <div style={{ fontWeight: 600, color: 'var(--color-orange)', marginBottom: '8px', letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: '11px' }}>
            Demo credentials
          </div>
          {[
            ['super_admin', 'admin@demo.com'],
            ['editor',      'editor@demo.com'],
            ['presenter',   'presenter@demo.com'],
          ].map(([role, email]) => (
            <div key={role} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ color: 'var(--color-text)', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>{role}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>{email}</span>
            </div>
          ))}
          <div style={{ marginTop: '8px', borderTop: '1px solid var(--color-border)', paddingTop: '8px' }}>
            Password: <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text)', fontSize: '11px' }}>Demo1234!</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display:     'block',
  fontSize:    '12px',
  fontWeight:  500,
  color:       'var(--color-muted)',
  marginBottom: '6px',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
};

const inputStyle: React.CSSProperties = {
  width:        '100%',
  padding:      '11px 14px',
  background:   'var(--color-bg-elevated)',
  border:       '1px solid var(--color-border)',
  borderRadius: '8px',
  color:        'var(--color-text)',
  fontSize:     '14px',
  fontFamily:   'var(--font-body)',
  outline:      'none',
  boxSizing:    'border-box',
  transition:   'border-color 0.15s',
};
