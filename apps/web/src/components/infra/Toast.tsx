import { useState, useCallback, useEffect, useRef } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────
export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id:      string;
  type:    ToastType;
  title:   string;
  message?: string;
}

// ── Global event bus (no context needed) ─────────────────────────────────────
type Listener = (toast: Toast) => void;
const listeners: Listener[] = [];

export const toast = {
  success: (title: string, message?: string) => emit({ type: 'success', title, message }),
  error:   (title: string, message?: string) => emit({ type: 'error',   title, message }),
  info:    (title: string, message?: string) => emit({ type: 'info',    title, message }),
  warning: (title: string, message?: string) => emit({ type: 'warning', title, message }),
};

function emit(partial: Omit<Toast, 'id'>) {
  const t: Toast = { ...partial, id: `${Date.now()}-${Math.random()}` };
  listeners.forEach(fn => fn(t));
}

// ── Hook ──────────────────────────────────────────────────────────────────────
function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const fn: Listener = t => setToasts(prev => [...prev, t]);
    listeners.push(fn);
    return () => { const i = listeners.indexOf(fn); if (i > -1) listeners.splice(i, 1); };
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return { toasts, dismiss };
}

// ── Single toast item ─────────────────────────────────────────────────────────
function ToastItem({ toast: t, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Entrance animation
    requestAnimationFrame(() => setVisible(true));
    // Auto-dismiss after 4s
    timerRef.current = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onDismiss(t.id), 300);
    }, 4000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [t.id, onDismiss]);

  const colors = {
    success: { border: 'rgba(34,197,94,0.3)',  icon: '✓', iconColor: '#22C55E', bar: '#22C55E' },
    error:   { border: 'rgba(239,68,68,0.3)',   icon: '✕', iconColor: '#EF4444', bar: '#EF4444' },
    warning: { border: 'rgba(245,158,11,0.3)',  icon: '!', iconColor: '#F59E0B', bar: '#F59E0B' },
    info:    { border: 'rgba(232,89,60,0.3)',   icon: 'i', iconColor: '#E8593C', bar: '#E8593C' },
  }[t.type];

  return (
    <div style={{
      position:     'relative',
      background:   'var(--bg-card)',
      border:       `1px solid ${colors.border}`,
      borderRadius: 'var(--r-lg)',
      padding:      '12px 14px',
      minWidth:     '280px',
      maxWidth:     '340px',
      boxShadow:    'var(--shadow-float)',
      overflow:     'hidden',
      transform:    visible ? 'translateX(0)' : 'translateX(110%)',
      opacity:      visible ? 1 : 0,
      transition:   'transform 0.3s cubic-bezier(0.22,1,0.36,1), opacity 0.3s ease',
      cursor:       'pointer',
    }}
      onClick={() => { setVisible(false); setTimeout(() => onDismiss(t.id), 300); }}
    >
      <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
        {/* Icon */}
        <div style={{
          width: '20px', height: '20px', borderRadius: '50%',
          background: `${colors.iconColor}20`,
          border: `1px solid ${colors.iconColor}40`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '10px', fontWeight: 700, color: colors.iconColor,
          flexShrink: 0, marginTop: '1px',
        }}>{colors.icon}</div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>
            {t.title}
          </div>
          {t.message && (
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.5 }}>
              {t.message}
            </div>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{
        position:   'absolute',
        bottom:     0, left: 0,
        height:     '2px',
        background: colors.bar,
        animation:  'toast-shrink 4s linear forwards',
        width:      '100%',
      }}/>
    </div>
  );
}

// ── Toaster (mount once in App.tsx) ──────────────────────────────────────────
export function Toaster() {
  const { toasts, dismiss } = useToasts();

  return (
    <>
      {/* Inject keyframes */}
      <style>{`@keyframes toast-shrink { from { width: 100%; } to { width: 0%; } }`}</style>
      <div style={{
        position:      'fixed',
        bottom:        '24px',
        right:         '24px',
        zIndex:        1000,
        display:       'flex',
        flexDirection: 'column',
        gap:           '8px',
        pointerEvents: 'none',
      }}>
        {toasts.map(t => (
          <div key={t.id} style={{ pointerEvents: 'all' }}>
            <ToastItem toast={t} onDismiss={dismiss} />
          </div>
        ))}
      </div>
    </>
  );
}
