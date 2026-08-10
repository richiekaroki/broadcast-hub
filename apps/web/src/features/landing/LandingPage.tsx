import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchContent, fetchPrograms, fetchDashboardStats } from '../../api';

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

function IconContent() {
  return (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
    </svg>
  );
}
function IconSchedule() {
  return (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  );
}
function IconShield() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  );
}
function IconBolt() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" aria-hidden="true">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  );
}
function IconUsers() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
    </svg>
  );
}
function IconChart() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" aria-hidden="true">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  );
}
function IconRadio() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"/><path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5"/><path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5"/><path d="M19.1 4.9C23 8.8 23 15.1 19.1 19"/><circle cx="12" cy="12" r="2"/>
    </svg>
  );
}

export function LandingPage() {
  const navigate = useNavigate();

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

  const publishedContent = (rawContent.length > 0 ? rawContent : DEMO_CONTENT)
    .filter((c: any) => c.status === 'published')
    .slice(0, 3);

  const programs = (programsResponse?.data?.length ? programsResponse.data : DEMO_PROGRAMS).slice(0, 3);
  const platformStats = stats ?? DEMO_STATS;

  return (
    <div className="lp">
      <a href="#main-content" className="skip-link">Skip to main content</a>

      {/* ── Ticker ────────────────────────────────────────────────────────── */}
      <div className="lp-ticker">
        <div className="lp-ticker-track">
          <span className="lp-ticker-item">BROADCAST-READY CMS</span>
          <span className="lp-ticker-dot">·</span>
          <span className="lp-ticker-item">ROLE-BASED ACCESS</span>
          <span className="lp-ticker-dot">·</span>
          <span className="lp-ticker-item">REAL-TIME ANALYTICS</span>
          <span className="lp-ticker-dot">·</span>
          <span className="lp-ticker-item">EDITORIAL WORKFLOWS</span>
          <span className="lp-ticker-dot">·</span>
          <span className="lp-ticker-item">BROADCAST-READY CMS</span>
          <span className="lp-ticker-dot">·</span>
          <span className="lp-ticker-item">ROLE-BASED ACCESS</span>
          <span className="lp-ticker-dot">·</span>
          <span className="lp-ticker-item">REAL-TIME ANALYTICS</span>
          <span className="lp-ticker-dot">·</span>
          <span className="lp-ticker-item">EDITORIAL WORKFLOWS</span>
        </div>
      </div>

      {/* ── Nav ────────────────────────────────────────────────────────────── */}
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
            <a href="#features">Features</a>
            <a href="#live-preview">Live Preview</a>
            <a href="#how">How It Works</a>
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
          <div className="lp-hero-glow" aria-hidden="true" />
          <div className="lp-hero-grid-bg" aria-hidden="true" />
          <div className="lp-hero-content">
            <div className="lp-badge anim-slide-up d-1">
              <span className="lp-badge-dot" />
              Trusted by 1,200+ media teams
            </div>

            <h1 className="lp-hero-title anim-slide-up d-2">
              Content that ships.<br />
              <span className="text-gradient">Broadcasts that shine.</span>
            </h1>

            <p className="lp-hero-sub anim-slide-up d-3">
              Manage articles, schedules, and broadcasts from one dashboard.
              Built for radio stations, TV networks, and digital publishers.
            </p>

            <div className="lp-hero-cta anim-slide-up d-4">
              <button type="button" className="lp-btn-primary lg" onClick={() => navigate('/login')}>
                Start Free
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
              <a href="#live-preview" className="lp-btn-ghost lg" style={{ textDecoration: 'none' }}>
                See it in action
              </a>
            </div>
          </div>

          {/* ── Dashboard Preview ─────────────────────────────────────────── */}
          <div className="lp-preview anim-scale-in d-5">
            <div className="lp-preview-chrome">
              <div className="lp-preview-dots">
                <span /><span /><span />
              </div>
              <span className="lp-preview-title">broadcast-hub.vercel.app/dashboard</span>
            </div>
            <div className="lp-preview-body">
              <div className="lp-preview-sidebar">
                <div className="lp-preview-nav-item active" />
                <div className="lp-preview-nav-item" />
                <div className="lp-preview-nav-item" />
                <div className="lp-preview-nav-item" />
                <div className="lp-preview-nav-item" />
              </div>
              <div className="lp-preview-main">
                <div className="lp-preview-metrics">
                  <div className="lp-preview-metric accent">
                    <div className="lp-preview-metric-value">1,247</div>
                    <div className="lp-preview-metric-label">Total Users</div>
                  </div>
                  <div className="lp-preview-metric">
                    <div className="lp-preview-metric-value">342</div>
                    <div className="lp-preview-metric-label">Content</div>
                  </div>
                  <div className="lp-preview-metric">
                    <div className="lp-preview-metric-value">12.4K</div>
                    <div className="lp-preview-metric-label">Views Today</div>
                  </div>
                </div>
                <div className="lp-preview-chart">
                  <svg viewBox="0 0 400 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M0 50 L40 45 L80 48 L120 35 L160 38 L200 25 L240 28 L280 15 L320 18 L360 10 L400 12" stroke="rgba(232,89,60,0.4)" strokeWidth="2" fill="none"/>
                    <path d="M0 50 L40 45 L80 48 L120 35 L160 38 L200 25 L240 28 L280 15 L320 18 L360 10 L400 12 L400 60 L0 60Z" fill="url(#chart-gradient)"/>
                    <defs>
                      <linearGradient id="chart-gradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgba(232,89,60,0.2)"/>
                        <stop offset="100%" stopColor="rgba(232,89,60,0)"/>
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>
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
            ].map((s, i) => (
              <div key={s.label} className="lp-stat">
                <span className="lp-stat-value">{s.value}</span>
                <span className="lp-stat-label">{s.label}</span>
                {i < 3 && <div className="lp-stat-divider" />}
              </div>
            ))}
          </div>
        </div>

        {/* ── Features Grid ───────────────────────────────────────────────── */}
        <section id="features" className="lp-features-section">
          <div className="lp-section-header">
            <div className="lp-section-label">Platform</div>
            <h2 className="lp-section-title">
              Everything your newsroom needs
            </h2>
            <p className="lp-section-sub">
              A complete content management system built for media teams that need speed, security, and scale.
            </p>
          </div>

          <div className="lp-features-grid">
            {[
              { icon: <IconShield />, title: 'Role-Based Access', desc: '5 permission levels from Viewer to Super Admin. Control who sees what.' },
              { icon: <IconBolt />, title: 'Editorial Workflow', desc: 'Draft → Review → Publish. Full pipeline with rejection feedback and status tracking.' },
              { icon: <IconRadio />, title: 'Broadcast Scheduling', desc: 'Plan and manage live broadcasts. See what\'s on air and what\'s next at a glance.' },
              { icon: <IconChart />, title: 'Real-Time Analytics', desc: 'Track views, engagement, and content performance as it happens.' },
              { icon: <IconUsers />, title: 'Team Collaboration', desc: 'Multiple editors, presenters, and advertisers working from one dashboard.' },
              { icon: <IconContent />, title: 'Content API', desc: 'RESTful API with Swagger docs. Integrate with any platform or build custom tools.' },
            ].map((f, i) => (
              <div key={f.title} className={`lp-feature-card anim-slide-up d-${i + 1}`}>
                <div className="lp-feature-icon">{f.icon}</div>
                <h3 className="lp-feature-label">{f.title}</h3>
                <p className="lp-feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Live Preview ────────────────────────────────────────────────── */}
        <section id="live-preview" className="lp-features">
          <div className="lp-section-header">
            <div className="lp-section-label">Live Data</div>
            <h2 className="lp-section-title">
              See it in action
            </h2>
            <p className="lp-section-sub">
              Real content and schedules from the platform. No login required.
            </p>
          </div>

          <div className="lp-preview-grid">
            {/* Published Content */}
            <div>
              <div className="lp-preview-col-header">
                <IconContent />
                <h3>Published Content</h3>
              </div>
              <div className="lp-preview-col-items">
                {publishedContent.map((item: any) => (
                  <div key={item.id} className="lp-content-card">
                    <div className="lp-content-card-title">
                      {item.title}
                    </div>
                    <div className="lp-content-card-body">
                      {item.body}
                    </div>
                    <div className="lp-content-card-date">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Broadcast Schedule */}
            <div>
              <div className="lp-preview-col-header">
                <IconSchedule />
                <h3>Broadcast Schedule</h3>
              </div>
              <div className="lp-preview-col-items">
                {programs.map((prog: any) => {
                  const start = new Date(prog.startTime);
                  const end = new Date(prog.endTime);
                  const isLive = prog.status === 'live';
                  return (
                    <div key={prog.id} className={`lp-schedule-card ${isLive ? 'lp-schedule-card--live' : ''}`}>
                      {isLive && (
                        <div className="lp-live-badge">
                          <span className="lp-live-dot" />
                          Live
                        </div>
                      )}
                      <div className="lp-schedule-card-title">
                        {prog.title}
                      </div>
                      <div className="lp-schedule-card-time">
                        {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} to {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div>
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

        {/* ── How it works ────────────────────────────────────────────────── */}
        <section id="how" className="lp-how">
          <div className="lp-section-header">
            <div className="lp-section-label">Workflow</div>
            <h2 className="lp-section-title">
              Built for teams that ship fast
            </h2>
          </div>

          <div className="lp-steps">
            <div className="lp-step anim-slide-up d-1">
              <div className="lp-step-num">01</div>
              <div className="lp-step-icon-wrap">
                <IconContent />
              </div>
              <h3 className="lp-step-title">Create</h3>
              <p className="lp-step-desc">Write content in a clean editor. Save as draft until ready for review.</p>
            </div>

            <div className="lp-step-connector" aria-hidden="true">
              <svg width="40" height="2" viewBox="0 0 40 2"><line x1="0" y1="1" x2="40" y2="1" stroke="rgba(232,89,60,0.3)" strokeWidth="2" strokeDasharray="4 4"/></svg>
            </div>

            <div className="lp-step anim-slide-up d-2">
              <div className="lp-step-num">02</div>
              <div className="lp-step-icon-wrap">
                <IconUsers />
              </div>
              <h3 className="lp-step-title">Review</h3>
              <p className="lp-step-desc">Submit for review. Editors and admins approve with feedback.</p>
            </div>

            <div className="lp-step-connector" aria-hidden="true">
              <svg width="40" height="2" viewBox="0 0 40 2"><line x1="0" y1="1" x2="40" y2="1" stroke="rgba(232,89,60,0.3)" strokeWidth="2" strokeDasharray="4 4"/></svg>
            </div>

            <div className="lp-step anim-slide-up d-3">
              <div className="lp-step-num">03</div>
              <div className="lp-step-icon-wrap">
                <IconBolt />
              </div>
              <h3 className="lp-step-title">Publish</h3>
              <p className="lp-step-desc">One click to go live. Analytics start tracking immediately.</p>
            </div>
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
            <a href="#features">Features</a>
            <a href="#live-preview">Live Preview</a>
            <a href="/login">Get Started</a>
            <a href="https://github.com/richiekaroki/broadcast-hub" target="_blank" rel="noopener noreferrer">GitHub</a>
          </div>
        </div>
        <div className="lp-footer-bottom">
          <span>&copy; 2026 Wam Broadcast Hub</span>
        </div>
      </footer>
    </div>
  );
}
