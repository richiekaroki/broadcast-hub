import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '../../components/DashboardLayout';
import { fetchPrograms, Program } from '../../api/client';
import { ReactNode } from 'react';

// ── Animated counter hook ─────────────────────────────────────────────────────
function useAnimatedValue(target: number, duration = 800) {
  const [display, setDisplay] = useState(target);
  const raf = useRef<number>(0);
  const start = useRef(display);
  const startTime = useRef(0);

  useEffect(() => {
    start.current = display;
    startTime.current = performance.now();
    const tick = (now: number) => {
      const elapsed = now - startTime.current;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start.current + (target - start.current) * ease));
      if (progress < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);

  return display;
}

// ── Fluctuating number hook ───────────────────────────────────────────────────
function useFluctuate(base: number, range: number, intervalMs = 3000) {
  const [value, setValue] = useState(base);
  useEffect(() => {
    const id = setInterval(() => {
      const delta = Math.floor(Math.random() * range * 2) - range;
      setValue(base + delta);
    }, intervalMs);
    return () => clearInterval(id);
  }, [base, range, intervalMs]);
  return value;
}

// ── Top stat cards ────────────────────────────────────────────────────────────
interface StatCardProps {
  label:   string;
  value:   string;
  sub:     string;
  icon:    ReactNode;
  alert?:  boolean;
  pulse?:  boolean;
}

function StatCard({ label, value, sub, icon, alert, pulse }: StatCardProps) {
  return (
    <div style={{
      background:   'var(--color-bg-card)',
      border:       `1px solid ${alert ? 'rgba(239,68,68,0.4)' : 'var(--color-border)'}`,
      borderRadius: '10px',
      padding:      '16px 20px',
      flex:         1,
      minWidth:     0,
      position:     'relative',
      overflow:     'hidden',
      boxShadow:    pulse ? '0 0 20px rgba(239,68,68,0.15)' : 'none',
      animation:    pulse ? 'alert-pulse 2s ease-in-out infinite' : undefined,
    }}>
      {pulse && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
          background: 'linear-gradient(90deg, transparent, var(--color-red), transparent)',
          animation: 'scanline 2s linear infinite',
        }} />
      )}
      <div style={{ fontSize: '10px', color: alert ? 'var(--color-red)' : 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
        <span aria-hidden="true">{icon}</span> {label}
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 700, lineHeight: 1, marginBottom: '4px', color: alert ? 'var(--color-red)' : 'var(--color-text)' }}>
        {value}
      </div>
      <div style={{ fontSize: '11px', color: alert ? 'rgba(239,68,68,0.8)' : 'var(--color-muted)' }}>{sub}</div>
    </div>
  );
}

// ── Audio waveform animation ──────────────────────────────────────────────────
function Waveform({ color = 'var(--color-orange)' }: { color?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '24px' }}>
      {[0.4, 0.7, 0.5, 0.9, 0.6, 0.8, 0.45, 0.85, 0.55, 0.75, 0.4, 0.65].map((h, i) => (
        <div key={i} style={{
          width: '3px',
          height: `${h * 100}%`,
          background: color,
          borderRadius: '1px',
          animation: `wave ${0.6 + i * 0.08}s ease-in-out infinite alternate`,
          animationDelay: `${i * 0.05}s`,
          opacity: 0.8,
        }} />
      ))}
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
  index:    number;
}

function StreamCard({ program, state, viewers, channel, duration, index }: StreamCardProps) {
  const isViolation = state === 'live-violation';
  const fluctuatingViewers = useFluctuate(viewers, Math.floor(viewers * 0.05), 2000 + index * 500);

  return (
    <div style={{
      background:   'var(--color-bg-card)',
      border:       `1px solid ${isViolation ? 'rgba(239,68,68,0.4)' : 'var(--color-border)'}`,
      borderRadius: '12px',
      overflow:     'hidden',
      flex:         1,
      minWidth:     0,
      position:     'relative',
      boxShadow:    isViolation ? '0 0 30px rgba(239,68,68,0.1)' : undefined,
      transition:   'box-shadow 0.3s, border-color 0.3s',
    }}>
      {/* Thumbnail area */}
      <div style={{
        height:     '160px',
        background: isViolation
          ? 'linear-gradient(135deg, #1a0a0a, #2a0808)'
          : 'linear-gradient(135deg, #0a0a1a, #0a1a0a, #0a0a1a)',
        position:   'relative',
        display:    'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}>
        {/* Animated grid background */}
        {!isViolation && (
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: `
              linear-gradient(rgba(232,89,60,0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(232,89,60,0.03) 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px',
            animation: 'grid-scroll 20s linear infinite',
          }} />
        )}

        {/* Waveform */}
        {!isViolation && (
          <div style={{ position: 'relative', zIndex: 1 }}>
            <Waveform />
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
              animation:    'alert-pulse 1.5s ease-in-out infinite',
            }}>
              VIOLATION DETECTED
            </div>
            <div style={{ fontSize: '10px', color: 'rgba(239,68,68,0.6)', fontFamily: 'var(--font-mono)' }}>
              Auto-takedown in 30s
            </div>
          </div>
        )}

        {/* LIVE badge + viewers */}
        {!isViolation && (
          <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', alignItems: 'center', gap: '8px', zIndex: 2 }}>
            <span style={{
              padding: '3px 10px', background: 'var(--color-orange)',
              borderRadius: '4px', fontSize: '10px', fontWeight: 700,
              letterSpacing: '0.06em', color: '#fff',
              display: 'flex', alignItems: 'center', gap: '5px',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', animation: 'live-dot 1.5s ease-in-out infinite' }} />
              LIVE
            </span>
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.85)', fontFamily: 'var(--font-mono)', background: 'rgba(0,0,0,0.4)', padding: '2px 8px', borderRadius: '4px' }}>
              {fluctuatingViewers.toLocaleString()} watching
            </span>
          </div>
        )}

        {/* Duration badge */}
        <div style={{
          position: 'absolute', bottom: '10px', right: '10px',
          background: 'rgba(0,0,0,0.6)', padding: '3px 8px', borderRadius: '4px',
          fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.7)',
        }}>
          {duration}
        </div>

        {/* Three-dot menu */}
        <button type="button" style={{
          position: 'absolute', top: '8px', right: '8px',
          background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '6px',
          color: '#fff', cursor: 'pointer', padding: '4px 8px', fontSize: '14px',
        }} aria-label="More options">⋮</button>
      </div>

      {/* Card body */}
      <div style={{ padding: '14px 16px' }}>
        <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {program.title}
        </div>
        {isViolation ? (
          <div style={{ fontSize: '11px', color: 'var(--color-red)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            Automatic Takedown Pending
          </div>
        ) : (
          <div style={{ fontSize: '11px', color: 'var(--color-muted)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)' }} />
            {channel} · {duration}
          </div>
        )}

        {/* Action buttons */}
        {isViolation ? (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" style={{
              ...actionBtn,
              borderColor: 'rgba(239,68,68,0.4)', color: '#EF4444', background: 'rgba(239,68,68,0.08)',
              flex: 1, justifyContent: 'center',
            }}>
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" style={{ marginRight: '4px' }}>
                <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
              </svg>
              Terminate
            </button>
            <button type="button" style={{ ...actionBtn, flex: 1, justifyContent: 'center' }} aria-label="Review content">
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" style={{ marginRight: '4px' }}>
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
              </svg>
              Review
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '6px' }}>
            <button type="button" style={{ ...actionBtn, fontSize: '11px', padding: '6px 10px', flex: 1, justifyContent: 'center' }}>
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" style={{ marginRight: '4px' }}>
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
              Mod
            </button>
            <button type="button" style={{ ...actionBtn, fontSize: '11px', padding: '6px 10px', flex: 1, justifyContent: 'center' }}>
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" style={{ marginRight: '4px' }}>
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
              </svg>
              Chat
            </button>
            <button type="button" style={{ ...actionBtn, fontSize: '11px', padding: '6px 10px', flex: 1, justifyContent: 'center' }}>
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" style={{ marginRight: '4px' }}>
                <line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/>
              </svg>
              Data
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Activity feed item ────────────────────────────────────────────────────────
interface EventItem {
  id:       string;
  time:     string;
  type:     'join' | 'leave' | 'alert' | 'mod' | 'system';
  message:  string;
  channel?: string;
}

const DEMO_EVENTS: EventItem[] = [
  { id: '1', time: 'now',     type: 'system', message: 'Stream quality upgraded to 4K', channel: '@NexusGaming' },
  { id: '2', time: '12s ago', type: 'join',   message: 'Viewer spike detected (+340 in 10s)', channel: '@FerrisCode' },
  { id: '3', time: '28s ago', type: 'alert',  message: 'Content policy flag: inappropriate language', channel: 'Restricted Stream' },
  { id: '4', time: '45s ago', type: 'mod',    message: 'Auto-moderation: 2 comments filtered', channel: '@NexusGaming' },
  { id: '5', time: '1m ago',  type: 'join',   message: 'New viewer from Nairobi, KE', channel: '@FerrisCode' },
  { id: '6', time: '2m ago',  type: 'system', message: 'CDN node Nairobi latency: 18ms', channel: 'Global' },
];

function EventIcon({ type }: { type: EventItem['type'] }) {
  const colors: Record<string, string> = { join: 'var(--green)', leave: 'var(--text-tertiary)', alert: 'var(--red)', mod: 'var(--amber)', system: 'var(--color-orange)' };
  const icons: Record<string, ReactNode> = {
    join:   <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>,
    leave:  <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="18" y1="8" x2="23" y2="13"/><line x1="23" y1="8" x2="18" y2="13"/></svg>,
    alert:  <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
    mod:    <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    system: <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
  };
  return <span style={{ color: colors[type], display: 'flex', alignItems: 'center' }}>{icons[type]}</span>;
}

function ActivityEvent({ event, isNew }: { event: EventItem; isNew?: boolean }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '10px',
      padding: '8px 12px',
      background: isNew ? 'rgba(232,89,60,0.04)' : 'transparent',
      borderRadius: '6px',
      animation: isNew ? 'event-in 0.3s ease-out' : undefined,
      transition: 'background 0.2s',
    }}>
      <EventIcon type={event.type} />
      <span style={{ fontSize: '11px', color: 'var(--text-secondary)', flex: 1 }}>{event.message}</span>
      {event.channel && (
        <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>{event.channel}</span>
      )}
      <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>{event.time}</span>
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
  const [events, setEvents] = useState(DEMO_EVENTS);

  // Simulate new events arriving
  useEffect(() => {
    const messages = [
      { type: 'join' as const,   message: 'Viewer joined from Mombasa, KE', channel: '@NexusGaming' },
      { type: 'mod' as const,    message: 'Spam message blocked by auto-mod', channel: '@FerrisCode' },
      { type: 'system' as const, message: 'Bitrate adjusted to 6.2 Mbps', channel: '@NexusGaming' },
      { type: 'join' as const,   message: 'Viewer spike (+120 in 5s)', channel: 'Restricted Stream' },
      { type: 'alert' as const,  message: 'Potential copyright match detected', channel: '@FerrisCode' },
      { type: 'mod' as const,    message: 'User timeout: 5 min', channel: '@NexusGaming' },
      { type: 'system' as const, message: '健康 check passed, all nodes nominal', channel: 'Global' },
    ];
    const id = setInterval(() => {
      const msg = messages[Math.floor(Math.random() * messages.length)];
      setEvents(prev => [{ ...msg, id: Date.now().toString(), time: 'now' }, ...prev.slice(0, 7)]);
    }, 4000);
    return () => clearInterval(id);
  }, []);

  const streams = useMemo(() => {
    const mapped = livePrograms.slice(0, 3).map((p, i) => ({
      program:  p,
      state:    i === 2 ? 'live-violation' as const : 'live' as const,
      viewers:  i === 0 ? 4800 : 1200,
      channel:  i === 0 ? '@NexusGaming' : '@FerrisCode',
      duration: i === 0 ? '02:44:12' : '01:12:05',
    }));

    while (mapped.length < 3) {
      const idx = mapped.length;
      mapped.push({
        program:  {
          id: `demo-${idx}`, title: idx === 2 ? 'Restricted: Live Stream #9902' : `Demo Stream #${idx + 1}`,
          startTime: new Date().toISOString(), endTime: new Date().toISOString(),
          status: 'live', presenterId: null, createdAt: new Date().toISOString(),
        },
        state:    idx === 2 ? 'live-violation' : 'live',
        viewers:  idx === 0 ? 4800 : 1200,
        channel:  idx === 0 ? '@NexusGaming' : '@FerrisCode',
        duration: idx === 0 ? '02:44:12' : '01:12:05',
        index:    idx,
      });
    }

    return mapped;
  }, [livePrograms]);

  const totalViewers = useFluctulate(14200, 300, 3000);
  const alertCount = useFluctuate(3, 1, 5000);

  return (
    <DashboardLayout
      activeItem="live"
      headerRight={
        <>
          <span style={{
            padding:      '3px 10px',
            background:   'rgba(232,89,60,0.15)',
            border:       '1px solid rgba(232,89,60,0.4)',
            borderRadius: '4px',
            fontSize:     '10px',
            fontWeight:   700,
            color:        'var(--color-orange)',
            letterSpacing: '0.08em',
            display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-orange)', animation: 'live-dot 1.5s ease-in-out infinite' }} />
            LIVE
          </span>
          <button type="button" style={{
            background: 'none', border: 'none', color: 'var(--color-muted)',
            cursor: 'pointer', position: 'relative',
          }} aria-label="Notifications">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/>
            </svg>
            {alertCount > 0 && (
              <span style={{
                position: 'absolute', top: -2, right: -2,
                width: 14, height: 14, borderRadius: '50%',
                background: 'var(--color-red)', color: '#fff',
                fontSize: '8px', fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{alertCount}</span>
            )}
          </button>
        </>
      }
    >
      {/* Stat cards row */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '28px' }}>
        <StatCard icon={<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>} label="Total Concurrent" value={`${(totalViewers / 1000).toFixed(1)}K`} sub="+12% from last hour" />
        <StatCard icon={<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>} label="Alert Flags"      value={String(alertCount).padStart(2, '0')}    sub="Critical intervention required" alert pulse />
        <StatCard icon={<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>} label="Node Latency"     value="24ms"  sub="Optimal performance" />
        <StatCard icon={<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>} label="Bandwidth"        value="1.2Tb/s" sub="Peak utilization at 64%" />
      </div>

      {/* Two-column layout: streams + activity */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '16px' }}>
        {/* Streams column */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 600, letterSpacing: '0.02em', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="18" height="18" fill="none" stroke="var(--color-orange)" strokeWidth="1.5" viewBox="0 0 24 24">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
              Live Streams
            </span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button type="button" style={{
                padding: '6px 12px', background: 'rgba(232,89,60,0.1)', border: '1px solid rgba(232,89,60,0.3)',
                borderRadius: '6px', color: 'var(--color-orange)', fontSize: '11px', cursor: 'pointer',
                fontFamily: 'var(--font-body)', fontWeight: 500,
              }}>
                All Channels
              </button>
              <button type="button" style={{
                padding: '6px 12px', background: 'transparent', border: '1px solid var(--color-border)',
                borderRadius: '6px', color: 'var(--color-muted)', fontSize: '11px', cursor: 'pointer',
                fontFamily: 'var(--font-body)',
              }}>
                Filters
              </button>
            </div>
          </div>

          {isLoading ? (
            <div style={{ display: 'flex', gap: '14px' }}>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} style={{ flex: 1, background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: '12px', overflow: 'hidden' }}>
                  <div className="skeleton" style={{ height: '160px' }} />
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
                <StreamCard key={i} {...s} index={i} />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!isLoading && livePrograms.length === 0 && (
            <div style={{
              marginTop: '12px', padding: '12px 16px',
              background: 'rgba(232,89,60,0.06)', border: '1px solid rgba(232,89,60,0.2)',
              borderRadius: '8px', fontSize: '12px', color: 'var(--color-muted)',
            }}>
              No live programs found, showing demo cards. Create a program via <code style={{ fontFamily: 'var(--font-mono)' }}>POST /api/v1/programs</code> to see real data.
            </div>
          )}
        </div>

        {/* Activity feed column */}
        <div style={{
          background: 'var(--color-bg-card)', border: '1px solid var(--color-border)',
          borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column',
        }}>
          <div style={{
            padding: '14px 16px', borderBottom: '1px solid var(--color-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg width="14" height="14" fill="none" stroke="var(--color-orange)" strokeWidth="1.5" viewBox="0 0 24 24">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
              Activity
            </span>
            <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>LIVE</span>
          </div>
          <div style={{ flex: 1, overflow: 'auto', padding: '8px' }}>
            {events.map((e, i) => (
              <ActivityEvent key={e.id} event={e} isNew={i === 0} />
            ))}
          </div>
        </div>
      </div>
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
  display:      'flex',
  alignItems:   'center',
};
