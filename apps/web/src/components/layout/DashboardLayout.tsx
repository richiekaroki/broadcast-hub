import { ReactNode } from 'react';
import { MobileSidebar } from './MobileSidebar';
import { useAppSelector } from '../../store/hooks';

type NavItem = 'dashboard' | 'live' | 'content' | 'stats' | 'users' | 'settings';

interface DashboardLayoutProps {
  activeItem: NavItem;
  children: ReactNode;
  /** Optional header right-side content */
  headerRight?: ReactNode;
}

export function DashboardLayout({ activeItem, children, headerRight }: DashboardLayoutProps) {
  const { userName, userRole } = useAppSelector(s => s.auth);

  return (
    <div className="layout-root" style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)' }}>
      <MobileSidebar activeItem={activeItem} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top bar */}
        <header style={{
          height: '52px',
          background: 'var(--bg-raised)',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 20px',
          justifyContent: 'space-between',
          gap: '12px',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: '16px',
            fontWeight: 600,
            letterSpacing: '0.03em',
          }}>
            {activeItem.charAt(0).toUpperCase() + activeItem.slice(1).replace('-', ' ')}
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {headerRight}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '6px',
                background: 'linear-gradient(135deg, var(--orange), #c0392b)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '11px', fontWeight: 700, color: '#fff',
              }}>{userName?.charAt(0) ?? '?'}</div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 500, lineHeight: 1.2 }}>{userName}</div>
                <div style={{ fontSize: '9px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{userRole}</div>
              </div>
            </div>
          </div>
        </header>

        {/* Body */}
        <main style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
