import { useNavigate } from 'react-router-dom';

// ── Ticker data ───────────────────────────────────────────────────────────────
const TICKER_ITEMS = [
  '▸ LIVE: Evening News at 19:00 EAT',
  '▸ PUBLISHED: NSE Markets Close Higher',
  '▸ PENDING: AFC Champions League Preview',
  '▸ VIEWS TODAY: 849.2K',
  '▸ UPTIME: 99.999%',
  '▸ REDIS CACHE HIT RATIO: 94.2%',
  '▸ CONTENT ITEMS: 42,910',
];

// ── Feature data ──────────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: '⚡',
    label: 'Real-Time Analytics',
    desc:  'Monitor every interaction as it happens. Our Redis-backed infrastructure ensures zero-lag insights under extreme volume.',
    link:  'Learn More →',
  },
  {
    icon: '📋',
    label: 'Lifecycle Mgmt',
    desc:  'From raw capture to global distribution, orchestrate every stage with automated, immutable blockchain-verified logs.',
    link:  'Deep Dive →',
  },
  {
    icon: '🛡',
    label: 'Enterprise Security',
    desc:  'Military-grade encryption for all content streams. Granular access controls and comprehensive auditability for compliance.',
    link:  'Security Portal →',
  },
];

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div style={{ background: 'var(--color-bg-page)', minHeight: '100vh', overflow: 'hidden' }}>

      {/* ── Ticker strip ──────────────────────────────────────────────────── */}
      <div style={{
        background:    'var(--color-orange)',
        height:        '32px',
        display:       'flex',
        alignItems:    'center',
        overflow:      'hidden',
        position:      'relative',
      }}>
        <div className="animate-ticker" style={{ display: 'flex', gap: '80px', whiteSpace: 'nowrap', paddingRight: '80px' }}>
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <span key={i} style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 500, color: '#fff', letterSpacing: '0.05em' }}>
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* ── Navbar ────────────────────────────────────────────────────────── */}
      <nav style={{
        display:        'flex',
        alignItems:     'center',
        padding:        '0 60px',
        height:         '64px',
        background:     'rgba(10,10,10,0.95)',
        borderBottom:   '1px solid var(--color-border)',
        position:       'sticky',
        top:            0,
        zIndex:         100,
        backdropFilter: 'blur(12px)',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginRight: 'auto' }}>
          <div style={{
            width: '30px', height: '30px', background: 'var(--color-orange)',
            borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px',
          }}>📡</div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '17px', fontWeight: 700, letterSpacing: '0.05em' }}>
            BroadcastHub
          </span>
        </div>

        {/* Nav links */}
        <div style={{ display: 'flex', gap: '32px', marginRight: '40px' }}>
          {['Features', 'Pricing', 'Analytics', 'Support'].map(l => (
            <a key={l} href="#" style={{ fontSize: '13px', color: 'var(--color-muted)', textDecoration: 'none', letterSpacing: '0.02em', transition: 'color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-text)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-muted)')}
            >{l}</a>
          ))}
        </div>

        {/* CTAs */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button type="button" onClick={() => navigate('/login')} style={{
            background: 'transparent', border: 'none', color: 'var(--color-text)',
            fontSize: '13px', cursor: 'pointer', fontFamily: 'var(--font-body)', padding: '8px 16px',
          }}>Login</button>
          <button type="button" onClick={() => navigate('/login')} style={{
            background: 'var(--color-orange)', border: 'none', borderRadius: '6px',
            color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
            fontFamily: 'var(--font-body)', padding: '9px 20px',
          }}>Get Started</button>
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section style={{
        position:   'relative',
        padding:    '100px 60px 80px',
        textAlign:  'center',
        overflow:   'hidden',
      }}>
        {/* BG grid */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `
            linear-gradient(rgba(232,89,60,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(232,89,60,0.05) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          pointerEvents: 'none',
        }} />
        {/* Radial glow */}
        <div style={{
          position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)',
          width: '600px', height: '300px',
          background: 'radial-gradient(ellipse, rgba(232,89,60,0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Badge */}
          <div className="animate-fade-up opacity-0" style={{
            display:      'inline-flex',
            alignItems:   'center',
            gap:          '8px',
            padding:      '5px 14px',
            background:   'rgba(232,89,60,0.1)',
            border:       '1px solid rgba(232,89,60,0.3)',
            borderRadius: '20px',
            fontSize:     '11px',
            fontFamily:   'var(--font-mono)',
            color:        'var(--color-orange)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: '28px',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-orange)', display: 'inline-block' }} className="animate-pulse-dot" />
            Enterprise Ready · v4.2 Pro
          </div>

          {/* Headline */}
          <h1 className="animate-fade-up opacity-0 delay-100" style={{
            fontFamily:   'var(--font-display)',
            fontSize:     'clamp(52px, 9vw, 96px)',
            fontWeight:   900,
            lineHeight:   0.95,
            letterSpacing: '-0.01em',
            margin:       '0 0 24px',
            textTransform: 'uppercase',
          }}>
            MASTER YOUR<br />
            <span className="text-gradient">CONTENT LIFECYCLE</span>
          </h1>

          {/* Subheading */}
          <p className="animate-fade-up opacity-0 delay-200" style={{
            fontSize:    '16px',
            color:       'var(--color-muted)',
            maxWidth:    '520px',
            margin:      '0 auto 40px',
            lineHeight:  1.7,
          }}>
            High-velocity data dashboards and real-time content orchestration for world-class media teams. Streamline every byte from draft to global publication.
          </p>

          {/* CTAs */}
          <div className="animate-fade-up opacity-0 delay-300" style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '80px' }}>
            <button type="button" onClick={() => navigate('/login')} style={{
              padding:      '14px 32px',
              background:   'var(--color-orange)',
              border:       'none',
              borderRadius: '8px',
              color:        '#fff',
              fontSize:     '14px',
              fontWeight:   700,
              cursor:       'pointer',
              fontFamily:   'var(--font-display)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              transition:   'background 0.15s, transform 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-orange-hover)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-orange)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              Get Started Now
            </button>
            <button type="button" onClick={() => document.getElementById('preview')?.scrollIntoView({ behavior: 'smooth' })} style={{
              padding:      '14px 32px',
              background:   'transparent',
              border:       '1px solid var(--color-border)',
              borderRadius: '8px',
              color:        'var(--color-text)',
              fontSize:     '14px',
              fontFamily:   'var(--font-display)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              cursor:       'pointer',
              transition:   'border-color 0.15s',
            }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--color-border)')}
            >
              Watch Demo
            </button>
          </div>

          {/* Live performance preview card */}
          <div id="preview" className="animate-fade-up opacity-0 delay-400" style={{
            maxWidth:     '680px',
            margin:       '0 auto',
            background:   'var(--color-bg-card)',
            border:       '1px solid var(--color-border)',
            borderRadius: '16px',
            overflow:     'hidden',
            textAlign:    'left',
            boxShadow:    '0 40px 80px rgba(0,0,0,0.5)',
          }}>
            {/* Card top bar */}
            <div style={{
              display:       'flex',
              justifyContent: 'space-between',
              alignItems:    'center',
              padding:       '14px 20px',
              borderBottom:  '1px solid var(--color-border)',
              background:    'rgba(255,255,255,0.02)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-orange)' }} className="animate-pulse-dot" />
                <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--color-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  Live Performance
                </span>
              </div>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--color-muted)' }}>
                ● NODE: US-EAST-1
              </span>
            </div>

            {/* Stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0 }}>
              {[
                { label: 'Total Reach',  value: '2.4M',  sub: '↑ +12.4%',   color: 'var(--color-green)' },
                { label: 'Engagement',   value: '84.2%', sub: '▲ STABLE',    color: 'var(--color-green)' },
                { label: 'Latency',      value: '124ms', sub: '● OPTIMIZED', color: 'var(--color-orange)' },
              ].map(({ label, value, sub, color }, i) => (
                <div key={i} style={{
                  padding:     '20px 24px',
                  borderRight: i < 2 ? '1px solid var(--color-border)' : 'none',
                  textAlign:   'center',
                }}>
                  <div style={{ fontSize: '11px', color: 'var(--color-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '8px' }}>
                    {label}
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 700, marginBottom: '4px' }}>
                    {value}
                  </div>
                  <div style={{ fontSize: '11px', color, fontFamily: 'var(--font-mono)' }}>
                    {sub}
                  </div>
                </div>
              ))}
            </div>

            {/* System log table */}
            <div style={{ borderTop: '1px solid var(--color-border)' }}>
              <div style={{ padding: '10px 20px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--color-border)' }}>
                <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--color-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  System Log v4.2
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 80px', fontSize: '11px', fontFamily: 'var(--font-mono)', padding: '8px 20px', color: 'var(--color-muted)', borderBottom: '1px solid var(--color-border)', background: 'rgba(255,255,255,0.01)' }}>
                <span>ASSET ID</span><span>DEPLOYMENT</span><span style={{ textAlign: 'right' }}>STATUS</span>
              </div>
              {[
                { id: '#8421-X', name: 'GLOBAL_NEWS_REEL_HD',       status: 'ACTIVE',  color: 'var(--color-green)' },
                { id: '#8419-B', name: 'MARKET_UPDATE_Q5_SUMMARY',  status: 'QUEUED',  color: 'var(--color-muted)' },
              ].map(row => (
                <div key={row.id} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 80px', fontSize: '12px', fontFamily: 'var(--font-mono)', padding: '12px 20px', borderBottom: '1px solid var(--color-border)', alignItems: 'center' }}>
                  <span style={{ color: 'var(--color-orange)' }}>{row.id}</span>
                  <span style={{ color: 'var(--color-text)' }}>{row.name}</span>
                  <span style={{ textAlign: 'right' }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: '4px',
                      background: row.status === 'ACTIVE' ? 'rgba(34,197,94,0.15)' : 'rgba(107,104,96,0.15)',
                      color: row.color, fontSize: '10px', letterSpacing: '0.06em',
                    }}>{row.status}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────────────── */}
      <section style={{ padding: '100px 60px', borderTop: '1px solid var(--color-border)' }}>
        <div style={{ textAlign: 'center', marginBottom: '64px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(36px, 5vw, 60px)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.02em', margin: '0 0 16px' }}>
            PRECISION <span className="text-gradient">ENGINEERING</span>
          </h2>
          <p style={{ color: 'var(--color-muted)', fontSize: '15px', maxWidth: '480px', margin: '0 auto' }}>
            Built for mission-critical media delivery where every millisecond matters.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', maxWidth: '960px', margin: '0 auto' }}>
          {FEATURES.map(f => (
            <div key={f.label} className="card-hover" style={{
              background:   'var(--color-bg-card)',
              border:       '1px solid var(--color-border)',
              borderRadius: '12px',
              padding:      '32px',
            }}>
              <div style={{
                width: '44px', height: '44px', background: 'var(--color-orange)',
                borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '20px', marginBottom: '20px',
              }}>{f.icon}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '12px' }}>
                {f.label}
              </div>
              <p style={{ fontSize: '13px', color: 'var(--color-muted)', lineHeight: 1.7, marginBottom: '20px' }}>
                {f.desc}
              </p>
              <a href="#" style={{ fontSize: '12px', color: 'var(--color-orange)', textDecoration: 'none', fontWeight: 600, letterSpacing: '0.04em' }}>
                {f.link}
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* ── Scale section ─────────────────────────────────────────────────── */}
      <section style={{
        padding:    '100px 60px',
        background: 'var(--color-bg-card)',
        borderTop:  '1px solid var(--color-border)',
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center', maxWidth: '1000px', margin: '0 auto' }}>
          {/* Laptop mockup */}
          <div style={{
            background:   'var(--color-bg-elevated)',
            border:       '1px solid var(--color-border)',
            borderRadius: '16px',
            padding:      '24px',
            aspectRatio:  '4/3',
            display:      'flex',
            flexDirection: 'column',
            gap:          '12px',
            boxShadow:    '0 20px 60px rgba(0,0,0,0.4)',
          }}>
            {/* Mock dashboard bars */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
              {['#ff5f57','#ffbe2e','#28c840'].map(c => <div key={c} style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />)}
            </div>
            {[80,55,70,40,90,60].map((h, i) => (
              <div key={i} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <div style={{ width: '60px', height: '6px', background: 'var(--color-border)', borderRadius: '3px', flexShrink: 0 }} />
                <div style={{ flex: 1, height: '6px', background: 'var(--color-border)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${h}%`, height: '100%', background: i % 3 === 0 ? 'var(--color-orange)' : 'var(--color-bg-elevated)', borderRadius: '3px' }} />
                </div>
              </div>
            ))}
            <svg width="100%" height="50" viewBox="0 0 300 50" style={{ marginTop: '8px' }}>
              <path d="M0,40 C50,35 100,10 150,20 C200,30 250,5 300,15" fill="none" stroke="var(--color-orange)" strokeWidth="1.5" opacity="0.7"/>
              <path d="M0,40 C50,35 100,10 150,20 C200,30 250,5 300,15 L300,50 L0,50Z" fill="rgba(232,89,60,0.1)"/>
            </svg>
          </div>

          {/* Text */}
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 900, textTransform: 'uppercase', lineHeight: 1, marginBottom: '24px' }}>
              SCALE WITHOUT<br/><span className="text-gradient">FRICTION</span>
            </h2>
            <p style={{ color: 'var(--color-muted)', fontSize: '14px', lineHeight: 1.8, marginBottom: '32px' }}>
              Engineered to handle viral traffic spikes without degradation. Our global mesh network automatically balances distribution across 300+ edge nodes.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                { stat: '99.999%', label: 'Guaranteed Uptime', sub: 'SLA backed with direct financial redundancy.' },
                { stat: 'GLOBAL',  label: 'CDN Mesh',          sub: 'Sub-60ms delivery to 95% of the global population.' },
                { stat: '24/7',    label: 'Elite Ops Team',     sub: 'Direct access to systems engineers around the clock.' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                  <div style={{ color: 'var(--color-orange)', fontSize: '12px', marginTop: '2px', flexShrink: 0 }}>✓</div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>{item.stat} {item.label}</div>
                    <div style={{ fontSize: '12px', color: 'var(--color-muted)', marginTop: '2px' }}>{item.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA footer ────────────────────────────────────────────────────── */}
      <section style={{
        background:  'var(--color-orange)',
        padding:     '80px 60px',
        textAlign:   'center',
        position:    'relative',
        overflow:    'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
          pointerEvents: 'none',
        }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(36px, 5vw, 64px)', fontWeight: 900, textTransform: 'uppercase', color: '#fff', lineHeight: 1, marginBottom: '16px' }}>
            START BROADCASTING SMARTER
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '40px', fontSize: '15px' }}>
            Join 600+ media titans dominating their markets.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button type="button" onClick={() => navigate('/login')} style={{
              padding: '16px 36px', background: '#fff', border: 'none', borderRadius: '8px',
              color: 'var(--color-orange)', fontSize: '14px', fontWeight: 700,
              fontFamily: 'var(--font-display)', letterSpacing: '0.06em', textTransform: 'uppercase',
              cursor: 'pointer',
            }}>Deploy Your Instance</button>
            <button type="button" style={{
              padding: '16px 36px', background: 'transparent',
              border: '2px solid rgba(255,255,255,0.5)', borderRadius: '8px',
              color: '#fff', fontSize: '14px', fontWeight: 700,
              fontFamily: 'var(--font-display)', letterSpacing: '0.06em', textTransform: 'uppercase',
              cursor: 'pointer',
            }}>Request Demo</button>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer style={{
        background:  'var(--color-bg-card)',
        borderTop:   '1px solid var(--color-border)',
        padding:     '48px 60px 32px',
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '40px', marginBottom: '40px' }}>
          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{ width: 28, height: 28, background: 'var(--color-orange)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px' }}>📡</div>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 700, letterSpacing: '0.04em' }}>BroadcastHub</span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--color-muted)', lineHeight: 1.7, maxWidth: '220px' }}>
              The infrastructure of choice for high-velocity media distribution and lifecycle management.
            </p>
          </div>
          {/* Columns */}
          {[
            { label: 'Product',  links: ['Performance', 'Security Stack', 'Developer API'] },
            { label: 'Company',  links: ['About Us', 'Network Status', 'Resources'] },
            { label: 'Connect',  links: ['Twitter', 'GitHub', 'Discord'] },
          ].map(col => (
            <div key={col.label}>
              <div style={{ fontSize: '11px', color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px', fontWeight: 600 }}>
                {col.label}
              </div>
              {col.links.map(l => (
                <div key={l} style={{ marginBottom: '8px' }}>
                  <a href="#" style={{ fontSize: '13px', color: 'var(--color-muted)', textDecoration: 'none', transition: 'color 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-text)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-muted)')}
                  >{l}</a>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '24px', display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--color-muted)' }}>
          <span>© 2026 BroadcastHub Technologies. All rights reserved. Built for high-velocity streaming.</span>
          <div style={{ display: 'flex', gap: '20px' }}>
            {['Terms of Service', 'Privacy Policy', 'Status', 'Contact Us'].map(l => (
              <a key={l} href="#" style={{ color: 'var(--color-muted)', textDecoration: 'none' }}>{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
