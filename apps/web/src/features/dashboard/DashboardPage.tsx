import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { DashboardLayout } from '../../components/DashboardLayout';
import { ContentTable } from '../../components/ContentTable';
import { CacheIndicator } from '../../components/CacheIndicator';
import { fetchDashboardStats, fetchContent } from '../../api/client';
import { useAppSelector } from '../../store/hooks';
import { MetricCard } from '../../components/MetricCard';

// ── Inline SVG icons ──────────────────────────────────────────────────────────
const IconUsers   = () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>;
const IconDoc     = () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>;
const IconCheck   = () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>;
const IconEye     = () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
const IconBell    = () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>;
const IconHistory = () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><polyline points="12 8 12 12 14 14"/><path d="M3.05 11a9 9 0 100 2"/><polyline points="3 3 3 11 11 11"/></svg>;

// ── Donut ring for System Health ──────────────────────────────────────────────
function DonutRing({ pct, label, value, color }: { pct: number; label: string; value: string; color: string }) {
  const r = 28, cx = 36, cy = 36;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
      <svg width="72" height="72" viewBox="0 0 72 72">
        {/* Track */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--color-bg-elevated)" strokeWidth="5"/>
        {/* Fill */}
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
        {/* Centre label */}
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize="11" fontWeight="600" fill={color} fontFamily="var(--font-mono)">
          {value}
        </text>
        <text x={cx} y={cy + 9} textAnchor="middle" fontSize="8" fill="var(--color-muted)" fontFamily="var(--font-body)">
          {pct}%
        </text>
      </svg>
      <span style={{ fontSize: '10px', color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500 }}>
        {label}
      </span>
    </div>
  );
}

// ── Glowing traffic chart (matches Figma Image 2) ─────────────────────────────
function TrafficChart() {
  // Static demo path — in production connect to a real-time WebSocket
  const path = "M0,80 C30,70 60,30 100,45 C140,60 170,20 220,30 C270,40 300,15 340,10 C370,6 400,40 450,50 C480,56 510,10 560,8";
  const fillPath = `${path} L560,100 L0,100 Z`;

  return (
    <div style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '20px 22px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 600, letterSpacing: '0.02em' }}>
          Real-time Traffic
        </span>
        <button type="button" style={{
          padding: '5px 12px', background: 'transparent',
          border: '1px solid var(--color-border)', borderRadius: '6px',
          color: 'var(--color-muted)', fontSize: '11px', cursor: 'pointer', fontFamily: 'var(--font-body)',
          display: 'flex', alignItems: 'center', gap: '4px',
        }}>
          60 MIN ▾
        </button>
      </div>

      <svg width="100%" height="110" viewBox="0 0 560 110" preserveAspectRatio="none">
        <defs>
          <linearGradient id="traffic-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#E8593C" stopOpacity="0.4"/>
            <stop offset="60%"  stopColor="#E8593C" stopOpacity="0.1"/>
            <stop offset="100%" stopColor="#E8593C" stopOpacity="0"/>
          </linearGradient>
          {/* Glow filter simulation with two strokes */}
        </defs>
        {/* Fill area */}
        <path d={fillPath} fill="url(#traffic-fill)"/>
        {/* Glow stroke (thick, low opacity) */}
        <path d={path} fill="none" stroke="#E8593C" strokeWidth="6" strokeOpacity="0.2" strokeLinecap="round" strokeLinejoin="round"/>
        {/* Main stroke */}
        <path d={path} fill="none" stroke="#E8593C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>

      {/* Time labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
        {['14:00','14:15','14:30','14:45','15:00'].map(t => (
          <span key={t} style={{ fontSize: '10px', color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>{t}</span>
        ))}
      </div>
    </div>
  );
}

// ── Main DashboardPage ────────────────────────────────────────────────────────
export function DashboardPage() {
  const { userName, userRole } = useAppSelector(s => s.auth);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: stats, isLoading: statsLoading, isError: statsError } = useQuery({
    queryKey:       ['dashboard-stats'],
    queryFn:        fetchDashboardStats,
    refetchInterval: 30_000,
  });

  const { data: content = [], isLoading: contentLoading, isError: contentError } = useQuery({
    queryKey: ['content'],
    queryFn:  fetchContent,
  });

  const filteredContent = useMemo(() => {
    if (!searchQuery.trim()) return content;
    const q = searchQuery.toLowerCase();
    return content.filter(c => c.title.toLowerCase().includes(q) || c.body.toLowerCase().includes(q));
  }, [content, searchQuery]);

  return (
    <DashboardLayout
      activeItem="dashboard"
      headerRight={
        <>
          <div style={{ flex: 1, maxWidth: '460px', position: 'relative' }}>
            <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)' }} aria-hidden="true">
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </span>
            <input
              placeholder="Search..."
              aria-label="Search content"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%', padding: '7px 10px 7px 32px',
                background: 'var(--color-bg-elevated)',
                border: '1px solid var(--color-border)', borderRadius: '7px',
                color: 'var(--color-text)', fontSize: '13px',
                fontFamily: 'var(--font-body)', outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>

          <CacheIndicator cached={stats?.cached ?? null} />

          <button type="button" style={iconBtn} aria-label="Notifications"><IconBell /></button>
          <button type="button" style={iconBtn} aria-label="View history"><IconHistory /></button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginLeft: '4px' }}>
            <div style={{
              width: '30px', height: '30px', borderRadius: '7px',
              background: 'linear-gradient(135deg, var(--color-orange), #c0392b)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '12px', fontWeight: 700,
            }}>{userName.charAt(0)}</div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 500, lineHeight: 1.2 }}>{userName}</div>
              <div style={{ fontSize: '10px', color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{userRole}</div>
            </div>
          </div>
        </>
      }
    >
      {/* Metric cards row */}
      {(statsError || contentError) && (
        <div style={{ background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', padding: '14px 18px', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg width="16" height="16" fill="none" stroke="var(--red)" strokeWidth="1.5" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span style={{ fontSize: '13px', color: 'var(--red)' }}>Failed to load data. Check your connection and try again.</span>
          <button type="button" onClick={() => window.location.reload()} style={{ marginLeft: 'auto', padding: '5px 12px', background: 'var(--red)', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>Retry</button>
        </div>
      )}
      <div className="metrics-row" style={{ display: 'flex', gap: '14px', marginBottom: '22px' }}>
        <MetricCard label="Total Users"  value={stats?.totalUsers ?? null}       icon={<IconUsers />}  change="12%"  trend="up"      loading={statsLoading} />
        <MetricCard label="Content"      value={stats?.totalContent ?? null}     icon={<IconDoc />}    change="8.4%" trend="up"      loading={statsLoading} />
        <MetricCard label="Published"    value={stats?.publishedContent ?? null} icon={<IconCheck />}  change="0%"   trend="neutral" loading={statsLoading} />
        <MetricCard label="Views"        value={stats?.todayViews ?? null}       icon={<IconEye />}    change="2.1%" trend="down"    loading={statsLoading} />
      </div>

      {/* Content table */}
      <div style={{ marginBottom: '22px' }}>
        <ContentTable items={filteredContent} loading={contentLoading} />
      </div>

      {/* Bottom row */}
      <div className="bottom-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>

        {/* Traffic chart — glowing curve */}
        <TrafficChart />

        {/* System Health — donut rings matching Figma */}
        <div style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '20px 22px' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 600, letterSpacing: '0.02em', marginBottom: '24px' }}>
            System Health
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', justifyItems: 'center' }}>
            <DonutRing pct={24}   value="24%"   label="Load"    color="#22C55E" />
            <DonutRing pct={60}   value="142ms" label="Latency" color="#F59E0B" />
            <DonutRing pct={75}   value="6.2G"  label="Redis"   color="#F59E0B" />
            <DonutRing pct={99.9} value="99.9%" label="Uptime"  color="#22C55E" />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

const iconBtn: React.CSSProperties = {
  background: 'none', border: '1px solid var(--color-border)',
  borderRadius: '7px', color: 'var(--color-muted)', cursor: 'pointer',
  padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center',
};
