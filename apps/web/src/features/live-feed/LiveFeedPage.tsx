import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '../../components/DashboardLayout';
import { fetchPrograms, Program } from '../../api/client';

// ── Top stat cards ────────────────────────────────────────────────────────────
interface StatCardProps {
  label:   string;
  value:   string;
  sub:     string;
  icon:    string;
  alert?:  boolean;
}

function StatCard({ label, value, sub, icon, alert }: StatCardProps) {
  return (
    <div style={{
      background:   'var(--color-bg-card)',
      border:       `1px solid ${alert ? 'rgba(239,68,68,0.4)' : 'var(--color-border)'}`,
      borderRadius: '10px',
      padding:      '16px 20px',
      flex:         1,
      minWidth:     0,
    }}>
      <div style={{ fontSize: '10px', color: alert ? 'var(--color-red)' : 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
        <span>{icon}</span> {label}
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 700, lineHeight: 1, marginBottom: '4px', color: alert ? 'var(--color-red)' : 'var(--color-text)' }}>
        {value}
      </div>
      <div style={{ fontSize: '11px', color: alert ? 'rgba(239,68,68,0.8)' : 'var(--color-muted)' }}>{sub}</div>
    </div>
  );
}

// ── Stream card states ────────────────────────────────────────────────────────
type StreamState = 'live' | 'live-violation';

interface StreamCardProps {
  program:  Program;
  state:    StreamState;
  viewers:  number;
  channel:  string;
  duration: string;
}

function StreamCard({ program, state, viewers, channel, duration }: StreamCardProps) {
  const isViolation = state === 'live-violation';

  return (
    <div style={{
      background:   'var(--color-bg-card)',
      border:       `1px solid ${isViolation ? 'rgba(239,68,68,0.4)' : 'var(--color-border)'}`,
      borderRadius: '12px',
      overflow:     'hidden',
      flex:         1,
      minWidth:     0,
    }}>
      {/* Thumbnail area */}
      <div style={{
        height:     '140px',
        background: isViolation
          ? 'linear-gradient(135deg, #1a0a0a, #2a0808)'
          : 'linear-gradient(135deg, #0a0a1a, #0a1a0a)',
        position:   'relative',
        display:    'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {/* Fake thumbnail bars */}
        {!isViolation && (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '60px' }}>
            {[40,65,50,80,55,70,45,90,60,75].map((h, i) => (
              <div key={i} style={{
                width: '6px', height: `${h}%`,
                background: `rgba(232,89,60,${0.3 + (h/100)*0.5})`,
                borderRadius: '2px',
                animation: `pulse-dot ${1 + i*0.1}s ease-in-out infinite`,
              }} />
            ))}
          </div>
        )}

        {/* Violation overlay */}
        {isViolation && (
          <div style={{
            position:       'absolute',
            inset:          0,
            background:     'rgba(239,68,68,0.08)',
            display:        'flex',
            flexDirection:  'column',
            alignItems:     'center',
            justifyContent: 'center',
            gap:            '8px',
          }}>
            <div style={{
              padding:      '8px 18px',
              background:   'rgba(239,68,68,0.15)',
              border:       '1px solid rgba(239,68,68,0.4)',
              borderRadius: '8px',
              fontSize:     '12px',
              fontWeight:   600,
              color:        '#EF4444',
              letterSpacing: '0.04em',
              textAlign:    'center',
            }}>
              ⚠ VIOLATION DETECTED
            </div>
          </div>
        )}

        {/* LIVE badge + viewers */}
        {!isViolation && (
          <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{
              padding: '2px 8px', background: 'var(--color-orange)',
              borderRadius: '4px', fontSize: '10px', fontWeight: 700,
              letterSpacing: '0.06em', color: '#fff',
            }}>LIVE</span>
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.85)', fontFamily: 'var(--font-mono)' }}>
              {viewers.toLocaleString()} Viewers
            </span>
          </div>
        )}

        {/* Three-dot menu */}
        <button type="button" style={{
          position: 'absolute', top: '8px', right: '8px',
          background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '6px',
          color: '#fff', cursor: 'pointer', padding: '4px 8px', fontSize: '14px',
        }}>⋮</button>
      </div>

      {/* Card body */}
      <div style={{ padding: '14px 16px' }}>
        <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {program.title}
        </div>
        {isViolation ? (
          <div style={{ fontSize: '11px', color: 'var(--color-red)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '12px' }}>
            Automatic Takedown Pending
          </div>
        ) : (
          <div style={{ fontSize: '11px', color: 'var(--color-muted)', marginBottom: '12px' }}>
            Channel: {channel} · {duration}
          </div>
        )}

        {/* Action buttons */}
        {isViolation ? (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" style={{
              ...actionBtn,
              borderColor: 'rgba(239,68,68,0.4)', color: '#EF4444', background: 'rgba(239,68,68,0.08)',
            }}>⊘ Terminate</button>
            <button type="button" style={{ ...actionBtn }}>👁 Review</button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '6px' }}>
            {['⚡ Mod', '💬 Chat', '📊 Data'].map(a => (
              <button type="button" key={a} style={{ ...actionBtn, fontSize: '11px', padding: '6px 10px' }}>{a}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main LiveFeedPage ─────────────────────────────────────────────────────────
export function LiveFeedPage() {
  const { data: programs, isLoading } = useQuery({
    queryKey:       ['programs'],
    queryFn:        () => fetchPrograms(1, 10),
    refetchInterval: 15_000,
  });

  const livePrograms = programs?.data ?? [];

  // Map real programs to stream cards; fill with demo data if < 3
  const streams: Array<{ program: Program; state: StreamState; viewers: number; channel: string; duration: string }> =
    livePrograms.slice(0, 3).map((p, i) => ({
      program:  p,
      state:    i === 2 ? 'live-violation' : 'live',
      viewers:  i === 0 ? 4800 : 1200,
      channel:  i === 0 ? '@NexusGaming' : '@FerrisCode',
      duration: i === 0 ? '02:44:12' : '01:12:05',
    }));

  // Pad with demo cards if backend returns < 3 programs
  while (streams.length < 3) {
    const idx = streams.length;
    streams.push({
      program:  {
        id: `demo-${idx}`, title: idx === 2 ? 'Restricted: Live Stream #9902' : `Demo Stream #${idx + 1}`,
        startTime: new Date().toISOString(), endTime: new Date().toISOString(),
        status: 'live', presenterId: null, createdAt: new Date().toISOString(),
      },
      state:    idx === 2 ? 'live-violation' : 'live',
      viewers:  idx === 0 ? 4800 : 1200,
      channel:  idx === 0 ? '@NexusGaming' : '@FerrisCode',
      duration: idx === 0 ? '02:44:12' : '01:12:05',
    });
  }

  return (
    <DashboardLayout
      activeItem="live"
      headerRight={
        <>
          <span style={{
            padding:      '3px 8px',
            background:   'rgba(232,89,60,0.15)',
            border:       '1px solid rgba(232,89,60,0.4)',
            borderRadius: '4px',
            fontSize:     '10px',
            fontWeight:   700,
            color:        'var(--color-orange)',
            letterSpacing: '0.08em',
            animation:    'pulse-dot 2s ease-in-out infinite',
          }}>LIVE</span>
          <button type="button" style={{
            background: 'none', border: 'none', color: 'var(--color-muted)',
            cursor: 'pointer', fontSize: '18px',
          }}>🔔</button>
        </>
      }
    >
      {/* Stat cards row */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '28px' }}>
        <StatCard icon="👁" label="Total Concurrent" value="14.2K" sub="+12% from last hour" />
        <StatCard icon="⚠" label="Alert Flags"      value="03"    sub="Critical intervention required" alert />
        <StatCard icon="⚡" label="Node Latency"     value="24ms"  sub="Optimal performance" />
        <StatCard icon="≡" label="Bandwidth"        value="1.2Tb/s" sub="Peak utilization at 64%" />
      </div>

      {/* Live Feed section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 600, letterSpacing: '0.02em' }}>
          Live Feed
        </span>
        <button type="button" style={{
          padding:      '7px 14px',
          background:   'transparent',
          border:       '1px solid var(--color-border)',
          borderRadius: '7px',
          color:        'var(--color-muted)',
          fontSize:     '12px',
          cursor:       'pointer',
          fontFamily:   'var(--font-body)',
          display:      'flex',
          alignItems:   'center',
          gap:          '6px',
        }}>
          ≡ Filters
        </button>
      </div>

      {/* Stream cards */}
      {isLoading ? (
        <div style={{ display: 'flex', gap: '14px' }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{ flex: 1, background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: '12px', overflow: 'hidden' }}>
              <div className="skeleton" style={{ height: '140px' }} />
              <div style={{ padding: '14px 16px' }}>
                <div className="skeleton" style={{ height: 14, width: '70%', marginBottom: 8 }} />
                <div className="skeleton" style={{ height: 11, width: '50%', marginBottom: 14 }} />
                <div style={{ display: 'flex', gap: 6 }}>
                  {[1,2,3].map(j => <div key={j} className="skeleton" style={{ height: 28, width: 60, borderRadius: 6 }} />)}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '14px' }}>
          {streams.map((s, i) => (
            <StreamCard key={i} {...s} />
          ))}
        </div>
      )}

      {/* Empty state when no live programs */}
      {!isLoading && livePrograms.length === 0 && (
        <div style={{
          marginTop:    '12px',
          padding:      '12px 16px',
          background:   'rgba(232,89,60,0.06)',
          border:       '1px solid rgba(232,89,60,0.2)',
          borderRadius: '8px',
          fontSize:     '12px',
          color:        'var(--color-muted)',
        }}>
          💡 No live programs found in the backend — showing demo cards above. Run the seed script or create a program via <code style={{ fontFamily: 'var(--font-mono)' }}>POST /api/v1/programs</code>
        </div>
      )}
    </DashboardLayout>
  );
}

const actionBtn: React.CSSProperties = {
  padding:      '7px 12px',
  background:   'transparent',
  border:       '1px solid var(--color-border)',
  borderRadius: '6px',
  color:        'var(--color-text)',
  fontSize:     '12px',
  cursor:       'pointer',
  fontFamily:   'var(--font-body)',
  whiteSpace:   'nowrap',
};
