import { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';

type NavItem = 'dashboard' | 'live' | 'content' | 'stats' | 'settings';

interface MobileSidebarProps {
  activeItem?: NavItem;
}

/**
 * Drop-in replacement for <Sidebar /> on all pages.
 * On desktop (≥1024px): renders the sidebar normally (sticky).
 * On tablet/mobile (<1024px): hides sidebar, shows a hamburger button
 * in the top-left, and slides the sidebar in as an overlay when tapped.
 *
 * Usage: replace <Sidebar /> with <MobileSidebar /> on every page.
 */
export function MobileSidebar({ activeItem }: MobileSidebarProps) {
  const [open,  setOpen]  = useState(false);
  const [isMob, setIsMob] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)');
    setIsMob(mq.matches);
    const handler = (e: MediaQueryListEvent) => {
      setIsMob(e.matches);
      if (!e.matches) setOpen(false);
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Prevent body scroll when overlay open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!isMob) {
    return <Sidebar activeItem={activeItem} />;
  }

  return (
    <>
      {/* Hamburger button — top-left corner on mobile */}
      <button type="button"
        className="menu-btn"
        onClick={() => setOpen(true)}
        aria-label="Open navigation"
        style={{
          position: 'fixed',
          top:      '10px',
          left:     '12px',
          zIndex:   300,
        }}
      >
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <line x1="3" y1="6"  x2="21" y2="6"/>
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>

      {/* Backdrop */}
      <div
        className={`sidebar-backdrop ${open ? 'open' : ''}`}
        onClick={() => setOpen(false)}
      />

      {/* Sliding sidebar */}
      <div style={{ position: 'fixed', top: 0, left: 0, zIndex: 200, height: '100vh', transform: open ? 'translateX(0)' : 'translateX(-100%)', transition: 'transform 0.28s cubic-bezier(0.22,1,0.36,1)' }}>
        <Sidebar activeItem={activeItem} />
      </div>
    </>
  );
}
