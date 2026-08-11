import { useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { setAuthenticated, setUser } from '../../store/authSlice';
import { useNavigate } from 'react-router-dom';
import { logout, updateProfile } from '../../api';
import { toast } from '../../components/infra/Toast';

export function SettingsPage() {
  const { userName, userRole, userEmail } = useAppSelector(s => s.auth);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(userName);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name.trim() || name.trim() === userName) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      const updated = await updateProfile({ name: name.trim() });
      dispatch(setUser({ name: updated.name, role: updated.role, email: updated.email }));
      toast.success('Profile updated');
      setEditing(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    await logout();
    dispatch(setAuthenticated(false));
    toast.success('Signed out');
    navigate('/login');
  }

  return (
    <DashboardLayout activeItem="settings">
      <div style={{ maxWidth: '600px' }}>

          {/* Profile card */}
          <div className="card anim-slide-up d-1" style={{ padding: '20px', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>
                Profile
              </div>
              {!editing && (
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  style={{
                    background: 'transparent', border: '1px solid var(--border)',
                    borderRadius: '6px', padding: '5px 12px', fontSize: '12px',
                    color: 'var(--text-secondary)', cursor: 'pointer',
                    fontFamily: 'var(--font-body)',
                    transition: 'border-color 0.15s, color 0.15s',
                  }}
                >
                  Edit
                </button>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, var(--orange), #8B2500)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 700, flexShrink: 0 }}>
                {userName.charAt(0)}
              </div>
              <div style={{ flex: 1 }}>
                {editing ? (
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    autoFocus
                    style={{
                      width: '100%', padding: '8px 12px',
                      background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                      borderRadius: '6px', color: 'var(--text-primary)',
                      fontSize: '15px', fontFamily: 'var(--font-body)', outline: 'none',
                    }}
                  />
                ) : (
                  <div style={{ fontSize: '15px', fontWeight: 600 }}>{userName}</div>
                )}
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>{userEmail}</div>
              </div>
            </div>

            {editing && (
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving || !name.trim()}
                  style={{
                    padding: '8px 16px', background: 'var(--orange)', border: 'none',
                    borderRadius: '6px', color: '#fff', fontSize: '13px', fontWeight: 600,
                    cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-body)',
                    opacity: saving || !name.trim() ? 0.5 : 1,
                  }}
                >
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => { setName(userName); setEditing(false); }}
                  style={{
                    padding: '8px 16px', background: 'transparent',
                    border: '1px solid var(--border)', borderRadius: '6px',
                    color: 'var(--text-secondary)', fontSize: '13px',
                    cursor: 'pointer', fontFamily: 'var(--font-body)',
                  }}
                >
                  Cancel
                </button>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {[
                { label: 'Role',   value: userRole },
                { label: 'Status', value: 'Active' },
              ].map(row => (
                <div key={row.label} style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--r-md)', padding: '10px 14px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '3px' }}>{row.label}</div>
                  <div style={{ fontSize: '13px', fontWeight: 500 }}>{row.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* API info */}
          <div className="card anim-slide-up d-3" style={{ padding: '20px', marginBottom: '14px' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: '14px' }}>
              API
            </div>
            {[
              { label: 'Base URL',   value: 'http://localhost:4000/api/v1' },
              { label: 'Swagger',    value: 'http://localhost:4000/api/docs' },
              { label: 'Access TTL', value: '15 minutes' },
              { label: 'Refresh TTL',value: '7 days' },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: '12px' }}>
                <span style={{ color: 'var(--text-tertiary)' }}>{row.label}</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{row.value}</span>
              </div>
            ))}
          </div>

          {/* Sign out */}
          <div className="card anim-slide-up d-4" style={{ padding: '20px' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--red)', marginBottom: '12px' }}>
              Danger Zone
            </div>
            <button type="button" className="btn-ghost" onClick={handleLogout} style={{ borderColor: 'rgba(239,68,68,0.3)', color: 'var(--red)' }}>
              Sign out of all devices
            </button>
          </div>
      </div>
    </DashboardLayout>
  );
}
