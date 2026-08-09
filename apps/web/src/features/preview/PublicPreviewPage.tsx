import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { fetchContent, fetchPrograms, fetchDashboardStats } from '../../api/client';

export function PublicPreviewPage() {
  const navigate = useNavigate();

  const { data: content = [], isLoading: contentLoading } = useQuery({
    queryKey: ['content'],
    queryFn: fetchContent,
  });

  const { data: programs = [], isLoading: programsLoading } = useQuery({
    queryKey: ['programs'],
    queryFn: () => fetchPrograms(1, 10),
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: fetchDashboardStats,
    refetchInterval: 30_000,
  });

  const publishedContent = content.filter((c: any) => c.status === 'published').slice(0, 6);
  const scheduledPrograms = programs.slice(0, 5);

  return (
    <div className="lp" style={{ minHeight: '100vh' }}>
      {/* Nav */}
      <nav className="lp-nav" aria-label="Main navigation">
        <div className="lp-nav-inner">
          <div className="lp-logo">
            <div className="lp-logo-icon" aria-hidden="true">
              <svg width="16" height="16" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="lp-logo-text">Wam Broadcast Hub</span>
          </div>
          <div className="lp-nav-actions">
            <button type="button" className="lp-btn-primary" onClick={() => navigate('/login')}>
              Get Started
            </button>
          </div>
        </div>
      </nav>

      <main id="main-content" style={{ maxWidth: '1120px', margin: '0 auto', padding: '40px 32px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, margin: '0 0 12px' }}>
            Live Preview
          </h1>
          <p style={{ fontSize: '15px', color: 'var(--text-secondary)', margin: 0 }}>
            See what Wam Broadcast Hub looks like in action. This is a live view of published content and scheduled broadcasts.
          </p>
        </div>

        {/* Stats strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '48px' }}>
          {[
            { label: 'Total Users', value: stats?.totalUsers ?? 0, icon: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg> },
            { label: 'Published Articles', value: stats?.publishedContent ?? 0, icon: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> },
            { label: 'Today Views', value: stats?.todayViews ?? 0, icon: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> },
            { label: 'Total Content', value: stats?.totalContent ?? 0, icon: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '20px', textAlign: 'center' }}>
              <div style={{ color: 'var(--orange)', marginBottom: '8px' }}>{s.icon}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 700, marginBottom: '4px' }}>
                {statsLoading ? '—' : typeof s.value === 'number' ? s.value.toLocaleString() : s.value}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Published Content */}
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700, margin: '0 0 16px' }}>
              Published Content
            </h2>
            {contentLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[1, 2, 3].map(i => (
                  <div key={i} className="skeleton" style={{ height: 80, borderRadius: 8 }} />
                ))}
              </div>
            ) : publishedContent.length === 0 ? (
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                No published content yet
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {publishedContent.map((item: any) => (
                  <div key={item.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 600, marginBottom: '6px' }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {item.body}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '11px', color: 'var(--text-tertiary)' }}>
                      <span>{item.authorId ? `Author: ${item.authorId.slice(0, 8)}` : 'Unknown'}</span>
                      <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Broadcast Schedule */}
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700, margin: '0 0 16px' }}>
              Broadcast Schedule
            </h2>
            {programsLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[1, 2, 3].map(i => (
                  <div key={i} className="skeleton" style={{ height: 80, borderRadius: 8 }} />
                ))}
              </div>
            ) : scheduledPrograms.length === 0 ? (
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                No scheduled broadcasts
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {scheduledPrograms.map((prog: any) => {
                  const start = new Date(prog.startTime);
                  const end = new Date(prog.endTime);
                  const isLive = prog.status === 'live';
                  return (
                    <div key={prog.id} style={{ background: 'var(--bg-card)', border: `1px solid ${isLive ? 'rgba(34,197,94,0.3)' : 'var(--border)'}`, borderRadius: 10, padding: '16px', position: 'relative' }}>
                      {isLive && (
                        <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: '#22C55E', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E', animation: 'live-dot 2s ease-in-out infinite' }} />
                          Live
                        </div>
                      )}
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 600, marginBottom: '6px', paddingRight: isLive ? 50 : 0 }}>
                        {prog.title}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {start.toLocaleDateString()} ·                         {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} to {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div style={{ marginTop: '8px' }}>
                        <span className={`status-${prog.status === 'live' ? 'published' : prog.status === 'completed' ? 'draft' : 'pending'}`} style={{ fontSize: '10px', padding: '3px 8px', borderRadius: 4, fontWeight: 500 }}>
                          {prog.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center', marginTop: '64px', padding: '48px 32px', background: 'var(--orange)', borderRadius: 12, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)', backgroundSize: '32px 32px', pointerEvents: 'none' }} />
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 800, color: '#fff', margin: '0 0 12px', position: 'relative' }}>
            Ready to manage your content?
          </h2>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)', margin: '0 0 24px', position: 'relative' }}>
            Free for small teams. No credit card required.
          </p>
          <button type="button" className="lp-btn-primary white lg" onClick={() => navigate('/login')} style={{ position: 'relative' }}>
            Start Free Trial
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="lp-footer" role="contentinfo">
        <div className="lp-footer-bottom" style={{ textAlign: 'center' }}>
          &copy; 2026 Wam Broadcast Hub. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
