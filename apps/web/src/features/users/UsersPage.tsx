import { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { useAppSelector } from '../../store/hooks';
import { listUsers, changeUserRole, getAuditLogs, type UserProfile, type AuditLogEntry } from '../../api';
import { toast } from '../../components/infra/Toast';

const ROLES = ['super_admin', 'editor', 'presenter', 'advertiser', 'viewer'] as const;

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  editor: 'Editor',
  presenter: 'Presenter',
  advertiser: 'Advertiser',
  viewer: 'Viewer',
};

const ROLE_COLORS: Record<string, string> = {
  super_admin: 'var(--orange)',
  editor: 'var(--green)',
  presenter: 'var(--amber)',
  advertiser: '#8b5cf6',
  viewer: 'var(--text-secondary)',
};

export function UsersPage() {
  const { userRole } = useAppSelector(s => s.auth);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'users' | 'audit'>('users');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [u, l] = await Promise.all([listUsers(), getAuditLogs()]);
        if (!cancelled) { setUsers(u); setLogs(l); }
      } catch (err: any) {
        if (!cancelled) toast.error(err.message || 'Failed to load data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  async function handleRoleChange(userId: string, newRole: string) {
    try {
      await changeUserRole(userId, newRole);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      toast.success('Role updated');
      // Refresh audit logs
      const l = await getAuditLogs();
      setLogs(l);
    } catch (err: any) {
      toast.error(err.message || 'Failed to change role');
    }
  }

  if (userRole !== 'super_admin') {
    return (
      <DashboardLayout activeItem="users">
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>
            Access Denied
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Only Super Admins can access user management.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activeItem="users">
      <div style={{ maxWidth: '900px' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: 'var(--bg-elevated)', borderRadius: '8px', padding: '4px' }}>
          {[
            { key: 'users', label: 'Users', count: users.length },
            { key: 'audit', label: 'Audit Log', count: logs.length },
          ].map(t => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key as any)}
              style={{
                flex: 1, padding: '10px', borderRadius: '6px',
                border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                fontFamily: 'var(--font-body)',
                background: tab === t.key ? 'var(--bg-card)' : 'transparent',
                color: tab === t.key ? 'var(--text-primary)' : 'var(--text-secondary)',
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              {t.label} ({t.count})
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>Loading…</div>
        ) : tab === 'users' ? (
          /* ── Users List ─────────────────────────────────────────────────── */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {users.map((u, i) => (
              <div
                key={u.id}
                className="card anim-slide-up"
                style={{
                  padding: '16px 20px',
                  display: 'flex', alignItems: 'center', gap: '14px',
                  animationDelay: `${i * 40}ms`,
                }}
              >
                {/* Avatar */}
                <div style={{
                  width: '40px', height: '40px', borderRadius: '10px',
                  background: `linear-gradient(135deg, ${ROLE_COLORS[u.role] || 'var(--orange)'}, #1a1a2e)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '16px', fontWeight: 700, flexShrink: 0, color: '#fff',
                }}>
                  {u.name.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '2px' }}>{u.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{u.email}</div>
                </div>

                {/* Role badge */}
                <div style={{
                  padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600,
                  background: `${ROLE_COLORS[u.role]}15`,
                  color: ROLE_COLORS[u.role],
                  border: `1px solid ${ROLE_COLORS[u.role]}30`,
                  textTransform: 'uppercase', letterSpacing: '0.04em',
                  whiteSpace: 'nowrap',
                }}>
                  {ROLE_LABELS[u.role] || u.role}
                </div>

                {/* Role select */}
                <select
                  value={u.role}
                  onChange={e => handleRoleChange(u.id, e.target.value)}
                  style={{
                    padding: '6px 10px', borderRadius: '6px',
                    background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                    color: 'var(--text-primary)', fontSize: '12px',
                    cursor: 'pointer', fontFamily: 'var(--font-body)',
                    minWidth: '130px',
                  }}
                >
                  {ROLES.map(r => (
                    <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        ) : (
          /* ── Audit Log ──────────────────────────────────────────────────── */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {logs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
                No audit logs yet.
              </div>
            ) : logs.map((log, i) => (
              <div
                key={log.id}
                className="card anim-slide-up"
                style={{
                  padding: '14px 18px',
                  display: 'flex', alignItems: 'center', gap: '12px',
                  animationDelay: `${i * 30}ms`,
                }}
              >
                <div style={{
                  width: '8px', height: '8px', borderRadius: '50%',
                  background: 'var(--orange)', flexShrink: 0,
                }} />
                <div style={{ flex: 1, fontSize: '13px' }}>
                  <span style={{ fontWeight: 600 }}>{log.actorEmail}</span>
                  {' '}
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {log.action === 'role_changed' ? 'changed role of' : log.action}
                  </span>
                  {' '}
                  {log.meta?.targetEmail && (
                    <span style={{ fontWeight: 600 }}>{log.meta.targetEmail}</span>
                  )}
                  {log.meta?.oldRole && log.meta?.newRole && (
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {' '}from <span style={{ color: ROLE_COLORS[log.meta.oldRole] }}>{ROLE_LABELS[log.meta.oldRole]}</span>
                      {' '}to <span style={{ color: ROLE_COLORS[log.meta.newRole] }}>{ROLE_LABELS[log.meta.newRole]}</span>
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>
                  {new Date(log.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
