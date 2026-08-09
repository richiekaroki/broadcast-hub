import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '../../components/DashboardLayout';
import { fetchDashboardStats, fetchContent } from '../../api/client';

function StatBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div style={{ marginBottom: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{label}</span>
        <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color }}>{value.toLocaleString()}</span>
      </div>
      <div style={{ height: '5px', background: 'var(--bg-elevated)', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '3px', transition: 'width 0.8s cubic-bezier(0.22,1,0.36,1)' }} />
      </div>
    </div>
  );
}

function BigStat({ label, value, sub, color }: { label: string; value: string; sub: string; color?: string }) {
  return (
    <div className="card" style={{ padding: '20px', flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 500, marginBottom: '8px' }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 700, color: color || 'var(--text-primary)', marginBottom: '4px' }}>{value}</div>
      <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{sub}</div>
    </div>
  );
}

export function StatsPage() {
  const { data: stats, isLoading: sl } = useQuery({ queryKey: ['dashboard-stats'], queryFn: fetchDashboardStats });
  const { data: content = [] }         = useQuery({ queryKey: ['content'],          queryFn: fetchContent       });

  const byStatus = {
    published:      content.filter(c => c.status === 'published').length,
    pending_review: content.filter(c => c.status === 'pending_review').length,
    draft:          content.filter(c => c.status === 'draft').length,
    rejected:       content.filter(c => c.status === 'rejected').length,
  };

  const publishRate = stats?.totalContent
    ? Math.round((byStatus.published / stats.totalContent) * 100)
    : 0;

  return (
    <DashboardLayout activeItem="stats">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Top stat row */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <BigStat label="Total Users"     value={sl ? '…' : (stats?.totalUsers       ?? 0).toLocaleString()} sub="Registered accounts"   />
            <BigStat label="Total Content"   value={sl ? '…' : (stats?.totalContent     ?? 0).toLocaleString()} sub="All articles"          />
            <BigStat label="Published"       value={sl ? '…' : (stats?.publishedContent ?? 0).toLocaleString()} sub="Live on platform" color="var(--green)" />
            <BigStat label="Views Today"     value={sl ? '…' : (stats?.todayViews       ?? 0).toLocaleString()} sub="Unique views"    color="var(--orange)" />
          </div>

          {/* Content pipeline */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
            <div className="card" style={{ padding: '20px' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: 600, marginBottom: '20px' }}>
                Content Pipeline
              </div>
              <StatBar label="Published"      value={byStatus.published}      max={stats?.totalContent ?? 1} color="var(--green)"  />
              <StatBar label="Pending Review" value={byStatus.pending_review} max={stats?.totalContent ?? 1} color="var(--amber)"  />
              <StatBar label="Draft"          value={byStatus.draft}          max={stats?.totalContent ?? 1} color="var(--text-tertiary)" />
              <StatBar label="Rejected"       value={byStatus.rejected}       max={stats?.totalContent ?? 1} color="var(--red)"    />
            </div>

            {/* Publish rate donut */}
            <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: 600, marginBottom: '20px', alignSelf: 'flex-start' }}>
                Publish Rate
              </div>
              <svg width="120" height="120" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" fill="none" stroke="var(--bg-elevated)" strokeWidth="8"/>
                <circle cx="60" cy="60" r="50" fill="none" stroke="var(--green)" strokeWidth="8"
                  strokeDasharray={`${(publishRate / 100) * 314} 314`}
                  strokeLinecap="round"
                  transform="rotate(-90 60 60)"
                  style={{ transition: 'stroke-dasharray 1s cubic-bezier(0.22,1,0.36,1)' }}
                />
                <text x="60" y="55" textAnchor="middle" fontSize="20" fontWeight="700" fill="var(--green)" fontFamily="var(--font-display)">
                  {publishRate}%
                </text>
                <text x="60" y="72" textAnchor="middle" fontSize="10" fill="var(--text-tertiary)" fontFamily="var(--font-body)">
                  published
                </text>
              </svg>
            </div>

            {/* Cache status */}
            <div className="card" style={{ padding: '20px' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: 600, marginBottom: '16px' }}>
                Cache Status
              </div>
              {[
                { label: 'Dashboard cache', key: 'dashboard:stats', ttl: '5 min' },
                { label: 'Content list',    key: 'content:list',    ttl: '5 min' },
                { label: 'Program schedule',key: 'programs:schedule', ttl: '2 min' },
              ].map(c => (
                <div key={c.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 500 }}>{c.label}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>{c.key}</div>
                  </div>
                  <span style={{ fontSize: '10px', color: 'var(--green)', background: 'var(--green-dim)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '12px', padding: '2px 8px' }}>
                    TTL {c.ttl}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent views area chart */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: 600, marginBottom: '16px' }}>
              Views — Last 7 Days
            </div>
            <svg width="100%" height="80" viewBox="0 0 560 80" preserveAspectRatio="none">
              <defs>
                <linearGradient id="views-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#E8593C" stopOpacity="0.3"/>
                  <stop offset="100%" stopColor="#E8593C" stopOpacity="0"/>
                </linearGradient>
              </defs>
              <path d="M0,65 C60,55 100,30 160,40 C220,50 260,20 320,25 C380,30 420,10 480,8 L560,12 L560,80 L0,80 Z" fill="url(#views-fill)"/>
              <path d="M0,65 C60,55 100,30 160,40 C220,50 260,20 320,25 C380,30 420,10 480,8 L560,12" fill="none" stroke="var(--orange)" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
              {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
                <span key={d} style={{ fontSize: '9px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>{d}</span>
              ))}
            </div>
          </div>
        </div>
    </DashboardLayout>
  );
}
