import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setAuthenticated } from '../store/authSlice';
import { useNavigate, useLocation } from 'react-router-dom';

type NavItem = 'dashboard' | 'live' | 'content' | 'stats' | 'settings';

const NAV: { id: NavItem; label: string; path: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Dashboard', path: '/dashboard', icon: <DashIcon /> },
  { id: 'live',      label: 'Live',      path: '/live-feed', icon: <LiveIcon /> },
  { id: 'content',   label: 'Content',   path: '/content',   icon: <ContentIcon /> },
  { id: 'stats',     label: 'Stats',     path: '/stats',     icon: <StatsIcon /> },
  { id: 'settings',  label: 'Settings',  path: '/settings',  icon: <SettingsIcon /> },
];

export function Sidebar({ activeItem }: { activeItem?: NavItem }) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { userName, userRole } = useAppSelector(s => s.auth);

  const current: NavItem = activeItem ?? (
    location.pathname.startsWith('/live')     ? 'live'      :
    location.pathname.startsWith('/content')  ? 'content'   :
    location.pathname.startsWith('/stats')    ? 'stats'     :
    location.pathname.startsWith('/settings') ? 'settings'  :
    'dashboard'
  );

  return (
    <aside
      className="anim-slide-in d-0"
      style={{
        width:         '196px',
        minHeight:     '100vh',
        background:    'var(--bg-raised)',
        borderRight:   '1px solid var(--border)',
        display:       'flex',
        flexDirection: 'column',
        position:      'sticky',
        top:           0,
        flexShrink:    0,
        overflowY:     'auto',
      }}
    >
      {/* Logo */}
      <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '30px', height: '30px',
            background: 'var(--orange)',
            borderRadius: '7px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '14px', flexShrink: 0,
            boxShadow: '0 2px 8px rgba(232,89,60,0.35)',
          }}>📡</div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: 700, letterSpacing: '0.03em', lineHeight: 1.15 }}>
              BroadcastHub
            </div>
            <div style={{ fontSize: '9px', color: 'var(--text-tertiary)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: '1px' }}>
              High-Velocity CMS
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '8px 0' }}>
        {NAV.map((item, i) => {
          const isActive = item.id === current;
          return (
            <button type="button"
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`nav-item anim-slide-in d-${i + 1} ${isActive ? 'active' : ''}`}
            >
              <span style={{ width: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {item.icon}
              </span>
              {item.label}

              {/* Live pulsing dot */}
              {item.id === 'live' && (
                <span style={{ marginLeft: 'auto' }}>
                  <span className="live-dot" style={{ width: 6, height: 6 }} />
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* GO LIVE */}
      <div style={{ padding: '0 12px 12px' }}>
        <button type="button"
          className="btn-primary glow-orange"
          onClick={() => navigate('/live-feed')}
          style={{ width: '100%', fontSize: '12px', padding: '10px', letterSpacing: '0.08em', justifyContent: 'center' }}
        >
          <span className="live-dot" style={{ width: 6, height: 6, background: '#fff', flexShrink: 0 }} />
          Go Live
        </button>
      </div>

      {/* Support + user */}
      <div style={{ borderTop: '1px solid var(--border)', padding: '12px 16px' }}>
        <button type="button" style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          background: 'none', border: 'none',
          color: 'var(--text-tertiary)', fontSize: '12px',
          cursor: 'pointer', padding: '0 0 12px', fontFamily: 'var(--font-body)',
          transition: 'color 0.15s',
        }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-tertiary)')}
        >
          <SupportIcon /> Support
        </button>

        {/* User row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '30px', height: '30px', borderRadius: '8px',
            background: 'linear-gradient(135deg, var(--orange) 0%, #8B2500 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '12px', fontWeight: 700, flexShrink: 0, color: '#fff',
          }}>
            {userName.charAt(0)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '12px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3 }}>
              {userName}
            </div>
            <div style={{ fontSize: '9px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {userRole}
            </div>
          </div>
          <button type="button"
            onClick={() => { dispatch(setAuthenticated(false)); navigate('/login'); }}
            title="Sign out"
            style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', fontSize: '13px', padding: '2px', transition: 'color 0.15s', flexShrink: 0 }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-tertiary)')}
          >→</button>
        </div>
      </div>
    </aside>
  );
}

// ── Icon components ───────────────────────────────────────────────────────────
function DashIcon()    { return <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>; }
function LiveIcon()    { return <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" fill="currentColor" stroke="none"/><path d="M6.5 6.5a7 7 0 000 11M17.5 6.5a7 7 0 010 11"/><path d="M3 3a13 13 0 000 18M21 3a13 13 0 010 18"/></svg>; }
function ContentIcon() { return <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/></svg>; }
function StatsIcon()   { return <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>; }
function SettingsIcon(){ return <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>; }
function SupportIcon() { return <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>; }
