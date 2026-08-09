import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchContent, fetchPrograms, fetchDashboardStats } from '../../api/client';

// ── Fallback demo data (shown when API is empty or unavailable) ───────────────
const DEMO_CONTENT = [
  { id: '1', title: 'Evening News Bulletin — June 2026', body: 'Top stories from across Kenya and the region. Markets closed higher, with the NSE gaining 1.2% on the back of strong telecoms earnings.', status: 'published', createdAt: new Date().toISOString() },
  { id: '2', title: 'Sports Wrap: AFC Champions League Preview', body: 'Gor Mahia face a tough away tie in the AFC Champions League preliminary round. Coach Johnstone Omolo previews the match.', status: 'published', createdAt: new Date().toISOString() },
  { id: '3', title: 'Tech Today: AI in Kenyan Healthcare', body: 'Local startups are deploying machine learning models to improve early diagnosis in rural clinics.', status: 'published', createdAt: new Date().toISOString() },
];

const DEMO_PROGRAMS = [
  { id: '1', title: 'Morning Drive Show', startTime: new Date(Date.now() + 3600000).toISOString(), endTime: new Date(Date.now() + 7200000).toISOString(), status: 'scheduled' },
  { id: '2', title: 'Midday News Bulletin', startTime: new Date(Date.now() + 14400000).toISOString(), endTime: new Date(Date.now() + 18000000).toISOString(), status: 'scheduled' },
  { id: '3', title: 'Afternoon Talk Radio', startTime: new Date(Date.now() - 3600000).toISOString(), endTime: new Date(Date.now() + 3600000).toISOString(), status: 'live' },
];

const DEMO_STATS = { totalUsers: 1247, totalContent: 342, publishedContent: 89, todayViews: 12400 };

// ── SVG Icons ────────────────────────────────────────────────────────────────
function IconContent() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
    </svg>
  );
}
function IconSchedule() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  );
}
function IconUsers() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
    </svg>
  );
}
function IconEye() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  );
}

export function LandingPage() {
  const navigate = useNavigate();

  // Fetch real data from API (with fallback)
  const { data: rawContent = [] } = useQuery({
    queryKey: ['content'],
    queryFn: fetchContent,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const { data: programsResponse } = useQuery({
    queryKey: ['programs'],
    queryFn: () => fetchPrograms(1, 10),
    retry: false,
    refetchOnWindowFocus: false,
  });

  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: fetchDashboardStats,
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Use real data if available, fallback to demo
  const publishedContent = (rawContent.length > 0 ? rawContent : DEMO_CONTENT)
    .filter((c: any) => c.status === 'published')
    .slice(0, 3);

  const programs = (programsResponse?.data?.length ? programsResponse.data : DEMO_PROGRAMS).slice(0, 3);

  const platformStats = stats ?? DEMO_STATS;

  return (
    <div className="lp">
      <a href="#main-content" className="skip-link">Skip to main content</a>

      {/* ── Navbar (simplified) ──────────────────────────────────────────── */}
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

          <div className="lp-nav-links">
            <a href="#live-preview">Live Preview</a>
          </div>

          <div className="lp-nav-actions">
            <button type="button" className="lp-btn-primary" onClick={() => navigate('/login')}>
              Get Started
            </button>
          </div>
        </div>
      </nav>

      <main id="main-content">
        {/* ── Hero ────────────────────────────────────────────────────────── */}
        <header className="lp-hero">
          <div className="lp-hero-content">
            <h1 className="lp-hero-title">
              Content that ships.<br />
              <span className="text-gradient">Broadcasts that shine.</span>
            </h1>

            <p className="lp-hero-sub">
              Manage articles, schedules, and broadcasts from one dashboard.
              Built for radio stations, TV networks, and digital publishers.
            </p>

            <div className="lp-hero-cta">
              <button type="button" className="lp-btn-primary lg" onClick={() => navigate('/login')}>
                Start Free
              </button>
              <a href="#live-preview" className="lp-btn-ghost lg" style={{ textDecoration: 'none' }}>
                See it in action
              </a>
            </div>
          </div>
        </header>

        {/* ── Stats strip ─────────────────────────────────────────────────── */}
        <div className="lp-stats">
          <div className="lp-stats-inner">
            {[
              { value: platformStats.totalUsers.toLocaleString(), label: 'Users' },
              { value: platformStats.publishedContent.toString(), label: 'Published' },
              { value: platformStats.todayViews.toLocaleString(), label: 'Views Today' },
              { value: '99.99%', label: 'Uptime' },
            ].map(s => (
              <div key={s.label} className="lp-stat">
                <span className="lp-stat-value">{s.value}</span>
                <span className="lp-stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Live Preview Section ────────────────────────────────────────── */}
        <section id="live-preview" className="lp-features" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="lp-section-header">
            <h2 className="lp-section-title">
              See it in action
            </h2>
            <p className="lp-section-sub">
              Real content and schedules from the platform. No login required.
            </p>
          </div>

          <div className="lp-preview-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            {/* Published Content */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <IconContent />
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 600, margin: 0 }}>
                  Published Content
                </h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {publishedContent.map((item: any) => (
                  <div key={item.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 600, marginBottom: '6px' }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {item.body}
                    </div>
                    <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--text-tertiary)' }}>
                      {new Date(item.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Broadcast Schedule */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <IconSchedule />
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 600, margin: 0 }}>
                  Broadcast Schedule
                </h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {programs.map((prog: any) => {
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
                        {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} to {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div style={{ marginTop: '8px' }}>
                        <span className={`status-${prog.status === 'live' ? 'published' : 'pending'}`} style={{ fontSize: '10px', padding: '3px 8px', borderRadius: 4, fontWeight: 500 }}>
                          {prog.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ── Features (compact) ──────────────────────────────────────────── */}
        <section className="lp-how">
          <div className="lp-section-header">
            <h2 className="lp-section-title">
              Built for teams that ship fast
            </h2>
          </div>

          <div className="lp-steps">
            {[
              { num: '01', title: 'Create', desc: 'Write content in a clean editor. Save as draft until ready.' },
              { num: '02', title: 'Review', desc: 'Submit for review. Editors and admins approve with feedback.' },
              { num: '03', title: 'Publish', desc: 'One click to go live. Analytics start tracking immediately.' },
            ].map(s => (
              <div key={s.num} className="lp-step">
                <div className="lp-step-num">{s.num}</div>
                <h3 className="lp-step-title">{s.title}</h3>
                <p className="lp-step-desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA ─────────────────────────────────────────────────────────── */}
        <section className="lp-cta">
          <h2 className="lp-cta-title">
            Ready to ship faster?
          </h2>
          <p className="lp-cta-sub">
            Free for small teams. No credit card required.
          </p>
          <button type="button" className="lp-btn-primary white lg" onClick={() => navigate('/login')}>
            Start Free Trial
          </button>
        </section>
      </main>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="lp-footer" role="contentinfo">
        <div className="lp-footer-inner">
          <div className="lp-footer-brand">
            <div className="lp-logo">
              <div className="lp-logo-icon" aria-hidden="true">
                <svg width="14" height="14" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              <span className="lp-logo-text">Wam Broadcast Hub</span>
            </div>
            <p className="lp-footer-desc">
              Content distribution for radio, TV, and digital publishers.
            </p>
          </div>
          <div className="lp-footer-links">
            <a href="#live-preview">Live Preview</a>
            <a href="/login">Get Started</a>
          </div>
        </div>
        <div className="lp-footer-bottom">
          <span>&copy; 2026 Wam Broadcast Hub</span>
        </div>
      </footer>
    </div>
  );
}
